# Naming And Function Simplification

## Naming improvements

Rename only when the current name creates real ambiguity.

Good rename reasons:

- hides domain role, unit, quantity, ownership, or lifecycle stage,
- uses stale terminology after a refactor,
- collides with another concept in the same scope,
- makes boolean, enum, or state-transition meaning unclear,
- forces readers to inspect implementation before understanding intent.

Avoid renaming when:

- the name is already clear in local context,
- the change is pure personal preference,
- the name is part of a stable external API, database schema, event contract, or migration-sensitive field,
- the rename would create broad churn without reducing ambiguity.

## Naming patterns

- Prefer domain nouns over implementation nouns: `selectedAccount` over `item`.
- Include units for quantities: `timeoutMs`, `amountCents`, `windowDays`.
- Use booleans that read as predicates: `isEligible`, `hasPendingRetry`, `shouldPersist`.
- Name collections by contents: `pendingInvoices`, not `list`.
- Name state transitions by lifecycle: `markSettlementComplete`, not `updateStatus`.
- Keep test data names meaningful: `expiredSubscription`, `duplicateEvent`, `unauthorizedActor`.

## Function simplification signals

Simplify functions that contain:

- repeated guard clauses or duplicated validation,
- mixed parsing, validation, orchestration, persistence, and formatting,
- nested branches that hide the main path,
- temporary variables whose names encode implementation steps rather than domain state,
- hard-coded workflow steps repeated in multiple callers,
- comments explaining what code structure should make obvious.

## Safe simplification moves

- Extract pure transformations and validations into small helpers.
- Replace repeated literal mappings with a named table or function.
- Flatten nested conditionals with explicit guard clauses when it clarifies failure paths.
- Centralize one business rule behind one function when multiple callers duplicate it.
- Split orchestration from local computation when tests need a deterministic unit.
- Delete dead compatibility paths only when reachability evidence and tests support deletion.

## Extraction rules

Create a reusable helper only when at least one condition is true:

- two or more call sites duplicate the same rule,
- the extracted logic has a clear domain name and stable contract,
- the helper makes a high-value invariant testable,
- the helper isolates an external dependency contract or side-effect boundary,
- the current function has multiple reasons to change.

Keep extracted helpers close to the owner module unless the repository already has a shared utility location for that domain.

## Behavior preservation checklist

Before and after simplification, verify:

- inputs, outputs, exceptions, side effects, and ordering are unchanged,
- persisted data and emitted events keep the same contract,
- public API and CLI behavior remain stable,
- log fields remain compatible unless stale names were intentionally corrected,
- existing tests still pass and new tests cover extracted rules.

If these checks can be enforced by existing or newly added tests, do not treat subjective confidence alone as a reason to avoid the simplification.
