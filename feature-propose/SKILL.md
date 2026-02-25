---
name: feature-propose
description: Professional product-management workflow for proposing features from an existing codebase. Use when the user asks to understand an application, classify features from a user perspective into MVP/Important/Enhancement/Performance tiers, ask 3-5 clarifying questions when needed, propose numbered feature recommendations, record accepted items in AGENTS.md, and remove implemented items from AGENTS.md.
---

# Feature Propose

## Overview

Act as a professional PM: build a complete understanding of the current product from code, classify capabilities by user value, propose prioritized features, persist accepted proposals in `AGENTS.md`, and keep the list clean by removing implemented items.

## References

Load these references as needed during classification:

- `references/mvp-features.md`
- `references/important-features.md`
- `references/enhancement-features.md`
- `references/performance-features.md`

## Workflow

### 1) Explore the codebase before proposing anything

- Read repo-level guidance first (`AGENTS.md`, `README`, major docs).
- Map architecture, entrypoints, user-facing flows, data models, and external integrations.
- Identify implemented features, obvious gaps, and technical constraints from code and tests.
- Summarize findings before moving to prioritization.
- Refuse to guess when facts are missing; gather more evidence from code.

### 2) Build a user-perspective function inventory

- List the current user-facing functions as numbered items.
- For each function, include: user goal, current behavior, pain point/opportunity, and key file references.
- Classify each function into exactly one primary type using the reference definitions.
- If a function spans multiple types, keep one primary type and note the secondary type briefly.

### 3) Ask clarifying questions only when necessary

- Ask 3-5 targeted questions only when uncertainty blocks accurate prioritization.
- Focus questions on target users, business goal, release horizon, success metrics, and hard constraints.
- If context is already sufficient, skip questions and continue directly.

### 4) Propose features in four numbered groups

- Present features in this order:
  1. MVP features
  2. Important features
  3. Enhancement features
  4. Performance features
- Number every proposed feature (for example: `1`, `2`, `3`...) so acceptance can reference numbers.
- For each feature include:
  - User problem
  - Expected user value
  - Minimal implementation direction
  - Affected modules/files
  - Acceptance criteria
- Keep proposals focused and minimal; avoid over-engineering.

### 5) Persist accepted features to AGENTS.md and clean up after implementation

- Ask the user to accept/reject/edit features by number.
- Once accepted, update repo-root `AGENTS.md` with a dedicated section:
  - `## Accepted Feature Proposals`
- Append accepted features as a numbered list with:
  - Date (`YYYY-MM-DD`)
  - Type (`MVP`, `Important`, `Enhancement`, `Performance`)
  - Short feature statement
- Preserve existing `AGENTS.md` content and style; do not rewrite unrelated sections.
- If `AGENTS.md` does not exist, ask before creating it.
- After the related feature is implemented, remove that feature entry from `## Accepted Feature Proposals` in `AGENTS.md`.
- Remove only implemented items; keep unimplemented accepted items untouched.

## Output template

Use this structure when responding:

1. `Current understanding` (codebase findings)
2. `Function classification` (current functions mapped to 4 types)
3. `Proposed features` (numbered)
4. `Confirmation request` (ask user to accept/edit/reject by number)
