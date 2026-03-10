---
name: develop-new-features
description: >-
  Spec-first feature development workflow that generates spec/tasks/checklist
  documents from templates, captures BDD requirements and executable test
  plans, then waits for user confirmation before implementation. Use when
  users ask to design or implement new features, change product behavior,
  request a planning-first process, or ask for a greenfield feature; for any
  greenfield project, this skill is mandatory and must complete specs writing
  before implementation. Tests must not stop at happy-path validation: for
  business-logic changes require property-based testing unless explicitly
  `N/A` with reason, design
  adversarial/regression/authorization/idempotency/concurrency coverage where
  relevant, use mocks for external services in logic chains, and verify
  meaningful business outcomes rather than smoke-only success. If users answer
  clarification questions, update related checkboxes, review/adjust specs, and
  get approval again before coding.
---

# Develop New Features

## Goal

- Produce `spec.md`, `tasks.md`, and `checklist.md` before implementation starts.
- Capture requirements in BDD format so requirements, tasks, and test outcomes stay traceable.

## Workflow

1. Review authoritative external docs for dependencies/stack/API.
   - Read only what is required for this feature.
   - Record references for later inclusion in `spec.md`.
2. Generate planning templates.
   - Resolve paths from this skill directory, not the target project directory.
   - Use:
     - `SKILL_ROOT=<path_to_develop-new-features_skill>`
     - `WORKSPACE_ROOT=<target_project_root>`
     - `python3 "$SKILL_ROOT/scripts/create-specs" "<feature_name>" --change-name <kebab-case> --template-dir "$SKILL_ROOT/references/templates" --output-dir "$WORKSPACE_ROOT/docs/plans"`
   - Always use:
     - `references/templates/spec.md`
     - `references/templates/tasks.md`
     - `references/templates/checklist.md`
   - Save files under `docs/plans/{YYYY-MM-DD}_{change_name}/`.
3. Explore the codebase.
   - Clarify existing flows, related modules, and reusable components.
   - List references, risks, and likely files to modify.
4. Fill `spec.md`.
   - Core requirements must use: `GIVEN`, `WHEN`, `THEN`, `AND`, and `Requirements`.
   - Each requirement must be testable and cover authorization, boundaries, external dependency states, adversarial/abuse scenarios, error/exception paths, and any relevant idempotency/concurrency/data-integrity risks.
   - If requirements are unclear, list 3-5 clarification questions; otherwise write `None`.
5. Fill `tasks.md`.
   - Main task heading format must be `## **Task N: [Task Title]**`.
   - Each main task must include purpose and requirement mapping.
   - Use `- N. [ ] ...` for tasks and `- N.x [ ] ...` for subtasks.
6. Fill `checklist.md`.
   - Use checkbox format `- [ ]` only (no tables).
   - Treat checklist items as a starting template and adapt based on real scope.
   - Align behavior with tests (UT/PBT/IT/E2E), record risk class + oracle/assertion focus, and track results (PASS/FAIL/BLOCKED/NOT RUN/N/A).
7. Plan test coverage.
   - Start from a risk inventory, not from the happy path: assess misuse/abuse, authorization, invalid transitions, idempotency, replay/duplication, concurrency/races, data-integrity, and partial-failure/rollback risks.
   - Plan unit tests for changed rules, boundaries, validation, failure paths, and exact error/side-effect expectations.
   - Add regression tests for bug-prone or high-risk behaviors so the most likely future breakage is pinned down.
   - Property-based tests are mandatory for business-logic changes unless truly unsuitable; if skipped, record concrete `N/A` reason in `checklist.md`.
   - Use property-based tests for classic invariants, generated/enumerated business input spaces, state-machine/metamorphic checks when useful, and output predicates that keep results inside business expectations.
   - For logic chains with external services, use mocks/fakes to simulate diverse external states and verify the chain still produces correct business outcomes.
   - Add adversarial/penetration-style cases that probe abuse paths, malformed inputs, forged identities/privileges, replay/duplication, invalid transitions, stale/out-of-order events, toxic payload sizes, and risky edge combinations.
   - Where the feature can partially commit work, test rollback/compensation/no-partial-write behavior explicitly.
   - Decide E2E proactively based on feature importance, complexity, and cross-layer risk; prefer one minimal critical success path plus one highest-value denial/failure path when the risk warrants it.
   - If E2E is unstable/costly, add integration coverage for critical paths and record reason in `checklist.md`.
   - Each test must assert a meaningful oracle: exact business output, persisted state, emitted side effects, or intentional lack of side effects. Avoid assertion-light smoke tests and snapshot-only coverage.
8. Process user clarifications (required when clarifications are provided).
   - Mark related clarification checkboxes in `checklist.md`.
   - Review and update `spec.md`, `tasks.md`, and `checklist.md` as needed.
9. Obtain user approval.
   - If specs were updated after clarification, request explicit re-approval on the updated spec set.
   - Explicitly ask whether implementation can start.
   - Do not modify product code before approval.
10. Start implementation only after approval.
11. After implementation and testing, backfill document status.
    - `tasks.md`: mark each task checkbox according to real completion.
    - `checklist.md`: mark verification checkboxes, regression/property-based/adversarial coverage, mock-scenario coverage, and update test result fields.

## Working Rules

- By default, write planning docs in the user's language.
- Keep content concise and executable; avoid unsupported scope expansion.
- Use kebab-case for `change_name`; avoid spaces and special characters.
- Keep requirement IDs, task IDs, and test case IDs traceable.
- These documents are living artifacts: update `tasks.md` and `checklist.md` after execution.
- Prefer realism over rigid templates: add/remove items and adjust test levels when needed.
- Every planned test should justify a distinct risk; remove shallow duplicates that only prove the code "still runs".
- Path rule: `scripts/...` and `references/...` in this file always mean paths under the current skill folder, not the target project root.

## References

- `references/templates/spec.md`: master requirement template (BDD).
- `references/templates/tasks.md`: task breakdown template.
- `references/templates/checklist.md`: behavior-to-test alignment template.
- `references/testing-unit.md`: unit testing principles.
- `references/testing-property-based.md`: property-based testing principles.
- `references/testing-integration.md`: integration testing principles.
- `references/testing-e2e.md`: E2E decision and design principles.
- `scripts/create-specs`: planning file generator script (creates all three files).
