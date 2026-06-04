import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function createMemoryStream() {
  let data = '';
  return {
    write(chunk) { data += chunk; return true; },
    toString() { return data; },
  };
}

test('architectureHandler returns 1 for nonexistent YAML in apply', async () => {
  const { architectureHandler } = await import(
    '../../packages/tools/architecture/dist/index.js'
  );
  const stderr = createMemoryStream();
  const context = {
    stdout: { write: () => {} },
    stderr,
  };

  const result = await architectureHandler(
    ['apply', '/dev/null/nonexistent-spec.yaml'],
    context,
  );
  assert.strictEqual(result, 1);
  const err = stderr.toString();
  assert.ok(err.length > 0, 'stderr should have content');
  assert.ok(
    err.includes('Error parsing apply YAML'),
    'should mention YAML parsing error',
  );
});

test('architectureHandler returns 1 for apply with missing slug (UserInputError)', async () => {
  const { architectureHandler } = await import(
    '../../packages/tools/architecture/dist/index.js'
  );

  const tmpDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'apltk-arch-err-'),
  );
  const yamlPath = path.join(tmpDir, 'invalid.yaml');

  try {
    fs.writeFileSync(
      yamlPath,
      'features:\n  - action: add\n',
      'utf8',
    );

    const stderr = createMemoryStream();
    const stdout = createMemoryStream();
    const context = {
      stdout,
      stderr,
    };

    const result = await architectureHandler(
      ['apply', yamlPath],
      context,
    );
    assert.strictEqual(result, 1);
    const err = stderr.toString();
    assert.ok(err.length > 0, 'stderr should have content');
    // Regression: errors in handleApply must be written to stderr
    // (post FIX-03: UserInputError is written as-is without "Batch aborted:" prefix)
    assert.ok(
      err.includes('"features" entry missing required "slug" field'),
      'should contain the validation error message',
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('architectureHandler returns 1 for template without args', async () => {
  const { architectureHandler } = await import(
    '../../packages/tools/architecture/dist/index.js'
  );
  const stderr = createMemoryStream();
  const context = {
    stdout: { write: () => {} },
    stderr,
  };

  const result = await architectureHandler(['template'], context);
  assert.strictEqual(result, 1);
  assert.ok(
    stderr.toString().includes('Usage: apltk architecture template'),
  );
});

test('architectureHandler returns 1 for unknown subcommand', async () => {
  const { architectureHandler } = await import(
    '../../packages/tools/architecture/dist/index.js'
  );
  const stderr = createMemoryStream();
  const context = {
    stdout: { write: () => {} },
    stderr,
  };

  const result = await architectureHandler(['invalid-cmd'], context);
  assert.strictEqual(result, 1);
  assert.ok(stderr.toString().length > 0, 'stderr should have content');
});

test('architectureHandler writes usage for apply without yaml arg', async () => {
  const { architectureHandler } = await import(
    '../../packages/tools/architecture/dist/index.js'
  );
  const stderr = createMemoryStream();
  const context = {
    stdout: { write: () => {} },
    stderr,
  };

  const result = await architectureHandler(['apply'], context);
  assert.strictEqual(result, 1);
  assert.ok(
    stderr.toString().includes('Usage: apltk architecture apply'),
  );
});

test('architectureHandler writes "Batch aborted:" for generic errors', async () => {
  const { architectureHandler } = await import(
    '../../packages/tools/architecture/dist/index.js'
  );

  const tmpDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'apltk-arch-gen-'),
  );
  const yamlPath = path.join(tmpDir, 'generic-error.yaml');

  try {
    // "features" as a mapping (object) instead of a sequence (array)
    // causes a TypeError in the for-of loop inside handleApply's try block.
    // Since TypeError is not UserInputError or SystemError, it triggers the
    // catch block's else branch, which writes "Batch aborted:" to stderr.
    fs.writeFileSync(
      yamlPath,
      'features:\n  slug: feat-a\n  action: add\n',
      'utf8',
    );

    const stderr = createMemoryStream();
    const context = {
      stdout: { write: () => {} },
      stderr,
    };

    const result = await architectureHandler(
      ['apply', yamlPath],
      context,
    );
    assert.strictEqual(result, 1);
    const err = stderr.toString();
    assert.ok(err.length > 0, 'stderr should have content');
    assert.ok(
      err.includes('Batch aborted:'),
      `stderr should contain "Batch aborted:", got: ${err}`,
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
