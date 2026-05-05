---
name: develop-new-features
description: >-
  Net-new or materially new product behavior: **`generate-spec`** is mandatory (clarify → approve → only then code) with **`test-case-strategy`** backing every serious logic change—property tests required unless documented `N/A`, add adversarial/auth/idempotency/concurrency/mocks for external services, cap each spec at three modules and split coordinated batches via `coordination.md`, finish every approved `tasks.md`/`checklist.md` item or document deferrals.
  Use when users ask for “new feature”, “greenfield slice”, “plan-first delivery”. Reroute typo-only UI, bug restores, or internal refactors without product impact to **`enhance-existing-features`** / **`systematic-debug`**.
  Bad: editing `src/api.ts` before approval exists… Good: spec records risk → tests map to requirement IDs… Typo fix in footer copy → wrong skill…
---

# Develop New Features

## Dependencies

- Required: `generate-spec` for shared planning artifacts and `test-case-strategy` for risk-driven test selection, oracles, and unit drift checks before coding.
- Conditional: **`commit-and-push`** when the user requests **git commit** and/or **push** after delivery—**MUST** delegate final submission to **`commit-and-push`** (implementation detail: often via **`implement-specs`**, which already requires it).
- Optional: none.
- Fallback: **`generate-spec`** **or** **`test-case-strategy`** missing ⇒ **stop** (no improvised planning/tests). If the user requested **commit/push** and **`commit-and-push`** is unavailable, **MUST** stop and report.

## Non-negotiables

- This skill applies to **non-trivial new behavior / greenfield**. **MUST NOT** activate for: pure bug restore; style/copy-only tweaks; trivial one-pocket config/constants; internal-only refactors/no visible behavior—these routes belong to **`enhance-existing-features`**, **`systematic-debug`**, etc., **without** new specs here.
- **When this skill applies**, **`generate-spec` is mandatory** before product code: create/update plans, BDD reqs, contracts, design, optional batch **`coordination.md`**, obtain **explicit approval**, then implement.
- **≤3 modules** per spec set; wider work ⇒ multiple **independent** spec sets under batch + **`coordination.md`** (no hidden cross-deps).
- **MUST NOT** modify product code **before** approval.
- Post-approval: **all** in-scope **`tasks.md`/`checklist.md`** items complete unless deferral/blocker documented in artifacts.
- **`test-case-strategy`**: risk-first; property-based logic **required** unless documented **`N/A`**; adversarial/auth/idempotency/concurrency where relevant; mocks for externals in logic chains; oracles tied to requirements.
- Backfill all plan files + coordination when batch; no fake-completed template branches.

## Standards (summary)

- **Evidence**: Official docs + repo architecture pass before plan lock.
- **Execution**: Route-out trivial work → spec → implement → test → backfill.
- **Quality**: Plans trace to tests; minimal speculative code.
- **Output**: Approved scope shipped + honest plan status.

## Workflow

**Chain-of-thought:** If request is maintenance-sized, **`Pause →`** “Should I reroute?” before spending tokens on **`generate-spec`**.

### 1) Docs & routing

- Stack/deps discovery; verify using official sources.
  - **Pause →** Is this truly greenfield/feature vs fix/polish—if latter, bail to other skill?

### 2) `generate-spec`

- Full workflow: dirs `docs/plans/{YYYY-MM-DD}/…`, batch/coord flags, clarification, **`MUST`** approval before code.
  - **Pause →** Did I secretly start coding “just the types”—**hard violation**?

### 3) Architecture map

- Reuse seams; list likely files **after** approval to stay honest to plan.

### 4) Implement (post-approval)

- Execute tasks/checklist exhaustively unless blocker recorded with user-visible deferrals.

### 5) Testing

- **`test-case-strategy`** mapping requirement IDs ↔ tests; drift checks/`N/A` discipline; run and fix reds.

### 6) Completion

- Backfill **`generate-spec`**-style across **`spec/tasks/checklist/contract/design`** (+ **`coordination.md`**); requirement-level status in **`spec.md`**; strip template illusions; final report with scope + tests + `N/A`.

## Sample hints

- **Wrong skill**: “Fix typo in footer string” ⇒ not here.
- **Right skill**: “Add export-to-CSV for dashboard” ⇒ **`generate-spec`** then code + property tests on CSV invariants maybe.
- **Split**: Touches CLI + server + terraform module boundaries—three modules cap ⇒ **two spec dirs** coordinated.

## References

- **`generate-spec`**: planning/backfill authority
- **`test-case-strategy`**: breadth/depth of tests
