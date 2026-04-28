# Tasks: [Feature Name]

- Date: [YYYY-MM-DD]
- Feature: [Feature Name]

## **Task 1: [Task Title]**

Purpose: [one sentence describing the narrow outcome]
Requirements: [R1.x]
Scope: [files/modules/functions this task may touch]
Out of scope: [files/modules/behaviors this task must not change]

- 1. [ ] **[file/function]** — **[specific modification to make; expected outcome]**
  - Verify: [focused command/check/manual inspection; drift check ref if applicable]

- 2. [ ] **[file/function]** — **[specific modification to make; expected outcome]**
  - Verify: [focused command/check/manual inspection; drift check ref if applicable]

## **Task 2: [Task Title]**

Purpose: [one sentence describing the narrow outcome]
Requirements: [R2.x]
Scope: [files/modules/functions this task may touch]
Out of scope: [files/modules/behaviors this task must not change]

- 1. [ ] **[file/function]** — **[specific modification to make; expected outcome]**
  - Verify: [focused command/check/manual inspection; drift check ref if applicable]

- 2. [ ] **[file/function]** — **[specific modification to make; expected outcome]**
  - Verify: [focused command/check/manual inspection; drift check ref if applicable]

## Notes
- Task order reflects implementation sequence.
- Every task must map back to `spec.md` requirement IDs.
- Treat `tasks.md` as an implementation queue, not a summary.
- Each item must include the exact file path (or function/module), the specific change, and a concrete verification step — vague items are forbidden.
- Each checkbox is atomic: one verb, one file/function, one change outcome, one verification hook.
- Use `N.x [ ]` for sub-items only when a parent item needs further breakdown.
- Split tasks that exceed 3 files or span multiple behavior slices.
- Use `$test-case-strategy` for drift checks before implementation.
- After execution, update `[x]` for done, `[ ]` for pending.
- Remove all `[...]` placeholder text after filling.
