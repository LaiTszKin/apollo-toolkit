# update-project-html

`update-project-html` refreshes the project HTML architecture atlas (`resources/project-architecture/`) so it reflects the latest code changes.

## What this skill does

1. Reads the current atlas (`atlas.index.yaml` + per-feature YAML).
2. Resolves the diff scope (`git diff --stat` + `git diff --cached --stat` by default, or `git diff --stat <base>..HEAD` when the user names a ref).
3. Filters to code-affecting hunks and maps each changed file to an existing or new feature.
4. Dispatches one write-capable subagent per affected feature to deep-read only its own changed files and apply every intra-feature mutation through `apltk architecture` (no `--spec`).
5. Waits until every subagent finishes, then declares cross-feature edges, runs `apltk architecture render`, and validates.

## When to use

Use this skill when the task asks you to:

- update or refresh the existing project architecture diagram after code changes,
- bring `resources/project-architecture/` back in sync with the current branch or a specific commit range,
- reflect a recent PR or batch of commits in the canonical atlas before merging or releasing.

If no atlas exists yet, use `init-project-html` to bootstrap one. For planned but unshipped work scoped to a `docs/plans/...` spec, use `spec-to-project-html` to write under `<spec_dir>/architecture_diff/` instead of the base atlas.

## Core principles

- The CLI owns atlas state and renderer output; agents never hand-edit `resources/project-architecture/**/*.html`.
- Every mutation traces to a specific file + diff hunk; absent code never produces atlas entries.
- Subagent fan-out is the only safe read pattern: one feature per subagent, no shared source loading.
- Cross-feature wiring happens **after** every subagent finishes — never from partial summaries.

## References

- [`SKILL.md`](./SKILL.md) — full workflow and execution rules.
- [`../init-project-html/SKILL.md`](../init-project-html/SKILL.md) — semantic rulebook.
- [`../spec-to-project-html/SKILL.md`](../spec-to-project-html/SKILL.md) — spec overlay flow.

## License

MIT
