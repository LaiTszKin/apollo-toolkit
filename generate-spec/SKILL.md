---
name: generate-spec
description: >-
  Author planning trees under docs/plans: run `apltk create-specs`, hydrate templates (`spec/tasks/checklist/contract/design`; add `coordination.md`/`preparation.md` when parallel/prep dictates), cite official docs for every material external dependency, plan tests with **`test-case-strategy`**, and block product code changes until explicit user approval completes.
  Use when drafting or refreshing specs before coding, restructuring multi-member batches, or recording clarifications—not when simply executing tasks from an approved plan (**`implement-specs*`** family instead).
  Reject ALWAYS vague `tasks.md` lines missing file target + mutation + verifier; SPLIT work when scope exceeds three modules; never overwrite a neighboring `{change}` directory for a different issue.
  Example bad: `- [ ] Add tests`… Example ok: `- [ ] src/auth/scope.rs — deny unknown scopes — Verify: cargo test scope::defaults`…
---

# Generate Spec

## Dependencies

- Required: `test-case-strategy` for risk-driven test selection, oracles, and unit drift-check planning.
- Conditional: none.
- Optional: none.
- Fallback: If `test-case-strategy` is unavailable, **MUST** stop and report it. **MUST NOT** invent local coverage heuristics as a substitute.

## Non-negotiables

- **MUST** read relevant code, config, and authoritative external documentation before writing requirements, contracts, or test plans. When the change depends on frameworks, libraries, SDKs, APIs, CLIs, or hosted services, **MUST** consult **official** documentation during spec creation (required evidence step, not optional).
- **MUST** generate new or refreshed files from this skill’s **`references/templates/*.md`** via `apltk create-specs` (paths `scripts/...` and `references/...` in this document are **under this skill folder**, not the target project). **MUST NOT** let older `docs/plans/...` layouts override current template headings or required fields; old plans are scope evidence only.
- **MUST NOT** overwrite or repurpose a neighboring plan directory just because topics overlap; adjacent scope **MUST** get a new `change_name` unless it is the **same** issue/change.
- **MUST** keep each spec set to **at most three modules** that will be touched. If broader, **MUST** split into multiple spec sets (each ≤3 modules), each independently valid; **MUST NOT** ship one oversized coupled plan.
- **MUST** use batch-root `preparation.md` **only** for minimal shared prerequisite work that must land before parallel implementation; keep that preparation minimal and free of core business logic or target outcomes (see Working Rules). **`preparation.md` content boundary**: enabling scaffolds, shared fixtures, stubs, mechanical migrations, compatibility surfaces—**no** core business logic, **no** target user-visible outcomes (those stay in normal specs). Exclude core business logic, target business outcomes, user-visible behavior changes, and member-spec implementation guidance; those belong in normal spec files.
- **`tasks.md` checklist items**: **every** `- [ ]` **MUST** specify (a) concrete file/function target, (b) specific modification and expected outcome, (c) a verification hook—**no** vague rows (`Implement integration`, `Add tests`). Forbidden vague items **MUST** be rewritten before approval.
- **MUST** use `test-case-strategy` when planning non-trivial logic tests and checklist mapping (test IDs, drift checks). Every **non-trivial** `tasks.md` implementation item **MUST** name a focused unit drift check, another concrete verification hook, or **`N/A`** with a concrete reason.
- **MUST NOT** modify implementation code before **explicit user approval** of the spec set. Clarifications **MUST** sync across affected files and **MUST** re-trigger approval. If scope becomes a **different issue**, **MUST** stop editing the old set and create a **new** `change_name`.
- Write prose in the **user’s language** by default; keep requirement/task/test IDs traceable across `spec.md`, `tasks.md`, and `checklist.md`.
- **MUST** use **kebab-case** `change_name`; **MUST NOT** use spaces or arbitrary special characters in names.

## Standards (summary)

- **Evidence**: Official docs when externally constrained; record cites in `spec.md` / `contract.md`.
- **Execution**: Scaffold → fill templates in place → clarification loop → approval gate → (later) backfill after implementation.
- **Quality**: Synchronized artifacts; applicable template sections only; realistic checklist vs boilerplate (add/remove by risk); finalized docs read as an approved plan, not a fully checked starter; `contract.md` standardized records or honest `None` with reason.
- **Output**: `docs/plans/{YYYY-MM-DD}/{change_name}/` or `docs/plans/{YYYY-MM-DD}/{batch_name}/{change_name}/`; batch root `coordination.md` when intentionally parallel; `preparation.md` only when prerequisite batch work is required first.

## Workflow

**Chain-of-thought:** For every subsection **`N)`**, answer **`Pause →`** prompts before scaffolding or authoring the next subsection; unanswered external constraints or ambiguous scope mean **stop** or **loop** clarifications—not silent drafting.

### 1) Inputs and evidence

Confirm workspace root, feature title, kebab-case `change_name`. Review minimal code/config. **Mandatory** official-doc pass when external systems apply; note sources for `spec.md` / `contract.md`. Inspect existing `docs/plans/`—reuse a set **only** when it matches **this** issue; otherwise create a new directory.
   - **Pause →** Which **official** URLs or docs did I actually consult for each external dependency I plan to cite—URLs not opened are not citations?
   - **Pause →** Is the user ask the **same** issue as an existing nearby plan—or only **adjacent**, requiring a **new** `change_name`?
   - **Pause →** What is the smallest set of repo paths whose behavior I **must** read before writing requirements truthfully?

### 2) Scaffold planning files

Identify concrete modules (≤3 per set; split if needed). Resolve shared collision: merge spec sets, additive-only ownership rules in `coordination.md`, or `preparation.md` when one-time shared prep is the only safe path.

Run from this skill’s context (templates resolved from this skill dir):

```bash
WORKSPACE_ROOT=<target_project_root>
apltk create-specs "<feature_name>" --change-name <kebab-case> --output-dir "$WORKSPACE_ROOT/docs/plans"
```

Multi-spec parallel batch: add `--batch-name <kebab-case>` and `--with-coordination`. **Only** if parallel safety needs prior shared work: add `--with-preparation`.

Always materialize: `spec.md`, `tasks.md`, `checklist.md`, `contract.md`, `design.md` from `references/templates/`. Add `coordination.md` / `preparation.md` at batch root only when flags require. Save under `docs/plans/{YYYY-MM-DD}/...`. After generation, fill in place **without** removing template headings unless truly N/A (document reason). Run a **template-drift pass** before approval: sections present, placeholders removed or justified.
   - **Pause →** List the **module names** (≤3) this spec set will touch; if more, where is my **split plan**?
   - **Pause →** For every shared file two specs might touch, where is the **named** resolution in `coordination.md` or why is `preparation.md` required instead?
   - **Pause →** Did I run `apltk create-specs` from the **skill** context so template paths resolve correctly?

### 3) Author content (fill templates)

- **`spec.md`**: Concrete scope; BDD (`GIVEN` / `WHEN` / `THEN` / `AND` / `Requirements`); testable requirements; boundaries, auth, failure, idempotency/concurrency/integrity where relevant; doc references; `3-5` clarification questions or `None`.
- **`tasks.md`**: `## **Task N: [Title]**` with Purpose, Requirements, Scope, Out of scope; atomic `- N [ ]` lines obeying the triple requirement above; split tasks that exceed three files / multiple behavior slices / undocumented decisions; integrate `test-case-strategy` for test IDs and drift checks for non-trivial logic.
- **`contract.md`**: One record per material external dependency (source, surface, I/O, limits, security, failures); else `None` + short reason—**no** fabricated deps.
- **`design.md`**: Delta vs baseline; modules, responsibilities, flow, state, risks; cross-ref requirement IDs; parallel batch: pointer to `coordination.md`, assumptions for safe concurrency, **no** duplicating batch rules; with `preparation.md`, assume prep **done**—**do not** duplicate prep tasks.
- **`coordination.md`** (batch root, parallel only): **Business Goals** (outcome, member specs, parallel readiness, exclusions, blockers → `preparation.md` or list); **Design Principles** (baseline, shared invariants, compat, cleanup—high level); **Spec Boundaries** → **Ownership Map** (allowed/forbidden touchpoints per spec) and **Collisions & Integration** (shared-file rules, freeze owners, merge order, checkpoints, re-coordination trigger)—**every** collision candidate **MUST** have a named resolution.
- **`preparation.md`** (batch root, only if required): Preparation Goal (why, no core business logic, dependents, start condition); **Task P[N]** like `tasks.md` (atomic triple items); **Validation**; **Handoff** (assumptions, must-not-change, if prep changes later). Strip duplicate prep from member specs.
- **`checklist.md`**: `- [ ]` adapted to scope; map behaviors to requirement/test IDs via `test-case-strategy`; behavior lines `[CL-xx]: … — R?.? → [Test IDs] — Result: …`; property-based logic **required** unless `N/A` + reason; honest execution/completion records—**no** checking unused examples or unchosen options.
   - **Pause →** Pick one **random** `tasks.md` checkbox: does it still fail the triple rule (target, change, verify)—if yes, rewrite now?
   - **Pause →** Does every **R** requirement ID I care about appear in `tasks.md` or `checklist.md` with a test or explicit `N/A`?
   - **Pause →** For parallel batches, does `design.md` **avoid** duplicating what `coordination.md` already owns?

### 4) Clarifications and approval

On answers: update clarification/approval section in `checklist.md` first, then any of `spec.md`, `tasks.md`, `checklist.md`, `contract.md`, `design.md`; **MUST** obtain approval again after material edits. **MUST NOT** touch product code pre-approval.
   - **Pause →** Am I about to “just fix a small bug” in product code before explicit approval—**why is that not a hard stop**?
   - **Pause →** After the last edit, does the user still owe an **explicit** approval token, or did I assume silence means yes?

### 5) Backfill after implementation

When implementation exists: mark `tasks.md`; sync `checklist.md` outcomes/`N/A`; fix `contract.md` / `design.md` if reality diverged; update `coordination.md` / `preparation.md` if ownership or prep status changed. Checklist complete **only** for work actually done or decisions actually taken; separate rows for divergent flows; remove stale placeholders.
   - **Pause →** For each checked item, what **evidence** (commit, test log) would a reviewer use to agree it is true?
   - **Pause →** Did implementation reality change **shared** ownership or prep assumptions—if so, which batch file records that?

## Sample hints

- **`tasks.md` line — bad**: `- [ ] Add tests` → **reject** (no path, change, verifier).
- **`tasks.md` line — ok**:
  `- [ ] src/auth/scope.rs — add deny-by-default matcher for unknown scopes · Verify: cargo test scope::defaults`
- **Batch scaffold** (three member specs): `WORKSPACE_ROOT=... apltk create-specs "OAuth batch" --change-name oauth-api --batch-name oauth-may-batch --with-coordination --output-dir "$WORKSPACE_ROOT/docs/plans"` (then repeat or use generator rules for additional `change-name` dirs as your tooling permits).
- **`checklist.md` behavior row sketch**: `[CL-01]: invalid token rejected — R2.1 → TU-Scope-01,TU-Scope-02 — Result: pending`
- **Split-trigger**: change touches `src/auth/*`, `src/cli/*`, `src/db/*`, `infra/terraform/*` (four modules) ⇒ **minimum two spec sets**, not one.

## References

- `test-case-strategy`: test design and drift checks
- `scripts/create-specs` / `apltk create-specs`: generator
- `references/templates/spec.md`, `tasks.md`, `checklist.md`, `contract.md`, `design.md`, `coordination.md`, `preparation.md`: binding templates
