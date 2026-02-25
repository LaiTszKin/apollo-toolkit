---
name: learn-skill-from-conversations
description: Learn and evolve the local skill library from recent Codex conversation logs. Use when users ask to learn from past chats, mine ~/.codex/sessions, or automatically create/update skills from recurring lessons. The workflow always reads all sessions from the last hour, exits immediately if none exist, and applies skill changes through skill-creator with a default bias toward creating new skills.
---

# Learn Skill from Conversations

## Overview

Extract recent conversations, identify reusable lessons, and convert those lessons into concrete skill updates.

## Required Resources

- `scripts/extract_recent_conversations.py` for deterministic session extraction.
- `$skill-creator` for all skill creation/update work.

## Workflow

### 1) Extract the latest conversation history

- Run:

```bash
python3 ~/.codex/skills/learn-skill-from-conversations/scripts/extract_recent_conversations.py --lookback-minutes 60
```

- If output is exactly `NO_RECENT_CONVERSATIONS`, stop immediately and report that no action is required.
- Otherwise, review all `[USER]` and `[ASSISTANT]` blocks from each returned session.

### 2) Derive reusable lessons

- Identify repeated user needs, recurring friction, and repeated manual workflows.
- Ignore one-off issues that do not provide reusable value.

### 3) Decide new skill vs existing skill (default: new skill)

- Prefer creating a new skill.
- Edit an existing skill only when the lesson is strongly related.
- Treat relation as strong only when all three conditions hold:
  - Same primary trigger intent.
  - At least 70% workflow overlap.
  - The update does not dilute the existing skill's scope.
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

- Summarize analyzed sessions, extracted lessons, created/updated skills, and why each decision was made.

## Guardrails

- Take no action when there are no sessions in the last hour.
- Avoid broad refactors across unrelated skills.
- Avoid duplicate skills when an existing skill is strongly related.
