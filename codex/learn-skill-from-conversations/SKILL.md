---
name: learn-skill-from-conversations
description: Learn and evolve the local skill library from recent Codex conversation logs. Use when users ask to learn from past chats, mine ~/.codex/sessions or ~/.codex/archived_sessions, or automatically create/update skills from recurring lessons. The workflow reads all sessions from the last 24 hours, exits immediately if none exist, cleans up stale session files after reading, and applies skill changes through skill-creator with a default bias toward creating new skills.
---

# Learn Skill from Conversations

## Dependencies

- Required: `skill-creator` for all skill creation or update work.
- Conditional: none.
- Optional: none.
- Fallback: If skill changes cannot be delegated through `skill-creator`, stop and report the blocked dependency.

## Standards

- Evidence: Extract recent Codex session history first and derive reusable lessons only from actual conversation patterns.
- Execution: Inventory the current skill catalog before editing, prioritize repeated requests, user corrections, reported errors, and post-completion follow-up asks that reveal missing closure, then prefer a focused update to the strongest related skill or create a new skill only when the overlap is weak.
- Quality: Take no action when there are no recent sessions, avoid unrelated broad refactors, and validate every changed skill.
- Output: Report the analyzed sessions, extracted lessons, created or updated skills, and the reasoning behind each decision.

## Overview

Extract recent conversations, identify reusable lessons, and convert those lessons into concrete skill updates.

## Required Resources

- `scripts/extract_recent_conversations.py` for deterministic session extraction.
- `$skill-creator` for all skill creation/update work.

## Workflow

### 1) Extract the latest conversation history

- Run:

```bash
python3 ~/.codex/skills/learn-skill-from-conversations/scripts/extract_recent_conversations.py --lookback-minutes 1440
```

- If output is exactly `NO_RECENT_CONVERSATIONS`, stop immediately and report that no action is required.
- Otherwise, review all `[USER]` and `[ASSISTANT]` blocks from each returned session.
- The extractor reads both `~/.codex/sessions` and `~/.codex/archived_sessions`.
- After extraction completes, it deletes `~/.codex/sessions` records older than 7 days and deletes all files under `~/.codex/archived_sessions`.

### 2) Derive reusable lessons

- Identify repeated user needs, recurring friction, and repeated manual workflows.
- Give extra weight to moments where the user corrected the agent, rejected an earlier interpretation, or pointed out a missing preference or requirement.
- Give extra weight to user-reported errors, regressions, or avoidable mistakes, then ask how a skill can prevent repeating that failure mode.
- Treat a user follow-up that asks for cleanup or an omitted finalization step immediately after the assistant reported completion as evidence that the workflow's done criteria were incomplete.
- When that kind of follow-up recurs, tighten the owning skill's completion checklist before considering any new-skill extraction.
- Ignore one-off issues that do not provide reusable value.
- Distinguish between:
  - repeated trigger intent that deserves a new skill
  - repeated workflow fragments across multiple skills that should be extracted into a shared skill
  - skill gaps that are better handled by tightening an existing skill's guardrails

### 3) Decide new skill vs existing skill (default: new skill)

- First read the relevant skills already present in the working repository so you do not create a duplicate under a different name.
- Prefer creating a new skill.
- Edit an existing skill only when the lesson is strongly related.
- Treat relation as strong only when all three conditions hold:
  - Same primary trigger intent.
  - At least 70% workflow overlap.
  - The update does not dilute the existing skill's scope.
- When the recurring lesson is mainly about preventing a known mistake, prefer updating the existing skill that should have prevented it instead of creating a parallel skill.
- When several skills repeat the same narrow workflow fragment, prefer extracting that fragment into a dedicated shared skill instead of copying the same guidance again.
- If uncertain, create a new skill instead of expanding an old one.

### 4) Apply changes through skill-creator

- Explicitly follow `$skill-creator` workflow before editing skills.
- For new skills, initialize with `~/.codex/skills/.system/skill-creator/scripts/init_skill.py`, then complete `SKILL.md` and required resources.
- For existing skills, make minimal focused edits and keep behavior consistent.

### 5) Validate every changed skill

- Run:

```bash
python3 ~/.codex/skills/.system/skill-creator/scripts/quick_validate.py <skill-path>
```

- Resolve validation failures before finishing.

### 6) Report result

- Summarize analyzed sessions, repeated needs, user corrections, error-driven lessons, created/updated skills, and why each decision was made.

## Guardrails

- Take no action when there are no sessions in the last 24 hours.
- Avoid broad refactors across unrelated skills.
- Avoid duplicate skills when an existing skill is strongly related.
