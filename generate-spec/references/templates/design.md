# Design: [Feature Name]

- Date: [YYYY-MM-DD]
- Feature: [Feature Name]
- Change Name: [change_name]

## Design Goal
[Describe the architecture/design objective for this spec change.]

## Change Summary
- Requested change: [one sentence]
- Existing baseline: [current architecture or behavior relevant to the change]
- Proposed design delta: [what will change structurally]

## Scope Mapping
- Spec requirements covered: [R?.?]
- Affected modules: [module/file/service list]
- External contracts involved: [dependency names from `contract.md`, or `None`]

## Current Architecture
[Describe the relevant current components, data flow, control flow, and boundaries.]

## Proposed Architecture
[Describe the new or updated structure, ownership boundaries, and interaction flow.]

## Component Changes

### Component 1: [Name]
- Responsibility: [what this component owns after the change]
- Inputs: [events, params, payloads, config]
- Outputs: [return values, writes, emitted events, calls]
- Dependencies: [internal modules and external contracts]
- Invariants: [business or technical rules that must hold]

### Component 2: [Name]
- Responsibility: [what this component owns after the change]
- Inputs: [events, params, payloads, config]
- Outputs: [return values, writes, emitted events, calls]
- Dependencies: [internal modules and external contracts]
- Invariants: [business or technical rules that must hold]

## Sequence / Control Flow
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Data / State Impact
- Created or updated data: [schemas, fields, caches, files, queues, config]
- Consistency rules: [ordering, transactionality, idempotency, deduplication]
- Migration / rollout needs: [if none, write `None`]

## Risk and Tradeoffs
- Key risks: [failure, concurrency, authorization, partial-write, dependency risk]
- Rejected alternatives: [alternative + why it was not chosen]
- Operational constraints: [performance, quota, observability, deployment coupling]

## Validation Plan
- Tests: [UT / PBT / IT / E2E / adversarial]
- Contract checks: [how `contract.md` constraints will be validated]
- Rollback / fallback: [how to contain or reverse impact]

## Open Questions
[Write `None` if the design is settled.]
- [Question 1]
- [Question 2]
