# Iteration Gates And Stopping Criteria

## Pass discipline

Each iteration must have:

- a selected module or bounded module cluster,
- a concrete quality target,
- an explicit record of which job lenses were checked during the deep read,
- a bounded file/symbol scope,
- one or more selected execution directions,
- expected behavior-neutral outcome,
- validation plan,
- rollback point if evidence contradicts the change.

An iteration is not "one work type", and it also does not need to include every direction every time. Within the selected scope, choose the subset of directions that has the best current confidence and leverage: naming, simplification, module boundaries, logging, and/or tests.

Avoid starting a broad second iteration before validating the first, but do not stop after a validated iteration if known actionable quality issues remain anywhere in the in-scope codebase.

Do not stop after a validated iteration if any in-scope module remains unvisited in the module coverage ledger.

## Validation cadence

Run validation from narrow to broad:

1. Formatter or type check for touched files when available.
2. Unit tests for touched helpers and modules.
3. Integration tests for affected chains.
4. Broader suite or build once multiple passes interact.

If validation fails:

- determine whether the failure is pre-existing, stale test expectation, test isolation issue, or real product bug,
- fix the true owner,
- keep regression coverage for real defects,
- do not mask failures by weakening assertions.

If validation passes and the guardrails meaningfully cover the changed behavior, do not keep a known quality issue in place purely because of subjective confidence concerns.

The final stopping condition also requires the relevant guarded test surface to be green; a partially red repository is not a completed refactor outcome.

## Re-scan after each iteration

Inspect the full known quality backlog for:

- modules that are still unvisited or only shallowly read,
- modules that were read but not yet checked against every available job lens,
- new naming drift from moved or extracted concepts,
- duplicated logic that remains after extraction,
- module boundaries that are still mixed,
- logs that now use stale names,
- tests that cover only the happy path,
- documentation or `AGENTS.md` drift.

Then choose the next execution directions with these priorities:

1. highest confidence under current guardrails,
2. strongest leverage for later deeper cleanup,
3. lowest business-risk path toward broader system improvement.

Use `references/job-selection.md` to convert those priorities into a concrete next-job choice.

## Stage-gate after each iteration

After every validated iteration, run a deliberate full-codebase decision pass:

1. Re-scan the repository and refresh the known quality backlog.
2. Refresh the module coverage ledger and identify unvisited in-scope modules.
3. Ask whether any known in-scope actionable issue still remains.
4. If yes, decide whether it should be addressed in the very next iteration or whether first-step unlock work is needed.
5. If the obstacle is a large, coupled, or central file, do not stop there; switch to staged unlock work and continue.
6. Only declare the repository iteration-complete when the re-scan shows no remaining actionable in-scope issue and no unvisited in-scope module except items that are explicitly deferred or excluded under the allowed stop categories.

This stage-gate is mandatory. A validated local change does not by itself mean the repository is done.

## Continue when

Repeat the cycle when:

- any known in-scope actionable quality issue remains unresolved,
- any in-scope module remains unvisited,
- high-impact unclear names remain,
- duplicated or hard-coded workflows still have safe extraction paths,
- a module still mixes distinct responsibilities and can be split locally,
- logs are still misleading or missing at critical decisions,
- high-value business logic remains untested and is testable.

Do not produce a final completion report while any item in this section is true. Continue with the next bounded iteration instead.

Prefer gradual outside-in progress: boundary cleanup, naming clarity, and guardrail strengthening should often come before deeper internal rewrites because they make the deeper work safer later.

## Stop when

Stop only when there are no unresolved known in-scope actionable issues. Any remaining candidates must be explicitly classified as one of:

- low-value style preference,
- speculative without concrete evidence,
- public contract migrations,
- macro-architecture changes,
- product behavior changes needing user approval,
- blocked by unavailable credentials, unstable external systems, or missing documentation,
- untestable with the current repository tooling and too risky to change safely.

If a remaining candidate cannot be placed in one of these categories, it is still an actionable gap and the agent must continue iterating rather than complete the task.

If an in-scope module has not received a deep-read iteration, it is still an actionable coverage gap even when the already-read modules look clean.

## Completion evidence

The final report should make the stopping point auditable:

- passes completed,
- execution directions selected per iteration,
- module or module cluster covered per iteration,
- job lenses checked per iteration,
- final module coverage ledger,
- stage-gate verdict after each full-codebase re-scan,
- validation commands and outcomes,
- confirmation that the guarded test surface is green after the refactor,
- tests added by risk category,
- behavior-preservation evidence,
- docs and constraints sync status,
- proof that the latest scan found no known actionable in-scope quality issues,
- deferred items with reason and required approval, dependency, or safety constraint.
