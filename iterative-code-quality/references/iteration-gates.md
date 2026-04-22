# Iteration Gates And Stopping Criteria

## Pass discipline

Each pass must have:

- a concrete quality target,
- a bounded file/symbol scope,
- expected behavior-neutral outcome,
- validation plan,
- rollback point if evidence contradicts the change.

Avoid starting a broad second pass before validating the first, but do not stop after a validated pass if known actionable quality issues remain anywhere in the in-scope codebase.

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

## Re-scan after each pass

Inspect touched areas and the full known quality backlog for:

- new naming drift from moved or extracted concepts,
- duplicated logic that remains after extraction,
- module boundaries that are still mixed,
- logs that now use stale names,
- tests that cover only the happy path,
- documentation or `AGENTS.md` drift.

## Continue when

Repeat the cycle when:

- any known in-scope actionable quality issue remains unresolved,
- high-impact unclear names remain,
- duplicated or hard-coded workflows still have safe extraction paths,
- a module still mixes distinct responsibilities and can be split locally,
- logs are still misleading or missing at critical decisions,
- high-value business logic remains untested and is testable.

Do not produce a final completion report while any item in this section is true. Continue with the next bounded pass instead.

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

## Completion evidence

The final report should make the stopping point auditable:

- passes completed,
- validation commands and outcomes,
- tests added by risk category,
- behavior-preservation evidence,
- docs and constraints sync status,
- proof that the latest scan found no known actionable in-scope quality issues,
- deferred items with reason and required approval, dependency, or safety constraint.
