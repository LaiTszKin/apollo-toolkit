---
name: enhance-existing-features
description: >-
  Extend brownfield systems only after reading the real modules involved: choose **`generate-spec`**/`recover-missing-plan` when user-visible scope, ambiguity, coordination, or sensitive flows demand written approval; otherwise implement directly but still run **`test-case-strategy`** on every non-trivial delta (property/adversarial/integration as risk dictates) and never check off plans without commit+test evidence.
  Use for backlog work that mutates production behavior; reroute pure regressions, copy/style-only tweaks, or single-pocket config nits that restore documented intent without new surface area.
  Bad: multi-service permission change with zero spec… Good: contract captures external API limits + property tests cover invariants… Single-file pagination fix matching README → targeted regression only…
---

# Enhance Existing Features

## Dependencies

- Required: `test-case-strategy` for risk selection, oracles, drift checks.
- Conditional: **`generate-spec`** when spec triggers below fire; **`recover-missing-plan`** when user-named `docs/plans/...` is missing/archived/mismatched; **`commit-and-push`** when the user requests **git commit** and/or **push** to persist completed work—**MUST** delegate final submission to **`commit-and-push`** (often via **`implement-specs`** / **`implement-specs-with-worktree`** when a spec path is active).
- Optional: none.
- Fallback: **`test-case-strategy`** unavailable ⇒ **stop**. Spec path required but **`generate-spec`** unavailable ⇒ **stop**. If the user requested **commit/push** and **`commit-and-push`** is unavailable, **MUST** stop and report.

## Non-negotiables

- **MUST** explore relevant code (entrypoints, flows, integrations) **before** deciding process or editing—**MUST NOT** spec-dump or code-dump from titles alone.
- Spec path **when** any: new/changed **user-visible** behavior (not mere restore of old intent); ambiguity needing approval; multi-module alignment; critical/sensitive/irreversible/migration risk; traceability materially reduces error.
- **MUST NOT** open **`generate-spec`** for clearly tiny/localized work: pure regression to prior intent; polish-only UI copy/style; one-area config/constant/flag; narrow CRUD/validation tweak; internal refactor/observability **without** behavior change—**implement + `test-case-strategy` directly**.
- If specs: **MUST** complete **`generate-spec`** lifecycle (approval before code; backfill after); **≤3 modules** per spec set—split independent non-dependent sets + batch `coordination.md` when coordinated parallelism; **MUST NOT** code pre-approval.
- **MUST NOT** yield with approved in-scope **`tasks.md`/`checklist.md`** undone except user deferral or documented external blocker (record in plans).
- **`test-case-strategy` required** for non-trivial deltas—property/adversarial/integration etc. per risk; meaningful oracles; drift check or explicit **`N/A`** with reason per non-trivial logic task.
- External deps: **`contract.md`** records official-backed obligations when material.

## Standards (summary)

- **Evidence**: Code exploration + official docs/APIs where touched.
- **Execution**: Explore → decide specs → docs/officials → implement → test → backfill/summary.
- **Quality**: No speculative scope expansion; reuse patterns.
- **Output**: Behavior matches ask; traceable tests; plans honest if specs used.

## Workflow

**Chain-of-thought:** **`Pause →`** after explorations and spec decision—wrong classification wastes days.

### 1) Explore codebase

- Map modules, integrations, blast radius.
  - **Pause →** Can I state **one paragraph** concrete change surface before editing?

### 2) Decide specs

- Apply Non-negotiable triggers above; if doubt favors **implement-only** **only when** genuinely low-risk localized.
- If specs: broken path ⇒ **`recover-missing-plan`** then **`generate-spec`** (templates, clarification loop, approval). Parallel batch rules per **`generate-spec`**. If **not** specs: complete step 2 with “no specs” rationale, then continue with steps 3–6 (still run official-doc pass when external surfaces change).
  - **Pause →** Am I dodging specs just to avoid bureaucracy while scope is multi-team/critical?

### 3) Authoritative docs

- Official docs / Context7 / web for libs used in change.

### 4) Implement

- Minimal diffs preserving behavior unless tasked otherwise; specs ⇒ every in-scope unchecked item delivered; intermediate milestones ≠ user’s final asked outcome unless rescoped.

### 5) Testing (always for non-trivial)

- **`test-case-strategy`**: inventory risk → tests with oracles → run/fix.

### 6) Completion

- With specs: backfill **`spec.md`/`tasks.md`/`checklist.md`/`contract.md`/`design.md`** (+ **`coordination.md`** if batch truth moved). **`spec.md`** requirement status honest. Strip template noise / `N/A` properly.
- Without specs: concise summary citing tests/results/`N/A` reasons.

## Sample hints

- **Spec yes**: Adds new permission model affecting API+DB+UI—the blast radius crosses layers.
- **Spec no**: Off-by-one in existing pagination restoring documented behavior—fix + regression test.
- **Split**: Touches auth, billing, infra—**three plans** capped modules, **`coordination.md`** collision map.

## References

- **`generate-spec`**: planning/backfill lifecycle
- **`test-case-strategy`**: tests + drift philosophy
- **`recover-missing-plan`**: heal missing dirs
