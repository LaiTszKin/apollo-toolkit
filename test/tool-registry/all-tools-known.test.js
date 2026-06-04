import test from 'node:test';
import assert from 'node:assert/strict';
import { isKnownToolName } from '../../packages/cli/dist/tool-registration.js';

// NOTE: This list derives from packages/cli/tool-registration.ts TOOL_MODULE_NAMES.
// When adding/removing a tool, update BOTH files. The alias list below also
// derives from the addToolAlias() calls in tool-registration.ts.
const TOOL_NAMES = [
  'filter-logs',
  'search-logs',
  'validate-skill-frontmatter',
  'validate-openai-agent-config',
  'sync-memory-index',
  'open-github-issue',
  'find-github-issues',
  'read-github-issue',
  'review-threads',
  'extract-conversations',
  'docs-to-voice',
  'render-katex',
  'render-error-book',
  'generate-storyboard-images',
  'enforce-video-aspect-ratio',
  'architecture',
  'codegraph',
  'eval',
  'create-specs',
  'create-review-report',
  'extract-pdf-text',
];

// 3 aliases added in TOOL_NAMES set
const ALIASES = [
  'extract-pdf-text-pdfkit',
  'extract-codex-conversations',
  'extract-skill-conversations',
];

test('all 21 tool names are recognized by isKnownToolName', () => {
  for (const name of TOOL_NAMES) {
    assert.equal(isKnownToolName(name), true, `Expected isKnownToolName('${name}') to be true`);
  }
});

test('all 3 aliases are recognized by isKnownToolName', () => {
  for (const alias of ALIASES) {
    assert.equal(isKnownToolName(alias), true, `Expected isKnownToolName('${alias}') to be true`);
  }
});

test('unknown tool names return false from isKnownToolName', () => {
  assert.equal(isKnownToolName('nonexistent-tool'), false);
  assert.equal(isKnownToolName(''), false);
});

test('tool names list contains at least 21 entries', () => {
  assert.ok(TOOL_NAMES.length >= 21, `Expected at least 21 tool names, got ${TOOL_NAMES.length}`);
});
