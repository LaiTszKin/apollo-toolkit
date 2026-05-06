---
name: solve-issues-found-during-review
description: >-
  From a confirmed finding list: fix in severity order (Critical→Low) with minimal patches, validate after each item, forbid speculative polish; document Deferred/CNR with evidence.
  Done only when code matches governing specs/plans where they apply and security, edge-case, and other inbound review findings are fixed/verified with nothing material open.
  Use for concrete review excerpts; STOP if vague. Bad: refactor while Critical SSRF open. Good: minimal patch, tests green, evidence cited.
---

# Solve Issues Found During Review

## Dependencies

- Required: none (caller **MUST** supply an existing review report or reconstructable finding list).
- Conditional: `review-spec-related-changes` when governing `docs/plans/...`, `spec.md`, `tasks.md`, contracts, or checklists bind the changed behavior—**MUST** satisfy **Completion criteria** §1 before declaring done; `review-change-set` for optional re-validation after **code-affecting** fixes; `systematic-debug` when a fix causes unexpected test or runtime failures; **`commit-and-push`** when the user requests **git commit** and/or **push** to persist fixes—**MUST** hand off that leg to **`commit-and-push`** (not bare `git commit` / ungated push).
- Conditional (completion gate): **`discover-security-issues`** / **`discover-edge-cases`** when the inbound material includes security or edge-case findings, or when completion requires proving those dimensions clean—rerun or equivalent scoped proof **MUST** show no remaining confirmed in-scope issue (see **Completion criteria** §2).
- Fallback: If `review-change-set` is unavailable after code fixes, **MUST** still verify via targeted tests and `git diff` (or equivalent) and **MUST** document exactly what was run. If the user requested **commit/push** and **`commit-and-push`** is unavailable, **MUST** stop and report.

## Non-negotiables

- **MUST** read the **full** report and the affected code **before** editing. **MUST** tie every code change to a **confirmed** finding (explicit severity/title/evidence). **MUST NOT** fix speculative, hypothetical, or “nice-to-have” items unless the report elevated them to confirmed findings.
- **MUST** process findings in strict severity order: complete **all** Critical before **any** High, then Medium, then Low—**MUST NOT** skip ahead for convenience. Within a tier, follow the reviewer’s stated ordering when present; if severities are missing, treat business-goal / correctness breaks as **High–Critical class** and cosmetic simplification as **Low**.
- **MUST** validate after each finding’s fix (tests, repro steps, or agreed oracle) **before** starting the next finding at the same or lower priority. **MUST NOT** mark a finding fixed without passing validation.
- **MUST** keep each fix **minimal** and scoped to the finding: **MUST NOT** bundle unrelated refactors, style sweeps, or scope expansion.
- This skill **defaults to product code**; **MUST NOT** edit specs, docs, or `AGENTS.md`/`CLAUDE.md` unless the **finding text** explicitly requires it.
- If a finding cannot be reproduced after investigation, **MUST** record `Could not reproduce` with evidence and **MUST** continue the queue without silently dropping the item.

## Completion criteria

Declare this workflow **finished** only when **both** clauses below hold. Partial closure of the finding queue is insufficient.

1. **Specification conformance**: Every behavior touched by fixes **MUST** match the authoritative specification documents (`spec.md`, `tasks.md`, `checklist.md`, `contract.md`, governing `docs/plans/{change}` prose, plus any checklist items the caller names). **MUST** run **`review-spec-related-changes`** (or an equivalent checklist walk tied to cited requirement IDs plus tests/commands) whenever such docs exist or the user points at a plan path; cite **Met** (or repaired **Partial**) outcomes with file/test evidence in the closing report. If the caller asserts **no** binding spec for the scope, **MUST** state that assumption explicitly and anchor compliance to the issue/report text plus passing validation—**MUST NOT** silently invent spec obligations.
2. **Ancillary reviews fully cleared**: Confirmed findings from **security audits**, **edge-case / hardening reviews**, and any other labeled review streams in the inbound package **MUST** reach **`Fixed`** (or documented **`Could not reproduce`** with reproducible rationale) **with** reruns or scoped proofs that show no remaining reproducible exploit or edge-case failure **in scope**. **MUST NOT** declare completion while Critical / High-class security issues or correctness-class edge regressions remain open. **`Deferred`** is incompatible with declaring completion unless the caller explicitly rescopes (“out of this pass”) **in writing** in the conversation; otherwise **MUST** keep working or stop with a blocker report listing what still fails completion §2.

`Could not reproduce` on a formerly cited line **counts** toward §2 cleared **only if** investigation evidence excludes stale reports; if reproducibility disagrees between spec §1 and a security/edge claim, **priority is correctness and safety**: resolve the conflict before completion.

## Standards (summary)

- **Evidence**: Confirmed finding → code path → minimal patch → validation artifact; closure adds spec traceability and ancillary-review clean signal.
- **Execution**: Order by severity; optional parallel module groups only when isolation is real; merge without losing fix intent; completion gates §1–§2 after the queue settles.
- **Quality**: No speculative hardening; conflicts resolved conservatively unless the finding demands an aggressive change.
- **Output**: Per-finding status, validation proof, **completion-criteria checklist** (spec + ancillary reviews), final re-validation summary, residual/blockers only when completion is explicitly waived by caller rescope.

## Workflow

**Chain-of-thought:** After **each** phase, **`Pause →`** guards against speculative fixes and order violations—answer them before edits or merges.

### 1) Ingest findings

Read the supplied report. If the user says “fix review findings” but attached nothing, reconstruct from git/recent outputs; if **no** reconstructable list exists, **MUST** stop and report. Extract each finding: severity, title, evidence (`path:line` or equivalent), reproduction notes.
   - **Pause →** Can I attach **severity + excerpt + repro** per row—is anything still vague “looks bad”?
   - **Pause →** Is this finding **explicitly confirmed** by the reviewer, or only a hypothesis I must shelve?

### 2) Order and (optional) parallelize

Sort into Critical → High → Medium → Low. Optionally group by **module** or **business chain** for parallel work **only** if sub-agents with **isolated workspaces** exist and groups do not share half-applied state.

**Parallel path** — One package per independent group; each worker fixes its findings **in severity order locally**, validates, returns branch/diff + status. Merge packages one at a time; on conflict, preserve both fix intents; prefer the **more conservative** behavior unless the finding required aggressiveness; **MUST** flag unresolvable conflicts instead of silently dropping a fix. After merge, run consolidated tests.

**Serial path (default)** — For each finding in global severity order: read code and repro → apply minimal fix → validate (`systematic-debug` if failures are unclear) → record status → next finding.
   - **Pause →** Am I respecting **tier closure**—no High work started until every Critical has a settled status (`Fixed`, `Deferred`, `Could not reproduce`)?
   - **Pause →** If parallelizing: could two workers touch **overlapping** symbols or files midway through—if unsure, serialize.

### 3) Full-scope re-validation

After all findings are processed: run relevant tests over touched areas; if code changed and `review-change-set` is available, run it on the post-fix diff; capture `git diff --stat` (or equivalent). **MUST** confirm no confirmed finding remains open without a recorded reason (`Deferred`, `Could not reproduce`, etc.).
**Before** declaring the engagement complete: apply **Completion criteria**—**(§1)** spec/plan conformance evidence (`review-spec-related-changes` or equivalent cited requirement IDs + commands); **(§2)** reruns or scoped proofs so security / edge-case (and sibling) confirmed issues are **`Fixed`** or evidenced `Could not reproduce`, with nothing Critical/High-class left open unless the caller explicitly rescopes.
   - **Pause →** Would the **same** reviewer still see **actionable proof** closed for each `Fixed`, or did I rationalize failures away?
   - **Pause →** Did my consolidated diff sneak in **bonus** unrelated changes—if yes, peel them back?
   - **Pause →** Would **§1 + §2** pass an external spot-check—is spec coverage documented and ancillary dimensions clean?

### 4) Report

Deliver: (1) Summary by severity. (2) Per finding: `Fixed` / `Could not reproduce` / `Deferred` + location + validation evidence. (3) **Completion criteria block**: §1 spec conformance (tool or checklist + requirement IDs + commands); §2 security/edge-case (and other ancillary) closure with rerun evidence or explicit caller rescope for any intentional exception. (4) Final re-validation (review tool result if any, tests, diff stat). (5) Residual/deferred with reasons—if present, state whether completion was declared or blocked. (6) User-facing next checks before merge (manual QA, integration, etc.).
   - **Pause →** Could the user rerun **exactly one** cited command per `Fixed` to trust me—is that cited?
   - **Pause →** Does the report prove **§1 + §2** without hand-waving?

## Notes

- Hypotheses or “might be risky” lines in a report that were **not** confirmed as findings stay **out of scope** for fixes.

## Sample hints

- **Inbound finding slice** — `HIGH | SSRF via webhook URL | src/net/fetch.rs:112 | curl user-controlled URL without allowlist`.
- **Serial flow** — fix `HIGH #1`, run `cargo test net_fetch` (or the project’s narrowest test), mark `Fixed` **only after green** → then proceed to `HIGH #2`; do **not** batch three HIGH fixes then test once unless a single coherent patch is unavoidable and validation still proves each finding closed.
- **Status line**: `HIGH SSRF fetch · Fixed · fetch.rs:105-128 · Verified: cargo test net::fetch + manual blocklisted host`.
- **`Could not reproduce`**: reviewer cited `middleware.ts:77` leak; current tree shows no such path/commit — note commit inspected and bail with evidence, do **not** invent a finding to satisfy the report.
