# Coordination: [Feature Name]

- Date: [YYYY-MM-DD]
- Batch: [batch_name]

## Coordination Goal
[Describe the shared implementation goal across this batch of parallel spec sets.]

## Parallel Readiness Gate
- Ready for parallel implementation now: [Yes / No]
- Blocking coordination items before coding: [None / list concrete ownership or contract decisions that must be settled first]
- Re-coordination trigger: [what kind of new overlap or contract change forces the batch to stop and re-align]

## Batch Scope
- Included spec sets: [[spec-name-1], [spec-name-2]]
- Shared outcome: [what the batch delivers when all spec sets land]
- Out of scope: [shared exclusions for the batch]
- Independence rule: [state how each spec remains independently implementable, testable, and mergeable without another spec in this batch landing first]

## Shared Context
- Current baseline: [the current system shape that all spec sets must assume]
- Shared constraints: [runtime, rollout, compatibility, or ownership constraints]
- Shared invariants: [rules every spec set must preserve]

## Shared Preparation

### Shared Fields / Contracts
- Shared fields to introduce or reuse: [field / config / API shape / event schema]
- Canonical source of truth: [which module or data owner defines them]
- Required preparation before implementation: [migration, adapter, stub, flag, fallback, fixture]
- Additive-only rule during batch: [what may be added safely without breaking parallel work, or `None`]

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
- Depends on shared preparation: [None / specific shared item above that already exists or can be completed within this spec]
- Cross-spec implementation dependency: [None; if not None, re-slice the batch]

### Spec Set 2: [spec-name-2]
- Primary concern: [what this spec owns]
- Allowed touch points: [files/modules it may change]
- Must not change: [files/modules owned by another spec unless explicitly coordinated]
- Depends on shared preparation: [None / specific shared item above that already exists or can be completed within this spec]
- Cross-spec implementation dependency: [None; if not None, re-slice the batch]

## Conflict Boundaries
- Shared files requiring coordination: [file/module list or `None`]
- File ownership / edit guardrails: [which spec set owns which shared files or `None`]
- Shared API / schema freeze: [frozen owner + additive-only rule, or `None`]
- Compatibility shim retention rules: [which adapters/flags/tests must remain until batch completion, or `None`]
- Merge order / landing order: [independent / optional convenience order only, never a functional prerequisite]
- Worktree notes: [branch naming, rebase expectations, or `None`]

## Collision Resolution Records

### Collision 1: [Shared file / schema / manifest / contract]
- Involved spec sets: [[spec-name-1], [spec-name-2]]
- Conflict shape: [same file / same symbol / same schema field / same generated artifact]
- Pre-agreed resolution: [single owner / additive-only edits / split by section / move into one spec]
- Allowed edits per spec: [exact ownership boundary]
- Escalation rule: [when engineers must stop and re-coordinate]

### Collision 2: [Shared file / schema / manifest / contract]
- Involved spec sets: [[spec-name-1], [spec-name-2]]
- Conflict shape: [same file / same symbol / same schema field / same generated artifact]
- Pre-agreed resolution: [single owner / additive-only edits / split by section / move into one spec]
- Allowed edits per spec: [exact ownership boundary]
- Escalation rule: [when engineers must stop and re-coordinate]

## Integration Checkpoints
- Combined behaviors to verify after merge: [cross-spec outcome]
- Required final test scope: [integration / E2E / migration / rollback]
- Rollback notes: [how to contain partial batch rollout]

## Open Questions
[Write `None` if the batch coordination is settled.]
- [Question 1]
