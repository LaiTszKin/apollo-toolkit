const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');

function collectPythonTests(rootDir) {
  const files = [];

  function walk(currentDir) {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === '.git') {
        continue;
      }

      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      const normalized = fullPath.split(path.sep).join('/');
      if (/\/tests\/test_.*\.py$/.test(normalized)) {
        files.push(fullPath);
      }
    }
  }

  walk(rootDir);
  return files.sort();
}

test('all python script tests pass', () => {
  const testFiles = collectPythonTests(repoRoot);
  assert.ok(testFiles.length > 0, 'expected at least one Python test file');

  for (const testFile of testFiles) {
    const skillRoot = path.dirname(path.dirname(testFile));
    const result = spawnSync('python3', [testFile], {
      cwd: skillRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        PYTHONPATH: [skillRoot, process.env.PYTHONPATH].filter(Boolean).join(path.delimiter),
      },
    });

    const message = [
      `python test failed: ${path.relative(repoRoot, testFile)}`,
      result.stdout,
      result.stderr,
    ]
      .filter(Boolean)
      .join('\n');

    assert.equal(result.status, 0, message);
  }
});
