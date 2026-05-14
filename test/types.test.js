const test = require('node:test');
const assert = require('node:assert/strict');

test('ToolDefinition type is usable', () => {
  const def = {
    name: 'test-tool',
    category: 'Test',
    description: 'A test tool',
  };
  assert.equal(def.name, 'test-tool');
  assert.equal(def.category, 'Test');
});

test('ParsedArguments shape is usable', () => {
  const parsed = {
    command: 'install',
    modes: [],
    showHelp: false,
    showToolsHelp: false,
    toolkitHome: null,
    toolName: null,
    toolArgs: [],
    linkMode: null,
    assumeYes: false,
    explicitInstallCommand: false,
    helpTopic: 'overview',
  };
  assert.equal(parsed.command, 'install');
  assert.equal(parsed.helpTopic, 'overview');
  assert.deepEqual(parsed.modes, []);
  assert.equal(parsed.linkMode, null);
});

test('InstallMode union values are valid', () => {
  const modes = ['codex', 'openclaw', 'trae', 'agents', 'claude-code'];
  assert.ok(modes.includes('codex'));
  assert.ok(modes.includes('claude-code'));
  assert.equal(modes.length, 5);
});
