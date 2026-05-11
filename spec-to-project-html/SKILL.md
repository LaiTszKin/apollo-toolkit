---
name: spec-to-project-html
description: >-
  Sync the project HTML architecture atlas to active planning specs by driving `apltk architecture --spec <spec_dir>`. The CLI writes overlay YAML under `<spec_dir>/architecture_diff/atlas/` and re-renders only the affected proposed-after HTML pages — macro SVG and per-sub-module internal-dataflow diagrams stay zoomable just like the base atlas — so `apltk architecture diff` can pair before/after by path. Preserve the two-layer rule and the responsibility split: when subagents are available, each subagent reads ONE affected feature and declares EVERY intra-feature change itself (sub-modules, function / variable / dataflow / error rows, intra-feature edges including error and rollback flows); the main agent only aggregates outbound-boundary summaries and declares cross-feature edges. Without subagents, process features sequentially with the same split. Ground every declaration in repo evidence; mark `TBD` when code is missing.
---

# Spec To Project HTML

## Dependencies

- Required: **`init-project-html`** — its `SKILL.md` is the rulebook for what each component declaration means and which verbs to call. Reuse the same CLI here with `--spec`.
- Conditional: **`recover-missing-plan`** if a spec pointer is missing.
- Conditional: **`generate-spec`** / **`implement-specs*`** terminology for requirement IDs.
- Optional: **`review-spec-related-changes`** when verifying diagram updates against specs.
- Fallback: spec demands components that are absent from code → declare them but use `TBD` strings or a `gap` token in the role/purpose/dataflow fields; **MUST NOT** mark them as implemented.

## Non-negotiables

- **MUST** read specs in order unless the user directs otherwise: `spec.md` → `design.md` → `contract.md` → coordination notes.
- **MUST** declare every change through the CLI with `--spec <spec_dir>`. The CLI writes overlay YAML to `<spec_dir>/architecture_diff/atlas/` and re-renders only the affected proposed-after HTML pages there. **MUST NOT** hand-edit `architecture_diff/**/*.html` — the renderer owns those files.
- **MUST** obey the semantic rules from `init-project-html/SKILL.md`:
  - Sub-module pages stay self-only — express cross-boundary interactions via `edge add` (cross-feature) or intra-feature `edge add`, never as sub-module page prose.
  - Feature pages stay lightweight — declare cross-submodule choreography through edges, not through sub-module-internal `dataflow` steps that wander outside the sub-module.
- **MUST** reconcile new requirements and design deltas through CLI verbs:
  - Add a sub-module → `submodule add --spec ...`. Removing → `submodule remove --spec ...` (the CLI lists the removed page in `_removed.txt` automatically).
  - Rename a sub-module → `submodule remove` then `submodule add` with the new slug; the CLI emits both the removal entry and the new HTML page so `apltk architecture diff` classifies it as remove + add.
  - Function / variable / dataflow / error deltas → corresponding `add` or `remove` verbs scoped to the sub-module.
  - Edge changes → `edge add` or `edge remove` (use the stable `--id` when available to make the remove unambiguous).
- **MUST NOT** drop modules that are still present in code just because the spec omits them — keep them, or rewrite their role/purpose strings to flag "out of spec scope".
- **MUST** scope reads to the **affected feature modules** identified from the spec/design diff (plus any feature owning a cross-feature edge into an affected one). Apply the same context-safe read strategy as `init-project-html` Rule 3 — **subagents own intra-feature overlay changes; the main agent owns cross-feature seams**:
  - **With subagents (preferred)** — main agent lists affected features first, then dispatches **one write-capable subagent per affected feature**. Each subagent deep-reads its feature and applies every intra-feature overlay mutation itself via `apltk architecture ... --spec <spec_dir> --feature <slug>` (add/remove sub-modules, function / variable / dataflow / error deltas, intra-feature edges — including error / rollback edges and ordered dataflow steps that capture variable state transitions). It returns ONLY a structured change summary of outbound boundaries (cross-feature edges added / changed / removed, with direction and proposed labels) plus its sub-module change list. The main agent never re-reads the feature source; it batches **only cross-feature** `edge add|remove` verbs from the aggregated summaries, then runs `apltk architecture render --spec ...` and `apltk architecture validate --spec ...`.
  - **Without subagents** — process features one at a time: read one affected feature, **immediately** drive the CLI verbs for that feature (with `--spec ...`). Drop function-level details from memory before reading the next feature.
  - **Forbidden**: loading every affected feature's source into the main agent's context before declaring — early details get pushed out and overlay declarations contradict each other.
- **MUST** run `apltk architecture validate --spec <spec_dir>` after the final mutation. Resolve every reported error before reporting completion.

## Standards (summary)

- **Evidence**: cite the spec passage (design subsystem entry) alongside the code path; record the citation in `meta.summary` or in sub-module purposes when relevant.
- **Execution**: locate the plan set → list affected feature modules → branch by environment (subagent fan-out OR sequential read-declare) → `apltk architecture validate --spec ...` → handover.
- **Quality**: macro overlay still shows every cross-feature data-row the spec requires; sub-module declarations stay self-only; `apltk architecture diff` opens cleanly with no orphan pages; no dangling edges.
- **Output**: touches only `<spec_dir>/architecture_diff/atlas/**` (overlay state) and `<spec_dir>/architecture_diff/**/*.html` (renderer output). Base `resources/project-architecture/` is **NEVER** mutated.

## Acceptance criteria (mirrors `init-project-html`)

Open the proposed-after viewer (`apltk architecture diff`) and verify both criteria on the overlay pages before reporting completion:

1. **The macro overlay clearly shows the proposed-after feature × sub-module relationships**, including data flow (`--kind data-row`), interaction logic (`--kind call` + `--kind return`), error handling and rollback (`--kind failure`). Any new / changed / removed cross-boundary path the spec implies MUST exist as an edge mutation in the overlay — not as sub-module prose.
2. **Each touched sub-module's internal overlay diagram clearly shows the function-level interactions inside it**, including function-to-function flow (`dataflow add --fn <declared-fn>`), variable state transitions (`--reads` / `--writes` referencing declared variables), and the resulting local data flow. If the spec introduces a new function or variable that participates in the flow, declare it via `function add` / `variable add` first, then reference it from the new `dataflow` step so `validate --spec` passes.

## Workflow

### 1) Resolve spec inputs

User-pointed path wins; otherwise use the batch `coordination.md` or `recover-missing-plan` to find the most recent plan; collect `R…` / `INT-…` IDs for traceability.

### 2) List the affected feature modules (no function bodies yet)

Derive from the spec/design diff which feature modules change: new sub-modules, edge changes, variable changes, error changes, retired sub-modules… **Also** include any feature owning the other end of a cross-feature edge that is being changed (even if that feature's own spec is untouched). Record only `slug + change-kind`; do not enter function bodies yet.

### 3) Branch the deep-read + declare by environment (mirrors `init-project-html` Rule 3)

#### 3A) With subagents (preferred) — workers patch their feature; main agent patches only cross-feature edges

Dispatch one **write-capable subagent per affected feature**, plus the main agent for the macro seams. Each subagent owns every intra-feature overlay write and reports outbound boundaries upward:

> **Feature `<slug>` subagent contract (overlay)**
> - Read this feature's affected sub-modules and the cited spec passages / requirement IDs.
> - Apply every intra-feature overlay mutation via `apltk architecture ... --spec <spec_dir>`:
>   - `submodule add|set|remove` for added / renamed / retired / kind-or-role-changed sub-modules.
>   - `function add|remove`, `variable add|remove`, `dataflow add|remove|reorder`, `error add|remove` for per-sub-module deltas. Order `dataflow` steps so the **variable state transitions** through the new path are visible end-to-end.
>   - Intra-feature `edge add|remove` for every changed function-call / return / data-row / failure / rollback edge between the feature's own sub-modules.
> - Run `apltk architecture validate --spec <spec_dir>` (scoped check) before returning.
> - **Return ONLY**: (i) the sub-module change list (slug + change-kind + new kind/role when relevant), (ii) outbound boundary changes (cross-feature edges added / changed / removed, with the other-end `feature/sub` and the suggested `--kind` / `--label`), (iii) any `planned` / `gap` flags so the main agent can mirror them in `meta.summary` if needed.

Main agent — after every subagent returns — declares **only** the cross-feature seams and renders once:

```bash
# one verb per cross-feature edge reported by the subagents
apltk architecture edge add --spec <spec_dir> --from <featA>/<subA> --to <featB>/<subB> --kind call|return|data-row|failure --label "..." --no-render
apltk architecture edge remove --spec <spec_dir> --id <stable_id> --no-render
apltk architecture render --spec <spec_dir>
apltk architecture validate --spec <spec_dir>
```

- **Pause →** Do every `planned` / `gap` declaration appear consistently across affected sub-modules (e.g. role text + variable purpose strings)? Inconsistency would mislead reviewers.
- The main agent **MUST NOT** re-declare a subagent's intra-feature components, and **MUST NOT** open source files for any feature it delegated.

#### 3B) Without subagents — feature-by-feature read-declare loop

Process the step-2 list one feature at a time. Per feature:

1. **Deep-read** this feature's affected sub-modules.
2. **Run CLI verbs immediately** with `--spec ...`: `submodule add|set|remove`, `function add|remove`, `variable add|remove`, `dataflow add|remove|reorder`, `error add|remove`, intra-feature `edge add|remove`.
3. **Cross-feature edges**: if the target feature has not been overlaid yet, add the edge anyway — the CLI accepts edges into features that exist in the base atlas without re-declaring them in the overlay.
4. **Drop function-level memory** of this feature; keep only cluster id + edge notes.
5. Move to the next feature.

Final pass after every feature is patched:

- `apltk architecture render --spec <spec_dir>` (if you used `--no-render`).
- `apltk architecture validate --spec <spec_dir>`.

- **Pause →** Did `apltk architecture diff` pair every changed page correctly? If a page shows up as add + remove instead of modified, you renamed a slug somewhere. Re-check.

### 4) Traceability (suggested)

Use `feature-trace` (or in `meta.summary` for spec-only changes) to map spec IDs to implementation status: `met` / `partial` / `planned` / `gap`.

### 5) Report

List touched verbs (or the generated YAML files), the resulting diff counts (modified / added / removed) from `apltk architecture diff`, the read strategy used (3A or 3B), unresolved spec-vs-code gaps, and any follow-ups.

## Sample hints

- **Batch merge**: when one domain has multiple specs, each member's `--spec <member_dir>` writes its own overlay; `apltk architecture diff` shows them as separate sections in the paginated viewer.
- **Spec shrinks scope**: prefer `submodule set --role "deprecated: ..."` so reviewers see the planned retirement before issuing `submodule remove`.
- **Design-only change**: still review edges — interaction order shifts even when no sub-module is added; verify with `apltk architecture validate` to surface dangling references.

## References

- `init-project-html/SKILL.md` — authoritative verb-by-verb rulebook.
- `init-project-html/references/TEMPLATE_SPEC.md` — component schema cheat sheet (also linked from this skill's `references/TEMPLATE_SPEC.md`).
- `apltk architecture --help` — live CLI reference.
