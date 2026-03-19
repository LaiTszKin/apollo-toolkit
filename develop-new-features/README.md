# develop-new-features

A spec-first feature development skill for new behavior and greenfield work. It delegates shared planning-doc generation to `generate-spec`, then implements the approved feature with risk-driven testing.

## Key capabilities

- Requires `generate-spec` before any implementation starts.
- Treats `spec.md`, `tasks.md`, and `checklist.md` as approval-gated artifacts, not optional notes.
- Covers unit, regression, property-based, integration, E2E, and adversarial testing based on actual risk.
- Reuses existing architecture and avoids speculative expansion.
- Backfills `spec.md`, `tasks.md`, and `checklist.md` after implementation and testing complete.

## Repository layout

```text
.
├── SKILL.md
├── README.md
├── LICENSE
├── agents/
│   └── openai.yaml
└── references/
    ├── testing-unit.md
    ├── testing-property-based.md
    ├── testing-integration.md
    └── testing-e2e.md
```

## Workflow summary

1. Review only the official docs and code paths needed for the feature.
2. Run `generate-spec` to create and maintain `docs/plans/{YYYY-MM-DD}_{change_name}/`.
3. Wait for explicit approval on the spec set.
4. Implement the approved behavior with minimal changes.
5. Run risk-driven tests and backfill `spec.md`, `tasks.md`, and `checklist.md`.

## Testing expectations

- Unit: changed logic, boundaries, failure paths.
- Regression: pin down bug-prone or high-risk behavior.
- Property-based: required for business logic unless concrete `N/A` is recorded.
- Integration: cover the user-critical logic chain.
- E2E: cover the most important success and denial/failure paths when justified.
- Adversarial: include abuse, malformed input, privilege, replay, concurrency, and edge-combination cases when relevant.

## References

- Shared planning workflow: `generate-spec`
- Unit testing guide: `references/testing-unit.md`
- Property-based testing guide: `references/testing-property-based.md`
- Integration testing guide: `references/testing-integration.md`
- E2E testing guide: `references/testing-e2e.md`
