---
name: improve-observability
description: Add focused observability to an existing system so opaque workflows become diagnosable. Use when users ask to improve observability, add instrumentation, expand logs/metrics/traces, expose failure reasons, or make a business flow easier to debug without changing the product behavior itself.
---

# Improve Observability

## Dependencies

- Required: none.
- Conditional: none.
- Optional: none.
- Fallback: not applicable.

## Standards

- Evidence: Read the real execution path and current telemetry before deciding where visibility actually disappears.
- Execution: Add the smallest useful instrumentation around decision points, scope contracts, outcomes, and failure reasons.
- Quality: Keep changes behavior-neutral, use structured high-signal telemetry, avoid secrets, and lock the signals with tests.
- Output: Report which stages are now observable, which fields or metrics to inspect, and which tests validate the instrumentation.

## Overview

Use this skill to make a hard-to-debug path observable with minimal, evidence-driven changes. Prefer small, high-signal instrumentation around decision points, inputs, outcomes, and failure reasons rather than broad logging spam.

## When To Use

Use this skill when the user asks to:

- add observability to an existing feature or service
- expose why a workflow fails, stalls, retries, or exits early
- enrich logs around a specific bug, incident, queue job, API call, or state transition
- add metrics, traces, or structured fields so operators can isolate root cause faster
- improve debugging without redesigning the whole subsystem

Do not use this skill for generic bug fixing when the main request is behavior change rather than instrumentation.

## Workflow

### 1. Trace the real execution path

- Read the relevant entrypoints, orchestration layers, and current telemetry before editing.
- Identify the exact stages where information disappears: validation, branching, external calls, persistence, retries, settlement, cleanup, or error handling.
- Reuse the project's existing logger, tracing library, metric naming style, and error taxonomy.

### 2. Choose the smallest useful signals

Add instrumentation only where it helps answer a concrete debugging question. Prefer:

- stable request or job identifiers for cross-log correlation
- structured fields for branch conditions, entity ids, counts, amounts, status, and reason codes
- start/end markers for long multi-step flows
- explicit logs for skipped paths and early returns
- metrics or counters for outcome classes when aggregates matter
- trace spans only when the project already uses tracing or timing data is necessary

Avoid logging secrets, full payload dumps, or highly volatile text that breaks searchability.

### 3. Instrument decision points, not just failures

For each critical stage, make these states observable when relevant:

- entered the stage
- key preconditions or derived scope
- branch selected
- external dependency result
- persisted side effect or emitted command
- final outcome and failure reason

If a failure is already logged, improve its context instead of duplicating another generic error line.

### 3.1 Preserve cross-stage scope contracts

When a workflow derives scope in one stage and consumes it later, make that contract observable end-to-end.

- log the derived scope close to where it is computed
- carry the same identifiers into downstream stages so operators can diff them directly
- add explicit `missing_*` and `extra_*` fields when one stage should be a superset or exact match of another
- prefer fail-fast diagnostics when a scope mismatch makes downstream errors ambiguous

This is especially useful for pipelines such as discover -> precheck -> execution, where the real bug is often "stage B saw a different dependency set than stage A prepared".

### 4. Keep changes behavior-neutral

- Do not silently change business logic while adding observability.
- If a tiny safety fix is required to support the instrumentation, isolate it and explain why.
- Prefer additive fields over renamed fields unless the old format is actively harmful.

### 5. Lock the signals with tests

Add or update tests that prove the new observability survives refactors. Focus on:

- emitted log fields or reason codes for the important branches
- metrics increments for success, skip, and failure paths
- regression coverage for the exact opaque scenario that motivated the work
- edge paths such as early-return, dependency failure, and partial completion

Use existing test helpers for log capture and avoid brittle assertions on timestamps or fully formatted log strings.

## Output Expectations

When finishing the task:

- explain which stages are now observable
- point to the key log fields, metrics, or spans that operators should inspect
- mention any still-blind areas if they remain outside scope
- run the most relevant tests for the touched instrumentation

## Guardrails

- Prefer structured, searchable telemetry over prose-heavy logs.
- Minimize volume; high-signal beats high-noise.
- Never add secrets, tokens, credentials, or raw personal data to telemetry.
- Match existing naming conventions so dashboards and log queries stay coherent.
