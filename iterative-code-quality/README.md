# iterative-code-quality

Improve an existing repository through a strict three-step loop of full-codebase scan, job-based refactor, and final documentation/constraint sync while preserving intended business behavior and the system's top-level macro architecture.

## Core capabilities

- Runs a repository-wide scan before every refactor round and refreshes a concrete quality backlog.
- Uses a strict three-step loop: scan the codebase, choose this round's jobs and refactor, then update docs/constraints only when no actionable gap remains.
- Keeps job execution guidance in focused reference documents instead of embedding every job as a workflow step in the main skill.
- Builds a module inventory and coverage ledger so every in-scope module receives a deep-read iteration before completion.
- Starts from the easiest useful modules first, while preserving the rule that unvisited modules cannot be skipped before completion.
- Clarifies ambiguous variable, parameter, field, helper, and test-data names.
- Simplifies complex functions and extracts reusable helpers only when they centralize real behavior.
- Splits mixed-responsibility code into narrower modules without changing macro architecture.
- Repairs stale or missing logs and adds tests for important observability contracts.
- Adds high-value unit, property-based, integration, or E2E tests based on risk.
- Does not require pre-existing tests before every refactor; for high-risk under-guarded areas, it treats test addition as the next unlock direction.
- Uses those tests and other guardrails to justify more aggressive refactors, instead of leaving known issues in place for subjective confidence reasons.
- Re-scans the full repository after every iteration and picks the next highest-confidence, highest-leverage directions.
- Uses small safe refactors to prepare the ground for larger later refactors, progressing gradually from outside to inside.
- Treats large coupled or apparently core files as staged unlock problems, not as automatic stop signals.
- Uses explicit next-job selection conditions from references so the agent can decide more concretely whether naming, simplification, modularization, logging, testing, or unlock work should happen next.
- Runs a stage-gate full-codebase decision after every iteration to decide whether more rounds are still required.
- Repeats the pass cycle while any known in-scope actionable quality issue remains, and forbids a completion report until the latest scan is clear or remaining items are explicitly deferred with a valid reason.
- Forbids completion while any in-scope module remains unvisited, even if already-read modules look clean.
- Targets as many inherited repository quality problems as can be solved safely, and expects the guarded test surface to remain green after the refactor.
- Synchronizes project docs and `AGENTS.md` through `align-project-documents` and `maintain-project-constraints` after implementation.

## Repository structure

- `SKILL.md`: Main three-step loop, dependencies, guardrails, and output contract.
- `agents/openai.yaml`: Agent interface metadata and default prompt.
- `references/`: Focused guides for scanning, module coverage, job selection, naming, simplification, module boundaries, logging, testing, unlock work, and iteration gates.

## Typical usage

```text
Use $iterative-code-quality to improve this repository's code quality end to end without changing business behavior or macro architecture.
```

## License

MIT. See `LICENSE`.
