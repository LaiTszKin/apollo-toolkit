# Job Selection Guide

## Purpose

Help the agent choose the next execution direction after each full-codebase re-scan.

These are job-selection rules for Step 2 of the main skill loop. They are not workflow steps.

The goal is not to force one permanent order. The goal is to choose the next job that most safely improves the selected module or module cluster and unlocks later work.

Before choosing, the agent should first scan the selected module through every available job lens. Job selection happens after that scan; it is not a substitute for that scan.

## Available jobs

- naming cleanup
- function simplification / extraction
- module-boundary cleanup
- logging alignment
- test addition
- staged unlock work

## Choose `naming cleanup` when

- confusing names are the main thing blocking understanding,
- flags, units, lifecycle states, or ownership terms are misleading,
- better naming would clearly reduce the risk of a later deeper refactor.

## Choose `function simplification / extraction` when

- duplicated logic exists across multiple call sites,
- one function mixes too many concerns,
- control flow is currently the main complexity bottleneck,
- extracting a helper would make the next test or split easier.

## Choose `module-boundary cleanup` when

- one file or module clearly has multiple reasons to change,
- local responsibilities are already visible enough to separate,
- a safe split would reduce repeated touching of unrelated concerns.

## Choose `logging alignment` when

- stale or missing diagnostics are the main blocker to safe validation,
- later refactors would be safer if branch decisions and outcomes were easier to observe,
- observability drift is currently hiding the real ownership model.

## Choose `test addition` when

- the target area is high-risk and weakly guarded,
- desired cleanup is blocked mainly by missing behavior locks,
- coupling spans multiple modules and needs characterization before change,
- regression risk is too high to justify deeper refactors without stronger coverage.

## Choose `staged unlock work` when

- the file feels too central or too coupled for direct cleanup,
- no safe full refactor exists yet, but a preparatory step does,
- you can reduce risk through naming, seam extraction, type extraction, side-effect isolation, or caller grouping,
- the best next move is to make a future refactor cheaper rather than solve the whole area now.

## Tie-breakers

If multiple jobs are plausible, prefer the one that:

1. increases safety for the next iteration,
2. reduces cognitive load fastest,
3. removes the strongest blocker to a deeper future refactor,
4. helps an unvisited module reach deep-read coverage,
5. preserves behavior with the clearest available guardrails.

## Hard rule

If a high-risk area lacks enough guardrails, `test addition` or another guardrail-building job should usually win before a deeper structural refactor.

If any in-scope module remains unvisited, choose jobs that help the next easiest useful unvisited module become deeply read, improved, or validated-clear before spending another round on already-familiar areas.
