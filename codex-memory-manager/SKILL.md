---
name: codex-memory-manager
description: Manage persistent Codex user-preference memory from recent conversation history. Use when users ask to learn from the last 24 hours of chats, update `~/.codex/AGENTS.md`, maintain `~/.codex/memory/*.md`, or sync new preference categories discovered in `~/.codex/sessions` and `~/.codex/archived_sessions`.
---

# Codex Memory Manager

## Dependencies

- Required: none.
- Conditional: `learn-skill-from-conversations` when the same conversation review should also evolve the skill catalog.
- Optional: none.
- Fallback: If `~/.codex/sessions`, `~/.codex/archived_sessions`, or `~/.codex/AGENTS.md` are unavailable, report the missing path and stop instead of guessing.

## Standards

- Evidence: Derive memory only from actual recent Codex conversations, and keep each stored preference tied to concrete chat evidence.
- Execution: Extract the last 24 hours first, classify durable user preferences into memory files, then refresh the AGENTS index section.
- Quality: Ignore one-off instructions, avoid duplicating categories, and preserve the existing language and tone already used in `~/.codex/AGENTS.md`.
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
- Create a new category file when the recent chats introduce a distinct new class of preferences. Example: if the existing files are Rust-focused and recent chats introduce stable Java preferences, add a new Java-oriented category file and index it.
- Keep filenames in kebab-case and scoped to a real category, for example:
  - `architecture-preferences.md`
  - `workflow-preferences.md`
  - `java-preferences.md`
- Use this normalized structure inside each memory file:

```md
# Architecture Preferences

## Scope
User preferences about system design, reuse, abstractions, and code organization.

## Preferences
- Prefer extending existing modules over parallel implementations.
  - Applies when: adding adjacent behavior in an existing codebase.
  - Evidence: repeated direction from recent Codex conversations reviewed on 2026-03-18.
- Avoid speculative abstractions and over-engineering.
  - Applies when: choosing between a focused edit and a broader refactor.
  - Evidence: explicit repeated user guidance in recent sessions.

## Maintenance
- Keep entries concrete and action-guiding.
- Merge duplicates instead of restating the same preference.
- Replace older statements when newer evidence clearly supersedes them.
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
- If no durable preferences were found, say so explicitly and avoid creating placeholder memory files.

## Guardrails

- Do not store secrets, tokens, credentials, or personal data that should not persist.
- Do not invent preferences when the evidence is weak or ambiguous.
- Do not create duplicate categories when a current memory document already covers the same theme.
- Do not rewrite unrelated parts of `~/.codex/AGENTS.md`; only manage the memory index block at the end.
