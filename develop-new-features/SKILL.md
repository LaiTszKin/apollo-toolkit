---
name: develop-new-features
description: Spec-first feature development workflow that generates spec/tasks/checklist documents from templates, captures BDD requirements and executable test plans, then waits for user confirmation before implementation. Use when users ask to design or implement new features, change product behavior, request a planning-first process, or ask for a greenfield feature; for any greenfield project, this skill is mandatory and must complete specs writing before implementation. If users answer clarification questions, update related checkboxes, review/adjust specs, and get approval again before coding.
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
   - Prefer `python3 scripts/create-specs "<feature_name>" --change-name <kebab-case>`.
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
   - Each requirement must be testable and cover authorization, boundaries, and error/exception paths.
   - If requirements are unclear, list 3-5 clarification questions; otherwise write `None`.
5. Fill `tasks.md`.
   - Main task heading format must be `## **Task N: [Task Title]**`.
   - Each main task must include purpose and requirement mapping.
   - Use `- N. [ ] ...` for tasks and `- N.x [ ] ...` for subtasks.
6. Fill `checklist.md`.
   - Use checkbox format `- [ ]` only (no tables).
   - Treat checklist items as a starting template and adapt based on real scope.
   - Align behavior with tests (UT/PBT/IT/E2E) and record results (PASS/FAIL/BLOCKED/NOT RUN/N/A).
7. Plan test coverage.
   - Plan unit and property-based tests based on requirement risk.
   - Decide E2E proactively based on feature importance, complexity, and cross-layer risk.
   - If E2E is unstable/costly, add integration coverage for critical paths and record reason in `checklist.md`.
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
    - `checklist.md`: mark verification checkboxes and update test result fields.

## Working Rules

- By default, write planning docs in the user's language.
- Keep content concise and executable; avoid unsupported scope expansion.
- Use kebab-case for `change_name`; avoid spaces and special characters.
- Keep requirement IDs, task IDs, and test case IDs traceable.
- These documents are living artifacts: update `tasks.md` and `checklist.md` after execution.
- Prefer realism over rigid templates: add/remove items and adjust test levels when needed.

## References

- `references/templates/spec.md`: master requirement template (BDD).
- `references/templates/tasks.md`: task breakdown template.
- `references/templates/checklist.md`: behavior-to-test alignment template.
- `references/testing-unit.md`: unit testing principles.
- `references/testing-property-based.md`: property-based testing principles.
- `references/testing-integration.md`: integration testing principles.
- `references/testing-e2e.md`: E2E decision and design principles.
- `scripts/create-specs`: planning file generator script (creates all three files).
