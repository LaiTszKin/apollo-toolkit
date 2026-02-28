# Adoption Criteria

Use this checklist before adopting a review comment.

## Adopt

- Fixes a correctness bug or prevents regression.
- Closes a security, privacy, or data-integrity risk.
- Improves reliability, error handling, or test coverage.
- Clarifies intent with low-cost maintainability improvement.

## Usually reject

- Outside the agreed PR scope.
- Contradicts product requirements or architecture decisions.
- Duplicates a handled comment or stale context.
- Requires large refactor not justified by current PR goal.

## Borderline comments

- Prefer smallest safe change.
- Ask reviewer for clarification when acceptance criteria are unclear.
- Keep unresolved until change is implemented and verified.
