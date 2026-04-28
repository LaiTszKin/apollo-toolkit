---
name: maintain-skill-catalog
description: Audit and maintain a repository of installable skills so the catalog stays internally consistent. Use when users ask to standardize `SKILL.md` structure across many skills, classify internal vs external skill dependencies, sync skill lists and external dependency docs, extract shared workflows into new skills, or fix catalog-wide validation/agent-config issues.
---

# Maintain Skill Catalog

## Dependencies

- Required: none.
- Conditional: `find-skills` when a dependency is external and the installation source is unknown.
- Optional: `skill-creator` when splitting a repeated workflow into a new shared skill or significantly reshaping an existing skill.
- Fallback: If an external dependency cannot be verified, leave it undocumented rather than guessing the package name or install command.

## Standards

- Evidence: Read the actual skill folders, validation scripts, repository docs, and local installed skill names before changing dependency classifications or catalog docs.
- Execution: Audit first, classify findings, make focused catalog updates, then run the repo validators before finishing.
- Quality: Avoid duplicate skills, avoid rewording behavior without checking the implementation, distinguish aliases or local unpublished skills from true external dependencies, and enforce the repository's current metadata constraints such as `SKILL.md` frontmatter validity, description-length limits, and synchronized agent configs.
- Output: Leave the catalog with synchronized skill metadata, dependency documentation, and validation status.

## Goal

Keep a skill repository coherent when many top-level skills evolve together.

## Workflow

### 1) Inventory the catalog before editing

- List the tracked top-level skill directories and read the relevant `SKILL.md` files before deciding that a new skill is needed.
- Check whether the requested workflow already exists under another name or can be handled by a focused update.
- Read current `README.md`, `AGENTS.md/CLAUDE.md/CLAUDE.md`, validator scripts, and any existing dependency notes that may need synchronization.
- When the task involves external dependencies, inspect local installed skills under `~/.codex/skills` first to confirm the exact skill names.

### 2) Audit dependency declarations and shared conventions

- Use the standardized `## Dependencies` section as the source of truth for skill-to-skill relationships.
- Read the current validator scripts before changing frontmatter-heavy files so metadata limits come from implementation rather than memory.
- Classify each dependency as:
  - vendored in this repository
  - local/private skill that should not be documented as external
  - external skill that needs install guidance
  - alias/compatibility name that should be explained but not treated as a separate dependency
- Verify exact external skill names before editing docs; do not invent pluralizations or package names.
- If multiple skills repeat the same workflow, prefer extracting that shared portion into a dedicated skill instead of duplicating instructions.

### 3) Update catalog docs and skill metadata carefully

- Keep edits minimal and repo-wide only where necessary.
- Update `README.md` skill lists and external dependency sections when the catalog actually changes.
- Update `AGENTS.md/CLAUDE.md` when the repository gains or loses a user-visible capability or a standing convention changes.
- When creating a new shared skill, align naming, frontmatter, `agents/openai.yaml`, and any lightweight README with neighboring skills.
- When a failure comes from validator drift or a metadata constraint that was not caught early, tighten the validator or CI path in the same change instead of only fixing the offending skill text.
- Do not treat unpublished local skills as external dependencies just because they are not yet installed elsewhere.

### 4) Validate the catalog after changes

- Run:
  - `apltk validate-skill-frontmatter`
  - `apltk validate-openai-agent-config`
- If the change touched installer or repo-discovery behavior, verify the relevant install scripts or discovery logic as well.
- Resolve validation failures before finishing; missing `agents/openai.yaml`, stale prompt references, and mismatched skill names are catalog bugs, not follow-up work.

### 5) Record conclusions explicitly

- Summarize which skills were audited, which conventions were updated, and which dependencies were confirmed as external.
- Call out any unresolved unknowns, such as an external dependency whose install source could not be verified.
- When a user correction changes the catalog rules, encode that rule in the skill or repository docs so the same mistake does not recur.
