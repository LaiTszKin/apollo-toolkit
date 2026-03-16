# enhance-existing-features

A brownfield feature-extension skill: map dependencies first, decide whether shared specs are required, then implement the approved change with risk-driven hardening tests.

## Core capabilities

- Explores dependencies and data flow before deciding how to change the system.
- Uses `generate-spec` whenever the change is high-complexity, touches a critical module, or crosses module boundaries.
- Requires explicit approval before coding when specs are generated.
- Still requires meaningful tests even when specs are skipped.
- Keeps brownfield changes focused and traceable.

## Repository layout

```text
.
├── SKILL.md
├── README.md
├── LICENSE
├── agents/
│   └── openai.yaml
└── references/
    ├── unit-tests.md
    ├── property-based-tests.md
    ├── integration-tests.md
    └── e2e-tests.md
```

## Workflow summary

1. Explore the existing codebase and affected logic chain first.
2. Trigger `generate-spec` only when the change is high complexity, hits a critical module, or crosses module boundaries.
3. Wait for explicit approval if planning docs were generated.
4. Implement the smallest safe brownfield change.
5. Run risk-driven tests and backfill planning docs when they exist.

## Test requirements

- Unit: changed logic, boundaries, failure paths.
- Regression: bug-prone or high-risk behavior that must not silently return.
- Property-based: mandatory for business logic unless concrete `N/A` is recorded.
- Integration: user-critical logic chain across layers/modules.
- E2E: affected key user-visible path when the risk justifies it.
- Adversarial: abuse paths, malformed inputs, privilege issues, replay, concurrency, and edge combinations when relevant.

If E2E is not feasible, replace it with stronger integration coverage and record the reason.

## References

- Shared planning workflow: `generate-spec`
- Unit testing guide: `references/unit-tests.md`
- Property-based testing guide: `references/property-based-tests.md`
- Integration testing guide: `references/integration-tests.md`
- E2E testing guide: `references/e2e-tests.md`
