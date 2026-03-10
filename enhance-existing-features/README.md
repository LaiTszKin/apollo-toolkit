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
  - Regression tests for bug-prone or high-risk behavior
  - Property-based tests
  - Integration tests for user-critical logic chains
  - End-to-end (E2E) tests
- Testing must not stop at happy-path validation: include adversarial/authorization/idempotency/concurrency coverage where relevant.
- Tests must verify meaningful business oracles (state, side effects, denied actions), not only smoke-level success.

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
Even without specs, still add tests for unit/regression/property-based/integration of
user-critical logic chain/e2e plus adversarial hardening (or record clear N/A reasons).
```

## Create specs (when required)

```bash
SKILL_ROOT=/path/to/enhance-existing-features-skill
WORKSPACE_ROOT=/path/to/target-project
python3 "$SKILL_ROOT/scripts/create-specs" "Feature Name" \
  --change-name your-change-name \
  --template-dir "$SKILL_ROOT/references/templates" \
  --output-dir "$WORKSPACE_ROOT/docs/plans"
```

> `scripts/...` and `references/...` are skill-folder paths, not target-project paths.

Default output:

```text
docs/plans/<today>_your-change-name/
├── spec.md
├── tasks.md
└── checklist.md
```

## Test requirements (evaluate for every change)

- Unit: changed logic, boundaries, failure paths
- Regression: bug-prone or high-risk behaviors that must not silently return
- Property-based: mandatory for business-logic changes unless `N/A` with reason; use for invariants, generated business input spaces, and expected output validation
- Integration: user-critical logic chain across layers/modules
- E2E: affected key user-visible path; prefer one minimal critical success path plus one highest-value denial/failure path when the risk warrants it

- Adversarial/penetration-style cases: abuse paths, malformed inputs, forged identities/privileges, invalid transitions, replay/duplication, stale/out-of-order events, and risky edge combinations
- External services in the business logic chain should be mocked/faked for scenario testing unless the real contract is the target of verification
- Assertions should verify business outputs, persisted state, emitted side effects, or intentional lack of side effects

If E2E is not feasible, replace with stronger integration tests and record the reason.
