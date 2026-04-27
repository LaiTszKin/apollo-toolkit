# Unit Tests And Drift Checks

## Purpose

- Verify the smallest changed behavior unit: function, method, policy, parser, mapper, validator, state transition owner, or pure logic module.
- Localize failures quickly while the agent is still implementing a single task.
- Detect implementation drift by comparing the changed unit against an oracle defined before the code change.

## Required when

- A task changes non-trivial local logic.
- A requirement has boundary, denial, validation, state transition, idempotency, authorization, error, or no-side-effect behavior.
- The input space is small and discrete enough to enumerate expected outputs.
- A bug-prone behavior needs a fixed regression example.
- The task can be verified without DB, RPC, filesystem, browser, queue, or multi-module orchestration.

## Not suitable when

- Correctness depends on real cross-module collaboration, persistence, IO, or configuration wiring.
- The main risk is the external integration contract itself.
- The behavior is only observable through a user-visible end-to-end path.

## Drift-check record

```text
Unit drift check:
  Target unit: [function/module/policy]
  Requirement: [R?.?]
  Fixture/input: [minimal state or table row]
  Oracle: [exact output/error/state/no-side-effect]
  Test case ID: [UT-xx or REG-xx]
  Run after task: [focused command or test filter]
  N/A reason: [only if no unit check can observe the task]
```

## Design rules

- Define the oracle from the spec, design, contract, official docs, or established intended behavior before implementation.
- Keep one test focused on one behavior or failure mode.
- Use table-driven tests for small business matrices.
- Cover both accepted and rejected states when the unit owns a decision.
- Assert exact errors, result classes, state changes, and intentional lack of side effects.
- Mock, stub, or fake external dependencies; unit tests should not need DB/RPC/file/browser IO.
- Control time, randomness, environment variables, and global state.
- Do not accept tests that only assert "does not throw", "returns truthy", or snapshot shape unless those are the real business oracle.

## Useful unit cases

- Boundary value is accepted at the limit and rejected outside it.
- Invalid input returns the specified error and performs no write.
- Unauthorized actor is denied with the expected reason.
- Repeating an idempotent call returns the same outcome without duplicate side effects.
- State transition from `A` to `B` is allowed, while `A` to `C` is rejected.
- Mapper/parser preserves required fields and rejects malformed variants.

## Recording

- In specs, map each `UT-xx` or `REG-xx` to requirement IDs and checklist items.
- In direct implementation, report test IDs, command, result, and any `N/A` reason.
