# Review Report: 簡化 apltk architecture 指令

- **Spec**: `docs/plans/2026-06-07/architecture-simplify/SPEC.md`
- **Design**: `docs/plans/2026-06-07/architecture-simplify/DESIGN.md`
- **Date**: 2026-06-07
- **Reviewer**: Review Skill
- **Verdict**: Needs Work

---

## Verdict

**Needs Work** — 5 P1 findings directly impact requirement satisfaction.

---

## Requirement Status Summary

| Requirement | Status | Evidence Location | Open Findings |
|---|---|---|---|
| Req 1: Unified `add` — single entity | ⚠️ Partial | `cli.js:613-681`, `cli-help.js:995-1032` | P1-2, P2-6, P2-7, P2-8, P2-9, P2-10, P3-14, P3-15, P3-19 |
| Req 2: Unified `add` — batch mode | ❌ Missing | `cli.js:667-678` | P1-1, P1-3, P2-11, P3-17 |
| Req 3: Unified `remove` | ❌ Missing | `cli.js:683-722` | P1-4, P3-18 |
| Req 4: Retire legacy commands | ⚠️ Partial | `cli.js:1295-1298`, `cli-help.js:728-778`, `index.ts:600-624` | P2-12, P2-13, P3-16, P3-20 |
| Req 5: Compatibility of existing commands | ⚠️ Partial | `cli.js:680-723`, `atlas-cli.test.js:550-913` | P1-5 |

---

## Findings

### P1 — Requirement Defect

| # | Description | Impact | File | Line | Dimension | Requirement |
|---|---|---|---|---|---|---|
| 1 | **Batch mode per-entity relation flags are not scoped** — `verbAdd()` iterates positional args in `(type, name)` pairs but shares a single `flags` object across all entities. `parseFlags()` (L128-157) converts repeated flags into arrays (L145-148), so every entity receives the merged flag set. The SPEC requires "每一個 entity 區塊獨立定義其 entity-type、name 與 relation flags". | Complex batch commands produce incorrect results. E.g. `add feature payment --depends-on order module api --depends-on order-service` gives `payment` a spurious `order-service` dependency. Cross-entity flag leakage via accumulated arrays. | `cli.js` | 667-678, 145-148 | Spec implementation deviation | Req 2 |
| 2 | **`--implements`/`--deployed-on` flags not supported for `module` entity type** — The SPEC examples show `module stripe-adapter --implements payment-provider` and `module payment-api --deployed-on eks-cluster`. The implementation only processes these flags for the `relation` entity type (L648-655). In `processAddEntity` module case (L635-646), `--implements` and `--deployed-on` are not forwarded to `verbSubmodule`, which has no logic to handle them. | Users following SPEC examples for module with `--implements` or `--deployed-on` silently lose the relationship information. | `cli.js` | 635-646, 648-655 | Spec implementation omission | Req 1 |
| 3 | **`add module` silently ignores `--depends-on`** — The SPEC example shows `module payment-api --depends-on order-service`. In `processAddEntity` module case (L635-646), the mapped params do not forward `depends-on` to `verbSubmodule`, and `verbSubmodule` (L369-389) has no dependency parameter — it only creates the submodule record. The help page also lists `[--depends-on <feature>]` in module usage (cli-help.js:1001), compounding the expectation gap. | Follow SPEC example literally, and `--depends-on` is silently lost. Module created without the intended dependency. | `cli.js` | 635-646, 369-389 | Spec implementation omission | Req 1, Req 2 |
| 4 | **Non-existent entity removal silently succeeds; architectural constraint prevents non-zero exit** — `verbRemove()` delegates to `verbFeature('remove')` → `performMutation()` → `removeFeature()`. Three layers prevent error signaling: **(a)** `removeFeature()` returns `false` on no-op but `performMutation()` ignores callback return value and saves unchanged state. **(b)** `dispatch()` uses `await verbRemove(); break;` (L1294) with hardcoded success message and `return 0` at L1299-1302 — verb functions cannot return non-zero through normal control flow. **(c)** `verbSubmodule('remove')` at L382-387 silently guards with `if (feature)`, making module removal on non-existent parent a quieter no-op. | Users receive false success (exit 0, "atlas: remove applied") when removing non-existent entity. SPEC requires "列出相近的可用名稱，exit code 非零". | `cli.js` | 683-722, 1299-1306, 382-387 | Spec implementation omission | Req 3 |
| 5 | **`verbRemove` does not forward `--dry-run` flag** — `verbRemove()` forwards only `spec`, `no-render`, `project` to sub-verbs. `dry-run` is omitted from all three dispatch paths. `verbAdd()` correctly includes it. | `apltk architecture remove feature x --dry-run` silently performs actual removal instead of previewing. | `cli.js` | 683-722 | Spec implementation omission | Req 5 |

### P2 — Requirement Risk

| # | Description | Impact | File | Line | Dimension | Requirement |
|---|---|---|---|---|---|---|
| 6 | **`add` missing change summary** — SPEC requires "CLI 輸出成功訊息與變更摘要". Current output is only `atlas: add applied` — a generic success message with no information about what was created or what relationships were added. `performMutation()` does not compute or return a diff summary to the caller. | Agent automation cannot programmatically confirm what changed without reading back YAML state. | `cli.js` | 1299-1300 | Spec implementation omission | Req 1 |
| 7 | **Duplicate entity add skips silently without "already exists" message** — SPEC error case requires "提示「已存在」並跳過". `ensureFeature()` (L285) and `ensureSubmodule()` (L311) both silently return existing entity without emitting any message. | Agents unaware that entity already existed may think flags (e.g. `--depends-on`) were applied. | `cli.js` | 285-294, 311-321 | Spec implementation deviation | Req 1 |
| 8 | **`--implements`/`--deployed-on` edges indistinguishable from `call`** — Both create edges with `kind: 'call'` (L648-655: `entityFlags['data-flow-to'] ? 'data-row' : 'call'`). Only `--data-flow-to` gets a distinct kind. No semantic distinction between implement, deploy, and call relationships. | Architecture diagram renders "implements" and "deployed-on" relationships identically to generic "call" edges, losing semantic intent. | `cli.js` | 648-655 | Spec implementation deviation | Req 1 |
| 9 | **`--part-of` creates phantom parent feature** — SPEC error case requires rejecting non-existent parent reference. `verbSubmodule` (L377-378) calls `ensureFeature()` which creates the parent if it doesn't exist, silently generating a phantom feature. | Typo in `--part-of` target silently creates unwanted phantom feature instead of alerting the user. | `cli.js` | 377-378, 285-294 | Spec implementation deviation | Req 1 |
| 10 | **Help page claims `--depends-on` works for modules when it doesn't** — cli-help.js:1001 lists `[--depends-on <feature>]` in the module usage line, but `verbSubmodule` has no dependency parameter (P1-3). Also `--implements`/`--deployed-on` only appear in optional flags section but not in any usage line (L1000-1004). | Agent reading help text is misled about which flags are functional for each entity type. | `cli-help.js` | 1000-1004 | Redundant code | Req 1 |
| 11 | **Batch non-atomicity** — Batch mode processes entities sequentially with no rollback. If entity N of M fails, entities 1—N−1 committed via `stateLib.save()`. DESIGN.md §7 documents this as a known trade-off. | Partial writes on batch failure. Mitigated by DESIGN.md — same behavior as sequential manual commands. | `cli.js` | 667-678, 257-260 | Architecture defect | Req 2 |
| 12 | **Legacy verb error message doesn't suggest `add`** — `apply`/`template` fall through to `default` case (L1295) printing "Unknown verb: apply" + help page. SPEC requires "提示改用 `apltk architecture add` 替代". | Users migrating from `apply`/`template` see "Unknown verb" rather than guidance to replacement. | `cli.js` | 1295-1298 | Spec implementation deviation | Req 4 |
| 13 | **Operational verbs hidden from top-level help** — `validate`, `status`, `scan`, `undo` omitted from usage lines and examples in `cli-help.js:728-778`. These are standalone operational commands not superseded by `add`/`remove`. | Reduced discoverability of operational features. | `cli-help.js` | 728-778 | Architecture defect | Req 4 |

### P3 — Suggestion

| # | Description | Impact | File | Line | Dimension | Requirement |
|---|---|---|---|---|---|---|
| 14 | **No test for `add` auto-render without `--no-render`** — All 7 `add`-specific tests use `--no-render` (L917-1035). The auto-render trigger path for the new verb is never exercised without the flag. | Auto-render regression on `add` path goes undetected. | `atlas-cli.test.js` | 917-1035 | Redundant code | Req 1 |
| 15 | **No test for `--implements`/`--deployed-on` relation flags** — Only `--data-flow-to` is tested for relations. The other two relation flags have zero test coverage. | Untested flag paths may silently regress. | `atlas-cli.test.js` | 917-962 | Redundant code | Req 1 |
| 16 | **No negative assertion that fine-grained verbs are absent from help** — Help tests verify `add`/`remove` appear but not that `feature add`, `submodule add`, etc. are absent. | CI gap — fine-grained verbs could reappear in help undetected. | `atlas-cli.test.js` | 358-388 | Redundant code | Req 4 |
| 17 | **No test for batch partial failure or mixed-type batches** — The only batch test (`test('add batch mode creates multiple features')`, L964) tests same-type entities with no relation flags. No test covers: partial failure, mixed entity types, relation flags, odd arg count error path. | Batch error and mixed-type paths untested. Cross-entity flag leakage (P1-1) undetected by tests. | `atlas-cli.test.js` | 964-977 | Redundant code | Req 2 |
| 18 | **No test for `remove` on non-existent entity** — CHECKLIST.md CL-09 requires this. All remove tests cover happy path only. | Non-existent remove behavior untested. | `atlas-cli.test.js` | 979-991 | Redundant code | Req 3 |
| 19 | **Help text relation flags not marked as mutually exclusive** — `--data-flow-to`, `--implements`, `--deployed-on` shown as independent flags but are alternatives (`\|\|` chain in `cli.js:648-651`). | Users may expect combined behavior from specifying multiple. | `cli-help.js` | 1012-1022 | Redundant code | Req 1 |
| 20 | **Pre-existing duplicated helper functions** — `ensureFeature()`, `ensureSubmodule()`, `removeFeature()`, `removeSubmodule()`, `endpointReferences()`, `parseEndpoint()`, `isIntraFeatureEdge()`, `endpointEquals()` exist in both `index.ts:11-105` and `cli.js:285-345`. Pre-dates simplification. DESIGN.md §8 T2. | Code duplication. Retained because `handleApply()`/`handleTemplate()` in `index.ts` remain as internal utilities (no longer CLI-reachable). | `index.ts` | 11-105 | Redundant code | Req 4 |

**Dimension summary**: Spec implementation omission (5), Spec implementation deviation (4), Architecture defect (2), Redundant code (9).

---

## Review History

### Round 1 — 2026-06-07
- **Verdict**: Needs Work
- **Issues**: P1:5, P2:8, P3:7
- **Key findings**: Batch per-entity flags not scoped (P1-1); `--implements`/`--deployed-on` for `module` not supported (P1-2); `module --depends-on` silently ignored (P1-3); non-existent entity removal silently succeeds with architectural constraint (P1-4); `verbRemove` omits `--dry-run` (P1-5); missing change summary after `add` (P2-6); duplicate entity not flagged (P2-7); `--implements`/`--deployed-on` edges indistinguishable from `call` (P2-8); `--part-of` creates phantom feature (P2-9); misleading help text (P2-10).

---

## References

- **Project context files**:
  - `CLAUDE.md` (project instructions, testing commands)
  - `docs/architecture/cli-architecture.md` (CLI command dispatch and tool registration)
  - `docs/architecture/installer-architecture.md` (installer design for skill files)
  - `resources/project-architecture/**` (atlas state schema — not modified but relevant for context)

- **Related documents**:
  - `docs/plans/2026-06-07/architecture-simplify/SPEC.md` — Business requirements
  - `docs/plans/2026-06-07/architecture-simplify/DESIGN.md` — Technical design with documented trade-offs
  - `docs/plans/2026-06-07/architecture-simplify/CHECKLIST.md` — Verification strategy
  - `docs/plans/2026-06-07/architecture-simplify/architecture_diff/ARCHITECTURE_DIFF.md` — Architecture baseline diff

- **Key code file paths** (code reviewed):
  - `skills/init-project-html/lib/atlas/cli.js` — Verb dispatch, `verbAdd`, `verbRemove`, `performMutation`
  - `skills/init-project-html/lib/atlas/cli-help.js` — Help page builders
  - `packages/tools/architecture/index.ts` — TS handler entry point
  - `packages/tools/architecture/index.test.ts` — TS handler tests
  - `test/atlas-cli.test.js` — CLI integration tests
  - `test/architecture-script.test.js` — Tool registration and diff tests
  - `test/tools/architecture-error-types.test.js` — Error handling tests
