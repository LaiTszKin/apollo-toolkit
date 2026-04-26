const { createInterface } = require('node:readline/promises');
const fs = require('node:fs');
const path = require('node:path');

const {
  TARGET_DEFINITIONS,
  VALID_MODES,
  installLinks,
  listAllKnownSkillNames,
  listCodexSkillNames,
  normalizeModes,
  resolveToolkitHome,
  syncToolkitHome,
  uninstallSkills,
  getTargetRoots,
  getUninstallTargetRoots,
} = require('./installer');
const { formatToolList, getToolCommand, runTool } = require('./tool-runner');
const { checkForPackageUpdate } = require('./updater');

const TARGET_OPTIONS = [
  { id: 'all', label: 'All', description: 'Select every supported target below' },
  ...TARGET_DEFINITIONS,
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

  return `[${code}m${text}[0m`;
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
    color('Install curated skills for Codex, OpenClaw, Trae, Agents, and Claude Code', '2', colorEnabled),
    color(`Version ${version}`, '1;33', colorEnabled),
  ].join('\n');
}

function buildModeUsagePattern() {
  return `${VALID_MODES.join('|')}|all`;
}

function buildInteractiveModeHint() {
  const quotedModes = [...VALID_MODES, 'all'].map((mode) => `\`${mode}\``);
  return `${quotedModes.slice(0, -1).join(', ')}, or ${quotedModes.at(-1)}`;
}

function buildSupportedTargetLines({ colorEnabled }) {
  const labelWidth = TARGET_DEFINITIONS.reduce((max, target) => Math.max(max, target.label.length), 0);
  return TARGET_DEFINITIONS.map((target) => (
    `  ${color(target.label.padEnd(labelWidth, ' '), '1', colorEnabled)} ${target.description}`
  )).join('\n');
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
      buildSupportedTargetLines({ colorEnabled }),
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
    `  apltk [install] [${buildModeUsagePattern()}]...`,
    `  apollo-toolkit [install] [${buildModeUsagePattern()}]...`,
    `  apltk uninstall [${buildModeUsagePattern()}]... [--yes]`,
    '  apltk tools',
    '  apltk <tool> [...args]',
    '  apltk tools <tool> [...args]',
    '  apltk --help',
    '  apollo-toolkit --help',
    '',
    'Examples:',
    '  apltk',
    '  apltk codex openclaw',
    '  apltk uninstall',
    '  apltk uninstall codex agents --yes',
    '  npx @laitszkin/apollo-toolkit',
    '  npx @laitszkin/apollo-toolkit codex openclaw',
    '  npm i -g @laitszkin/apollo-toolkit',
    '  apltk agents',
    '  apltk claude-code',
    '  apltk all',
    '  apltk filter-logs app.log --start 2026-03-24T10:00:00Z',
    '  apltk create-specs "Membership upgrade flow" --change-name membership-upgrade-flow',
    '  apltk tools',
    '  apollo-toolkit all',
    '',
    'Bundled tools:',
    formatToolList(),
    '',
    'Options:',
    '  --home <path>  Override Apollo Toolkit home directory',
    '  --yes, -y      Skip uninstall confirmation',
    '  --help         Show this help text',
  ].join('\n');
}

function buildToolsHelp({ version, colorEnabled }) {
  return [
    buildBanner({ version, colorEnabled }),
    '',
    'Usage:',
    '  apltk tools',
    '  apltk <tool> [...args]',
    '  apltk tools <tool> [...args]',
    '',
    'Bundled tools:',
    formatToolList(),
    '',
    'Tip:',
    '  Pass `--help` after a tool name to view the original script flags.',
  ].join('\n');
}

function readPackageJson(sourceRoot) {
  return JSON.parse(fs.readFileSync(path.join(sourceRoot, 'package.json'), 'utf8'));
}

function parseArguments(argv) {
  const args = [...argv];
  const result = {
    command: 'install',
    modes: [],
    showHelp: false,
    showToolsHelp: false,
    toolkitHome: null,
    toolName: null,
    toolArgs: [],
    linkMode: null, // 'copy' | 'symlink' | null (prompt)
    assumeYes: false,
  };

  if (args[0] === 'uninstall') {
    result.command = 'uninstall';
    args.shift();
    while (args.length > 0) {
      const arg = args.shift();
      if (arg === '--help' || arg === '-h') {
        result.showHelp = true;
      } else if (arg === '--yes' || arg === '-y') {
        result.assumeYes = true;
      } else if (arg === '--home') {
        const toolkitHome = args.shift();
        if (!toolkitHome) {
          throw new Error('Missing value for --home');
        }
        result.toolkitHome = path.resolve(toolkitHome);
      } else {
        result.modes.push(arg);
      }
    }
    return result;
  }

  if (args[0] === 'tools' || args[0] === 'tool') {
    args.shift();
    if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
      result.command = 'tools-help';
      result.showToolsHelp = true;
      return result;
    }

    result.command = 'tool';
    result.toolName = args.shift();
    result.toolArgs = args;
    return result;
  }

  if (args[0] && getToolCommand(args[0])) {
    result.command = 'tool';
    result.toolName = args.shift();
    result.toolArgs = args;
    return result;
  }

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

    if (arg === '--symlink') {
      result.linkMode = 'symlink';
      continue;
    }

    if (arg === '--copy') {
      result.linkMode = 'copy';
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
    output.write('[2J[H');
  }
}

function renderSelectionScreen({
  output,
  version,
  cursor,
  selected,
  message,
  env,
  intro = 'Choose where Apollo Toolkit should copy managed skills.',
}) {
  const colorEnabled = supportsColor(output, env);
  const allSelected = VALID_MODES.every((mode) => selected.has(mode));

  clearScreen(output);
  output.write(`${buildBanner({ version, colorEnabled })}\n\n`);
  output.write(`${intro}\n`);
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

async function promptForSelectableModes({ stdin, stdout, version, env, intro, ttyError, cancelMessage }) {
  if (!stdin.isTTY || !stdout.isTTY) {
    throw new Error(ttyError);
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
      if (value === '') {
        cleanup();
        reject(new Error(cancelMessage));
        return;
      }

      if (value === '[A' || value === 'k') {
        cursor = (cursor - 1 + TARGET_OPTIONS.length) % TARGET_OPTIONS.length;
        message = '';
        renderSelectionScreen({ output: stdout, version, cursor, selected, message, env, intro });
        return;
      }

      if (value === '[B' || value === 'j') {
        cursor = (cursor + 1) % TARGET_OPTIONS.length;
        message = '';
        renderSelectionScreen({ output: stdout, version, cursor, selected, message, env, intro });
        return;
      }

      if (value === ' ') {
        toggleMode(TARGET_OPTIONS[cursor].id);
        message = '';
        renderSelectionScreen({ output: stdout, version, cursor, selected, message, env, intro });
        return;
      }

      if (value.toLowerCase() === 'a') {
        toggleMode('all');
        message = '';
        renderSelectionScreen({ output: stdout, version, cursor, selected, message, env, intro });
        return;
      }

      if (value.toLowerCase() === 'q' || value === '') {
        cleanup();
        reject(new Error(cancelMessage));
        return;
      }

      if (value === '\r') {
        if (selected.size === 0) {
          message = 'Select at least one target before continuing.';
          renderSelectionScreen({ output: stdout, version, cursor, selected, message, env, intro });
          return;
        }

        cleanup();
        resolve([...selected]);
      }
    };

    stdin.setRawMode(true);
    stdin.resume();
    stdin.on('data', onData);
    renderSelectionScreen({ output: stdout, version, cursor, selected, message, env, intro });
  });
}

async function promptForModes({ stdin, stdout, version, env }) {
  await animateWelcomeScreen({ output: stdout, version, env });
  return promptForSelectableModes({
    stdin,
    stdout,
    version,
    env,
    intro: 'Choose where Apollo Toolkit should copy managed skills.',
    ttyError: `Interactive install requires a TTY. Re-run with targets like ${buildInteractiveModeHint()}.`,
    cancelMessage: 'Installation cancelled.',
  });
}

async function promptForUninstallModes({ stdin, stdout, version, env }) {
  return promptForSelectableModes({
    stdin,
    stdout,
    version,
    env,
    intro: 'Choose which agent skill targets Apollo Toolkit should uninstall.',
    ttyError: `Interactive uninstall requires a TTY. Re-run with targets like ${buildInteractiveModeHint()}.`,
    cancelMessage: 'Uninstall cancelled.',
  });
}

async function promptYesNo({ stdin, stdout, env, question, defaultYes = true }) {
  if (!stdin.isTTY || !stdout.isTTY) {
    return defaultYes;
  }

  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const hint = defaultYes ? '[Y/n]' : '[y/N]';
    const answer = await rl.question(`${question} ${hint} `);
    const trimmed = answer.trim().toLowerCase();
    if (trimmed === '') {
      return defaultYes;
    }
    return trimmed === 'y' || trimmed === 'yes';
  } finally {
    rl.close();
  }
}

function buildSymlinkInfo({ colorEnabled }) {
  return [
    '',
    color('Symlink mode:', '1', colorEnabled),
    `  ${color('Pro:', '1;32', colorEnabled)} Skills auto-update when you ${color('git pull', '1;33', colorEnabled)} in ~/.apollo-toolkit`,
    `  ${color('Pro:', '1;32', colorEnabled)} No need to re-run installer after patch updates`,
    `  ${color('Con:', '1;31', colorEnabled)} Changes pushed to the repo automatically reflect in your skills -`,
    `       you may receive updates you did not intend to accept`,
    '',
  ].join('\n');
}

async function promptSymlinkChoice({ stdin, stdout, env, colorEnabled }) {
  stdout.write(buildSymlinkInfo({ colorEnabled }));
  return promptYesNo({
    stdin,
    stdout,
    env,
    question: 'Install skills as symlinks (recommended)?',
    defaultYes: true,
  });
}

// Ask user whether to include codex-exclusive skills in non-codex targets.
async function promptIncludeExclusiveSkills({ stdin, stdout, env, colorEnabled, codexSkillNames, nonCodexModes }) {
  if (codexSkillNames.length === 0 || nonCodexModes.length === 0) {
    return false;
  }

  stdout.write([
    '',
    color('Exclusive skills detected:', '1;33', colorEnabled),
    `  The following skills are exclusive to codex: ${codexSkillNames.join(', ')}`,
    `  Your selected non-codex targets: ${nonCodexModes.join(', ')}`,
    '',
  ].join('\n'));

  return promptYesNo({
    stdin,
    stdout,
    env,
    question: `Install codex-exclusive skills to ${nonCodexModes.join(', ')} as well?`,
    defaultYes: false,
  });
}

async function confirmInstall({ stdin, stdout, version, toolkitHome, modes, linkMode, env }) {
  const colorEnabled = supportsColor(stdout, env);
  stdout.write(`${buildBanner({ version, colorEnabled })}\n\n`);
  stdout.write(`Apollo Toolkit home: ${toolkitHome}\n`);
  stdout.write(`Targets: ${modes.join(', ')}\n`);
  stdout.write(`Install mode: ${linkMode === 'symlink' ? 'symlink (auto-update via git pull)' : 'copy (manual reinstall for updates)'}\n\n`);

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
  stdout.write(`Install mode: ${installResult.linkMode === 'symlink' ? 'symlink' : 'copy'}\n`);
  stdout.write(`Targets: ${modes.join(', ')}\n\n`);

  for (const target of installResult.targets) {
    stdout.write(`- ${target.label}: ${target.root}\n`);
  }
}

function printUninstallSummary({ stdout, uninstallResult, env }) {
  const colorEnabled = supportsColor(stdout, env);

  if (uninstallResult.length === 0) {
    stdout.write(color('No Apollo Toolkit installations found.\n', '1;33', colorEnabled));
    return;
  }

  stdout.write(color('Uninstall complete.', '1;32', colorEnabled));
  stdout.write('\n\n');
  for (const result of uninstallResult) {
    stdout.write(`${color(result.target, '1', colorEnabled)} (${result.root})\n`);
    stdout.write(`  Removed: ${result.removedSkills.length > 0 ? result.removedSkills.join(', ') : '(manifest only)'}\n`);
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

    if (parsed.showToolsHelp) {
      stdout.write(`${buildToolsHelp({ version: packageJson.version, colorEnabled: supportsColor(stdout, env) })}\n`);
      return 0;
    }

    if (parsed.command === 'tool') {
      return (context.runTool || runTool)(parsed.toolName, parsed.toolArgs, {
        sourceRoot,
        stdout,
        stderr,
        env,
        spawnCommand: context.spawnCommand,
      });
    }

    // --- Uninstall flow ---
    if (parsed.command === 'uninstall') {
      const toolkitHome = parsed.toolkitHome || resolveToolkitHome(env);
      const modes = parsed.modes.length > 0
        ? normalizeModes(parsed.modes)
        : (stdin.isTTY && stdout.isTTY
          ? normalizeModes(await promptForUninstallModes({ stdin, stdout, version: packageJson.version, env }))
          : null);
      const modesForLookup = modes || VALID_MODES;
      const targets = await getUninstallTargetRoots(modesForLookup, env);

      // Show what will be removed
      const allKnown = await listAllKnownSkillNames({ toolkitHome, modes: modesForLookup, env });
      stdout.write(color(`Apollo Toolkit home: ${toolkitHome}\n`, '2', supportsColor(stdout, env)));
      if (targets.length > 0) {
        stdout.write('Targets:\n');
        for (const target of targets) {
          stdout.write(`- ${target.label}: ${target.root}\n`);
        }
      }

      const confirmed = parsed.assumeYes || await promptYesNo({
        stdin,
        stdout,
        env,
        question: `This will remove Apollo Toolkit-installed skills${modes ? ` from: ${modes.join(', ')}` : ' from all targets'}. Continue?`,
        defaultYes: false,
      });

      if (!confirmed) {
        stdout.write('Uninstall cancelled.\n');
        return 1;
      }

      const uninstallResult = await uninstallSkills({ env, modes });
      printUninstallSummary({ stdout, uninstallResult, env });

      if (allKnown.length > 0) {
        stdout.write(`\nPreviously known skills (may still exist elsewhere): ${allKnown.join(', ')}\n`);
      }

      return 0;
    }

    // --- Install flow ---
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

    const colorEnabled = supportsColor(stdout, env);

    // Determine link mode
    let linkMode = parsed.linkMode;
    if (!linkMode) {
      linkMode = (await promptSymlinkChoice({ stdin, stdout, env, colorEnabled })) ? 'symlink' : 'copy';
    }

    // Determine whether to include exclusive (codex) skills in non-codex targets
    const nonCodexModes = modes.filter((m) => m !== 'codex');
    const codexSkillNames = await listCodexSkillNames(toolkitHome).catch(() => []);
    const includeExclusiveSkills = await promptIncludeExclusiveSkills({
      stdin,
      stdout,
      env,
      colorEnabled,
      codexSkillNames,
      nonCodexModes,
    });

    // syncToolkitHome needs to include the codex container when exclusive skills
    // are requested, so the source files are available for symlink/copy.
    const effectiveModes = includeExclusiveSkills
      ? [...new Set([...modes, 'codex'])]
      : modes;

    const confirmed = await confirmInstall({
      stdin,
      stdout,
      version: packageJson.version,
      toolkitHome,
      modes,
      linkMode,
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
      modes: effectiveModes,
    });

    const installResult = await installLinks({
      toolkitHome,
      modes,
      previousSkillNames: syncResult.previousSkillNames,
      linkMode,
      includeExclusiveSkills,
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
  buildToolsHelp,
  parseArguments,
  promptForModes,
  promptForUninstallModes,
  promptSymlinkChoice,
  promptIncludeExclusiveSkills,
  readPackageJson,
  run,
};
