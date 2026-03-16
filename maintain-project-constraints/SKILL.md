---
name: maintain-project-constraints
description: Automatically create and maintain AGENTS.md so it stays aligned with the current repository architecture, core business flow, project purpose, and coding conventions. Use when AGENTS.md is missing or may be outdated after code changes.
---

# Maintain Project Constraints

## Dependencies

- Required: none.
- Conditional: none.
- Optional: none.
- Fallback: not applicable.

## Standards

- Evidence: Infer repository architecture, business flow, and conventions from current code and docs rather than assumptions.
- Execution: Create or align `AGENTS.md` only after building a concrete inventory of implemented capabilities.
- Quality: Keep every statement traceable, remove stale guidance, and ensure `Core business flow` stays exhaustive and concrete.
- Output: Maintain a concise root-level `AGENTS.md` with the required sections and repository-specific wording.

## Goal

Keep `AGENTS.md` accurate, actionable, and synchronized with the latest state of the repository.

## Trigger Conditions

Invoke this skill when either condition is true:

1. `AGENTS.md` does not exist and the user needs this repository to expose agent-facing guidance.
2. `AGENTS.md` exists but may have drifted after code changes, refactors, or workflow updates.

After completing any code modification task, proactively run this skill to verify `AGENTS.md` is still aligned, and update it if needed.

## Required Outputs

`AGENTS.md` must include these sections (use concise, repository-specific content):

- Project architecture
- Core business flow
- Core project purpose
- Code style and coding conventions

For the `Core business flow` section, always use this format:

1. One short sentence that summarizes what the repository currently enables.
2. An exhaustive unordered list of the repository's current existing functions/capabilities.
3. Each bullet must be a short capability statement, preferably in the style of `- Users can ...` or the repository-equivalent actor phrasing.

Example:

```markdown

## Core Business Flow

This project enables users to manage and run reusable automation workflows.

- Users can create a workflow from a local template.
- Users can update an existing workflow configuration.
- Users can validate workflow inputs before execution.
- Users can run the workflow and inspect the result.
```

## Workflow

### 1) Build factual understanding first

- Confirm whether `AGENTS.md` exists.
- Read the repository before writing:
  - root docs (`README`, contribution docs, design docs)
  - key source directories and entry points
  - user-facing features such as commands, routes, workflows, tasks, or installable modules
  - representative modules that show coding patterns
  - test directories and tooling/config files
- Infer architecture and conventions from real code, not assumptions.
- Build a concrete inventory of all currently implemented capabilities before drafting `Core business flow`.

### 2) Create AGENTS.md when missing

When `AGENTS.md` is absent:

- Create a new root-level `AGENTS.md`.
- Document architecture, business flow, purpose, and coding conventions from observed facts.
- Write `Core business flow` as one summary sentence followed by unordered bullets that cover every current capability found in the repository.
- Keep language specific to this repository; avoid generic boilerplate.

### 3) Align AGENTS.md when drift is detected

When `AGENTS.md` exists but is outdated:

- Re-read changed or high-impact modules.
- Update only sections that no longer match reality.
- Expand or trim the `Core business flow` bullet list so it still covers all currently implemented capabilities.
- Preserve correct existing content and structure where possible.

### 4) Quality checks before finishing

- Ensure every statement in `AGENTS.md` is traceable to current repository files.
- Remove stale paths, renamed components, and obsolete workflows.
- Verify the `Core business flow` section includes a one-sentence summary plus unordered bullets for all currently existing capabilities; do not leave major functions unlisted.
- Keep instructions concise, concrete, and operational for future agents.

## Writing Rules

- Use clear headings and short bullet points.
- Prefer repository terms already used in code/docs.
- Do not include speculative architecture claims.
- In `Core business flow`, prefer many short bullets over a few vague bullets; when the product grows, add more bullets so the list remains exhaustive.
- Keep the document focused on how agents should understand and operate in this project.
