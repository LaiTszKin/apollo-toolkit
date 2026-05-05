---
name: implement-specs
description: >-
  Land an approved `docs/plans/{YYYY-MM-DD}/{change}` (or batch member path) on the currently checked-out branch: read the full planning bundle + `coordination.md` when relevant, execute every in-scope `tasks.md` item, backfill honest checklist/spec state, commit locally—**do not** create branches/worktrees or push unless the user explicitly widens the request mid-thread.
  Choose this for “implement on this branch” scenarios. If isolation is required use **`implement-specs-with-worktree`**; if multiple specs need delegated workers use **`implement-specs-with-subagents`**.
  Good: stay on `feature/foo`, finish tasks, `git commit`. Bad: `git worktree add` purely to avoid dirty trees—wrong skill unless user re-scoped.
---

# Implement Specs

## Dependencies

- Required: `enhance-existing-features` and `develop-new-features` for implementation standards.
- Conditional: `generate-spec` if spec files need clarification or updates; `recover-missing-plan` if the requested plan path is missing from the current checkout.
- Optional: none.
- Fallback: If `enhance-existing-features` or `develop-new-features` is unavailable, **MUST** stop immediately and report the missing dependency. Do not improvise substitute standards.

## Non-negotiables

- **MUST** read and understand the full in-scope planning set (`spec.md`, `tasks.md`, `checklist.md`, `contract.md`, `design.md`) and the parent `coordination.md` when its path applies, **before** editing product code or tests for this spec.
- **MUST NOT** create a branch, switch branches, or add or use a `git worktree` for this work unless the user explicitly changes the request in the same conversation.
- **MUST** treat the approved `tasks.md` / contracts as the scope boundary: complete every item that is in scope for this request, run the relevant tests, and **MUST** backfill the planning documents with factual completion status (no aspirational checkboxes).
- **MUST NOT** expand scope to unrelated sibling spec directories solely because they share a batch folder.
- **MUST** commit the finished work to the **current** branch as a focused implementation commit (split only when an unavoidable checkpoint is required); the combined result **MUST** contain only the intended changes.
- **MUST NOT** `git push`, tag, or perform release steps unless the user explicitly asks.
- If the plan path is missing or ambiguous: **MUST** use `recover-missing-plan` or other verifiable repository evidence to locate the authoritative plan; **MUST NOT** substitute a nearby path by guess. After recovery, **MUST** re-read the recovered files before coding so implementation and backfill target the same snapshot.

## Standards (summary)

- **Evidence**: Same as Non-negotiables: no coding until the spec set is fully read; no guessed plan paths.
- **Execution**: Current checkout only; dependent-skill standards apply to all implementation and testing steps.
- **Quality**: All in-scope tasks done; tests executed; docs reflect reality; no scope creep into sibling specs.
- **Output**: Current branch contains a clean, reviewable implementation of this spec only.

## Workflow

**Chain-of-thought:** Before advancing each numbered step, answer the **`Pause →`** questions (even if only internally). A “no” or “unknown” answer **MUST** be resolved or surfaced as a blocker before continuing.

1. **Locate and read** — Resolve `docs/plans/{YYYY-MM-DD}/{change_name}/` or `docs/plans/{YYYY-MM-DD}/{batch_name}/{change_name}/`. Read the five core files; read parent `coordination.md` when present. Stay inside the directories the user asked for.
   - **Pause →** Is this directory the **exact** scope the user asked for, verified by listing or viewing those five files—not a sibling “similar” folder?
   - **Pause →** Have I explicitly linked each material requirement / task to evidence I understood (still no code edits)?
   - **Pause →** If the path were missing or wrong, what **verifiable** step would locate the authoritative plan—and have I executed it?

2. **Branch sanity** — Run `git status -sb`. Do not modify unrelated dirty files; surface blockers. Confirm the current branch is where this work should land.
   - **Pause →** Would creating or switching branches or a worktree right now **violate** the Non-negotiables—and am I resisting that temptation?
   - **Pause →** What dirty paths are **out of scope**, and how will I avoid touching them inadvertently?
   - **Pause →** Is the integration target branch (where the user expects work) identical to what `git status -sb` shows?

3. **Implement** — Execute approved `tasks.md` per `enhance-existing-features` / `develop-new-features`. Run relevant tests.
   - **Pause →** For the next task item, what is the **single** concrete change and its **single** primary verification—before I type code?
   - **Pause →** Am I about to touch a file that belongs to a **sibling** spec or an unrelated module without an in-scope task line?
   - **Pause →** After this chunk of work, which test command **proves** I did not break the contract’s stated behavior?

4. **Backfill** — Update `checklist.md` / `tasks.md` (and any other plan files your standards require) so completion status matches what you actually did.
   - **Pause →** If I checked a box, can I point to **commit + test run** (or equivalent) that makes that check true—no wishful checking?
   - **Pause →** Did any scope shrink or shift during implementation; if so, is the plan text updated **honestly**?

5. **Commit** — Commit on the current branch; keep the diff limited to this spec’s intent.
   - **Pause →** Does `git diff` show only this spec’s intended surface, or do I need to revert irrelevant noise first?
   - **Pause →** Am I on the **same** branch I named in step 2, without a silent branch switch?

6. **Report** — State current branch, commit hash, tests run, and which plan files were backfilled.
   - **Pause →** Would another engineer **reproduce** my conclusion from the branch name, commit hash, and test commands I listed alone?

If this skill directory contains `references/implement-specs-common.md`, treat it as an optional extension to the steps above; if it is absent, the Workflow section here is authoritative.

## Sample hints

- **Resolve path**: user says “implement `oauth-scope`”; read `docs/plans/2026-05-01/oauth-scope/` first, **not** a sibling folder like `docs/plans/2026-05-01/batch/oauth-scope/` unless that is where the five files actually live per user or manifest.
- **Branch sanity excerpt**: expect `git status -sb` like `## feature/x …` plus a dirty `README.md` you do **not** own — leave that file untouched; implement only paths from `tasks.md`.
- **Completion report sketch**: `Branch: feature/x · Commit: a1b2c3d · Tests: npm test -- lib/auth.test.js · Backfill: tasks.md (done), checklist.md (R1.3 → passed).`
- **Anti-pattern**: `git checkout -b impl/oauth-scope` for this skill — **wrong** unless the user changed scope mid-conversation.

## References

- `enhance-existing-features`: brownfield implementation standards
- `develop-new-features`: greenfield implementation standards
- `recover-missing-plan`: missing or mismatched plan recovery
