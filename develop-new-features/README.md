# develop-new-features

A spec-first feature development skill: generate and confirm `spec.md`, `tasks.md`, and `checklist.md` before implementation.

This skill is designed for Codex/Claude-style agents. It helps teams turn requirements, tasks, and test tracking into verifiable documents before coding.

Use this skill for new features, product behavior changes, or greenfield feature design. The goal is to keep requirements, tasks, tests, and implementation aligned and reduce rework from coding too early.

## Key capabilities

- Uses `references/templates/spec.md`, `references/templates/tasks.md`, and `references/templates/checklist.md` as source templates.
- Prefers `scripts/create-specs` to generate all three planning files in one step.
- Writes outputs to `docs/plans/{YYYY-MM-DD}_{change_name}/`.
- `spec.md` captures official references, intended file changes, clarification questions, and BDD behaviors.
- `tasks.md` uses `## **Task N: ...**` plus `- N. [ ]` / `- N.x [ ]` format.
- `checklist.md` must use `- [ ]` format and can be adapted to real scope/test level.
- If users answer clarification questions, the agent must mark clarification checkboxes, update specs, and get approval again before coding.
- E2E is decided by the agent based on feature importance/complexity. If E2E is not suitable, integration tests are required.
- After execution, the agent must backfill checkbox status in `tasks.md` and `checklist.md`.
- **Do not start implementation before explicit user approval.**

## Repository layout

```text
.
├── SKILL.md
├── references/
│   ├── templates/
│   │   ├── spec.md
│   │   ├── tasks.md
│   │   └── checklist.md
│   ├── testing-unit.md
│   ├── testing-property-based.md
│   ├── testing-integration.md
│   └── testing-e2e.md
└── scripts/
    └── create-specs
```

## Requirements

- Python 3.9+

## Quick start

### 1) Generate planning files

```bash
SKILL_ROOT=/path/to/develop-new-features-skill
WORKSPACE_ROOT=/path/to/target-project
python3 "$SKILL_ROOT/scripts/create-specs" "Membership upgrade flow optimization" \
  --change-name membership-upgrade-flow \
  --template-dir "$SKILL_ROOT/references/templates" \
  --output-dir "$WORKSPACE_ROOT/docs/plans"
```

Default output:

```text
docs/plans/<today>_membership-upgrade-flow/
├── spec.md
├── tasks.md
└── checklist.md
```

> If `--change-name` is omitted, the feature name is converted to kebab-case.

### 2) Other common parameters

```bash
SKILL_ROOT=/path/to/develop-new-features-skill
WORKSPACE_ROOT=/path/to/target-project
python3 "$SKILL_ROOT/scripts/create-specs" "Feature name" \
  --output-dir "$WORKSPACE_ROOT/docs/plans" \
  --template-dir "$SKILL_ROOT/references/templates" \
  --force
```

> `scripts/...` and `references/...` are skill-folder paths, not target-project paths.

- `--output-dir`: output directory (default `docs/plans`)
- `--template-dir`: template directory (default `references/templates`)
- `--force`: overwrite existing files under the same target directory

## Recommended workflow

1. Review official documentation needed for this feature (only what is required).
2. Generate `spec.md` / `tasks.md` / `checklist.md` with the script.
3. Explore existing code and module dependencies.
4. Complete `spec.md`: BDD requirements, clarification questions, references.
5. Complete `tasks.md`: task/subtask breakdown and implementation order.
6. Complete `checklist.md`: behavior-to-test mapping + test outcomes.
7. Decide E2E based on importance/complexity; if E2E is not suitable, add integration coverage.
8. If users respond to clarification questions, mark related checkboxes and review `spec.md` / `tasks.md` / `checklist.md` updates.
9. Obtain explicit "implementation can start" approval again after updates.
10. Start code changes.
11. Backfill actual checkbox status and results in `tasks.md` and `checklist.md`.

## Document authoring rules

- `spec.md`: use BDD keywords `GIVEN / WHEN / THEN / AND / Requirements`.
- `tasks.md`: each main task must use `## **Task N: [Task Title]**`; body describes purpose + requirement mapping; tasks use `- N. [ ]`, subtasks use `- N.x [ ]`.
- `checklist.md`: must use `- [ ]` format and no tables; treat as a living template; include clarification/approval gate and update `PASS/FAIL/BLOCKED/NOT RUN/N/A` with real results.

## Testing strategy references

- Unit tests: `references/testing-unit.md`
- Property-based tests: `references/testing-property-based.md`
- Integration tests: `references/testing-integration.md`
- E2E test decision guide: `references/testing-e2e.md`

## License

MIT License. See `LICENSE`.
