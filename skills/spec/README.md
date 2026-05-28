# spec

A shared planning skill for feature work. It centralizes creation and maintenance of `spec.md`, `tasks.md`, `checklist.md`, `contract.md`, `design.md`, and when needed shared `coordination.md` or `preparation.md` so other skills can reuse one consistent approval-gated spec workflow with risk-driven test planning from `test-case-strategy`.

## Core capabilities

- Generates single-spec plans under `docs/plans/{YYYY-MM-DD}/{change_name}/`.
- Generates multi-spec parallel batches under `docs/plans/{YYYY-MM-DD}/{batch_name}/{change_name}/` with a shared `coordination.md`, while keeping every batch spec independently completable and safe to implement concurrently.
- Optionally generates a batch-level `preparation.md` only when minimal non-business prerequisite work must land before specs can be implemented in parallel.
- Uses shared templates so spec-first and brownfield workflows follow the same planning structure.
- Requires clarification handling and explicit user approval before implementation starts.
- Backfills task and checklist status after implementation and testing.
- Keeps requirement, task, and test coverage mapping traceable.
- Uses `test-case-strategy` to choose test levels, define meaningful oracles, and add focused unit drift checks to atomic implementation tasks.
- Standardizes **`design.md` / `contract.md` as high-level context** (architecture + external truth, `INT-###`/`EXT-###` anchors)—**`tasks.md` remains the sole file-level execution queue** implementing that context.

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
│       ├── coordination.md
│       └── preparation.md
└── scripts/
    └── create-specs
```

## Quick start

```bash
WORKSPACE_ROOT=/path/to/target-project
apltk create-specs "Membership upgrade flow" \
  --change-name membership-upgrade-flow \
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
apltk create-specs "Membership write path" \
  --change-name membership-write-path \
  --batch-name membership-cutover \
  --with-coordination \
  --output-dir "$WORKSPACE_ROOT/docs/plans"
```

Parallel batch with prerequisite preparation:

```bash
apltk create-specs "Membership write path" \
  --change-name membership-write-path \
  --batch-name membership-cutover \
  --with-coordination \
  --with-preparation \
  --output-dir "$WORKSPACE_ROOT/docs/plans"
```

Use `--with-preparation` only when shared prerequisite work is required before parallel implementation. That file must stay minimal and must not contain core business logic, target user behavior, or member-spec implementation tasks.

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
- `tasks.md`: use `## **Task N: ...**` and atomic implementation queue items with allowed scope, output, completion condition, verification hook, and unit drift check.
- `checklist.md`: use `- [ ]` only, adapt items to real scope, record actual results, and map behavior risks to test IDs plus oracles selected through `test-case-strategy`.
- `contract.md`: cite-backed **facts/limits/security** + **`EXT-###` anchors** (coarser than **`tasks.md`**); **no parallel checklist**—task rows may cite `EXT-###` when useful.
- `design.md`: architecture + coarse **`INT-###` ordering/coupling hints** for **authoring** **`tasks.md`**; **no file-level checkbox mirror**; vendor detail belongs in **`contract.md`**.
- `coordination.md`: for multi-spec batches only, record ownership boundaries, replacement direction, file ownership guardrails, known collision candidates, pre-agreed edit rules for shared surfaces, shared API/schema freeze or additive-only rules, compatibility-shim retention rules, merge order, and cross-spec integration checkpoints, but never use it to make one spec depend on another spec's implementation before it can be completed.
- `preparation.md`: optional batch-level prerequisite plan used only when specs cannot be made parallel-safe without prior shared work; keep it tasks-like, minimal, verified, and free of core business logic or target outcomes.
- If clarification responses change the plan, update the docs and obtain approval again before coding.

## Notes

- `scripts/...` and `references/...` remain skill-folder paths when you need the raw assets, but `apltk create-specs` is the preferred command surface.
- The generator replaces `[YYYY-MM-DD]`, `[Feature Name]`, `[功能名稱]`, `[change_name]`, and `[batch_name]` placeholders.
- If a batch split produces specs that must land in a functional sequence, or still leaves unresolved shared-file collisions, re-slice the work so each spec becomes independently implementable, testable, mergeable, and parallel-safe before coding starts.
