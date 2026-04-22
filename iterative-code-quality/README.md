# iterative-code-quality

Improve an existing repository through repeated, evidence-backed code-quality passes while preserving intended business behavior and macro architecture.

## Core capabilities

- Scans the full codebase and builds a prioritized quality backlog before editing.
- Clarifies ambiguous variable, parameter, field, helper, and test-data names.
- Simplifies complex functions and extracts reusable helpers only when they centralize real behavior.
- Splits mixed-responsibility code into narrower modules without changing macro architecture.
- Repairs stale or missing logs and adds tests for important observability contracts.
- Adds high-value unit, property-based, integration, or E2E tests based on risk.
- Repeats the pass cycle until remaining issues are low-value, blocked, or require explicit product/architecture approval.
- Synchronizes project docs and `AGENTS.md` through `align-project-documents` and `maintain-project-constraints` after implementation.

## Repository structure

- `SKILL.md`: Main iterative workflow, dependencies, guardrails, and output contract.
- `agents/openai.yaml`: Agent interface metadata and default prompt.
- `references/`: Focused guides for scanning, naming, simplification, module boundaries, logging, testing, and iteration gates.

## Typical usage

```text
Use $iterative-code-quality to improve this repository's code quality end to end without changing business behavior or macro architecture.
```

## License

MIT. See `LICENSE`.
