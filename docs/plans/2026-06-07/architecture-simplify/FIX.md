# Fix Coordinator Prompt: 簡化 apltk architecture 指令

- **Date**: 2026-06-07
- **Source REPORT**: `docs/plans/2026-06-07/architecture-simplify/REPORT.md`
- **Source Spec**: `docs/plans/2026-06-07/architecture-simplify/`
- **Total Issues**: P1: 5, P2: 8, P3: 7
- **Total Regression Tests**: 16

---

## 1. Your Role & Rules

### Mission

Fix all 20 issues identified in REPORT.md for the architecture CLI simplification. The fixes span three source files: `cli.js` (11 behavioral issues), `cli-help.js` (2 documentation issues + 1 clarification), and `index.ts` (1 cleanup). 16 regression tests across 3 test files verify correctness. All changes are confined to the CLI dispatch layer — never modify YAML state management, render, diff, merge, or schema logic.

**Success looks like**: All 20 REPORT.md issues are resolved, all 16 new regression tests pass on the fixed code, the full test suite passes with no regressions, and every commit is atomic.

### Your Role

**You are the fix coordinator.** You do not write code. Your job is to dispatch fix and regression test workers, verify results, resolve merge conflicts, and manage execution flow.

**What you do:**
- Read and understand the issue inventory, dependency analysis, and fix details below
- Spawn workers to execute individual fixes, giving each a self-contained prompt (provided in `fix/*.md`)
- After all fixes pass verification, spawn workers to implement regression tests
- Wait for all workers in a batch to complete, then digest their results
- Run verification commands at each checkpoint
- Decide whether to proceed to the next batch, retry a failed worker, or halt
- Commit all changes in a single commit after the final verification gate passes

**What you NEVER do:**
- Write, edit, or modify any source-code or test file directly
- Skip a verification checkpoint
- Proceed to the next batch when the current batch has not passed verification
- Delegate comprehension — digest every worker result yourself before deciding next steps
- Let workers spawn their own workers (workers are leaf nodes)
- Start regression tests before all fixes in scope are verified
- Defer any REPORT.md issue to a future round — every issue has a complete plan here

### Boundaries

**ALWAYS**
- Run gate verification immediately after every batch
- Extract worker prompts verbatim from `fix/*.md` files — do not rewrite them
- After a worker reports, digest the results before deciding next steps
- Fixes must not conflict with the original spec requirements
- Regression tests must not start before all fix batches pass
- Resolve merge conflicts yourself — the coordinator handles them
- For fix workers marked as Complex: ensure the worker performs systematic debugging (reading related code, tracing execution paths) before applying the fix
- After each batch completes, clean up any temporary branches or worktrees created by workers

**ASK FIRST** — pause and confirm with the user:
- Fix approach conflicts with spec design intent
- Need to add a new external dependency
- Worker has failed twice
- Test regression cannot be quickly diagnosed

**NEVER**
- Write implementation logic or modify source code beyond resolving merge conflict markers
- Let workers spawn sub-workers
- Skip verification and proceed to the next batch
- Modify spec documents (unless the fix reveals a spec error — report it instead)
- Start regression tests before all fixes are verified
- Defer any REPORT.md issue to a future round

### Error Recovery

| Scenario | Response |
|---|---|
| Fix worker reports failure | Retry with the worker's existing context (do not create a new one), giving more specific guidance. At most one retry. |
| Same fix worker fails twice | Pause the entire flow. Preserve successful results from other workers in the same batch. Report to the user. |
| Regression test worker reports failure (test cannot pass) | Check whether the test code is wrong or the fix is incomplete. If test code is wrong, continue the worker to fix it. If the fix is incomplete, go back to the corresponding fix worker. |
| Regression test passes on the unfixed code | The test design is invalid — redesign the oracle and dispatch a new worker. |
| Merge conflicts | Coordinator resolves the conflict, then re-runs the batch gate verification. |
| Fix or regression test breaks existing tests | Pause. Report which test failed and which worker's change caused it. |

---

## 2. Context

### Issue Inventory

| Fix ID | REPORT Issue | Severity | File | Description |
|---|---|---|---|---|
| FIX-01-1 | P1-1 | P1 | cli.js | Batch mode per-entity relation flags not scoped |
| FIX-01-2 | P1-2 | P1 | cli.js | `--implements`/`--deployed-on` not supported for `module` entity type |
| FIX-01-3 | P1-3 | P1 | cli.js | `add module` silently ignores `--depends-on` |
| FIX-01-4 | P1-4 | P1 | cli.js | Non-existent entity removal silently succeeds |
| FIX-01-5 | P1-5 | P1 | cli.js | `verbRemove` does not forward `--dry-run` |
| FIX-01-6 | P2-6 | P2 | cli.js | `add` missing change summary |
| FIX-01-7 | P2-7 | P2 | cli.js | Duplicate entity add silently skips without warning |
| FIX-01-8 | P2-8 | P2 | cli.js | `--implements`/`--deployed-on` edges indistinguishable from `call` |
| FIX-01-9 | P2-9 | P2 | cli.js | `--part-of` creates phantom parent feature |
| FIX-01-11 | P2-11 | P2 | cli.js | Batch non-atomicity (no rollback on partial failure) |
| FIX-01-12 | P2-12 | P2 | cli.js | Legacy verb error message doesn't suggest `add` |
| FIX-02-10 | P2-10 | P2 | cli-help.js | Help page claims `--depends-on` works for modules when it doesn't |
| FIX-02-13 | P2-13 | P2 | cli-help.js | Operational verbs hidden from top-level help |
| FIX-03-19 | P3-19 | P3 | cli-help.js | Help text relation flags not marked as mutually exclusive |
| FIX-03-20 | P3-20 | P3 | index.ts | Pre-existing duplicated helper functions |
| Test-14 | P3-14 | P3 | atlas-cli.test.js | No test for `add` auto-render |
| Test-15 | P3-15 | P3 | atlas-cli.test.js | No test for `--implements`/`--deployed-on` relation flags |
| Test-16 | P3-16 | P3 | atlas-cli.test.js | No negative assertion in help tests |
| Test-17 | P3-17 | P3 | atlas-cli.test.js | No test for batch partial failure or mixed-type |
| Test-18 | P3-18 | P3 | atlas-cli.test.js | No test for `remove` on non-existent entity |

### Fix Dependency Analysis

**File overlaps (hard constraint for parallelization):**

- **`cli.js`**: FIX-01 (all parts) — this is the only file modified by Fix Worker A. All FIX-01 sub-fixes are in one worker prompt.
- **`cli-help.js`**: FIX-02-10, FIX-02-13, FIX-03-19 — all handled by Fix Worker B.
- **`index.ts`**: FIX-03-20 — handled by Fix Worker B.
- **`atlas-cli.test.js`**: REGTEST-01 (all integration tests).
- **`index.test.ts`**: REGTEST-02 (TS handler tests).
- **`architecture-error-types.test.js`**: REGTEST-03 (error path tests).

Fix Worker A (cli.js) and Fix Worker B (cli-help.js + index.ts) have **zero file overlap** → can run in parallel.

**Logical dependencies:**
- REGTEST workers depend on all fix workers completing first
- REGTEST-01 depends on FIX-01 (tests verify cli.js behavior)
- REGTEST-02 depends on FIX-01 (test assertions match new error messages) and FIX-02 (retired code removal)
- REGTEST-03 depends on FIX-01 (new remove error path tests)

### Fix Details (with Regression Test Design)

#### FIX-01: All cli.js behavioral fixes (P1-1 through P2-12)

**Root cause**: Multiple interrelated issues in `cli.js` across batch mode parsing, module relation flag forwarding, remove error handling, and user messaging.

**Files involved**: `skills/init-project-html/lib/atlas/cli.js` — multiple functions

**Fix approach**: Ten tasks handled by one worker:
1. Change dispatch to `return await` for add/remove so verbs can signal non-zero exit
2. Add per-entity flag parsing for batch mode with pre-validation (atomicity)
3. Forward `--implements`/`--deployed-on` from module case to `verbEdge`
4. Forward `--depends-on` from module case to `verbEdge` with kind `dependency`
5. Check feature existence in `verbSubmodule` — throw on non-existent parent instead of creating phantom
6. Check mutation results in verbFeature/verbSubmodule/verbEdge remove — throw if no-op with similar-name list
7. Forward `--dry-run` in all three verbRemove paths
8. Detect duplicate entity in verbFeature/verbSubmodule add — emit warning to stderr
9. Set distinct edge kinds for implements/deployed-on/dependency/data-row/call
10. Add specific error message for apply/template suggesting `add`

See `fix/FIX-01-cli-fixes.md` for the complete worker prompt.

**Complexity**: Complex — requires systematic understanding of dispatch flow, parseFlags, performMutation, and multiple verb functions. Several changes are interdependent (batch parsing, remove error handling).

**Regression tests**: REGTEST-01 (Tests 1-13, Tests 15)

#### FIX-02: Help text and code cleanup (P2-10, P2-13, P3-19, P3-20)

**Root cause**: Help text was oversimplified during whitelisting; operational verbs were accidentally hidden; relation flag documentation unclear. Duplicated helpers in index.ts are dead code after apply/template removal.

**Files involved**: `skills/init-project-html/lib/atlas/cli-help.js`, `packages/tools/architecture/index.ts`

**Fix approach**: Four tasks:
1. Add note in add help clarifying module `--depends-on` creates an edge
2. Restore validate/status/scan/undo to top-level help usage lines
3. Mark relation flags as alternatives in add help
4. Remove retired handleApply/handleTemplate and their duplicated helpers from index.ts

See `fix/FIX-02-docs-cleanup.md` for the complete worker prompt.

**Complexity**: Simple — independent changes in separate files.

**Regression tests**: REGTEST-01 (Test 14, Test 15), REGTEST-02

---

## 3. Execution Plan

### Worker Prompt Index

**Fix Worker Prompts:**

| Fix ID | Worker Prompt File | Description |
|---|---|---|
| FIX-01 | `fix/FIX-01-cli-fixes.md` | All cli.js behavioral fixes (11 issues) |
| FIX-02 | `fix/FIX-02-docs-cleanup.md` | Help text fixes + index.ts cleanup (4 issues) |

**Regression Test Worker Prompts:**

| Test ID | Worker Prompt File | Related Fix | Description |
|---|---|---|---|
| REGTEST-01 | `fix/REGTEST-01-integration.md` | FIX-01 | 15 integration tests in atlas-cli.test.js |
| REGTEST-02 | `fix/REGTEST-02-ts-handler.md` | FIX-01, FIX-02 | 4 test updates in index.test.ts |
| REGTEST-03 | `fix/REGTEST-03-error-paths.md` | FIX-01 | 20+ assertion updates + 3 new tests in architecture-error-types.test.js |

### Batch Schedule

#### Batch 1 — Fix Source Code (Parallel)

**FIX-01 Worker**: All `cli.js` fixes
**FIX-02 Worker**: `cli-help.js` + `index.ts` fixes

- **Strategy**: **Parallel** — zero file overlap between cli.js and cli-help.js/index.ts
- **Gate**:
  - [ ] FIX-01 worker reports success
  - [ ] FIX-02 worker reports success
  - [ ] Verification: `node --test test/atlas-cli.test.js` → all existing tests pass
  - [ ] Verification: `node --test packages/tools/architecture/index.test.ts` → all tests pass
  - [ ] Verification: `node --test test/tools/architecture-error-types.test.js` → all tests pass
  - [ ] Verification: `node --test test/architecture-script.test.js` → all tests pass

#### Batch 2 — Regression Tests (Parallel)

**REGTEST-01 Worker**: Integration tests in `atlas-cli.test.js`
**REGTEST-02 Worker**: Handler tests in `index.test.ts`
**REGTEST-03 Worker**: Error path tests in `architecture-error-types.test.js`

- **Strategy**: **Parallel** — three different test files with no overlap
- **Depends on**: Batch 1 completed
- **Gate**:
  - [ ] All REGTEST workers report success
  - [ ] `node --test test/atlas-cli.test.js` → all tests pass (new + existing)
  - [ ] `node --test packages/tools/architecture/index.test.ts` → all tests pass
  - [ ] `node --test test/tools/architecture-error-types.test.js` → all tests pass
  - [ ] Logical check: each REGTEST oracle is "fails on unfixed code, passes after fix"
  - [ ] Existing test suite passes: `node --test test/architecture-script.test.js`

#### Batch 3 — Final Integration

- **Tasks**: Full test suite, lint, cross-check REPORT.md
- **Strategy**: Sequential
- **Depends on**: Batch 2 completed
- **Gate**:
  - [ ] Full test suite passes: `npm test`
  - [ ] Every issue in REPORT.md (P1-P3) confirmed resolved

---

## 4. Final Verification

- [ ] Every issue in REPORT.md (P1: 5, P2: 8, P3: 7) has a completed fix
- [ ] Every fix has a corresponding regression test that passes
- [ ] All worker prompts in Section 3 have been dispatched and returned success
- [ ] `npm test` passes with no regressions
- [ ] All changes committed in a single commit

---

## 5. References

- **Worker prompt files**:
  - `fix/FIX-01-cli-fixes.md` — All cli.js behavioral fixes (11 REPORT.md issues)
  - `fix/FIX-02-docs-cleanup.md` — Help text + code cleanup (4 REPORT.md issues)
  - `fix/REGTEST-01-integration.md` — 15 integration tests in atlas-cli.test.js
  - `fix/REGTEST-02-ts-handler.md` — Handler delegation tests in index.test.ts
  - `fix/REGTEST-03-error-paths.md` — Error path tests in architecture-error-types.test.js

- **Code files to modify** (across all fixes and regression tests):
  - `skills/init-project-html/lib/atlas/cli.js` — FIX-01 worker
  - `skills/init-project-html/lib/atlas/cli-help.js` — FIX-02 worker
  - `packages/tools/architecture/index.ts` — FIX-02 worker
  - `test/atlas-cli.test.js` — REGTEST-01 worker
  - `packages/tools/architecture/index.test.ts` — REGTEST-02 worker
  - `test/tools/architecture-error-types.test.js` — REGTEST-03 worker

- **Project context files**:
  - `CLAUDE.md` — Project instructions
  - `docs/architecture/cli-architecture.md` — CLI architecture docs
  - `docs/architecture/installer-architecture.md` — Installer design

- **Related documents**:
  - `docs/plans/2026-06-07/architecture-simplify/REPORT.md` — Review findings (source of all issues)
  - `docs/plans/2026-06-07/architecture-simplify/SPEC.md` — Business requirements
  - `docs/plans/2026-06-07/architecture-simplify/DESIGN.md` — Technical design
  - `docs/plans/2026-06-07/architecture-simplify/CHECKLIST.md` — Verification strategy

- **Fix History**:
  <!--
  ### Round 1 — 2026-06-07
  - **Issues fixed**: FIX-01, FIX-02, REGTEST-01, REGTEST-02, REGTEST-03 (P1:5, P2:8, P3:7)
  - **Outcome**: TBD
  - **Key notes**: First fix round for architecture CLI simplification. All issues in REPORT.md addressed.
  -->
