---
name: systematic-debug
description: Systematic debugging workflow for program issues: understand observed vs expected behavior, inspect codebase paths, reproduce all plausible causes with tests, diagnose the real root cause, and complete a validated fix. Auto-invoke whenever behavior does not match expectations (even if the user did not explicitly request debugging), including bugs, errors, crashes, regressions, flaky behavior, and failing tests.
---

# Systematic Debug

## Core Principles

- Gather facts from user reports and code behavior before changing implementation.
- Cover all plausible causes with reproducible tests instead of guessing a single cause.
- Keep fixes minimal, focused, and validated by passing tests.

## Trigger Conditions

Use this skill by default whenever the request indicates a program problem, including:

- bug, defect, regression, broken behavior
- error, exception, crash, 4xx/5xx failure
- failing/flaky tests, intermittent failures, unstable behavior
- "why is this not working" style troubleshooting requests
- explicit or implicit observed-vs-expected mismatch ("it should do X but does Y")

Also auto-invoke this skill when mismatch evidence appears during normal execution (logs, test output, runtime output), even if the original request was not phrased as a debugging task.

## Required Workflow

1. **Understand and inspect**: Parse expected vs observed behavior, explore relevant code paths, and build a list of plausible root causes.
2. **Reproduce with tests**: Write or extend tests that reproduce every plausible cause.
3. **Diagnose and confirm**: Use reproduction evidence to confirm the true root cause and explicitly rule out non-causes.
4. **Fix and validate**: Implement focused fixes and iterate until all reproduction tests pass.

## Implementation Guidelines

- Read related modules end-to-end before editing.
- Prefer existing test patterns and fixtures over creating new frameworks.
- Keep the scope to bug reproduction and resolution; avoid unrelated refactors.
- If a hypothesized cause cannot be reproduced, document why and deprioritize it explicitly.

## Deliverables

- Plausible root-cause list tied to concrete code paths
- Reproduction tests for each plausible cause
- Fix summary mapped to failing-then-passing tests
- Final confirmation that all related tests pass
