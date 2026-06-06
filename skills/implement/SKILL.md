---
name: implement
description: Loads the PROMPT.md produced by the plan skill and executes it as the implementation coordinator. The coordinator does not write code — it dispatches workers, verifies results, resolves merge conflicts, and manages the execution flow. All execution logic is defined in PROMPT.md.
---

## Goal

Load the PROMPT.md and become the **implementation coordinator**.

The coordinator's job is not to write code, but to:
1. Understand the task scope and dependencies from PROMPT.md
2. Follow the batch schedule — dispatch pre-written worker prompts, verify gates, handle errors
3. Resolve merge conflicts when combining worker results
4. Verify, commit, and report

## Acceptance Criteria

- All tasks defined in PROMPT.md are completed and all gate verifications pass
- All worker results have been digested and integrated
- Full test suite and lint pass
- Changes are committed in a single commit after final verification

## Workflow

### 1. Load the Coordinator Prompt

Read the PROMPT.md in full. This is your complete operating manual — every execution rule, batch schedule, worker prompt, and boundary is defined there.

Also read SPEC.md, DESIGN.md, and CHECKLIST.md to understand the full business and technical context.

### 2. Prepare the Execution Environment

Before starting any task:

- Confirm the current branch state is clean (no uncommitted changes)
- **Establish a regression baseline**: Run the existing test suite and confirm all tests pass. Any failure after implementation that was not present in this baseline is a regression.
- Confirm dependencies are installed and the project builds

### 3. Execute

Follow the PROMPT.md strictly. All execution logic — the per-batch dispatch loop, worker management, gate verification, error recovery, merge conflict resolution — is defined there.

Do not override or second-guess the PROMPT.md. Your role is to execute it faithfully.

### 4. Commit Changes

After all batches pass final verification, commit all changes in a single commit.
Do not commit after individual batches — only at the very end.

### 5. Report to User

Report to the user:
- Which tasks were completed (by batch)
- Verification results for each batch
- Any notable risks, deviations, or decisions made during execution

## Examples

- PROMPT.md defines Batch 1 with 2 parallel tasks → Coordinator reads T1.1 and T1.2 worker prompts from `plan/` files listed in Section 6 (Worker Prompt Index) → Dispatches 2 workers → Waits for both → Digests results → Runs gate verification → Proceeds to Batch 2
- Worker T2.1 reports failure → Coordinator retries the worker with more specific guidance → Second attempt still fails → Pauses, preserves T2.2's success, notifies the user
- Merge conflict detected when combining worker results → Coordinator resolves the conflict markers → Re-runs batch gate verification → Proceeds

## References

- `PROMPT.md` — The coordinator prompt. This is the skill's sole execution authority.
- `references/branch-naming.md` — Branch naming conventions for the final commit
