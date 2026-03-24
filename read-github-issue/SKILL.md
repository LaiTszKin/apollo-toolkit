---
name: read-github-issue
description: Read and search remote GitHub issues via GitHub CLI (`gh`). Use when users ask to list issues, filter issue candidates, inspect a specific issue with comments, or gather issue context before planning follow-up work.
---

# Read GitHub Issue

## Dependencies

- Required: none.
- Conditional: none.
- Optional: none.
- Fallback: If `gh` is unavailable or unauthenticated, stop and report the exact blocked command instead of guessing repository state.

## Standards

- Evidence: Verify repository context first, then read remote issue data directly from `gh issue list` / `gh issue view` instead of paraphrasing from memory.
- Execution: Confirm the target repo, find candidate issues with the bundled script, then inspect the chosen issue with comments and structured fields.
- Quality: Keep the skill focused on issue discovery and retrieval only; do not embed any hardcoded fixing, branching, PR, or push workflow.
- Output: Return candidate issues, selected issue details, comments summary, and any missing information needed before follow-up work.

## Overview

Use this skill to gather trustworthy GitHub issue context with `gh`: discover open or closed issues, narrow them with labels or search text, then inspect a chosen issue in detail before any separate planning or implementation workflow begins.

## Prerequisites

- `gh` is installed and authenticated (`gh auth status`).
- The current directory is a git repository with the correct `origin`, or the user provides `--repo owner/name`.

## Workflow

### 1) Verify repository and remote context

- Run `gh repo view --json nameWithOwner,isPrivate,defaultBranchRef` to confirm target repo.
- If the user specifies another repository, always use `--repo <owner>/<repo>` in issue commands.

### 2) Find candidate issues with the bundled script

- Preferred command:

```bash
python3 scripts/find_issues.py --limit 50 --state open
```

- Optional filters:
  - `--repo owner/name`
  - `--label bug`
  - `--search "panic in parser"`
- If the issue target is still unclear, present top candidates and ask which issue number or URL should be inspected next.

### 3) Read a specific issue in detail

- Preferred command:

```bash
python3 scripts/read_issue.py 123 --comments
```

- Optional flags:
  - `--repo owner/name`
  - `--json`
  - `--comments`
- Use the returned title, body, labels, assignees, state, timestamps, and comments to summarize the issue precisely.

### 4) Summarize gaps before any follow-up action

- Identify missing acceptance criteria, repro details, affected components, or environment context.
- If issue text and comments are insufficient, state exactly what is missing instead of inventing a fix plan.

## Included Script

### `scripts/find_issues.py`

- Purpose: consistent remote issue listing via `gh issue list`.
- Outputs a readable table by default, or JSON with `--output json`.
- Uses only GitHub CLI so it reflects remote GitHub state.

### `scripts/read_issue.py`

- Purpose: deterministic issue detail retrieval via `gh issue view`.
- Outputs either a human-readable summary or full JSON for downstream automation.
- Can include issue comments so the agent can read the latest discussion before taking any other step.
