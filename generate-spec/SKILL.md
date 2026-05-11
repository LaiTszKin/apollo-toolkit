---
name: generate-spec
description: >-
  Author docs/plans trees: run `apltk create-specs`, hydrate `spec/tasks/checklist/contract/design` (+ `coordination.md`/`preparation.md` when parallel/prep dictates), cite official docs for external deps, plan tests via **`test-case-strategy`**, block code edits until explicit user approval.
  Architecture-touching specs also emit `architecture_diff/` next to `spec.md` (after-HTML for affected pages only): module-internal edits reuse the SAME path as `resources/project-architecture/<rel>.html` so `apltk architecture diff` aligns by path, additions use a new path, removals go in `_removed.txt`.
  Use when drafting/refreshing specs or restructuring batches—not when executing approved plans (use **`implement-specs*`** instead).
  Reject vague `tasks.md` missing file/mutation/verifier; SPLIT >3-module scope; never overwrite a neighbor `{change}`.
  Bad: `- [ ] Add tests`… OK: `- [ ] src/auth/scope.rs — deny unknown scopes — Verify: cargo test scope::defaults`…
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
- **MUST** when the proposed change touches the architecture surface (feature/sub-module add/rename/remove, edge add/remove, `sub-vars` or `sub-io` deltas), generate an `architecture_diff/` directory **next to `spec.md`** containing the proposed **after** HTML for **only the affected pages**, mirroring `resources/project-architecture/` paths produced by `init-project-html`. Use this skill's own `references/TEMPLATE_SPEC.md` for the vocabulary, macro SVG class hooks, and ready-to-copy `sub-io` / `sub-vars` / `sub-dataflow` DOM snippets — page-contract rules still come from `init-project-html/SKILL.md`. The CLI `apltk architecture diff` identifies diffs **by path alone**, so deviating from the three alignment rules below breaks the viewer:
  - **Module-internal change** (same sub-module: function I/O, variables, internal flow, errors; or small in-place edits on `macro` / feature index pages): write the proposed-after HTML at the **SAME path** as `resources/project-architecture/<rel>.html`. This is the common case — never invent a new filename for an in-place edit, or the CLI mis-classifies it as add + remove.
  - **Addition**: write at a new `architecture_diff/<new-rel>.html` whose mirror under `resources/project-architecture/` does not yet exist.
  - **Removal**: list the removed `<rel>` in `architecture_diff/_removed.txt` (one relative path per line). Do not create an empty placeholder HTML for removals.
  - **Rename = removal + addition**: list the old path in `_removed.txt` AND write proposed-after HTML at the new path.
  Always copy `architecture.css` into `architecture_diff/assets/` so every page renders standalone via relative paths (`../../assets/architecture.css`). For batch specs the diff lives inside each member spec's directory only — **MUST NOT** duplicate at batch root. **MUST** keep all paths relative for portability.
- Write prose in the **user’s language** by default; keep requirement/task/test IDs traceable across `spec.md`, `tasks.md`, and `checklist.md`.
- **MUST** use **kebab-case** `change_name`; **MUST NOT** use spaces or arbitrary special characters in names.

## Standards (summary)

- **Evidence**: Official docs when externally constrained; record cites in `spec.md` / `contract.md`.
- **Execution**: Scaffold → fill templates in place → clarification loop → approval gate → (later) backfill after implementation.
- **Quality**: Synchronized artifacts; **`tasks.md`** is unique runnable granularity; **`design.md`/`contract.md`** constrain and orient without mirroring checklist rows—**`TBD`/honest `None`** when facts missing.
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

Always materialize: `spec.md`, `tasks.md`, `checklist.md`, `contract.md`, `design.md` from `references/templates/`. Add `coordination.md` / `preparation.md` at batch root only when flags require. Save under `docs/plans/{YYYY-MM-DD}/...`. After generation, fill in place **without** stripping section headings unless truly N/A (document inline); drop unused repeatable blocks (extra component or dependency stubs). Run a **template-drift pass** before approval: required fields covered, placeholders removed or justified.
   - **Pause →** List the **module names** (≤3) this spec set will touch; if more, where is my **split plan**?
   - **Pause →** For every shared file two specs might touch, where is the **named** resolution in `coordination.md` or why is `preparation.md` required instead?
   - **Pause →** Did I run `apltk create-specs` from the **skill** context so template paths resolve correctly?

### 3) Author content (fill templates)

- **`spec.md`**: Concrete scope; BDD (`GIVEN` / `WHEN` / `THEN` / `AND` / `Requirements`); testable requirements; boundaries, auth, failure, idempotency/concurrency/integrity where relevant; doc references; `3-5` clarification questions or `None`.
- **`tasks.md`**: `## **Task N: [Title]**` with Purpose, Requirements, Scope, Out of scope; atomic `- N [ ]` triple (path · change · verify). **Derive sequencing and decomposition from** **`spec.md` + `design.md` + `contract.md`**; **`tasks.md` stays the only enumerated runnable checklist**. Optionally cite **`INT-###` / `EXT-###`** on rows an anchor constrains—and **keep design/contract coarser**, never a second copy of checklist lines. Integrate `test-case-strategy` for drift checks where needed.
- **`contract.md`**: Cite-backed **external facts / limits / failure semantics / security**, plus **`EXT-###`** integration **anchors** (typically fewer rows than **`tasks.md` items)—**constraints and anti-hallucination context**, **not** a parallel implementation runbook (`TBD` instead of guesses; **`Dependencies` → None** when genuinely no externals).
- **`design.md`**: **High-level architectural context for composing `tasks.md`**—baseline/target shape, boundaries, modules, **`INT-###`** coarse coupling/order hints (`task` granularity lives only in **`tasks.md`**). No file-level chores; batches defer ownership grids to **`coordination.md`**; **`preparation.md`** assumed done—don't replay prep execution here.
- **`coordination.md`** (batch root, parallel only): **Business Goals** (outcome, member specs, parallel readiness, exclusions, blockers → `preparation.md` or list); **Design Principles** (baseline, shared invariants, compat, cleanup—high level); **Spec Boundaries** → **Ownership Map** (allowed/forbidden touchpoints per spec) and **Collisions & Integration** (shared-file rules, freeze owners, merge order, checkpoints, re-coordination trigger)—**every** collision candidate **MUST** have a named resolution.
- **`preparation.md`** (batch root, only if required): Preparation Goal (why, no core business logic, dependents, start condition); **Task P[N]** like `tasks.md` (atomic triple items); **Validation**; **Handoff** (assumptions, must-not-change, if prep changes later). Strip duplicate prep from member specs.
- **`checklist.md`**: `- [ ]` adapted to scope; map behaviors to requirement/test IDs via `test-case-strategy`; behavior lines `[CL-xx]: … — R?.? → [Test IDs] — Result: …`; property-based logic **required** unless `N/A` + reason; honest execution/completion records—**no** checking unused examples or unchosen options.
   - **Pause →** Pick one **random** `tasks.md` checkbox: does it still fail the triple rule (target, change, verify)—if yes, rewrite now?
   - **Pause →** Does every **R** requirement ID I care about appear in `tasks.md` or `checklist.md` with a test or explicit `N/A`?
   - **Pause →** Do **`design.md` / `contract.md`** stay **coarser than `tasks.md`** (no mirrored checkbox choreography / file paths)—yet still constrain ordering and forbidden hallucinations?
   - **Pause →** For parallel batches, does `design.md` **avoid** duplicating batch ownership grids already locked in **`coordination.md`**?

### 3.5) Architecture diff (only when the proposal touches the architecture surface)

When the spec changes a feature module, sub-module, edge, variable, or function I/O, create `architecture_diff/` **inside the spec directory** and write proposed-after HTML following the three alignment rules:

- Module-internal change → write at the **SAME path** as `resources/project-architecture/<rel>.html`.
- Addition → write at a new path.
- Removal → list the `<rel>` in `architecture_diff/_removed.txt`; do not write an HTML placeholder.

Copy `architecture.css` into `architecture_diff/assets/`; keep every path relative. For batch specs the diff stays inside the member spec's own directory. `apltk architecture diff` pairs `architecture_diff/` with `resources/project-architecture/` for a paginated before/after viewer.

- **Pause →** Did an in-place sub-module edit get written at a new path? Move it back to the same path — otherwise the CLI registers it as add + remove.
- **Pause →** Does every `_removed.txt` entry actually exist under `resources/project-architecture/`? Drop entries that do not.

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
- **`tasks.md` line — ok (with ledger wiring)**:
  `- [ ] 2 src/api/handlers/oauth.rs — implement handler path for POST /oauth/token satisfying INT-003, INT-004 · EXT-001 client config loaded from env per contract · Verify: cargo test oauth::handlers::token_exchange`
- **Batch scaffold** (three member specs): `WORKSPACE_ROOT=... apltk create-specs "OAuth batch" --change-name oauth-api --batch-name oauth-may-batch --with-coordination --output-dir "$WORKSPACE_ROOT/docs/plans"` (then repeat or use generator rules for additional `change-name` dirs as your tooling permits).
- **`checklist.md` behavior row sketch**: `[CL-01]: invalid token rejected — R2.1 → TU-Scope-01,TU-Scope-02 — Result: pending`
- **Split-trigger**: change touches `src/auth/*`, `src/cli/*`, `src/db/*`, `infra/terraform/*` (four modules) ⇒ **minimum two spec sets**, not one.

## References

- `test-case-strategy`: test design and drift checks
- `scripts/create-specs` / `apltk create-specs`: generator
- `references/templates/spec.md`, `tasks.md`, `checklist.md`, `contract.md`, `design.md`, `coordination.md`, `preparation.md`: binding templates
