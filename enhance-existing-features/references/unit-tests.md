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
- Keep tests reproducible and fast.

## Recording rules
- If specs are used, record mapped test cases and results in `checklist.md`.
- If specs are not used, list test IDs and results in the response.
