import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { createToolDispatcher } from '../dist/isolation.js';

// =========================================================================
// FIX-01: isolation.ts dispatch() 真實執行 Read 工具
// =========================================================================
describe('FIX-01: isolation.ts dispatch() 真實執行 Read 工具', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fix01-'));

  // 在 workspace 內建立測試檔案
  const specPath = path.join(tmpDir, 'spec.md');
  fs.writeFileSync(specPath, '# Test Spec', 'utf-8');

  const dispatcher = createToolDispatcher({ workspaceDir: tmpDir });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('應能真實讀取 workspace 內現有檔案', async () => {
    const result = await dispatcher.dispatch({
      tool: 'Read',
      params: { file_path: 'spec.md' },
    });

    assert.equal(result.success, true);
    assert.equal(result.tool, 'Read');
    assert.ok(result.data.includes('# Test Spec'), `Expected data to contain "# Test Spec", got "${result.data}"`);
  });

  it('讀取不存在的檔案應回傳失敗', async () => {
    const result = await dispatcher.dispatch({
      tool: 'Read',
      params: { file_path: 'missing.txt' },
    });

    assert.equal(result.success, false);
    assert.ok(
      result.data.includes('File not found: missing.txt'),
      `Expected error message about missing file, got "${result.data}"`,
    );
  });

  it('無 workspaceDir 時 Read 應回傳模擬結果', async () => {
    const simulatedDispatcher = createToolDispatcher();
    const result = await simulatedDispatcher.dispatch({
      tool: 'Read',
      params: { file_path: 'spec.md' },
    });

    assert.equal(result.success, true);
    assert.ok(
      result.data.startsWith('[simulated]'),
      `Expected simulated result, got "${result.data}"`,
    );
    assert.ok(result.data.includes('spec.md'), `Expected path in simulated response, got "${result.data}"`);
  });
});
