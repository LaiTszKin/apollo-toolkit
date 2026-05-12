---
name: init-project-html
description: >-
  Declare the project HTML architecture atlas through `apltk architecture` instead of hand-writing SVG/HTML. Two acceptance criteria gate completion: (1) the macro diagram clearly shows feature × sub-module relationships — data flow, call/return interaction logic, error handling, rollback — all expressed as cross-sub-module edges with kinds `call`, `return`, `data-row`, and `failure`; (2) each sub-module’s internal diagram shows function-level flow (`dataflow` steps may reference a declared function plus `reads`/`writes` of declared variables). The tool owns layout, CSS, pan/zoom, and validation. **Subagents only:** one write-capable subagent per feature declares every intra-feature change; the main agent **waits until all subagents finish**, then wires **only** cross-feature seams. **Exact CLI spelling:** always `apltk architecture --help` — never treat prose in this file as the command list. Anchor every declaration to repo evidence.
---

# Init Project HTML

## Dependencies

- Required: none (the CLI ships its own layout engine, CSS, and pan/zoom client; `apltk architecture` is installed with this toolkit).
- Conditional: `spec-to-project-html` when the same atlas needs spec-driven refresh — that skill uses the same CLI with `--spec`.
- Optional: `align-project-documents` when `docs/features` already names the user-visible capabilities.
- Fallback: codebase too large for one pass → use the **subagent** strategy below; document scanned roots and explicit omissions in `meta.summary`. **MUST NOT** declare components for code paths that were never read.

## Non-negotiables

### Rule 1 — Use the CLI; never hand-author atlas HTML

The atlas state lives in `resources/project-architecture/atlas/` (`atlas.index.yaml` + per-feature YAMLs). Every change goes through the CLI (exact verbs/flags: **`apltk architecture --help`**). After any mutation, the CLI re-renders `resources/project-architecture/**/*.html` with the correct layout, CSS, pan/zoom, and ARIA — agents **MUST NOT** edit those HTML files by hand or invent additional ones.

### Rule 2 — Sub-module pages describe only themselves; the internal-dataflow diagram is zoomable and structurally typed

What the CLI emits on each sub-module page is fixed in *role* (not in exact flag names — those live in `--help`):

- **Function I/O table** — one row per declared function/side-effect entry point.
- **Variables table** — business-purpose identifiers (`scope` enum and `purpose` text).
- **Internal dataflow** — ordered steps inside a pan/zoom viewport (+/−/Fit), same interaction model as the macro SVG. Steps may attach a declared function name and comma-separated read/write variable names; the renderer shows them as a function pill and read/write chips so **function-to-function flow** and **variable state** are visible in one diagram.
- **Local errors** — symbolic error rows (`when` / `means`).

**Structural constraints** (enforced by `validate`):

- Any function name referenced from a dataflow step must already exist on **that** sub-module (`function` row).
- Any variable name in reads/writes must already exist on **that** sub-module (`variable` row).
- Purely descriptive steps without fn/reads/writes are allowed, but non-trivial sub-modules **MUST** fill the structure so the diagram is not hollow.

Cross-boundary narratives (“I call X”, “Y calls me”) **MUST** be **edges** between `feature/submodule` endpoints with a `kind` of `call`, `return`, `data-row`, or `failure` — never as extra prose on a sub-module page. There is no CLI path to smuggle cross-boundary text onto sub-module pages.

### Rule 3 — Read order: subagents only; wait for all workers before cross-feature wiring

Real production codebases dwarf the main agent’s context. **MUST** use this pattern only:

1. Enumerate the **feature-module list** (slug + entry + boundary resources only) — **no** function-body deep reads at this stage.
2. Dispatch **one write-capable subagent per feature** (every feature in scope that needs atlas work). Each subagent:
   - deep-reads **only** its feature;
   - declares **everything intra-feature** via `apltk architecture` scoped with `--feature <slug>` where the CLI allows (exact scoping flags: **`--help`**): sub-modules, per-sub-module functions / variables / ordered dataflow / errors, and **every intra-feature edge** (calls, returns, data-rows, failures, rollback/compensation **between sub-modules of the same feature**);
   - returns **ONLY** a structured summary of (i) sub-module list (slug + kind + one-line role) and (ii) **outbound boundaries** the orchestrator must wire later (calls / data-rows / failures **to other features’** sub-modules — direction, endpoints, suggested kind/label).

3. **Gate — all subagents complete:** The main agent **MUST NOT** declare any **cross-feature** `edge`, shared `meta` that encodes multi-feature narrative, nor any `actor` that exists only to stitch features together, **until every dispatched subagent has finished** (success **or** an explicit failure report). Partial summaries are for note-taking only — **not** for mutating cross-feature atlas state.

4. After the gate: the main agent aggregates outbound boundary notes, declares **only** cross-feature edges (and optional shared `meta` / `actor` if needed), then runs **`apltk architecture render`** (if batched with `--no-render`) and **`apltk architecture validate`**.

The main agent **MUST NOT** re-read source for a delegated feature and **MUST NOT** re-declare intra-feature components a subagent already owns.

### Rule 4 — Evidence over invention

- **MUST** anchor every declared feature, sub-module, function, variable, dataflow step, and edge to a concrete path / symbol / SQL / config; record scanned roots and any deliberate omissions in `meta.summary` via the CLI (`meta` verbs — flags: **`--help`**).
- **MUST NOT** invent modules, integrations, or sub-modules just because the diagram “looks balanced”. Empty rows are valid; lies are not.

## Standards (summary)

- **Evidence**: every CLI declaration traces to a path/symbol/SQL/config; uncertain areas surface as `TBD` strings or are omitted with a recorded reason.
- **Execution**: shallow feature-module list → subagent fan-out per feature → **wait for all** → cross-feature edges / meta → `validate` → handover.
- **Quality**: macro SVG carries every cross-feature data-row edge that exists in the system; sub-module declarations are self-only; pan/zoom + Fit work in the rendered HTML; `apltk architecture validate` returns OK.
- **Output**: `resources/project-architecture/atlas/` (YAML state) + `resources/project-architecture/**/*.html` (renderer output) — both managed by the CLI.

## Acceptance criteria

The atlas is only complete when both of the following are demonstrably true on the rendered HTML (open `resources/project-architecture/index.html` and one representative sub-module page to verify):

1. **Macro diagram clearly shows the relationships between features and sub-modules**, including:
   - **Data flow** — every cross-feature DB row, queue topic, or cache key hand-off is a `data-row` **edge** between producing and consuming sub-modules (not free-form prose).
   - **Interaction logic** — synchronous request/response paths use paired **`call`** (outbound) and **`return`** edges with a label that names the call site or response shape.
   - **Error handling and rollback** — every failure / compensation / retry path that crosses a sub-module boundary is a **`failure`** edge with a label that names what is rolled back or compensated.
   - No cross-boundary interaction exists **only** in sub-module page prose — it **MUST** appear as an edge on the macro SVG.
2. **Each sub-module’s internal diagram clearly shows the function-level interactions inside the sub-module**, including:
   - **Function-to-function flow** — non-trivial steps reference a declared function on that sub-module.
   - **Variable state transitions** — variables read or written by a step are declared first, then referenced on the step; reading top-to-bottom traces lifecycle.
   - **Local data flow** — ordered steps read as a directed flowchart to the sub-module boundary.

`apltk architecture validate` **MUST** return OK before reporting completion.

## CLI reference

Run **`apltk architecture --help`** and the deeper `apltk architecture <verb> [subverb] --help` pages for the authoritative command tree, required flags, examples, and expected results. This skill keeps only the semantic rules, acceptance criteria, and subagent coordination rules so the documentation does not drift when the CLI evolves.

**Cross-feature work timing:** only after **all** feature subagents have returned (Rule 3).

## Workflow

### 1) Whole-repo inventory — list feature modules, not function bodies

Scan the shipped source for **user-visible capabilities** (each one = one feature module): entry routes, CLI commands, UI pages, cron jobs, runners, event handlers, CDC streams. Record only kebab-case slug + one-line user story + boundary points (entry symbol, outbound DB tables / queue topics / external services).

- **Pause →** Is the list actually complete? Note skipped roots with reason; no silent skips.
- **Pause →** Did I dive into function bodies here? Roll back — keep only structural notes.

### 2) Subagent fan-out — workers own features; orchestrator owns cross-feature seams **after** all workers finish

Dispatch one **write-capable** subagent per feature. Hand each subagent: its feature slug, the feature-module list from step 1 (so it knows other features’ slugs for outbound edges), and **`apltk architecture --help`** as the flag reference.

> **Feature `<slug>` subagent contract**
> - Read every sub-module of this feature.
> - Declare the feature and its sub-modules (`feature` / `submodule` — exact flags: **`--help`**).
> - For every sub-module: add **function**, **variable**, ordered **dataflow**, and **error** rows as needed.
> - For every intra-feature interaction between sub-modules, add an **edge** whose endpoints stay **inside** this feature.
> - Run **`apltk architecture validate`** before returning (same project root; use **`--help`** for project/spec flags).
> - **Return ONLY**: (i) sub-module list (slug + kind + one-line role), (ii) outbound boundaries to *other* features’ sub-modules (direction + edge kind + suggested label). No source dumps.

**Orchestrator — after every subagent has completed:** declare only the cross-feature `apltk architecture` mutations reported by the workers, then render and validate once.

The main agent **MUST NOT** re-declare a subagent’s intra-feature components, and **MUST NOT** open source files for any feature it delegated.

### 3) Handover report

Report: feature count, sub-module count, macro edge counts (call / return / data-row / failure), uncovered paths + reasons, confirmation that **all subagents completed before cross-feature wiring**, and the location of the rendered atlas (`resources/project-architecture/index.html`).

## Sample hints

- Multiple SQL paths on `service ↔ db` → one **`edge`** per SQL path so the macro shows distinct strokes.
- Retry loops between `service ↔ generator(pure)` → **`call` / `return`** pair on the macro plus ordered **`dataflow`** steps on the service that show retry budget and persistence.
- Cross-feature DB hand-off (A writes, B reads) → both sides declare DB-oriented functions, then a **`data-row`** edge from producer to consumer.
- Rollback / compensation across sub-modules → **`failure`** edge with an explicit label; cleanup *inside* a single sub-module belongs in ordered **`dataflow`** steps.
- Third-party systems → **`external`** kind sub-modules so the trust boundary is visible in styling.

## References

- `lib/atlas/schema.js` — fields, enums, validation. `references/TEMPLATE_SPEC.md` mirrors the schema as a cheat sheet (not a substitute for **`apltk architecture --help`**).
- `lib/atlas/cli.js` — implementation of dispatch (`apltk architecture --help` prints usage).
- `init-project-html/sample-demo/` — end-to-end YAML + rendered HTML for two features.
