---
name: solve-issues-found-during-review
description: Fix issues discovered during a review pass (review-change-set, review-spec-related-changes, review-codebases, discover-edge-cases, harden-app-security, or any structured review), proceeding from the highest-severity finding down to the lowest, until all confirmed issues are resolved. Use when users ask to fix review findings, resolve review issues, implement review feedback on code, or address audit/security review findings.
---

# Solve Issues Found During Review

## Dependencies

- Required: none. This skill reads issues from a review report that must already exist or be supplied by the caller.
- Conditional: `review-change-set` for re-validation after fixes when the fix set is code-affecting; `systematic-debug` when a fix attempt encounters unexpected test or runtime failures.
- Optional: `discover-edge-cases` to confirm edge-case coverage after fixing; `harden-app-security` to confirm security fixes are effective.
- Fallback: If a required re-validation dependency is unavailable after a code-affecting fix, run `git diff --stat` and relevant tests manually and report what was verified.

## Standards

- Evidence: Read the full review report and the affected code before implementing any fix. Every fix must be grounded in a confirmed finding from the review.
- Execution: Fix issues in strict severity order (Critical → High → Medium → Low). After each fix, validate the change preserves correctness before moving to the next issue. Re-run the original review scope when all fixes are complete to confirm no regression and no remaining finding.
- Quality: Fix only issues confirmed by the review report. Do not expand scope with speculative improvements, unrelated refactors, or style-only changes. Each fix must be minimal and targeted.
- Output: Report which findings were fixed, how each was validated, any findings that could not be reproduced or fixed (with reasons), and the final re-validation result.

## Workflow

### 1) Read the review report

- Read the review report or finding list that the user provides.
- If the user did not provide a review report but says "fix the review findings", inspect current git state and recent review outputs to reconstruct the finding list.
- If no review report can be found, stop and report that no review findings are available to act on.
- Extract every confirmed finding with its severity, title, evidence (`path:line`), and reproduction evidence.

### 2) Prioritize findings by severity

Group findings into ordered buckets:

1. Critical
2. High
3. Medium
4. Low

Within each bucket, order by the reviewer's stated priority. If the review does not assign severity, treat architecture/business-goal gaps as High and simplification/style suggestions as Low.

### 3) Fix findings from highest severity to lowest

For each finding in priority order:

**a. Understand the finding and the fix target**

- Read the affected code paths end-to-end.
- Read the reviewer's reproduction evidence and hardening guidance.
- Determine the minimal fix that resolves the finding without changing unrelated behavior.

**b. Apply the fix**

- Make the targeted code change.
- Keep the fix scoped to the finding. Do not expand scope.

**c. Validate the fix**

- Run the most specific tests covering the changed code.
- If tests fail, invoke `$systematic-debug` to resolve the failure before proceeding.
- If the finding includes reproduction steps, verify the reproduction no longer triggers.
- Only mark the finding as fixed when validation passes.

**d. Track progress**

Proceed to the next finding. Do not skip severity levels: finish all Critical findings before starting High, etc.

### 4) Re-validate the full scope

When all findings have been processed:

- If the fix set is code-affecting, optionally run `$review-change-set` on the updated diff to confirm no new issues were introduced.
- Run all relevant tests across the changed files.
- Run `git diff --stat` to produce a summary of what changed.

### 5) Report the result

Return:

1. Summary of all findings processed, grouped by severity.
2. For each finding: status (`Fixed`, `Could not reproduce`, `Deferred`), path:line, and validation evidence.
3. Final re-validation: new review result (if run), test results, and git change summary.
4. Any residual findings that were deferred or could not be fixed, with reasons.
5. Next steps: what the user should verify before merging (e.g., manual QA, integration tests, deployment review).

## Notes

- This skill fixes code only. It does not update specs, documentation, or project constraints unless the review finding explicitly requires it.
- If the original review report contained hypotheses or unconfirmed risks, leave those untouched — only confirmed findings are actionable.
- When a finding cannot be reproduced after inspecting the code, report `Could not reproduce` and move to the next finding.
