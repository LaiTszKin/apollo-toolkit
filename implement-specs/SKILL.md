---
name: implement-specs
description: >-
  Land an approved `docs/plans/{YYYY-MM-DD}/{change}` (or batch member path) on the currently checked-out branch: read the full planning bundle + `coordination.md` when relevant, **execute every actionable line in `tasks.md` with no exemption for workload or session length**, **complete every `checklist.md` wrap-up / acceptance obligation so the spec is not “done” until checklist-backed closing work is satisfied**, backfill honest plan state, then **finalize through `commit-and-push`**—**do not** create branches/worktrees or widen to push/release unless the user explicitly asks mid-thread.
  Choose this for “implement on this branch” scenarios. If isolation is required use **`implement-specs-with-worktree`**; if multiple specs need delegated workers use **`implement-specs-with-subagents`**.
  Good: stay on `feature/foo`, finish all `tasks.md` and `checklist.md` closing work, run **`commit-and-push`**. Bad: `git worktree add` purely to avoid dirty trees—wrong skill unless user re-scoped.
---

# Implement Specs

## Dependencies

- Required: `enhance-existing-features` and `develop-new-features` for implementation standards; **`commit-and-push`** for the **final** implementation commit (and push when the user explicitly requests remote update).
- Conditional: `generate-spec` if spec files need clarification or updates; `recover-missing-plan` if the requested plan path is missing from the current checkout.
- Optional: none.
- Fallback: If **`enhance-existing-features`**, **`develop-new-features`**, or **`commit-and-push`** is unavailable, **MUST** stop immediately and report the missing dependency. Do not improvise substitute standards or ungated `git commit`.

## Non-negotiables

- **MUST** read and understand the full in-scope planning set (`spec.md`, `tasks.md`, `checklist.md`, `contract.md`, `design.md`) and the parent `coordination.md` when its path applies, **before** editing product code or tests for this spec.
- **MUST NOT** create a branch, switch branches, or add or use a `git worktree` for this work unless the user explicitly changes the request in the same conversation.
- **`tasks.md` completeness (hard stop)**: **MUST** execute **every** actionable item listed in the in-scope `tasks.md` for this request—**no exceptions** for perceived size, duration, file count, refactor depth, or session length. **MUST NOT** stop early, “defer” unchecked tasks while claiming the spec is done, collapse multiple task lines into a partial summary, or substitute narrative progress for completing a remaining line. If a line is truly impossible under written contracts, **MUST** stop with evidence and **MUST NOT** treat the implementation pass as complete until the plan is amended through the governing planning workflow (`generate-spec` / user-approved update) and the revised `tasks.md` is then fully satisfied.
- **`checklist.md` wrap-up / acceptance (hard stop for “spec complete”)**: **MUST** complete **all** `checklist.md` obligations that constitute **wrap-up, acceptance, verification, release-prep, doc or index sync, or other closing/hand-off** work tied to this change—**same no-exemption bar as `tasks.md`** (workload, duration, or breadth **do not** waive checklist-only items). The **entire** in-scope spec is **not** **complete** until those checklist items are **actually satisfied** and truthfully marked. **MUST NOT** treat “implementation done” or proceed to final **`commit-and-push`** / completion reporting while checklist-defined closing work remains open or is waved away with narrative. If a checklist item is impossible under contracts or facts on the ground, **MUST** stop with evidence and **MUST NOT** declare the spec complete until the plan is amended through the governing workflow and the revised `checklist.md` is then fully satisfied.
- **MUST** treat the approved `tasks.md`, `checklist.md`, and contracts as the scope boundary: on top of the rules above, run the relevant checklist-backed verifications and tests, and **MUST** backfill the planning documents with factual completion status (no aspirational checkboxes).
- **MUST NOT** expand scope to unrelated sibling spec directories solely because they share a batch folder.
- **MUST** finalize the implementation through **`commit-and-push`** after staging the intended change set (shared readiness, reviews per that skill’s classification, conventional commit message); **MUST NOT** complete the deliverable with a bare `git commit`, IDE-only commit, or other shortcut that skips **`submission-readiness-check`** / mandated gates.
- **MUST NOT** `git push`, tag, or perform release steps **outside** **`commit-and-push`** (unless **`version-release`** / **`open-source-pr-workflow`** explicitly applies per user request).
- If the plan path is missing or ambiguous: **MUST** use `recover-missing-plan` or other verifiable repository evidence to locate the authoritative plan; **MUST NOT** substitute a nearby path by guess. After recovery, **MUST** re-read the recovered files before coding so implementation and backfill target the same snapshot.

## Standards (summary)

- **Evidence**: Same as Non-negotiables: no coding until the spec set is fully read; no guessed plan paths.
- **Execution**: Current checkout only; dependent-skill standards apply to all implementation and testing steps.
- **Quality**: **All** `tasks.md` lines **and** **all** `checklist.md` wrap-up / acceptance obligations for this scope satisfied (see Non-negotiables—workload is not an excuse); tests and checklist verifications executed as required; docs reflect reality; no scope creep into sibling specs.
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

3. **Implement** — Execute **the entire** approved `tasks.md` (every line) per `enhance-existing-features` / `develop-new-features`; do not close this step until **no** applicable unchecked tasks remain. Run relevant tests and **any** verification commands or artifact steps that `checklist.md` already assigns to the implementation phase (do not postpone checklist-only closing items that belong here).
   - **Pause →** Have I listed **every** remaining `tasks.md` line—and is the count **zero** before I leave this step?
   - **Pause →** For the next task item, what is the **single** concrete change and its **single** primary verification—before I type code?
   - **Pause →** Am I about to touch a file that belongs to a **sibling** spec or an unrelated module without an in-scope task line?
   - **Pause →** After this chunk of work, which test command **proves** I did not break the contract’s stated behavior?

4. **Backfill** — Update `checklist.md` / `tasks.md` (and any other plan files your standards require) so completion status matches what you actually did. **MUST NOT** advance to **Submit** until **every** checklist item that defines wrap-up or acceptance for this spec is **done** or the batch is an honest documented halt per Non-negotiables.
   - **Pause →** If I checked a box, can I point to **commit + test run** (or equivalent) that makes that check true—no wishful checking?
   - **Pause →** Are **zero** checklist obligations that mean “before spec complete” still open—validated by re-reading `checklist.md`, not from memory?
   - **Pause →** Did any scope shrink or shift during implementation; if so, is the plan text updated **honestly**?

5. **Submit** — Stage the intended implementation/backfill diff. Run **`commit-and-push`** through commit using that staged intent (and **push** only when the user explicitly requested remote update). Keep scope to this spec only; split into multiple submission passes only when an unavoidable checkpoint requires separate commits. **Only** reach this step when **both** `tasks.md` and `checklist.md` Non-negotiable closures are satisfied.
   - **Pause →** Does `git diff --cached` (or the equivalent staged view) show only this spec’s intended surface, or do I need to unstage/revert noise first?
   - **Pause →** Am I on the **same** branch I named in step 2, without a silent branch switch?

6. **Report** — State current branch, commit hash, tests run, which plan files were backfilled, and explicit confirmation that **`tasks.md` and checklist-defined wrap-up work are complete** for this in-scope spec (or cite the documented blocker).
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
- **`commit-and-push`**: final commit/readiness (push only when user requests remote update)
