---
name: generate-spec
description: Generate and maintain shared feature planning artifacts (`spec.md`, `tasks.md`, `checklist.md`) from standard templates with clarification tracking, approval gating, and post-implementation backfill. Use when a workflow needs specs before coding, or when another skill needs to create/update `docs/plans/{YYYY-MM-DD}_{change_name}/` planning docs.
---

# Generate Spec

## Dependencies

- Required: none.
- Conditional: none.
- Optional: none.
- Fallback: not applicable.

## Standards

- Evidence: Review the relevant code, configs, and authoritative docs before filling requirements or test plans.
- Execution: Generate the planning files first, complete them with traceable requirements and risks, handle clarification updates, then wait for explicit approval before implementation.
- Quality: Keep `spec.md`, `tasks.md`, and `checklist.md` synchronized and map each planned test to a concrete risk or requirement.
- Output: Store planning artifacts under `docs/plans/{YYYY-MM-DD}_{change_name}/` and keep them concise, executable, and easy to update.

## Goal

Own the shared planning-doc lifecycle for feature work so other skills can reuse one consistent spec-generation workflow.

## Workflow

### 1) Gather inputs and evidence

- Confirm the target workspace root, feature name, and a kebab-case `change_name`.
- Review only the code, configuration, and external docs needed to understand the requested behavior.
- Record the references that should appear in `spec.md`.
- Inspect existing `docs/plans/` directories before deciding whether to edit an existing plan set.
- Reuse an existing plan set only when it clearly matches the same requested issue/change scope.
- If the requested work is adjacent to, but not actually covered by, an existing plan set, create a new directory instead of overwriting the neighboring one.

### 2) Generate the planning files

- Resolve paths from this skill directory, not the target project directory.
- Use:
  - `SKILL_ROOT=<path_to_generate-spec_skill>`
  - `WORKSPACE_ROOT=<target_project_root>`
  - `python3 "$SKILL_ROOT/scripts/create-specs" "<feature_name>" --change-name <kebab-case> --template-dir "$SKILL_ROOT/references/templates" --output-dir "$WORKSPACE_ROOT/docs/plans"`
- Always generate:
  - `references/templates/spec.md`
  - `references/templates/tasks.md`
  - `references/templates/checklist.md`
- Save files under `docs/plans/{YYYY-MM-DD}_{change_name}/`.

### 3) Fill `spec.md`

- Keep the goal and scope concrete.
- Write functional behaviors in BDD form with `GIVEN`, `WHEN`, `THEN`, `AND`, and `Requirements`.
- Make each requirement testable.
- Cover boundaries, authorization, external dependency states, abuse/adversarial paths, failure handling, and any relevant idempotency/concurrency/data-integrity risks.
- If requirements are unclear, list 3-5 clarification questions; otherwise write `None`.

### 4) Fill `tasks.md`

- Use `## **Task N: [Task Title]**` for each main task.
- Describe each task's purpose and the related requirement IDs.
- Use `- N. [ ]` for tasks and `- N.x [ ]` for subtasks.
- Include explicit tasks for testing, mocks/fakes, regression coverage, and adversarial or edge-case hardening when relevant.

### 5) Fill `checklist.md`

- Use checkbox format `- [ ]` only.
- Treat the template as a starting point and adapt it to the actual scope.
- Map observable behaviors to requirement IDs and real test case IDs.
- Record risk class, oracle/assertion focus, dependency strategy, and test results.
- Property-based coverage is required for business-logic changes unless a concrete `N/A` reason is recorded.

### 6) Process clarifications and approval

- When the user answers clarification questions, first update the clarification and approval section in `checklist.md`.
- Review whether `spec.md`, `tasks.md`, and `checklist.md` must be updated.
- After any clarification-driven update, obtain explicit approval on the updated spec set again.
- Do not modify implementation code before approval.
- When clarification reveals the work is a different issue or materially different scope than the current plan set, stop editing that plan set and generate a new one with a distinct `change_name`.

### 7) Backfill after implementation and testing

- Mark completed tasks in `tasks.md`.
- Update `checklist.md` with real test outcomes, `N/A` reasons, and any scope adjustments.
- Remove stale placeholders or template-only guidance once the documents are finalized.

## Working Rules

- By default, write planning docs in the user's language.
- Keep requirement IDs, task IDs, and test IDs traceable across all three files.
- Prefer realistic coverage over boilerplate: add or remove checklist items based on actual risk.
- Use kebab-case for `change_name`; avoid spaces and special characters.
- Path rule: `scripts/...` and `references/...` in this file always mean paths under the current skill folder, not the target project root.
- Never overwrite a nearby issue's plan set just because the technical area overlaps; shared modules are not sufficient evidence that the scope is the same.

## References

- `scripts/create-specs`: shared planning file generator.
- `references/templates/spec.md`: BDD requirement template.
- `references/templates/tasks.md`: task breakdown template.
- `references/templates/checklist.md`: behavior-to-test alignment template.
