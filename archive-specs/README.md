# archive-specs

A documentation skill that converts completed spec files and batch-level coordination files into the standardized project documentation structure and archives the consumed planning files. It delegates documentation generation to `docs-project` and constraint file refresh to `maintain-project-constraints`.

## Core capabilities

- Scans `spec.md`, `tasks.md`, `checklist.md`, `contract.md`, `design.md`, and batch-level `coordination.md` collections as documentation input.
- Reconciles spec claims against code, config, scripts, and deployment files.
- Delegates to `docs-project` to generate standardized docs under `docs/features/` (BDD user-facing features), `docs/architecture/` (macro-level design principles), and `docs/principles/` (code conventions and constraints).
- Delegates to `maintain-project-constraints` to refresh `AGENTS.md`/`CLAUDE.md` with business goals, common commands, and the project documentation index.
- Archives superseded spec source files after a successful conversion, and deletes them only when the repository clearly does not need historical retention.
- Preserves active batch coordination files until no remaining spec set still depends on their shared preparation or replacement direction.
- Keeps unknown or unverifiable details explicit instead of guessing.

## Repository layout

```text
.
├── SKILL.md
├── README.md
├── LICENSE
├── agents/
│   └── openai.yaml
└── references/
    └── templates/
        ├── readme.md
        ├── docs-index.md
        ├── features.md
        ├── architecture.md
        └── principles.md
```

## Default outputs

- `docs/features/<category>.md` — BDD-described user-facing capabilities by functional category
- `docs/architecture/<module>.md` — macro-level design principles by module
- `docs/principles/<topic>.md` — code conventions and development constraints
- `README.md` — concise project overview (kept short, links to docs/)
- `AGENTS.md`/`CLAUDE.md` — business goals, common commands, and doc index (maintained by `maintain-project-constraints`)

## Notes

- Prefer code, config, and deployment files over stale spec text when they disagree.
- If the repository already has docs, delegate to `docs-project` to rewrite them into the standardized structure.
- Keep `README.md` short; the documentation index lives in `AGENTS.md`/`CLAUDE.md`.
