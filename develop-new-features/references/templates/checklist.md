# Checklist: [Feature Name]

- Date: [YYYY-MM-DD]
- Feature: [Feature Name]

## Usage Notes
- This checklist is a starter template. Add, remove, or rewrite items based on actual scope.
- Use `- [ ]` for all items; mark completed items as `- [x]`.
- If an item is not applicable, keep `N/A` with a concrete reason.
- Suggested test result values: `PASS / FAIL / BLOCKED / NOT RUN / N/A`.

## Clarification & Approval Gate (required when clarification replies exist)
- [ ] User clarification responses are recorded (map to `spec.md`; if none, mark `N/A`).
- [ ] Affected specs are reviewed/updated (`spec.md` / `tasks.md` / `checklist.md`; if no updates needed, mark `N/A` + reason).
- [ ] Explicit user approval on updated specs is obtained (date/conversation reference: [to be filled]).

## Behavior-to-Test Checklist (customizable)

- [ ] CL-01 [Observable behavior]
  - Requirement mapping: [R1.x]
  - Actual test case IDs: [UT/PBT/IT/E2E-xx]
  - Test level: [Unit / Property-based / Integration / E2E]
  - Test result: `PASS / FAIL / BLOCKED / NOT RUN / N/A`
  - Notes (optional): [risk, limitation, observation]

- [ ] CL-02 [Observable behavior]
  - Requirement mapping: [R?.?]
  - Actual test case IDs: [UT/PBT/IT/E2E-xx]
  - Test level: [Unit / Property-based / Integration / E2E]
  - Test result: `PASS / FAIL / BLOCKED / NOT RUN / N/A`
  - Notes (optional): [risk, limitation, observation]

- [ ] CL-03 [Observable behavior]
  - Requirement mapping: [R?.?]
  - Actual test case IDs: [UT/PBT/IT/E2E-xx]
  - Test level: [Unit / Property-based / Integration / E2E]
  - Test result: `PASS / FAIL / BLOCKED / NOT RUN / N/A`
  - Notes (optional): [risk, limitation, observation]

## E2E Decision Record (pick one or customize)
- [ ] Build E2E (case: [E2E-xx]; reason: [importance/complexity/cross-layer risk]).
- [ ] Do not build E2E; cover with integration tests instead (alternative case: [IT-xx]; reason: [stability/cost/environment limitation]).
- [ ] No additional E2E/integration hardening required (reason: [existing coverage already addresses risk]).

## Execution Summary (fill with actual results)
- [ ] Unit tests: `PASS / FAIL / NOT RUN / N/A`
- [ ] Property-based tests: `PASS / FAIL / NOT RUN / N/A`
- [ ] Integration tests: `PASS / FAIL / NOT RUN / N/A`
- [ ] E2E tests: `PASS / FAIL / NOT RUN / N/A`

## Completion Rule
- [ ] Agent has updated checkboxes, test outcomes, and necessary notes based on real execution (including added/removed items).
