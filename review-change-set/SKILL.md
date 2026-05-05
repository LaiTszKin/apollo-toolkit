---
name: review-change-set
description: >-
  Unbiased **git diff** review: architecture (boundaries, duplication, ownership) then simplification (real deletes/flattening, not churn)—discard conversation bias. Code-affecting changes **MUST** cross-check with **`discover-security-issues`**; integrate only **confirmed** findings—no invented CWE drama.
  Use for pre-commit/pre-PR review, refactor/abstraction second opinion, “review my branch” **STOP** greenfield feature design from scratch—use planning skills… BAD style-only nits… GOOD evidence + named abstraction target…
---

# Review Change Set

## Dependencies

- Required: none.
- Conditional: **`discover-security-issues`** for **code-affecting** changes before final conclusions.
- Optional: none.
- Fallback: If the security cross-check is **required** but unavailable, **MUST** stop and report.

## Non-negotiables

- Read the **full** active change set (staged **and** unstaged when both exist—label which finding hits which).
- **MUST** discard authorship bias; burden of proof on the code.
- Prefer **architecture** and **maintainability** over style-only.
- Abstraction only when it cuts duplication, clarifies ownership, or stabilizes boundaries.
- Simplification only when behavior-preserving and genuinely simpler—**MUST NOT** shuffle complexity.
- **MUST** invoke **`discover-security-issues`** on code-affecting scope; **MUST NOT** fabricate security issues not confirmed by that pass.

## Standards (summary)

- **Evidence**: Full diff + minimum context reads to understand behavior.
- **Execution**: Git state → baseline → architecture → simplification → security integration → report.
- **Quality**: Actionable, outsider perspective; clear merge of confirmed security results.
- **Output**: Scope, architecture findings, simplification findings, security cross-check summary, residual uncertainty.

## Workflow

**Chain-of-thought:** **`Pause →`** after each block—no verdicts from partial file reads.

### 1) Inspect git state

- `git status -sb`, `git diff --stat`, `git diff --cached --stat`; cover staged vs unstaged explicitly.
- No diff → `No active git change set to review` and stop.
   - **Pause →** Am I about to review **only** unstaged while staged also ships?

### 2) Baseline

- Read every changed file E2E; pull in minimal callers/callees/config to interpret moves and interfaces.
- Behavior from **code, tests, config, execution**—not from chat memory.
   - **Pause →** Can I quote **one concrete behavior** change this diff introduces—not intent?

### 3) Architecture first

Flag only if evidence-backed: duplicated workflows, cross-layer leakage, wrong helper ownership, repeated condition trees, unstable interfaces.
Each finding **MUST** name abstraction target **and** why current shape is weaker.
   - **Pause →** Is this “different style” or a real **boundary** problem?

### 4) Simplification second

Redundant branches/wrappers, deep nesting, duplicated validation, oversize functions, dead compat—**only** if it truly reduces complexity.
   - **Pause →** Would this refactor just **move** lines between files?

### 5) Security cross-check

- Run **`discover-security-issues`** on the **same** code-affecting scope.
- Merge **confirmed** findings that affect safety of this structure; omit unconfirmed noise.
   - **Pause →** Did I cite **their** severity + repro—or paraphrase fear?

### 6) Report

1. **Scope** — staged/unstaged; extra context paths read.
2. **Architecture** — title, evidence (`path:line`), candidate, why weaker.
3. **Simplification** — title, evidence, candidate, benefit.
4. **Security cross-check** — confirmed items reused from **`discover-security-issues`**, relevance to this diff.
5. **Residual uncertainty** — hypotheses / follow-up checks.

If nothing actionable: `No actionable abstraction or simplification finding identified` (security section still reflects cross-check outcome).

## Sample hints

- **Staged only**: User ran `git add -p` → findings tagged **staged** vs **unstaged** separately.
- **Rename-heavy**: Read old→new path mapping before calling “duplication.”
- **Tiny diff**: One-file guard clause → architecture section may be empty; security pass still runs if code-affecting.

## References

- **`discover-security-issues`**: confirmed adversarial findings for code-affecting scope.
