import type { ToolExample } from '../types';

export function formatExamples(examples: ToolExample[] = []): string {
  return examples.map(({ command, result }) => (
    `  ${command}\n    Result: ${result}`
  )).join('\n');
}
