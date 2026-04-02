const { createInterface } = require('node:readline/promises');
const fs = require('node:fs');
const path = require('node:path');

const {
  VALID_MODES,
  installLinks,
  normalizeModes,
  resolveToolkitHome,
  syncToolkitHome,
  getTargetRoots,
} = require('./installer');
const { checkForPackageUpdate } = require('./updater');

const TARGET_OPTIONS = [
  { id: 'all', label: 'All', description: 'Install every supported target below' },
  { id: 'codex', label: 'Codex', description: '~/.codex/skills' },
  { id: 'openclaw', label: 'OpenClaw', description: '~/.openclaw/workspace*/skills' },
  { id: 'trae', label: 'Trae', description: '~/.trae/skills' },
];

const WORDMARK_LINES = [
  '    _                _ _        _____           _ _    _ _   ',
  '   / \\\\   _ __   ___ | | | ___  |_   _|__   ___ | | | _(_) |_ ',
  "  / _ \\\\ | '_ \\\\ / _ \\\\| | |/ _ \\\\   | |/ _ \\\\ / _ \\\\| | |/ / | __|",
  ' / ___ \\\\| |_) | (_) | | | (_) |  | | (_) | (_) | |   <| | |_ ',
  '/_/   \\\\_\\\\ .__/ \\\\___/|_|_|\\\\___/   |_|\\\\___/ \\\\___/|_|_|\\\\_\\\\_|\\\\__|',
  '         |_|                                                      ',
];

function supportsColor(stream, env = process.env) {
  return Boolean(stream && stream.isTTY && !env.NO_COLOR);
}

function supportsAnimation(stream, env = process.env) {
  return Boolean(stream && stream.isTTY && !env.CI && env.APOLLO_TOOLKIT_NO_ANIMATION !== '1');
}

function color(text, code, enabled) {
  if (!enabled) {
    return text;
  }

  return `\u001b[${code}m${text}\u001b[0m`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildWordmark({ colorEnabled }) {
  return WORDMARK_LINES.map((line) => color(line, '1;36', colorEnabled)).join('\n');
}

function buildBanner({ version, colorEnabled }) {
  return [
    buildWordmark({ colorEnabled }),
    color('Apollo Toolkit', '1', colorEnabled),
    color('Install curated skills for Codex, OpenClaw, and Trae', '2', colorEnabled),
    color(`Version ${version}`, '1;33', colorEnabled),
  ].join('\n');
}

function buildWelcomeScreen({ version, colorEnabled, stage = 4 }) {
  const lines = [buildBanner({ version, colorEnabled })];

  if (stage >= 1) {
    lines.push(
      '',
      'This setup will configure:',
      `  ${color('*', '1;33', colorEnabled)} A managed Apollo Toolkit home in ${color('~/.apollo-toolkit', '1', colorEnabled)}`,
      `  ${color('*', '1;33', colorEnabled)} Copied skill folders for your selected targets`,
      `  ${color('*', '1;33', colorEnabled)} A clean install flow with target-aware replacement`,
    );
  }

  if (stage >= 2) {
    lines.push(
      '',
      'Quick start after setup:',
      `  ${color('npx @laitszkin/apollo-toolkit codex', '1;33', colorEnabled)}`,
      `  ${color('apollo-toolkit all', '1;33', colorEnabled)}`,
    );
  }

  if (stage >= 3) {
    lines.push(
      '',
      color('Supported targets:', '2', colorEnabled),
      `  ${color('Codex', '1', colorEnabled)}     ~/.codex/skills`,
      `  ${color('OpenClaw', '1', colorEnabled)}  ~/.openclaw/workspace*/skills`,
      `  ${color('Trae', '1', colorEnabled)}      ~/.trae/skills`,
    );
  }

  if (stage >= 4) {
    lines.push('', color('Launching target selector...', '1;36', colorEnabled));
  }

  return lines.join('\n');
}

async function animateWelcomeScreen({ output, version, env }) {
  if (!supportsAnimation(output, env)) {
    return;
  }

  const colorEnabled = supportsColor(output, env);
  for (const stage of [0, 1, 2, 3, 4]) {
    clearScreen(output);
    output.write(`${buildWelcomeScreen({ version, colorEnabled, stage })}\n`);
    await sleep(stage === 0 ? 120 : 160);
  }
}

function buildHelpText({ version, colorEnabled }) {
  return [
    buildBanner({ version, colorEnabled }),
    '',
    'Usage:',
    '  apltk [install] [codex|openclaw|trae|all]...',
    '  apollo-toolkit [install] [codex|openclaw|trae|all]...',
    '  apltk --help',
    '  apollo-toolkit --help',
    '',
    'Examples:',
    '  apltk',
    '  apltk codex openclaw',
    '  npx @laitszkin/apollo-toolkit',
    '  npx @laitszkin/apollo-toolkit codex openclaw',
    '  npm i -g @laitszkin/apollo-toolkit',
    '  apltk all',
    '  apollo-toolkit all',
    '',
    'Options:',
    '  --home <path>  Override Apollo Toolkit home directory',
    '  --help         Show this help text',
  ].join('\n');
}

function readPackageJson(sourceRoot) {
  return JSON.parse(fs.readFileSync(path.join(sourceRoot, 'package.json'), 'utf8'));
}

function parseArguments(argv) {
  const args = [...argv];
  const result = {
    modes: [],
    showHelp: false,
    toolkitHome: null,
  };

  while (args.length > 0) {
    const arg = args.shift();

    if (arg === '--help' || arg === '-h') {
      result.showHelp = true;
      continue;
    }

    if (arg === '--home') {
      const toolkitHome = args.shift();
      if (!toolkitHome) {
        throw new Error('Missing value for --home');
      }
      result.toolkitHome = path.resolve(toolkitHome);
      continue;
    }

    if (arg === 'install') {
      continue;
    }

    result.modes.push(arg);
  }

  return result;
}

function clearScreen(output) {
  if (output.isTTY) {
    output.write('\u001b[2J\u001b[H');
  }
}

function renderSelectionScreen({ output, version, cursor, selected, message, env }) {
  const colorEnabled = supportsColor(output, env);
  const allSelected = VALID_MODES.every((mode) => selected.has(mode));

  clearScreen(output);
  output.write(`${buildBanner({ version, colorEnabled })}\n\n`);
  output.write('Choose where Apollo Toolkit should copy managed skills.\n');
  output.write(`${color('Use Up/Down', '1;33', colorEnabled)} (or ${color('j/k', '1;33', colorEnabled)}) to move, ${color('Space', '1;33', colorEnabled)} to toggle, ${color('Enter', '1;33', colorEnabled)} to continue.\n`);
  output.write(`Press ${color('a', '1;33', colorEnabled)} to toggle all, ${color('q', '1;33', colorEnabled)} to cancel.\n\n`);

  TARGET_OPTIONS.forEach((option, index) => {
    const isFocused = index === cursor;
    const isChecked = option.id === 'all' ? allSelected : selected.has(option.id);
    const prefix = isFocused ? color('>', '1;33', colorEnabled) : ' ';
    const checkbox = isChecked ? color('[x]', '1;32', colorEnabled) : '[ ]';
    const label = isFocused ? color(option.label, '1', colorEnabled) : option.label;
    output.write(`${prefix} ${checkbox} ${label}  ${color(option.description, '2', colorEnabled)}\n`);
  });

  const selectedModes = allSelected ? [...VALID_MODES] : [...selected].sort();
  output.write('\n');
  output.write(`Selected: ${selectedModes.length > 0 ? selectedModes.join(', ') : 'none'}\n`);
  if (message) {
    output.write(`${color(message, '1;31', colorEnabled)}\n`);
  }
}

async function promptForModes({ stdin, stdout, version, env }) {
  if (!stdin.isTTY || !stdout.isTTY) {
    throw new Error('Interactive install requires a TTY. Re-run with targets like `codex`, `openclaw`, `trae`, or `all`.');
  }

  await animateWelcomeScreen({ output: stdout, version, env });

  return new Promise((resolve, reject) => {
    let cursor = 0;
    let message = '';
    const selected = new Set();

    const cleanup = () => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener('data', onData);
      stdout.write('\n');
    };

    const toggleMode = (mode) => {
      if (mode === 'all') {
        const shouldSelectAll = !VALID_MODES.every((candidate) => selected.has(candidate));
        selected.clear();
        if (shouldSelectAll) {
          VALID_MODES.forEach((candidate) => selected.add(candidate));
        }
        return;
      }

      if (selected.has(mode)) {
        selected.delete(mode);
      } else {
        selected.add(mode);
      }
    };

    const onData = (chunk) => {
      const value = chunk.toString('utf8');
      if (value === '\u0003') {
        cleanup();
        reject(new Error('Installation cancelled.'));
        return;
      }

      if (value === '\u001b[A' || value === 'k') {
        cursor = (cursor - 1 + TARGET_OPTIONS.length) % TARGET_OPTIONS.length;
        message = '';
        renderSelectionScreen({ output: stdout, version, cursor, selected, message, env });
        return;
      }

      if (value === '\u001b[B' || value === 'j') {
        cursor = (cursor + 1) % TARGET_OPTIONS.length;
        message = '';
        renderSelectionScreen({ output: stdout, version, cursor, selected, message, env });
        return;
      }

      if (value === ' ') {
        toggleMode(TARGET_OPTIONS[cursor].id);
        message = '';
        renderSelectionScreen({ output: stdout, version, cursor, selected, message, env });
        return;
      }

      if (value.toLowerCase() === 'a') {
        toggleMode('all');
        message = '';
        renderSelectionScreen({ output: stdout, version, cursor, selected, message, env });
        return;
      }

      if (value.toLowerCase() === 'q' || value === '\u001b') {
        cleanup();
        reject(new Error('Installation cancelled.'));
        return;
      }

      if (value === '\r') {
        if (selected.size === 0) {
          message = 'Select at least one target before continuing.';
          renderSelectionScreen({ output: stdout, version, cursor, selected, message, env });
          return;
        }

        cleanup();
        resolve([...selected]);
      }
    };

    stdin.setRawMode(true);
    stdin.resume();
    stdin.on('data', onData);
    renderSelectionScreen({ output: stdout, version, cursor, selected, message, env });
  });
}

async function confirmInstall({ stdin, stdout, version, toolkitHome, modes, env }) {
  const colorEnabled = supportsColor(stdout, env);
  stdout.write(`${buildBanner({ version, colorEnabled })}\n\n`);
  stdout.write(`Apollo Toolkit home: ${toolkitHome}\n`);
  stdout.write(`Targets: ${modes.join(', ')}\n\n`);

  const targets = await getTargetRoots(modes, env).catch((error) => {
    throw error;
  });
  for (const target of targets) {
    stdout.write(`- ${target.label}: ${target.root}\n`);
  }
  stdout.write('\n');

  if (!stdin.isTTY || !stdout.isTTY) {
    return true;
  }

  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const answer = await rl.question('Install Apollo Toolkit to these targets? [Y/n] ');
    return answer.trim() === '' || answer.trim().toLowerCase() === 'y';
  } finally {
    rl.close();
  }
}

function printSummary({ stdout, version, toolkitHome, modes, installResult, env }) {
  const colorEnabled = supportsColor(stdout, env);
  stdout.write(`\n${buildBanner({ version, colorEnabled })}\n\n`);
  stdout.write(color('Installation complete.', '1;32', colorEnabled));
  stdout.write('\n');
  stdout.write(`Apollo Toolkit home: ${toolkitHome}\n`);
  stdout.write(`Installed skills: ${installResult.skillNames.length}\n`);
  stdout.write(`Targets: ${modes.join(', ')}\n\n`);

  for (const target of installResult.targets) {
    stdout.write(`- ${target.label}: ${target.root}\n`);
  }
}

async function run(argv, context = {}) {
  const sourceRoot = context.sourceRoot || path.resolve(__dirname, '..');
  const stdout = context.stdout || process.stdout;
  const stderr = context.stderr || process.stderr;
  const stdin = context.stdin || process.stdin;
  const env = context.env || process.env;
  let packageJson = readPackageJson(sourceRoot);

  try {
    const parsed = parseArguments(argv);
    if (parsed.showHelp) {
      stdout.write(`${buildHelpText({ version: packageJson.version, colorEnabled: supportsColor(stdout, env) })}\n`);
      return 0;
    }

    const updateResult = await checkForPackageUpdate({
      packageName: packageJson.name,
      currentVersion: packageJson.version,
      env,
      stdin,
      stdout,
      stderr,
      exec: context.execCommand,
      confirmUpdate: context.confirmUpdate,
    });

    if (updateResult.updated) {
      packageJson = readPackageJson(sourceRoot);
    }

    const toolkitHome = parsed.toolkitHome || resolveToolkitHome(env);
    const modes = parsed.modes.length > 0
      ? normalizeModes(parsed.modes)
      : normalizeModes(await promptForModes({ stdin, stdout, version: packageJson.version, env }));

    const confirmed = await confirmInstall({
      stdin,
      stdout,
      version: packageJson.version,
      toolkitHome,
      modes,
      env,
    });

    if (!confirmed) {
      stdout.write('Installation cancelled.\n');
      return 1;
    }

    const syncResult = await syncToolkitHome({
      sourceRoot,
      toolkitHome,
      version: packageJson.version,
    });

    const installResult = await installLinks({
      toolkitHome,
      modes,
      previousSkillNames: syncResult.previousSkillNames,
      env: {
        ...env,
        APOLLO_TOOLKIT_HOME: toolkitHome,
      },
    });

    printSummary({ stdout, version: packageJson.version, toolkitHome, modes, installResult, env });
    return 0;
  } catch (error) {
    stderr.write(`Error: ${error.message}\n`);
    return 1;
  }
}

module.exports = {
  buildBanner,
  buildWelcomeScreen,
  buildHelpText,
  parseArguments,
  promptForModes,
  readPackageJson,
  run,
};
