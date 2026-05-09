---
name: implement-specs
description: >-
  Land approved `docs/plans/{YYYY-MM-DD}/{change}` (or batch member path) on the current branch: resolve path by user pointer or evidence-backed latest (no guesses); read spec→design→contract→checklist then run every `tasks.md` line and all `checklist.md` wrap-up; multi-directory work follows `coordination.md`—one directory fully done before the next; backfill plans; **`commit-and-push`** for final commit (no branch/worktree unless user rescopes). Isolation: **`implement-specs-with-worktree`**; delegation: **`implement-specs-with-subagents`**.
---

# Implement Specs

## Dependencies

- Required: **`commit-and-push`** for the **final** implementation commit (and push when the user explicitly requests remote update).
- Conditional: `generate-spec` if spec files need clarification or updates; `recover-missing-plan` if the requested plan path is missing from the current checkout.
- Optional: none.
- Fallback: If **`commit-and-push`** is unavailable, **MUST** stop immediately and report the missing dependency. Do not improvise substitute standards or ungated `git commit`.

## Non-negotiables

- **MUST** read and understand the full in-scope planning set and the parent `coordination.md` when its path applies, **before** editing product code or tests for this spec. Read for meaning in this order: **`spec.md`** (requirements / intent), **`design.md`** (high-level architecture + coarse `INT-###` anchors—**guidance for structuring work**), **`contract.md`** (cite-backed external facts/constraints + `EXT-###` anchors), **`checklist.md`**, then treat **`tasks.md`** as **the authoritative ordered runnable checklist**. **MUST NOT** start coding until that read pass is complete for the current in-scope directory.
- **MUST** execute **every** **`tasks.md`** line in listed order—the **executable source of truth** for what to ship. **`design.md` / `contract.md`** **inform** decomposition and forbid contradictions (**`INT-###` / `EXT-###`** when present are **constraints/anchors referenced from tasks**, not a second queue). **MUST NOT** silently wire alternate module flows or vendor surfaces that conflict with approved **`design`** / **`contract`**; resolve conflicts via **`generate-spec`** / explicit approved plan edits first.
- **MUST** when multiple spec directories apply to one request, follow parent **`coordination.md`** merge / sequencing guidance (or the user’s explicit order if coordination is absent or defers to them) and **complete** one directory end-to-end—**all** of its `tasks.md` lines **and** **all** of its `checklist.md` wrap-up / acceptance work—**before** starting implementation work in the next directory. **MUST NOT** interleave partial implementation across sibling specs.
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
- **Execution**: Current checkout only; **`tasks.md`** defines runnable order and file targets; **`spec`/`design`/`contract`** constrain meaning and forbid contradictory wiring—implement and test until obligations are met—no parallel branch or worktree (unless the user rescopes to another skill).
- **Quality**: **All** `tasks.md` lines **and** **all** `checklist.md` wrap-up / acceptance obligations for this scope satisfied (see Non-negotiables—workload is not an excuse); tests and checklist verifications executed as required; docs reflect reality; no scope creep into sibling specs.
- **Output**: Current branch contains a clean, reviewable implementation of this spec only.

## Workflow

**Chain-of-thought:** Before advancing each numbered step, answer the **`Pause →`** questions (even if only internally). A “no” or “unknown” answer **MUST** be resolved or surfaced as a blocker before continuing.

1. **Locate and read** — Resolve `docs/plans/{YYYY-MM-DD}/{change_name}/` or `docs/plans/{YYYY-MM-DD}/{batch_name}/{change_name}/` using the path the **user** gave **or**, when none is given, the **most recent** plan location proven by repository evidence (issue links, manifests, `docs/plans` listing—**MUST NOT** pick a sibling folder by guess). Read parent `coordination.md` when present (merge order, parallelism rules, collisions). For **each** in-scope directory, before any code edits, read the five core files for substance in this order: `spec.md` → `design.md` → `contract.md` → `checklist.md` → `tasks.md` (execution list). If multiple directories are in scope, establish their **sequence** from `coordination.md` (or the user) and plan to implement **one directory at a time** to full completion (Non-negotiables).
   - **Pause →** Is this directory the **exact** scope—or ordered list—the user (or coordination) requires, verified by listing or viewing those five files—not a sibling “similar” folder?
   - **Pause →** Have I explicitly linked each material requirement / task to evidence I understood from **spec** / **design** / **contract** (still no code edits)?
   - **Pause →** If the path were missing or wrong, what **verifiable** step would locate the authoritative plan—and have I executed it?

2. **Branch sanity** — Run `git status -sb`. Do not modify unrelated dirty files; surface blockers. Confirm the current branch is where this work should land.
   - **Pause →** Would creating or switching branches or a worktree right now **violate** the Non-negotiables—and am I resisting that temptation?
   - **Pause →** What dirty paths are **out of scope**, and how will I avoid touching them inadvertently?
   - **Pause →** Is the integration target branch (where the user expects work) identical to what `git status -sb` shows?

3. **Implement** — Execute **the entire** approved `tasks.md` (every line) for the **current** in-scope directory only, honoring requirements and design you read in step 1; do not close this step until **no** applicable unchecked tasks remain **for that directory**. Run relevant tests and **any** verification commands or artifact steps that `checklist.md` already assigns to the implementation phase (do not postpone checklist-only closing items that belong here). When the request spans multiple directories, **repeat** steps 3–4 **per directory** in the coordination order **after** the previous directory’s tasks **and** checklist obligations are satisfied.
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
- **Read order**: keep the mandated sequence (**spec → design → contract → checklist → tasks**); use **`checklist.md`** after **spec/design/contract** so acceptance checks map to stated requirements and boundaries.
- **Multi-directory batch (same branch)**: `coordination.md` says merge order `api-layer` then `cli-wrapper` — finish **`api-layer`** `tasks.md` **and** **`api-layer`** `checklist.md` completely, then start **`cli-wrapper`**; do not split half of each.
- **Branch sanity excerpt**: expect `git status -sb` like `## feature/x …` plus a dirty `README.md` you do **not** own — leave that file untouched; implement only paths from `tasks.md`.
- **Completion report sketch**: `Branch: feature/x · Commit: a1b2c3d · Tests: npm test -- lib/auth.test.js · Backfill: tasks.md (done), checklist.md (R1.3 → passed).`
- **Anti-pattern**: `git checkout -b impl/oauth-scope` for this skill — **wrong** unless the user changed scope mid-conversation.

## References

- `recover-missing-plan`: missing or mismatched plan recovery
- **`commit-and-push`**: final commit/readiness (push only when user requests remote update)
