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
- Execution: Inventory the current working directory's existing skills before editing, prioritize repeated requests, user corrections, tool failures, logic bugs, architecture mismatches, documentation drift, and post-completion follow-up asks that reveal missing closure, then prefer a focused update to the strongest related skill or create a new skill only when the overlap is weak.
- Quality: Take no action when there are no recent sessions, avoid unrelated broad refactors, keep shared skills cross-project reusable, route project-specific tooling patterns into the relevant project's `~/.codex/skills/`, and validate every changed skill.
- Output: Report the analyzed sessions, extracted lessons, created or updated skills, shared-vs-project-specific placement decisions, and the reasoning behind each decision.

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
- Focus especially on repeated needs, repeated user corrections, and user-reported errors, then ask how a skill can prevent the same failure mode from recurring.
- Give extra weight to moments where the user corrected the agent, rejected an earlier interpretation, or pointed out a missing preference or requirement.
- Give extra weight to user-reported errors, regressions, or avoidable mistakes, then ask how a skill can prevent repeating that failure mode.
- Treat tool-call failures, broken code paths, logic mistakes, weak architecture choices, and outputs that drifted from official documentation as valuable evidence when they expose a reusable missing guardrail or workflow.
- Treat a user follow-up that asks for cleanup or an omitted finalization step immediately after the assistant reported completion as evidence that the workflow's done criteria were incomplete.
- When that kind of follow-up recurs, tighten the owning skill's completion checklist before considering any new-skill extraction.
- Even when a user request was highly specific, check whether the underlying workflow can be generalized into a reusable skill for the same class of tasks.
- When multiple existing skills use a near-identical workflow fragment, consider extracting that fragment into a dedicated shared skill instead of leaving the duplication in place.
- When an external skill is repeatedly used with the same user-specific customization layer, prefer wrapping it in a new local skill that encodes those standing conventions.
- Ignore one-off issues that do not provide reusable value.
- Distinguish between:
  - repeated trigger intent that deserves a new skill
  - repeated workflow fragments across multiple skills that should be extracted into a shared skill
  - skill gaps that are better handled by tightening an existing skill's guardrails

### 3) Decide new skill vs existing skill (default: new skill)

- First read the relevant skills already present in the current working directory repository (for example `apollo-toolkit`) so you do not create a duplicate under a different name.
- Prefer creating a new skill.
- Edit an existing skill only when the lesson is strongly related.
- Treat relation as strong only when all three conditions hold:
  - Same primary trigger intent.
  - At least 70% workflow overlap.
  - The update does not dilute the existing skill's scope.
- When the recurring lesson is mainly about preventing a known mistake, prefer updating the existing skill that should have prevented it instead of creating a parallel skill.
- When several skills repeat the same narrow workflow fragment, prefer extracting that fragment into a dedicated shared skill instead of copying the same guidance again.
- When the strongest candidate is an external skill but the user repeatedly adds the same customization or policy layer, create a wrapper skill that calls that external skill while encoding the recurring local conventions.
- Decide whether the lesson is cross-project reusable before choosing the destination:
  - Cross-project reusable skills belong in the shared skill library.
  - Project-specific workflows, especially ones tied to custom tools from a single repository, belong in that project's `~/.codex/skills/` directory instead of the shared catalog.
- If uncertain, create a new skill instead of expanding an old one.

### 4) Apply changes through skill-creator

- Explicitly follow `$skill-creator` workflow before editing skills.
- For new shared skills, initialize with `~/.codex/skills/.system/skill-creator/scripts/init_skill.py`, then complete `SKILL.md` and required resources.
- For new project-specific skills, create or update them under the relevant project's `~/.codex/skills/` directory instead of the shared catalog.
- For existing skills, make minimal focused edits and keep behavior consistent.

### 5) Validate every changed skill

- Run:

```bash
python3 ~/.codex/skills/.system/skill-creator/scripts/quick_validate.py <skill-path>
```

- Resolve validation failures before finishing.

### 6) Report result

- Summarize analyzed sessions, repeated needs, user corrections, error-driven lessons, created/updated skills, placement decisions, and why each decision was made.

## Guardrails

- Take no action when there are no sessions in the last 24 hours.
- Avoid broad refactors across unrelated skills.
- Avoid duplicate skills when an existing skill is strongly related.
- Do not promote project-specific tool usage into the shared catalog unless the workflow is clearly reusable across repositories.
