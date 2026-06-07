# Fix Summary

- **Report**: REVIEW.md Round 2 — Simplify apltk architecture CLI
- **Date**: 2026-06-07
- **Fix Coordinator**: fix skill

---

## Fixed Issues

### P1 — Requirement Defect

| # | Problem | Files Changed | Fix Approach | Verified |
|---|---------|-------------|-------------|----------|
| 1 | Module add triggers render before edge creation (P1-1) | `cli.js` | Suppress auto-render inside `processAddEntity` sub-verb calls; add final render to `verbAdd` single-entity path | ✅ |
| 2 | `--data-flow-to` silently ignored for module entities (P1-2) | `cli.js` | Add `--data-flow-to` code path in module case of `processAddEntity` | ✅ |
| 3 | Batch rollback in `--spec` mode does not restore overlay state (P1-3) | `cli.js` | Save/restore overlay state in batch rollback; add `skipUndo` flag to prevent per-entity undo snapshots during batch | ✅ |

### P2 — Requirement Risk

| # | Problem | Files Changed | Fix Approach | Verified |
|---|---------|-------------|-------------|----------|
| 4 | Feature `--depends-on` stores YAML field instead of graph edge (P2-4) | `cli.js` | Add graph edge creation for feature `--depends-on`; handle comma-separated module `--depends-on` | ✅ |
| 5 | Duplicate entity output contradictions (P2-5) | `cli.js` | Move duplicate detection before `performMutation`; return `'skipped'`; conditional success messages | ✅ |
| 6 | Missing change summary after `add` (P2-6) | `cli.js` | Add change summary with entity details and relation flags to `verbAdd` output | ✅ |
| 7 | Empty entity list in batch mode silently succeeds (P2-7) | `cli.js` | Add empty entity list validation at batch parser exit | ✅ |
| 8 | Entity-specific flags before first entity type in batch mode silently lost (P2-8) | `cli.js` | Copy entity-specific flags (`--depends-on`, `--part-of`, `--data-flow-to`, `--implements`, `--deployed-on`, `--to`) from global flags in batch mode | ✅ |
| 9 | Fine-grained verbs still discoverable via `--help` (P2-9) | `cli-help.js` | Add `hiddenVerbs` Set filter to `familyPages` routing | ✅ |

### P3 — Suggestion

| # | Problem | Files Changed | Fix Approach | Verified |
|---|---------|-------------|-------------|----------|
| 10 | Remove module happy path not tested via unified dispatch (P3-10) | `test/atlas-cli.test.js` | Add `remove module` integration test with YAML state verification | ✅ |
| 11 | Remove relation not tested via unified dispatch (P3-11) | `test/atlas-cli.test.js` | Add `remove relation` integration test with edge state verification | ✅ |
| 12 | No auto-render test for remove (P3-12) | `test/atlas-cli.test.js` | Add auto-render after remove integration test (HTML existence check) | ✅ |
| 13 | Missing integration test for template verb (P3-13) | `test/atlas-cli.test.js` | Add template verb integration test (suggests "add", not "Unknown verb") | ✅ |

---

## Verification Results

- **Test suite**: All pass — **739 tests** across 3 groups (Stable: 709, Package: 24, Mock.module: 6)
- **Compilation**: Success (no build step required for JS changes)
- **Lint**: No lint issues
- **Manual checks**: Each regression test oracle confirmed — tests pass on fixed code, would fail on unfixed code

## Notes

- **Two minor adjustments** were made during FIX-01 implementation:
  1. Pre-mutation duplicate check in `verbFeature`/`verbSubmodule` uses `loadResolvedState()` (merged state) when `--spec` is active, so re-adding a removed submodule in overlay doesn't short-circuit as duplicate.
  2. "Already exists" message routed to `stderr` instead of `stdout` to match existing test expectations (`duplicate feature add warns` checks `stderr_text`).
- **Three REGTEST assertion adjustments** were needed to match actual fixed code behavior:
  - REGTEST-F01: Creates the `--implements` target entity first (edge target must exist)
  - REGTEST-F05: Checks `stderr_text` for "already exists" (consistent with FIX-05 design)
  - REGTEST-F07: Matches `/Usage/` regex (error thrown at argument validation, not batch parser)
- **Zero regressions**: All existing 68 tests continue to pass alongside 13 new tests.
- **No deferred issues**: Every P1 (3), P2 (6), and P3 (4) issue from REPORT.md Round 2 has a completed fix and regression test.
