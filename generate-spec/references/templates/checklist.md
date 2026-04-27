# Checklist: [Feature Name]

- Date: [YYYY-MM-DD]
- Feature: [Feature Name]

## Usage Notes
- This checklist is a starter template. Add, remove, or rewrite items based on actual scope.
- Use `- [ ]` for all items; mark completed items as `- [x]`.
- The final completion summary section may use structured placeholders instead of checkboxes.
- If an item is not applicable, keep `N/A` with a concrete reason.
- Do not mark placeholder examples or mutually exclusive alternatives as completed unless they were actually selected and executed.
- Duplicate or remove decision-record blocks as needed; the final document should contain as many records as the real change requires.
- Duplicate or remove completion-record blocks as needed; the final document should contain as many records as the real change requires.
- Suggested test result values: `PASS / FAIL / BLOCKED / NOT RUN / N/A`.
- Use `$test-case-strategy` to choose test levels, define meaningful oracles, and record unit drift checks for atomic tasks.
- For business-logic changes, property-based coverage is required unless a concrete `N/A` reason is recorded.
- Each checklist item should map to a distinct risk; avoid repeating shallow happy-path cases.

## Clarification & Approval Gate (required when clarification replies exist)
- [ ] User clarification responses are recorded (map to `spec.md`; if none, mark `N/A`).
- [ ] Affected plans are reviewed/updated (`spec.md` / `tasks.md` / `checklist.md` / `contract.md` / `design.md`; if no updates needed, mark `N/A` + reason).
- [ ] Explicit user approval on updated specs is obtained (date/conversation reference: [to be filled]).

## Behavior-to-Test Checklist (customizable)

- [ ] CL-01 [Observable behavior]
  - Requirement mapping: [R1.x]
  - Actual test case IDs: [UT/PBT/IT/E2E-xx]
  - Test level: [Unit / Property-based / Integration / E2E]
  - Risk class: [boundary / authorization / concurrency / external failure / data integrity / adversarial abuse / regression]
  - Property/matrix focus: [invariant / generated business input space / external state matrix / adversarial case]
  - External dependency strategy: [none / mocked service states / near-real dependency]
  - Oracle/assertion focus: [exact output / persisted state / side effects / no partial write / compensation / emitted event / permission denial]
  - Unit drift check: [UT-xx target unit + oracle, or N/A with reason]
  - Test result: `PASS / FAIL / BLOCKED / NOT RUN / N/A`
  - Notes (optional): [risk, limitation, observation]

- [ ] CL-02 [Observable behavior]
  - Requirement mapping: [R?.?]
  - Actual test case IDs: [UT/PBT/IT/E2E-xx]
  - Test level: [Unit / Property-based / Integration / E2E]
  - Risk class: [boundary / authorization / concurrency / external failure / data integrity / adversarial abuse / regression]
  - Property/matrix focus: [invariant / generated business input space / external state matrix / adversarial case]
  - External dependency strategy: [none / mocked service states / near-real dependency]
  - Oracle/assertion focus: [exact output / persisted state / side effects / no partial write / compensation / emitted event / permission denial]
  - Unit drift check: [UT-xx target unit + oracle, or N/A with reason]
  - Test result: `PASS / FAIL / BLOCKED / NOT RUN / N/A`
  - Notes (optional): [risk, limitation, observation]

- [ ] CL-03 [Observable behavior]
  - Requirement mapping: [R?.?]
  - Actual test case IDs: [UT/PBT/IT/E2E-xx]
  - Test level: [Unit / Property-based / Integration / E2E]
  - Risk class: [boundary / authorization / concurrency / external failure / data integrity / adversarial abuse / regression]
  - Property/matrix focus: [invariant / generated business input space / external state matrix / adversarial case]
  - External dependency strategy: [none / mocked service states / near-real dependency]
  - Oracle/assertion focus: [exact output / persisted state / side effects / no partial write / compensation / emitted event / permission denial]
  - Unit drift check: [UT-xx target unit + oracle, or N/A with reason]
  - Test result: `PASS / FAIL / BLOCKED / NOT RUN / N/A`
  - Notes (optional): [risk, limitation, observation]

## Required Hardening Records
- [ ] Regression tests are added/updated for bug-prone or high-risk behavior, or `N/A` is recorded with a concrete reason.
- [ ] Focused unit drift checks are defined for non-trivial atomic implementation tasks, or `N/A` is recorded with the replacement verification and concrete reason.
- [ ] Property-based coverage is added/updated for changed business logic, or `N/A` is recorded with a concrete reason.
- [ ] External services in the business logic chain are mocked/faked for scenario testing, or `N/A` is recorded with a concrete reason.
- [ ] Adversarial/penetration-style cases are added/updated for abuse paths and edge combinations, or `N/A` is recorded with a concrete reason.
- [ ] Authorization, invalid transition, replay/idempotency, and concurrency risks are evaluated; uncovered items are marked `N/A` with concrete reasons.
- [ ] Assertions verify business outcomes and side effects/no-side-effects, not only "returns 200" or "does not throw".
- [ ] Test fixtures are reproducible (fixed seed/clock/fixtures) or `N/A` is recorded with a concrete reason.

## E2E / Integration Decision Records

### Decision Record 1: [Flow / Requirement / Risk Slice]
- Requirement mapping: [R?.? / CL-xx]
- Decision: [Build E2E / Cover with integration instead / Existing coverage already sufficient / N/A]
- Linked case IDs: [E2E-xx / IT-xx / existing suite reference]
- Reason: [importance, cross-layer risk, stability/cost tradeoff, or why no extra coverage is needed]

### Decision Record 2: [Flow / Requirement / Risk Slice]
- Requirement mapping: [R?.? / CL-xx]
- Decision: [Build E2E / Cover with integration instead / Existing coverage already sufficient / N/A]
- Linked case IDs: [E2E-xx / IT-xx / existing suite reference]
- Reason: [importance, cross-layer risk, stability/cost tradeoff, or why no extra coverage is needed]

## Execution Summary (fill with actual results)
- [ ] Unit tests: `PASS / FAIL / NOT RUN / N/A`
- [ ] Regression tests: `PASS / FAIL / NOT RUN / N/A`
- [ ] Property-based tests: `PASS / FAIL / NOT RUN / N/A`
- [ ] Integration tests: `PASS / FAIL / NOT RUN / N/A`
- [ ] E2E tests: `PASS / FAIL / NOT RUN / N/A`
- [ ] External service mock scenarios: `PASS / FAIL / NOT RUN / N/A`
- [ ] Adversarial/penetration-style cases: `PASS / FAIL / NOT RUN / N/A`

## Completion Records

### Completion Record 1: [Flow / Requirement Group / Workstream]
- Requirement mapping: [R?.? / Task N / CL-xx]
- Completion status: [completed / partially completed / blocked / deferred]
- Remaining applicable items: [None / list remaining items]
- Notes: [brief execution-backed summary]

### Completion Record 2: [Flow / Requirement Group / Workstream]
- Requirement mapping: [R?.? / Task N / CL-xx]
- Completion status: [completed / partially completed / blocked / deferred]
- Remaining applicable items: [None / list remaining items]
- Notes: [brief execution-backed summary]
