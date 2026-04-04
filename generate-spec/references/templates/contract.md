# Contract: [Feature Name]

- Date: [YYYY-MM-DD]
- Feature: [Feature Name]
- Change Name: [change_name]

## Purpose
[Describe why external dependency contracts matter for this change.]

## Usage Rule
- Write one dependency record per external library, framework, SDK, API, CLI, platform service, or hosted system that materially constrains implementation.
- If no external dependency materially affects the change, write `None` under `## Dependency Records` and briefly explain why this document is not needed for the current scope.
- Every claim in this file must be backed by the official documentation or the verified upstream source actually used during planning.

## Dependency Records

### Dependency 1: [Dependency Name]
- Type: [library / framework / SDK / API / CLI / hosted service / platform]
- Version / Scope: [exact version, major line, API version, or `Not fixed`]
- Official Source: [link]
- Why It Matters: [what this dependency is responsible for in the change]
- Invocation Surface:
  - Entry points: [package import / endpoint / command / webhook / queue topic]
  - Call pattern: [sync / async / streaming / webhook / batch / polling]
  - Required inputs: [auth, headers, env vars, config keys, payload fields]
  - Expected outputs: [return shape, side effects, emitted events, persisted state]
- Constraints:
  - Supported behavior: [documented supported modes relevant to this change]
  - Limits: [rate limits, payload limits, timeout, ordering, pagination, size, quota]
  - Compatibility: [runtime / platform / version / region / account constraints]
  - Security / access: [auth model, scopes, permissions, secret handling]
- Failure Contract:
  - Error modes: [documented errors, degraded states, retries, eventual consistency]
  - Caller obligations: [retry rules, idempotency keys, backoff, validation, cleanup]
  - Forbidden assumptions: [what the implementation must not assume]
- Verification Plan:
  - Spec mapping: [R?.?]
  - Design mapping: [section in `design.md`]
  - Planned coverage: [UT / PBT / IT / E2E / mock scenario IDs]
  - Evidence notes: [specific doc section or source snippet summary]

### Dependency 2: [Dependency Name]
- Type: [library / framework / SDK / API / CLI / hosted service / platform]
- Version / Scope: [exact version, major line, API version, or `Not fixed`]
- Official Source: [link]
- Why It Matters: [what this dependency is responsible for in the change]
- Invocation Surface:
  - Entry points: [package import / endpoint / command / webhook / queue topic]
  - Call pattern: [sync / async / streaming / webhook / batch / polling]
  - Required inputs: [auth, headers, env vars, config keys, payload fields]
  - Expected outputs: [return shape, side effects, emitted events, persisted state]
- Constraints:
  - Supported behavior: [documented supported modes relevant to this change]
  - Limits: [rate limits, payload limits, timeout, ordering, pagination, size, quota]
  - Compatibility: [runtime / platform / version / region / account constraints]
  - Security / access: [auth model, scopes, permissions, secret handling]
- Failure Contract:
  - Error modes: [documented errors, degraded states, retries, eventual consistency]
  - Caller obligations: [retry rules, idempotency keys, backoff, validation, cleanup]
  - Forbidden assumptions: [what the implementation must not assume]
- Verification Plan:
  - Spec mapping: [R?.?]
  - Design mapping: [section in `design.md`]
  - Planned coverage: [UT / PBT / IT / E2E / mock scenario IDs]
  - Evidence notes: [specific doc section or source snippet summary]
