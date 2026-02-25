---
name: open-source-pr-workflow
description: PR-focused workflow for open-source repositories. Use when the user asks to prepare a PR branch from existing changes, draft/open/update a PR, or push a ready contribution branch. Do not use this skill for implementing product features or editing business logic; use it after code changes are already prepared. Enforce branch naming as codex/{change_type}/{changes}, open PRs directly by default without waiting for draft confirmation, show drafts only when the user explicitly asks to review them first, default forked repositories to open PRs against the upstream parent repository unless the user explicitly requests the fork, and write PR content in English by default with required sections for related issues or motivation, engineering decisions with rationale, and test results with commands. For code-affecting changes, run edge-case-test-fixer first and code-simplifier second before opening the PR.
---

# Open Source PR Workflow

## Overview

Use this workflow to prepare open-source contributions and open review-ready pull requests with consistent branch naming and PR content quality.

## Scope Guardrails

- This skill is for PR preparation and PR creation only.
- Do not use this skill as the primary workflow for implementing features or fixing code.
- If code changes are still needed, finish implementation in another workflow first, then return to this skill for PR handling.

## Workflow

### 1) Clarify PR scope

- Identify related issue links/IDs and summarize the motivation for the change.
- Confirm target base branch and contribution constraints from the repository.
- Detect whether the current repository is a fork (for example with `gh repo view --json isFork,parent,nameWithOwner`).
- If it is a fork, default the PR destination repository to the upstream parent repository.
- Only target the fork repository when the user explicitly asks for it.

### 2) Create a compliant branch name

- Always use this pattern for PR branches: `codex/{change_type}/{changes}`.
- Convert both `{change_type}` and `{changes}` to lowercase kebab-case (`[a-z0-9-]` only).
- If the current branch name does not match, create a new compliant branch from current HEAD before opening PR.

Example:

```bash
git checkout -b codex/fix/add-rate-limit-retry
```

### 3) Run dependent skills for code-affecting changes

- If the PR includes code changes, run `edge-case-test-fixer` first.
- Then run `code-simplifier` on the updated changes.
- Keep both passes minimal and focused on the current PR scope.
- Use these skills as internal quality gates only; do not include skill/tool names in PR content.
- If the PR has no code changes, explicitly note that these two skills were not required in internal notes only.

### 4) Verify existing changes (no feature implementation in this skill)

- Assume code/documentation changes are already prepared before entering this workflow.
- Do not add new feature implementation in this skill.
- After the dependent skills step (when required), run relevant checks (lint/test/build) based on repository conventions.
- Record exact test commands and outcomes for PR content.

### 5) Prepare PR content (show draft only on request)

- Draft the PR title and full PR body before creating the PR.
- Keep PR content strictly about the PR itself (motivation, changes, rationale, tests).
- Do not include internal workflow details such as skill names, tool names, or agent process notes.
- By default, proceed directly to PR creation after the title/body are ready.
- Show the draft only when the user explicitly asks to review it before creating the PR.
- If the user asks for draft edits, revise accordingly and get final confirmation before creating the PR.

### 6) Open the PR

- Prefer `gh pr create` to open the PR.
- If the repository is a fork, target the upstream parent repository by default (for example `gh pr create --repo <upstream-owner>/<upstream-repo> --head <fork-owner>:<branch>`).
- Use the fork as the PR destination only when the user explicitly requests it.
- Ensure PR title/body are in English by default.
- Switch language only when the user explicitly requests another language.

## Required PR Body Structure

Use this structure (or equivalent headings) every time:

```markdown
## Related Issues / Motivation
- Related: #<issue-id> (or link)
- Why this change is needed

## Engineering Decisions and Rationale
- Key implementation choices
- Why each choice was made
- Trade-offs considered (if applicable)

## Test Results and Commands
- ✅ `command 1`
- ✅ `command 2`
- Summary of outcomes

### Test Cases (for complex changes)
- Case 1: input/scenario -> expected result
- Case 2: input/scenario -> expected result
```

If tests cannot run locally, state why and provide the closest available validation evidence.

## Pre-PR Checklist

- Branch name matches `codex/{change_type}/{changes}`.
- If the user asked to review the draft, they confirmed the final draft before PR creation.
- If the repository is a fork, PR destination is the upstream parent unless the user explicitly requested the fork.
- PR body includes all required sections and focuses only on PR-related context.
- If code changes exist, run `edge-case-test-fixer` and `code-simplifier` in that order before opening the PR.
- PR body does not mention internal skills/tools or agent workflow notes.
- Test commands and results are explicitly listed.
- Language defaults to English unless user requests otherwise.
