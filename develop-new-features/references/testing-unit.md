# Unit Testing Principles

## Purpose
- Verify correctness of the smallest testable unit (function, method, or pure logic module).
- Provide fast feedback with low-cost failure localization.

## When to use
- Core business logic and critical branches.
- Boundary conditions (upper/lower limits, null/empty, extreme values).
- Error handling and exception paths (invalid input, incompatible state, etc.).

## Not suitable when
- Behavior requires cross-module or external dependency verification (use integration tests).
- Full user-flow validation is required (evaluate E2E first; if not suitable, use integration tests to cover risk).

## Design guidance
- Isolate external dependencies with mock/stub/fake; avoid DB/RPC/file IO.
- Keep tests small and focused: one test, one behavior/failure mode.
- Cover both success and failure branches.
- Keep tests reproducible: avoid nondeterministic time/random/global state.
- Map tests to requirements: each core requirement should have at least one unit test.

## Spec/checklist authoring hints
- Scenario: describe input and initial state mapped to one requirement/boundary.
- Expected result: verifiable output, state change, or error.
- Purpose: explain which risk or bug type this test prevents.

## Common examples (description level)
- Return a specific error when input is out of allowed range.
- Handle empty list/empty string input with expected behavior.
- Ensure output matches definition after state/flag switching.
