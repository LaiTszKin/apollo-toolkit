---
name: edge-case-test-fixer
description: Read code to identify edge cases, write tests that cover those edge cases, and fix the implementation if tests expose failures. Use when a user asks to add edge-case tests, harden behavior, or validate that existing code handles unusual inputs or error paths (e.g., empty data, nulls, boundaries, invalid formats, timeouts, retries).
---

# Edge Case Test Fixer

## Overview

Systematically harden code by identifying edge cases, writing tests that encode those behaviors, and applying minimal fixes until tests pass. Favor clarity and small, targeted changes.

Scope rule:
- If `git diff` is not empty, inspect only changed files and the minimum dependency chain.
- If `git diff` is empty, run a full-codebase edge-case scan. If actionable issues are found, create a git worktree, fix them there, then commit/push and open a PR.

## Workflow

### 0) Determine scan scope (required)
- Run `git diff --name-only` first.
- If diff exists: scan only changed files and the minimum required call chain, then run steps 1-5.
- If no diff exists: scan the full project, prioritizing core domain logic, external API boundaries, and state/concurrency-sensitive modules, then run steps 1-6.
- If no diff exists and no actionable edge case is found: report `No actionable edge-case fix identified`, stop, and do not create a worktree.

### 1) Build a factual baseline (within selected scope)
- With diff: read changed blocks and directly dependent sections (same file or same module).
- Without diff: read candidate high-risk modules and direct dependencies only; avoid unbounded expansion.
- Run relevant tests or a minimal reproduction when needed; record actual vs expected behavior.
- Clarify input/output contracts: types, valid ranges, null handling, and error behavior.

### 2) Enumerate edge cases (only directly related to scope)
Prioritize 2-5 high-risk cases from the list below:
- Empty collections / empty strings / None / null
- Boundary values: 0, 1, -1, max/min limits, overflow
- Duplicate/order/sorting assumptions
- Exception paths: external dependency failure, timeout, retry, partial data missing
- Invalid formats: invalid date/timezone, malformed strings, unexpected types
- Concurrency/reentrancy: repeated calls, state contamination
- **Architecture-level edge cases**: cross-module risks such as concurrency, backpressure, resource exhaustion, timeout propagation
- **Rollback behavior**: interruption across modules/steps and rollback strategy correctness

For a broader checklist, load references based on change type:
- `references/architecture-edge-cases.md`
- `references/code-edge-cases.md`

#### External API requirements
If changes involve external API calls, add/validate these edge cases with minimal scope:
- **Heartbeat/health checks**: include an observable availability path (or state clearly why not needed).
- **Error degradation**: cover at least HTTP 429 (rate limit) and 500 (server error), with backoff/degradation behavior.
- **Error logging**: log key fields (status code, request identifier, retry count, latency) to avoid silent failures.

### 3) Write tests (fail first, then fix)
- Reuse existing test style and fixtures first; use existing mocking tools when needed.
- Add one clearly named test per edge case.
- Assert only observable outcomes (return value, DB writes, logs, exception types).
- For external API changes, include tests for 429/500, retry/degradation paths, and heartbeat/health behavior when applicable.

### 4) Implement minimal fixes
- Fix at the source of failure with the smallest viable change.
- Preserve existing API compatibility; if contracts change, update tests and document it clearly.
- Avoid unrelated refactors and avoid adding behavior not covered by tests.

### 5) Validate and clean up
- Re-run relevant tests; remove temporary files/test artifacts created during debugging.
- Summarize added edge cases, tests, and fixes.

### 6) If no diff and fixes were made: create worktree, commit, and open PR
- Run this step only when there was no initial diff and you found a fixable issue.
- Create an isolated branch/worktree (branch must start with `codex/`) and complete changes/tests there.
- Commit and push directly with git from the worktree.
- Open a PR after push (for example `gh pr create`) and include edge-case list, mapped tests, fix summary, and risk notes.

## Test Design Hints
- Prioritize where failures are likely now, not every theoretical possibility.
- If setup cost is high, shrink inputs or extract helper fixtures.
- Use mocks/fakes for external I/O to keep tests fast and stable.
