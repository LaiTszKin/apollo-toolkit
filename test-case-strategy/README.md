# test-case-strategy

Shared testing strategy skill for choosing risk-driven test cases across spec generation, new-feature implementation, and brownfield feature changes.

## Core capabilities

- Selects the smallest useful test level for each risk: unit, regression, property-based, integration, E2E, adversarial, or mock/fake scenario coverage.
- Defines meaningful oracles before implementation so tests verify requirements instead of echoing newly written code.
- Adds focused unit drift checks for atomic implementation tasks.
- Records concrete test IDs, target units or flows, fixture strategy, verification hooks, and `N/A` reasons.
- Provides reusable references for unit, property-based, integration, and E2E test decisions.

## Repository structure

- `SKILL.md`: Shared test selection workflow and output contract.
- `agents/openai.yaml`: Agent interface metadata and default prompt.
- `references/`: Focused guides for unit drift checks, property-based tests, integration tests, and E2E tests.

## Typical usage

```text
Use $test-case-strategy to choose the right tests for this change and define the unit drift checks before implementation.
```

## License

MIT. See `LICENSE`.
