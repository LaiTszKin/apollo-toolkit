---
name: review-change-set
description: Review the current git change set from an unbiased reviewer perspective, identify architecture-level abstraction opportunities and code simplification candidates, and challenge security assumptions through harden-app-security. Use when users ask for a diff review, refactor review, abstraction review, simplification review, or a pre-commit/pre-PR second opinion on current changes.
---

# Review Change Set

## Dependencies

- Required: none.
- Conditional: `harden-app-security` for code-affecting changes before finalizing review conclusions.
- Optional: none.
- Fallback: If the required security cross-check is unavailable for a code-affecting scope, stop and report the missing dependency.

## Standards

- Evidence: Read the full active diff plus the minimum dependency chain needed to understand the changed behavior.
- Execution: Review architecture first, then simplification opportunities, then integrate confirmed security findings.
- Quality: Judge the change set as an outsider, keep only actionable findings, and avoid inventing concerns the security pass did not confirm.
- Output: Return review scope, architecture findings, simplification findings, security cross-check results, and residual uncertainty.

## Overview

Use this skill to review the active git change set as an outsider, not as the original author. The goal is to find actionable abstraction and simplification opportunities with evidence, not to defend the current implementation.

## Non-negotiable Review Rules

- Read the full active change set before judging any design choice.
- Discard authorship bias completely, including changes written earlier in the same conversation by this agent.
- Judge the diff from a reviewer perspective: the burden of proof is on the code, not on the author's intent.
- Prefer architecture and maintainability findings over style-only feedback.
- Recommend abstraction only when it reduces duplication, clarifies ownership, or stabilizes boundaries.
- Recommend simplification only when it preserves behavior while reducing complexity or ambiguity.

## Workflow

### 1) Inspect the active git state

- Run `git status -sb`, `git diff --stat`, and `git diff --cached --stat`.
- If both staged and unstaged changes exist, review both and label which findings apply to each surface.
- If there is no active diff, report `No active git change set to review` and stop.

### 2) Build a factual baseline

- Read every changed file end-to-end.
- Read the minimum dependency chain needed to understand new helpers, moved logic, interfaces, and callers.
- Reconstruct actual behavior from code, tests, configuration, and executable evidence only.
- Ignore earlier planning context unless it is explicitly encoded in the repository.

### 3) Review architecture first

Check whether the diff introduces or preserves problems such as:

- duplicated workflows that should live behind one module or helper,
- cross-layer leakage or ownership confusion,
- helper placement that hides domain boundaries,
- repeated condition trees or mapping logic that should be centralized,
- unstable interfaces or parameter shapes that should be normalized.

Keep only findings that name the proposed abstraction target and explain why the current structure is weaker.

### 4) Review simplification opportunities second

Check whether the diff can be simplified through:

- removing redundant branches, wrappers, or state,
- flattening deeply nested control flow,
- collapsing duplicated validation or conversion logic,
- shrinking overly broad functions into clearer units,
- deleting dead or no-longer-needed compatibility paths.

Do not recommend refactors that merely move complexity around.

### 5) Run the security cross-check

- Invoke `harden-app-security` on the same code-affecting scope.
- Integrate confirmed security findings into the final review when they materially affect the safety of the proposed structure.
- Do not invent security concerns that the dependency did not confirm.

### 6) Report only actionable review output

Deliver:

1. Review scope
   - staged / unstaged coverage
   - additional files read for context
2. Architecture findings
   - title
   - evidence (`path:line`)
   - abstraction candidate
   - why the current design is weaker
3. Simplification findings
   - title
   - evidence (`path:line`)
   - simplification candidate
   - expected benefit
4. Security cross-check
   - confirmed findings reused from `harden-app-security`
   - reason they matter to this diff review
5. Residual uncertainty
   - hypotheses or follow-up checks that were not confirmed

If no actionable issue is found, report `No actionable abstraction or simplification finding identified`.
