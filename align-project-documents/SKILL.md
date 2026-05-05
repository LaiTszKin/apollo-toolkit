---
name: align-project-documents
description: >-
  Regenerate standardized tree `docs/features` (BDD zero code paths), `docs/architecture` (macro layer rules), `docs/principles` (evidence-backed conventions) after reading the ENTIRE production codebase—legacy scattered Markdown must migrate or be removed before finish then invoke **`maintain-project-constraints`** so AGENTS/CLAUDE indexes match disk.
  Use for repo-wide doc realignments (“rebuild project docs from code”)—skip for single-file README nitpicks unless user explicitly requests full regeneration.
  Violation examples: features mentioning `src/foo.ts`… acceptable feature: “Given signed-in user When export Then CSV downloads”… architecture stays stable if module renamed internally…
---

# Align Project Documents

## Dependencies

- Required: `maintain-project-constraints` after `docs/` work to refresh `AGENTS.md`/`CLAUDE.md` and the doc index.
- Conditional: none.
- Optional: none.
- Fallback: If `maintain-project-constraints` cannot run, **MUST NOT** pretend the constraints files are refreshed—report the gap.

## Non-negotiables

- **MUST** read the **entire** codebase (all meaningful source/config/test entrypoints—not a single-folder sample) **before** writing category docs; code is sole truth—existing prose is corroborating only.
- **MUST NOT** ship `docs/features/` bullets that cite file paths, function names, or implementation detail—user-facing **BDD** only (`Given` / `When` / `Then`).
- **`docs/architecture/`** stays **macro** (layers, boundaries, data-flow direction)—**MUST NOT** document code that will rot on every refactor.
- **`docs/principles/`** **MUST** remain traceable to **concrete** repo patterns (with examples)—not aspirational platitudes without evidence.
- **MUST** create or refresh `docs/features/`, `docs/architecture/`, `docs/principles/` with categorized files; **MUST** remove or migrate stale non-conforming docs (**MUST NOT** leave mixed legacy layout alongside new structure indefinitely).
- **MUST** invoke **`maintain-project-constraints`** after category docs stabilize so `AGENTS.md`/`CLAUDE.md` indexes match disk.
- Default doc **language**: match user preference or repo’s dominant README/docs language consistently per run.

## Standards (summary)

- **Evidence**: Paths and reads logged while building claims; contradictory old docs flagged, not blindly merged.
- **Execution**: Whole repo read → ingest old docs → write three pillars → prune → constraints refresh.
- **Quality**: Features user-only; architecture stable abstractions; principles evidence-backed.
- **Output**: Standardized tree + synced agent constraint files.

## Target structure

```
docs/
├── features/       — User-facing capability, BDD only (no code paths)
├── architecture/   — Layers/modules, boundaries, integration contracts (macro)
└── principles/     — Style, tooling, conventions with codebase examples
```

Extended rules and checklist: `references/templates/standardized-docs-template.md`.

## Workflow

**Chain-of-thought:** **`Pause →`** after each major phase; ambiguity on “user-visible” vs “internal” ⇒ re-read callers before classifying.

### 1) Read entire codebase

- Cover entrypoints (CLI/server/workers), public surfaces, boundaries, configs, integrations, tests as behavior specs.
- Keep an **evidence notebook** (paths) for principles and architecture—not for features text.
  - **Pause →** Did I skip generated/vendor/`node_modules`/binary blobs incorrectly included as “must read”?
  - **Pause →** Can I name the **top five** externally visible behaviors from code alone?

### 2) Read existing prose

- List `README.md`, `docs/**`, `CONTRIBUTING.md`, etc.; extract facts that code confirms; flag obsolete sections.
  - **Pause →** Where did I treat Markdown as authoritative over a contradicted implementation?

### 3) Generate three pillars

- **features/**: categories → one markdown per category → BDD scenarios only.
- **architecture/**: one file per layer/module cluster → boundaries and flows, stable wording.
- **principles/**: split files (`naming-conventions.md`, etc.) → each point ties to observable repo habit.
  - **Pause →** Random feature paragraph: grep for `./src` or `` ` `` — if found, rewrite for user observable outcome only.

### 4) Remove non-conforming legacy

- Delete or migrate files fully superseded; if uncertain, **keep** file list in report as migration backlog — **do not** silently duplicate two competing truths forever.

### 5) Refresh constraints

- Run **`maintain-project-constraints`** so Commands / Business Goals / Doc Index mirror new files.

### 6) Gates before finish

- No code paths in features; architecture still macro after imagined small refactor; principles cite real examples; index lists every file under the three dirs; constraints skill executed.

## Sample hints

- **Feature OK**: “Given a signed-in user When they export Then a CSV download starts” — no `handlers/export.rs` references.
- **Feature bad**: “Call `ExportService.run` …” — violates Non-negotiables (implementation leak).
- **Architecture OK**: “API layer handles I/O only; domain module owns business rules” — stable across internal renames.
- **Principle OK**: “TypeScript files use kebab-case — see `src/user-profile/`” — traceable pattern.
