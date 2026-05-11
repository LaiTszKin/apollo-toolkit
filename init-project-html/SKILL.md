---
name: init-project-html
description: >-
  Declare the project HTML architecture atlas through `apltk architecture` CLI verbs instead of hand-writing SVG/HTML. Two acceptance criteria gate completion: (1) the macro diagram clearly shows feature × sub-module relationships — data flow, call/return interaction logic, error handling, rollback — all expressed as `--kind call|return|data-row|failure` edges; (2) each sub-module's internal diagram clearly shows function-level interactions inside it — function-to-function flow via `dataflow add --fn <declared-fn>`, variable state transitions via `--reads`/`--writes` referencing declared variables, and the resulting local data flow. The tool owns layout, CSS, and pan/zoom for both diagrams; `validate` rejects any step that references an undeclared function or variable. With subagents, each owns one feature and declares every intra-feature interaction itself; the main agent only declares cross-feature edges. Anchor every declaration to repo evidence.
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

### Rule 2 — Sub-module pages describe only themselves; the internal-dataflow diagram is zoomable and structurally typed

What the CLI emits on each sub-module page is fixed:

- function I/O table (`function add --feature X --submodule Y --name fn --in ... --out ... --side ... --purpose ...`),
- variables-with-business-purpose table (`variable add --name v --type T --scope call|tx|persist|instance|loop --purpose ...`),
- internal dataflow diagram — ordered steps the renderer lays out as a numbered top-to-bottom flow inside a pan/zoom viewport with +/−/Fit controls, exactly like the macro SVG. Each step is `dataflow add --step "..." [--fn <declared-fn>] [--reads "v1,v2"] [--writes "v3,v4"]`. The renderer surfaces `--fn` as a pill at the top of the step box, `--reads` as a green chip on the bottom-left, and `--writes` as an orange chip on the bottom-right — so a single SVG simultaneously shows the function-to-function flow inside the sub-module AND the variable state transitions across the run,
- local errors (`error add --name ErrX --when ... --means ...`).

Schema rules the CLI enforces on every `dataflow add` (so the diagram never lies):

- `--fn <name>` must match a function declared **in the same sub-module** via `function add`. If it does not, `validate` fails — declare the function first.
- Every name in `--reads` / `--writes` must match a variable declared **in the same sub-module** via `variable add`. If it does not, `validate` fails — declare the variable first.
- `--fn` / `--reads` / `--writes` are optional but additive: omitting them is allowed for purely descriptive steps, but for any non-trivial sub-module the function-and-variable structure **MUST** be filled in so the diagram conveys the function-to-function flow and the variable state transitions.

Cross-boundary narratives ("I call X", "Y calls me") **MUST** be expressed as edges (`edge add --from X/sub --to Y/sub --kind call|return|data-row|failure --label ...`), never as sub-module page prose. The CLI enforces this by design — there is no verb to add cross-boundary text to a sub-module page.

### Rule 3 — Read order: never let the codebase wipe the context window; subagents own their own feature

Real production codebases dwarf the main agent's context. Reading the whole repo before declaring pushes early details out by the end, making macro edges and sub-module declarations contradict each other. The split below also draws a hard responsibility line between the worker and the orchestrator. **MUST** follow one of:

- **With subagents (preferred):** first enumerate the **feature-module list** (slug + entry + boundary resources only). Then dispatch **one (write-capable) subagent per feature**. Each subagent:
  - deep-reads its own feature,
  - declares **everything intra-feature** itself via `apltk architecture ... --feature <slug>` (sub-modules; per sub-module functions / variables / internal dataflow / errors; **every intra-feature edge** — function calls between sub-modules, error edges, rollback / compensation edges; variable state transitions are captured as ordered `dataflow add` steps on each sub-module),
  - returns ONLY a structured summary of (i) the sub-module list and (ii) the **outbound boundaries** the main agent needs to wire (calls / data-rows / failure edges to other features' sub-modules, including direction and the consuming/producing endpoints).

  The main agent never re-reads source for that feature. It collects every subagent's outbound-boundary summary and declares **only the cross-feature edges** (and any cross-feature actors / meta) itself, then runs `apltk architecture validate`.
- **Without subagents:** process features **one at a time** — read feature A end-to-end, declare its sub-modules, functions, variables, internal dataflow, errors, and intra-feature edges via the CLI, then move on. For cross-feature edges that point at not-yet-declared features, declare the placeholder feature with `feature add --slug <future> --title <future>` first, then add the edge; subsequent passes set the real title/story. Drop A's function-level details from working memory before reading feature B.

Both paths share one invariant: at any moment the agent doing the deep read only holds *that feature's details + cross-feature boundary notes*. The main agent's working set, in subagent mode, is **boundaries only**. Run `apltk architecture validate` after the last feature to catch dangling edges, unknown endpoints, or missing required fields.

### Rule 4 — Evidence over invention

- **MUST** anchor every declared feature, sub-module, function, variable, dataflow step, and edge to a concrete path / symbol / SQL / config; record scanned roots and any deliberate omissions in `meta.summary` via `apltk architecture meta set --summary "..."`.
- **MUST NOT** invent modules, integrations, or sub-modules just because the diagram "looks balanced". Empty rows are valid; lies are not.

## Standards (summary)

- **Evidence**: every CLI declaration traces to a path/symbol/SQL/config; uncertain areas surface as `TBD` strings or are omitted with a recorded reason.
- **Execution**: feature-module list (shallow) → branch by environment (subagent fan-out or sequential read-declare) → `apltk architecture validate` → handover report.
- **Quality**: macro SVG carries every cross-feature data-row edge that exists in the system; sub-module declarations are self-only; pan/zoom + Fit work in the rendered HTML; `apltk architecture validate` returns OK.
- **Output**: `resources/project-architecture/atlas/` (YAML state) + `resources/project-architecture/**/*.html` (renderer output) — both managed by the CLI.

## Acceptance criteria

The atlas is only complete when both of the following are demonstrably true on the rendered HTML (open `resources/project-architecture/index.html` and one representative sub-module page to verify):

1. **Macro diagram clearly shows the relationships between features and sub-modules**, including:
   - **Data flow** — every cross-feature DB row, queue topic, or cache key hand-off is a `--kind data-row` edge between the producing and consuming sub-modules (not free-form prose).
   - **Interaction logic** — synchronous request/response paths are paired `--kind call` (outbound) and `--kind return` (response) edges with a label that names the call site or response shape.
   - **Error handling and rollback** — every failure / compensation / retry path that crosses a sub-module boundary is a `--kind failure` edge with a label that names what is being rolled back or compensated.
   - No interaction is captured *only* in sub-module page prose — if it crosses a sub-module boundary it MUST appear as an edge so the macro SVG carries it.
2. **Each sub-module's internal diagram clearly shows the function-level interactions inside the sub-module**, including:
   - **Function-to-function flow** — every step that does non-trivial work carries `--fn <declared-fn>`. The sequence of pills along the steps reveals which function is active at each point in the flow.
   - **Variable state transitions during the run** — every variable that is read or mutated by a step is declared via `variable add`, and that step lists it in `--reads` (the value flows in) or `--writes` (the value is created/updated). Reading the steps top-to-bottom traces each variable's life cycle.
   - **Local data flow** — the ordered step boxes (with reads/writes chips) read as a directed flowchart, ending at the sub-module boundary (returning a value, persisting a row, emitting an event).

`apltk architecture validate` MUST return OK before reporting completion — it enforces both criteria's structural pieces (unknown sub-modules on edges, unknown functions/variables referenced by dataflow steps).

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
| `apltk architecture dataflow add --feature X --submodule Y --step "..." [--fn <declared-fn>] [--reads "v1,v2"] [--writes "v3,v4"] [--at N]` | Append (or insert at index `N`) an internal dataflow step. `--fn` must match a previously declared `function`; every name in `--reads` / `--writes` must match a previously declared `variable` in the same sub-module — the renderer surfaces them as a function pill + reads/writes chips so the diagram shows function-to-function flow and variable state transitions. |
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

#### 2A) With subagents (preferred) — workers own their feature; main agent owns the macro seams

Dispatch one **write-capable** subagent per feature, plus the main agent for the macro layer. Hand each subagent: its feature slug, the feature-module list from step 1 (so it knows other features' slugs for outbound edges), and access to `apltk architecture`. Each subagent **declares its own feature end-to-end** and only reports outbound boundaries upward:

> **Feature `<slug>` subagent contract**
> - Read every sub-module of this feature.
> - Run `feature add --slug <slug> --title "..." --story "..." --no-render` (or `feature set` if a placeholder already exists).
> - For every sub-module: `submodule add` with the right `--kind`, then add its `function`, `variable`, `dataflow` (ordered — these steps carry the variable state transitions through the flow), and `error` rows.
> - For every intra-feature interaction between sub-modules — function calls, returns, error propagation, rollback / compensation — emit `edge add --from <slug>/<a> --to <slug>/<b> --kind call|return|data-row|failure --label "..."`. Failure / rollback flows belong here: model them as additional `--kind failure` edges or as ordered `dataflow add` steps on the affected sub-modules, whichever maps to the real code path.
> - Run `apltk architecture validate` (scoped to this feature) before returning.
> - **Return ONLY**: (i) sub-module list (slug + kind + one-line role), (ii) outbound boundaries to *other* features' sub-modules (direction + edge kind + suggested label). No source excerpts, no function bodies.

Main agent — after every subagent returns — declares **only** macro-level state from the aggregated outbound boundaries:

```bash
apltk architecture meta set --title "..." --summary "..." --no-render
# only when an actor is shared across multiple features:
apltk architecture actor add --id <id> --label "..." --no-render
# one edge per cross-feature interaction reported by the subagents:
apltk architecture edge add --from <featA>/<subA> --to <featB>/<subB> --kind call|return|data-row|failure --label "..." --no-render
apltk architecture render
apltk architecture validate
```

The main agent **MUST NOT** re-declare a subagent's intra-feature components, and **MUST NOT** open source files for any feature it delegated.

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
- Retry loops between `service ↔ generator(pure)` → call/return pair in the macro plus a `dataflow add` step in the service with `--fn issueCode --writes "code"` describing the retry budget; a follow-up step `--fn issueCode --reads "code" --writes "row"` then captures the persistence attempt.
- Variable state transitions inside one function (e.g. `code` is computed, persisted, then returned) → emit one `dataflow add` per logical mutation, with `--fn` constant and `--reads` / `--writes` listing every variable that changes shape at that point. The sub-module page chips trace each variable's life cycle top-to-bottom.
- Cross-feature DB hand-off (A writes, B reads) → declare both sides' `INSERT_*` / `SELECT_*` functions on the `db` sub-module, then `edge add --kind data-row` from producer feature/submodule to consumer feature/submodule.
- Rollback / compensation across sub-modules → `edge add --kind failure --label "rollback on dup"`; rollback *within* a single sub-module belongs in `dataflow add` (with `--fn` set to whichever function owns the cleanup).
- Third-party systems → declare as `--kind external` sub-modules; the trust boundary becomes visible because the renderer styles them differently.

## References

- `lib/atlas/schema.js` — single source of truth for component fields, enums, and validation. `references/TEMPLATE_SPEC.md` mirrors that schema as a quick-reference cheat sheet.
- `lib/atlas/cli.js` — full verb dispatch (run `apltk architecture --help` for the live usage).
- `init-project-html/sample-demo/` — end-to-end YAML + rendered HTML for two features.
