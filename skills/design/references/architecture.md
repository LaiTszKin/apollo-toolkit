# apltk architecture — Declarative Architecture Diagram CLI

## Purpose
Manages architecture diagrams under `resources/project-architecture/` via YAML state files, supporting baseline diagrams, spec overlay diffing, and merge.

## Usage
```
apltk architecture [verb] [options]
```

## Global Flags
| Flag | Effect |
|------|--------|
| `--project <root>` | Specify project root (defaults to upward search from cwd) |
| `--spec <spec_dir>` | Write to spec overlay rather than base architecture |
| `--no-render` | Skip auto-re-render after a change (batch multiple commands) |
| `--no-open` | Suppress browser open on `open` and `diff` |
| `--dry-run` | Preview changes as JSON diff, do not write |
| `--out <dir>` | Output directory for `diff` |
| `--clean` | Remove spec overlay directory after successful `merge` |
| `--all` | Select all pending spec overlays on `merge` |
| `--json` | Output JSON on `status` |
| `--evidence <level[:source]>` | Mark a component's evidence quality level (observed/inferred/assumed) |

## Top-Level Verbs
- **`open`** — Open the base architecture diagram HTML (bootstraps if not yet rendered)
- **`diff`** — Collect all overlays under `docs/plans/`, produce a before/after viewer
- **`render`** — Regenerate HTML from current YAML state
- **`validate`** — Validate architecture diagram structural integrity (schema + referential integrity)
- **`status`** — Show summary (feature/submodule/edge/actor counts, timestamps, validation state)
- **`scan --src <dir>`** — Scan a directory tree, output JSON candidate feature list
- **`undo [--steps <n>]`** — Undo the most recent mutation(s)
- **`merge --spec <dir> \| --all`** — Merge spec overlay(s) back into the base architecture

## Mutation Commands

All mutation commands share `--project`, `--spec`, `--no-render`, `--dry-run`, and `--evidence`.

### feature
```
apltk architecture feature add --slug <feature> [--title "..."] [--story "..."] [--depends-on a,b]
apltk architecture feature set --slug <feature> [--title "..."] [--story "..."] [--depends-on a,b]
apltk architecture feature remove --slug <feature>
```

### submodule
```
apltk architecture submodule add --feature <feature> --slug <submodule> [--kind service|api|ui|worker|external] [--role "..."]
apltk architecture submodule set --feature <feature> --slug <submodule> [--kind ...] [--role "..."]
apltk architecture submodule remove --feature <feature> --slug <submodule>
```

### function
```
apltk architecture function add --feature <feature> --submodule <submodule> --name <fn> [--in "..."] [--out "..."] [--side "..."] [--purpose "..."]
apltk architecture function remove --feature <feature> --submodule <submodule> --name <fn>
```

### variable
```
apltk architecture variable add --feature <feature> --submodule <submodule> --name <var> [--type "..."] [--scope "..."] [--purpose "..."]
apltk architecture variable remove --feature <feature> --submodule <submodule> --name <var>
```

### dataflow
```
apltk architecture dataflow add --feature <feature> --submodule <submodule> --step "..." [--at <index>] [--fn <name>] [--reads a,b] [--writes x,y]
apltk architecture dataflow remove --feature <feature> --submodule <submodule> (--step "..." | --at <index>)
apltk architecture dataflow reorder --feature <feature> --submodule <submodule> --from <index> --to <index>
```

### error
```
apltk architecture error add --feature <feature> --submodule <submodule> --name <error> [--when "..."] [--means "..."]
apltk architecture error remove --feature <feature> --submodule <submodule> --name <error>
```

### edge
```
apltk architecture edge add --from <feature[/submodule]> --to <feature[/submodule]> [--kind call|return|data-row|failure] [--label "..."] [--id <edge-id>]
apltk architecture edge remove --from <feature[/submodule]> --to <feature[/submodule]> [--id <edge-id>]
```

### meta
```
apltk architecture meta set [--title "..."] [--summary "..."]
```

### actor
```
apltk architecture actor add --id <actor-id> [--label "..."]
apltk architecture actor remove --id <actor-id>
```

## Notes
- Auto-renders after each mutation (unless `--no-render`)
- Each mutation creates an undo snapshot; run `undo` to revert
- Work is not complete until validation passes
