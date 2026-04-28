---
name: implement-specs-with-subagents
description: >-
  Coordinate parallel implementation of multiple approved spec sets by assigning
  each `docs/plans/.../<change_name>/` spec directory to a separate subagent that
  uses `implement-specs-with-worktree`. Supports multi-phase execution for
  interdependent specs: analyse dependencies, implement base specs first, merge
  back via `merge-changes-from-local-branches`, then implement dependent specs,
  and finally submit with commit, push, and patch version bump. Use when a user
  asks to implement a multi-spec batch with subagents, parallel agents, delegated
  agents, or isolated workers while completing any explicitly documented shared
  prerequisite work before delegation, keeping at most four implementation
  subagents active at once, staggering starts to avoid rate-limit bursts,
  preserving independent subagent contexts, and using the user's requested model
  when specified.
---

# Implement Specs with Subagents (Multi-Phase)

## Dependencies

- Required: `implement-specs-with-worktree` for each delegated spec implementation.
- Required: `merge-changes-from-local-branches` for merging worktree branches back between phases.
- Conditional: `generate-spec` if the batch needs clarification before implementation; `review-change-set` if the user asks for an integration review after subagents finish.
- Optional: none.
- Fallback: If the environment cannot start independent subagents, report that limitation and fall back only if the user explicitly approves serial `implement-specs-with-worktree` execution.

## Standards

- Evidence: Read the batch-level `coordination.md` and `preparation.md` when present, enumerate the exact spec directories to implement, verify each delegated spec has the required planning files, and identify any explicit prerequisite or dependency notes before starting subagents.
- Execution: Complete and commit explicitly documented prerequisite preparation on the working branch before delegation. Analyse spec dependencies from `coordination.md` and spec docs to build a multi-phase plan. For each phase, assign exactly one implementation subagent per spec directory, keep no more than four implementation subagents active at the same time, start subagents one at a time rather than in a burst, give each subagent an independent task-local context, and instruct every subagent to use `implement-specs-with-worktree` for its assigned spec. After each phase completes, use `merge-changes-from-local-branches` to merge all phase branches back before launching the next phase.
- Quality: Preserve spec ownership boundaries, avoid duplicate delegation for the same spec, ensure subagents branch from a baseline that includes prerequisite commits, track branch/worktree/commit/test outcomes for every subagent, and pause new launches when a shared blocker, collision, or rate-limit pressure appears.
- Output: Return a concise implementation ledger covering each spec, its subagent result, worktree branch, commit or blocker, verification run, and the merge outcome.

## Goal

Coordinate a multi-spec implementation batch safely by delegating each approved spec set to an isolated subagent-backed worktree implementation, handling interdependent specs through phased execution.

## Workflow

### 1) Identify the batch and implementation queue

- Locate the requested batch under `docs/plans/{YYYY-MM-DD}/{batch_name}/`.
- Read `coordination.md` first when it exists.
- Read `preparation.md` when it exists.
- Enumerate only the spec directories that are in scope for this request.
- For each spec directory, verify the presence of:
  - `spec.md`
  - `tasks.md`
  - `checklist.md`
  - `contract.md`
  - `design.md`
- Do not delegate archived, sibling, or approximate specs unless the user explicitly includes them.
- If `coordination.md` says the batch is not ready for parallel implementation, stop and report the blocking coordination item instead of spawning subagents.
- If `preparation.md` exists, or if the in-scope spec documents explicitly state that prerequisite work must be completed before parallel implementation, treat that preparation as blocking before subagent launch.

### 1.5) Complete documented prerequisite preparation

- Use this step only when `preparation.md` exists or the specs clearly annotate required pre-work.
- The coordinating agent owns the prerequisite work; do not delegate it to implementation subagents.
- Read the preparation tasks, expected outputs, and verification hooks before editing.
- Complete only the shared prerequisite scope that all specs must assume before parallel work starts.
- Run the verification commands or checks listed for the preparation.
- Commit the preparation to the working branch that future implementation worktrees or subagents will use as their base.
- Record the preparation commit in the ledger.
- Do not start implementation subagents until the preparation commit exists and the working branch is clean.
- If preparation cannot be completed or verified, stop and report the blocker instead of launching subagents.

### 2) Analyse spec dependencies

- Read each in-scope spec's `spec.md` and `design.md` to identify explicit references to other in-scope specs.
- Read `coordination.md` for any documented dependency ordering between specs (e.g. "spec A must be implemented before spec B").
- For each spec dependency found, determine which specs are **base specs** (depended upon by others) and which are **dependent specs** (depend on base specs).
- If a spec both depends on others and is depended upon, it belongs to its own middle phase.
- If no dependencies exist between any specs, all specs can run in a single parallel phase.
- Build a dependency graph and record it in the ledger:
  - spec path
  - phase number (starting from 1)
  - depends-on (list of spec paths)
  - depended-by (list of spec paths)
- If the dependency graph contains a cycle, stop and report the cycle instead of proceeding.

### 3) Build a multi-phase delegation plan

- Group specs into ordered phases based on the dependency graph (topological sort order):
  - **Phase 1**: Base specs with no in-batch dependencies (depended upon by others).
  - **Phase N**: Specs whose dependencies are all satisfied by earlier phases.
  - **Final Phase**: Specs with no dependents (leaf specs).
- Each phase must have all its dependencies satisfied by earlier phases before it can start.
- Within each phase, specs are independent and can run in parallel.
- Create one queue item per spec directory per phase.
- Assign one subagent to one spec only; never ask one subagent to implement multiple spec directories.
- Keep a visible ledger with:
  - spec path
  - phase number
  - depends-on
  - intended branch/worktree name if known
  - assigned subagent
  - status (pending / in-progress / merged / blocked)
  - commit
  - tests
  - blockers
- If preparation was completed, include the preparation commit that all subagents must treat as their base.
- Determine the model policy before launch:
  - If the user specifies a model, use that model for the implementation subagents when the environment supports model selection.
  - If the user does not specify a model, let subagents use the same model or default model policy as the coordinating agent.
  - If the environment does not expose model selection, state that the requested model cannot be enforced and continue only when the platform's default subagent model is acceptable.

### 4) Execute phases sequentially

For each phase in order (Phase 1, Phase 2, ... Final Phase):

#### 4.1) Launch subagents for this phase

- Maintain a maximum of four active implementation subagents at any time.
- Start subagents independently and one at a time.
- After each start, confirm that the subagent was accepted or is running before starting the next one.
- If a start fails due to throttling, rate limits, capacity, or platform pressure, wait before retrying and do not start additional subagents during the cooldown.
- Prefer steady scheduling over maximum burst parallelism; four is the ceiling, not a target that must always be filled.

#### 4.2) Give each subagent independent context

For each subagent, provide only task-local instructions:

- Repository root.
- Exact spec directory path.
- Parent `coordination.md` path when present.
- Requirement to use `implement-specs-with-worktree`.
- Requirement to base work on the committed prerequisite-preparation branch state when preparation was performed.
- Requirement to read the full spec bundle before editing.
- Requirement to implement inside its own isolated worktree.
- Requirement to run relevant tests.
- Requirement to backfill the spec documents after implementation.
- Requirement to commit locally unless the user explicitly changes the completion boundary.
- Requirement to report branch, worktree path, commit hash, tests, and blockers.

Do not pass the coordinating agent's full reasoning, unrelated sibling specs, or other subagents' private work unless a concrete coordination conflict requires it.

#### 4.3) Monitor and coordinate

- While subagents run, track completions and blockers in the ledger.
- When one subagent finishes, record its branch, worktree path, commit, verification results, and changed ownership boundaries.
- Start the next queued spec for this phase only when the active count drops below four and no shared blocker is unresolved.
- If two subagents report overlapping edits to a shared file or contract, pause new launches, inspect the conflict against `coordination.md`, and resolve the ownership question before continuing.
- If a subagent fails for a spec-local issue, keep other independent subagents in the same phase running, but do not launch additional work that depends on the failed scope.
- If failures indicate a batch-wide planning defect, stop scheduling new subagents and report the defect.
- If all specs in the current phase are completed (or blocked), proceed to the merge step.

#### 4.4) Merge phase branches back

- After all subagents in the current phase complete, use `merge-changes-from-local-branches` to merge each completed spec's worktree branch back into the current working branch.
- For each successful spec in the phase:
  - Identify the branch name from the ledger.
  - Merge the branch using `merge-changes-from-local-branches`.
  - Resolve any merge conflicts that arise, prioritising correctness from the spec contracts.
  - Verify the working branch is clean and tests still pass after merging.
- Record the merge outcome in the ledger (success / conflicts / blockers).
- If a merge fails and cannot be resolved, stop and report the merge blocker before proceeding to the next phase.
- Once merged, the current working branch now includes all changes from this phase, making them available as a baseline for dependent specs in later phases.

## Working Rules

- One spec directory maps to one implementation subagent.
- Explicitly documented prerequisite preparation is completed, verified, and committed by the coordinating agent before any implementation subagent starts.
- Spec dependencies are analysed before delegation to determine phase ordering.
- Phases execute sequentially; within a phase, specs are independent and run in parallel.
- Maximum active implementation subagents per phase: four.
- Subagents must be started gradually, not all at once.
- Every subagent must have independent context scoped to its assigned spec.
- Every implementation subagent must use `implement-specs-with-worktree`.
- After each phase, `merge-changes-from-local-branches` merges all completed spec branches back into the working branch.
- The coordinating agent owns scheduling, ledger tracking, dependency analysis, inter-phase merging, and conflict escalation; implementation subagents own their assigned worktree commits.
- The coordinating agent owns shared prerequisite commits; implementation subagents must not redo or overlap that preparation unless the preparation commit is missing or invalid.
- User-specified subagent model choices should be honored when supported; otherwise inherit the coordinating agent's model/default model policy.
- Do not use this skill for a single spec unless the user explicitly wants subagent delegation.

## References

- `implement-specs-with-worktree`: required per-spec worktree implementation workflow.
- `merge-changes-from-local-branches`: required for merging worktree branches back between phases.
- `generate-spec`: clarification and planning repair workflow when a batch is not ready for parallel implementation.
- `preparation.md`: optional batch-level prerequisite plan that must be completed before parallel subagent work starts.
- `coordination.md`: batch-level coordination plan that may contain dependency ordering information.
- `review-change-set`: optional post-implementation review workflow before final submission.
