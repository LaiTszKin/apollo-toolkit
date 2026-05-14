import path from 'node:path';
import type { ToolContext } from '../types';

export function architectureHandler(args: string[], context: ToolContext): Promise<number> {
  const sourceRoot = context.sourceRoot || path.resolve(__dirname, '..', '..', '..');

  // Delegate to the existing atlas CLI (still in JS)
  const cliPath = path.join(sourceRoot, 'init-project-html', 'lib', 'atlas', 'cli.js');

  try {
    const cli = require(cliPath);
    return cli.dispatch(args, {
      stdout: context.stdout || process.stdout,
      stderr: context.stderr || process.stderr,
    });
  } catch (error: any) {
    (context.stderr || process.stderr).write(`Error loading atlas CLI: ${error.message}\n`);
    return Promise.resolve(1);
  }
}
