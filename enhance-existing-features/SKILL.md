---
name: enhance-existing-features
description: >-
  Extend brownfield features by exploring the codebase first, then deciding
  whether shared planning docs (`spec.md`/`tasks.md`/`checklist.md`/`contract.md`/`design.md`) are required
  before coding. When specs are needed, use `generate-spec` for planning,
  clarification, approval, and backfill, and complete approved in-scope tasks
  before yielding unless scope changes or an external blocker prevents safe
  completion. With or without specs, use `test-case-strategy` to select and
  run relevant unit, property-based, regression, integration, E2E, adversarial,
  mock/fake, and drift-check coverage, and verify meaningful business outcomes
  instead of smoke-only success.
---

# Enhance Existing Features

## Dependencies

- Required: `test-case-strategy` for risk-driven test selection, meaningful oracle design, and unit drift checks.
- Conditional: `generate-spec` for shared planning docs when spec-trigger conditions are met; `recover-missing-plan` when the user points to a required `docs/plans/...` spec set that is missing, archived, or mismatched in the current workspace.
- Optional: none.
- Fallback: If `test-case-strategy` is unavailable, stop and report the missing dependency. If specs are required and `generate-spec` is unavailable, stop and report the missing dependency.

## Standards

- Evidence: Explore the existing codebase first and verify the latest authoritative docs for the involved stack or integrations.
- Execution: Decide whether specs are required from the actual change surface, run `generate-spec` when needed, then continue through implementation, testing, and backfill until the active scope is fully reconciled; when the user asks for a specific final behavior or architectural end state, do not substitute a preparatory or partial milestone unless the user explicitly re-scopes the request.
- Quality: Use `test-case-strategy` to add risk-based tests with property-based, regression, integration, E2E, adversarial, and rollback coverage when relevant.
- Output: Keep implementation and any planning artifacts traceable, updated, and aligned with actual completion results.

## Workflow

### 1) Explore codebase first

- Read the relevant existing code before deciding process or editing anything.
- Locate entrypoints, configuration, and primary data flow.
- Trace module relationships (imports, call graph, shared models, side effects).
- Identify integration points (DB, RPC, external APIs, queues, filesystems).
- Identify user-critical logic chains affected by the change.
- Summarize findings and the likely change surface before editing.

### 2) Decide whether specs are required from the requested change

Use the user's requested change together with the codebase exploration results to decide whether to generate specs.

Trigger specs when any of the following is true:
- the change introduces new user-visible behavior, not just a bug fix restoring intended behavior
- requirements are ambiguous enough that approval on written scope, tradeoffs, or edge cases is useful
- multiple modules, layers, services, or teams must stay aligned
- the change touches critical flows, sensitive data, permissions, money movement, migrations, or irreversible operations
- the risk profile is high enough that explicit requirement-to-test traceability will materially reduce mistakes

Do not generate specs when the work is clearly small and localized, such as:
- bug fixes or regressions that restore already-intended behavior without changing product scope
- pure frontend polish: copy tweaks, styling, spacing, alignment, responsive touch-ups, visual cleanup, or simple template/view wiring
- small configuration, constant, dependency, content, or feature-flag updates confined to one area
- straightforward CRUD field additions, validation message tweaks, or one-path handler adjustments with limited blast radius
- refactors, renames, dead-code cleanup, or observability-only changes that do not alter user-visible behavior

When in doubt, prefer direct implementation for genuinely low-risk localized changes, and reserve specs for changes whose scope or risk would benefit from explicit approval artifacts.

If triggered:
- If the user already points to a specific `docs/plans/...` path and that plan set is missing or mismatched in the current workspace, run `$recover-missing-plan` before deciding whether to continue implementation or backfill.
- Run `$generate-spec` and follow its workflow completely.
- Use it to create or update `docs/plans/{YYYY-MM-DD}/{change_name}/spec.md`, `tasks.md`, `checklist.md`, `contract.md`, and `design.md`.
- Keep each spec set scoped to at most three modules.
- If the requested change would require edits across more than three modules, split it into multiple spec sets instead of drafting one large coupled plan.
- Design the split spec sets so they are independently valid, do not conflict with each other, and do not require another spec set to land first.
- When multiple spec sets are created for one coordinated change, place them under `docs/plans/{YYYY-MM-DD}/{batch_name}/{change_name}/` and maintain one batch-level `coordination.md` that records shared preparation, ownership boundaries, replacement direction, and merge order.
- Ensure planned behaviors and edge cases cover external dependency states, abuse/adversarial paths, and any relevant authorization/idempotency/concurrency/data-integrity risks.
- When external dependencies materially constrain the change, make sure `contract.md` captures their official-source-backed invocation surface, constraints, and caller obligations.
- Make sure `design.md` captures the architecture/design delta, affected modules, control flow, and tradeoff decisions for the approved scope.
- After implementation and testing, update the same plan set so `spec.md` reflects requirement completion status in addition to task and checklist progress.
- If users answer clarification questions, update the planning docs and obtain explicit approval again before implementation.
- Do not modify implementation code before approval.
- Once approval is granted, do not stop with unchecked in-scope items remaining in `tasks.md` or applicable unchecked items in `checklist.md` unless the user explicitly defers them or an external blocker prevents safe completion.

If not triggered:
- Continue directly with the same downstream workflow below.

### 3) Verify latest authoritative docs

- Identify the tech stack, libraries, and external dependencies involved.
- Use official documentation as the source of truth.
- Prefer Context7 for framework/library APIs; use web for latest official docs.
- If required docs are private or missing, request access or user-provided references.

### 4) Implement the feature

- Reuse existing patterns and abstractions; avoid over-engineering.
- Keep changes focused and minimal; preserve current behavior unless required.
- Follow project conventions (naming, linting, formatting, configuration).
- Update environment examples only when new inputs are required.
- If specs exist, treat every unchecked in-scope task and applicable checklist item as part of the required deliverable for this run.
- Do not stop after partial code changes, partial tests, or partial backfill when approved planned work remains.
- Do not present an enabling first stage, temporary coalescing step, or other intermediate milestone as complete when the user asked for the final scoped behavior.
- Only pause before completion if:
  - the user changes scope or explicitly asks to stop
  - new clarification requires plan updates and renewed approval
  - an external blocker (missing credentials, unavailable dependency, access restriction, broken upstream system) prevents safe completion
- When blocked, record the exact unfinished items and blocker in the spec set before yielding.

### 5) Testing coverage (required with or without specs)

Use `$test-case-strategy` for every non-trivial change, even when specs are skipped.

- Start from risk inventory and changed behavior, not from the happy path.
- Define test oracles before implementation when the change is planned, and before finalizing tests when the change is discovered during brownfield exploration.
- For each atomic task that changes non-trivial local logic, define a focused unit drift check or record the smallest replacement verification with a concrete `N/A` reason.
- Add unit, regression, property-based, integration, E2E, adversarial, mock/fake, rollback, or no-partial-write coverage only when the risk profile warrants it.
- Each planned test must have a meaningful oracle: exact business output, persisted state, emitted side effects, or intentional lack of side effects.
- Run relevant tests when possible and fix failures.

### 6) Completion updates

- If specs were used, backfill `spec.md`, `tasks.md`, `checklist.md`, `contract.md`, and `design.md` through `$generate-spec` workflow based on actual completion and test outcomes.
- If the change used a parallel batch, update `coordination.md` whenever shared preparation, legacy replacement direction, or merge constraints changed during execution.
- In `spec.md`, mark each relevant requirement with its actual completion state, such as completed, partially completed, deferred, or not implemented, plus brief evidence or rationale where needed.
- If specs were used, mark every completed task in `tasks.md`.
- If specs were used, update only the applicable checklist items that correspond to real scope, chosen test strategy, and actual execution.
- If specs were used, update `contract.md` so the documented dependency obligations and constraints match the implemented reality.
- If specs were used, update `design.md` so the architecture/design record matches the delivered implementation.
- Do not mark unused template examples, mutually exclusive alternatives, or non-applicable branches as completed.
- Remove, rewrite, or leave `N/A` on starter-template items when they do not belong to the real change.
- Explicitly label any still-applicable remaining item as deferred or blocked with the reason.
- If specs were not used, provide a concise execution summary including test IDs/results, regression coverage, mock scenario coverage, adversarial coverage, and any `N/A` reasons.

## Working Rules

- Keep the solution minimal and executable.
- Always decide the need for specs only after exploring the existing codebase.
- When specs are used, keep each spec set limited to at most three modules; split broader work into independent, non-conflicting, non-dependent spec sets before approval.
- When specs are split for parallel worktree implementation, keep batch-wide rules only in `coordination.md` rather than copying them into every spec-local `design.md`.
- Maintain traceability between requirements, tasks, and tests when specs are present.
- Treat checklists as living artifacts: adjust items to match real change scope.
- Treat mutually exclusive template choices as a decision to record, not multiple boxes to finish.
- Every planned test should justify a distinct risk; remove shallow duplicates that only prove the code "still runs".
- If a spec set exists and approval has been granted, do not yield with unfinished in-scope tasks or checklist items unless the user approves a deferment or an external blocker makes completion impossible.

## References

- `$generate-spec`: shared planning and approval workflow.
- `$test-case-strategy`: shared test selection, oracle design, and unit drift-check workflow.
