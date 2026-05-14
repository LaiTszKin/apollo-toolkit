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
  /** Direct function reference for the tool handler (replaces spawn-based execution). */
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

export type InstallMode = 'codex' | 'openclaw' | 'trae' | 'agents' | 'claude-code';

export interface InstallTarget {
  id: InstallMode;
  label: string;
  description: string;
  root?: string;
}

export interface InstallResult {
  skillNames: string[];
  linkMode: 'symlink' | 'copy';
  targets: { label: string; root: string }[];
}

export interface ManifestData {
  version: string;
  installedAt: string;
  linkMode: string;
  skills: string[];
  historicalSkills: string[];
}

export interface SyncResult {
  previousSkillNames: string[];
}

export interface ParsedArguments {
  command: 'install' | 'uninstall' | 'tool' | 'tools-help';
  modes: InstallMode[];
  showHelp: boolean;
  showToolsHelp: boolean;
  toolkitHome: string | null;
  toolName: string | null;
  toolArgs: string[];
  linkMode: 'copy' | 'symlink' | null;
  assumeYes: boolean;
  explicitInstallCommand: boolean;
  helpTopic: string;
}

export interface CliContext {
  sourceRoot?: string;
  stdout?: NodeJS.WriteStream;
  stderr?: NodeJS.WriteStream;
  stdin?: NodeJS.ReadStream;
  env?: NodeJS.ProcessEnv;
  execCommand?: Function;
  confirmUpdate?: Function;
  runTool?: Function;
  spawnCommand?: Function;
}
