const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const { normalizeModes, syncToolkitHome } = require('../lib/installer');
const { buildBanner, run } = require('../lib/cli');

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
  assert.deepEqual(normalizeModes(['codex', 'all', 'trae']), ['codex', 'openclaw', 'trae']);
  assert.throws(() => normalizeModes(['unknown']), /Invalid mode/);
});

test('buildBanner shows Apollo Toolkit branding', () => {
  assert.match(buildBanner({ version: '2.0.0', colorEnabled: false }), /Apollo Toolkit/);
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

test('run installs toolkit home and creates symlinks in selected targets', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'apollo-toolkit-run-'));
  const sourceRoot = path.join(tempDir, 'source');
  const homeDir = path.join(tempDir, 'user-home');
  const toolkitHome = path.join(homeDir, '.apollo-toolkit');
  const stdout = createMemoryStream();
  const stderr = createMemoryStream();

  await fs.mkdir(sourceRoot, { recursive: true });
  await createFixtureSource(sourceRoot);
  await fs.mkdir(path.join(homeDir, '.openclaw', 'workspace1'), { recursive: true });

  const exitCode = await run(['codex', 'openclaw'], {
    sourceRoot,
    env: {
      HOME: homeDir,
      APOLLO_TOOLKIT_HOME: toolkitHome,
    },
    stdin: { isTTY: false },
    stdout,
    stderr,
  });

  assert.equal(exitCode, 0, stderr.toString());
  assert.match(stdout.toString(), /Installation complete/);

  const codexLink = path.join(homeDir, '.codex', 'skills', 'alpha-skill');
  const openclawLink = path.join(homeDir, '.openclaw', 'workspace1', 'skills', 'alpha-skill');
  const expectedSource = await fs.realpath(path.join(toolkitHome, 'alpha-skill'));

  assert.equal((await fs.lstat(codexLink)).isSymbolicLink(), true);
  assert.equal((await fs.lstat(openclawLink)).isSymbolicLink(), true);
  assert.equal(await fs.realpath(codexLink), expectedSource);
}); 
