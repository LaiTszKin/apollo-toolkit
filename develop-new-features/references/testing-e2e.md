# E2E Testing Principles

## Core rules
- E2E is not decided solely by explicit user request.
- The agent must decide E2E based on feature importance, complexity, and cross-layer risk.
- For high-risk key user paths, create the smallest necessary E2E coverage first.
- If E2E is unstable, too costly, or environment-limited, add integration coverage for equivalent risk and record the alternative.

## Purpose
- Verify critical end-to-end user paths are usable.
- Catch behavior gaps after cross-system/cross-layer integration.
- Provide confidence close to real usage for high-risk scenarios.

## Decision criteria
- Importance: core feature, critical revenue flow, or high-impact process.
- Complexity: multi-step state transitions, branching flows, cross-service collaboration.
- Risk: historical regressions, fragile integrations, major user-visible failures.
- Maintainability: stable environment and controllable test data.

## Not suitable when
- Feature risk is low and unit/integration tests already cover it sufficiently.
- E2E is unstable and disproportionately expensive while integration tests can cover key risk.

## Design guidance
- Cover only the most critical paths; avoid expanding into full UI test suites.
- Keep test data controllable (fixed seeds or recyclable fixtures).
- Prioritize stability; avoid brittle external dependencies, use controlled substitutes if needed.
- Keep cost decisions explicit: document why E2E is done or not done and what alternative strategy is used.

## Spec/checklist authoring hints
- Mark high-risk key paths in `spec.md` requirement descriptions.
- Record E2E decisions, mapped test cases, and results in `checklist.md`.
- If skipping E2E, specify replacement integration test cases (`IT-xx`) and rationale in `checklist.md`.
