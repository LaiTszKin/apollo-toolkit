# iterative-code-performance

Improve an existing repository through a strict three-step loop of full-codebase performance scan, module-scoped optimization, and final documentation/constraint sync while preserving intended business behavior and the system's top-level macro architecture.

## Core capabilities

- Runs a repository-wide performance scan before every optimization round and refreshes a concrete bottleneck backlog.
- Uses a strict three-step loop: scan the codebase, choose this round's jobs and optimize, then update docs/constraints only when no actionable gap remains.
- Builds a module inventory and coverage ledger so every in-scope module receives a performance-oriented deep-read iteration before completion.
- Defines deep-read as a job-oriented scan across measurement, algorithmic complexity, repeated work, IO, batching, query behavior, caching, allocation churn, hot loops, concurrency, and staged unlock opportunities.
- Prioritizes measured or clearly complexity-backed bottlenecks over speculative micro-optimizations.
- Adds or updates benchmark, characterization, regression, load, or integration guardrails when optimization risk requires them.
- Requires confidence decisions to combine the agent's self-assessed ability, task complexity, guardrail strength, rollback or repair paths, and whether strong tests or benchmarks can safely drive broken optimizations back to green.
- Reduces avoidable repeated computation, unnecessary serialization/parsing, allocation churn, IO round trips, inefficient query patterns, and unbounded concurrency.
- Introduces caching or memoization only when ownership, invalidation, size bounds, and failure behavior are clear.
- Treats large coupled hot paths as staged unlock problems, not as automatic stop signals.
- Re-scans the full repository after every iteration and repeats while any known in-scope actionable performance issue or unvisited in-scope module remains.
- Synchronizes project docs and `AGENTS.md` through `align-project-documents` and `maintain-project-constraints` after implementation.

## Repository structure

- `SKILL.md`: Main three-step loop, dependencies, guardrails, and output contract.
- `agents/openai.yaml`: Agent interface metadata and default prompt.
- `references/`: Focused guides for scanning, module coverage, job selection, measurement, algorithmic complexity, IO, caching, hot loops, concurrency, unlock work, and iteration gates.

## Typical usage

```text
Use $iterative-code-performance to improve this repository's speed end to end without changing business behavior or macro architecture.
```

## License

MIT. See `LICENSE`.
