---
name: maintain-project-constraints
description: >-
  Maintain root `AGENTS.md` / `CLAUDE.md` with exactly three mirrored sections (unless the repo documents deliberate divergence): Common Development Commands traced to real scripts/Makefile targets, Project Business Goals capturing macro why/who/outcome, Project Documentation Index enumerating every standardized `docs/features`, `docs/architecture`, `docs/principles` file plus important root docs—purge invented commands, prune deleted paths, forbid stuffing feature lists into Goals.
  Invoke after missing files, drift after refactors, or once `align-project-documents` reshapes `docs/`.
  Bad: documenting `npm run magic` absent from `package.json`. Good: cite `npm test` with file reference. Bad: ten micro-features listed under Goals instead of the docs index…
---

# Maintain Project Constraints

## Dependencies

- Required: none.
- Conditional: none.
- Optional: none.
- Fallback: not applicable.

## Non-negotiables

- **MUST** derive commands and business purpose from **current** repo artifacts (`package.json`, `Makefile`, `bin/`, `scripts/`, `README`, `docs/features/`, code entrypoints)—**MUST NOT** invent flags, task names, or CLI paths.
- **`AGENTS.md` / `CLAUDE.md` content** is **exactly three sections**—no extra tutorials, architecture essays, or style guides (those belong in `docs/`):
  1. **Common Development Commands**
  2. **Project Business Goals**
  3. **Project Documentation Index**
- **MUST** list **every** file under `docs/features/`, `docs/architecture/`, `docs/principles/` plus notable root docs (`README.md`, `CONTRIBUTING.md`, …) that exist; paths **MUST** exist on disk—**MUST NOT** stale links.
- If **both** `AGENTS.md` and `CLAUDE.md` exist, the three sections **MUST** be **identical** between them unless the repo documents an intentional divergence (otherwise keep parity).
- **Project Business Goals** = macro **why/for whom/outcome**—**MUST NOT** duplicate the feature inventory (index already points there).

## Standards (summary)

- **Evidence**: Scripts and docs on disk drive command list and index—no memory.
- **Execution**: Inventory → draft three sections → verify paths → prune stray sections.
- **Quality**: Scannable; no speculative architecture.
- **Output**: Fresh root constraint files aligned with repo.

## Triggers

- Missing `AGENTS.md`/`CLAUDE.md`, post-change drift suspected, or after `align-project-documents` reshapes `docs/`.

## Workflow

**Chain-of-thought:** **`Pause →`** before writing each section—if a command is uncertain, grep config before committing text.

### 1) Inventory

- Parse command surfaces (`package.json` scripts, `Makefile`, CI, CLIs).
- Enumerate `docs/features/`, `docs/architecture/`, `docs/principles/`; note root docs.
  - **Pause →** Can I cite the **source line** (script name, target) for every command I plan to list?

### 2) Business goals

- Prefer `README` + `docs/features/` tone; else infer from user-facing entrypoints—still **product-level sentences**, not file lists.

### 3) Write / update files

- Create or overwrite **only** the three sections per file conventions (create missing file among `AGENTS.md`/`CLAUDE.md` per repo habit).
  - **Pause →** Did any stray `## Installation` creep in—must delete if not part of repo’s mandated format?

### 4) Documentation index

- One line per file: `path — short purpose`. Mirror reality; drop deleted; add new.

### 5) Verification

- Each command reproducible from declared config; every indexed path exists; both files match if both present; strip extra sections.

## Sample hints

- **Command bad**: “`npm run magic` — deploy” when no script `magic` in `package.json`.
- **Command OK**: `` `npm test` — runs Node test suite (see `package.json`) ``.
- **Goals bad**: Listing ten micro-features → belongs in features index + separate files.
- **Goals OK**: “This repo ships X for Y operators; primary outcome Z.”
- **Index**: If `docs/features/auth.md` deleted, **remove** line same run.

## Template sketch

```markdown
## Common Development Commands
- `…` — …

## Project Business Goals
…

## Project Documentation Index
### Features (`docs/features/`)
- `…` — …
### Architecture (`docs/architecture/`)
- …
### Principles (`docs/principles/`)
- …
### Root Documents
- `README.md` — …
```
