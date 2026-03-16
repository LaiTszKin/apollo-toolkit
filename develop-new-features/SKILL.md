---
name: develop-new-features
description: >-
  Spec-first feature development workflow for new behavior and greenfield
  features. Depends on `generate-spec` for shared planning artifacts before
  coding, then implements the approved feature with risk-driven test coverage.
  Use when users ask to design or implement new features, change product
  behavior, request a planning-first process, or ask for a greenfield feature.
  Tests must not stop at happy-path validation: for business-logic changes
  require property-based testing unless explicitly `N/A` with reason, design
  adversarial/regression/authorization/idempotency/concurrency coverage where
  relevant, use mocks for external services in logic chains, and verify
  meaningful business outcomes rather than smoke-only success.
---

# Develop New Features

## Dependencies

- Required: `generate-spec` for `spec.md`, `tasks.md`, `checklist.md`, clarification handling, approval gating, and status backfill.
- Conditional: none.
- Optional: none.
- Fallback: If `generate-spec` is unavailable, stop and report the missing dependency.

## Standards

- Evidence: Review authoritative docs and the existing codebase before planning or implementation.
- Execution: Run `generate-spec` for every new feature or product-behavior change, obtain approval, then implement minimally.
- Quality: Add risk-based tests with property-based, regression, integration, E2E, adversarial, and rollback coverage when relevant.
- Output: Keep the approved planning artifacts and the final implementation aligned with actual completion results.

## Goal

Use a shared spec-generation workflow for all new feature work, then implement the approved behavior with strong test coverage and minimal rework.

## Workflow

### 1) Review authoritative docs first

- Identify the stack, libraries, APIs, and external dependencies involved.
- Use official documentation as the source of truth.
- Prefer Context7 for framework/library APIs; use web for the latest official docs when needed.
- Record only the references required for this feature.

### 2) Run `$generate-spec`

- Specs are mandatory for every new feature, product behavior change, and greenfield project.
- Follow `$generate-spec` completely for:
  - generating `docs/plans/{YYYY-MM-DD}_{change_name}/spec.md`, `tasks.md`, and `checklist.md`
  - filling BDD requirements and risk-driven test plans
  - handling clarification responses
  - obtaining explicit approval before coding
  - backfilling document status after implementation and testing
- Do not modify product code before the approved spec set exists.

### 3) Explore architecture and reuse opportunities

- Trace entrypoints, module boundaries, data flow, and integration points relevant to the new behavior.
- Identify reusable components, patterns, and configuration paths before adding new code.
- Keep a concise map of likely files to modify so implementation stays scoped.

### 4) Implement after approval

- Reuse existing patterns and abstractions when possible.
- Keep changes focused and avoid speculative scope expansion.
- Update environment examples only when new inputs are actually required.

### 5) Testing coverage (required)

For every non-trivial change, evaluate all categories and add test cases or record justified `N/A`:
- Start from a risk inventory, not from the happy path: assess misuse/abuse, authorization, invalid transitions, idempotency, replay/duplication, concurrency/races, data-integrity, and partial-failure/rollback risks.
- Unit tests: changed logic, boundaries, failure paths, and exact error/side-effect expectations.
- Regression tests: bug-prone or high-risk behavior that should never silently regress again.
- Property-based tests: required for business-logic changes unless truly unsuitable; use them for invariants, generated business input spaces, state-machine/metamorphic checks when useful, and output expectation checks.
- Integration tests: user-critical logic chain across modules/layers.
- E2E tests: key user-visible path impacted by this change; prefer one minimal critical success path plus one highest-value denial/failure path when the risk warrants it.
- Adversarial/penetration-style cases: abuse paths, malformed inputs, forged identities/privileges, invalid transitions, replay/duplication, stale/out-of-order events, toxic payload sizes, and risky edge combinations.

Rules:
- If E2E is too costly or unstable, add stronger integration coverage for the same risk and record the reason in the checklist.
- If property-based testing is not suitable, record `N/A` with a concrete reason.
- For logic chains with external services, mock or fake those services unless the real contract itself is under test; simulate diverse external states and verify the business chain remains correct.
- Where the feature can partially commit work, test rollback, compensation, or no-partial-write behavior explicitly.
- Each test must assert a meaningful oracle: exact business output, persisted state, emitted side effects, or intentional lack of side effects. Avoid assertion-light smoke tests and snapshot-only coverage.
- Run relevant tests when possible and fix failures.

### 6) Completion updates

- Backfill `tasks.md` and `checklist.md` through `$generate-spec` workflow after implementation and testing.
- Report the implemented scope, test execution, and any concrete `N/A` reasons.

## Working Rules

- By default, write planning docs in the user's language.
- Keep implementation traceable to approved requirement IDs and planned risks.
- Prefer realism over rigid templates: add or remove test coverage only when the risk profile justifies it.
- Every planned test should justify a distinct risk; remove shallow duplicates that only prove the code "still runs".

## References

- `$generate-spec`: shared planning and approval workflow.
- `references/testing-unit.md`: unit testing principles.
- `references/testing-property-based.md`: property-based testing principles.
- `references/testing-integration.md`: integration testing principles.
- `references/testing-e2e.md`: E2E decision and design principles.
