# Review Report: 簡化 apltk architecture 指令

- **Spec**: `docs/plans/2026-06-07/architecture-simplify/SPEC.md`
- **Design**: `docs/plans/2026-06-07/architecture-simplify/DESIGN.md`
- **Date**: 2026-06-08
- **Reviewer**: Review Skill
- **Round**: 6
- **Verdict**: Needs Work

---

## Verdict

**Needs Work** — The change does not yet satisfy the planned business requirements. Requirements 1, 2, 3, 4, and 5 each have current P1 defects.

---

## Requirement Status Summary

| Requirement | Status | Evidence Location | Open Findings |
|---|---|---|---|
| Req 1: Unified `add` — single entity | Partial | `skills/init-project-html/lib/atlas/cli.js:735-1004`, `skills/init-project-html/lib/atlas/schema.js:45-50`, `skills/init-project-html/lib/atlas/schema.js:293-297` | P1-1, P1-2, P1-3 |
| Req 2: Unified `add` — batch mode | Partial | `skills/init-project-html/lib/atlas/cli.js:1011-1251`, `skills/init-project-html/lib/atlas/state.js:524-538` | P1-4, P1-5, P1-6, P1-7 |
| Req 3: Unified `remove` | Partial | `skills/init-project-html/lib/atlas/cli.js:336-345`, `skills/init-project-html/lib/atlas/cli.js:1298-1354` | P1-8 |
| Req 4: Retire legacy commands | Partial | `skills/init-project-html/lib/atlas/cli.js:1922-1932`, `skills/init-project-html/lib/atlas/cli-help.js:789`, `skills/design/references/architecture.md:39-81` | P1-9, P1-10 |
| Req 5: Compatibility of existing commands | Partial | `skills/init-project-html/lib/atlas/cli.js:1550-1559`, `skills/init-project-html/lib/atlas/cli.js:1616-1630`, `skills/init-project-html/lib/atlas/cli.js:1680-1689` | P1-7, P1-11 |

---

## Findings

### P1 — Requirement Defect

| # | Description | Impact | File | Line | Dimension | Requirement |
|---|---|---|---|---|---|---|
| 1 | Unified `add` writes relation edge kinds that the schema rejects. The CLI emits `dependency`, `implements`, and `deployed-on` edge kinds from relation flags, while `EDGE_KINDS` only allows `call`, `return`, `data-row`, and `failure`. | Commands can return success while leaving atlas YAML invalid under `apltk architecture validate`. | `skills/init-project-html/lib/atlas/cli.js`, `skills/init-project-html/lib/atlas/schema.js` | `764`, `805`, `817`, `293` | Spec implementation deviation / architecture defect | Req 1 |
| 2 | `add module ... --deployed-on <target>` treats the deployment target as an atlas endpoint even though referential integrity requires endpoint features/submodules to exist in the atlas. | The documented `--deployed-on eks-cluster` relationship shape can be written as an invalid edge target. | `skills/init-project-html/lib/atlas/cli.js`, `skills/init-project-html/lib/atlas/schema.js` | `816`, `817`, `402-408` | Spec implementation deviation | Req 1 |
| 3 | `--implements` and `--data-flow-to` validate only the target feature slug, not the target submodule. | `feature/submodule` targets can reference missing submodules and still be accepted by unified `add`. | `skills/init-project-html/lib/atlas/cli.js`, `test/atlas-cli.test.js` | `797-803`, `873-879`, `1206` | Spec implementation omission | Req 1 |
| 4 | Failed single-entity `add feature ... --depends-on missing` writes the feature before dependency target validation fails. | The command exits non-zero but leaves partial state on disk, so the requested relationship fails while the entity is still added. | `skills/init-project-html/lib/atlas/cli.js` | `739-777` | Spec implementation deviation | Req 1, Req 2 |
| 5 | Batch entity blocks are not independent because globally parsed relation flags are copied into later entity blocks that do not define their own flags. | A batch command can create unintended relationships for entities that did not specify those flags, violating the per-entity block semantics. | `skills/init-project-html/lib/atlas/cli.js` | `1064-1070` | Spec implementation deviation | Req 2 |
| 6 | Successful `add --spec` batch mode exits with `overlayDir is not defined` after writing overlay state. The batch-level undo/history code references `overlayDir` outside the block where it was declared. | The operation writes the spec overlay but returns failure, so the CLI does not provide the required successful batch completion behavior. | `skills/init-project-html/lib/atlas/cli.js` | `1105-1107`, `1133-1136`, `1175-1177`, `1219-1222` | Spec implementation deviation | Req 2, Req 5 |
| 7 | Failed batch rollback restores YAML state but leaves earlier mutation undo/history side effects because feature/module calls do not forward the batch `skipUndo` flag into their delegated mutations. | A failed all-or-nothing batch can leave mutation traces outside the restored YAML state. | `skills/init-project-html/lib/atlas/cli.js`, `skills/init-project-html/lib/atlas/state.js` | `739-747`, `781-790`, `1121-1128`, `524-538` | Spec implementation deviation | Req 2 |
| 8 | Unified `remove module` deletes the submodule and local feature edges but leaves root-level cross-feature edges that reference the removed module. | Removed modules can remain connected by dangling cross-feature relations, so cascade removal is incomplete. | `skills/init-project-html/lib/atlas/cli.js` | `336-345`, `1298-1354` | Spec implementation omission / architecture defect | Req 3 |
| 9 | Direct fine-grained help remains exposed for hidden verbs. `apltk architecture edge add --help` can still return the fine-grained action help page. | Agents can discover hidden fine-grained verbs through CLI help output despite Req 4's hidden-help requirement. | `skills/init-project-html/lib/atlas/cli.js`, `skills/init-project-html/lib/atlas/cli-help.js` | `1927-1932`, `789` | Spec implementation deviation | Req 4 |
| 10 | Active skill documentation still teaches fine-grained command usage such as `feature add`, `submodule add`, `function add`, and `edge add`. | Agents can discover and use the retired surface through project instructions even though Req 4 says agents should not discover or use those verbs. | `skills/design/references/architecture.md`, `skills/update-project-html/SKILL.md` | `39-81`, `64-75` | Spec implementation omission | Req 4 |
| 11 | `diff --spec` can generate a viewer that references after-side HTML files that do not exist when the overlay was produced by `add --spec --no-render`. | The diff command reports success but the before/after viewer can point at missing after pages instead of a complete comparison. | `skills/init-project-html/lib/atlas/cli.js` | `1550-1559`, `1616-1630`, `1680-1689` | Spec implementation omission | Req 5 |

**Dimension summary**: Spec implementation deviation (6), Spec implementation omission (4), Architecture defect (2).

---

## Review History

### Round 6 — 2026-06-08
- **Verdict**: Needs Work
- **Issues**: P1:11
- **Key findings**: Current implementation still has requirement-level defects across all five requirements. Newly confirmed blockers include schema-invalid relation kinds, partial writes on failed single-entity add, `add --spec` batch completion failure, incomplete module cascade removal, fine-grained command discovery through help/docs, and incomplete `diff --spec` output after `--no-render`.

### Round 5 — 2026-06-08
- **Verdict**: Needs Work
- **Issues**: P1:1, P2:3, P3:10
- **Key findings**: Round 5 found batch `relation --depends-on` validation divergence. Current review confirms that finding is fixed by `validateEntity` accepting `--depends-on`, but additional P1 defects remain.

### Round 4 — 2026-06-08
- **Verdict**: Needs Work
- **Issues**: P1:5, P2:12, P3:10
- **Key findings**: Reported duplicate edge creation after skip, missing dependency target validation, missing `--spec` directory validation, submodule removal tracking gap, and missing `diff --spec` support.

### Round 3 — 2026-06-07
- **Verdict**: Needs Attention
- **Issues**: P1:0, P2:10, P3:14
- **Key findings**: Reported relation `--depends-on`, change summary, batch pre-validation, skip tracking, remove relation kind forwarding, remove feature cleanup, skill docs, and legacy intercept concerns.

### Round 2 — 2026-06-07
- **Verdict**: Needs Work
- **Issues**: P1:3, P2:6, P3:4
- **Key findings**: Reported module add render timing, module data-flow behavior, batch spec-mode rollback, feature dependency edge creation, duplicate entity output, empty entity list validation, global flag copying, and fine-grained help hiding concerns.

### Round 1 — 2026-06-07
- **Verdict**: Needs Work
- **Issues**: P1:5, P2:8, P3:7
- **Key findings**: Reported batch flag scoping, module relation flag support, non-existent entity removal behavior, output, and help text issues.

---

## References

- `CLAUDE.md`
- `AGENTS.md`
- `docs/plans/2026-06-07/architecture-simplify/SPEC.md`
- `docs/plans/2026-06-07/architecture-simplify/DESIGN.md`
- `docs/plans/2026-06-07/architecture-simplify/CHECKLIST.md`
- `docs/plans/2026-06-07/architecture-simplify/FIX.md`
- `docs/architecture/cli-architecture.md`
- `skills/init-project-html/lib/atlas/cli.js`
- `skills/init-project-html/lib/atlas/cli-help.js`
- `skills/init-project-html/lib/atlas/schema.js`
- `skills/init-project-html/lib/atlas/state.js`
- `packages/tools/architecture/index.ts`
- `test/atlas-cli.test.js`
- `test/architecture-script.test.js`
- `packages/tools/architecture/index.test.ts`
- `skills/design/references/architecture.md`
- `skills/update-project-html/SKILL.md`
