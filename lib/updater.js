const { spawn } = require('node:child_process');
const { createInterface } = require('node:readline/promises');

function normalizeVersion(version) {
  return String(version || '')
    .trim()
    .replace(/^v/i, '');
}

function parseVersion(version) {
  const normalized = normalizeVersion(version);
  const [core, prerelease = ''] = normalized.split('-', 2);
  const parts = core.split('.').map((part) => Number.parseInt(part, 10) || 0);

  return {
    parts,
    prerelease,
  };
}

function compareVersions(left, right) {
  const leftVersion = parseVersion(left);
  const rightVersion = parseVersion(right);
  const leftParts = leftVersion.parts;
  const rightParts = rightVersion.parts;
  const length = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < length; index += 1) {
    const delta = (leftParts[index] || 0) - (rightParts[index] || 0);
    if (delta !== 0) {
      return delta;
    }
  }

  if (leftVersion.prerelease && !rightVersion.prerelease) {
    return -1;
  }

  if (!leftVersion.prerelease && rightVersion.prerelease) {
    return 1;
  }

  if (leftVersion.prerelease !== rightVersion.prerelease) {
    return leftVersion.prerelease.localeCompare(rightVersion.prerelease);
  }

  return 0;
}

function shouldSkipUpdateCheck({ env = process.env, stdin = process.stdin, stdout = process.stdout }) {
  return env.APOLLO_TOOLKIT_SKIP_UPDATE_CHECK === '1' || !stdin.isTTY || !stdout.isTTY;
}

function execCommand(command, args, { env = process.env, stdout, stderr } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let capturedStdout = '';
    let capturedStderr = '';

    child.stdout.on('data', (chunk) => {
      capturedStdout += chunk.toString('utf8');
      if (stdout) {
        stdout.write(chunk);
      }
    });

    child.stderr.on('data', (chunk) => {
      capturedStderr += chunk.toString('utf8');
      if (stderr) {
        stderr.write(chunk);
      }
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(capturedStderr.trim() || `${command} exited with code ${code}`));
        return;
      }

      resolve({
        stdout: capturedStdout,
        stderr: capturedStderr,
      });
    });
  });
}

async function defaultConfirmUpdate({ stdin, stdout, currentVersion, latestVersion, packageName }) {
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const answer = await rl.question(
      `A newer ${packageName} release is available (${currentVersion} -> ${latestVersion}). Update now? [Y/n] `,
    );
    const normalized = answer.trim().toLowerCase();
    return normalized === '' || normalized === 'y';
  } finally {
    rl.close();
  }
}

async function getLatestPublishedVersion({
  packageName,
  env = process.env,
  exec = execCommand,
}) {
  const result = await exec('npm', ['view', packageName, 'version', '--json'], { env });
  const parsed = JSON.parse(result.stdout.trim());

  if (Array.isArray(parsed)) {
    return String(parsed[parsed.length - 1] || '').trim();
  }

  return String(parsed || '').trim();
}

async function checkForPackageUpdate({
  packageName,
  currentVersion,
  env = process.env,
  stdin = process.stdin,
  stdout = process.stdout,
  stderr = process.stderr,
  exec = execCommand,
  confirmUpdate = defaultConfirmUpdate,
}) {
  if (shouldSkipUpdateCheck({ env, stdin, stdout })) {
    return {
      checked: false,
      updated: false,
    };
  }

  try {
    const latestVersion = await getLatestPublishedVersion({ packageName, env, exec });
    if (!latestVersion || compareVersions(latestVersion, currentVersion) <= 0) {
      return {
        checked: true,
        updated: false,
        latestVersion,
      };
    }

    const approved = await confirmUpdate({
      stdin,
      stdout,
      currentVersion,
      latestVersion,
      packageName,
    });

    if (!approved) {
      stdout.write(`Continuing with ${packageName} ${currentVersion}.\n`);
      return {
        checked: true,
        updated: false,
        latestVersion,
      };
    }

    stdout.write(`Updating ${packageName} to ${latestVersion}...\n`);
    await exec('npm', ['install', '-g', `${packageName}@latest`], { env, stdout, stderr });
    stdout.write(`Update complete. Continuing with ${packageName} ${latestVersion}.\n`);

    return {
      checked: true,
      updated: true,
      latestVersion,
    };
  } catch (error) {
    stderr.write(`Warning: unable to check or install package updates: ${error.message}\n`);
    return {
      checked: false,
      updated: false,
      error,
    };
  }
}

module.exports = {
  checkForPackageUpdate,
  compareVersions,
  defaultConfirmUpdate,
  execCommand,
  getLatestPublishedVersion,
  normalizeVersion,
  parseVersion,
  shouldSkipUpdateCheck,
};
