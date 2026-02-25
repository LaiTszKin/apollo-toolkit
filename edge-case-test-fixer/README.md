# edge-case-test-fixer

`edge-case-test-fixer` is a Codex skill for hardening code changes with edge-case-driven tests.

## Brief introduction

This skill normally focuses on the current change set. It identifies high-risk edge cases,
writes failing tests first, and applies only minimal fixes required to make behavior reliable.
If there is no `git diff`, it switches to a full-codebase edge-case scan.

It follows a strict workflow:
1. Detect whether `git diff` exists.
2. If diff exists, inspect changed code and minimal dependencies only.
3. If no diff exists, scan the full codebase for actionable edge cases.
4. Write failing tests first and apply the smallest fix.
5. Re-run tests and clean temporary artifacts.
6. For no-diff fixes, create a git worktree, commit/push directly with git, and create a PR.

## When to use

Use this skill when a task asks you to:
- add edge-case tests,
- validate unusual inputs and error paths,
- harden behavior around null/empty/boundary values,
- verify retries, timeouts, and degradation paths.

## Core principles

- Scope is `git diff` + minimal dependency chain by default.
- If `git diff` is empty, run a full-codebase scan; only proceed when actionable edge cases are found.
- Decisions must be evidence-based (no speculation).
- Prefer small, targeted fixes over broad refactors.
- Keep API behavior backward compatible unless explicitly changed.

## External API requirements

When changes involve external API calls, this skill requires edge-case coverage for:
- health/availability checks,
- graceful handling of `429` and `500` responses,
- actionable error logging (status code, request id, retry count, delay).

## Example

Prompt example:

```text
Please review only this PR diff and find the 3 highest-risk edge cases.
Write failing tests first for null input, boundary timestamp, and API 429 retry.
Then apply the smallest fix and re-run tests.
```

Expected behavior:
- only changed files and minimal dependency chain are investigated,
- each edge case gets its own test,
- implementation changes stay minimal and targeted,
- temporary test artifacts are cleaned up.

No-diff prompt example:

```text
There is no git diff in this repo. Scan the whole codebase for high-risk edge cases.
If you find any actionable issue, create a worktree branch, fix with tests first,
then commit/push with git and open a PR.
```

## References

- [`SKILL.md`](./SKILL.md) - full workflow and execution rules.
- [`references/architecture-edge-cases.md`](./references/architecture-edge-cases.md) - cross-module/system-level edge-case checklist.
- [`references/code-edge-cases.md`](./references/code-edge-cases.md) - code-level input, boundary, and error-path checklist.

## Repository structure

```text
.
├── LICENSE
├── SKILL.md
├── README.md
└── references
    ├── architecture-edge-cases.md
    └── code-edge-cases.md
```

## License

MIT
