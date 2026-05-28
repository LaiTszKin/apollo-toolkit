# enhance-existing-features

A brownfield feature-extension skill: map dependencies first, decide whether shared specs are required, then use `test-case-strategy` to implement the change with risk-driven hardening tests and unit drift checks.

## Core capabilities

- Explores dependencies and data flow before deciding how to change the system.
- Uses `spec` whenever the change is high-complexity, touches a critical module, or crosses module boundaries.
- Requires explicit approval before coding when specs are generated.
- Still requires meaningful tests even when specs are skipped, selected through `test-case-strategy`.
- Keeps brownfield changes focused and traceable.
- When specs exist and are approved, finishes all in-scope planned tasks and applicable checklist items before yielding unless the user defers work or an external blocker prevents safe completion.

## Repository layout

```text
.
├── SKILL.md
├── README.md
├── LICENSE
└── agents/
    └── openai.yaml
```

## Workflow summary

1. Explore the existing codebase and affected logic chain first.
2. Trigger `spec` only when the change is high complexity, hits a critical module, or crosses module boundaries.
3. Wait for explicit approval if planning docs were generated.
4. Implement the smallest safe brownfield change.
5. Run risk-driven tests and backfill `spec.md`, `tasks.md`, `checklist.md`, `contract.md`, and `design.md` when specs exist.
6. If the work is split into parallel spec sets, maintain one batch-level `coordination.md` for shared preparation, ownership, and replacement direction.

## Test requirements

- Use `test-case-strategy` to choose the smallest useful test level for each risk.
- Define meaningful oracles before finalizing tests.
- Add focused unit drift checks for non-trivial atomic tasks when possible.
- Record concrete `N/A` reasons when a test level is not suitable.

## References

- Shared planning workflow: `spec`
- Test selection and unit drift-check guide: `test-case-strategy`
