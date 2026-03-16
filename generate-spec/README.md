# generate-spec

A shared planning skill for feature work. It centralizes creation and maintenance of `spec.md`, `tasks.md`, and `checklist.md` so other skills can reuse one consistent approval-gated spec workflow.

## Core capabilities

- Generates `docs/plans/{YYYY-MM-DD}_{change_name}/spec.md`, `tasks.md`, and `checklist.md` in one step.
- Uses shared templates so spec-first and brownfield workflows follow the same planning structure.
- Requires clarification handling and explicit user approval before implementation starts.
- Backfills task and checklist status after implementation and testing.
- Keeps requirement, task, and test coverage mapping traceable.

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
│       └── checklist.md
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

Default output:

```text
docs/plans/<today>_membership-upgrade-flow/
├── spec.md
├── tasks.md
└── checklist.md
```

## Authoring rules

- `spec.md`: use BDD keywords `GIVEN / WHEN / THEN / AND / Requirements`.
- `tasks.md`: use `## **Task N: ...**`, `- N. [ ]`, and `- N.x [ ]`.
- `checklist.md`: use `- [ ]` only, adapt items to real scope, and record actual results.
- If clarification responses change the plan, update the docs and obtain approval again before coding.

## Notes

- `scripts/...` and `references/...` are skill-folder paths, not project-folder paths.
- The generator replaces `[YYYY-MM-DD]`, `[Feature Name]`, `[功能名稱]`, and `[change_name]` placeholders.
