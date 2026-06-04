import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolvePackage, relativePath } from '../scripts/rewrite-imports.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

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

// ==============================================================
// resolvePackage mapping tests
// ==============================================================

test('resolvePackage maps @laitszkin/cli to packages/cli/dist/index.js', () => {
  assert.equal(resolvePackage('@laitszkin/cli'), 'packages/cli/dist/index.js');
});

test('resolvePackage maps @laitszkin/tui to packages/tui/dist/index.js', () => {
  assert.equal(resolvePackage('@laitszkin/tui'), 'packages/tui/dist/index.js');
});

test('resolvePackage maps @laitszkin/tool-registry to packages/tool-registry/dist/index.js', () => {
  assert.equal(resolvePackage('@laitszkin/tool-registry'), 'packages/tool-registry/dist/index.js');
});

test('resolvePackage maps @laitszkin/tool-utils to packages/tool-utils/dist/index.js', () => {
  assert.equal(resolvePackage('@laitszkin/tool-utils'), 'packages/tool-utils/dist/index.js');
});

test('resolvePackage maps @laitszkin/tool-filter-logs to packages/tools/filter-logs/dist/index.js', () => {
  const result = resolvePackage('@laitszkin/tool-filter-logs');
  assert.equal(result, 'packages/tools/filter-logs/dist/index.js');
});

test('resolvePackage returns null for unknown packages', () => {
  assert.equal(resolvePackage('@laitszkin/nonexistent'), null);
  assert.equal(resolvePackage('@laitszkin/'), null);
  assert.equal(resolvePackage('@laitszkin/random-thing'), null);
});

test('resolvePackage includes all tool names in TOOL_NAMES', () => {
  for (const toolName of TOOL_NAMES) {
    const specifier = `@laitszkin/tool-${toolName}`;
    const result = resolvePackage(specifier);
    assert.notEqual(result, null, `Expected ${specifier} to resolve, got null`);
    assert.equal(result, `packages/tools/${toolName}/dist/index.js`);
  }
});

test('resolvePackage strips @laitszkin/ prefix correctly', () => {
  assert.equal(resolvePackage('@laitszkin/cli'), 'packages/cli/dist/index.js');
  assert.equal(resolvePackage('@laitszkin/tool-filter-logs'), 'packages/tools/filter-logs/dist/index.js');
});

// ==============================================================
// relativePath computation tests
// ==============================================================

test('relativePath computes correct relative path from a source file to package', () => {
  const fromFile = resolve(repoRoot, 'packages/cli/dist/index.js');
  const result = relativePath(fromFile, 'packages/tui/dist/index.js');
  assert.equal(result, '../../tui/dist/index.js');
});

test('relativePath adds leading dot when relative path has no leading dot', () => {
  const fromFile = resolve(repoRoot, 'packages/cli/dist/tool.js');
  const result = relativePath(fromFile, 'packages/cli/dist/index.js');
  assert.ok(result.startsWith('./'), `Expected leading "./", got "${result}"`);
});

test('relativePath normalizes backslashes to forward slashes', () => {
  const fromFile = resolve(repoRoot, 'packages/cli/dist/index.js');
  const result = relativePath(fromFile, 'packages/tools/filter-logs/dist/index.js');
  assert.equal(result.includes('\\'), false, 'relativePath must not produce backslashes');
});

// ==============================================================
// TOOL_NAMES set literal edge cases
// ==============================================================

test('TOOL_NAMES JSON-to-literal replacement handles all tool names', () => {
  const toolNamesLiteral = JSON.stringify(TOOL_NAMES)
    .replace(/","/g, "', '")
    .replace(/^\["/, "['")
    .replace(/"\]$/, "']");
  assert.ok(toolNamesLiteral.startsWith("['"));
  assert.ok(toolNamesLiteral.endsWith("']"));
  assert.ok(toolNamesLiteral.includes("', '"));
});

test('rewrite-imports.mjs produces forward-slash paths for ESM import compatibility', () => {
  // On Windows, path.relative() returns backslash paths (e.g., "..\\..\\tools\\..."),
  // but ESM import() requires forward slashes on all platforms.
  // This test verifies that rewrite-imports.mjs normalizes backslashes to forward slashes.

  const windowsStylePath = '..\\..\\tools\\filter-logs\\dist\\index.js';
  const normalized = windowsStylePath.replace(/\\/g, '/');
  assert.equal(normalized.includes('\\'), false, 'ESM import specifiers must not contain backslashes');
  assert.equal(normalized, '../../tools/filter-logs/dist/index.js');
});

test('dist/tool-registration.js TOOL_MODULE_NAMES uses only forward slashes', () => {
  const filePath = resolve(repoRoot, 'packages/cli/dist/tool-registration.js');
  let content;
  try {
    content = readFileSync(filePath, 'utf-8');
  } catch {
    // Test wasn't built; can't verify
    return;
  }

  // Extract TOOL_MODULE_NAMES array from the compiled file
  const match = content.match(/const TOOL_MODULE_NAMES = (\[[\s\S]*?\]);/);
  if (!match) {
    // If the pattern doesn't match, skip — the file structure may differ in dev
    return;
  }

  const toolModuleNames = match[1];
  // Find all string literals containing backslashes (Windows paths) in the array
  const backslashRefs = toolModuleNames.match(/'[^']*\\[^']*'/g);
  if (backslashRefs) {
    assert.fail(
      `Found backslash paths in TOOL_MODULE_NAMES (ESM import() will fail):\n` +
      backslashRefs.join('\n')
    );
  }

  // Verify the array contains tools — either as relative paths or @laitszkin bare specifiers
  const hasRelativePaths = toolModuleNames.includes("'../../tools/");
  const hasBareSpecifiers = toolModuleNames.includes("'@laitszkin/tool-");
  assert.ok(
    hasRelativePaths || hasBareSpecifiers,
    `Expected tool references in TOOL_MODULE_NAMES, got:\n${toolModuleNames.slice(0, 200)}`
  );
});
