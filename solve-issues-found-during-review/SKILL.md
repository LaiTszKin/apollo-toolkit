---
name: solve-issues-found-during-review
description: >-
  Operate strictly from a structured review/issue list containing confirmed findings: close items in descending severity order (Critical before High/Medium/Low), land the smallest corrective diff per finding, run targeted validation after each fix before continuing, forbid speculative polish or unsolicited doc edits unless a finding explicitly requires them, and document Deferred or Could-not-reproduce outcomes with reproducible rationale.
  Use when prompts reference concrete review outputs (“fix Bugbot findings”, “resolve security audit bullets”) accompanied by reproducible excerpts—STOP if only vague “there were issues yesterday” survives.
  Bad pattern: refactoring modules while unresolved Critical SSRF persists… Good pattern: `HIGH SSRF src/net/client.rs…` patched, `cargo test net::fetch` green, hashes recorded…
---

# Solve Issues Found During Review

## Dependencies

- Required: none (caller **MUST** supply an existing review report or reconstructable finding list).
- Conditional: `review-change-set` for optional re-validation after **code-affecting** fixes; `systematic-debug` when a fix causes unexpected test or runtime failures; **`commit-and-push`** when the user requests **git commit** and/or **push** to persist fixes—**MUST** hand off that leg to **`commit-and-push`** (not bare `git commit` / ungated push).
- Optional: `discover-edge-cases` / `discover-security-issues` when the user or report demands post-fix confirmation on those dimensions.
- Fallback: If `review-change-set` is unavailable after code fixes, **MUST** still verify via targeted tests and `git diff` (or equivalent) and **MUST** document exactly what was run. If the user requested **commit/push** and **`commit-and-push`** is unavailable, **MUST** stop and report.

## Non-negotiables

- **MUST** read the **full** report and the affected code **before** editing. **MUST** tie every code change to a **confirmed** finding (explicit severity/title/evidence). **MUST NOT** fix speculative, hypothetical, or “nice-to-have” items unless the report elevated them to confirmed findings.
- **MUST** process findings in strict severity order: complete **all** Critical before **any** High, then Medium, then Low—**MUST NOT** skip ahead for convenience. Within a tier, follow the reviewer’s stated ordering when present; if severities are missing, treat business-goal / correctness breaks as **High–Critical class** and cosmetic simplification as **Low**.
- **MUST** validate after each finding’s fix (tests, repro steps, or agreed oracle) **before** starting the next finding at the same or lower priority. **MUST NOT** mark a finding fixed without passing validation.
- **MUST** keep each fix **minimal** and scoped to the finding: **MUST NOT** bundle unrelated refactors, style sweeps, or scope expansion.
- This skill **defaults to product code**; **MUST NOT** edit specs, docs, or `AGENTS.md`/`CLAUDE.md` unless the **finding text** explicitly requires it.
- If a finding cannot be reproduced after investigation, **MUST** record `Could not reproduce` with evidence and **MUST** continue the queue without silently dropping the item.

## Standards (summary)

- **Evidence**: Confirmed finding → code path → minimal patch → validation artifact.
- **Execution**: Order by severity; optional parallel module groups only when isolation is real; merge without losing fix intent.
- **Quality**: No speculative hardening; conflicts resolved conservatively unless the finding demands an aggressive change.
- **Output**: Per-finding status, validation proof, final re-validation summary, residual/deferred items with reasons.

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
   - **Pause →** Would the **same** reviewer still see **actionable proof** closed for each `Fixed`, or did I rationalize failures away?
   - **Pause →** Did my consolidated diff sneak in **bonus** unrelated changes—if yes, peel them back?

### 4) Report

Deliver: (1) Summary by severity. (2) Per finding: `Fixed` / `Could not reproduce` / `Deferred` + location + validation evidence. (3) Final re-validation (review tool result if any, tests, diff stat). (4) Residual/deferred with reasons. (5) User-facing next checks before merge (manual QA, integration, etc.).
   - **Pause →** Could the user rerun **exactly one** cited command per `Fixed` to trust me—is that cited?

## Notes

- Hypotheses or “might be risky” lines in a report that were **not** confirmed as findings stay **out of scope** for fixes.

## Sample hints

- **Inbound finding slice** — `HIGH | SSRF via webhook URL | src/net/fetch.rs:112 | curl user-controlled URL without allowlist`.
- **Serial flow** — fix `HIGH #1`, run `cargo test net_fetch` (or the project’s narrowest test), mark `Fixed` **only after green** → then proceed to `HIGH #2`; do **not** batch three HIGH fixes then test once unless a single coherent patch is unavoidable and validation still proves each finding closed.
- **Status line**: `HIGH SSRF fetch · Fixed · fetch.rs:105-128 · Verified: cargo test net::fetch + manual blocklisted host`.
- **`Could not reproduce`**: reviewer cited `middleware.ts:77` leak; current tree shows no such path/commit — note commit inspected and bail with evidence, do **not** invent a finding to satisfy the report.
