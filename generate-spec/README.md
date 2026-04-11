# generate-spec

A shared planning skill for feature work. It centralizes creation and maintenance of `spec.md`, `tasks.md`, `checklist.md`, `contract.md`, `design.md`, and when needed `coordination.md` so other skills can reuse one consistent approval-gated spec workflow.

## Core capabilities

- Generates single-spec plans under `docs/plans/{YYYY-MM-DD}/{change_name}/`.
- Generates multi-spec parallel batches under `docs/plans/{YYYY-MM-DD}/{batch_name}/{change_name}/` with a shared `coordination.md`, while keeping every batch spec independently completable and safe to implement concurrently.
- Uses shared templates so spec-first and brownfield workflows follow the same planning structure.
- Requires clarification handling and explicit user approval before implementation starts.
- Backfills task and checklist status after implementation and testing.
- Keeps requirement, task, and test coverage mapping traceable.
- Standardizes external dependency contracts in `contract.md` and architecture/design deltas in `design.md`.

## Repository layout

```text
.
├── SKILL.md
├── README.md
├── LICENSE
├── agents/
│   └── openai.yaml
├── references/
│   └── templates/
│       ├── spec.md
│       ├── tasks.md
│       ├── checklist.md
│       ├── contract.md
│       ├── design.md
│       └── coordination.md
└── scripts/
    └── create-specs
```

## Quick start

```bash
SKILL_ROOT=/path/to/generate-spec
WORKSPACE_ROOT=/path/to/target-project
python3 "$SKILL_ROOT/scripts/create-specs" "Membership upgrade flow" \
  --change-name membership-upgrade-flow \
  --template-dir "$SKILL_ROOT/references/templates" \
  --output-dir "$WORKSPACE_ROOT/docs/plans"
```

Single-spec output:

```text
docs/plans/<today>/membership-upgrade-flow/
├── spec.md
├── tasks.md
├── checklist.md
├── contract.md
└── design.md
```

Parallel batch output:

```bash
python3 "$SKILL_ROOT/scripts/create-specs" "Membership write path" \
  --change-name membership-write-path \
  --batch-name membership-cutover \
  --with-coordination \
  --template-dir "$SKILL_ROOT/references/templates" \
  --output-dir "$WORKSPACE_ROOT/docs/plans"
```

```text
docs/plans/<today>/membership-cutover/
├── coordination.md
└── membership-write-path/
    ├── spec.md
    ├── tasks.md
    ├── checklist.md
    ├── contract.md
    └── design.md
```

## Authoring rules

- `spec.md`: use BDD keywords `GIVEN / WHEN / THEN / AND / Requirements`.
- `tasks.md`: use `## **Task N: ...**`, `- N. [ ]`, and `- N.x [ ]`.
- `checklist.md`: use `- [ ]` only, adapt items to real scope, and record actual results.
- `contract.md`: when external dependencies materially shape the change, record their official-source-backed invocation surface, constraints, and caller obligations in the standard dependency-record format.
- `design.md`: record the architecture/design delta in the standard format, including affected modules, flow, invariants, tradeoffs, and validation plan.
- `coordination.md`: for multi-spec batches only, record shared preparation, ownership boundaries, replacement direction, file ownership guardrails, known collision candidates, pre-agreed edit rules for shared surfaces, shared API/schema freeze or additive-only rules, compatibility-shim retention rules, merge order, and cross-spec integration checkpoints, but never use it to make one spec depend on another spec's implementation before it can be completed.
- If clarification responses change the plan, update the docs and obtain approval again before coding.

## Notes

- `scripts/...` and `references/...` are skill-folder paths, not project-folder paths.
- The generator replaces `[YYYY-MM-DD]`, `[Feature Name]`, `[功能名稱]`, `[change_name]`, and `[batch_name]` placeholders.
- If a batch split produces specs that must land in a functional sequence, or still leaves unresolved shared-file collisions, re-slice the work so each spec becomes independently implementable, testable, mergeable, and parallel-safe before coding starts.
