import { Chalk } from 'chalk';

// Force-enabled chalk instance — the `enabled` parameter on `color()` already
// handles the TTY / NO_COLOR check, so we always produce ANSI codes here.
const forceChalk = new Chalk({ level: 1 });

// ANSI code → chalk function mapping for backward compatibility
const ANSI_MAP: Record<string, (s: string) => string> = {
  '1': (s: string) => forceChalk.bold(s),
  '2': (s: string) => forceChalk.dim(s),
  '1;32': (s: string) => forceChalk.bold.green(s),
  '1;33': (s: string) => forceChalk.bold.yellow(s),
  '1;36': (s: string) => forceChalk.bold.cyan(s),
  '1;31': (s: string) => forceChalk.bold.red(s),
  '1;37': (s: string) => forceChalk.bold.white(s),
};

export function supportsColor(stream: { isTTY?: boolean }, env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(stream && stream.isTTY && !env.NO_COLOR);
}

export function supportsAnimation(stream: { isTTY?: boolean }, env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(stream && stream.isTTY && !env.CI && env.APOLLO_TOOLKIT_NO_ANIMATION !== '1');
}

export function color(text: string, code: string, enabled: boolean): string {
  if (!enabled) return text;
  const fn = ANSI_MAP[code];
  return fn ? fn(text) : text;
}

export function clearScreen(output: { isTTY?: boolean; write: (str: string) => boolean }): void {
  if (output.isTTY) {
    output.write('\x1b[2J\x1b[H');
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
