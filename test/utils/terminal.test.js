const test = require('node:test');
const assert = require('node:assert/strict');
const { color, supportsColor, sleep } = require('../../dist/lib/utils/terminal');

test('color() wraps text with ANSI codes when enabled', () => {
  const result = color('hello', '1;32', true);
  assert.match(result, /\x1b\[1;32mhello\x1b\[0m/);
});

test('color() returns plain text when disabled', () => {
  const result = color('hello', '1;32', false);
  assert.equal(result, 'hello');
  assert.ok(!result.includes('\x1b'));
});

test('color() with different codes produces different ANSI sequences', () => {
  const red = color('error', '1;31', true);
  const green = color('ok', '1;32', true);
  assert.match(red, /\x1b\[1;31merror\x1b\[0m/);
  assert.match(green, /\x1b\[1;32mok\x1b\[0m/);
});

test('color() handles empty strings', () => {
  assert.equal(color('', '1;32', true), '\x1b[1;32m\x1b[0m');
  assert.equal(color('', '1;32', false), '');
});

test('supportsColor() returns true for TTY streams without NO_COLOR', () => {
  assert.equal(
    supportsColor({ isTTY: true }, { NO_COLOR: '' }),
    true,
  );
  assert.equal(
    supportsColor({ isTTY: true }, {}),
    true,
  );
});

test('supportsColor() returns false for non-TTY streams', () => {
  assert.equal(
    supportsColor({ isTTY: false }, {}),
    false,
  );
  assert.equal(
    supportsColor(null, {}),
    false,
  );
});

test('supportsColor() returns false when NO_COLOR is set', () => {
  assert.equal(
    supportsColor({ isTTY: true }, { NO_COLOR: '1' }),
    false,
  );
});

test('supportsColor() returns false when NO_COLOR is any truthy value', () => {
  assert.equal(
    supportsColor({ isTTY: true }, { NO_COLOR: 'true' }),
    false,
  );
});

test('sleep() resolves after the given delay', async () => {
  const start = Date.now();
  await sleep(50);
  const elapsed = Date.now() - start;
  assert.ok(elapsed >= 40, `Expected >= 40ms, got ${elapsed}ms`);
});
