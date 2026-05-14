const test = require('node:test');
const assert = require('node:assert/strict');
const { parseArguments } = require('../dist/lib/cli');

test('parseArguments recognizes --help flag', () => {
  const result = parseArguments(['--help']);
  assert.equal(result.showHelp, true);
  assert.equal(result.helpTopic, 'overview');
  assert.equal(result.command, 'install');
});

test('parseArguments recognizes install codex --copy', () => {
  const result = parseArguments(['codex', '--copy']);
  assert.equal(result.command, 'install');
  assert.deepEqual(result.modes, ['codex']);
  assert.equal(result.linkMode, 'copy');
  assert.equal(result.showHelp, false);
});

test('parseArguments recognizes install with multiple targets', () => {
  const result = parseArguments(['codex', 'openclaw', 'trae', '--symlink']);
  assert.equal(result.command, 'install');
  assert.deepEqual(result.modes, ['codex', 'openclaw', 'trae']);
  assert.equal(result.linkMode, 'symlink');
});

test('parseArguments recognizes uninstall --yes', () => {
  const result = parseArguments(['uninstall', '--yes']);
  assert.equal(result.command, 'uninstall');
  assert.equal(result.assumeYes, true);
  assert.deepEqual(result.modes, []);
});

test('parseArguments recognizes uninstall with modes and -y', () => {
  const result = parseArguments(['uninstall', 'codex', '-y']);
  assert.equal(result.command, 'uninstall');
  assert.equal(result.assumeYes, true);
  assert.deepEqual(result.modes, ['codex']);
});

test('parseArguments recognizes tools <name> --help pattern', () => {
  const result = parseArguments(['tools', 'filter-logs', '--help']);
  assert.equal(result.command, 'tool');
  assert.equal(result.toolName, 'filter-logs');
  assert.deepEqual(result.toolArgs, ['--help']);
});

test('parseArguments recognizes tools without a tool name shows tools help', () => {
  const result = parseArguments(['tools']);
  assert.equal(result.command, 'tools-help');
  assert.equal(result.showToolsHelp, true);
});

test('parseArguments recognizes tools --help', () => {
  const result = parseArguments(['tools', '--help']);
  assert.equal(result.command, 'tools-help');
  assert.equal(result.showToolsHelp, true);
});

test('parseArguments recognizes direct tool invocation', () => {
  const result = parseArguments(['filter-logs', 'app.log', '--count-only']);
  assert.equal(result.command, 'tool');
  assert.equal(result.toolName, 'filter-logs');
  assert.deepEqual(result.toolArgs, ['app.log', '--count-only']);
});

test('parseArguments recognizes explicit install command', () => {
  const result = parseArguments(['install', 'codex', '--copy']);
  assert.equal(result.command, 'install');
  assert.equal(result.explicitInstallCommand, true);
  assert.deepEqual(result.modes, ['codex']);
  assert.equal(result.linkMode, 'copy');
});

test('parseArguments recognizes --home flag', () => {
  const result = parseArguments(['codex', '--home', '/custom/path']);
  assert.equal(result.command, 'install');
  assert.equal(result.toolkitHome, '/custom/path');
  assert.deepEqual(result.modes, ['codex']);
});

test('parseArguments recognizes install help topic with --help and modes', () => {
  const result = parseArguments(['codex', '--help']);
  assert.equal(result.helpTopic, 'install');
  assert.equal(result.showHelp, true);
});

test('parseArguments recognizes uninstall help topic', () => {
  const result = parseArguments(['uninstall', '--help']);
  assert.equal(result.helpTopic, 'uninstall');
  assert.equal(result.showHelp, true);
});

test('parseArguments handles tools (plural) as tool command', () => {
  const result = parseArguments(['tools', 'create-specs', 'Feature Name']);
  assert.equal(result.command, 'tool');
  assert.equal(result.toolName, 'create-specs');
  assert.deepEqual(result.toolArgs, ['Feature Name']);
});

test('parseArguments defaults to install command with no arguments', () => {
  const result = parseArguments([]);
  assert.equal(result.command, 'install');
  assert.deepEqual(result.modes, []);
  assert.equal(result.showHelp, false);
});

test('parseArguments uninstall with --home', () => {
  const result = parseArguments(['uninstall', 'codex', '--yes', '--home', '/tmp/alt-home']);
  assert.equal(result.command, 'uninstall');
  assert.equal(result.assumeYes, true);
  assert.equal(result.toolkitHome, '/tmp/alt-home');
  assert.deepEqual(result.modes, ['codex']);
});

test('parseArguments throws for --home without a value', () => {
  assert.throws(
    () => parseArguments(['codex', '--home']),
    /Missing value for --home/,
  );
});

test('parseArguments throws for uninstall --home without a value', () => {
  assert.throws(
    () => parseArguments(['uninstall', 'codex', '--home']),
    /Missing value for --home/,
  );
});
