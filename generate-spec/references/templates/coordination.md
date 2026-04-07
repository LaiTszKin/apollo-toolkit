# Coordination: [Feature Name]

- Date: [YYYY-MM-DD]
- Batch: [batch_name]

## Coordination Goal
[Describe the shared implementation goal across this batch of parallel spec sets.]

## Batch Scope
- Included spec sets: [[spec-name-1], [spec-name-2]]
- Shared outcome: [what the batch delivers when all spec sets land]
- Out of scope: [shared exclusions for the batch]

## Shared Context
- Current baseline: [the current system shape that all spec sets must assume]
- Shared constraints: [runtime, rollout, compatibility, or ownership constraints]
- Shared invariants: [rules every spec set must preserve]

## Shared Preparation

### Shared Fields / Contracts
- Shared fields to introduce or reuse: [field / config / API shape / event schema]
- Canonical source of truth: [which module or data owner defines them]
- Required preparation before implementation: [migration, adapter, stub, flag, fallback, fixture]

### Replacement / Legacy Direction
- Legacy behavior being replaced: [feature / flow / module / endpoint / UI]
- Required implementation direction: [replace in place / shadow then cut over / adapter bridge / phased removal]
- Compatibility window: [None / temporary coexistence period]
- Cleanup required after cutover: [delete flag / remove adapter / drop old field / remove old tests]

## Spec Ownership Map

### Spec Set 1: [spec-name-1]
- Primary concern: [what this spec owns]
- Allowed touch points: [files/modules it may change]
- Must not change: [files/modules owned by another spec unless explicitly coordinated]
- Depends on shared preparation: [None / specific shared item above]

### Spec Set 2: [spec-name-2]
- Primary concern: [what this spec owns]
- Allowed touch points: [files/modules it may change]
- Must not change: [files/modules owned by another spec unless explicitly coordinated]
- Depends on shared preparation: [None / specific shared item above]

## Conflict Boundaries
- Shared files requiring coordination: [file/module list or `None`]
- Merge order / landing order: [independent / explicit order]
- Worktree notes: [branch naming, rebase expectations, or `None`]

## Integration Checkpoints
- Combined behaviors to verify after merge: [cross-spec outcome]
- Required final test scope: [integration / E2E / migration / rollback]
- Rollback notes: [how to contain partial batch rollout]

## Open Questions
[Write `None` if the batch coordination is settled.]
- [Question 1]
