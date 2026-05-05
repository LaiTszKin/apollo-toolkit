---
name: merge-conflict-resolver
description: Resolve git merge conflicts using deterministic rules that preserve correct functionality. Use when branch consolidation encounters merge conflicts and needs automated resolution guidance that reads both parent versions and applies scenario-specific strategies.
---

# Merge Conflict Resolver

## Dependencies

- Required: none.
- Conditional: **`commit-and-push`** when the user expects the resolved tree to be **committed** or **pushed**—**MUST** run that skill for the submission leg instead of bare `git commit` / ad-hoc push when readiness gates apply.
- Optional: none.
- Fallback: If a **gated** submission was requested but **`commit-and-push`** is unavailable, **MUST** stop and report.

## Standards

- Evidence: Read both parent versions from conflict markers before resolving.
- Execution: Read conflicts → apply scenario rules → verify with tests → recommit via **`commit-and-push`** when persisting to git.
- Quality: Prefer preserving functionality over keeping either branch's exact changes.
- Output: Return resolved files with passing verification.

## Workflow

### 1) Read conflict markers

- Read both parent versions from conflict markers before editing.
- Never use `-X ours`/`-X theirs` as the default strategy; only for narrowly justified conflicts after reading the actual content.

### 2) Apply scenario rules

| Scenario | Resolution |
|----------|-----------|
| Same line, both branches changed behavior | Read both code paths and compose merged logic preserving the verified invariant |
| Same line, bug fix vs refactor | Keep the bug fix, reapply compatible refactor structure |
| File deleted in one, modified in other | Keep version supported by current references/tests; delete only if proven correct |
| Both modified same file differently | Preserve both when compatible; manually compose overlapping changes |
| Test files conflict | Preserve both coverages unless one assertion is obsolete |
| Config file (non-overlapping keys) | Keep both values |
| package.json dependency | Keep higher version if compatible |
| Same function added differently | Keep both; rename if needed |

### 3) Verify after resolution

- `git add <resolved-files>`
- Run targeted tests or build checks for changed files.
- If verification fails, resolve differently before committing.
