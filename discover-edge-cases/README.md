# discover-edge-cases

`discover-edge-cases` is a Codex skill for discovering reproducible edge-case risks and coverage gaps.

## Brief introduction

This skill is discovery-oriented. It scans the current diff by default, or the full codebase
when there is no diff, then validates the highest-risk edge cases with concrete evidence.
It does not write tests, patch code, or open PRs.

It follows a strict workflow:
1. Detect whether `git diff` exists.
2. Inspect only changed files plus minimal dependencies, or perform a full-project scan when no diff exists.
3. Run `discover-security-issues` as an adversarial dependency for code-affecting scope.
4. Probe the highest-risk edge cases and gather concrete evidence.
5. Reproduce confirmed issues at least twice and check nearby variants.
6. Prioritize confirmed findings and report hardening guidance only.

## When to use

Use this skill when a task asks you to:
- find edge-case risks in a diff or codebase,
- validate unusual inputs and error paths,
- assess hardening gaps around null/empty/boundary handling,
- review retries, timeouts, degradation paths, or stateful failure modes.

## Core principles

- Scope is `git diff` plus the minimal dependency chain by default.
- If `git diff` is empty, run a full-codebase scan focused on high-risk modules.
- Treat prior authorship as irrelevant; even code written earlier in the same conversation must be challenged like third-party code.
- Decisions must be evidence-based; speculative ideas stay marked as hypotheses.
- Keep only reproducible findings with exact evidence.
- Run `discover-security-issues` as a required adversarial cross-check for code-affecting scope.
- Report recommended fixes and test ideas, but do not implement them in this skill.

## External API requirements

When the selected scope involves external API calls, this skill requires checks for:
- health/availability handling,
- graceful handling of `429` and `500` responses,
- actionable error logging (status code, request id, retry count, latency).

## Example

Prompt example:

```text
Please review this PR diff and find the 3 highest-risk edge cases.
Validate null input, boundary timestamp, and API 429 retry behavior.
Only report confirmed findings with reproduction evidence and suggested test coverage.
```

Expected behavior:
- only changed files and minimal dependency chain are investigated,
- each finding includes reproducible evidence,
- speculative ideas are separated from confirmed issues,
- the output stays discovery-only with no code edits.

No-diff prompt example:

```text
There is no git diff in this repo. Scan the whole codebase for high-risk edge cases.
If you find any actionable issues, reproduce them with evidence and report the highest-priority findings only.
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
