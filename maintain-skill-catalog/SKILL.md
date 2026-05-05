---
name: maintain-skill-catalog
description: >-
  Maintain this SKILL catalog repo: reconcile `SKILL.md` frontmatter/`Dependencies`, `agents/openai.yaml`, README inventory, classify vendored vs external vs unpublished-local aliases, prefer extracting shared workflows over duplicating long prose, and always rerun `apltk validate-skill-frontmatter` plus `apltk validate-openai-agent-config` before finishing—never invent package names or installers for unverified deps.
  Use when CI metadata breaks, users ask to “sync skills”, or dependency docs drift. Do not use for random application repos that are not this catalog layout.
  Bad: marketing a `~/.claude` draft as an npm dependency… Good: label it “local optional” and link once in README instead of pasting the blurb into five skills…
---

# Maintain Skill Catalog

## Dependencies

- Required: none.
- Conditional: `find-skills` when a dependency is external and the installation source is unknown.
- Optional: `skill-creator` when extracting a repeated workflow into a new shared skill or heavily reshaping a skill.
- Fallback: If an external dependency cannot be verified, **MUST** document unknowns honestly—**MUST NOT** invent package names, install commands, or skill aliases.

## Non-negotiables

- **MUST** read actual skill directories, validator scripts (`scripts/validate_*.py`, CI), `README.md`, and `agents/openai.yaml` patterns **before** reclassifying dependencies or rewriting catalog prose.
- **MUST** treat each skill’s `## Dependencies` block as authoritative for skill-to-skill references; reconcile docs to match folders, not the reverse by guess.
- **MUST** classify each dependency edge as: vendored-in-repo · local unpublished (not advertised as external) · external-with-install-guidance · alias-only (explain, don’t duplicate as separate dep).
- **MUST NOT** duplicate skills or paste long prose into README without verifying whether a narrower edit or extraction fixes the repetition.
- **MUST NOT** advertise a colleague’s unpublished `~/.codex/skills/...` name as if it were an npm-installable artifact unless verified.
- After metadata or agent-config edits, **MUST** run **`apltk validate-skill-frontmatter`** and **`apltk validate-openai-agent-config`** (or fail the session with explanation if CLI unavailable)—**MUST NOT** declare the catalog consistent while validators fail.
- If validator failures reveal a **systemic** gap, **MUST** prefer tightening the validator/CI in the **same** change set when appropriate, not only patching one skill ad hoc.

## Standards (summary)

- **Evidence**: Folders + scripts + frontmatter reality; optional `~/.codex/skills` spot-check for external names.
- **Execution**: Inventory → classify → minimal focused edits → validate → report.
- **Quality**: One skill one purpose; naming matches folder; agent configs synchronized.
- **Output**: Updated lists/docs + green validators + explicit unknowns.

## Workflow

**Chain-of-thought:** Answer **`Pause →`** before moving to the next subsection; validator red **MUST** block “done.”

### 1) Inventory

- Enumerate top-level skill dirs (`SKILL.md` present); read touched `SKILL.md` files before inventing merges or new skills.
- Read `README.md`, `AGENTS.md`/`CLAUDE.md`, and existing dependency notes.
  - **Pause →** Is the requested change already satisfied by renaming or merging **existing** skill text instead of adding a sibling skill?
  - **Pause →** Which validator script actually enforces description length and keys—did I open its source?

### 2) Audit dependencies and conventions

- Align `## Dependencies` across skills with shared vocabulary (`Required` / `Conditional` / `Optional` / `Fallback`).
- Exact external strings only—verify spelling/plural vs installed tree.
- Repeated workflows ⇒ prefer **extract** to new skill (`skill-creator`) over copy-paste.
  - **Pause →** Would classifying dep X as “external” confuse installers—could it actually be repo-vendored or optional?

### 3) Apply catalog edits

- Minimal diffs; update `README` skill lists and external-dep sections **only when** inventory changed facts.
- New shared skill: kebab-case folder = frontmatter `name`; add `agents/openai.yaml` following neighbors.
  - **Pause →** Did I treat a **template** path under `references/` as a runtime skill—classification error?

### 4) Validate

- Run `apltk validate-skill-frontmatter` and `apltk validate-openai-agent-config`. If installer/discovery scripts changed behavior, smoke the paths they document.
  - **Pause →** Any skill missing `agents/openai.yaml` or stale tool names—still acceptable for this repo’s rules?

### 5) Report

- Skills touched, conventions updated, external deps verified vs unknown; encode user-stated repo rules into skill or README so regressions recur less.

## Sample hints

- **Classification**: Skill A says `Conditional: Foo` but `Foo` lives only under `~/.claude/` unpublished → document as **local optional**, not “install Foo from npm.”
- **Validator**: frontmatter `description` 1100 chars → expect **fail** if limit 1024—fix text, don’t disable check.
- **Anti-pattern**: “We should mention skill X everywhere” → add **once** to README index + Dependencies of callers, not five duplicate paragraphs.
