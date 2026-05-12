const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const {
  expandUserPath,
  installLinks,
  listAllKnownSkillNames,
  normalizeModes,
  readManifest,
  syncToolkitHome,
  uninstallSkills,
  writeManifest,
} = require('../lib/installer');
const {
  buildBanner,
  buildWelcomeScreen,
  buildInstallHelpText,
  buildUninstallHelpText,
  parseArguments,
  promptForModes,
  promptForUninstallModes,
  run,
} = require('../lib/cli');
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
  assert.match(output, /Agents\s+~\/\.agents\/skills/);
  assert.match(output, /Claude Code\s+~\/\.claude\/skills/);
  assert.match(output, /Launching target selector/);
});

test('install and uninstall help pages end with examples', () => {
  const installHelp = buildInstallHelpText({ version: '2.0.0', colorEnabled: false });
  const uninstallHelp = buildUninstallHelpText({ version: '2.0.0', colorEnabled: false });
  assert.match(installHelp, /Use this when:/);
  assert.match(installHelp, /Examples:/);
  assert.match(uninstallHelp, /Use this when:/);
  assert.match(uninstallHelp, /Examples:/);
});

test('promptForModes TTY error lists every supported target', async () => {
  await assert.rejects(
    promptForModes({
      stdin: { isTTY: false },
      stdout: { isTTY: false },
      version: '2.0.0',
      env: {},
    }),
    /`codex`, `openclaw`, `trae`, `agents`, `claude-code`, or `all`/,
  );
});

test('promptForUninstallModes TTY error lists every supported target', async () => {
  await assert.rejects(
    promptForUninstallModes({
      stdin: { isTTY: false },
      stdout: { isTTY: false },
      version: '2.0.0',
      env: {},
    }),
    /`codex`, `openclaw`, `trae`, `agents`, `claude-code`, or `all`/,
  );
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

  const exitCode = await run(['codex', 'openclaw', '--copy'], {
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
  const openclawCodexOnlySkill = path.join(homeDir, '.openclaw', 'workspace1', 'skills', 'codex-only-skill');
  const expectedSource = await fs.realpath(path.join(toolkitHome, 'alpha-skill'));

  assert.equal((await fs.lstat(codexSkill)).isDirectory(), true);
  assert.equal((await fs.lstat(codexOnlySkill)).isDirectory(), true);
  assert.equal((await fs.lstat(openclawSkill)).isDirectory(), true);
  assert.notEqual(await fs.realpath(codexSkill), expectedSource);
  assert.equal(await fs.readFile(path.join(codexSkill, 'SKILL.md'), 'utf8'), '# alpha\n');
  assert.equal(await fs.readFile(path.join(codexOnlySkill, 'SKILL.md'), 'utf8'), '# codex-only\n');
  await assert.rejects(fs.access(openclawCodexOnlySkill));
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

test('installLinks ignores unsafe historical manifest names when removing stale skills', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'apollo-toolkit-stale-unsafe-'));
  const homeDir = path.join(tempDir, 'user-home');
  const toolkitHome = path.join(tempDir, '.apollo-toolkit');
  const codexRoot = path.join(homeDir, '.codex', 'skills');
  const outsideSkill = path.join(homeDir, '.codex', 'outside-skill');

  await fs.mkdir(path.join(toolkitHome, 'alpha-skill'), { recursive: true });
  await fs.writeFile(path.join(toolkitHome, 'alpha-skill', 'SKILL.md'), '# alpha\n', 'utf8');
  await fs.mkdir(codexRoot, { recursive: true });
  await fs.mkdir(outsideSkill, { recursive: true });
  await fs.writeFile(
    path.join(codexRoot, '.apollo-toolkit-manifest.json'),
    `${JSON.stringify({
      version: '1.0.0',
      linkMode: 'copy',
      skills: ['alpha-skill'],
      historicalSkills: ['../outside-skill'],
    }, null, 2)}\n`,
    'utf8',
  );

  await installLinks({
    toolkitHome,
    modes: ['codex'],
    previousSkillNames: [],
    env: {
      HOME: homeDir,
    },
  });

  assert.equal((await fs.lstat(outsideSkill)).isDirectory(), true);
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

  const exitCode = await run(['claude-code', '--copy'], {
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

// ---- Manifest tests ----

test('writeManifest and readManifest persist and restore skill tracking data', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'apollo-toolkit-manifest-'));
  const targetRoot = path.join(tempDir, 'skills');

  await writeManifest(targetRoot, {
    version: '3.0.0',
    linkMode: 'symlink',
    skills: ['alpha-skill', 'beta-skill'],
    previousSkills: ['old-skill'],
  });

  const manifest = await readManifest(targetRoot);
  assert.equal(manifest.version, '3.0.0');
  assert.equal(manifest.linkMode, 'symlink');
  assert.deepEqual(manifest.skills, ['alpha-skill', 'beta-skill']);
  assert.deepEqual(manifest.historicalSkills, ['alpha-skill', 'beta-skill', 'old-skill']);
  assert.ok(manifest.installedAt);
});

test('writeManifest carries forward historical skills from existing manifest', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'apollo-toolkit-manifest-merge-'));
  const targetRoot = path.join(tempDir, 'skills');

  await writeManifest(targetRoot, {
    version: '1.0.0',
    linkMode: 'copy',
    skills: ['skill-a'],
    previousSkills: [],
  });

  await writeManifest(targetRoot, {
    version: '2.0.0',
    linkMode: 'symlink',
    skills: ['skill-b'],
    previousSkills: ['skill-a'],
  });

  const manifest = await readManifest(targetRoot);
  assert.deepEqual(manifest.skills, ['skill-b']);
  assert.deepEqual(manifest.historicalSkills, ['skill-a', 'skill-b']);
});

test('readManifest returns null for missing manifest', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'apollo-toolkit-nomanifest-'));
  const result = await readManifest(path.join(tempDir, 'nonexistent'));
  assert.equal(result, null);
});

// ---- Uninstall tests ----

test('uninstallSkills removes skills and manifests from all targets', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'apollo-toolkit-uninstall-'));
  const homeDir = path.join(tempDir, 'user-home');
  const codexRoot = path.join(homeDir, '.codex', 'skills');
  const traeRoot = path.join(homeDir, '.trae', 'skills');

  await fs.mkdir(codexRoot, { recursive: true });
  await fs.mkdir(traeRoot, { recursive: true });

  // Create skill dirs and manifests
  await fs.mkdir(path.join(codexRoot, 'alpha-skill'), { recursive: true });
  await fs.writeFile(path.join(codexRoot, 'alpha-skill', 'dummy.txt'), 'data', 'utf8');
  await fs.mkdir(path.join(codexRoot, 'beta-skill'), { recursive: true });

  await fs.mkdir(path.join(traeRoot, 'alpha-skill'), { recursive: true });

  await writeManifest(codexRoot, {
    version: '1.0.0',
    linkMode: 'copy',
    skills: ['alpha-skill', 'beta-skill'],
    previousSkills: [],
  });
  await writeManifest(traeRoot, {
    version: '1.0.0',
    linkMode: 'copy',
    skills: ['alpha-skill'],
    previousSkills: [],
  });

  const results = await uninstallSkills({
    env: { HOME: homeDir },
    modes: ['codex', 'trae'],
  });

  assert.equal(results.length, 2);

  const codexResult = results.find((r) => r.target === 'Codex');
  assert.deepEqual(codexResult.removedSkills.sort(), ['alpha-skill', 'beta-skill']);
  const traeResult = results.find((r) => r.target === 'Trae');
  assert.deepEqual(traeResult.removedSkills, ['alpha-skill']);

  // Verify skills removed
  await assert.rejects(fs.access(path.join(codexRoot, 'alpha-skill')));
  await assert.rejects(fs.access(path.join(traeRoot, 'alpha-skill')));

  // Verify manifests removed
  await assert.rejects(fs.access(path.join(codexRoot, '.apollo-toolkit-manifest.json')));
});

test('uninstallSkills default uninstall skips missing OpenClaw and removes other manifests', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'apollo-toolkit-uninstall-default-'));
  const homeDir = path.join(tempDir, 'user-home');
  const codexRoot = path.join(homeDir, '.codex', 'skills');
  const agentsRoot = path.join(homeDir, '.agents', 'skills');

  await fs.mkdir(path.join(codexRoot, 'alpha-skill'), { recursive: true });
  await fs.mkdir(path.join(agentsRoot, 'beta-skill'), { recursive: true });

  await writeManifest(codexRoot, {
    version: '1.0.0',
    linkMode: 'copy',
    skills: ['alpha-skill'],
    previousSkills: [],
  });
  await writeManifest(agentsRoot, {
    version: '1.0.0',
    linkMode: 'copy',
    skills: ['beta-skill'],
    previousSkills: [],
  });

  const results = await uninstallSkills({
    env: { HOME: homeDir },
  });

  assert.deepEqual(results.map((result) => result.target).sort(), ['Agents', 'Codex']);
  await assert.rejects(fs.access(path.join(codexRoot, 'alpha-skill')));
  await assert.rejects(fs.access(path.join(agentsRoot, 'beta-skill')));
  await assert.rejects(fs.access(path.join(codexRoot, '.apollo-toolkit-manifest.json')));
  await assert.rejects(fs.access(path.join(agentsRoot, '.apollo-toolkit-manifest.json')));
});

test('uninstallSkills removes historical manifest skills', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'apollo-toolkit-uninstall-history-'));
  const homeDir = path.join(tempDir, 'user-home');
  const codexRoot = path.join(homeDir, '.codex', 'skills');

  await fs.mkdir(path.join(codexRoot, 'alpha-skill'), { recursive: true });
  await fs.mkdir(path.join(codexRoot, 'old-skill'), { recursive: true });
  await writeManifest(codexRoot, {
    version: '1.0.0',
    linkMode: 'copy',
    skills: ['alpha-skill'],
    previousSkills: ['old-skill'],
  });

  const results = await uninstallSkills({
    env: { HOME: homeDir },
    modes: ['codex'],
  });

  assert.deepEqual(results[0].removedSkills, ['alpha-skill', 'old-skill']);
  await assert.rejects(fs.access(path.join(codexRoot, 'alpha-skill')));
  await assert.rejects(fs.access(path.join(codexRoot, 'old-skill')));
});

test('uninstallSkills ignores unsafe manifest skill names', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'apollo-toolkit-uninstall-unsafe-'));
  const homeDir = path.join(tempDir, 'user-home');
  const codexRoot = path.join(homeDir, '.codex', 'skills');
  const outsideSkill = path.join(homeDir, '.codex', 'outside-skill');

  await fs.mkdir(path.join(codexRoot, 'alpha-skill'), { recursive: true });
  await fs.mkdir(outsideSkill, { recursive: true });
  await fs.writeFile(
    path.join(codexRoot, '.apollo-toolkit-manifest.json'),
    `${JSON.stringify({
      version: '1.0.0',
      linkMode: 'copy',
      skills: ['alpha-skill', '../outside-skill', '/tmp/not-a-skill'],
      historicalSkills: ['..\\windows-outside'],
    }, null, 2)}\n`,
    'utf8',
  );

  const results = await uninstallSkills({
    env: { HOME: homeDir },
    modes: ['codex'],
  });

  assert.deepEqual(results[0].removedSkills, ['alpha-skill']);
  await assert.rejects(fs.access(path.join(codexRoot, 'alpha-skill')));
  assert.equal((await fs.lstat(outsideSkill)).isDirectory(), true);
});

test('run uninstall supports --yes with default all-target cleanup', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'apollo-toolkit-run-uninstall-'));
  const sourceRoot = path.join(tempDir, 'source');
  const homeDir = path.join(tempDir, 'user-home');
  const toolkitHome = path.join(homeDir, '.apollo-toolkit');
  const codexRoot = path.join(homeDir, '.codex', 'skills');
  const stdout = createMemoryStream();
  const stderr = createMemoryStream();

  await fs.mkdir(sourceRoot, { recursive: true });
  await createFixtureSource(sourceRoot);
  await fs.mkdir(path.join(toolkitHome, 'alpha-skill'), { recursive: true });
  await fs.writeFile(path.join(toolkitHome, 'alpha-skill', 'SKILL.md'), '# alpha\n', 'utf8');
  await fs.mkdir(path.join(codexRoot, 'alpha-skill'), { recursive: true });
  await writeManifest(codexRoot, {
    version: '1.0.0',
    linkMode: 'copy',
    skills: ['alpha-skill'],
    previousSkills: [],
  });

  const exitCode = await run(['uninstall', '--yes'], {
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
  assert.match(stdout.toString(), /Uninstall complete/);
  await assert.rejects(fs.access(path.join(codexRoot, 'alpha-skill')));
});

test('uninstallSkills skips targets without manifests', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'apollo-toolkit-uninstall-skip-'));
  const homeDir = path.join(tempDir, 'user-home');
  const codexRoot = path.join(homeDir, '.codex', 'skills');

  await fs.mkdir(codexRoot, { recursive: true });

  const results = await uninstallSkills({
    env: { HOME: homeDir },
    modes: ['codex'],
  });

  assert.equal(results.length, 0);
});

// ---- Symlink installation tests ----

test('installLinks in symlink mode creates symlinks instead of copies', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'apollo-toolkit-symlink-'));
  const toolkitHome = path.join(tempDir, '.apollo-toolkit');
  const codexRoot = path.join(tempDir, 'codex-skills');
  const sourceSkill = path.join(toolkitHome, 'alpha-skill');

  await fs.mkdir(sourceSkill, { recursive: true });
  await fs.writeFile(path.join(sourceSkill, 'SKILL.md'), '# alpha\n', 'utf8');

  await installLinks({
    toolkitHome,
    modes: ['codex'],
    previousSkillNames: ['alpha-skill'],
    linkMode: 'symlink',
    env: {
      HOME: tempDir,
      CODEX_SKILLS_DIR: codexRoot,
    },
  });

  const targetSkill = path.join(codexRoot, 'alpha-skill');
  const stat = await fs.lstat(targetSkill);
  assert.equal(stat.isSymbolicLink(), true);
  assert.equal(await fs.readlink(targetSkill), sourceSkill);

  // Manifest should record symlink mode
  const manifest = await readManifest(codexRoot);
  assert.equal(manifest.linkMode, 'symlink');
});

test('installLinks in copy mode copies files (not symlink)', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'apollo-toolkit-copy-'));
  const toolkitHome = path.join(tempDir, '.apollo-toolkit');
  const codexRoot = path.join(tempDir, 'codex-skills');
  const sourceSkill = path.join(toolkitHome, 'alpha-skill');

  await fs.mkdir(sourceSkill, { recursive: true });
  await fs.writeFile(path.join(sourceSkill, 'SKILL.md'), '# alpha\n', 'utf8');

  await installLinks({
    toolkitHome,
    modes: ['codex'],
    previousSkillNames: ['alpha-skill'],
    linkMode: 'copy',
    env: {
      HOME: tempDir,
      CODEX_SKILLS_DIR: codexRoot,
    },
  });

  const targetSkill = path.join(codexRoot, 'alpha-skill');
  const stat = await fs.lstat(targetSkill);
  assert.equal(stat.isDirectory(), true);
  assert.notEqual(stat.isSymbolicLink(), true);

  const manifest = await readManifest(codexRoot);
  assert.equal(manifest.linkMode, 'copy');
});

// ---- listAllKnownSkillNames tests ----

test('listAllKnownSkillNames combines current and historical skills with dedup', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'apollo-toolkit-allknown-'));
  const toolkitHome = path.join(tempDir, '.apollo-toolkit');
  const codexRoot = path.join(tempDir, 'codex-skills');

  // Current skills in toolkit home
  await fs.mkdir(path.join(toolkitHome, 'alpha-skill'), { recursive: true });
  await fs.writeFile(path.join(toolkitHome, 'alpha-skill', 'SKILL.md'), '# alpha\n', 'utf8');
  await fs.mkdir(path.join(toolkitHome, 'beta-skill'), { recursive: true });
  await fs.writeFile(path.join(toolkitHome, 'beta-skill', 'SKILL.md'), '# beta\n', 'utf8');

  // Manifest with historical skills (including an old one)
  await fs.mkdir(codexRoot, { recursive: true });
  await writeManifest(codexRoot, {
    version: '1.0.0',
    linkMode: 'copy',
    skills: ['alpha-skill'],
    previousSkills: ['old-skill', 'alpha-skill'],
  });

  const allNames = await listAllKnownSkillNames({
    toolkitHome,
    modes: ['codex'],
    env: { HOME: tempDir, CODEX_SKILLS_DIR: codexRoot },
  });

  assert.deepEqual(allNames, ['alpha-skill', 'beta-skill', 'old-skill']);
});

// ---- CLI parseArguments tests ----

test('parseArguments recognizes uninstall command', () => {
  const result = parseArguments(['uninstall']);
  assert.equal(result.command, 'uninstall');
  assert.deepEqual(result.modes, []);
});

test('parseArguments recognizes uninstall command with modes', () => {
  const result = parseArguments(['uninstall', 'codex', 'trae']);
  assert.equal(result.command, 'uninstall');
  assert.deepEqual(result.modes, ['codex', 'trae']);
});

test('parseArguments recognizes uninstall --yes and --home', () => {
  const result = parseArguments(['uninstall', 'codex', '--yes', '--home', '/tmp/apollo']);
  assert.equal(result.command, 'uninstall');
  assert.equal(result.assumeYes, true);
  assert.equal(result.toolkitHome, '/tmp/apollo');
  assert.deepEqual(result.modes, ['codex']);
});

test('parseArguments recognizes --symlink flag', () => {
  const result = parseArguments(['codex', '--symlink']);
  assert.equal(result.command, 'install');
  assert.equal(result.linkMode, 'symlink');
  assert.deepEqual(result.modes, ['codex']);
});

test('parseArguments recognizes --copy flag', () => {
  const result = parseArguments(['agents', '--copy']);
  assert.equal(result.linkMode, 'copy');
  assert.deepEqual(result.modes, ['agents']);
});

test('parseArguments defaults linkMode to null (prompt)', () => {
  const result = parseArguments(['codex']);
  assert.equal(result.linkMode, null);
});
