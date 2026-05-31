---
name: fix
description: Loads the FIX.md produced by the qa skill and executes it as the fix coordinator. The coordinator does not write code — it dispatches fix workers and regression test workers, verifies results, resolves merge conflicts, and manages the execution flow. All execution logic is defined in FIX.md.
---

## Goal

Load the FIX.md and become the **fix coordinator**.

The coordinator's job is not to write code, but to:
1. Understand the issue inventory and dependencies from FIX.md
2. Follow the batch schedule — dispatch fix workers, then regression test workers, verify gates, handle errors
3. Resolve merge conflicts when combining worker results
4. Verify, commit, and report

## Acceptance Criteria

- All issues defined in FIX.md are fixed and all gate verifications pass
- All worker results have been digested and integrated
- Full test suite and lint pass, no regressions
- All changes are committed in a single commit after final verification

## Workflow

### 1. Load the Fix Coordinator Prompt

Read the FIX.md in full. This is your complete operating manual — every execution rule, batch schedule, worker prompt, and boundary is defined there.

Also read SPEC.md, DESIGN.md, and REPORT.md to understand the full business and technical context.

### 2. Prepare the Execution Environment

Before starting any task:

- Confirm the current branch state is clean (no uncommitted changes)
- **Establish a regression baseline**: Run the existing test suite and confirm all tests pass. Any failure after fixes that was not present in this baseline is a regression.
- Confirm dependencies are installed and the project builds

### 3. Execute

Follow the FIX.md strictly. All execution logic — the per-batch dispatch loop, worker management, fix application, regression test implementation, gate verification, error recovery, merge conflict resolution — is defined there.

Do not override or second-guess the FIX.md. Your role is to execute it faithfully.

### 4. Commit Changes

After all batches pass final verification, commit all changes in a single commit.
Do not commit after individual batches — only at the very end.

### 5. Report to User

Use `assets/templates/fix-summary.md` to produce a fix summary report.

Report to the user:
- Which issues were fixed (by severity level)
- Each fix's files changed and verification status
- Verification results (test suite, compilation, lint)
- Any notable risks, deviations, or residual issues

## Examples

- FIX.md defines Batch 1 with 2 parallel fixes → Coordinator extracts FIX-01 and FIX-03 worker prompts from Section 6 → Dispatches 2 workers → Waits → Digests results → Runs gate verification → Proceeds to Batch 2
- Worker FIX-02 reports failure → Coordinator retries the worker with more specific guidance → Second attempt still fails → Pauses, preserves FIX-01's success, notifies the user
- All batches complete → Regression tests pass → Commit → Cross-check REPORT.md → Report

## References

- `FIX.md` — The fix coordinator prompt. This is the skill's sole execution authority.
- `assets/templates/fix-summary.md` — Fix summary report template
