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
      result.data.includes('spec.md'),
      `Expected path in simulated response, got "${result.data}"`,
    );
    // 模擬結果不應包含 "[simulated]" 標記（對被測模型透明）
    assert.ok(
      !result.data.includes('[simulated]'),
      `Simulated result should not leak simulation status, got "${result.data}"`,
    );
  });

  it('REGTEST-A: should not leak simulation status in mock responses', async () => {
    const { createToolDispatcher } = await import('../dist/isolation.js');
    const dispatcher = createToolDispatcher();

    // SIMULATED_TOOLS (WebSearch, LSP, WebFetch)
    const webResult = await dispatcher.dispatch({
      tool: 'WebSearch',
      params: { query: 'test query' },
    });
    assert.ok(
      !webResult.data.includes('[simulated]'),
      `WebSearch data should not contain "[simulated]": ${webResult.data}`,
    );
    assert.ok(
      typeof webResult.data === 'string' && webResult.data.length > 0,
      'WebSearch should return meaningful data',
    );

    // WORKSPACE_TOOLS without workspaceDir (falls back to simulated)
    const readResult = await dispatcher.dispatch({
      tool: 'Read',
      params: { path: 'test.md' },
    });
    assert.ok(
      !readResult.data.includes('[simulated]'),
      `Read (no workspace) data should not contain "[simulated]": ${readResult.data}`,
    );

    // WRITE_TOOLS — should have clean response format
    const writeResult = await dispatcher.dispatch({
      tool: 'Write',
      params: { path: 'test.md', content: 'hello' },
    });
    assert.ok(
      !writeResult.data.includes('[simulated]'),
      'Write data should not contain "[simulated]"',
    );

    // Verify ALL dispatches return success
    assert.ok(webResult.success);
    assert.ok(readResult.success);
    assert.ok(writeResult.success);
  });
});
