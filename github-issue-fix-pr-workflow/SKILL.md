---
name: github-issue-fix-pr-workflow
description: Resolve issues from remote GitHub repositories via GitHub CLI (`gh`), implement and validate fixes locally, then open a pull request through `open-source-pr-workflow` (or `open-pr-workflow` in environments that use that alias). Use when users ask to list remote issues, pick one or more issues to fix, and submit a PR linked to those issues.
---

# GitHub Issue Fix PR Workflow

## Overview

Use this skill to run an end-to-end issue-fixing loop with `gh`: discover open issues, select a target, implement and test the fix, and delegate PR creation to `open-source-pr-workflow` (or `open-pr-workflow` alias).

## Prerequisites

- `gh` is installed and authenticated (`gh auth status`).
- The current directory is a git repository with the correct `origin`.
- The repository has test or validation commands that can prove the fix.

## Workflow

### 1) Verify repository and remote context

- Run `gh repo view --json nameWithOwner,isPrivate,defaultBranchRef` to confirm target repo.
- If the user specifies another repository, always use `--repo <owner>/<repo>` in issue commands.
- Run `git fetch --all --prune` before implementation.

### 2) List remote issues with GitHub CLI

- Preferred command:

```bash
python3 scripts/list_issues.py --limit 50 --state open
```

- Optional filters:
  - `--repo owner/name`
  - `--label bug`
  - `--search "panic in parser"`
- If the issue target is still unclear, present top candidates and ask the user which issue number to fix.

### 3) Read issue details before coding

- Run `gh issue view <issue-number> --comments` (plus `--repo` when needed).
- Identify expected behavior, edge cases, and acceptance signals from issue text/comments.
- Do not guess missing requirements; ask the user when critical details are ambiguous.

### 4) Implement the fix

- Create or update a compliant branch for the change (`codex/{change_type}/{changes}`).
- Keep scope limited to the selected issue.
- Reuse existing code patterns and avoid unrelated refactors.

### 5) Validate the fix

- Run focused tests/lint/build relevant to the touched area.
- Capture exact commands and outcomes; these will be reused in the PR body.
- Ensure the change can be linked back to the issue number.

### 6) Open PR via dependency skill

- After code is ready, invoke `open-source-pr-workflow` (or `open-pr-workflow` if that alias exists in the environment).
- Provide required PR context:
  - issue number or link
  - motivation and engineering decisions
  - executed test commands and results
- Include issue-closing reference (for example, `Closes #<issue-number>`).

## Included Script

### `scripts/list_issues.py`

- Purpose: consistent remote issue listing via `gh issue list`.
- Outputs a readable table by default, or JSON with `--output json`.
- Uses only GitHub CLI so it reflects remote GitHub state.
