const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { PassThrough } = require('node:stream');
const path = require('node:path');

const { parseArguments, buildHelpText, buildToolsHelp, run } = require('../dist/lib/cli');
const { listToolCommands, resolveToolCommand, runTool } = require('../dist/lib/tool-runner');

test('tool registry exposes bundled skill tools', () => {
  const tools = listToolCommands();
  assert.ok(tools.length >= 10);
  assert.ok(tools.some((tool) => tool.name === 'filter-logs'));
  assert.ok(tools.some((tool) => tool.name === 'open-github-issue'));
  assert.ok(tools.some((tool) => tool.name === 'validate-skill-frontmatter'));
});

test('tool aliases resolve to canonical scripts', () => {
  const resolved = resolveToolCommand('filter-logs-by-time', '/repo');
  assert.equal(resolved.canonicalName, 'filter-logs');
  assert.equal(resolved.scriptPath, '/repo/analyse-app-logs/scripts/filter_logs_by_time.py');
});

test('parseArguments recognizes direct tool invocation', () => {
  const parsed = parseArguments(['filter-logs', 'app.log', '--count-only']);
  assert.equal(parsed.command, 'tool');
  assert.equal(parsed.toolName, 'filter-logs');
  assert.deepEqual(parsed.toolArgs, ['app.log', '--count-only']);
});

test('parseArguments recognizes namespaced tool invocation', () => {
  const parsed = parseArguments(['tools', 'create-specs', 'Feature Name']);
  assert.equal(parsed.command, 'tool');
  assert.equal(parsed.toolName, 'create-specs');
  assert.deepEqual(parsed.toolArgs, ['Feature Name']);
});

test('parseArguments keeps tools help separate from install help', () => {
  const parsed = parseArguments(['tools']);
  assert.equal(parsed.command, 'tools-help');
  assert.equal(parsed.showToolsHelp, true);
  assert.equal(parsed.showHelp, false);
});

test('buildToolsHelp lists bundled tools', () => {
  const help = buildToolsHelp({ version: '1.2.3', colorEnabled: false });
  assert.match(help, /apltk tools/);
  assert.match(help, /Common goals:/);
  assert.match(help, /filter-logs/);
  assert.match(help, /open-github-issue/);
  assert.match(help, /Examples:/);
});

test('buildHelpText provides task-oriented overview help', () => {
  const help = buildHelpText({ version: '1.2.3', colorEnabled: false });
  assert.match(help, /Common goals:/);
  assert.match(help, /apltk tools --help/);
  assert.match(help, /Examples:/);
});

test('parseArguments distinguishes overview, install, and uninstall help', () => {
  assert.equal(parseArguments(['--help']).helpTopic, 'overview');
  assert.equal(parseArguments(['codex', '--help']).helpTopic, 'install');
  assert.equal(parseArguments(['uninstall', '--help']).helpTopic, 'uninstall');
});

test('runTool dispatches through handler when one is registered', async () => {
  let stdoutText = '';
  let stderrText = '';
  const repoRoot = path.resolve(__dirname, '..');
  const exitCode = await runTool('validate-skill-frontmatter', [], {
    sourceRoot: repoRoot,
    stdout: {
      write(chunk) {
        stdoutText += chunk;
        return true;
      },
    },
    stderr: {
      write(chunk) {
        stderrText += chunk;
        return true;
      },
    },
  });

  assert.equal(exitCode, 0, stderrText);
  assert.match(stdoutText, /SKILL.md frontmatter validation passed/);
});

test('run dispatches tool commands without installer flow', async () => {
  const calls = [];
  const stdout = { write() {} };
  const stderr = { write() {} };
  const exitCode = await run(['review-threads', 'list', '--pr', '42'], {
    stdout,
    stderr,
    env: {},
    runTool: async (...args) => {
      calls.push(args);
      return 0;
    },
  });

  assert.equal(exitCode, 0);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'review-threads');
  assert.deepEqual(calls[0][1], ['list', '--pr', '42']);
});
