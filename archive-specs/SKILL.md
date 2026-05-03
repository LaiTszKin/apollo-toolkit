---
name: archive-specs
description: Convert completed project plan sets into maintainable project documentation and archive the consumed planning files. Use when users want to consolidate `spec.md`/`tasks.md`/`checklist.md`/`contract.md`/`design.md` and any batch-level `coordination.md` into the standardized docs/features/, docs/architecture/, docs/principles/ structure, then refresh AGENTS.md/CLAUDE.md via maintain-project-constraints.
---

# Archive Specs

## Dependencies

- Required: `align-project-documents` to generate and align the standardized project documentation under `docs/features/`, `docs/architecture/`, and `docs/principles/`, and `maintain-project-constraints` to refresh `AGENTS.md`/`CLAUDE.md` with the updated business goals and documentation index after the doc update.
- Conditional: none.

## Standards

- Evidence: Treat code, config, deployment files, and current spec files as evidence sources; never guess when a detail is missing.
- Execution: Inventory all relevant specs first, reconcile them with the current repository, delegate documentation generation to `align-project-documents`, delegate `AGENTS.md`/`CLAUDE.md` refresh to `maintain-project-constraints`, then archive only the truly consumed planning artifacts.
- Quality: Prefer source-of-truth behavior over stale plan text, align existing docs to the standardized three-category structure, and call out unknowns explicitly instead of inventing missing setup details.
- Output: Produce synchronized standardized docs under `docs/features/`, `docs/architecture/`, and `docs/principles/`, a concise `README.md` when appropriate, and an up-to-date `AGENTS.md`/`CLAUDE.md`, then archive or remove superseded spec files after conversion is complete.

## Goal

Convert completed planning artifacts into the standardized project documentation structure, refresh the project constraint files, then archive the consumed specs so active planning files stay separate from durable project docs.

## Workflow

### 1) Inventory documentation sources

- Find all relevant planning files such as `docs/plans/**/spec.md`, `tasks.md`, `checklist.md`, `contract.md`, `design.md`, and any batch-level `coordination.md`.
- Read existing `README*`, `docs/**`, deployment scripts, manifests, env examples, infra files, CI configs, and representative source modules.
- Build a source map for implemented features, module boundaries, external services, and configuration details.

### 2) Reconcile spec claims with the current repository

- Treat source priority as:
  1. current code, config, and deployment files
  2. current tests and automation scripts
  3. recent specs that still match the implementation
  4. existing docs
- When specs disagree with the codebase, keep the codebase truth and note the mismatch while updating docs.
- Merge repeated or overlapping feature descriptions into one stable capability summary.
- Use `coordination.md` to understand shared preparation, ownership boundaries, legacy cutover direction, and which old features or paths were intentionally replaced across multiple spec sets.
- Distinguish between completed scope that should become durable docs and still-active scope that remains planning material for follow-up work.

### 3) Delegate documentation generation to align-project-documents

- Hand the full documentation rewrite/alignment work to `align-project-documents`.
- `align-project-documents` will read the entire codebase, generate standardized documentation under `docs/features/` (BDD-described user-facing capabilities), `docs/architecture/` (macro-level design principles by module), and `docs/principles/` (code style, naming conventions, development constraints), and remove old non-conforming documentation.
- Provide `align-project-documents` with the reconciled spec findings from step 2 as supplementary context.

### 4) Refresh AGENTS.md/CLAUDE.md via maintain-project-constraints

- After `align-project-documents` has completed the documentation update, invoke `maintain-project-constraints`.
- `maintain-project-constraints` will read the updated `docs/` structure, extract macro business goals, inventory common development commands, build the project documentation index, and write or update `AGENTS.md`/`CLAUDE.md` with exactly three sections: Common Development Commands, Project Business Goals, and Project Documentation Index.
- If both `AGENTS.md` and `CLAUDE.md` exist, `maintain-project-constraints` will keep their content consistent.

### 5) Keep README short and the doc set navigable

- If `README.md` does not exist or is outdated, create or update it as a short project overview with a link to the documentation index in `AGENTS.md`/`CLAUDE.md`.
- Do not duplicate content that belongs in `docs/`.

### 6) Archive superseded spec files after successful conversion

- After the standardized project docs are complete and verified, archive the old source spec files that were converted.
- Prefer moving the consumed `spec.md`, `tasks.md`, `checklist.md`, `contract.md`, `design.md`, and when applicable their shared `coordination.md`, or the containing batch/spec plan directory, into a clearly marked archive path instead of leaving them mixed with active docs.
- Delete converted spec files only when the repository clearly does not need historical retention.
- Do not archive or delete any spec file that is still actively needed for unfinished implementation work.
- Treat a spec file as active when it still records pending gaps, planned later phases, follow-up integration work, or unresolved design decisions for the same change, even if one implementation commit has already shipped.
- If only part of a plan set is complete, convert or summarize only the truly completed scope and leave the active plan set in place unless the repository has a separate archival convention for partial phases.
- If only part of a coordinated batch is complete, archive only the fully consumed spec subdirectories and keep the batch-level `coordination.md` active until no remaining spec set relies on it.

## Working Rules

- Prefer the user's language unless the repository clearly uses another documentation language.
- Do not copy speculative roadmap items from specs into the main docs as if they already exist.
- When a section cannot be completed from evidence, keep an explicit `Unknown` or `TBD (missing repository evidence)` marker.
- The final repository state should not keep both standardized docs and redundant active spec files for the same completed scope.
- Do not equate "code was committed" with "planning scope is complete"; archive only when the remaining notes no longer guide future implementation.
- Do not archive a batch `coordination.md` while it still governs active replacement work, shared field preparation, or unresolved cross-spec merge sequencing.

## References

- `references/templates/readme.md`: concise project overview template.
- `references/templates/docs-index.md`: categorized project-doc index and reference list template.
- `references/templates/features.md`: template for `docs/features/` BDD-described feature documentation.
- `references/templates/architecture.md`: template for `docs/architecture/` macro-level design principles.
- `references/templates/principles.md`: template for `docs/principles/` code conventions and development constraints.
