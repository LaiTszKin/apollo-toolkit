# review-change-set

`review-change-set` is a Codex skill for reviewing the active git diff like an independent reviewer.

## What this skill does

This skill:

1. Reads the current git change set end-to-end.
2. Rejects authorship bias, including confidence in code written earlier in the same conversation.
3. Looks for architecture-level abstraction opportunities.
4. Looks for code that can be simplified without changing behavior.
5. Runs `harden-app-security` as a required adversarial cross-check for code-affecting changes.

## When to use

Use this skill when the task asks you to:

- review the current diff before commit or PR,
- find abstraction or modularization opportunities,
- look for simplification or refactor candidates,
- provide a reviewer-style second opinion on current changes.

## Core principles

- Read the diff first, then judge.
- Treat recent edits as untrusted until evidence proves otherwise.
- Prefer fewer, stronger findings over broad speculative advice.
- Focus on architecture and simplification, not cosmetic style feedback.
- Reuse confirmed security findings from `harden-app-security` instead of hand-waving about risk.

## Example

Prompt example:

```text
Review the current git diff like a skeptical reviewer.
Find any architectural abstractions that should be extracted and any code that can be simplified.
Do not defend the current implementation just because it was written in this conversation.
```

Expected behavior:

- changed files are read before conclusions,
- findings cite exact evidence,
- architecture issues are prioritized over style comments,
- security-sensitive changes are cross-checked through `harden-app-security`.

## References

- [`SKILL.md`](./SKILL.md) - full workflow and execution rules.

## License

MIT
