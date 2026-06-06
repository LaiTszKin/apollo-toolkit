import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('generate-storyboard-images failure return', () => {
  it('storyboard returns non-zero on API failure', { timeout: 30000 }, async () => {
    const { run } = await import('../../packages/cli/dist/index.js');
    const stdout = [];
    const stderr = [];

    // Call storyboard with --content-name but no API url/key/prompts
    // The handler requires --api-url, --api-key, and --prompt(s) or --prompts-file
    // When these are missing, the handler should return non-zero.
    const exitCode = await run(['generate-storyboard-images', '--content-name', 'test-failure'], {
      sourceRoot: process.cwd(),
      stdout: { write(s) { stdout.push(s); } },
      stderr: { write(s) { stderr.push(s); } },
    });

    // After FIX-05, failures should result in non-zero exit code
    assert.notStrictEqual(exitCode, 0,
      'Handler should return non-zero when image generation fails');
  });
});
