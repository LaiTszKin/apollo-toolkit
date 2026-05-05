---
name: discover-edge-cases
description: >-
  Diff-first (or full-repo) discovery of **reproducible** edge-case risks: boundaries, null/empty, failure paths, concurrency, observability; evidence via code/tests/runtime—**no edits, no new tests, no PRs**. For code-affecting scope, cross-check with **`discover-security-issues`** before final report.
  Use for edge-case review, hardening gaps, unusual inputs/error paths, pre-merge risk pass **STOP** implementation or “just fix it here”… BAD unproven alarm list… GOOD path:line + double repro…
---

# Discover Edge Cases

## Dependencies

- Required: none.
- Conditional: **`discover-security-issues`** on **code-affecting** scope before finalizing the report (adversarial security pass).
- Optional: none.
- Fallback: If that security cross-check is **required** but unavailable, **MUST** stop and report the missing dependency.

## Non-negotiables

- **Discovery-only**: **MUST NOT** edit code, add/modify tests, or open PRs.
- **MUST** keep only **reproducible** findings; label guesses as **hypotheses**.
- **MUST** reproduce each **confirmed** issue **at least twice** (same trigger); vary neighbors (empty vs null, malformed vs wrong-type).
- **MUST** discard authorship bias—including code from earlier in the conversation.
- If remediation is requested: finish this pass first; hand off **confirmed** items to an implementation workflow.

## Standards (summary)

- **Evidence**: `path:line`, commands/inputs, test output, or runtime symptoms—no intent-only claims.
- **Execution**: Scope → baseline read → focused probes (2–5 high-impact) → validate → prioritize → report.
- **Quality**: Prefer fewer strong findings; flag data integrity, silent failure, retry storms, cross-module propagation.
- **Output**: Prioritized findings, reproduction, risk, hardening **advice**, residual risk/hypotheses.

## Workflow

**Chain-of-thought:** Answer **`Pause →`** each step; if scope is wrong, fix before probing.

### 1) Determine scan scope

- `git diff --name-only` first.
- **With diff**: changed files + minimum dependency chain to validate suspected edges.
- **No diff**: whole project, prioritizing domain logic, external boundaries, stateful/concurrent modules.
- If nothing actionable after honest pass: report `No actionable edge-case finding identified` and stop.
   - **Pause →** Can I name the **smallest file set** I must read—not the whole monorepo by default?

### 2) Build factual baseline

- Read end-to-end before judging; derive behavior from code, tests, runtime only.
- Clarify contracts: types, ranges, null, ordering, retries, state transitions.
   - **Pause →** What did I **execute** (test/command) vs only read?

### 3) Focused probes (prioritize 2–5)

Target high-risk patterns tied to scope:

- Empty/null/malformed/unexpected types; boundaries (0, 1, min/max, overflow); duplicates/order.
- Dependency failure: timeout, partial data, retry loops; invalid formats.
- Concurrency/reentrancy; architecture edges: backpressure, exhaustion, partial commit/rollback.
- **HTTP/API** (if in scope): 429/500 behavior; logging with status/id/retry/latency (no silent fails).

Load as needed: `references/architecture-edge-cases.md`, `references/code-edge-cases.md`.
   - **Pause →** Would **discover-security-issues** flag this sink if it is auth/input injection—did I schedule that pass for code changes?

### 4) Confirm reproducibility

- Two passes per confirmed issue; note variants tried; keep unconfirmed as hypotheses.

### 5) Prioritize

- User impact, frequency/exploitability, blast radius; call out integrity, state corruption, silent failure.

### 6) Security cross-check (code-affecting)

- Run **`discover-security-issues`** on the **same** scope; integrate **confirmed** security items (do not duplicate as edge trivia unless distinct).

### 7) Report only

Deliver: (1) Findings—title, severity, evidence, repro, broken invariant; (2) Edge evidence—preconditions, observation, variants; (3) Risk—impact/likelihood/scope; (4) Hardening guidance (advisory); (5) Residual risk—hypotheses, next checks.

## Minimum coverage (apply what fits scope)

- Input validation; boundary behavior; failure/degraded modes; state/idempotency/concurrency/rollback; actionable observability.

## Sample hints

- **Diff**: One new parser → empty string + max length + malformed delimiter **before** “maybe SQL.”
- **No diff**: Start at payment/state machine module—highest consequence.
- **Handoff**: Five confirmed edges → remediation skill gets **numbered list + repro**—not this skill patching.

## References

- `references/architecture-edge-cases.md` — system-level checklist.
- `references/code-edge-cases.md` — code-level input/error/concurrency checklist.
