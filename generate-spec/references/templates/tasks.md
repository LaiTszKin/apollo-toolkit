# Tasks: [Feature Name]

- Date: [YYYY-MM-DD]
- Feature: [Feature Name]

## **Task 1: [Task Title]**

Purpose: [one sentence describing the narrow outcome]
Requirements: [R1.x]
Allowed scope: [files/modules/functions this task may touch]
Out of scope: [files/modules/behaviors this task must not change]

- 1. [ ] [Main task item]
  - Input: [requirement/design/contract evidence]
  - Touches: [specific file/function/module]
  - Output: [specific code/doc/test artifact]
  - Done when: [observable completion condition]
  - Verify with: [focused command/check/manual inspection]
  - Unit drift check: [UT-xx target unit + oracle, or N/A with reason]
  - Do not: [explicit implementation-drift guardrail]

## **Task 2: [Task Title]**

Purpose: [one sentence describing the narrow outcome]
Requirements: [R2.x]
Allowed scope: [files/modules/functions this task may touch]
Out of scope: [files/modules/behaviors this task must not change]

- 2. [ ] [Main task item]
  - Input: [requirement/design/contract evidence]
  - Touches: [specific file/function/module]
  - Output: [specific code/doc/test artifact]
  - Done when: [observable completion condition]
  - Verify with: [focused command/check/manual inspection]
  - Unit drift check: [UT-xx target unit + oracle, or N/A with reason]
  - Do not: [explicit implementation-drift guardrail]

## **Task 3: [Task Title]**

Purpose: [one sentence describing the narrow outcome]
Requirements: [R3.x]
Allowed scope: [files/modules/functions this task may touch]
Out of scope: [files/modules/behaviors this task must not change]

- 3. [ ] [Main task item]
  - Input: [requirement/design/contract evidence]
  - Touches: [specific file/function/module]
  - Output: [specific code/doc/test artifact]
  - Done when: [observable completion condition]
  - Verify with: [focused command/check/manual inspection]
  - Unit drift check: [UT-xx target unit + oracle, or N/A with reason]
  - Do not: [explicit implementation-drift guardrail]

## Notes
- Task order should reflect actual implementation sequence.
- Every main task must map back to `spec.md` requirement IDs.
- Treat `tasks.md` as an implementation queue, not a high-level work summary.
- Each checkbox must be atomic: one verb, one responsibility, one concrete output, and one verification hook.
- Split any task that needs more than three files, more than one behavior slice, or a design decision not already captured in `design.md` or `contract.md`.
- Use `$test-case-strategy` to define test IDs and unit drift checks before implementation.
- Include explicit tasks for required test coverage (unit, regression, property-based, integration/E2E as applicable), mock scenario setup, and adversarial/edge-case hardening.
- Do not write vague tasks such as `Implement integration`, `Add tests`, or `Update docs`; replace them with task-local outputs, test IDs, and verification commands.
- For batch specs, tasks must never include "wait for Spec X to land first" as a prerequisite; if such a dependency appears, re-slice the plan or move the coordination rule into `coordination.md`.
- After execution, the agent must update each checkbox (`[x]` for done, `[ ]` for not done).
- Remove all placeholder guidance text in square brackets after filling.
