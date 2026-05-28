export interface ToolHelp {
  purpose: string;
  useWhen: string[];
  insteadOf?: string[];
  examples?: ToolExample[];
}

export interface ToolExample {
  command: string;
  result: string;
}

export type RunnerKind = 'node' | 'python3' | 'swift';

export interface ToolDefinition {
  name: string;
  category: string;
  skill?: string;
  script?: string;
  runner?: RunnerKind;
  description: string;
  aliases?: string[];
  help?: ToolHelp;
  handler?: (args: string[], context: ToolContext) => Promise<number>;
  canonicalName?: string;
}

export interface ToolContext {
  sourceRoot?: string;
  stdout?: NodeJS.WriteStream;
  stderr?: NodeJS.WriteStream;
  env?: NodeJS.ProcessEnv;
  spawnCommand?: Function;
  cwd?: string;
  stdio?: any;
}
