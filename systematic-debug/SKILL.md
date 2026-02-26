---
name: systematic-debug
description: Systematic debugging workflow for program issues: understand the user report, inspect the codebase to infer all plausible root causes, write tests to reproduce each plausible cause, and fix the implementation until all reproduction tests pass. Must be used when users report bugs, errors, crashes, wrong behavior, flaky behavior, or failing tests.
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

## Required Workflow

1. **Understand and inspect**: Parse the user issue, explore the relevant code paths, and build a list of plausible root causes.
2. **Reproduce with tests**: Write or extend tests that reproduce every plausible cause.
3. **Fix and validate**: Implement fixes and iterate until all reproduction tests pass.

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
