# Integration Tests

## Purpose

- Verify collaboration across modules, layers, repositories, handlers, services, event flows, persistence, configuration, or controlled external-service scenarios.
- Cover risks unit tests cannot observe: sequence, wiring, persistence, IO, config, retry, fallback, and cross-boundary side effects.

## Required when

- The changed behavior depends on service/repository/API/event/module collaboration.
- The correctness question is about a user-critical business chain rather than one isolated unit.
- External dependency states affect business behavior and can be mocked or faked.
- E2E is not suitable but equivalent cross-layer risk still needs coverage.

## Not suitable when

- A pure unit owns the behavior and unit tests can fully observe the risk.
- A stable E2E test is required and feasible for a critical user-visible path.

## Design rules

- Keep dependencies inside the application boundary near-real when practical.
- Mock or fake external services unless the real service contract itself is under test.
- Build scenario matrices for success, timeout, retry exhaustion, partial data, stale data, duplicate callback, inconsistent response, and permission failure.
- Assert business outcomes across boundaries: persisted state, emitted event, deduplication, retry accounting, audit trail, compensation, or no partial write.
- Include adversarial paths when invalid transition, replay, double-submit, forged identifier, or out-of-order event risks exist.
- Keep data reconstructable and cleanup reliable.

## Recording

- Record `IT-xx`, modules involved, external dependency strategy, scenario matrix, oracle, requirement mapping, and command.
- If integration replaces E2E, map the replacement explicitly.
