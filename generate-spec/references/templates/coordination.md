# Coordination: [Feature Name]

- Date: [YYYY-MM-DD]
- Batch: [batch_name]

## Business Goals

[Describe the shared business outcome this batch delivers when all spec sets land.]

- Batch members: [[spec-name-1], [spec-name-2]]
- Shared outcome: [what the batch delivers when all spec sets land]
- Parallel readiness: [Yes / No; if No, list blocking items or link to preparation.md]
- Out of scope: [shared exclusions for the batch]

## Design Principles

[Shared design constraints every spec must follow during implementation.]

- Current baseline: [the current system state all spec sets must assume]
- Shared invariants: [rules every spec set must preserve]
- Shared constraints: [runtime, rollout, compatibility, or ownership constraints]
- Legacy direction: [legacy behavior being replaced and the replacement strategy; None if not applicable]
- Compatibility window: [None / temporary coexistence period]
- Cleanup after cutover: [delete flag / remove adapter / drop old field; None if not applicable]

## Spec Boundaries

### Ownership Map

#### Spec Set 1: [spec-name-1]
- Primary concern: [what this spec owns]
- Allowed touch points: [files/modules it may change]
- Must not change: [files/modules owned by another spec unless explicitly coordinated]

#### Spec Set 2: [spec-name-2]
- Primary concern: [what this spec owns]
- Allowed touch points: [files/modules it may change]
- Must not change: [files/modules owned by another spec unless explicitly coordinated]

### Collisions & Integration

- Shared files & edit rules: [which files require coordination and the pre-agreed rules per spec]
- Shared API / schema freeze: [frozen owner + additive-only rule, or None]
- Compatibility shim retention: [which adapters/flags/tests must remain until batch completion, or None]
- Merge order: [independent / suggested convenience order only]
- Integration checkpoints: [combined cross-spec behaviors to verify after merge]
- Re-coordination trigger: [what change forces the batch to stop and re-align]
