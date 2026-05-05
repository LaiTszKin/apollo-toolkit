---
name: review-spec-related-changes
description: >-
  Read-only spec compliance versus governing docs/plans: score each business-oriented requirement Met/Partial/Not-met using code/tests/commands—checked `tasks.md` boxes are never sufficient proof; ambiguity between two plausible plan roots halts execution; when runtime code exists, sequentially run **`review-change-set`**, **`discover-edge-cases`**, and **`discover-security-issues`** on the same scoped diff afterward.
  Use for questions like “does this PR satisfy coordination.md + spec.md R2?” or user pins a `{change}` folder.
  Do not mutate repositories, reorder reports to bury missing goals, skip the tertiary review bundle on code-bearing diffs, or rely on intent without file evidence **BAD**, lead with refactor comments while R1 failing **FORBIDDEN**… GOOD pair every Not-met cite with `spec.md` ref + concrete path:test gap…
---

# Review Spec Related Changes

## Dependencies

- Required: `review-change-set`, `discover-edge-cases`, and `discover-security-issues` whenever the scope includes **code-affecting** implementation to assess.
- Conditional: none.
- Optional: none.
- Fallback: If any required dependency is unavailable for a **code-affecting** review, **MUST** stop and report the gap. **MUST NOT** emit a “full pass” verdict without those three passes when code is in scope.

## Non-negotiables

- **MUST NOT** edit implementation code, tests, or planning docs during this skill (read-only review).
- **MUST NOT** archive specs, commit, push, tag, or release from this skill.
- **MUST** resolve which spec set governs the change **before** concluding; if multiple candidates fit equally and cannot be disambiguated from repo evidence, **MUST** stop and report ambiguity—**MUST NOT** guess.
- **MUST** classify each business goal / acceptance item as `Met`, `Partially met`, `Not met`, or `Deferred/N/A` **only** using verifiable evidence (code, tests, commands, traces)—checked boxes in `tasks.md` are **not** proof by themselves.
- **MUST** treat **unmet or partially met required business goals** as **highest severity**. **MUST NOT** let edge-case, security, or style findings **outrank** those gaps in the reported order or implied priority.
- **MUST** finish the business-goal verdict **before** invoking secondary skills; **MUST** still run `review-change-set`, `discover-edge-cases`, and `discover-security-issues` on the **same** implementation scope when code is involved (after step 1 verdict is written).
- **MUST NOT** rest conclusions on author intent, branch names, or chat memory unless **repository evidence** agrees.
- Prefer **fewer confirmed findings** over broad speculation; unproven items belong under **Residual uncertainty**, not as faux defects.

## Standards (summary)

- **Evidence**: Full read of governing docs + minimal code/diff context + spec-named verification commands when safe to run.
- **Execution**: Scope resolution → business compliance → required secondary reviews → ordered report.
- **Quality**: Business-first severity; secondary findings separated unless they also block an acceptance criterion.
- **Output**: Ordered list: business gaps → edge cases → security → code review → passing summary → residual uncertainty.

## Scope resolution

**Chain-of-thought:** Before **`Workflow`**, answer **`Pause →`** for the governing spec you will use; equally plausible paths without disambiguation ⇒ **stop**.

**User-named path** — Read `spec.md`, `tasks.md`, `checklist.md`, `contract.md`, `design.md`, and batch `coordination.md` when present unless the user narrowed the list. Treat as authoritative unless the user pointed at a **newer** superseding plan. Map implementation via tasks, owned paths, diff, branch, commits.
   - **Pause →** Did the user give a **filesystem path** or only a nickname that could map to multiple `docs/plans/...` trees?
   - **Pause →** For each major business verdict later, what **exact** spec heading or requirement ID will I cite?

**User did not name a spec** — Inspect `git status -sb`, `git diff --name-only`, `git diff --cached --name-only`; search `docs/plans/`, `docs/archive/plans/`, or repo-documented plan dirs. If no plan file moved, infer from recent commits and plausible plan dirs; **if still ambiguous, stop** (see Non-negotiables).
   - **Pause →** What **three** independent clues tie this implementation to **one** plan—not chat memory alone?
   - **Pause →** If I withheld the conversation transcript, could another reviewer replicate my chosen spec folder from repo evidence?

## Workflow

**Chain-of-thought:** Answer **`Pause →`** after **each** step before moving down the list or calling dependent skills.

1. **Spec baseline** — Read governing docs end-to-end. Extract goals, acceptance criteria, non-goals, deferrals, required verifications. Build a compact claim list provable from repo evidence. Keep “what the product must do” separate from “how clean the code is.”
   - **Pause →** Which items are **mandatory** acceptance vs explicitly **out of scope** or deferred?
   - **Pause →** What observable failure would make me change a `Met` to `Not met` for the top risk requirement?

2. **Implementation evidence** — Read the relevant diff/staged/commits/files. Trace the minimum code path to validate claims. Run spec-named checks when available and safe.
   - **Pause →** What is the **smallest** code path I have not yet read that could still falsify a `Met`?
   - **Pause →** Am I about to score `Met` from **intent** or from **tests/commands** I actually ran or inspected?

3. **Business-goal verdict first** — Emit every `Not met` / `Partially met` **before** secondary findings, with **exact** spec cites and code/test evidence. While required goals stay failed, **MUST NOT** frame archival, release, or “done” narratives that imply compliance.
   - **Pause →** If I sorted findings by “interesting” instead of business impact, which line would unfairly rise above a missing goal?
   - **Pause →** For each `Partially met`, what single **missing proof** (test, wire-up, error path) am I naming explicitly?

4. **Secondary reviews (code-affecting)** — On the same scope: `review-change-set` (architecture/simplification), `discover-edge-cases` (reproducible edge/observability risks), `discover-security-issues` (reproducible security). Keep outputs labeled so they do not read as business-goal substitutions.
   - **Pause →** Does this secondary finding **force** a business re-score—if yes, did I revise step 3 before publishing?
   - **Pause →** Is the diff scope identical to what I used for business mapping (no silent file creep)?

5. **Final report (fixed order)** — (1) Business-goal failures (always top severity for required gaps). (2) Edge-case. (3) Security. (4) Code-review / maintainability. (5) Passing evidence for goals confirmed `Met`. (6) Residual uncertainty (skipped commands, unmapped spec text, unverifiable externals). If nothing actionable: state that explicitly **and** still cite docs and evidence reviewed.
   - **Pause →** What commands or spec paragraphs remain **unverified**—are they all listed under residual uncertainty?

## Sample hints

- **Business claim record**:
  - `R3.2 refresh token rotation` → `Not met` — spec `spec.md` §3.2 requires one-time use; `src/auth/refresh.rs:40` still accepts same jti on replay; test `refresh_replay` not present.
- **Wrong ordering** — starting with “nice simplification in `foo.ts`” while `R1.0` is unmet: **wrong**; lead with the `R1.0` gap.
- **Tasks checked but behavior missing** — `tasks.md` shows `[x] implement rate limit` but no call site in `src/api/*` and no test: verdict stays **`Not met` / `Partially met`**, not `Met`.
- **Ambiguous scope** — two directories `docs/plans/2026-05-01/foo/` and `…/batch-a/foo/` both plausible; **stop** with “need user to name path” instead of picking one.
