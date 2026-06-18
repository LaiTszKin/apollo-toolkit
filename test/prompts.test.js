import test from 'node:test';
import assert from 'node:assert/strict';
import { promptForModes, promptYesNo } from '@laitszkin/tui';

/**
 * Create a mock readline-like stream for prompt tests.
 * On Windows, @inquirer/prompts calls output.on('keypress', ...) even
 * when isTTY is false, so the mock needs an on() method.
 */
function mockStream(isTTY = false) {
  return { isTTY, on: () => mockStream(isTTY) };
}

test('promptForModes throws when not in a TTY', async () => {
  const input = mockStream(false);
  const output = mockStream(false);
  await assert.rejects(
    () =>
      promptForModes({
        input,
        output,
        message: 'test',
        choices: [{ name: 'opt', value: 'opt', description: 'desc' }],
      }),
    /Interactive selection requires a TTY/,
  );
});

test('promptForModes throws when input is null', async () => {
  await assert.rejects(
    () =>
      promptForModes({
        input: null,
        output: { isTTY: true },
        message: 'test',
        choices: [{ name: 'opt', value: 'opt', description: 'desc' }],
      }),
    /Interactive selection requires a TTY/,
  );
});

test('promptForModes throws when output is null', async () => {
  await assert.rejects(
    () =>
      promptForModes({
        input: { isTTY: true },
        output: null,
        message: 'test',
        choices: [{ name: 'opt', value: 'opt', description: 'desc' }],
      }),
    /Interactive selection requires a TTY/,
  );
});

test('promptYesNo returns default (true) when not in a TTY', async () => {
  const result = await promptYesNo({
    input: mockStream(false),
    output: mockStream(false),
    message: 'Continue?',
    default: true,
  });
  assert.equal(result, true);
});

test('promptYesNo returns default (false) when not in a TTY', async () => {
  const result = await promptYesNo({
    input: mockStream(false),
    output: mockStream(false),
    message: 'Continue?',
    default: false,
  });
  assert.equal(result, false);
});

test('promptYesNo returns true as default when default is omitted and not TTY', async () => {
  const result = await promptYesNo({
    input: mockStream(false),
    output: mockStream(false),
    message: 'Continue?',
  });
  assert.equal(result, true);
});

test('promptYesNo returns false when input is null and not TTY', async () => {
  const result = await promptYesNo({
    input: null,
    output: { isTTY: false },
    message: 'Continue?',
    default: false,
  });
  assert.equal(result, false);
});
