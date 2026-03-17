---
name: fix-github-issues
description: Resolve issues from remote GitHub repositories via GitHub CLI (`gh`), implement and validate fixes locally, then either open a pull request through `open-source-pr-workflow` (or `open-pr-workflow` in environments that use that alias) or hand off to `commit-and-push` when the user explicitly wants a direct push. Use when users ask to list remote issues, pick one or more issues to fix, and deliver the result through a linked PR or an explicit direct-push workflow.
---

# Fix GitHub Issues

## Dependencies

- Required: `systematic-debug` for diagnosis and validated fixes.
- Conditional: `open-source-pr-workflow` (or `open-pr-workflow`) when the user wants a PR; `commit-and-push` when the user explicitly wants a direct commit/push flow.
- Optional: none.
- Fallback: If the required handoff for the user's requested delivery mode is unavailable, stop and report the blocked dependency instead of improvising another release path.

## Standards

- Evidence: Verify repository context, fetch remote issue details, and derive expected behavior from issue text before coding.
- Execution: Select the issue, open an isolated worktree by default, fix it through `systematic-debug`, validate locally, then hand off to the delivery workflow that matches the user's request.
- Quality: Keep scope limited to the selected issue, capture exact validation commands, and preserve issue linkage in the final PR or commit message.
- Output: Finish with either a linked PR or a direct pushed commit, then clean up the temporary worktree when the work is complete.

## Overview

Use this skill to run an end-to-end issue-fixing loop with `gh`: discover open issues, select a target, implement and test the fix, then hand off either to `open-source-pr-workflow` for PR submission or to `commit-and-push` when the user explicitly wants a direct push.

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

### 4) Open worktree by default after issue selection

- Immediately create and enter an isolated worktree once the issue number is selected and confirmed.
- Use a compliant branch name (`codex/{change_type}/{changes}`) and keep all edits in that worktree.
- If the user explicitly asks to stay in the current tree, follow that request; otherwise worktree is the default path.

### 5) Implement the fix with `systematic-debug`

- Execute the `systematic-debug` workflow: inspect, reproduce with tests, diagnose, then apply minimal fix.
- Keep scope limited to the selected issue.
- Reuse existing code patterns and avoid unrelated refactors.

### 6) Validate the fix

- Run focused tests/lint/build relevant to the touched area.
- Capture exact commands and outcomes; these will be reused in the PR body.
- Ensure the change can be linked back to the issue number.

### 7) Open PR via dependency skill

- If the user explicitly asks to commit and push directly, invoke `commit-and-push` instead of opening a PR.
- In direct-push mode:
  - keep the issue number in the commit message or final summary when appropriate
  - state the exact target branch the user requested
  - push only after validation is complete
- Otherwise invoke `open-source-pr-workflow` (or `open-pr-workflow` if that alias exists in the environment).
- In PR mode, provide:
  - issue number or link
  - motivation and engineering decisions
  - executed test commands and results
- Include issue-closing reference (for example, `Closes #<issue-number>`) whenever a PR is opened.

### 8) Clean up the temporary worktree after PR creation

- Once the PR is opened or the direct push is complete and no more work is needed in that isolated tree, remove the worktree you created for the fix.
- Also clean up the matching local branch reference if it is no longer needed locally.

## Included Script

### `scripts/list_issues.py`

- Purpose: consistent remote issue listing via `gh issue list`.
- Outputs a readable table by default, or JSON with `--output json`.
- Uses only GitHub CLI so it reflects remote GitHub state.
