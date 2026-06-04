import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createToolRunner, UserInputError, SystemError, AppError } from '@laitszkin/tool-utils';

function createMemoryStream() {
  let data = '';
  return { write(chunk) { data += chunk; return true; }, toString() { return data; } };
}

describe('Handler error propagation via createToolRunner', () => {
  it('formats UserInputError without "Error:" prefix', async () => {
    const schema = {
      options: {},
      handler: async () => { throw new UserInputError('user input problem'); },
    };
    const runner = createToolRunner(schema);
    const stderr = createMemoryStream();
    const exitCode = await runner([], { stdout: createMemoryStream(), stderr });
    assert.strictEqual(exitCode, 1);
    assert.strictEqual(stderr.toString(), 'user input problem\n');
  });

  it('formats SystemError with stack trace', async () => {
    const schema = {
      options: {},
      handler: async () => { throw new SystemError('system failure'); },
    };
    const runner = createToolRunner(schema);
    const stderr = createMemoryStream();
    const exitCode = await runner([], { stdout: createMemoryStream(), stderr });
    assert.strictEqual(exitCode, 1);
    const output = stderr.toString();
    assert.ok(output.startsWith('system failure\n'));
    assert.ok(output.includes('SystemError: system failure'));
  });

  it('formats generic Error with "Error:" prefix', async () => {
    const schema = {
      options: {},
      handler: async () => { throw new Error('generic problem'); },
    };
    const runner = createToolRunner(schema);
    const stderr = createMemoryStream();
    const exitCode = await runner([], { stdout: createMemoryStream(), stderr });
    assert.strictEqual(exitCode, 1);
    assert.strictEqual(stderr.toString(), 'Error: generic problem\n');
  });

  it('formats plain AppError with "Error:" prefix (base class branch)', async () => {
    const schema = {
      options: {},
      handler: async () => { throw new AppError('base app error'); },
    };
    const runner = createToolRunner(schema);
    const stderr = createMemoryStream();
    const exitCode = await runner([], { stdout: createMemoryStream(), stderr });
    assert.strictEqual(exitCode, 1);
    assert.strictEqual(stderr.toString(), 'Error: base app error\n');
  });

  it('propagates direct throw from handler to createToolRunner catch', async () => {
    const schema = {
      options: {},
      handler: async () => { throw new Error('no try/catch wrapper'); },
    };
    const runner = createToolRunner(schema);
    const stderr = createMemoryStream();
    const exitCode = await runner([], { stdout: createMemoryStream(), stderr });
    assert.strictEqual(exitCode, 1);
    assert.strictEqual(stderr.toString(), 'Error: no try/catch wrapper\n');
  });

  it('propagates throw from nested function to createToolRunner catch', async () => {
    const innerFn = () => { throw new Error('nested error'); };
    const schema = {
      options: {},
      handler: async () => { innerFn(); },
    };
    const runner = createToolRunner(schema);
    const stderr = createMemoryStream();
    const exitCode = await runner([], { stdout: createMemoryStream(), stderr });
    assert.strictEqual(exitCode, 1);
    assert.strictEqual(stderr.toString(), 'Error: nested error\n');
  });
});
