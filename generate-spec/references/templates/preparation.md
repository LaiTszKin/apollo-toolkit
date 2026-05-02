# Preparation: [Feature Name]

- Date: [YYYY-MM-DD]
- Batch: [batch_name]

## Preparation Goal

[Describe the smallest shared prerequisite state that must exist before member specs can be implemented in parallel. This must not implement core business logic or deliver the batch target outcome.]

- Why this exists: [why the batch cannot be parallelized without this prerequisite work]
- Core business boundary: [No core business logic or target outcome is implemented here]
- Depends on (specs): [[spec-name-1], [spec-name-2]]
- Parallel work starts after: [commit / verification / approval of this preparation]
- Out of scope: [member-spec implementation work that must remain in spec files]

## **Task P1: [Preparation Task Title]**

Purpose: [why this prerequisite is required before parallel work]
Scope: [files/modules this task may touch]
Out of scope: [core business logic, target outcome, member-spec behavior]

- P1. [ ] **[file/function]** — **[specific modification; expected output]**
  - Verify: [command/check/manual inspection]

- P2. [ ] **[file/function]** — **[specific modification; expected output]**
  - Verify: [command/check/manual inspection]

## **Task P2: [Preparation Task Title]**

Purpose: [why this prerequisite is required before parallel work]
Scope: [files/modules this task may touch]
Out of scope: [core business logic, target outcome, member-spec behavior]

- P1. [ ] **[file/function]** — **[specific modification; expected output]**
  - Verify: [command/check/manual inspection]

- P2. [ ] **[file/function]** — **[specific modification; expected output]**
  - Verify: [command/check/manual inspection]

## Validation

- Verification required: [commands/checks before subagents start]
- Expected results: [what proves the prepared baseline is usable]
- Regression risks covered: [risk IDs or behavior slices]

## Handoff

- Preparation commit required before parallel work: [Yes / No]
- Member specs assume: [prepared baseline assumptions]
- Member specs must not change: [prepared surfaces now frozen or additive-only]
- Member specs own all business behavior: [Yes]
- If preparation changes later: [stop and re-coordinate rule]
