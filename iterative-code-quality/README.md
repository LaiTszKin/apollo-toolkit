# iterative-code-quality

Improve an existing repository through repeated, evidence-backed full-iteration refactors while preserving intended business behavior and the system's top-level macro architecture.

## Core capabilities

- Scans the full codebase and builds a prioritized quality backlog before editing.
- Treats naming, abstraction, module boundaries, logging, and tests as selectable execution directions rather than a fixed sequence.
- Clarifies ambiguous variable, parameter, field, helper, and test-data names.
- Simplifies complex functions and extracts reusable helpers only when they centralize real behavior.
- Splits mixed-responsibility code into narrower modules without changing macro architecture.
- Repairs stale or missing logs and adds tests for important observability contracts.
- Adds high-value unit, property-based, integration, or E2E tests based on risk.
- Uses those tests and other guardrails to justify more aggressive refactors, instead of leaving known issues in place for subjective confidence reasons.
- Re-scans the full repository after every iteration and picks the next highest-confidence, highest-leverage directions.
- Uses small safe refactors to prepare the ground for larger later refactors, progressing gradually from outside to inside.
- Repeats the pass cycle while any known in-scope actionable quality issue remains, and forbids a completion report until the latest scan is clear or remaining items are explicitly deferred with a valid reason.
- Targets as many inherited repository quality problems as can be solved safely, and expects the guarded test surface to remain green after the refactor.
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
