---
name: implement-specs-with-subagents
description: >-
  Coordinate parallel implementation of multiple approved spec sets by assigning
  each `docs/plans/.../<change_name>/` spec directory to a separate subagent that
  uses `implement-specs-with-worktree`. Use when a user asks to implement a
  multi-spec batch with subagents, parallel agents, delegated agents, or isolated
  workers while keeping at most four implementation subagents active at once,
  staggering starts to avoid rate-limit bursts, preserving independent subagent
  contexts, and using the user's requested model when specified.
---

# Implement Specs with Subagents

## Dependencies

- Required: `implement-specs-with-worktree` for each delegated spec implementation.
- Conditional: `generate-spec` if the batch needs clarification before implementation; `review-change-set` if the user asks for an integration review after subagents finish.
- Optional: none.
- Fallback: If the environment cannot start independent subagents, report that limitation and fall back only if the user explicitly approves serial `implement-specs-with-worktree` execution.

## Standards

- Evidence: Read the batch-level `coordination.md` when present, enumerate the exact spec directories to implement, and verify each delegated spec has the required planning files before starting subagents.
- Execution: Assign exactly one implementation subagent per spec directory, keep no more than four implementation subagents active at the same time, start subagents one at a time rather than in a burst, give each subagent an independent task-local context, and instruct every subagent to use `implement-specs-with-worktree` for its assigned spec.
- Quality: Preserve spec ownership boundaries, avoid duplicate delegation for the same spec, track branch/worktree/commit/test outcomes for every subagent, and pause new launches when a shared blocker, collision, or rate-limit pressure appears.
- Output: Return a concise implementation ledger covering each spec, its subagent result, worktree branch, commit or blocker, verification run, and any integration follow-up needed.

## Goal

Coordinate a multi-spec implementation batch safely by delegating each approved spec set to an isolated subagent-backed worktree implementation.

## Workflow

### 1) Identify the batch and implementation queue

- Locate the requested batch under `docs/plans/{YYYY-MM-DD}/{batch_name}/`.
- Read `coordination.md` first when it exists.
- Enumerate only the spec directories that are in scope for this request.
- For each spec directory, verify the presence of:
  - `spec.md`
  - `tasks.md`
  - `checklist.md`
  - `contract.md`
  - `design.md`
- Do not delegate archived, sibling, or approximate specs unless the user explicitly includes them.
- If `coordination.md` says the batch is not ready for parallel implementation, stop and report the blocking coordination item instead of spawning subagents.

### 2) Build a delegation plan

- Create one queue item per spec directory.
- Assign one subagent to one spec only; never ask one subagent to implement multiple spec directories.
- Keep a visible ledger with:
  - spec path
  - intended branch/worktree name if known
  - assigned subagent
  - status
  - commit
  - tests
  - blockers
- Determine the model policy before launch:
  - If the user specifies a model, use that model for the implementation subagents when the environment supports model selection.
  - If the user does not specify a model, let subagents use the same model or default model policy as the coordinating agent.
  - If the environment does not expose model selection, state that the requested model cannot be enforced and continue only when the platform's default subagent model is acceptable.

### 3) Launch subagents gradually

- Maintain a maximum of four active implementation subagents at any time.
- Start subagents independently and one at a time.
- After each start, confirm that the subagent was accepted or is running before starting the next one.
- If a start fails due to throttling, rate limits, capacity, or platform pressure, wait before retrying and do not start additional subagents during the cooldown.
- Prefer steady scheduling over maximum burst parallelism; four is the ceiling, not a target that must always be filled.

### 4) Give each subagent independent context

For each subagent, provide only task-local instructions:

- Repository root.
- Exact spec directory path.
- Parent `coordination.md` path when present.
- Requirement to use `implement-specs-with-worktree`.
- Requirement to read the full spec bundle before editing.
- Requirement to implement inside its own isolated worktree.
- Requirement to run relevant tests.
- Requirement to backfill the spec documents after implementation.
- Requirement to commit locally unless the user explicitly changes the completion boundary.
- Requirement to report branch, worktree path, commit hash, tests, and blockers.

Do not pass the coordinating agent's full reasoning, unrelated sibling specs, or other subagents' private work unless a concrete coordination conflict requires it.

### 5) Monitor and coordinate

- While subagents run, track completions and blockers in the ledger.
- When one subagent finishes, record its branch, worktree path, commit, verification results, and changed ownership boundaries.
- Start the next queued spec only when the active count drops below four and no shared blocker is unresolved.
- If two subagents report overlapping edits to a shared file or contract, pause new launches, inspect the conflict against `coordination.md`, and resolve the ownership question before continuing.
- If a subagent fails for a spec-local issue, keep other independent subagents running, but do not launch additional work that depends on the failed scope.
- If failures indicate a batch-wide planning defect, stop scheduling new subagents and report the defect.

### 6) Finish the batch report

- Do not merge branches, archive specs, push, or release unless the user explicitly requests that follow-up.
- Summarize every spec outcome from the ledger.
- Distinguish completed local commits from blocked or partial specs.
- Report any integration review, merge order, or post-merge validation required by `coordination.md`.

## Working Rules

- One spec directory maps to one implementation subagent.
- Maximum active implementation subagents: four.
- Subagents must be started gradually, not all at once.
- Every subagent must have independent context scoped to its assigned spec.
- Every implementation subagent must use `implement-specs-with-worktree`.
- The coordinating agent owns scheduling, ledger tracking, and conflict escalation; implementation subagents own their assigned worktree commits.
- User-specified subagent model choices should be honored when supported; otherwise inherit the coordinating agent's model/default model policy.
- Do not use this skill for a single spec unless the user explicitly wants subagent delegation.

## References

- `implement-specs-with-worktree`: required per-spec worktree implementation workflow.
- `generate-spec`: clarification and planning repair workflow when a batch is not ready for parallel implementation.
- `review-change-set`: optional post-implementation review workflow before merge or submission.
