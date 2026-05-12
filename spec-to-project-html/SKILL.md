---
name: spec-to-project-html
description: >-
  Sync the project HTML architecture atlas to active planning specs by driving `apltk architecture --spec <spec_dir>`. Single specs write overlay YAML under `<spec_dir>/architecture_diff/atlas/`; batch member paths resolve to the shared batch-root `architecture_diff/` beside `coordination.md`. The CLI re-renders only the affected proposed-after HTML pages — macro SVG and per-sub-module internal-dataflow diagrams stay zoomable like the base atlas — so `apltk architecture diff` pairs before/after by path under `docs/plans/**/architecture_diff/`. Preserve the two-layer rule and the responsibility split: **subagents only** — each subagent reads ONE affected feature and declares EVERY intra-feature overlay change; the main agent **waits until all subagents finish**, then aggregates outbound summaries and declares **only** cross-feature edges. **Exact CLI spelling:** always `apltk architecture --help`. Ground every declaration in repo evidence; mark `TBD` when code is missing.
---

# Spec To Project HTML

## Dependencies

- Required: **`init-project-html`** — its `SKILL.md` is the semantic rulebook; **`apltk architecture --help`** is the verb/flag source of truth. Reuse the same CLI here with `--spec`.
- Conditional: **`recover-missing-plan`** if a spec pointer is missing.
- Conditional: **`generate-spec`** / **`implement-specs*`** terminology for requirement IDs.
- Optional: **`review-spec-related-changes`** when verifying diagram updates against specs.
- Fallback: spec demands components that are absent from code → declare them but use `TBD` strings or a `gap` token in the role/purpose/dataflow fields; **MUST NOT** mark them as implemented.

## Non-negotiables

- **MUST** read specs in order unless the user directs otherwise: `spec.md` → `design.md` → `contract.md` → coordination notes.
- **MUST** declare every change through the CLI with `--spec <spec_dir>` (exact verbs/flags: **`apltk architecture --help`**). Single specs write overlay YAML to `<spec_dir>/architecture_diff/atlas/` and re-render only the affected proposed-after HTML pages there. Batch member paths resolve to the shared batch-root `architecture_diff/` beside `coordination.md`, so the whole batch keeps one overlay and one rendered diff. **MUST NOT** hand-edit `architecture_diff/**/*.html` — the renderer owns those files.
- **MUST** obey the semantic rules from `init-project-html/SKILL.md`:
  - Sub-module pages stay self-only — express cross-boundary interactions via **edges** (cross-feature or intra-feature), never as sub-module page prose.
  - Feature pages stay lightweight — cross-sub-module choreography belongs in **edges**, not in `dataflow` prose that pretends to cross features.
- **MUST** reconcile deltas through the CLI families described in **`apltk architecture --help`**. Keep the meaning in this skill, but take the exact verbs, subverbs, and flags from the CLI itself.
- **MUST NOT** drop modules that are still present in code just because the spec omits them — keep them, or rewrite role/purpose to flag “out of spec scope”.
- **MUST** scope reads to the **affected feature modules** from the spec/design diff (plus any feature owning the other end of a cross-feature edge into an affected one). **Subagents own intra-feature overlay writes; the main agent owns cross-feature seams — after all subagents finish:**
  - Dispatch **one write-capable subagent per affected feature**. Each applies every intra-feature overlay mutation via `apltk architecture ... --spec <spec_dir>` (exact flags: **`--help`**). Each returns **ONLY** a structured summary: sub-module change list, outbound boundary changes (cross-feature edges to add/change/remove), and any `planned` / `gap` markers.
  - **MUST** wait until **every** dispatched subagent has completed before running any cross-feature **`edge`** mutation, overlay-wide **`meta`** that stitches multiple features, or shared **`actor`** that exists only for cross-feature context.
  - **Forbidden:** loading every affected feature’s source into the main agent before delegating — that explodes context and produces contradictory overlays.
- **MUST** run `apltk architecture validate --spec <spec_dir>` after the final mutation. Resolve every reported error before reporting completion.

## Standards (summary)

- **Evidence**: cite the spec passage (design subsystem entry) alongside the code path; record the citation in `meta.summary` or in sub-module purposes when relevant.
- **Execution**: locate the plan set → list affected feature modules → subagent fan-out → **all complete** → cross-feature edges → `render --spec` if batched → `validate --spec` → `diff` check → handover.
- **Quality**: macro overlay still shows every cross-feature data-row the spec requires; sub-module declarations stay self-only; `apltk architecture diff` opens cleanly with no orphan pages; no dangling edges.
- **Output**: single specs touch only `<spec_dir>/architecture_diff/atlas/**` (overlay state) and `<spec_dir>/architecture_diff/**/*.html` (renderer output); batch specs write the same artifacts under the batch root beside `coordination.md`. Base `resources/project-architecture/` is **NEVER** mutated.

## Acceptance criteria (mirrors `init-project-html`)

Open the proposed-after viewer (`apltk architecture diff`) and verify both criteria on the overlay pages before reporting completion:

1. **The macro overlay clearly shows the proposed-after feature × sub-module relationships**, including data flow (**`data-row`**), interaction logic (**`call`** + **`return`**), error handling and rollback (**`failure`**). Any new / changed / removed cross-boundary path the spec implies **MUST** exist as an edge mutation in the overlay — not as sub-module prose.
2. **Each touched sub-module’s internal overlay diagram clearly shows the function-level interactions inside it**, including function references and variable reads/writes on `dataflow` steps. Declare `function` / `variable` before referencing them so `validate --spec` passes.

## Workflow

### 1) Resolve spec inputs

User-pointed path wins; otherwise use the batch `coordination.md` or `recover-missing-plan` to find the most recent plan; collect `R…` / `INT-…` IDs for traceability.

### 2) List the affected feature modules (no function bodies yet)

Derive from the spec/design diff which feature modules change: new sub-modules, edge changes, variable changes, error changes, retired sub-modules… **Also** include any feature owning the other end of a cross-feature edge that is being changed (even if that feature’s own spec is untouched). Record only `slug + change-kind`; do not enter function bodies yet.

### 3) Subagents patch features; orchestrator patches cross-feature seams **after** all workers finish

Dispatch one **write-capable subagent per affected feature**. Each subagent owns every intra-feature overlay write and reports outbound boundaries upward. Use **`apltk architecture --help`** for exact `add|set|remove|reorder` spelling.

> **Feature `<slug>` subagent contract (overlay)**
> - Read this feature’s affected sub-modules and the cited spec passages / requirement IDs.
> - Apply every intra-feature overlay mutation with `--spec <spec_dir>`: structural (`feature` / `submodule`), rows (`function`, `variable`, `dataflow`, `error`), and intra-feature **`edge`** changes (including failure / rollback between this feature’s own sub-modules). Order `dataflow` so **variable state** reads end-to-end.
> - Run `apltk architecture validate --spec <spec_dir>` before returning.
> - **Return ONLY**: (i) sub-module change list, (ii) outbound boundary changes (cross-feature edges add/change/remove with endpoints and suggested kind/label), (iii) any `planned` / `gap` flags for `meta.summary`.

**After every subagent has completed**, the main agent declares **only** the cross-feature seams through `apltk architecture ... --spec <spec_dir>`, then renders and validates the overlay.

- **Pause →** Do `planned` / `gap` markers read consistently across affected sub-modules?
- The main agent **MUST NOT** re-declare a subagent’s intra-feature components, and **MUST NOT** open source files for any feature it delegated.

- **Pause →** Does `apltk architecture diff` pair every changed page correctly? If a page shows as add + remove instead of modified, you renamed a slug somewhere — re-check.

### 4) Traceability (suggested)

Use `feature-trace` (or `meta.summary` for spec-only changes) to map spec IDs to implementation status: `met` / `partial` / `planned` / `gap`.

### 5) Report

List overlay files touched (or verb families used), the diff counts (`modified` / `added` / `removed`) from `apltk architecture diff`, confirmation that **all subagents finished before cross-feature wiring**, unresolved spec-vs-code gaps, and any follow-ups.

## Sample hints

- **Batch merge**: each member spec still calls `--spec <member_dir>`, but the CLI resolves writes to the shared batch-root overlay beside `coordination.md`; `diff` shows the batch as one combined architecture delta.
- **Spec shrinks scope**: prefer `submodule set --role "deprecated: ..."` before `submodule remove` so reviewers see intent.
- **Design-only change**: still review edges — order shifts surface as edge mutations; `validate --spec` catches dangling references.

## References

- `init-project-html/SKILL.md` — semantic contracts and acceptance criteria.
- `init-project-html/references/TEMPLATE_SPEC.md` — schema cheat sheet (fields/enums), not a command list.
- **`apltk architecture --help`** — live CLI reference.
