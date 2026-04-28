---
name: ship-github-issue-fix
description: Resolve a GitHub issue in an existing repository and submit the fix directly to the requested branch without opening a PR or doing release work. Use when users ask to read issue N, implement the fix, decide whether planning artifacts are needed, run the relevant tests, and commit/push the result to `main` or another specified branch.
---

# Ship GitHub Issue Fix

## Dependencies

- Required: `read-github-issue`, `enhance-existing-features`, `recover-missing-plan`, and `commit-and-push`.
- Conditional: `systematic-debug` when the issue is primarily a bug investigation or failing behavior report.
- Optional: none.
- Fallback: If any required dependency is unavailable, stop and report which dependency blocked the workflow.

## Standards

- Evidence: Read the remote issue and the real implementation before deciding scope, process, or fixes.
- Execution: Prefer the repo's existing issue-reading helpers, fall back to raw `gh issue` commands when helpers are missing, use spec planning only when the actual change surface justifies it, and push directly to the user-requested branch when submission is requested.
- Quality: Treat localized bug fixes and narrow optimizations as direct implementation work unless the explored scope proves they need shared planning; finish tests, spec backfill, docs sync, and `AGENTS.md/CLAUDE.md` sync before handing off submission.
- Output: Report the issue context, chosen workflow, implemented fix, validation evidence, and commit/push result.

## Overview

Use this skill for the recurring workflow where the user wants one GitHub issue taken from remote context through implementation and direct submission. Keep the workflow tight: fetch the issue faithfully, decide whether specs are necessary from the explored codebase, finish the fix with tests, then submit without PR or release steps.

## Workflow

### 1) Read the issue from the remote source first

- Start with `$read-github-issue`.
- Verify the current repository matches the intended remote before reading issue content.
- Prefer bundled issue scripts, but if they are missing or fail in the repository, immediately fall back to raw `gh issue view` / `gh issue list` so issue retrieval does not block the workflow.
- Read issue body, labels, timestamps, and comments before touching code.
- Treat user phrases such as `修復 issue 123`, `參考 issue 109 優化`, or `閱讀 issue 100 並提交到 main` as triggers for this skill.

### 2) Explore the codebase and decide whether specs are required

- After reading the issue, inspect the real entrypoints, affected modules, tests, and existing planning files.
- If the user references an expected `docs/plans/...` path that is missing or archived unexpectedly, run `$recover-missing-plan` before treating the issue as unspecced work.
- Run `$enhance-existing-features` to decide whether specs are required from the actual change surface.
- Default to direct implementation for clearly localized bug fixes, regressions, narrow optimizations, or small workflow corrections, even when the issue wording sounds broad.
- Require specs when the explored change touches critical money movement, permissions, high-risk concurrency, or multi-module behavior changes that need approval traceability.
- If specs are created and approved, finish all in-scope tasks and backfill them before submission.

### 3) Implement and validate the fix completely

- Keep the fix minimal and grounded in the actual root cause.
- Reuse existing patterns instead of adding parallel abstractions.
- If the issue is a bug or failing behavior report, bring in `$systematic-debug` for reproduction, root-cause verification, and regression coverage.
- Run the most specific relevant tests first, then expand validation as needed.
- When issue context exposed prior agent mistakes, add regression or guardrail coverage so the same failure is less likely to recur.

### 4) Submit the fix without PR or release work

- If the user asked to commit or push, hand off to `$commit-and-push`.
- Preserve the user's explicit branch target; when the user says `push to main`, treat direct push to `main` as the default goal.
- Before the final commit, ensure any required spec backfill, docs synchronization, and `AGENTS.md/CLAUDE.md` alignment are completed.
- Do not convert this flow into a PR workflow unless the user explicitly requests a PR.
- Do not perform version bumps, tags, or GitHub Releases in this skill.

### 5) Report the shipped result

- Summarize the issue number and root cause.
- State whether specs were used or intentionally skipped.
- List the key files changed, the tests run, and whether commit/push succeeded.
- Call out any remaining blocker only when one truly prevents completion.
