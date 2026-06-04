import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { UserInputError, SystemError } from '@laitszkin/tool-utils';

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

test('sync-memory-index handler propagates UserInputError without Error: prefix', async (t) => {
  t.mock.method(fs, 'mkdirSync', () => {
    throw new UserInputError('agents file path is invalid');
  });

  const { tool: syncMemoryIndexTool } = await import('@laitszkin/tool-sync-memory-index');
  const handler = syncMemoryIndexTool.handler;
  const stdout = createMemoryStream();
  const stderr = createMemoryStream();

  const code = await handler(['--agents-file', '/some/path'], { stdout, stderr });

  assert.equal(code, 1);
  assert.ok(
    stderr.toString().includes('agents file path is invalid'),
    `Expected stderr to contain "agents file path is invalid", got: ${JSON.stringify(stderr.toString())}`,
  );
  // UserInputError must not have "Error:" prefix (delegated to createToolRunner)
  assert.ok(
    !stderr.toString().includes('Error:'),
    `Expected stderr not to contain "Error:", got: ${JSON.stringify(stderr.toString())}`,
  );
});

test('sync-memory-index handler propagates SystemError without Error: prefix', async (t) => {
  t.mock.method(fs, 'mkdirSync', () => {
    throw new SystemError('disk write failure');
  });

  const { tool: syncMemoryIndexTool } = await import('@laitszkin/tool-sync-memory-index');
  const handler = syncMemoryIndexTool.handler;
  const stdout = createMemoryStream();
  const stderr = createMemoryStream();

  const code = await handler(['--agents-file', '/some/path'], { stdout, stderr });

  assert.equal(code, 1);
  assert.ok(
    stderr.toString().includes('disk write failure\n'),
    `Expected stderr to contain "disk write failure", got: ${JSON.stringify(stderr.toString())}`,
  );
  // SystemError must not have "Error: " prefix (delegated to createToolRunner);
  // stderr may contain "Error" as substring in "SystemError:" stack type label
  assert.ok(
    !stderr.toString().startsWith('Error:'),
    `Expected stderr not to start with "Error:", got: ${JSON.stringify(stderr.toString())}`,
  );
  // createToolRunner outputs stack trace for SystemError
  assert.ok(
    stderr.toString().includes('at '),
    `Expected stderr to contain a stack trace, got: ${JSON.stringify(stderr.toString())}`,
  );
});
