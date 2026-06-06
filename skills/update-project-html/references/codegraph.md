# apltk codegraph — Code Intelligence CLI Reference

## Purpose
Parse source code into a knowledge graph of symbols (functions, classes) and relationships (call edges), backed by a local SQLite database with FTS5 full-text search. Powered by @colbymchenry/codegraph (tree-sitter-backed code knowledge graph engine).

## Usage
```
apltk codegraph <subcommand> [options]
```

## Subcommands

### Lifecycle

| Subcommand | Description | Key Flags |
|------------|-------------|-----------|
| `init` | Initialize CodeGraph for the project | `--index` (run initial indexing immediately), `--json` |
| `sync` | Sync index with current file state (incremental) | `--json` |
| `status` | Show index statistics (files, nodes, edges, languages) | `--json` |

### Discovery

| Subcommand | Description | Key Flags |
|------------|-------------|-----------|
| `search <query>` | Search code graph for symbols via FTS5 | `--limit N` (default 20, max 100), `--json` |
| `explore <query>` | Deep-dive on a symbol — callers, callees, source | `--feature <name>`, `--json` |
| `survey [dir]` | Scan directory, suggest submodule groupings and edges | `--feature <name>`, `--json` |
| `list-apis [path]` | List public APIs in project or sub-path | `--all` (include internal symbols), `--json` |

### Validation

| Subcommand | Description | Key Flags |
|------------|-------------|-----------|
| `verify --spec <dir>` | Verify a spec overlay against actual code | `--json` |

## Common Workflows

- **Before atlas work**: `apltk codegraph init --index` (first time), then `apltk codegraph survey --json`
- **After code changes**: `apltk codegraph sync` to keep index current
- **Understanding a symbol**: `apltk codegraph explore <name>` to see callers and callees
- **Searching code**: `apltk codegraph search <query> --json --limit 30`
