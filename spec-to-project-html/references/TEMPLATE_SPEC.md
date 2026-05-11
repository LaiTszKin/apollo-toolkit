# Atlas component schema — reference cheat sheet (spec-to-project-html copy)

> Reference material only. The binding rules (read strategy, evidence requirements, what each verb means) live in `init-project-html/SKILL.md` (atlas authority) and this skill's `SKILL.md` (spec-overlay variant). This file lists the exact fields and enum values that `apltk architecture --spec <spec_dir>` accepts; the renderer produces consistent DOM/CSS/ARIA hooks under `<spec_dir>/architecture_diff/` so agents never need to touch HTML.

## State files on disk

Base atlas (read-only from this skill's perspective):

```
<project>/resources/project-architecture/atlas/
├── atlas.index.yaml
├── features/<slug>.yaml
├── atlas.history.log
└── atlas.history.undo.json
```

Overlay (where this skill writes via `--spec`):

```
<spec_dir>/architecture_diff/
├── atlas/
│   ├── atlas.index.yaml          # optional partial override (meta / actors / cross-feature edges / feature order)
│   ├── features/<slug>.yaml      # full proposed state of any changed feature
│   ├── _removed.yaml             # {features: [...], submodules: [{feature, submodule}]}
│   ├── atlas.history.log
│   └── atlas.history.undo.json
├── index.html                    # rendered (re-emit only when macro visibly changes)
├── features/<slug>/index.html    # rendered (re-emit when the feature page would visibly change)
├── features/<slug>/<sub>.html    # rendered (re-emit when the sub-module's tables/dataflow change)
├── _removed.txt                  # auto-written by the renderer; lists removed HTML paths
└── assets/                       # architecture.css + viewer.client.js (copied by the renderer)
```

## Components (mirrors `init-project-html/references/TEMPLATE_SPEC.md`)

### `meta`

| Field   | Type   | Required | Notes |
| ------- | ------ | -------- | ----- |
| title   | string | yes      | Macro page H1; the spec overlay typically keeps the base title. |
| summary | string | no       | Update if the spec changes scanned roots or known omissions. |

CLI: `apltk architecture meta set --spec <spec_dir> --title "..." --summary "..."`

### `actor`

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| id    | kebab-case | yes | Stable identity. |
| label | string | yes | Display name. |

CLI: `apltk architecture actor add --spec <spec_dir> --id ... --label "..."`

### `feature`

Same shape as base mode (`slug`, `title`, `story`, `dependsOn`, `submodules`, `edges`). `submodule add|remove`, `function add|remove`, etc. mutate the feature's full overlay snapshot under the hood — declare what you would have declared in base mode, but pass `--spec <spec_dir>`.

CLI: `apltk architecture feature add --spec <spec_dir> --slug <kebab> --title "..." --story "..."`

### `submodule`

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| slug  | kebab-case | yes | The HTML filename. |
| kind  | enum `ui` `api` `service` `db` `pure-fn` `queue` `external` | yes | Drives node colour + chip. |
| role  | string | no | Own responsibility in one sentence. Use `planned: ...` or `gap: ...` to mark spec items the code does not yet implement. |
| functions / variables / dataflow / errors | arrays | no | Edited through their own CLI verbs. |

CLI: `apltk architecture submodule add|set|remove --spec <spec_dir> --feature X --slug Y --kind ... --role "..."`

### `function`, `variable`, `dataflow`, `error`

Each row uses the same fields documented in `init-project-html/references/TEMPLATE_SPEC.md`. Always pass `--spec <spec_dir>` so the write lands in the overlay.

`dataflow` steps accept the same structured fields in overlay mode — `--fn` must reference a function declared in this overlay (or inherited from base) for the same sub-module; `--reads` / `--writes` must reference variables declared there. `validate --spec <spec_dir>` enforces these references against the **merged** state, so adding a step that names a function/variable the spec also introduces is fine as long as both land in the same overlay.

### `edge`

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| id    | kebab-case | recommended | Pass `--id <stable>` when adding or removing so the CLI matches unambiguously. |
| from  | `feature/submodule` or (intra-feature) `submodule` | yes | |
| to    | same shape | yes | |
| kind  | enum `call` `return` `data-row` `failure` | yes | |
| label | string | no | |

CLI: `apltk architecture edge add|remove --spec <spec_dir> --from <feature>[/sub] --to <feature>[/sub] --kind ... --label "..."`

## Diff classification (how `apltk architecture diff` pairs pages)

`apltk architecture diff` scans every `docs/plans/**/architecture_diff/**/*.html` (skipping `assets/` and `atlas/`) and pairs by path against `resources/project-architecture/`:

| Base exists? | Overlay HTML exists? | Listed in `_removed.txt`? | Classification |
| ------------ | -------------------- | ------------------------- | -------------- |
| yes          | yes                  | no                        | **modified** (split before/after view) |
| no           | yes                  | no                        | **added** (single after view) |
| yes          | no                   | yes                       | **removed** (single before view) |

The renderer writes `_removed.txt` automatically from `_removed.yaml`; agents only set the YAML through `feature remove` / `submodule remove`.

## Quick example: add a 2FA sub-module to an existing feature

```bash
apltk architecture --spec docs/plans/2026-05-11/add-2fa \
  submodule add --feature register --slug 2fa --kind service \
  --role "TOTP verification (planned: not yet implemented)"
apltk architecture --spec docs/plans/2026-05-11/add-2fa \
  edge add --from register/api --to register/2fa --kind call --label "verify TOTP" --id e-api-2fa
apltk architecture --spec docs/plans/2026-05-11/add-2fa validate
apltk architecture diff
```

The CLI writes only the affected HTML pages (`features/register/2fa.html` plus any page whose visible state changed) into `architecture_diff/`, and the diff viewer pairs them with the base atlas.
