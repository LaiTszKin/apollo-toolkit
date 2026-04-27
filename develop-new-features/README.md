# develop-new-features

A spec-first feature development skill for new behavior and greenfield work. It delegates shared planning-doc generation to `generate-spec`, uses `test-case-strategy` for risk-driven test selection, then implements the approved feature with focused validation.

## Key capabilities

- Requires `generate-spec` before any implementation starts.
- Treats `spec.md`, `tasks.md`, `checklist.md`, `contract.md`, and `design.md` as approval-gated artifacts, not optional notes.
- Covers unit, regression, property-based, integration, E2E, adversarial, mock/fake, rollback, and unit drift-check testing based on actual risk through `test-case-strategy`.
- Reuses existing architecture and avoids speculative expansion.
- Backfills `spec.md`, `tasks.md`, `checklist.md`, `contract.md`, and `design.md` after implementation and testing complete.
- Once approval is granted and implementation starts, finishes all in-scope planned tasks and applicable checklist items before yielding unless the user defers work or an external blocker prevents safe completion.

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

1. Review only the official docs and code paths needed for the feature.
2. Run `generate-spec` to create and maintain `docs/plans/{YYYY-MM-DD}/{change_name}/`, or `docs/plans/{YYYY-MM-DD}/{batch_name}/{change_name}/` plus `coordination.md` for parallel batches.
3. Wait for explicit approval on the spec set.
4. Implement the approved behavior with minimal changes.
5. Run risk-driven tests and backfill `spec.md`, `tasks.md`, `checklist.md`, `contract.md`, and `design.md`.
6. For parallel batches, keep shared preparation and replacement direction in `coordination.md`.

## Testing expectations

- Use `test-case-strategy` to choose the smallest useful test level for each risk.
- Define meaningful oracles before implementation.
- Add focused unit drift checks for non-trivial atomic tasks when possible.
- Record concrete `N/A` reasons when a test level is not suitable.

## References

- Shared planning workflow: `generate-spec`
- Test selection and unit drift-check guide: `test-case-strategy`
