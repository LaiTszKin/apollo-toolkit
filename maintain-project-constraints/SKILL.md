---
name: maintain-project-constraints
description: Automatically create and maintain AGENTS.md so it stays aligned with the current repository architecture, core business flow, project purpose, and coding conventions. Use when AGENTS.md is missing or may be outdated after code changes.
---

# Maintain Project Constraints

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

## Workflow

### 1) Build factual understanding first

- Confirm whether `AGENTS.md` exists.
- Read the repository before writing:
  - root docs (`README`, contribution docs, design docs)
  - key source directories and entry points
  - representative modules that show coding patterns
  - test directories and tooling/config files
- Infer architecture and conventions from real code, not assumptions.

### 2) Create AGENTS.md when missing

When `AGENTS.md` is absent:

- Create a new root-level `AGENTS.md`.
- Document architecture, business flow, purpose, and coding conventions from observed facts.
- Keep language specific to this repository; avoid generic boilerplate.

### 3) Align AGENTS.md when drift is detected

When `AGENTS.md` exists but is outdated:

- Re-read changed or high-impact modules.
- Update only sections that no longer match reality.
- Preserve correct existing content and structure where possible.

### 4) Quality checks before finishing

- Ensure every statement in `AGENTS.md` is traceable to current repository files.
- Remove stale paths, renamed components, and obsolete workflows.
- Keep instructions concise, concrete, and operational for future agents.

## Writing Rules

- Use clear headings and short bullet points.
- Prefer repository terms already used in code/docs.
- Do not include speculative architecture claims.
- Keep the document focused on how agents should understand and operate in this project.
