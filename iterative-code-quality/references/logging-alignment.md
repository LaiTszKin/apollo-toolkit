# Logging Alignment And Missing Observability

## Purpose

Keep logs and diagnostics synchronized with the real code path while preserving behavior.

## Stale log signals

Update logs when they:

- mention retired owners, lifecycle stages, resource names, or field names,
- describe a branch that no longer matches the condition,
- use generic text like `failed` without the operation or reason,
- report aggregate success without identifiers that let operators reconcile details,
- keep compatibility-era names after code has moved to a new canonical model,
- conflict with structured field names or metrics in the same path.

## Missing log criteria

Add logs only where they answer a concrete debugging question.

High-value locations:

- workflow start and final outcome for long-running jobs,
- branch selection or skipped work with reason code,
- validation rejection with safe context,
- external dependency outcome including status class, retry count, request id, and latency when available,
- persistence side effect or emitted command,
- rollback, compensation, idempotency, duplicate, or replay decisions.

Low-value locations:

- every line of a tight loop,
- logs that only restate the function name,
- dumping raw payloads,
- duplicating an exception already logged with equal context,
- noisy success logs in hot paths without operational value.

## Structured field rules

- Reuse the project's existing logger, field naming, metric naming, and trace conventions.
- Prefer stable identifiers, counts, reason codes, status classes, and lifecycle stages.
- Keep field names aligned with canonical owners, not stale compatibility projections.
- Do not log secrets, tokens, private keys, passwords, raw personal data, or full sensitive payloads.
- Avoid high-cardinality values unless they are necessary identifiers already used by the project.

## Behavior-neutral updates

Logging changes must not:

- alter retry, error, persistence, or branch behavior,
- swallow exceptions,
- add blocking network calls,
- create expensive serialization in hot paths,
- change public output unless logs are the product output.

## Tests

Add or update tests when:

- the project already captures logs in tests,
- branch-specific reason codes matter,
- stale field names were renamed,
- extracted helpers need observability contracts,
- aggregate and detail telemetry must stay reconcilable.

Assert stable fields and event names, not timestamps or full formatted strings.
