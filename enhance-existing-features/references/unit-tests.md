# Unit Tests

## Purpose

Validate a single function/class/module in isolation with fast, deterministic feedback.

## Use When

- Business logic can be exercised without real external systems.
- Edge cases and boundary conditions need coverage.
- Error handling and validation rules are introduced or changed.
- Pure transformations or calculations are added/modified.

## Scenarios

- Input validation, normalization, and parsing rules.
- Branching logic with multiple outcomes.
- Exceptions, retries, and fallback behavior that do not require real IO.
- Regression tests for bug fixes in local logic.

## Guidance

- Mock or stub external IO (DB, network, filesystem, clock).
- Keep inputs small and focused; assert exact outputs or errors.
- Prefer table-driven tests for multiple cases.
- Keep tests fast and deterministic.
