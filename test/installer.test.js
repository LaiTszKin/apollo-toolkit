const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const { expandUserPath, installLinks, normalizeModes, syncToolkitHome } = require('../lib/installer');
const { buildBanner, buildWelcomeScreen, run } = require('../lib/cli');
const { checkForPackageUpdate, compareVersions } = require('../lib/updater');

async function createFixtureSource(rootDir) {
  await fs.mkdir(path.join(rootDir, 'alpha-skill'), { recursive: true });
  await fs.writeFile(path.join(rootDir, 'alpha-skill', 'SKILL.md'), '# alpha\n', 'utf8');
  await fs.mkdir(path.join(rootDir, 'beta-skill'), { recursive: true });
  await fs.writeFile(path.join(rootDir, 'beta-skill', 'SKILL.md'), '# beta\n', 'utf8');
  await fs.mkdir(path.join(rootDir, 'scripts'), { recursive: true });
  await fs.writeFile(path.join(rootDir, 'scripts', 'install_skills.sh'), '#!/usr/bin/env bash\n', 'utf8');
  await fs.writeFile(path.join(rootDir, 'README.md'), '# Apollo Toolkit\n', 'utf8');
  await fs.writeFile(path.join(rootDir, 'CHANGELOG.md'), '# Changelog\n', 'utf8');
  await fs.writeFile(path.join(rootDir, 'LICENSE'), 'MIT\n', 'utf8');
  await fs.writeFile(path.join(rootDir, 'AGENTS.md'), '# Agents\n', 'utf8');
  await fs.writeFile(
    path.join(rootDir, 'package.json'),
    JSON.stringify({ name: '@laitszkin/apollo-toolkit', version: '2.0.0' }, null, 2),
    'utf8',
  );
  await fs.mkdir(path.join(rootDir, '.github'), { recursive: true });
  await fs.writeFile(path.join(rootDir, '.github', 'ignored.txt'), 'nope\n', 'utf8');
}

function createMemoryStream() {
  let data = '';
  return {
    isTTY: false,
    write(chunk) {
      data += chunk;
      return true;
    },
    toString() {
      return data;
    },
  };
}

test('normalizeModes expands all and removes duplicates', () => {
  assert.deepEqual(normalizeModes(['codex', 'all', 'trae']), ['codex', 'openclaw', 'trae', 'agents', 'claude-code']);
  assert.throws(() => normalizeModes(['unknown']), /Invalid mode/);
});

test('expandUserPath resolves tilde against HOME', () => {
  assert.equal(
    expandUserPath('~/.codex/skills', { HOME: '/tmp/example-home' }),
    path.join('/tmp/example-home', '.codex', 'skills'),
  );
  assert.equal(expandUserPath('/tmp/already-absolute', { HOME: '/tmp/example-home' }), '/tmp/already-absolute');
});

test('buildBanner shows Apollo Toolkit branding', () => {
  assert.match(buildBanner({ version: '2.0.0', colorEnabled: false }), /Apollo Toolkit/);
});

test('buildWelcomeScreen shows branded setup overview', () => {
  const output = buildWelcomeScreen({ version: '2.0.0', colorEnabled: false, stage: 4 });
  assert.match(output, /This setup will configure:/);
  assert.match(output, /Quick start after setup:/);
  assert.match(output, /Claude Code\s+~\/\.claude\/skills/);
  assert.match(output, /Launching target selector/);
});

test('compareVersions orders semantic versions correctly', () => {
  assert.equal(compareVersions('2.12.5', '2.12.4') > 0, true);
  assert.equal(compareVersions('2.12.5', '2.12.5'), 0);
  assert.equal(compareVersions('2.12.4', '2.12.5') < 0, true);
  assert.equal(compareVersions('2.12.5-beta.1', '2.12.5') < 0, true);
  assert.equal(compareVersions('v2.12.6', '2.12.5') > 0, true);
});

test('checkForPackageUpdate installs latest version after user confirmation', async () => {
  const stdout = createMemoryStream();
  const stderr = createMemoryStream();
  const calls = [];

  const result = await checkForPackageUpdate({
    packageName: '@laitszkin/apollo-toolkit',
    currentVersion: '2.12.5',
    stdin: { isTTY: true },
    stdout: { ...stdout, isTTY: true },
    stderr,
    exec: async (command, args) => {
      calls.push([command, ...args]);
      if (args[0] === 'view') {
        return { stdout: '"2.13.0"\n', stderr: '' };
      }
      return { stdout: '', stderr: '' };
    },
    confirmUpdate: async () => true,
  });

  assert.equal(result.updated, true);
  assert.deepEqual(calls, [
    ['npm', 'view', '@laitszkin/apollo-toolkit', 'version', '--json'],
    ['npm', 'install', '-g', '@laitszkin/apollo-toolkit@latest'],
  ]);
  assert.match(stdout.toString(), /Updating @laitszkin\/apollo-toolkit to 2.13.0/);
});

test('checkForPackageUpdate skips install when the user declines', async () => {
  const stdout = createMemoryStream();
  const calls = [];

  const result = await checkForPackageUpdate({
    packageName: '@laitszkin/apollo-toolkit',
    currentVersion: '2.12.5',
    stdin: { isTTY: true },
    stdout: { ...stdout, isTTY: true },
    stderr: createMemoryStream(),
    exec: async (command, args) => {
      calls.push([command, ...args]);
      return { stdout: '"2.13.0"\n', stderr: '' };
    },
    confirmUpdate: async () => false,
  });

  assert.equal(result.updated, false);
  assert.deepEqual(calls, [
    ['npm', 'view', '@laitszkin/apollo-toolkit', 'version', '--json'],
  ]);
  assert.match(stdout.toString(), /Continuing with @laitszkin\/apollo-toolkit 2.12.5/);
});

test('syncToolkitHome copies managed toolkit contents only', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'apollo-toolkit-source-'));
  const sourceRoot = path.join(tempDir, 'source');
  const toolkitHome = path.join(tempDir, 'home', '.apollo-toolkit');
  await fs.mkdir(sourceRoot, { recursive: true });
  await createFixtureSource(sourceRoot);

  await syncToolkitHome({ sourceRoot, toolkitHome, version: '2.0.0' });

  const copied = await fs.readdir(toolkitHome);
  assert.ok(copied.includes('alpha-skill'));
  assert.ok(copied.includes('beta-skill'));
  assert.ok(copied.includes('scripts'));
  assert.ok(copied.includes('.apollo-toolkit-install.json'));
  assert.ok(!copied.includes('.github'));
});

test('syncToolkitHome includes codex-specific skills when codex mode is selected', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'apollo-toolkit-codex-home-'));
  const sourceRoot = path.join(tempDir, 'source');
  const toolkitHome = path.join(tempDir, 'home', '.apollo-toolkit');
  await fs.mkdir(sourceRoot, { recursive: true });
  await createFixtureSource(sourceRoot);
  await fs.mkdir(path.join(sourceRoot, 'codex', 'codex-only-skill'), { recursive: true });
  await fs.writeFile(path.join(sourceRoot, 'codex', 'codex-only-skill', 'SKILL.md'), '# codex-only\n', 'utf8');

  await syncToolkitHome({ sourceRoot, toolkitHome, version: '2.0.0', modes: ['codex'] });

  assert.equal(
    (await fs.lstat(path.join(toolkitHome, 'codex', 'codex-only-skill'))).isDirectory(),
    true,
  );
});

test('run installs toolkit home and copies skills into selected targets', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'apollo-toolkit-run-'));
  const sourceRoot = path.join(tempDir, 'source');
  const homeDir = path.join(tempDir, 'user-home');
  const toolkitHome = path.join(homeDir, '.apollo-toolkit');
  const stdout = createMemoryStream();
  const stderr = createMemoryStream();

  await fs.mkdir(sourceRoot, { recursive: true });
  await createFixtureSource(sourceRoot);
  await fs.mkdir(path.join(sourceRoot, 'codex', 'codex-only-skill'), { recursive: true });
  await fs.writeFile(path.join(sourceRoot, 'codex', 'codex-only-skill', 'SKILL.md'), '# codex-only\n', 'utf8');
  await fs.mkdir(path.join(homeDir, '.openclaw', 'workspace1'), { recursive: true });

  const exitCode = await run(['codex', 'openclaw'], {
    sourceRoot,
    env: {
      HOME: homeDir,
      APOLLO_TOOLKIT_HOME: toolkitHome,
      APOLLO_TOOLKIT_SKIP_UPDATE_CHECK: '1',
    },
    stdin: { isTTY: false },
    stdout,
    stderr,
  });

  assert.equal(exitCode, 0, stderr.toString());
  assert.match(stdout.toString(), /Installation complete/);

  const codexSkill = path.join(homeDir, '.codex', 'skills', 'alpha-skill');
  const codexOnlySkill = path.join(homeDir, '.codex', 'skills', 'codex-only-skill');
  const openclawSkill = path.join(homeDir, '.openclaw', 'workspace1', 'skills', 'alpha-skill');
  const expectedSource = await fs.realpath(path.join(toolkitHome, 'alpha-skill'));

  assert.equal((await fs.lstat(codexSkill)).isDirectory(), true);
  assert.equal((await fs.lstat(codexOnlySkill)).isDirectory(), true);
  assert.equal((await fs.lstat(openclawSkill)).isDirectory(), true);
  assert.notEqual(await fs.realpath(codexSkill), expectedSource);
  assert.equal(await fs.readFile(path.join(codexSkill, 'SKILL.md'), 'utf8'), '# alpha\n');
  assert.equal(await fs.readFile(path.join(codexOnlySkill, 'SKILL.md'), 'utf8'), '# codex-only\n');
});

test('installLinks resolves tilde-prefixed target overrides from environment', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'apollo-toolkit-tilde-target-'));
  const homeDir = path.join(tempDir, 'user-home');
  const toolkitHome = path.join(tempDir, '.apollo-toolkit');
  const sourceSkill = path.join(toolkitHome, 'alpha-skill');

  await fs.mkdir(sourceSkill, { recursive: true });
  await fs.writeFile(path.join(sourceSkill, 'SKILL.md'), '# alpha\n', 'utf8');

  await installLinks({
    toolkitHome,
    modes: ['codex'],
    previousSkillNames: ['alpha-skill'],
    env: {
      HOME: homeDir,
      CODEX_SKILLS_DIR: '~/.custom-codex-skills',
    },
  });

  assert.equal(
    (await fs.lstat(path.join(homeDir, '.custom-codex-skills', 'alpha-skill'))).isDirectory(),
    true,
  );
});

test('installLinks removes stale skills that disappeared from the new version', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'apollo-toolkit-stale-'));
  const toolkitHome = path.join(tempDir, '.apollo-toolkit');
  const codexRoot = path.join(tempDir, 'codex-skills');

  await fs.mkdir(path.join(toolkitHome, 'alpha-skill'), { recursive: true });
  await fs.writeFile(path.join(toolkitHome, 'alpha-skill', 'SKILL.md'), '# alpha\n', 'utf8');
  await fs.mkdir(path.join(codexRoot, 'old-skill'), { recursive: true });
  await fs.writeFile(path.join(codexRoot, 'old-skill', 'stale.txt'), 'stale\n', 'utf8');

  await installLinks({
    toolkitHome,
    modes: ['codex'],
    previousSkillNames: ['alpha-skill', 'old-skill'],
    env: {
      HOME: tempDir,
      CODEX_SKILLS_DIR: codexRoot,
    },
  });

  await assert.rejects(fs.access(path.join(codexRoot, 'old-skill')));
  assert.equal((await fs.lstat(path.join(codexRoot, 'alpha-skill'))).isDirectory(), true);
});

test('installLinks replaces previously installed symlinks with copied skill directories', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'apollo-toolkit-legacy-link-'));
  const toolkitHome = path.join(tempDir, '.apollo-toolkit');
  const codexRoot = path.join(tempDir, 'codex-skills');
  const sourceSkill = path.join(toolkitHome, 'alpha-skill');
  const targetSkill = path.join(codexRoot, 'alpha-skill');

  await fs.mkdir(sourceSkill, { recursive: true });
  await fs.writeFile(path.join(sourceSkill, 'SKILL.md'), '# alpha\n', 'utf8');
  await fs.writeFile(path.join(sourceSkill, 'notes.txt'), 'copied\n', 'utf8');
  await fs.mkdir(codexRoot, { recursive: true });
  await fs.symlink(sourceSkill, targetSkill, process.platform === 'win32' ? 'junction' : 'dir');

  await installLinks({
    toolkitHome,
    modes: ['codex'],
    previousSkillNames: ['alpha-skill'],
    env: {
      HOME: tempDir,
      CODEX_SKILLS_DIR: codexRoot,
    },
  });

  assert.equal((await fs.lstat(targetSkill)).isDirectory(), true);
  assert.notEqual(await fs.realpath(targetSkill), await fs.realpath(sourceSkill));
  assert.equal(await fs.readFile(path.join(targetSkill, 'notes.txt'), 'utf8'), 'copied\n');
});

test('run installs claude-code target when requested', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'apollo-toolkit-claude-code-run-'));
  const sourceRoot = path.join(tempDir, 'source');
  const homeDir = path.join(tempDir, 'user-home');
  const toolkitHome = path.join(homeDir, '.apollo-toolkit');
  const stdout = createMemoryStream();
  const stderr = createMemoryStream();

  await fs.mkdir(sourceRoot, { recursive: true });
  await createFixtureSource(sourceRoot);

  const exitCode = await run(['claude-code'], {
    sourceRoot,
    env: {
      HOME: homeDir,
      APOLLO_TOOLKIT_HOME: toolkitHome,
      APOLLO_TOOLKIT_SKIP_UPDATE_CHECK: '1',
    },
    stdin: { isTTY: false },
    stdout,
    stderr,
  });

  assert.equal(exitCode, 0, stderr.toString());
  assert.match(stdout.toString(), /Claude Code/);
  assert.equal(
    (await fs.lstat(path.join(homeDir, '.claude', 'skills', 'alpha-skill'))).isDirectory(),
    true,
  );
});
