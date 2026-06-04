import test from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs } from 'node:util';

test('generate-storyboard-images schema passes multiple --prompt values as array', () => {
  const { values } = parseArgs({
    options: {
      prompt: { type: 'string', multiple: true },
    },
    args: ['--prompt', 'A cat sits on a mat', '--prompt', 'A dog runs in the park'],
    strict: false,
  });
  assert.deepStrictEqual(values.prompt, ['A cat sits on a mat', 'A dog runs in the park']);
});

test('single --prompt returns single-element array', () => {
  const { values } = parseArgs({
    options: {
      prompt: { type: 'string', multiple: true },
    },
    args: ['--prompt', 'A single scene'],
    strict: false,
  });
  assert.deepStrictEqual(values.prompt, ['A single scene']);
});

test('no --prompt returns undefined', () => {
  const { values } = parseArgs({
    options: {
      prompt: { type: 'string', multiple: true },
    },
    args: ['--prompts-file', 'test.txt'],
    strict: false,
  });
  assert.strictEqual(values.prompt, undefined);
});
