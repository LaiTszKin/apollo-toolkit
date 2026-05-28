import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { tool as filterLogsTool } from '@laitszkin/tool-filter-logs';

const filterLogsHandler = /** @type {import('@laitszkin/tool-registry').ToolDefinition['handler']} */ (filterLogsTool.handler);

function createMemoryStream() {
  let data = '';
  return {
    write(chunk) {
      data += chunk;
      return true;
    },
    toString() {
      return data;
    },
  };
}

async function createTempLog(content) {
  const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'filter-logs-test-'));
  const logPath = path.join(tmpDir, 'test.log');
  await fs.promises.writeFile(logPath, content, 'utf8');
  return { logPath, tmpDir };
}

test('filter-logs reports count-only when requested', async () => {
  const { logPath, tmpDir } = await createTempLog(
    '2026-03-24T10:00:00Z INFO start\n2026-03-24T10:15:00Z INFO end\n'
  );
  const stdout = createMemoryStream();
  const stderr = createMemoryStream();

  try {
    const code = await filterLogsHandler(
      [logPath, '--count-only'],
      { stdout, stderr },
    );
    assert.equal(code, 0, stderr.toString());
    const output = stdout.toString();
    assert.match(output, /^2$/m);
  } finally {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  }
});

test('filter-logs filters by start timestamp', async () => {
  const { logPath, tmpDir } = await createTempLog(
    '2026-03-24T09:00:00Z INFO early\n2026-03-24T10:00:00Z INFO start\n2026-03-24T10:15:00Z INFO end\n'
  );
  const stdout = createMemoryStream();
  const stderr = createMemoryStream();

  try {
    const code = await filterLogsHandler(
      [logPath, '--start', '2026-03-24T10:00:00Z'],
      { stdout, stderr },
    );
    assert.equal(code, 0, stderr.toString());
    const output = stdout.toString();
    assert.ok(output.includes('start'));
  } finally {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  }
});

test('filter-logs rejects invalid timestamps', async () => {
  const stdout = createMemoryStream();
  const stderr = createMemoryStream();
  const code = await filterLogsHandler(
    ['--start', 'invalid-timestamp'],
    { stdout, stderr },
  );
  assert.notEqual(code, 0);
});
