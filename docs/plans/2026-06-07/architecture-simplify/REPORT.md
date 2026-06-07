# Review Report: 簡化 apltk architecture 指令

- **Spec**: `docs/plans/2026-06-07/architecture-simplify/SPEC.md`
- **Design**: `docs/plans/2026-06-07/architecture-simplify/DESIGN.md`
- **Date**: 2026-06-07
- **Reviewer**: Review Skill
- **Verdict**: Needs Work

---

## Verdict

**Needs Work** — 3 P1 findings directly impact requirement satisfaction.

---

## Requirement Status Summary

| Requirement | Status | Evidence Location | Open Findings |
|---|---|---|---|
| Req 1: Unified `add` — single entity | ⚠️ Partial | `cli.js:652-871`, `cli-help.js:1000-1038` | P1-1, P2-4, P2-5, P2-6 |
| Req 2: Unified `add` — batch mode | ❌ Missing | `cli.js:750-858` | P1-2, P1-3, P2-7, P2-8 |
| Req 3: Unified `remove` | ⚠️ Partial | `cli.js:883-937` | P3-10, P3-11, P3-12 |
| Req 4: Retire legacy commands | ⚠️ Partial | `cli.js:1487-1489`, `cli-help.js:51-792`, `index.ts:1-53` | P2-9, P3-13 |
| Req 5: Compatibility of existing commands | ✅ Complete | `cli.js:1094-1107,1371-1447`, `state.js`, `render.js` | None |

---

## Findings

### P1 — Requirement Defect

| # | Description | Impact | File | Line | Dimension | Requirement |
|---|---|---|---|---|---|---|
| 1 | **Module add triggers render before edge creation** — `processAddEntity` module case calls `verbSubmodule()` (L671) which triggers auto-render inside `performMutation()` (L263-264) before the subsequent `verbEdge()` calls create `--implements`/`--deployed-on`/`--depends-on` edges (L685-720). The three edge operations suppress their own renders with `no-render: true`. The final HTML captures only the submodule without its relation edges. **Amplified in batch mode (GA-1)**: each module in a batch triggers an intermediate render, compounding wasted work and incomplete output. In `--spec` mode, incomplete renders also overwrite the HTML diff output. | Users adding a module with relation flags see an incomplete diagram immediately after the command. The edges exist in state but are not reflected visually until an explicit `render` command. | `cli.js` | 671-720, 263-265, 825-831 | Spec implementation deviation | Req 1, Req 2 |
| 2 | **`--data-flow-to` silently ignored for module entities** — `processAddEntity()` module case (L669-722) processes `--implements`, `--deployed-on`, and `--depends-on`, but has no code path for `--data-flow-to`. The SPEC example `module payment-gateway --part-of payment --data-flow-to ledger` creates the module but silently drops the data-flow edge. The relation entity type shows the correct pattern for handling `--data-flow-to`. | Users following the SPEC examples for module with `--data-flow-to` silently lose the relationship without error. | `cli.js` | 669-722 | Spec implementation omission | Req 1, Req 2 |
| 3 | **Batch rollback in `--spec` mode does not restore overlay state** — Both batch rollback paths (L821-836 interleaved, L841-852 simple pairs) save and restore base atlas state via `stateLib.load()`/`stateLib.save()`. When `--spec` is active, all mutations go to the overlay directory via `performMutation()` → `stateLib.saveOverlay()` (L252). The base atlas is never modified in spec mode, so the rollback is a no-op — the overlay retains partial mutations from entities processed before the failure. Additionally, `performMutation()` writes an undo snapshot per entity (L250, 257), preventing atomic recovery even if overlay state were restored. | A partial batch failure in `--spec` mode leaves the overlay in a corrupted partially-applied state. The atomicity guarantee ("若任一 entity 驗證失敗，全部 rollback") is broken. | `cli.js` | 821-852, 245-252 | Spec implementation deviation | Req 2 |

### P2 — Requirement Risk

| # | Description | Impact | File | Line | Dimension | Requirement |
|---|---|---|---|---|---|---|
| 4 | **Feature `--depends-on` stores YAML field instead of graph edge** — Feature `--depends-on` stores as `dependsOn` YAML field rendered as text hyperlink on the feature page. Module `--depends-on` creates a `dependency`-kind graph edge via `verbEdge`. Same flag produces fundamentally different structural outcomes. Comma-separated values passed to module `--depends-on` (via `splitList`) become corrupted endpoint slugs since `verbEdge` expects a single endpoint. | Users cannot predict what `--depends-on` does based on entity type. Module `--depends-on` breaks silently with multiple values. | `cli.js` | 355, 662, 709-720 | Architecture consistency | Req 1 |
| 5 | **Duplicate entity output contradictions** — `verbFeature()` (L360-363) / `verbSubmodule()` (L396-399) write a warning to stderr ("already exists — skipped"), but `verbAdd()` single-entity mode (L869) unconditionally writes `atlas: add applied` to stdout. In batch mode (GA-3), the contradiction amplifies: the batch loop continues processing remaining entities, reports success with misleading entity count (including duplicates), and exits 0 despite partial no-ops. | Users cannot determine from output whether entities were actually added or skipped. The success message contradicts the stderr warning. | `cli.js` | 358-366, 394-400, 869, 836 | Spec implementation deviation | Req 1, Req 2 |
| 6 | **Missing change summary after `add`** — SPEC requires "CLI 輸出成功訊息與變更摘要". Output is a minimal one-line message (`atlas: add applied — feature "payment"`) with no details about what was created, modified, or how many edges were added. `verbMerge()` provides a detailed summary (L1429-1444) as a reference pattern. | Agent automation cannot programmatically confirm what changed without reading back YAML state. | `cli.js` | 869, 836, 856 | Spec implementation omission | Req 1 |
| 7 | **Empty entity list in batch mode silently succeeds** — When the interleaved-flags batch parser (L755-808) encounters no recognized entity types (`feature`/`module`/`relation`), the `entities` array stays empty. Pre-validation is a no-op, processing is a no-op, and the function reports success with exit code 0. Single-entity mode correctly throws "Unknown entity type" for the same input. | Users who mistype an entity type in batch mode get a misleading success message with no error. | `cli.js` | 752-808, 746, 836 | Spec implementation deviation | Req 2 |
| 8 | **Entity-specific flags before first entity type in batch mode silently lost** — `parseFlags()` (L1469) consumes flags like `--depends-on` and strips them from `args` before batch parsing. The interleaved batch parser never sees these tokens. The global flag copy step (L798-802) only forwards `project`/`spec`/`no-render`/`dry-run`/`evidence` — entity-specific flags are not in this set. Single-entity mode handles the same input correctly since flags are passed directly to the sub-verb. | Flags placed before the first entity type in batch mode are silently dropped. | `cli.js` | 767-795, 798-802, 1468-1469 | Spec implementation omission | Req 2 |
| 9 | **Fine-grained verbs still discoverable via `--help`** — The `familyPages` dictionary (L51-233) provides dedicated help pages for `feature`, `submodule`, `function`, `variable`, `dataflow`, `error`, `edge`, `meta`, `actor`. `buildArchitectureHelpPage()` routes `familyPages[verb]` (L790-792), so `apltk architecture feature --help` renders a full usage page with old-style syntax lines. Top-level help correctly omits these verbs per SPEC, but probing `--help` on each fine-grained verb reveals them. | Agents probing `--help` on individual verbs can discover and use the deprecated fine-grained verbs, contradicting the spec requirement that these are hidden. | `cli-help.js` | 51-233, 790-792 | Spec implementation deviation | Req 4 |

### P3 — Suggestion

| # | Description | Impact | File | Line | Dimension | Requirement |
|---|---|---|---|---|---|---|
| 10 | **Remove module happy path not tested via unified dispatch** — The new `apltk architecture remove module <name> --part-of <feature>` syntax has no happy-path test. Only the error case (non-existent module) is tested. | Unified remove dispatch path for modules lacks regression coverage. | `test/atlas-cli.test.js` | ~1098-1126 | Redundant code | Req 3 |
| 11 | **Remove relation not tested via unified dispatch** — `apltk architecture remove relation <from> --to <to>` has no tests at all — neither happy path nor error case. The edge removal logic is tested via old `edge remove --from --to` paths, but the unified `verbRemove` dispatch chain is uncovered. | Unified remove relation dispatch path lacks regression coverage. | `test/atlas-cli.test.js` | — | Redundant code | Req 3 |
| 12 | **No test for auto-render after remove** — All remove tests use `--no-render`. SPEC requires auto-render after remove unless `--no-render`. Shared `performMutation()` render logic is untested for the remove mutation path. | Auto-render regression on remove path goes undetected. | `test/atlas-cli.test.js` | 979-991, 1098-1142 | Redundant code | Req 3 |
| 13 | **Missing integration test for `template` verb** — `atlas-cli.test.js` has a test for `apply` (L1207) but no corresponding test for `template`. The `template` verb is only tested at the unit level in `index.test.ts`. | Template verb retirement has no integration-level regression coverage. | `test/atlas-cli.test.js` | 1207-1213 | Redundant code | Req 4 |

**Dimension summary**: Spec implementation deviation (5), Spec implementation omission (3), Architecture consistency (1), Redundant code (4).

---

## Review History

### Round 1 — 2026-06-07
- **Verdict**: Needs Work
- **Issues**: P1:5, P2:8, P3:7
- **Key findings**: Batch per-entity flags not scoped (P1-1); `--implements`/`--deployed-on` for `module` not supported (P1-2); `module --depends-on` silently ignored (P1-3); non-existent entity removal silently succeeds with architectural constraint (P1-4); `verbRemove` omits `--dry-run` (P1-5); missing change summary after `add` (P2-6); duplicate entity not flagged (P2-7); `--implements`/`--deployed-on` edges indistinguishable from `call` (P2-8); `--part-of` creates phantom feature (P2-9); misleading help text (P2-10).

### Round 2 — 2026-06-07
- **Verdict**: Needs Work
- **Issues**: P1:3, P2:6, P3:4
- **Previously fixed**: All Round 1 P1 findings are resolved — batch per-entity flags properly scoped, module `--implements`/`--deployed-on`/`--depends-on` all forwarded with distinct edge kinds, non-existent entity removal throws with suggestions and non-zero exit, `--dry-run` forwarded in all remove paths. Round 1 P2-6 (change summary), P2-7 (duplicate detection), P2-9 (phantom feature), P2-10 (misleading help text) also fixed or improved. P2-8 (edge kind distinction) fixed with distinct `implements`/`deployed-on`/`dependency` kinds.
- **Remaining P1 issues**: Module add render timing defect (P1-1), `--data-flow-to` for module silently ignored (P1-2), batch spec-mode rollback broken (P1-3).
- **New findings in this round**: 3 P1, 6 P2, 4 P3 — mostly in the interaction between batch mode and spec mode, and between add and render lifecycle.

---

## References

- **Project context files**:
  - `CLAUDE.md` (project instructions, testing commands)
  - `docs/architecture/cli-architecture.md` (CLI command dispatch and tool registration)
  - `skills/init-project-html/lib/atlas/state.js` (state loading/saving — not modified but relevant for understanding rollback behavior)

- **Related documents**:
  - `docs/plans/2026-06-07/architecture-simplify/SPEC.md` — Business requirements
  - `docs/plans/2026-06-07/architecture-simplify/DESIGN.md` — Technical design with documented trade-offs
  - `docs/plans/2026-06-07/architecture-simplify/CHECKLIST.md` — Verification strategy
  - `docs/plans/2026-06-07/architecture-simplify/architecture_diff/ARCHITECTURE_DIFF.md` — Architecture baseline diff
  - `docs/plans/2026-06-07/architecture-simplify/FIX.md` — Previous fix plan (Round 1)
  - `docs/plans/2026-06-07/architecture-simplify/REPORT.md` — Previous Round 1 report

- **Key code file paths** (code reviewed):
  - `skills/init-project-html/lib/atlas/cli.js` — Verb dispatch, `verbAdd`, `verbRemove`, `performMutation`, batch mode
  - `skills/init-project-html/lib/atlas/cli-help.js` — Help page builders, familyPages, top-level help
  - `packages/tools/architecture/index.ts` — TS handler entry point (delegates to cli.js)
  - `packages/tools/architecture/index.test.ts` — TS handler tests
  - `test/atlas-cli.test.js` — CLI integration tests (add/remove/help)
  - `test/tools/architecture-error-types.test.js` — Error handling tests
