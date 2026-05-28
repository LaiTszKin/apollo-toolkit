import { registerTool } from '@laitszkin/tool-registry';

// Import all tool definitions
import { tool as filterLogs } from '@laitszkin/tool-filter-logs';
import { tool as searchLogs } from '@laitszkin/tool-search-logs';
import { tool as validateSkillFrontmatter } from '@laitszkin/tool-validate-skill-frontmatter';
import { tool as validateOpenaiAgentConfig } from '@laitszkin/tool-validate-openai-agent-config';
import { tool as syncMemoryIndex } from '@laitszkin/tool-sync-memory-index';
import { tool as openGitHubIssue } from '@laitszkin/tool-open-github-issue';
import { tool as findGitHubIssues } from '@laitszkin/tool-find-github-issues';
import { tool as readGitHubIssue } from '@laitszkin/tool-read-github-issue';
import { tool as reviewThreads } from '@laitszkin/tool-review-threads';
import { tool as extractConversations } from '@laitszkin/tool-extract-conversations';
import { tool as docsToVoice } from '@laitszkin/tool-docs-to-voice';
import { tool as renderKatex } from '@laitszkin/tool-render-katex';
import { tool as renderErrorBook } from '@laitszkin/tool-render-error-book';
import { tool as generateStoryboardImages } from '@laitszkin/tool-generate-storyboard-images';
import { tool as enforceVideoAspectRatio } from '@laitszkin/tool-enforce-video-aspect-ratio';
import { tool as architecture } from '@laitszkin/tool-architecture';
import { tool as createSpecs } from '@laitszkin/tool-create-specs';
import { tool as createReviewReport } from '@laitszkin/tool-create-review-report';
import { tool as extractPdfText } from '@laitszkin/tool-extract-pdf-text';

const ALL_TOOLS = [
  filterLogs,
  searchLogs,
  validateSkillFrontmatter,
  validateOpenaiAgentConfig,
  syncMemoryIndex,
  openGitHubIssue,
  findGitHubIssues,
  readGitHubIssue,
  reviewThreads,
  extractConversations,
  docsToVoice,
  renderKatex,
  renderErrorBook,
  generateStoryboardImages,
  enforceVideoAspectRatio,
  architecture,
  createSpecs,
  createReviewReport,
  extractPdfText,
];

export function registerAllTools(): void {
  for (const tool of ALL_TOOLS) {
    registerTool(tool);
  }
}
