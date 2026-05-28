import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ToolDefinition, ToolContext } from '@laitszkin/tool-registry';

export async function architectureHandler(args: string[], context: ToolContext): Promise<number> {
  const sourceRoot = context.sourceRoot || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');

  // Delegate to the existing atlas CLI (still in JS)
  // FIXED: added 'skills/' prefix that was missing in the original lib/tools/architecture.ts path.join call
  const cliPath = path.join(sourceRoot, 'skills', 'init-project-html', 'lib', 'atlas', 'cli.js');

  try {
    const cliModule = await import(cliPath);
    const cli = cliModule.default;
    return cli.dispatch(args, {
      stdout: context.stdout || process.stdout,
      stderr: context.stderr || process.stderr,
    });
  } catch (error: any) {
    (context.stderr || process.stderr).write(`Error loading atlas CLI: ${error.message}\n`);
    return 1;
  }
}

export const tool: ToolDefinition = {
  name: 'architecture',
  category: 'Planning & architecture',
  skill: 'init-project-html',
  description: 'Open the project HTML architecture atlas, or render a paginated diff (`architecture diff`).',
  handler: architectureHandler,
};

export const yargsCommand = {
  command: 'architecture [args...]',
  describe: 'Open the project HTML architecture atlas, or render a paginated diff.',
  builder: (yargs: any) => yargs.strict(),
  handler: async (argv: any) => {
    const toolArgs: string[] = [];
    for (const [key, value] of Object.entries(argv)) {
      if (key === '_' || key === '$0') continue;
      if (value === true) {
        toolArgs.push(`--${key}`);
      } else if (value !== false && value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          for (const v of value) {
            toolArgs.push(`--${key}`, String(v));
          }
        } else {
          toolArgs.push(`--${key}`, String(value));
        }
      }
    }
    return architectureHandler(toolArgs, {});
  },
};
