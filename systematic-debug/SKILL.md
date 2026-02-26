---
name: systematic-debug
description: Systematic debugging workflow: infer the most likely root cause from the user report, add minimal targeted logs, provide reproduction steps for user validation, iterate fixes based on returned logs, and remove all temporary logs after resolution. Use when iterative debugging with user-provided logs is required.
---

# Systematic Debug

## Core Principles

- Establish facts before acting; avoid speculation.
- Add only the minimum logs needed for diagnosis, and keep them easy to remove.
- Iterate in a loop: add logs -> user reproduces -> fix from evidence, until resolved.

## Required Workflow

1. **Infer likely cause**: Read related code and existing signals from the user report to identify the most likely failure point.
2. **Add targeted logs**: Insert minimal logs on critical paths and suspicious branches with enough context to validate the hypothesis.
3. **Provide reproduction steps**: Give clear steps for the user to reproduce and return the resulting logs.
4. **Fix from log evidence and iterate**: Implement fixes based on observed logs, ask for user confirmation, and repeat from step 1 if unresolved.
5. **Remove temporary logs**: After confirmed resolution, remove all debugging logs added during the process.

## Implementation Guidelines

- Log fields should include decisive context (inputs, state, branches, external responses) without excessive noise.
- Keep code changes minimal and avoid unrelated refactors.
- In each iteration, record where logs were added and why, so cleanup is straightforward.

## Deliverables

- Added log locations and purpose for this iteration
- Reproduction steps sent to the user
- Fix summary based on returned logs
- Confirmation that temporary logs were removed
