# Unit Testing Guide

## Purpose
- Verify correctness of a single function/module and localize failures quickly.
- Cover both success and failure paths for the smallest changed behavior unit.

## Required when
- Any non-trivial logic change should add or update unit tests.
- Unit test evaluation is required even when specs are not used.

## Coverage focus
- Core logic branches and boundary values.
- Error handling, validation failures, and incompatible states.
- Function paths with highest regression risk.

## Design guidance
- Isolate external dependencies (mock/stub/fake).
- Keep tests small and focused: one behavior per test.
- Do not stop at happy-path assertions; verify exact errors, rejected states, and intentional lack of side effects when the unit should block an action.
- Where the input space is small and discrete, exhaustively enumerate business inputs and expected outputs.
- Prefer table-driven cases when many small business permutations share the same oracle.
- Add regression tests for bug-prone or high-risk logic so previously broken behavior cannot silently return.
- If the unit owns authorization, invalid transition, idempotency, or concurrency decisions, test those denials explicitly.
- Keep tests reproducible and fast.
- Avoid assertion-light smoke tests and snapshot-only coverage unless the snapshot has a strict business oracle behind it.

## Recording rules
- If specs are used, record mapped test cases and results in `checklist.md`.
- If specs are not used, list test IDs and results in the response.
