---
name: maintain-project-constraints
description: Automatically create and maintain AGENTS.md/CLAUDE.md so it stays aligned with the current repository architecture, core business flow, common commands, macro project purpose, and coding conventions. Use when AGENTS.md/CLAUDE.md is missing or may be outdated after code changes.
---

# Maintain Project Constraints

## Dependencies

- Required: none.
- Conditional: none.
- Optional: none.
- Fallback: not applicable.

## Standards

- Evidence: Infer repository architecture, business flow, and conventions from current code and docs rather than assumptions.
- Execution: Create or align `AGENTS.md/CLAUDE.md` only after building a concrete inventory of implemented capabilities.
- Quality: Keep every statement traceable, remove stale guidance, and ensure `Core business flow` stays exhaustive and concrete.
- Output: Maintain a concise root-level `AGENTS.md/CLAUDE.md` with the required sections, repository-specific wording, and a factual `Common Commands` section when the repository exposes stable command entry points.

## Goal

Keep `AGENTS.md/CLAUDE.md` accurate, actionable, and synchronized with the latest state of the repository.

## Trigger Conditions

Invoke this skill when either condition is true:

1. `AGENTS.md/CLAUDE.md` does not exist and the user needs this repository to expose agent-facing guidance.
2. `AGENTS.md/CLAUDE.md` exists but may have drifted after code changes, refactors, or workflow updates.

After completing any code modification task, proactively run this skill to verify `AGENTS.md/CLAUDE.md` is still aligned, and update it if needed.

## Required Outputs

`AGENTS.md/CLAUDE.md` must include these sections (use concise, repository-specific content):

- Project architecture
- Core business flow
- Common commands
- Core project purpose
- Code style and coding conventions

For the `Core project purpose` section, always use this format:

1. Describe the repository's macro purpose instead of repeating implemented features.
2. State what broader problem the project is meant to solve or what outcome it aims to achieve.
3. Prefer product- or business-level intent framing when applicable.
4. Keep it concise, but make sure the purpose is understandable without reading the rest of the document.

For the `Common Commands` section, always use this format:

1. Include only commands that are real, current, and useful in this repository.
2. Prefer repository-owned entry points such as package scripts, CLIs, `bin/` programs, `scripts/`, `Makefile`, `justfile`, or other documented task runners.
3. For each command, explain when to use it in one short phrase instead of listing bare commands with no context.
4. Prioritize commands that help an agent inspect, validate, build, test, or operate repository-specific workflows.
5. Do not invent commands, aliases, flags, or task names that are not traceable to the repository.

For the `Core business flow` section, always use this format:

1. One short sentence that summarizes what the repository currently enables.
2. An exhaustive unordered list of the repository's current existing functions/capabilities.
3. Each bullet must be a short capability statement, preferably in the style of `- Users can ...` or the repository-equivalent actor phrasing.

Example:

```markdown

## Common Commands

- `npm test` — run the repository's automated test suite.
- `apltk validate-skill-frontmatter` — validate every top-level `SKILL.md` frontmatter block.
- `apltk validate-openai-agent-config` — validate every `agents/openai.yaml` interface config.
- `apltk codex` — install the current toolkit into the local Codex skills directory.

## Core Business Flow

This project enables users to manage and run reusable automation workflows.

- Users can create a workflow from a local template.
- Users can update an existing workflow configuration.
- Users can validate workflow inputs before execution.
- Users can run the workflow and inspect the result.
```

## Workflow

### 1) Build factual understanding first

- Confirm whether `AGENTS.md/CLAUDE.md` exists.
- Read the repository before writing:
  - root docs (`README`, contribution docs, design docs)
  - key source directories and entry points
  - repository command surfaces such as `package.json`, `bin/`, `scripts/`, `Makefile`, `justfile`, or equivalent task runners
  - user-facing features such as commands, routes, workflows, tasks, or installable modules
  - representative modules that show coding patterns
  - test directories and tooling/config files
- Infer architecture and conventions from real code, not assumptions.
- Build a concrete inventory of all currently implemented capabilities before drafting `Core business flow`.
- Build a separate inventory of stable, repository-specific commands before drafting `Common Commands`.

### 2) Create AGENTS.md/CLAUDE.md when missing

When `AGENTS.md/CLAUDE.md` is absent:

- Create a new root-level `AGENTS.md/CLAUDE.md`.
- Document architecture, business flow, purpose, and coding conventions from observed facts.
- Write `Core project purpose` as the repository's macro intent, such as the problem it aims to solve or the outcome it exists to achieve, rather than as a feature list.
- Document the repository's common commands from observed command entry points and docs.
- Write `Core business flow` as one summary sentence followed by unordered bullets that cover every current capability found in the repository.
- Write `Common commands` as short bullets in the style of ``- `command` — when to use it.``.
- Keep language specific to this repository; avoid generic boilerplate.

### 3) Align AGENTS.md/CLAUDE.md when drift is detected

When `AGENTS.md/CLAUDE.md` exists but is outdated:

- Re-read changed or high-impact modules.
- Update only sections that no longer match reality.
- Expand or trim the `Core business flow` bullet list so it still covers all currently implemented capabilities.
- Expand, trim, or replace the `Common Commands` list whenever command entry points or recommended workflows have changed.
- Preserve correct existing content and structure where possible.

### 4) Quality checks before finishing

- Ensure every statement in `AGENTS.md/CLAUDE.md` is traceable to current repository files.
- Remove stale paths, renamed components, and obsolete workflows.
- Remove stale commands, flags, or task names that no longer exist.
- Verify every command in `Common Commands` is either documented in repository docs or directly supported by the current codebase.
- Verify the `Core business flow` section includes a one-sentence summary plus unordered bullets for all currently existing capabilities; do not leave major functions unlisted.
- Verify `Core project purpose` explains the repository's macro goal and does not merely restate the feature inventory.
- Keep instructions concise, concrete, and operational for future agents.

## Writing Rules

- Use clear headings and short bullet points.
- Prefer repository terms already used in code/docs.
- Do not include speculative architecture claims.
- In `Core project purpose`, describe why the project exists at a macro level; for example, what user or business problem it solves, not a restatement of `Core business flow`.
- In `Core business flow`, prefer many short bullets over a few vague bullets; when the product grows, add more bullets so the list remains exhaustive.
- In `Common Commands`, prefer the smallest useful set of high-signal commands over an exhaustive dump of every helper script.
- Keep the document focused on how agents should understand and operate in this project.
