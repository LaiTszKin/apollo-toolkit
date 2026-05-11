# Atlas component schema — reference cheat sheet

> Reference material only. The binding rules (read strategy, evidence requirements, what each verb means) live in `SKILL.md`. This file lists the exact fields and enum values that `apltk architecture` accepts; the renderer applies them to consistent DOM/CSS/ARIA hooks so agents never need to touch HTML.

## State files on disk

```
resources/project-architecture/
├── atlas/
│   ├── atlas.index.yaml          # meta + actors + feature slug order + cross-feature edges
│   ├── features/<slug>.yaml      # one file per feature (submodules + intra-feature edges)
│   ├── atlas.history.log         # append-only audit log (JSONL)
│   └── atlas.history.undo.json   # single-step undo snapshot
├── index.html                    # rendered (do not hand-edit)
├── features/<slug>/index.html    # rendered
├── features/<slug>/<sub>.html    # rendered
└── assets/                       # architecture.css + viewer.client.js (copied by the renderer)
```

## Components

### `meta`

| Field   | Type   | Required | Notes |
| ------- | ------ | -------- | ----- |
| title   | string | yes      | Macro page H1 + diff viewer title. |
| summary | string | no       | Renders below the title; record scanned roots and deliberate omissions here. |
| updatedAt | string (ISO) | auto | Touched on every save; do not set manually. |

CLI: `apltk architecture meta set --title "..." --summary "..."`

### `actors`

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| id    | kebab-case slug | yes | Stable identity. |
| label | string | yes | Display name. |

CLI: `apltk architecture actor add --id end-user --label "End user"`

### `feature`

| Field      | Type | Required | Notes |
| ---------- | ---- | -------- | ----- |
| slug       | kebab-case | yes | Matches the directory name `features/<slug>/`. |
| title      | string | yes | User-language capability name. |
| story      | string | no  | 1–3 sentence user story shown on the feature page. |
| dependsOn  | array of feature slugs | no | Shown as "Depends on:" links on the feature page. |
| submodules | array of submodule | yes | Render-order matches list order. |
| edges      | array of edge | no | Intra-feature edges (see below). |

CLI: `apltk architecture feature add --slug <kebab> --title "..." --story "..." [--depends-on a,b]`

### `submodule`

| Field      | Type | Required | Notes |
| ---------- | ---- | -------- | ----- |
| slug       | kebab-case | yes | Matches the HTML filename `features/<feature>/<slug>.html`. |
| kind       | enum `ui` `api` `service` `db` `pure-fn` `queue` `external` | yes | Drives node colour + label. |
| role       | string | no | Own responsibility in one sentence. Renders as macro node footnote + feature card subtitle. |
| functions  | array of function row | no | Renders the `sub-io` table. |
| variables  | array of variable row | no | Renders the `sub-vars` table. |
| dataflow   | array of string (ordered) | no | Renders the `sub-dataflow` internal flow SVG. |
| errors     | array of error row | no | Renders the `sub-errors` table. |

CLI: `apltk architecture submodule add --feature X --slug Y --kind api --role "..."`

### `function` row

| Field   | Type | Required | Notes |
| ------- | ---- | -------- | ----- |
| name    | string | yes | Function or method name. |
| in      | string | no  | Comma-separated signature parts; rendered verbatim. |
| out     | string | no  | May include `\|` to denote error returns. |
| side    | enum `pure` `io` `write` `tx` `lock` `network` | no | Side-effect chip. |
| purpose | string | no | One-line business purpose. |

CLI: `apltk architecture function add --feature X --submodule Y --name fn --in "..." --out "..." --side tx --purpose "..."`

### `variable` row

| Field   | Type | Required | Notes |
| ------- | ---- | -------- | ----- |
| name    | string | yes | Parameter / field / column / counter name. |
| type    | string | no  | Free-form. |
| scope   | enum `call` `tx` `persist` `instance` `loop` | no | Lifetime/scope chip. |
| purpose | string | no  | **Business** purpose — why this identifier exists, which branch it gates, what breaks without it. |

CLI: `apltk architecture variable add --feature X --submodule Y --name v --type T --scope call --purpose "..."`

### `dataflow` step

A simple ordered string. Appended at the tail by default; pass `--at N` to insert at index N. Reorder with `apltk architecture dataflow reorder --feature X --submodule Y --from i --to j`.

CLI: `apltk architecture dataflow add --feature X --submodule Y --step "..."`

### `error` row

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| name  | string | yes | Symbolic name (e.g. `ErrInvalidCode`). |
| when  | string | no | Condition that raises this error. |
| means | string | no | Observable outcome (HTTP status, user feedback). |

CLI: `apltk architecture error add --feature X --submodule Y --name ErrCode --when "..." --means "..."`

### `edge`

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| id    | kebab-case | no (auto if omitted) | Stable so cross-references survive renames. |
| from  | `feature/submodule` (cross-feature) or `submodule` (intra-feature, when `--from` and `--to` share a feature) | yes | |
| to    | same shape | yes | |
| kind  | enum `call` `return` `data-row` `failure` | yes | Drives stroke/dash/colour and arrow head. |
| label | string | no | Rendered at the middle of the edge path. |

CLI: `apltk architecture edge add --from <feature>[/sub] --to <feature>[/sub] --kind call --label "..."`

## Class hooks on rendered HTML

These are emitted automatically by `lib/atlas/render.js`. Agents do **not** write them by hand — they are listed here only so reviewers know which selectors are stable.

| Hook | Page |
| --- | --- |
| `.atlas-header`, `.atlas-summary`, `.atlas-canvas`, `.atlas-submodule-index`, `.atlas-legend` | macro |
| `.m-cluster`, `.m-cluster__title`, `.m-node`, `.m-node--<kind>`, `.m-node__title/__kind/__role`, `.m-edge`, `.m-edge--<kind>`, `.m-edge__label` | macro SVG |
| `.feature-header`, `.feature-story`, `.submodule-nav`, `.submodule-card`, `.feature-edges` | feature page |
| `.submodule-header`, `.submodule-role`, `.sub-io`, `.sub-vars`, `.sub-dataflow`, `.sub-errors`, `.submodule-kind--<kind>` | sub-module page |

## Pan/zoom on the macro

The CLI copies `assets/viewer.client.js` into the atlas. The macro page mounts a `[data-pan-zoom-viewport]` element wrapping the SVG; the script wires:

- mouse wheel zoom around the cursor,
- click + drag to pan,
- `+` / `−` / `Fit` buttons on the toolbar,
- keyboard `←` `→` `↑` `↓` (pan), `+` `=` (zoom in), `−` `_` (zoom out), `0` (reset).
