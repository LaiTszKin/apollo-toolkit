import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('execCommand shell behavior', () => {
  it('resolves with stdout on successful command', async () => {
    const { execCommand } = await import('../packages/cli/dist/updater.js');
    const result = await execCommand('node', ['--version']);
    assert.ok(result.stdout.trim().startsWith('v'));
  });

  it('rejects on non-zero exit code', async () => {
    const { execCommand } = await import('../packages/cli/dist/updater.js');
    await assert.rejects(
      () => execCommand('node', ['--no-such-flag']),
      (err) => {
        assert.ok(err instanceof Error);
        return true;
      },
    );
  });
});
