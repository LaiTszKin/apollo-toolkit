import path from 'node:path';
import type { ToolContext } from '../types';

const LEGACY_VERBS = new Set(['open', 'diff']);

export function architectureHandler(args: string[], context: ToolContext): Promise<number> {
  const sourceRoot = context.sourceRoot || path.resolve(__dirname, '..', '..', '..');

  // Delegate to the existing atlas CLI (still in JS)
  const cliPath = path.join(sourceRoot, 'init-project-html', 'lib', 'atlas', 'cli.js');

  try {
    const cli = require(cliPath);

    const verb = args[0];
    if (!verb || verb.startsWith('-') || LEGACY_VERBS.has(verb)) {
      // Sync execution for legacy verbs
      const code = cli.main(args, {
        stdout: context.stdout || process.stdout,
        stderr: context.stderr || process.stderr,
      });
      return Promise.resolve(code);
    }

    // Async dispatch for declarative verbs
    return cli.dispatch(args, {
      stdout: context.stdout || process.stdout,
      stderr: context.stderr || process.stderr,
    });
  } catch (error: any) {
    (context.stderr || process.stderr).write(`Error loading atlas CLI: ${error.message}\n`);
    return Promise.resolve(1);
  }
}
