# Systematic Debug Skill

## Brief Introduction

An agent skill for Codex/Claude workflows that applies a test-first debugging process: understand the issue, inspect code paths, reproduce all plausible causes with tests, and fix until all related tests pass.

This skill is designed to avoid speculative fixes and ensure each bug hypothesis is validated through reproducible test evidence.

## Problems this skill solves

Use this skill when:

- An issue is reported but root cause is not obvious
- Multiple code paths may explain the same failure
- You need evidence-backed fixes with reproducible tests
- You want to reduce regressions from guess-based changes

## Invocation rule

This skill should be invoked by default for any program-problem request, such as:

- bug reports, regressions, or "feature not working"
- runtime errors, exceptions, crashes, or HTTP 4xx/5xx failures
- failing or flaky tests
- intermittent or hard-to-reproduce incorrect behavior

## Core method

This skill follows a fixed workflow:

1. **Understand and inspect**: interpret the user report, inspect relevant code, and list all plausible causes.
2. **Reproduce with tests**: create or extend tests to reproduce each plausible cause.
3. **Fix and validate**: apply focused fixes and iterate until all reproduction tests pass.

## Design principles

- **Evidence first**: every cause should be validated by tests.
- **Comprehensive hypotheses**: do not stop at the first guess.
- **Minimal change**: keep fixes targeted to confirmed failures.
- **Clear traceability**: map fixes to specific failing-then-passing tests.

## Typical deliverables

For each debugging task, provide:

- Plausible root-cause list and related code paths
- Reproduction tests for each plausible cause
- Fix summary tied to test outcomes
- Final confirmation that all related tests pass

## Example: one full debugging cycle

### User issue

> "Checkout occasionally fails with a 500 error when applying coupons."

### Agent execution (condensed)

1. Identify plausible causes in coupon validation, pricing calculation, and external discount service handling.
2. Add tests to reproduce each cause under matching edge conditions.
3. Implement fixes for failing cases and rerun tests.
4. Confirm all previously failing reproduction tests now pass.

### Expected output

- Root-cause hypothesis list with code references
- Reproduction tests and initial failing results
- Fix summary and passing test results
- Final validation statement

## Repository layout

- `SKILL.md`: skill definition and workflow rules

## License

This project is licensed under [MIT License](LICENSE).
