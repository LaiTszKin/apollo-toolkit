---
name: maintain-project-constraints
description: Create and maintain AGENTS.md/CLAUDE.md with the project's macro business goals, common development commands, and an index of all standardized project documentation under docs/. Use when AGENTS.md/CLAUDE.md is missing or may be outdated.
---

# Maintain Project Constraints

## Dependencies

- Required: none.
- Conditional: none.
- Optional: none.
- Fallback: not applicable.

## Standards

- Evidence: Infer project business goals and common commands from current code, configuration, and existing project documentation — not assumptions.
- Execution: Read the entire codebase or existing project docs before writing; create or update only after building a concrete inventory.
- Quality: Remove stale commands, paths, and references; keep AGENTS.md/CLAUDE.md focused on the three required sections only.
- Output: Maintain a concise root-level `AGENTS.md`/`CLAUDE.md` with common development commands, macro business goals, and a project documentation index.

## Goal

Keep `AGENTS.md`/`CLAUDE.md` accurate and synchronized with the current state of the repository, focused on helping agents understand the project's purpose, navigate its documentation, and run common development tasks.

## Trigger Conditions

Invoke this skill when:

1. `AGENTS.md` or `CLAUDE.md` does not exist.
2. `AGENTS.md` or `CLAUDE.md` exists but may have drifted after code changes, documentation updates, or workflow changes.
3. After `align-project-documents` has updated the `docs/` structure and the document index needs to be refreshed.

## Required Output Format

`AGENTS.md`/`CLAUDE.md` must contain exactly three sections:

### 1. Common Development Commands

- Include only commands that are real, current, and useful in this repository.
- Prefer repository-owned entry points: package scripts, CLIs, `bin/` programs, `scripts/`, `Makefile`, `justfile`, or equivalent task runners.
- For each command, explain when to use it in one short phrase.
- Prioritize commands that help an agent inspect, validate, build, test, or operate the repository.
- Do not invent commands, aliases, flags, or task names not traceable to the repository.

### 2. Project Business Goals

- Describe the project's macro business purpose: what problem it solves, what outcome it aims to achieve, who it serves.
- Write at the product or business level, not at the implementation level.
- Keep it concise but self-contained — a reader should understand why the project exists without reading other documents.

### 3. Project Documentation Index

- List all standardized project documentation files under `docs/`.
- Organize by category: `docs/features/`, `docs/architecture/`, `docs/principles/`.
- For each document, provide the file path and a one-line description of what it covers.
- List any additional root-level documentation files (e.g., `README.md`, `CONTRIBUTING.md`, `SECURITY.md`).

### Template Example

```markdown
## Common Development Commands

- `npm test` — run the test suite.
- `npm run build` — compile the project for production.
- `apltk validate-skill-frontmatter` — validate every top-level `SKILL.md` frontmatter block.

## Project Business Goals

This project enables users to manage and run reusable automation workflows.
It solves the problem of scattered, inconsistent automation scripts by providing a unified catalog of versioned, validated skills.

## Project Documentation Index

### Features (`docs/features/`)

- `docs/features/skill-management.md` — skill creation, editing, and lifecycle management
- `docs/features/validation.md` — skill and configuration validation workflows

### Architecture (`docs/architecture/`)

- `docs/architecture/skill-system.md` — skill loading, resolution, and execution model
- `docs/architecture/validation-pipeline.md` — validation pipeline design

### Principles (`docs/principles/`)

- `docs/principles/naming-conventions.md` — file and identifier naming rules
- `docs/principles/dependency-management.md` — internal and external dependency rules

### Root Documents

- `README.md` — project overview and quick start
```

## Workflow

### 1) Build factual understanding

- Read the repository entry points, configuration, and command surfaces (`package.json`, `bin/`, `scripts/`, `Makefile`, etc.).
- If standardized project documentation exists under `docs/`, read `docs/features/`, `docs/architecture/`, and `docs/principles/` to understand the documented capabilities and to build the index.
- If `docs/` does not exist or is incomplete, read the source code directly to extract business goals and common commands.
- Build a concrete inventory of:
  - Every stable, repository-specific command.
  - The project's macro business purpose (from docs, README, or inferred from the codebase's capabilities).
  - Every file under `docs/` that should appear in the index.

### 2) Extract macro business goals

- Derive the project's business purpose from:
  1. Existing documentation (`README.md`, `docs/features/`) if available.
  2. The set of user-facing capabilities found in the codebase.
- Write at the product level: what problem does this solve? who uses it? what outcome does it produce?
- Do not restate implementation details or list features; the document index already points to feature docs.

### 3) Write or update AGENTS.md/CLAUDE.md

- If `AGENTS.md` exists, update it. If `CLAUDE.md` exists, update it. If both exist, update both with identical content for the three sections.
- If neither exists, check for the repository's convention and create the appropriate file.
- Write only the three sections: Common Development Commands, Project Business Goals, Project Documentation Index.
- Do not add architecture descriptions, code style guidance, business flows, or any content that belongs in `docs/`.

### 4) Maintain the project documentation index

- Enumerate every file under `docs/features/`, `docs/architecture/`, and `docs/principles/`.
- For each file, write a one-line description of what it covers.
- List root-level documentation files (`README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md`, etc.) that exist in the repository.
- Keep the index synchronized with the actual files on disk; remove entries for deleted files and add entries for new files.

### 5) Quality checks before finishing

- Verify every command in Common Development Commands is traceable to a repository entry point.
- Verify Project Business Goals describes the macro purpose, not a feature list.
- Verify every file listed in the Documentation Index exists on disk.
- Verify the index covers all files under `docs/features/`, `docs/architecture/`, and `docs/principles/`.
- If both `AGENTS.md` and `CLAUDE.md` exist, verify their content is consistent.
- Remove any sections beyond the three required ones.

## Writing Rules

- Keep the document concise and scannable.
- Use the repository's own terminology.
- Do not speculate about architecture or implementation details.
- In Project Business Goals, describe the macro purpose; for example, the user or business problem the project solves.
- In the Documentation Index, prefer descriptive one-line summaries over bare file paths.
- When both `AGENTS.md` and `CLAUDE.md` exist, keep their content identical for the three sections.
