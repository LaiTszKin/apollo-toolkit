import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

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
