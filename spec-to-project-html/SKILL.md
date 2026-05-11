---
name: spec-to-project-html
description: >-
  Sync HTML architecture pages to active planning specs. **MUST** preserve the two-layer rule: macro `index.html` stays ONE SVG showing both feature-module and sub-module interactions (multi-edge, producer/consumer loops, cross-feature data-row); each sub-module page stays self-only (function I/O + variables-with-business-purpose + internal data flow + local errors). Feature `index.html` stays lightweight (story + submodule-nav). Read strategy mirrors `init-project-html`: list affected feature modules first; with subagents, dispatch one read-only subagent per affected feature to return summaries before patching; without subagents, patch one feature's pages plus its macro slice before moving to the next — never load every affected feature's code into the main context at once. Ground in repo evidence; mark `TBD` when code is missing.
---

# Spec To Project HTML

## Dependencies

- Required: **`init-project-html`** — its `SKILL.md` is the binding rulebook for page contracts (Rules 1–7), and its `references/architecture.css` is the shared asset to copy. Local cheat sheet (same vocabulary + class hooks + DOM snippets) lives in this skill's own `references/TEMPLATE_SPEC.md`.
- Conditional: **`recover-missing-plan`** if a spec pointer is missing.
- Conditional: **`generate-spec`** / **`implement-specs*`** terminology for requirement IDs.
- Optional: **`review-spec-related-changes`** when verifying diagram updates against specs.
- Fallback: spec demands components that are absent from code → label **planned / gap** in macro summary and on affected nodes; **MUST NOT** mark them as implemented.

## Non-negotiables

- **MUST** read specs in order unless the user directs otherwise: `spec.md` → `design.md` → `contract.md` → coordination notes.
- **MUST** open and parse the existing macro `index.html`, every `features/<slug>/index.html`, **and every sub-module HTML** before editing — preserve `data-feature-id` / `data-submodule-id` / `data-edge-id` unless a rename is explicit and propagated everywhere (including the macro SVG nav and the macro manifest).
- **MUST** obey `init-project-html/SKILL.md` Rules 1–7 (page contracts, naming, assets, accessibility, forbidden shortcuts). Two reminders that this skill violates most often:
  - **Rule 1** — cross-submodule interactions live only in the macro SVG (multi-edge, producer/consumer, cross-feature data-row); the macro **MUST** index every sub-module page.
  - **Rule 2** — sub-module pages contain only `sub-io` + `sub-vars` (variables-with-business-purpose) + `sub-dataflow` + `sub-errors`; no cross-boundary narrative.
- **MUST** reconcile new requirements and design deltas:
  - In the macro SVG, add/remove/relabel sub-module nodes and edges; every new node also gets a sub-module HTML and a manifest row.
  - On sub-module pages, add/remove/update function I/O and internal data flow; **never** describe cross-boundary interactions here — update the macro edges instead.
- **MUST** migrate any leftover legacy structure during the same edit pass:
  - feature index `flow-chart--submodules` / `flow-edge-manifest` / `flow-return-row` → move to the macro; feature index reverts to lightweight.
  - sub-module page `submodule-role` cross-boundary prose or cross-boundary manifests → delete or compress into a single "see macro" link.
  - legacy single-file `features/<slug>.html` → migrate to the directory layout.
- **MUST NOT** shrink the macro into prose-only or feature-only diagrams: the multi-edge + sub-module layer must remain visible in the SVG.
- **MUST NOT** drop modules that are still present in code just because the spec omits them — keep them, or annotate as "out of spec scope" with a reason.
- **MUST** scope reads to the **affected feature modules** identified from the spec/design diff (plus any feature owning a cross-feature edge into an affected one). Apply the same context-safe read strategy as `init-project-html` Rule 3:
  - **With subagents** — main agent lists affected features first, then dispatches **one read-only subagent per affected feature** to deep-read and return a structured change summary (affected sub-modules, variable / I/O / boundary deltas). Main agent **only** receives summaries, and only after every subagent reports does it patch the macro and pages in one pass.
  - **Without subagents** — process features one at a time: read one affected feature, **immediately** patch its `features/<slug>/` tree plus the macro cluster/nodes/edges (mark edges pointing at unread affected features with `data-edge-target-pending`). Drop function-level details from memory before reading the next feature. After all features are patched, resolve every pending edge in a final pass.
  - **Forbidden**: loading every affected feature's source into the main agent's context before patching — early details get pushed out and macro/sub-module pages contradict each other.

## Standards (summary)

- **Evidence**: cite the spec passage (design subsystem entry) alongside the code path.
- **Execution**: locate the plan set → read the existing HTML tree → list affected feature modules → branch by environment (subagent fan-out OR sequential read-patch-write; resolve macro pending edges last) → link check.
- **Quality**: the macro SVG keeps "≥2 edges on one node pair", "at least one producer/consumer loop", and "at least one cross-feature data-row" (when the spec still requires it); sub-module pages stay self-only; CSS paths correct; no pending edges left.
- **Output**: touches only `resources/project-architecture/**`. If files are missing, scaffold via `init-project-html` first, then merge spec deltas.

## Workflow

### 1) Resolve spec inputs

User-pointed path wins; otherwise use the batch `coordination.md` or `recover-missing-plan` to find the most recent plan; collect `R…` / `INT-…` IDs for traceability.

### 2) List the affected feature modules (no function bodies yet)

Derive from the spec/design diff which feature modules change: new nodes, edge changes, variable changes, error changes, retired sub-modules… **Also** include any feature that owns the other end of a cross-feature edge that is being changed (even if that feature's own spec is untouched). Record only `slug + change-kind`; do not enter function bodies yet.

### 3) Read the current HTML atlas (scoped to affected features)

Load the macro `index.html` + every affected feature directory + that directory's sub-module pages; list existing node/edge IDs; lock the IDs to preserve (so steps 4/5 do not silently rename).

### 4) Branch the deep-read + patch by environment (mirrors `init-project-html` Rule 3)

#### 4A) With subagents (preferred)

Dispatch one **read-only subagent per affected feature**, requiring this summary:

> **Feature `<slug>` change summary**
> - Matching spec passages / requirement IDs.
> - Affected sub-modules (added / renamed / retired / I/O changed).
> - Per sub-module: function I/O, variables-with-business-purpose (additions / removals / renames), internal flow, errors raised.
> - Boundary changes: new / changed / removed call edges and data-row edges (name the other-end feature / sub-module).
> - Spec items the code does not yet scaffold: mark as `planned` / `gap`.

Main agent collects summaries and patches in one pass:

1. Patch the macro `index.html`: add/change/remove `<a><g class="m-sub">` nodes; add/change/remove `<path class="m-edge ...">`; mirror in `flow-edge-manifest--macro`; preserve multi-edge, call/return pairs, cross-feature data-row.
2. Patch each affected `features/<slug>/index.html` (still lightweight) and each affected sub-module page (self-only: `sub-io`, `sub-vars`, `sub-dataflow`, `sub-errors` all in sync).
3. Update `<nav class="atlas-submodule-index">`: link new pages; remove retired pages.

- **Pause →** Do `planned` / `gap` nodes appear consistently in both the macro and `atlas-summary` as "not yet implemented"? Inconsistency would mislead readers.

#### 4B) Without subagents — feature-by-feature read-patch-write

Process the step-2 list one feature at a time. Per feature, run the full inner loop:

1. **Deep-read** this feature's affected sub-modules (functions, variables, boundaries).
2. **Patch immediately**:
   - `features/<slug>/index.html` (refresh user story; add/remove rows in `submodule-nav`; do NOT re-introduce a cross-submodule flowchart).
   - Each affected sub-module page:
     - Function I/O table updated (additions / renames / signature changes).
     - `sub-vars`: add, remove, or rename variables (including DB columns, config knobs, counters, time anchors) introduced by the spec/design; rewrite the business-purpose column to match the new branches.
     - `sub-dataflow` steps + small SVG refreshed.
     - `sub-errors` updated with any new error types.
     - Any leftover "who I talk to" text → move into a macro edge, or delete.
3. **Incremental macro patch**: sync this feature's nodes/edges/manifest rows; mark edges pointing at **unread** affected features as `data-edge-target-pending="<future-slug>"`.
4. **Drop function-level memory** of this feature; keep only cluster id and pending-edge notes.
5. Return to step 1 for the next feature.

Final pass after every feature is patched:

- Resolve every macro `pending` edge; none may remain.
- Verify `<nav class="atlas-submodule-index">` matches the final set of sub-module pages.

- **Pause →** Pending edges left? Step 2 missed an affected feature — re-read and patch.

### 5) Traceability (suggested)

Use `feature-trace` to map spec IDs to implementation status: `met` / `partial` / `planned` / `gap`.

### 6) Report

List touched files, new edges / nodes, the read strategy used (4A or 4B), unresolved spec-vs-code gaps, and any follow-ups.

## Sample hints

- **Batch merge**: when one domain has multiple specs, decide first whether sub-modules merge; keep node IDs unique.
- **Spec shrinks scope**: soften or remove nodes, but keep a `figcaption` footnote in the macro explaining the retired requirement.
- **Design-only change**: still re-review macro edges — interaction order shifts even when no module is added.
