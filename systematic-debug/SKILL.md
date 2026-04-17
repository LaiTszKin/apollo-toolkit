---
name: systematic-debug
description: "Systematic debugging workflow for program issues: understand observed vs expected behavior, inspect codebase paths, reproduce all plausible causes with tests, diagnose the real root cause, and complete a validated fix. Auto-invoke whenever behavior does not match expectations (even if the user did not explicitly request debugging), including bugs, errors, crashes, regressions, flaky behavior, and failing tests."
---

# Systematic Debug

## Dependencies

- Required: none.
- Conditional: none.
- Optional: none.
- Fallback: not applicable.

## Standards

- Evidence: Gather expected versus observed behavior from code and runtime facts before deciding on a cause, and when the issue involves a runtime pipeline or bounded run, anchor the investigation to one canonical artifact root or run directory instead of mixed terminal snippets from multiple runs.
- Execution: Inspect the relevant paths, reproduce every plausible cause with tests or bounded reruns, choose a reproduction mode whose fidelity matches the user's claim, map each observed failure to a concrete pipeline stage, distinguish toolchain/platform faults from application-logic faults, classify failing tests as stale test contract vs test-harness interference vs real product bug, then apply the minimal fix at the true owner.
- Quality: Keep scope focused on the bug, prefer existing test patterns, explicitly rule out hypotheses that could not be reproduced, and when failures disappear in isolated reruns treat shared-state or parallel-test interference as a first-class hypothesis instead of silently dismissing the original failure.
- Output: Deliver the plausible-cause list, the canonical evidence source, reproduction tests or reruns, the final failure classification for each investigated symptom, validated fix summary, and passing-test confirmation.

## Core Principles

- Gather facts from user reports and code behavior before changing implementation.
- Cover all plausible causes with reproducible tests instead of guessing a single cause.
- Keep fixes minimal, focused, and validated by passing tests.
- When logs or runtime artifacts exist, treat one run as canonical and compare every conclusion against that same run's generated artifacts, not against ad hoc console recollection.
- When a repository has both scenario or harness runs and a production-like runtime, do not treat the lower-fidelity mode as proof about the higher-fidelity mode unless you explicitly state that limitation and the user agrees.
- When the failing flow crosses multiple layers, identify the last confirmed successful stage before assigning blame.
- When tests fail, separate stale assertions and fixture drift from real implementation regressions before changing product code.
- If failures only appear under parallel execution or shared shell-out paths, investigate test isolation, shared locks, temp directories, run-name collisions, and environment leakage before blaming the product.

## Trigger Conditions

Use this skill by default whenever the request indicates a program problem, including:

- bug, defect, regression, broken behavior
- error, exception, crash, 4xx/5xx failure
- failing/flaky tests, intermittent failures, unstable behavior
- "why is this not working" style troubleshooting requests
- explicit or implicit observed-vs-expected mismatch ("it should do X but does Y")

Also auto-invoke this skill when mismatch evidence appears during normal execution (logs, test output, runtime output), even if the original request was not phrased as a debugging task.

## Required Workflow

1. **Understand and inspect**: Parse expected vs observed behavior, explore relevant code paths, record the canonical failing run or artifact root when runtime output is involved, and build a list of plausible root causes.
2. **Map the failure boundary**: Break the flow into concrete stages such as setup, startup, readiness, steady-state execution, persistence, and shutdown, then identify the last stage that is confirmed to have succeeded.
3. **Reproduce with tests or bounded reruns**: Write or extend tests that reproduce every plausible cause, and when the bug depends on runtime orchestration rerun the same bounded command or the same runtime mode instead of switching contexts mid-investigation. If the user is asking about real runtime or market behavior, prefer the production-like bounded run over a synthetic scenario replay unless safety or tooling constraints make that impossible. When a failing test passes in isolation, rerun it under the original suite shape to determine whether the real cause is stale expectations, fixture drift, or shared-state interference.
4. **Diagnose and confirm**: Use reproduction evidence to confirm the true root cause, explicitly rule out non-causes, and classify whether each investigated failure belongs to the toolchain/platform layer, test contract drift, test-harness interference, orchestration, or application logic.
5. **Fix and validate**: Implement focused fixes and iterate until all reproduction tests or bounded reruns pass.

## Implementation Guidelines

- Read related modules end-to-end before editing.
- Prefer existing test patterns and fixtures over creating new frameworks.
- Keep the scope to bug reproduction and resolution; avoid unrelated refactors.
- If a hypothesized cause cannot be reproduced, document why and deprioritize it explicitly.
- For long-running or generated-artifact workflows, record the exact command, timestamps, and artifact paths before inspecting outputs so later comparisons stay on the same evidence set.
- Do not mix baseline data and rerun data casually; compare the same scenario or command across runs and call out when a conclusion comes from a rerun rather than the original failure.
- When test fixtures or assertions no longer match the implemented contract, update the tests instead of weakening the product behavior to satisfy stale expectations.
- When tests shell out to shared local infrastructure, add deterministic isolation such as mutexes, unique temp roots, or serialized sections before accepting flakes as inevitable.

## Deliverables

- Plausible root-cause list tied to concrete code paths
- Canonical failing run or artifact root when runtime evidence exists
- Reproduction tests or bounded reruns for each plausible cause
- Failure classification for each symptom: stale contract, harness interference, or real bug
- Fix summary mapped to failing-then-passing tests
- Final confirmation that all related tests pass
