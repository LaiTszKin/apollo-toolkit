---
name: discover-edge-cases
description: Discover reproducible edge-case risks in changed code or a selected codebase scope, prove them with concrete evidence, and report prioritized findings without modifying implementation. Use when users ask to find edge cases, assess hardening gaps, or validate that unusual inputs and error paths are covered.
---

# Discover Edge Cases

## Overview

Use this skill to discover edge-case failures and coverage gaps with evidence-first analysis. The goal is to surface reproducible findings, not to remediate them.

## Dependency Contract (Required)

For code-affecting scopes, run `harden-app-security` after identifying the review scope and before finalizing the report.

- Treat the dependency as an adversarial cross-check against your own assumptions.
- Reuse confirmed security findings instead of downgrading them into generic edge-case observations.
- If the dependency is unavailable, stop and report the missing dependency.

## Non-negotiable Boundaries

- This skill is discovery-only: do not edit code, do not add or modify tests, and do not open PRs.
- Keep only reproducible findings with clear evidence.
- Mark unverified ideas as hypotheses and separate them from confirmed findings.
- If the task also requires remediation, finish this discovery pass first, then hand off confirmed findings to another implementation workflow.
- Discard authorship bias completely: treat code written earlier in the conversation or by this agent as untrusted until evidence proves otherwise.

## Workflow

### 1) Determine scan scope (required)

- Run `git diff --name-only` first.
- If diff exists: inspect only changed files plus the minimum dependency chain required to validate suspected edge cases.
- If no diff exists: scan the full project, prioritizing core domain logic, external API boundaries, stateful workflows, and concurrency-sensitive modules.
- If no actionable issue is found, report `No actionable edge-case finding identified` and stop.

### 2) Build a factual baseline

- Read the relevant code paths end-to-end before judging behavior.
- Re-derive behavior from code, tests, runtime output, and reproduced inputs only; ignore prior intent, authorship, or confidence from earlier turns.
- Clarify input/output contracts: types, valid ranges, null handling, ordering assumptions, retry/error behavior, and state transitions.
- Run existing tests or a minimal reproduction when needed to confirm actual vs expected behavior.
- Record exact evidence with file references (`path:line`) and observable symptoms.

### 3) Execute focused edge-case probes

Prioritize 2-5 high-risk cases directly tied to the selected scope:

- Empty collections / empty strings / None / null
- Boundary values: 0, 1, -1, max/min limits, overflow
- Duplicate, ordering, sorting, or deduplication assumptions
- Exception paths: external dependency failure, timeout, retry, or partial data missing
- Invalid formats: malformed strings, invalid date/timezone, or unexpected types
- Concurrency/reentrancy: repeated calls, state contamination, or race windows
- Architecture-level edge cases: backpressure, resource exhaustion, timeout propagation, or partial commit/rollback behavior

For broader coverage, load references as needed:

- `references/architecture-edge-cases.md`
- `references/code-edge-cases.md`

#### External API checks

If the scope includes external API calls, validate:

- observable health/availability handling,
- degradation behavior for at least HTTP 429 and 500,
- actionable error logging (status code, request id, retry count, latency) to avoid silent failures.

### 4) Confirm reproducibility

- Reproduce each confirmed issue at least twice through the same trigger path.
- For high-risk findings, try nearby variants such as boundary neighbors, empty vs null, malformed vs well-typed invalid input, repeated calls, and stale ordering.
- Capture the exact command, request, or input together with the observed failure or missing protection.
- Keep unverified ideas as hypotheses only.

### 5) Prioritize confirmed findings

- Rank findings by user impact, exploitability or frequency, and blast radius.
- Call out data-integrity, state corruption, silent failure, retry storm, and cross-module propagation risks explicitly.
- Prefer fewer, stronger findings over many speculative ones.

### 6) Report findings only

Deliver:

1. Findings (highest risk first)
   - Title and severity/priority
   - Evidence (`path:line`)
   - Reproduction steps or triggering input
   - Broken expectation/invariant
2. Edge-case evidence
   - Preconditions
   - Observed behavior
   - Reproducibility notes and nearby variant results
3. Risk assessment
   - Impact, likelihood, and scope
   - Why this matters in system context
4. Hardening guidance (advice only)
   - Recommended fix direction
   - Suggested test coverage to add during remediation
5. Residual risk
   - Hypotheses, unknowns, and next validation ideas

## Minimum Coverage

Apply all relevant checks for the selected scope:

- Input validation: empty/null/malformed/unexpected-type handling
- Boundary behavior: zero/one/min/max/overflow/ordering edges
- Failure behavior: timeout, retry, partial dependency failure, degraded mode
- Stateful behavior: idempotency, replay, concurrency, rollback, duplicate processing
- Observability: actionable errors and logging for failures that would otherwise be silent

## Resources

- `references/architecture-edge-cases.md`: cross-module/system-level edge-case checklist.
- `references/code-edge-cases.md`: code-level input, boundary, and error-path checklist.
