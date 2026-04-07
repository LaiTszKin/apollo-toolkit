---
name: codex-memory-manager
description: Manage persistent Codex user-preference memory from recent conversation history. Use when users ask to learn from the last 24 hours of chats, update `~/.codex/AGENTS.md`, maintain reusable preference-first memory under `~/.codex/memory/*.md`, or sync new preference categories discovered in `~/.codex/sessions` and `~/.codex/archived_sessions`.
---

# Codex Memory Manager

## Dependencies

- Required: none.
- Conditional: `learn-skill-from-conversations` when the same conversation review should also evolve the skill catalog.
- Optional: none.
- Fallback: If `~/.codex/sessions`, `~/.codex/archived_sessions`, or `~/.codex/AGENTS.md` are unavailable, report the missing path and stop instead of guessing.

## Standards

- Evidence: Derive memory only from actual recent Codex conversations, and keep each stored preference tied to concrete chat evidence.
- Execution: Extract the last 24 hours first, classify durable user preferences into memory files, then refresh the AGENTS index section; when a Codex automation prompt includes an explicit `Automation memory:` path, use that path directly for run-memory read/write instead of assuming `$CODEX_HOME` is set.
- Quality: Ignore one-off instructions, avoid duplicating categories, preserve the existing language and tone already used in `~/.codex/AGENTS.md`, and keep memory entries cross-project reusable, preference-heavy, and light on repository- or incident-specific detail.
- Output: Report which sessions were reviewed, which memory categories were created or updated, and whether the AGENTS index changed.

## Goal

Keep a durable, categorized memory of user preferences so future agents can quickly review relevant guidance before starting work.

## Required Resources

- `scripts/extract_recent_conversations.py` to read the last 24 hours of Codex sessions, including archived sessions.
- `scripts/sync_memory_index.py` to maintain a normalized memory index section at the end of `~/.codex/AGENTS.md`.

## Workflow

### 1) Extract the last 24 hours of Codex conversations

- Run:

```bash
python3 ~/.codex/skills/codex-memory-manager/scripts/extract_recent_conversations.py --lookback-minutes 1440
```

- The extractor reads both `~/.codex/sessions` and `~/.codex/archived_sessions`.
- If output is exactly `NO_RECENT_CONVERSATIONS`, stop immediately and report that no memory update is needed.
- Review every returned `[USER]` and `[ASSISTANT]` block before deciding that a preference is stable.
- The extractor also cleans up stale session files after reading, matching the existing conversation-learning workflow.
- If the prompt provides an explicit `Automation memory:` path, open that file first when present so the current curation run can extend the previous automation summary without relying on shell variable expansion.

### 2) Distill only stable user preferences

- Focus on preferences that are durable and reusable, such as:
  - architecture and abstraction preferences
  - code style and naming preferences
  - workflow preferences
  - testing expectations
  - language- or ecosystem-specific preferences
  - reporting and communication format preferences
- Ignore transient task details, secrets, and one-off requests that are not likely to generalize.
- Prefer explicit user instructions. Use assistant behavior as supporting context only when it clearly reflects repeated user guidance.

### 3) Classify preferences into memory documents

- Store memory files under `~/.codex/memory/*.md`.
- Reuse an existing category file when the new preference clearly belongs there.
- Create a new category file only when recent chats introduce a distinct reusable preference class that does not fit an existing file.
- Keep filenames in kebab-case and scoped to a real category, for example:
  - `engineering-workflow.md`
  - `assistant-style.md`
  - `integration-and-deployment-preferences.md`
- Keep categories organized by reusable preference type, not by repository, issue, feature name, or one-off incident.
- When a file mixes too many unrelated preference types, split it by decision domain rather than by project.
- Prefer wording that captures a reusable choice pattern such as `Prefer X when Y` or `Do not do Z when Q`.
- Strip or generalize project-specific nouns, module names, branch names, issue numbers, and niche scenario labels unless they are required to explain the durable preference.
- Keep evidence notes concise and factual; they should justify the preference without turning the memory file into a project log.
- Use the normalized structure from `references/templates/memory-file.md` inside each memory file:

```md
# User Memory - Engineering Workflow

Last curated: 2026-04-05 09:20 HKT

## Scope
User preferences about how engineering tasks should be investigated, planned, implemented, verified, merged, and documented across repositories.

## Preferences
- Prefer modular abstractions over duplicated logic.
  - Applies when: designing or refactoring implementation structure.
- Skip planning artifacts for clearly small, localized, low-risk changes.
  - Applies when: assessing whether a task needs formal spec documents.

## Maintenance
- Keep entries concrete, action-guiding, and reusable across repositories.
- Move overlapping preferences to a better-matched memory file instead of keeping mixed categories.

## Evidence notes
- 2026-03-22 through 2026-04-04 repeated workflow corrections consistently reinforced scoped planning, approval gating, and architecture-aware implementation.
```

### 4) Refresh the AGENTS memory index at the end of `~/.codex/AGENTS.md`

- First inspect `~/.codex/AGENTS.md` and mirror its existing language in the memory section instructions.
- After updating memory files, run `scripts/sync_memory_index.py` to rewrite the managed section at the end of the file.
- The section must do both of these things explicitly:
  - instruct future agents to review the index before starting work
  - instruct future agents to update the matching memory files and refresh the index when a new category appears
- Example command in English AGENTS files:

```bash
python3 ~/.codex/skills/codex-memory-manager/scripts/sync_memory_index.py \
  --agents-file ~/.codex/AGENTS.md \
  --memory-dir ~/.codex/memory \
  --section-title "## User Memory Index" \
  --instruction-line "Before starting work, review the index below and open any relevant user preference files." \
  --instruction-line "When a new preference category appears, create or update the matching memory file and refresh this index."
```

- The script writes a managed block with markdown links to every indexed memory file.
- Keep the managed block at the tail of `~/.codex/AGENTS.md`; do not scatter memory links elsewhere in the file.

### 5) Report the memory update

- Summarize:
  - how many sessions were reviewed
  - which categories were created or updated
  - whether a new category was introduced
  - whether the AGENTS memory index changed
- When an explicit `Automation memory:` path is provided in the task prompt, also write the concise run summary back to that exact file path and prefer it over `$CODEX_HOME/...` interpolation when the shell environment is incomplete.
- When the user asks what memory exists or asks why a known preference was not mentioned, include the already-stored preferences that are directly relevant to the question instead of summarizing only newly added entries.
- When a stable preference already existed and was still reinforced by recent chats, say that it remains stored and point to the category where it lives.
- If no durable preferences were found, say so explicitly and avoid creating placeholder memory files.

## Guardrails

- Do not store secrets, tokens, credentials, or personal data that should not persist.
- Do not invent preferences when the evidence is weak or ambiguous.
- Do not create duplicate categories when a current memory document already covers the same theme.
- Do not create memory files organized around a specific repository, issue number, feature branch, or single operational incident unless the user explicitly wants that narrower scope.
- Do not preserve project-specific wording when a more general preference statement would retain the useful lesson.
- Do not rewrite unrelated parts of `~/.codex/AGENTS.md`; only manage the memory index block at the end.

## References

Load only when needed:

- `references/templates/memory-file.md`
