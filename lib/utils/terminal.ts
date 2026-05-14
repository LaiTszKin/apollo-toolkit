export function supportsColor(stream: { isTTY?: boolean }, env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(stream && stream.isTTY && !env.NO_COLOR);
}

export function supportsAnimation(stream: { isTTY?: boolean }, env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(stream && stream.isTTY && !env.CI && env.APOLLO_TOOLKIT_NO_ANIMATION !== '1');
}

export function color(text: string, code: string, enabled: boolean): string {
  if (!enabled) return text;
  return `\x1b[${code}m${text}\x1b[0m`;
}

export function clearScreen(output: { isTTY?: boolean; write: (str: string) => boolean }): void {
  if (output.isTTY) {
    output.write('\x1b[2J\x1b[H');
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
