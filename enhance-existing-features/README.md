# enhance-existing-features

A feature-extension skill for brownfield systems: map dependencies first, verify docs second, implement third.

## Core capabilities

- Maps dependencies and data flow first to reduce change risk.
- Spec-trigger conditions: specs are required only for these scopes, with explicit user approval before coding:
  - High-complexity changes
  - Critical module changes
  - Cross-module changes
- Required spec artifacts: `spec.md`, `tasks.md`, `checklist.md`.
- Spec output path: `docs/plans/{YYYY-MM-DD}_{change_name}/`.
- If users answer clarification questions during spec phase, agent must mark clarification checkboxes, update specs, and get approval again before implementation.
- Even when specs are not required, related tests (or explicit `N/A` reasons) are still required:
  - Unit tests
  - Property-based tests
  - Integration tests for user-critical logic chains
  - End-to-end (E2E) tests

## Repository layout

```text
.
├── SKILL.md
├── agents/
│   └── openai.yaml
├── references/
│   ├── templates/
│   │   ├── spec.md
│   │   ├── tasks.md
│   │   └── checklist.md
│   ├── unit-tests.md
│   ├── property-based-tests.md
│   ├── integration-tests.md
│   └── e2e-tests.md
└── scripts/
    └── create-specs
```

## Usage

```text
Use $enhance-existing-features to extend this brownfield feature.
If scope is high complexity / critical module / cross-module, create specs first,
wait for explicit approval. If user clarifies requirements, update checklist/specs and get approval again before implementation.
Even without specs, still add tests for unit/property-based/integration of
user-critical logic chain/e2e (or record clear N/A reasons).
```

## Create specs (when required)

```bash
python3 scripts/create-specs "Feature Name" --change-name your-change-name
```

Default output:

```text
docs/plans/<today>_your-change-name/
├── spec.md
├── tasks.md
└── checklist.md
```

## Test requirements (evaluate for every change)

- Unit: changed logic, boundaries, failure paths
- Property-based: invariants and broad input combinations
- Integration: user-critical logic chain across layers/modules
- E2E: affected key user-visible path

If E2E is not feasible, replace with stronger integration tests and record the reason.
