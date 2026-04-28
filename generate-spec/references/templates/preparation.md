# Preparation: [Feature Name]

- Date: [YYYY-MM-DD]
- Batch: [batch_name]

## Preparation Goal
[Describe the smallest shared prerequisite state that must exist before member specs can be implemented in parallel. This must not implement core business logic or deliver the batch target outcome.]

## Use Condition
- Why this file exists: [explain why the batch cannot be safely parallelized without this prerequisite work]
- Minimality rule: [why this is the smallest viable prerequisite, not a member-spec implementation slice]
- Core business boundary: [state `No core business logic or target outcome is implemented here`; if that is false, re-slice the specs instead]
- Specs that rely on this preparation: [[spec-name-1], [spec-name-2]]
- Parallel implementation starts after: [commit / verification / approval condition]
- Out of scope: [member-spec implementation work that must remain in the individual spec files]

## Prepared Baseline
- Current baseline before preparation: [current state]
- Required baseline after preparation: [state all member specs may assume]
- Shared files or contracts prepared here: [files/modules/API/schema/config/test fixtures]
- Member specs must not repeat: [tasks/edits/verification covered by this file]
- Core business behavior changed here: [No; if yes, this file is being misused]

## Preparation Tasks

### **Task P1: [Preparation Task Title]**
- Purpose: [why this minimal non-business prerequisite is required before parallel work]
- Affected specs: [[spec-name-1], [spec-name-2]]
- Allowed scope: [files/modules this preparation task may touch]
- Out-of-scope guardrails: [core business logic, target outcome, and member-spec behavior that must stay out of preparation]
- Inputs: [coordination/design/contract/official-doc evidence]
- Expected output: [concrete prepared artifact or code/doc state]
- Completion condition: [observable state that proves the task is done]
- Verification hook: [command/check/review step]
- Unit drift check: [UT-xx target unit; expected result/assertion, or N/A with reason]
- P1. [ ] [Atomic preparation action with one concrete output]
- P1. [ ] [Atomic verification or regression action]

### **Task P2: [Preparation Task Title]**
- Purpose: [why this minimal non-business prerequisite is required before parallel work]
- Affected specs: [[spec-name-1], [spec-name-2]]
- Allowed scope: [files/modules this preparation task may touch]
- Out-of-scope guardrails: [core business logic, target outcome, and member-spec behavior that must stay out of preparation]
- Inputs: [coordination/design/contract/official-doc evidence]
- Expected output: [concrete prepared artifact or code/doc state]
- Completion condition: [observable state that proves the task is done]
- Verification hook: [command/check/review step]
- Unit drift check: [UT-xx target unit; expected result/assertion, or N/A with reason]
- P2. [ ] [Atomic preparation action with one concrete output]
- P2. [ ] [Atomic verification or regression action]

## Validation Plan
- Required verification before subagents start: [commands/checks]
- Expected results/assertions: [what proves the prepared baseline is usable]
- Regression risks covered: [risk IDs or behavior slices]
- Verification owner: [main/coordinating agent]

## Handoff Contract For Member Specs
- Preparation commit required before subagents start: [Yes]
- Member specs assume: [prepared baseline assumptions]
- Member specs must not change: [prepared surfaces that are now frozen/additive-only]
- Member specs own all business behavior: [Yes]
- If preparation changes later: [stop condition and re-coordination rule]

## Completion Record
- Preparation status: [Not started / In progress / Complete / Blocked / N/A]
- Preparation commit: [commit hash or `None yet`]
- Verification executed: [commands/checks/results]
- Remaining blockers before parallel implementation: [None / list]
