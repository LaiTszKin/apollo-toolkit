---
name: specs-to-project-docs
description: Turn a project's accumulated spec files into standardized project documentation and README content. Use when users want to consolidate `spec.md`/`tasks.md`/`checklist.md` files into maintainable docs covering installation and deployment, configuration, external service setup, architecture, feature introductions, and developer onboarding context.
---

# Specs To Project Docs

## Dependencies

- Required: none.
- Conditional: none.
- Optional: none.
- Fallback: not applicable.

## Standards

- Evidence: Treat code, config, deployment files, and current spec files as evidence sources; never guess when a detail is missing.
- Execution: Inventory all relevant specs first, reconcile them with the current repository, then generate or update standardized docs from the provided templates.
- Quality: Prefer source-of-truth behavior over stale plan text, align existing docs to the same standard structure, and call out unknowns explicitly instead of inventing missing setup details.
- Output: Produce a concise `README.md` plus a fuller project handbook, then remove superseded spec files after the conversion is complete.

## Goal

Convert scattered planning artifacts into stable, standardized project documentation that helps operators and developers understand, run, configure, and extend the project.

## Workflow

### 1) Inventory documentation sources

- Find all relevant planning files such as `docs/plans/**/spec.md`, `tasks.md`, and `checklist.md`.
- Read existing `README*`, deployment scripts, manifests, env examples, infra files, CI configs, and representative source modules.
- Build a source map for setup commands, environments, external services, module boundaries, and implemented features.

### 2) Reconcile spec claims with the current repository

- Treat source priority as:
  1. current code, config, and deployment files
  2. current tests and automation scripts
  3. recent specs that still match the implementation
  4. existing docs
- When specs disagree with the codebase, keep the codebase truth and note the mismatch while updating docs.
- Merge repeated or overlapping feature descriptions into one stable capability summary.

### 3) Standardize existing project docs

- If the project already has `README.md`, handbooks, setup guides, architecture docs, or runbooks, rewrite or reorganize them so they follow this skill's standardized structure instead of leaving mixed formats in place.
- Use `references/templates/readme.md` for the concise project introduction.
- Use `references/templates/project-handbook.md` for the fuller project documentation.
- Default target outputs:
  - `README.md`
  - `docs/project/project-handbook.md`
- If the repository already uses different doc paths, preserve the established locations only when the resulting documents still match the standard sections and remain easy to maintain.

### 4) Fill the required documentation sections

Ensure the full project docs cover all of the following:
- how to install and deploy the project
- how to configure the project
- external services, required credentials, and API key acquisition tutorials when applicable
- project architecture and key module boundaries
- project feature introductions and user-facing flows
- project context developers should understand before making changes

### 5) Write the configuration and external-service guidance carefully

- List each env var, config file, or secret only when supported by repository evidence.
- For every external service, document:
  - why the service is needed
  - which local config or env vars are required
  - how to create or locate the credential
  - where to place the credential locally or in deployment
  - any safe-development notes such as sandbox/test-mode usage
- If the repository does not show how to obtain a credential, say so explicitly and point to the service's official setup page rather than guessing steps.

### 6) Keep README scoped and the handbook comprehensive

- `README.md` should stay short: project intro, quick install/deploy, major features, and key entry links.
- The project handbook should carry the deeper operational and developer details.
- Remove template placeholders and stale planning language before finishing.

### 7) Remove superseded spec files after successful conversion

- After the standardized project docs are complete and verified, delete the old source spec files that were converted.
- Remove the full spec directory when it only exists to hold the consumed `spec.md`, `tasks.md`, and `checklist.md` files.
- Do not delete any spec file that is still actively needed for unfinished implementation work or explicit archival requirements.
- If a repository needs historical retention, move the source specs into a clearly marked archive path instead of leaving them mixed with active docs.

## Working Rules

- Prefer the user's language unless the repository clearly uses another documentation language.
- Keep examples executable and commands copyable.
- Do not copy speculative roadmap items from specs into the main docs as if they already exist.
- When a section cannot be completed from evidence, keep an explicit `Unknown` or `TBD (missing repository evidence)` marker.
- The final repository state should not keep both standardized docs and redundant active spec files for the same completed scope.

## References

- `references/templates/readme.md`: concise project overview template.
- `references/templates/project-handbook.md`: full standardized project documentation template.
