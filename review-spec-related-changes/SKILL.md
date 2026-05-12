---
name: review-spec-related-changes
description: >-
  Read-only spec compliance vs governing docs/plans: score every business requirement Met/Partial/Not-met from code/tests/commands—checked `tasks.md` boxes never count; ambiguity between two plan roots halts execution; on code-bearing diffs run **`review-change-set`**, **`discover-edge-cases`**, **`discover-security-issues`** on the same scope afterward — **prefer one read-only subagent per secondary skill in parallel** so the main agent aggregates without re-reading. Independent requirement clusters may also be scored by parallel read-only subagents.
  Use for “does this PR satisfy coordination.md + spec.md R2?” or a user-pinned `{change}` folder.
  Do not mutate repos, bury missing goals, skip the tertiary bundle on code-bearing diffs, or rest on intent without evidence; FORBIDDEN to lead with refactor comments while R1 is failing. GOOD: pair every Not-met cite with a `spec.md` ref + concrete path:test gap.
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
- **SHOULD** parallelize the secondary reviews when code is involved by dispatching **one read-only subagent per secondary skill** (one for `review-change-set`, one for `discover-edge-cases`, one for `discover-security-issues`). Each subagent receives the same diff scope, follows that skill’s own SKILL.md, and returns ONLY its structured findings; the main agent aggregates them in the fixed report order without re-running the underlying analysis. Single-file or trivial diffs may be reviewed inline without subagents.
- For business-goal scoring itself, **MAY** parallelize by dispatching one read-only subagent per **independent requirement cluster** (requirements that share no owned paths and no shared spec section), each returning Met/Partial/Not-met with cited evidence. The main agent owns final ordering, severity, and any cross-requirement reconciliation. Tightly coupled requirements stay on the main agent.
- **MUST NOT** rest conclusions on author intent, branch names, or chat memory unless **repository evidence** agrees.
- **MUST NOT** let subagents mutate repositories, archive specs, or commit — every dispatched subagent runs in **read-only** mode.
- Prefer **fewer confirmed findings** over broad speculation; unproven items belong under **Residual uncertainty**, not as faux defects.

## Standards (summary)

- **Evidence**: Full read of governing docs + minimal code/diff context + spec-named verification commands when safe to run.
- **Execution**: Scope resolution → business compliance (optionally fanned out by independent requirement cluster) → parallel secondary reviews via per-skill read-only subagents → aggregated ordered report.
- **Quality**: Business-first severity; secondary findings separated unless they also block an acceptance criterion; subagent reports stay strictly within their assigned skill’s scope.
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

2. **Implementation evidence** — Read the relevant diff/staged/commits/files. Trace the minimum code path to validate claims. Run spec-named checks when available and safe. When the spec contains **independent requirement clusters** (disjoint owned paths, disjoint spec sections), **MAY** dispatch one read-only subagent per cluster to score Met/Partial/Not-met with cited evidence; the main agent reconciles cross-requirement effects and owns the final verdict ordering. Tightly coupled requirements stay on the main agent.
   - **Pause →** What is the **smallest** code path I have not yet read that could still falsify a `Met`?
   - **Pause →** Am I about to score `Met` from **intent** or from **tests/commands** I actually ran or inspected?
   - **Pause →** If I clustered, is every cluster genuinely disjoint, or am I about to lose a cross-requirement contradiction by running them in isolation?

3. **Business-goal verdict first** — Emit every `Not met` / `Partially met` **before** secondary findings, with **exact** spec cites and code/test evidence. While required goals stay failed, **MUST NOT** frame archival, release, or “done” narratives that imply compliance.
   - **Pause →** If I sorted findings by “interesting” instead of business impact, which line would unfairly rise above a missing goal?
   - **Pause →** For each `Partially met`, what single **missing proof** (test, wire-up, error path) am I naming explicitly?

4. **Secondary reviews (code-affecting)** — On the same scope: `review-change-set` (architecture/simplification), `discover-edge-cases` (reproducible edge/observability risks), `discover-security-issues` (reproducible security). **Prefer dispatching one read-only subagent per skill in parallel** so each runs in its own context with the full SKILL.md it owns; hand each subagent the same diff scope and the structured-report contract from that skill. The main agent waits for every subagent to return, then keeps outputs labeled so they do not read as business-goal substitutions. Trivial single-file diffs may run inline without subagents. The main agent **MUST NOT** re-run a secondary skill it already delegated, and subagents **MUST NOT** mutate the repository.
   - **Pause →** Does this secondary finding **force** a business re-score—if yes, did I revise step 3 before publishing?
   - **Pause →** Is the diff scope identical to what I used for business mapping (no silent file creep)?
   - **Pause →** Did every dispatched secondary subagent return — or am I about to publish from partial summaries?

5. **Final report (fixed order)** — (1) Business-goal failures (always top severity for required gaps). (2) Edge-case. (3) Security. (4) Code-review / maintainability. (5) Passing evidence for goals confirmed `Met`. (6) Residual uncertainty (skipped commands, unmapped spec text, unverifiable externals). If nothing actionable: state that explicitly **and** still cite docs and evidence reviewed.
   - **Pause →** What commands or spec paragraphs remain **unverified**—are they all listed under residual uncertainty?

## Sample hints

- **Business claim record**:
  - `R3.2 refresh token rotation` → `Not met` — spec `spec.md` §3.2 requires one-time use; `src/auth/refresh.rs:40` still accepts same jti on replay; test `refresh_replay` not present.
- **Wrong ordering** — starting with “nice simplification in `foo.ts`” while `R1.0` is unmet: **wrong**; lead with the `R1.0` gap.
- **Tasks checked but behavior missing** — `tasks.md` shows `[x] implement rate limit` but no call site in `src/api/*` and no test: verdict stays **`Not met` / `Partially met`**, not `Met`.
- **Ambiguous scope** — two directories `docs/plans/2026-05-01/foo/` and `…/batch-a/foo/` both plausible; **stop** with “need user to name path” instead of picking one.
