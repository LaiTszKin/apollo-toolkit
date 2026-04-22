# Module Boundary And Single Responsibility Refactoring

## When to split a module

Split only when the module has multiple independent reasons to change, such as:

- domain rules mixed with IO, formatting, CLI parsing, or external service calls,
- unrelated workflows sharing one file because of history, not ownership,
- test setup forced to instantiate unrelated dependencies,
- large files where local changes frequently touch distant concepts,
- circular or awkward imports caused by unclear ownership,
- logging, validation, persistence, and presentation all living in one function or class.

## Before splitting

Define:

- the current module's actual responsibilities,
- the target responsibility of each new module,
- which module owns the canonical business rule,
- which interfaces must remain stable,
- which tests prove behavior did not change.

## Safe split patterns

- Move pure domain logic into a domain-owned helper module.
- Move external adapter code into an integration or infrastructure-adjacent module if the repository already uses that boundary.
- Move formatting/reporting away from computation.
- Move test helpers into existing test utility locations rather than production modules.
- Keep orchestration modules thin: validate inputs, call owners, handle outcomes.

## Interface design

Use narrow interfaces:

- pass only data the callee needs,
- return explicit result objects or existing domain types,
- avoid leaking framework/request/database objects into pure domain modules,
- preserve existing error taxonomy,
- keep naming aligned with current project vocabulary.

## Anti-patterns

Avoid:

- creating a generic `utils` dumping ground,
- moving code only to reduce file length,
- adding new layers that duplicate existing architecture,
- introducing dependency injection frameworks or service locators without explicit approval,
- splitting tightly coupled state machines before defining the state owner,
- changing public boundaries during a cleanup pass.

## Validation checklist

After a split:

- imports remain acyclic or no worse than before,
- public entrypoints still call the same behavior,
- tests cover moved logic and orchestration glue,
- logs still carry the same correlation identifiers,
- docs or `AGENTS.md` are updated only if the visible architecture or command surface changed.
