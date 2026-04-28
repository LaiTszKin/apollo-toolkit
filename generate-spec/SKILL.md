---
name: generate-spec
description: Generate and maintain shared feature planning artifacts (`spec.md`, `tasks.md`, `checklist.md`, `contract.md`, `design.md`, and when needed shared `coordination.md` or `preparation.md`) from standard templates with clarification tracking, approval gating, unit drift-check planning, and post-implementation backfill. Use when a workflow needs specs before coding, or when another skill needs to create/update planning docs under `docs/plans/{YYYY-MM-DD}/...`.
---

# Generate Spec

## Dependencies

- Required: `test-case-strategy` for risk-driven test case selection, meaningful oracle design, and unit drift-check planning.
- Conditional: none.
- Optional: none.
- Fallback: If `test-case-strategy` is unavailable, stop and report the missing dependency instead of inventing test coverage heuristics locally.

## Standards

- Evidence: Review the relevant code, configs, and authoritative docs before filling requirements or test plans; when external dependencies, libraries, frameworks, APIs, or platforms are involved, checking their official documentation is mandatory during spec creation.
- Execution: Generate the planning files from this skill's current templates first, keep each spec set tightly scoped, split broader work into multiple independent spec sets when needed, ensure every batch spec is independently completable and truly parallel-implementable without depending on another spec set to land first, surface shared-file or shared-contract collision risks during planning, resolve those coordination rules before implementation starts, add `preparation.md` only when the specs cannot be made parallel-safe without prior shared work, keep that preparation minimal and free of core business logic or target outcomes, complete plans with traceable requirements and risks, handle clarification updates, then wait for explicit approval before implementation.
- Quality: Keep `spec.md`, `tasks.md`, `checklist.md`, `contract.md`, `design.md`, and any shared batch docs synchronized, use `test-case-strategy` to map each planned test to a concrete risk or requirement, preserve the actual headings and field structure from this skill's templates, and tailor the templates so only applicable items remain active.
- Output: Store planning artifacts under `docs/plans/{YYYY-MM-DD}/{change_name}/` for single-spec work, or `docs/plans/{YYYY-MM-DD}/{batch_name}/{change_name}/` plus shared `coordination.md` for multi-spec parallel work. Add shared `preparation.md` at the batch root only when prerequisite work must land before member specs can run in parallel, and keep individual specs concise, executable, non-overlapping with that preparation, and easy to update.

## Goal

Own the shared planning-doc lifecycle for feature work so other skills can reuse one consistent spec-generation workflow.

## Workflow

### 1) Gather inputs and evidence

- Confirm the target workspace root, feature name, and a kebab-case `change_name`.
- Review only the code, configuration, and external docs needed to understand the requested behavior.
- If the change depends on frameworks, libraries, SDKs, APIs, CLIs, hosted services, or other external systems, find and read the relevant official documentation before drafting requirements.
- Treat official documentation lookup as mandatory evidence gathering, not an optional refinement step.
- Use the official docs to verify expected behavior, supported constraints, configuration surface, integration contracts, and any implementation limits that should shape the spec.
- Record the references that should appear in `spec.md` and the dependency evidence that should appear in `contract.md`.
- Inspect existing `docs/plans/` directories before deciding whether to edit an existing plan set.
- Reuse an existing plan set only when it clearly matches the same requested issue/change scope.
- If the requested work is adjacent to, but not actually covered by, an existing plan set, create a new directory instead of overwriting the neighboring one.
- Treat existing or archived project-local specs as scope evidence only, not as formatting authority.
- Do not copy older spec layouts, condensed repo conventions, or neighboring plan structures when they differ from this skill's current templates.

### 2) Generate the planning files

- Resolve paths from this skill directory, not the target project directory.
- Before generating files, identify the concrete modules that would be touched by the requested change.
- Keep each spec set scoped to at most three modules.
- If the requested work would span more than three modules, do not draft one oversized coupled plan.
- Instead, split the work into multiple spec sets, each independently valid and each covering no more than three modules.
- Define those spec sets so they do not conflict with each other and do not require another spec set to land first in order to be approved or implemented safely.
- For batch generation, treat cross-spec implementation dependency as a planning bug: if Spec B cannot be completed safely until Spec A lands, they should be one spec set or be re-sliced so each spec has its own self-contained outcome.
- Use `preparation.md`, not individual spec files, when the only safe way to parallelize a batch is to land shared prerequisite work before any spec starts.
- Keep `preparation.md` as small as possible: it may define enabling scaffolds, shared test fixtures, naming/contract stubs, mechanical migrations, or non-business compatibility surfaces, but it must not implement core business logic, the target user behavior, or any member spec's actual outcome.
- If the required pre-work would change business behavior, implement target logic, or satisfy a meaningful requirement by itself, re-slice it into one or more normal spec sets instead of placing it in `preparation.md`.
- Allow shared preparation only when it is completed before parallel implementation begins; do not hide required pre-work inside one member spec while other specs depend on it.
- Treat any unresolved shared-file collision, overlapping ownership, or incompatible contract change across spec sets as a planning bug to resolve before approval, not an implementation-time surprise.
- If two candidate spec sets would still need to edit the same non-additive surface, either merge them into one spec set, record a concrete ownership split plus additive-only rule that makes parallel work safe, or move the shared pre-work into `preparation.md` when the pre-work can be completed once before all specs.
- Use:
  - `WORKSPACE_ROOT=<target_project_root>`
  - `apltk create-specs "<feature_name>" --change-name <kebab-case> --output-dir "$WORKSPACE_ROOT/docs/plans"`
- For parallel multi-spec generation, also use:
  - `--batch-name <kebab-case-batch-name>`
  - `--with-coordination`
- If and only if multiple spec sets cannot be made parallel-safe without prior shared work, also use:
  - `--with-preparation`
- Always generate:
  - `references/templates/spec.md`
  - `references/templates/tasks.md`
  - `references/templates/checklist.md`
  - `references/templates/contract.md`
  - `references/templates/design.md`
- Generate `references/templates/coordination.md` at the batch root when multiple spec sets are intentionally created for parallel implementation.
- Generate `references/templates/preparation.md` at the batch root only when required prerequisite work must be completed before member specs can be parallel-implemented.
- Save files under `docs/plans/{YYYY-MM-DD}/{change_name}/` or `docs/plans/{YYYY-MM-DD}/{batch_name}/{change_name}/`.
- After generation, fill the files in place without renaming, removing, or collapsing template headings unless a heading is explicitly template-only and not applicable to the real scope.
- Before approval, compare the drafted files against the current template headings and required fields; fix any drift caused by following older project examples.

### 3) Fill `spec.md`

- Keep the goal and scope concrete.
- Ensure the described scope and requirements do not contradict the relevant official documentation or integration contracts.
- Write functional behaviors in BDD form with `GIVEN`, `WHEN`, `THEN`, `AND`, and `Requirements`.
- Make each requirement testable.
- Cover boundaries, authorization, external dependency states, abuse/adversarial paths, failure handling, and any relevant idempotency/concurrency/data-integrity risks.
- Record the official-doc references actually used for the spec, especially for external dependency behavior and constraints.
- If requirements are unclear, list 3-5 clarification questions; otherwise write `None`.

### 4) Fill `tasks.md`

- Use `## **Task N: [Task Title]**` for each main task with `Purpose`, `Requirements`, `Scope`, and `Out of scope` guardrails.
- Use `- N. [ ]` for atomic task items; use `- N.x [ ]` only when a task must be split into additional atomic subtasks.
- Treat `tasks.md` as an implementation queue, not a high-level summary.
- **Every checkbox must specify three things: (a) the exact file path or function, (b) the specific modification to make, and (c) a concrete verification step.** These three are mandatory — no item may omit any of them.
- Per-item format (compact template):
  - `[file/function]` — `[specific modification; expected outcome]`
  - `- Verify:` — focused command, test reference, or manual inspection
- Do not add extra sub-fields beyond what the template provides; put all change detail in the inline description.
- Make each checkbox atomic: one verb, one file/function, one change outcome, and one verification hook.
- If one task needs more than three files, more than one behavior slice, or an implementation decision not already captured in `design.md` or `contract.md`, split it before approval.
- Use `$test-case-strategy` to define test IDs and unit drift checks for non-trivial local logic before implementation starts.
- Include explicit tasks for testing, mocks/fakes, regression coverage, and adversarial or edge-case hardening when relevant.
- Vague items such as `Implement integration`, `Add tests`, or `Update docs` are forbidden; replace them with specific file paths, concrete changes, and executable verification commands.

### 5) Fill `contract.md`

- When the change uses external dependencies, libraries, frameworks, SDKs, APIs, CLIs, hosted services, or other upstream systems, document each material dependency in a standardized dependency record.
- For each dependency, capture the official source, the invocation surface, required inputs, expected outputs, supported behavior, limits, compatibility constraints, security/access requirements, failure contract, and caller obligations.
- Record constraints and forbidden assumptions explicitly so later implementation and review do not rely on unstated expectations.
- If no external dependency materially constrains the change, write `None` and a brief scope-based reason instead of inventing a fake dependency record.

### 6) Fill `design.md`

- Write the architecture/design delta related to the current spec in a standardized format.
- Identify the affected modules, current baseline, proposed architecture, component responsibilities, control flow, data/state impact, and risk/tradeoff decisions.
- Cross-reference relevant requirement IDs from `spec.md` and any external dependency records from `contract.md`.
- Make architecture boundaries, invariants, and rollback/fallback expectations explicit when they matter to safe implementation.
- When the spec belongs to a parallel batch, add a short reference to the parent `coordination.md`, state the exact assumptions that let this spec be implemented in parallel, and keep `design.md` focused on the single-spec delta rather than duplicating cross-spec ownership rules.
- When the batch uses `preparation.md`, write each spec's implementation guidance as if the preparation has already been completed and committed; do not duplicate preparation tasks, verification, or shared setup in member specs.

### 6.5) Fill `coordination.md` for parallel multi-spec batches

- Create `coordination.md` only when one user request is intentionally split into multiple spec sets that may be implemented in parallel.
- Place it at `docs/plans/{YYYY-MM-DD}/{batch_name}/coordination.md`.
- Use it as the batch-level source of truth for shared preparation, ownership boundaries, merge order, and cross-spec constraints.
- Record explicitly that each spec set must remain independently completable and must not rely on another spec set's code changes, unfinished tasks, or merge order to achieve its own approved outcome.
- Record shared fields, shared contracts, or shared data-shape assumptions that multiple spec sets must align on.
- Record whether the batch is ready for parallel implementation now; if not, point to `preparation.md` for executable prerequisite work or list coordination decisions that must still be settled.
- When one spec set replaces or removes legacy behavior, state that direction explicitly so all worktrees implement toward the same target rather than preserving the old behavior accidentally.
- Capture which spec set may touch which modules, which files require coordination, and whether any landing order or cutover sequence must be respected.
- Treat `coordination.md` as a merge-conflict prevention contract, not just a planning summary.
- Record the concrete file ownership map, forbidden touch points, and shared files that require explicit coordination before edits begin.
- For every known collision candidate, record the conflict shape, the pre-agreed owner or additive-only edit rule, and the trigger that requires re-coordination before implementation continues.
- For shared APIs, event schemas, config shapes, manifests, or artifact fields, record whether changes are additive-only during the batch and which spec set owns the canonical naming.
- When temporary compatibility shims, adapters, or legacy bridges must survive until the whole batch lands, record that retention rule explicitly so one worktree does not remove a path another still depends on.
- Record the post-merge integration checkpoints that must be re-verified after multiple worktrees land, especially when text merges may succeed while behavior still drifts.
- If the batch still needs a recommended merge order, make that order operationally convenient rather than functionally required for any single spec to work correctly.
- Keep single-spec concerns in that spec's own `design.md`; reserve `coordination.md` for batch-wide rules only.

### 6.6) Fill `preparation.md` only for prerequisite work

- Create `preparation.md` only when multiple spec sets cannot be implemented safely in parallel until shared prerequisite work is completed first.
- Place it at `docs/plans/{YYYY-MM-DD}/{batch_name}/preparation.md`.
- Treat it as a pre-parallel implementation queue for the coordinating/main agent, not as another member spec.
- Write it in a tasks-like style with atomic preparation items, explicit outputs, completion conditions, and verification hooks.
- Include only the smallest shared prerequisite work that every affected spec can assume after it lands.
- Exclude core business logic, target business outcomes, user-visible behavior changes, and member-spec implementation guidance; those belong in normal spec files.
- Include relevant validation work for the preparation itself.
- Do not include member-spec implementation tasks in `preparation.md`.
- Remove overlapping instructions from member specs; specs must reference the prepared baseline as an assumption instead of repeating the setup tasks.
- If the required work is large enough to become its own product behavior slice, or if it carries core business logic, re-slice the batch instead of hiding that slice in `preparation.md`.
- If the batch can be made parallel-safe through ownership rules, additive-only constraints, or re-slicing, do not create `preparation.md`.

### 7) Fill `checklist.md`

- Use checkbox format `- [ ]` for checklist items, except structured placeholder fields that are intentionally left for later fill-in.
- Treat the template as a starting point and adapt it to the actual scope.
- Remove or rewrite template examples that are not part of the real plan instead of leaving them as fake work to be checked later.
- Map observable behaviors to requirement IDs and real test case IDs.
- Use `$test-case-strategy` to choose the smallest test level that proves each risk and to define meaningful oracles before implementation.
- Record risk class, oracle/assertion focus, dependency strategy, and test results.
- Property-based coverage is required for business-logic changes unless a concrete `N/A` reason is recorded.
- For decision sections, create as many records as needed for distinct flows or risk slices; do not collapse unrelated decisions into one record.
- Within each decision record, keep only the selected strategy or clearly mark the non-selected path as `N/A`; never treat mutually exclusive choices inside one record as multiple completed outcomes.
- For completion-summary sections, create as many completion records as needed for distinct flows, requirement groups, or workstreams; do not force the whole spec into a single completion line when different parts finish differently.

### 8) Process clarifications and approval

- When the user answers clarification questions, first update the clarification and approval section in `checklist.md`.
- Review whether `spec.md`, `tasks.md`, `checklist.md`, `contract.md`, and `design.md` must be updated.
- After any clarification-driven update, obtain explicit approval on the updated spec set again.
- Do not modify implementation code before approval.
- When clarification reveals the work is a different issue or materially different scope than the current plan set, stop editing that plan set and generate a new one with a distinct `change_name`.

### 9) Backfill after implementation and testing

- Mark completed tasks in `tasks.md`.
- Update `checklist.md` with real test outcomes, `N/A` reasons, and any scope adjustments.
- Update `contract.md` when the final dependency usage, obligations, or verified constraints differ from the planning draft.
- Update `design.md` when the approved architecture changes during implementation, and record the final chosen design rather than leaving stale placeholders.
- Update `coordination.md` when shared ownership, replacement sequencing, or cross-spec preparation changed during implementation or merge planning.
- Update `preparation.md` when prerequisite work was completed, verified, skipped with an approved reason, or changed during implementation.
- Only mark checklist items complete when the work actually happened or the recorded decision actually applies.
- Do not check off unused examples, placeholder rows, or non-selected decision options.
- If different flows use different test strategies, preserve separate decision records in the final checklist instead of merging them into a misleading single summary.
- If different parts of the approved scope have different completion states, preserve separate completion records in the final checklist instead of flattening them into one ambiguous status.
- Remove stale placeholders or template-only guidance once the documents are finalized.

## Working Rules

- By default, write planning docs in the user's language.
- Keep requirement IDs, task IDs, and test IDs traceable across all three files.
- Every non-trivial implementation task must have either a focused unit drift check, another concrete verification hook, or an explicit `N/A` reason.
- Never allow one spec set to cover more than three modules.
- When a request exceeds that scope, split it into independent, non-conflicting, non-dependent spec sets before approval.
- For batch specs, independence is mandatory: each spec must describe a complete slice that can be implemented, tested, reviewed, and merged without waiting for another spec in the same batch.
- For batch specs, parallel readiness is also mandatory: each spec must be safe to implement concurrently after any approved `preparation.md` work is completed, with shared-file collisions and ownership rules settled in `coordination.md` before coding begins.
- Use `preparation.md` sparingly: it is allowed only for explicit, minimal, non-business pre-parallel shared work, not for normal cross-spec coordination or member-spec implementation.
- When multiple spec sets are created for one batch, keep their shared implementation direction in one `coordination.md` instead of duplicating cross-spec rules in every `design.md`.
- When `preparation.md` exists, every member spec must avoid duplicating its tasks and must state its implementation assumptions against the post-preparation baseline.
- For parallel worktree batches, make `coordination.md` specific enough that another engineer can tell which files they may edit, which shared contracts are frozen or additive-only, which shims must remain in place, and what combined behaviors need verification after merge.
- Prefer realistic coverage over boilerplate: add or remove checklist items based on actual risk.
- When external dependencies materially shape the change, `contract.md` is required and must capture the official-source-backed contract in the standardized record format.
- `design.md` is required and must describe the architecture/design delta for the spec in the standardized format, even when the final design is intentionally minimal.
- Finalized planning docs should read like the actual approved plan and execution record, not like a fully checked starter template.
- If official documentation materially constrains implementation choices, reflect that constraint explicitly in the spec instead of leaving it implicit.
- Use kebab-case for `change_name`; avoid spaces and special characters.
- Path rule: `scripts/...` and `references/...` in this file always mean paths under the current skill folder, not the target project root.
- Never overwrite a nearby issue's plan set just because the technical area overlaps; shared modules are not sufficient evidence that the scope is the same.
- Template authority rule: the current `references/templates/*.md` files in this skill are the binding format for new or refreshed spec documents. Older `docs/plans/...` files may inform scope, terminology, and historical decisions, but they must not override the current template structure.
- Before presenting specs for approval, run a template-drift pass: verify the expected template sections are present, remove stale placeholder examples, and ensure any removed section has a scope-based reason rather than being omitted because an older project spec omitted it.

## References

- `$test-case-strategy`: shared test case selection, oracle design, and unit drift-check workflow.
- `scripts/create-specs`: shared planning file generator, exposed as `apltk create-specs`.
- `references/templates/spec.md`: BDD requirement template.
- `references/templates/tasks.md`: task breakdown template.
- `references/templates/checklist.md`: behavior-to-test alignment template.
- `references/templates/contract.md`: external dependency contract template.
- `references/templates/design.md`: architecture/design delta template.
- `references/templates/coordination.md`: parallel batch coordination template.
- `references/templates/preparation.md`: optional pre-parallel prerequisite work template.
