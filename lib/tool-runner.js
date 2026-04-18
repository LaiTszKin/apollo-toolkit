const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const TOOL_COMMANDS = [
  {
    name: 'filter-logs',
    skill: 'analyse-app-logs',
    script: 'analyse-app-logs/scripts/filter_logs_by_time.py',
    runner: 'python3',
    description: 'Filter log lines by timestamp window.',
    aliases: ['filter-logs-by-time'],
  },
  {
    name: 'search-logs',
    skill: 'analyse-app-logs',
    script: 'analyse-app-logs/scripts/search_logs.py',
    runner: 'python3',
    description: 'Search logs by keyword or regex.',
  },
  {
    name: 'docs-to-voice',
    skill: 'docs-to-voice',
    script: 'docs-to-voice/scripts/docs_to_voice.py',
    runner: 'python3',
    description: 'Convert text into audio, timeline JSON, and SRT.',
  },
  {
    name: 'create-specs',
    skill: 'generate-spec',
    script: 'generate-spec/scripts/create-specs',
    runner: 'python3',
    description: 'Create spec planning documents from templates.',
  },
  {
    name: 'render-katex',
    skill: 'katex',
    script: 'katex/scripts/render_katex.py',
    runner: 'python3',
    description: 'Render TeX with KaTeX into reusable output.',
  },
  {
    name: 'render-error-book',
    skill: 'learning-error-book',
    script: 'learning-error-book/scripts/render_error_book_json_to_pdf.py',
    runner: 'python3',
    description: 'Render structured error-book JSON into PDF.',
  },
  {
    name: 'open-github-issue',
    skill: 'open-github-issue',
    script: 'open-github-issue/scripts/open_github_issue.py',
    runner: 'python3',
    description: 'Publish or draft a structured GitHub issue.',
  },
  {
    name: 'generate-storyboard-images',
    skill: 'openai-text-to-image-storyboard',
    script: 'openai-text-to-image-storyboard/scripts/generate_storyboard_images.py',
    runner: 'python3',
    description: 'Generate storyboard image sets from text.',
  },
  {
    name: 'find-github-issues',
    skill: 'read-github-issue',
    script: 'read-github-issue/scripts/find_issues.py',
    runner: 'python3',
    description: 'List GitHub issues through gh.',
  },
  {
    name: 'read-github-issue',
    skill: 'read-github-issue',
    script: 'read-github-issue/scripts/read_issue.py',
    runner: 'python3',
    description: 'Read GitHub issue details through gh.',
  },
  {
    name: 'review-threads',
    skill: 'resolve-review-comments',
    script: 'resolve-review-comments/scripts/review_threads.py',
    runner: 'python3',
    description: 'List or resolve GitHub PR review threads.',
  },
  {
    name: 'enforce-video-aspect-ratio',
    skill: 'text-to-short-video',
    script: 'text-to-short-video/scripts/enforce_video_aspect_ratio.py',
    runner: 'python3',
    description: 'Resize video output to a target aspect ratio.',
  },
  {
    name: 'extract-pdf-text-pdfkit',
    skill: 'weekly-financial-event-report',
    script: 'weekly-financial-event-report/scripts/extract_pdf_text_pdfkit.swift',
    runner: 'swift',
    description: 'Extract PDF text with macOS PDFKit fallback.',
  },
  {
    name: 'extract-codex-conversations',
    skill: 'codex-memory-manager',
    script: 'codex/codex-memory-manager/scripts/extract_recent_conversations.py',
    runner: 'python3',
    description: 'Extract recent Codex sessions for memory updates.',
  },
  {
    name: 'sync-codex-memory-index',
    skill: 'codex-memory-manager',
    script: 'codex/codex-memory-manager/scripts/sync_memory_index.py',
    runner: 'python3',
    description: 'Sync the Codex memory index in AGENTS.md.',
  },
  {
    name: 'extract-skill-conversations',
    skill: 'learn-skill-from-conversations',
    script: 'codex/learn-skill-from-conversations/scripts/extract_recent_conversations.py',
    runner: 'python3',
    description: 'Extract recent Codex sessions for skill learning.',
  },
  {
    name: 'validate-skill-frontmatter',
    skill: 'maintain-skill-catalog',
    script: 'scripts/validate_skill_frontmatter.py',
    runner: 'python3',
    description: 'Validate SKILL.md frontmatter across the catalog.',
  },
  {
    name: 'validate-openai-agent-config',
    skill: 'maintain-skill-catalog',
    script: 'scripts/validate_openai_agent_config.py',
    runner: 'python3',
    description: 'Validate every skill agents/openai.yaml config.',
  },
];

const TOOL_BY_NAME = new Map();

for (const tool of TOOL_COMMANDS) {
  TOOL_BY_NAME.set(tool.name, tool);
  for (const alias of tool.aliases || []) {
    TOOL_BY_NAME.set(alias, { ...tool, name: alias, canonicalName: tool.name });
  }
}

function getToolCommand(name) {
  return TOOL_BY_NAME.get(name) || null;
}

function listToolCommands() {
  return [...TOOL_COMMANDS].sort((left, right) => left.name.localeCompare(right.name));
}

function resolveToolCommand(name, sourceRoot) {
  const tool = getToolCommand(name);
  if (!tool) {
    return null;
  }

  return {
    ...tool,
    scriptPath: path.join(sourceRoot, tool.script),
  };
}

function formatToolList() {
  const tools = listToolCommands();
  const width = tools.reduce((max, tool) => Math.max(max, tool.name.length), 0);
  return tools.map((tool) => {
    const name = tool.name.padEnd(width, ' ');
    return `  ${name}  ${tool.description}`;
  }).join('\n');
}

function runTool(toolName, toolArgs, context = {}) {
  const sourceRoot = context.sourceRoot || path.resolve(__dirname, '..');
  const stderr = context.stderr || process.stderr;
  const env = context.env || process.env;
  const spawnCommand = context.spawnCommand || spawn;
  const tool = resolveToolCommand(toolName, sourceRoot);

  if (!tool) {
    stderr.write(`Unknown tool: ${toolName}\n\nAvailable tools:\n${formatToolList()}\n`);
    return Promise.resolve(1);
  }

  if (!fs.existsSync(tool.scriptPath)) {
    stderr.write(`Tool script not found: ${tool.scriptPath}\n`);
    return Promise.resolve(1);
  }

  return new Promise((resolve) => {
    const child = spawnCommand(tool.runner, [tool.scriptPath, ...toolArgs], {
      cwd: context.cwd || process.cwd(),
      env,
      stdio: context.stdio || 'inherit',
    });

    child.on('error', (error) => {
      stderr.write(`Failed to start ${tool.runner}: ${error.message}\n`);
      resolve(1);
    });

    child.on('close', (code) => {
      resolve(typeof code === 'number' ? code : 1);
    });
  });
}

module.exports = {
  formatToolList,
  getToolCommand,
  listToolCommands,
  resolveToolCommand,
  runTool,
};
