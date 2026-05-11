---
name: init-project-html
description: >-
  Declare the project HTML architecture atlas through `apltk architecture` CLI verbs instead of hand-writing SVG/HTML. The tool owns layout, no-overlap, DOM, CSS, and pan/zoom; the agent only declares features, sub-modules, functions, variables, dataflow steps, errors, and edges. Macro `index.html` always shows feature clusters with their sub-modules and every cross/intra-feature edge; each sub-module page describes only itself (function I/O + variables-with-business-purpose + internal dataflow + local errors); feature index pages stay lightweight. Read strategy avoids context loss: list feature modules first, then either dispatch one read-only subagent per feature and aggregate summaries before declaring, or process one feature at a time end-to-end. Anchor every declaration to repo evidence.
---

# Init Project HTML

## Dependencies

- Required: none (the CLI ships its own layout engine, CSS, and pan/zoom client; `apltk architecture` is installed with this toolkit).
- Conditional: `spec-to-project-html` when the same atlas needs spec-driven refresh — that skill uses the same CLI with `--spec`.
- Optional: `align-project-documents` when `docs/features` already names the user-visible capabilities.
- Fallback: codebase too large for one pass → use the subagent strategy below, document scanned roots and explicit omissions in `meta.summary`. **MUST NOT** declare components for code paths that were never read.

## Non-negotiables

### Rule 1 — Use the CLI; never hand-author atlas HTML

The atlas state lives in `resources/project-architecture/atlas/` (`atlas.index.yaml` + per-feature YAMLs). Every change goes through `apltk architecture <verb> ...`. After any mutation, the CLI re-renders `resources/project-architecture/**/*.html` with the correct layout, CSS, pan/zoom, and ARIA — agents **MUST NOT** edit those HTML files by hand or invent additional ones.

### Rule 2 — Sub-module pages describe only themselves

What the CLI emits on each sub-module page is fixed:

- function I/O table (`function add --feature X --submodule Y --name fn --in ... --out ... --side ... --purpose ...`),
- variables-with-business-purpose table (`variable add --name v --type T --scope call|tx|persist|instance|loop --purpose ...`),
- internal dataflow steps (`dataflow add --step "..."`),
- local errors (`error add --name ErrX --when ... --means ...`).

Cross-boundary narratives ("I call X", "Y calls me") **MUST** be expressed as macro edges (`edge add --from X/sub --to Y/sub --kind call|return|data-row|failure --label ...`), never as sub-module page prose. The CLI enforces this by design — there is no verb to add cross-boundary text to a sub-module page.

### Rule 3 — Read order: never let the codebase wipe the context window

Real production codebases dwarf the main agent's context. Reading the whole repo before declaring pushes early details out by the end, making macro edges and sub-module declarations contradict each other. **MUST** follow one of:

- **With subagents (preferred):** first enumerate the **feature-module list** (slug + entry + boundary resources only). Then dispatch **one read-only subagent per feature**. Each subagent deep-reads and returns ONLY a structured summary (sub-module list with kind/role; per sub-module: function I/O, variables-with-business-purpose, internal dataflow steps, errors; outbound edges to other features). The main agent collects every summary first, then drives the CLI in one pass to declare every component.
- **Without subagents:** process features **one at a time** — read feature A end-to-end, then declare it via the CLI (`feature add`, `submodule add`, `function add`, `variable add`, `dataflow add`, `error add`, intra-feature `edge add`). For cross-feature edges that point at not-yet-declared features, declare the placeholder feature with `feature add --slug <future> --title <future>` first, then add the edge; subsequent passes set the real title/story. Drop A's function-level details from working memory before reading feature B.

Both paths share one invariant: at any moment the main agent only holds *current-feature details + cross-feature boundary notes*. Run `apltk architecture validate` after the last feature to catch dangling edges, unknown endpoints, or missing required fields.

### Rule 4 — Evidence over invention

- **MUST** anchor every declared feature, sub-module, function, variable, dataflow step, and edge to a concrete path / symbol / SQL / config; record scanned roots and any deliberate omissions in `meta.summary` via `apltk architecture meta set --summary "..."`.
- **MUST NOT** invent modules, integrations, or sub-modules just because the diagram "looks balanced". Empty rows are valid; lies are not.

## Standards (summary)

- **Evidence**: every CLI declaration traces to a path/symbol/SQL/config; uncertain areas surface as `TBD` strings or are omitted with a recorded reason.
- **Execution**: feature-module list (shallow) → branch by environment (subagent fan-out or sequential read-declare) → `apltk architecture validate` → handover report.
- **Quality**: macro SVG carries every cross-feature data-row edge that exists in the system; sub-module declarations are self-only; pan/zoom + Fit work in the rendered HTML; `apltk architecture validate` returns OK.
- **Output**: `resources/project-architecture/atlas/` (YAML state) + `resources/project-architecture/**/*.html` (renderer output) — both managed by the CLI.

## How to use `apltk architecture`

Each verb is a single mutation; the CLI auto-renders after every change. Pass `--no-render` when batching mutations. Global flags: `--project <root>`, `--spec <spec_dir>` (writes to overlay; see `spec-to-project-html`), `--no-render`, `--no-open`.

| Verb | Use it to… |
| --- | --- |
| `apltk architecture meta set --title ... --summary ...` | Set the macro title + atlas summary (read order, scanned roots, deliberate omissions). |
| `apltk architecture actor add --id end-user --label "End user"` | Add a top-level actor (optional; appears in macro context). |
| `apltk architecture feature add --slug <kebab> --title "..." --story "..." [--depends-on a,b]` | Declare a feature module (user-visible capability). |
| `apltk architecture submodule add --feature <slug> --slug <kebab> --kind ui\|api\|service\|db\|pure-fn\|queue\|external --role "..."` | Declare a sub-module under a feature. |
| `apltk architecture function add --feature X --submodule Y --name fn --in "T1, T2" --out "R \| ErrX" --side pure\|io\|write\|tx\|lock\|network --purpose "..."` | Add a function I/O row. |
| `apltk architecture variable add --feature X --submodule Y --name v --type T --scope call\|tx\|persist\|instance\|loop --purpose "..."` | Add a variable-with-business-purpose row. |
| `apltk architecture dataflow add --feature X --submodule Y --step "..." [--at N]` | Append (or insert at index `N`) an internal dataflow step. |
| `apltk architecture dataflow reorder --feature X --submodule Y --from i --to j` | Move a step within the same sub-module. |
| `apltk architecture error add --feature X --submodule Y --name ErrCode --when "..." --means "..."` | Add a local error row. |
| `apltk architecture edge add --from <feature>[/sub] --to <feature>[/sub] --kind call\|return\|data-row\|failure --label "..." [--id <stable>]` | Add an edge. Intra-feature edges (both endpoints in the same feature with sub-modules) land in the feature YAML; cross-feature edges land in `atlas.index.yaml`. |
| `apltk architecture feature\|submodule\|function\|variable\|error\|edge remove ...` | Remove a previously declared component. Removing a feature drops every sub-module and edge that referenced it. |
| `apltk architecture feature\|submodule set ...` | Update fields (e.g. retitle a feature, change a sub-module's role) without re-adding. |
| `apltk architecture render` | Force-regenerate HTML from current YAML state (useful after editing YAML directly, though hand-editing is discouraged). |
| `apltk architecture validate` | Schema + referential integrity check; fails on dangling edges, unknown enums, duplicate slugs. |
| `apltk architecture undo` | Revert the most recent mutation (single-level snapshot). |
| `apltk architecture open` | Open the rendered macro `index.html` in a browser. |
| `apltk architecture diff` | Render the paginated before/after viewer for every active spec under `docs/plans/**/architecture_diff/`. |

## Workflow

### 1) Whole-repo inventory — list feature modules, not function bodies

Scan the shipped source for **user-visible capabilities** (each one = one feature module): entry routes, CLI commands, UI pages, cron jobs, runners, event handlers, CDC streams. Record only kebab-case slug + one-line user story + boundary points (entry symbol, outbound DB tables / queue topics / external services).

- **Pause →** Is the list actually complete? Note skipped roots with reason; no silent skips.
- **Pause →** Did I dive into function bodies here? Roll back — keep only structural notes.

### 2) Branch the deep-read by environment (Rule 3)

#### 2A) With subagents (preferred)

Dispatch one read-only subagent per feature. Require this summary template (no source-code excerpts):

> **Feature `<slug>` summary**
> - Sub-module list: one row per `<sub-module-slug>` (kind: ui / api / service / db / pure-fn / queue / external; one-line role).
> - Per sub-module: function signatures (in / out / side / purpose), variables-with-business-purpose, internal dataflow steps, errors raised.
> - **Outbound boundaries**: call edges to other features' sub-modules; data-row edges through shared DB tables / topics / cache keys with another feature; mark direction.

Main agent collects every summary, then drives the CLI in one pass:

```bash
apltk architecture meta set --title "..." --summary "..." --no-render
apltk architecture feature add --slug <slug> --title "..." --story "..." --no-render
# repeat submodule / function / variable / dataflow / error / edge add for the whole atlas
apltk architecture render
apltk architecture validate
```

#### 2B) Without subagents — feature-by-feature read-declare loop

Process the list from step 1 one feature at a time (topological hint: read-from data sources and pure helpers first, user-facing entries last). Per feature:

1. **Deep-read** every sub-module of this feature.
2. **Declare immediately** via the CLI (`feature add`, then `submodule add` × N, then `function`/`variable`/`dataflow`/`error` rows, then intra-feature `edge add`).
3. **Cross-feature edges**: if the target feature has not been declared yet, declare a placeholder with `feature add --slug <future> --title <future>`, add the edge, then refine the placeholder on a later pass.
4. **Drop function-level details from working memory** before moving to the next feature.

After the last feature:

- Refine any placeholder features that were used to carry cross-feature edges.
- Run `apltk architecture validate` — must return OK.

### 3) Handover report

Report: feature count, sub-module count, macro edge counts (call / return / data-row / failure), uncovered paths + reasons, the read strategy actually used (2A or 2B), and the location of the rendered atlas (`resources/project-architecture/index.html`).

## Sample hints

- Multiple SQL paths on `service ↔ db` → call `edge add` once per SQL path so the macro shows them as separate edges.
- Retry loops between `service ↔ generator(pure)` → call/return pair in the macro plus a dataflow step in the service describing the retry budget.
- Cross-feature DB hand-off (A writes, B reads) → declare both sides' `INSERT_*` / `SELECT_*` functions on the `db` sub-module, then `edge add --kind data-row` from producer feature/submodule to consumer feature/submodule.
- Third-party systems → declare as `--kind external` sub-modules; the trust boundary becomes visible because the renderer styles them differently.

## References

- `lib/atlas/schema.js` — single source of truth for component fields, enums, and validation. `references/TEMPLATE_SPEC.md` mirrors that schema as a quick-reference cheat sheet.
- `lib/atlas/cli.js` — full verb dispatch (run `apltk architecture --help` for the live usage).
- `init-project-html/sample-demo/` — end-to-end YAML + rendered HTML for two features.
