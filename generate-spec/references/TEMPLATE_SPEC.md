# Atlas component schema — reference cheat sheet (generate-spec copy)

> Reference material only. The binding rules for atlas pages (verbs, semantic contracts, evidence) live in `init-project-html/SKILL.md`. The binding rule for spec-time atlas changes (declare via CLI, never hand-author HTML) lives in this skill's own `generate-spec/SKILL.md`. This file lists the exact fields and enum values that `apltk architecture --spec <spec_dir>` accepts.

## Where the overlay lands

When you run any `apltk architecture --spec <spec_dir> <verb> ...`, the CLI writes:

```
<spec_dir>/architecture_diff/
├── atlas/
│   ├── atlas.index.yaml          # optional partial override of meta / actors / cross-feature edges / feature ordering
│   ├── features/<slug>.yaml      # full proposed state of any changed feature
│   ├── _removed.yaml             # {features: [...], submodules: [{feature, submodule}]}
│   ├── atlas.history.log
│   └── atlas.history.undo.json
├── index.html                    # rendered when macro visibly changes
├── features/<slug>/index.html    # rendered when feature page visibly changes
├── features/<slug>/<sub>.html    # rendered when sub-module visibly changes
├── _removed.txt                  # auto-written from _removed.yaml; consumed by `apltk architecture diff`
└── assets/                       # architecture.css + viewer.client.js (copied by the renderer)
```

`apltk architecture diff` scans every `docs/plans/**/architecture_diff/**/*.html`, pairs them with `resources/project-architecture/` by relative path, and classifies each as **modified**, **added**, or **removed**. The CLI's overlay path layout guarantees correct pairing — agents do not need to manage paths manually.

## Components (mirrors `init-project-html/references/TEMPLATE_SPEC.md`)

The same component fields and enums apply in spec mode:

| Component | Required fields | Enum values |
| --------- | --------------- | ----------- |
| `meta` | `title` | — (`summary` optional) |
| `actor` | `id` (kebab-case), `label` | — |
| `feature` | `slug` (kebab-case), `title` | — (`story`, `dependsOn` optional) |
| `submodule` | `slug` (kebab-case), `kind` | `ui` `api` `service` `db` `pure-fn` `queue` `external` |
| `function` | `name` | `side`: `pure` `io` `write` `tx` `lock` `network` |
| `variable` | `name` | `scope`: `call` `tx` `persist` `instance` `loop` |
| `dataflow` step | string | — |
| `error` | `name` | — (`when`, `means` optional) |
| `edge` | `from`, `to`, `kind` | `kind`: `call` `return` `data-row` `failure` |

## Verb cheat sheet (spec mode)

Always pass `--spec <spec_dir>`. Common patterns:

```bash
# Open the spec directory once as a shell variable for readability:
SPEC_DIR=docs/plans/2026-05-11/add-2fa

# Add a new sub-module to an existing feature in the base atlas:
apltk architecture --spec "$SPEC_DIR" submodule add \
  --feature register --slug 2fa --kind service \
  --role "TOTP verification (planned: not yet implemented)" --no-render

# Adjust an existing sub-module's role / kind:
apltk architecture --spec "$SPEC_DIR" submodule set \
  --feature register --slug api --role "Endpoint with 2FA gate" --no-render

# Add functions / variables / dataflow / errors:
apltk architecture --spec "$SPEC_DIR" function add \
  --feature register --submodule 2fa --name VerifyTotp \
  --in "ctx, code" --out "ok | ErrInvalidTotp" --side network \
  --purpose "Checks the TOTP code against the user's seed." --no-render

apltk architecture --spec "$SPEC_DIR" variable add \
  --feature register --submodule 2fa --name totp_seed \
  --type "bytes[20]" --scope persist \
  --purpose "Seed material for TOTP verification (per user)." --no-render

apltk architecture --spec "$SPEC_DIR" dataflow add \
  --feature register --submodule 2fa --step "Load seed for userId" --no-render
apltk architecture --spec "$SPEC_DIR" dataflow add \
  --feature register --submodule 2fa --step "Validate TOTP code window" --no-render

apltk architecture --spec "$SPEC_DIR" error add \
  --feature register --submodule 2fa --name ErrInvalidTotp \
  --when "Code mismatch within accepted window." \
  --means "422 response with totp reason." --no-render

# Add intra-feature edge:
apltk architecture --spec "$SPEC_DIR" edge add \
  --from register/api --to register/2fa --kind call \
  --label "verify TOTP" --id e-api-2fa --no-render

# Removals (overlay records them in _removed.yaml; the renderer emits _removed.txt):
apltk architecture --spec "$SPEC_DIR" feature remove --slug legacy --no-render
apltk architecture --spec "$SPEC_DIR" submodule remove --feature register --slug v0-shim --no-render

# Render + validate once at the end (sed for batched mutations):
apltk architecture --spec "$SPEC_DIR" render
apltk architecture --spec "$SPEC_DIR" validate
```

## Important constraints (binding)

- **Never** hand-edit any file under `architecture_diff/` — the renderer rewrites them on every `apltk architecture --spec ... render` call.
- The base atlas under `resources/project-architecture/` is **read-only** in spec mode; CLI writes never touch it.
- Cross-feature edges into features that are not overlaid still resolve against the base atlas without re-declaring those features.
- For batch specs, scope each member's overlay to its own member directory; never duplicate at the batch root.

## Worked example: end-to-end overlay for a new "add 2FA" spec

The CLI invocation above produces this overlay tree (rendered HTML omitted for brevity):

```
docs/plans/2026-05-11/add-2fa/architecture_diff/
├── atlas/
│   ├── atlas.index.yaml
│   └── features/register.yaml
├── index.html
├── features/register/index.html
├── features/register/api.html
├── features/register/2fa.html
└── assets/architecture.css
```

Running `apltk architecture diff` then pairs `register/2fa.html` (added) and `register/api.html` + `register/index.html` + `index.html` (modified) with their base counterparts.
