const test = require('node:test');
const assert = require('node:assert/strict');

const { parseArguments, buildToolsHelp, run } = require('../lib/cli');
const { listToolCommands, resolveToolCommand } = require('../lib/tool-runner');

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
  assert.match(help, /filter-logs/);
  assert.match(help, /open-github-issue/);
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
