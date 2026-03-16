const { createInterface } = require('node:readline/promises');
const path = require('node:path');

const {
  VALID_MODES,
  installLinks,
  normalizeModes,
  resolveToolkitHome,
  syncToolkitHome,
  getTargetRoots,
} = require('./installer');

const TARGET_OPTIONS = [
  { id: 'all', label: 'All', description: 'Install every supported target below' },
  { id: 'codex', label: 'Codex', description: '~/.codex/skills' },
  { id: 'openclaw', label: 'OpenClaw', description: '~/.openclaw/workspace*/skills' },
  { id: 'trae', label: 'Trae', description: '~/.trae/skills' },
];

function supportsColor(stream, env = process.env) {
  return Boolean(stream && stream.isTTY && !env.NO_COLOR);
}

function color(text, code, enabled) {
  if (!enabled) {
    return text;
  }

  return `\u001b[${code}m${text}\u001b[0m`;
}

function buildBanner({ version, colorEnabled }) {
  const lines = [
    '+------------------------------------------+',
    '|              Apollo Toolkit              |',
    '|      npm installer and skill linker      |',
    '+------------------------------------------+',
    `Version ${version}`,
  ];

  return lines
    .map((line, index) => {
      if (index <= 2) {
        return color(line, '1;36', colorEnabled);
      }
      return color(line, '2', colorEnabled);
    })
    .join('\n');
}

function buildHelpText({ version, colorEnabled }) {
  return [
    buildBanner({ version, colorEnabled }),
    '',
    'Usage:',
    '  apollo-toolkit [install] [codex|openclaw|trae|all]...',
    '  apollo-toolkit --help',
    '',
    'Examples:',
    '  npx @laitszkin/apollo-toolkit',
    '  npx @laitszkin/apollo-toolkit codex openclaw',
    '  npm i -g @laitszkin/apollo-toolkit',
    '  apollo-toolkit all',
    '',
    'Options:',
    '  --home <path>  Override Apollo Toolkit home directory',
    '  --help         Show this help text',
  ].join('\n');
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
  output.write('Choose where Apollo Toolkit should create symlinked skills.\n');
  output.write('Use Up/Down (or j/k) to move, Space to toggle, Enter to continue.\n');
  output.write('Press a to toggle all, q to cancel.\n\n');

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
  stdout.write(`Linked skills: ${installResult.skillNames.length}\n`);
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
  const packageJson = require(path.join(sourceRoot, 'package.json'));

  try {
    const parsed = parseArguments(argv);
    if (parsed.showHelp) {
      stdout.write(`${buildHelpText({ version: packageJson.version, colorEnabled: supportsColor(stdout, env) })}\n`);
      return 0;
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

    await syncToolkitHome({
      sourceRoot,
      toolkitHome,
      version: packageJson.version,
    });

    const installResult = await installLinks({
      toolkitHome,
      modes,
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
  buildHelpText,
  parseArguments,
  promptForModes,
  run,
};
