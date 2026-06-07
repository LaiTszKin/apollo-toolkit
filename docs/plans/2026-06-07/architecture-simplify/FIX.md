# Fix Coordinator Prompt: 簡化 apltk architecture 指令 (Round 2)

- **Date**: 2026-06-07
- **Source REPORT**: `docs/plans/2026-06-07/architecture-simplify/REPORT.md`
- **Source Spec**: `docs/plans/2026-06-07/architecture-simplify/`
- **Total Issues**: P1: 3, P2: 6, P3: 4
- **Total Regression Tests**: 13

---

## 1. Your Role & Rules

### Mission

Fix all 13 issues identified in REPORT.md Round 2 for the architecture CLI simplification. The fixes span two source files: `cli.js` (8 behavioral issues) and `cli-help.js` (1 documentation issue). 13 regression tests in `test/atlas-cli.test.js` verify correctness. All changes are confined to the CLI dispatch layer — never modify YAML state management, render, diff, merge, or schema logic.

**Success looks like**: All 13 REPORT.md issues are resolved, all 13 new regression tests pass on the fixed code, the full test suite passes with no regressions.

### Your Role

**You are the fix coordinator.** You do not write code. Your job is to understand issues, delegate each fix and regression test to workers, and verify that every issue is resolved without introducing regressions.

**What you do:**
- Read and understand the issue inventory, dependency analysis, and fix details below
- Spawn workers to execute individual fixes, giving each a self-contained prompt (provided in `fix/*.md` files referenced in Section 3)
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
- For fixes marked as Complex (FIX-01): ensure the worker performs systematic debugging before applying the fix
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
| FIX-01 | P1-1 | P1 | cli.js | Module add triggers render before edge creation |
| FIX-01 | P1-2 | P1 | cli.js | `--data-flow-to` silently ignored for module entities |
| FIX-01 | P1-3 | P1 | cli.js | Batch rollback in `--spec` mode does not restore overlay state |
| FIX-01 | P2-4 | P2 | cli.js | Feature `--depends-on` stores YAML field instead of graph edge |
| FIX-01 | P2-5 | P2 | cli.js | Duplicate entity output contradictions |
| FIX-01 | P2-6 | P2 | cli.js | Missing change summary after `add` |
| FIX-01 | P2-7 | P2 | cli.js | Empty entity list in batch mode silently succeeds |
| FIX-01 | P2-8 | P2 | cli.js | Entity-specific flags before first entity type in batch mode silently lost |
| FIX-02 | P2-9 | P2 | cli-help.js | Fine-grained verbs still discoverable via `--help` |
| — | P3-10 | P3 | atlas-cli.test.js | Remove module happy path not tested (regression test only) |
| — | P3-11 | P3 | atlas-cli.test.js | Remove relation not tested (regression test only) |
| — | P3-12 | P3 | atlas-cli.test.js | No auto-render test for remove (regression test only) |
| — | P3-13 | P3 | atlas-cli.test.js | Missing integration test for template verb (regression test only) |

### Fix Dependency Analysis

**File overlaps (hard constraint for parallelization):**

- **`cli.js`**: FIX-01 — all 8 behavioral fixes are in one worker prompt. This worker modifies cli.js only.
- **`cli-help.js`**: FIX-02 — help page fix. No overlap with cli.js.
- **`test/atlas-cli.test.js`**: REGTEST-01 — all regression tests.

Fix Worker A (cli.js) and Fix Worker B (cli-help.js) have **zero file overlap** → they can run in parallel.

All regression tests go in `test/atlas-cli.test.js` → single REGTEST worker (file overlap within the test file requires sequential test writing, handled by one worker prompt).

**Logical dependencies:**
- REGTEST-01 depends on both Fix Worker A and Fix Worker B completing first
- No dependency between Fix Worker A and Fix Worker B (independent files)

### Fix Details (with Regression Test Design)

#### FIX-01: All cli.js behavioral fixes (P1-1 through P2-8)

**Root cause**: Eight interrelated issues in `cli.js` across render timing, missing flag forwarding, batch rollback correctness, and output message quality. All fixed in one worker due to shared file.

**Files involved**: `skills/init-project-html/lib/atlas/cli.js` — multiple functions

**Fix approach** (8 tasks in one worker):
1. Suppress auto-render inside `processAddEntity` sub-verb calls; add final render to `verbAdd` single-entity path
2. Add `--data-flow-to` code path in module case of `processAddEntity`
3. Fix batch rollback to handle `--spec` mode; suppress undo snapshots during batch
4. Add graph edge creation for feature `--depends-on`; handle comma-separated module `--depends-on`
5. Move duplicate detection before `performMutation` in `verbFeature`/`verbSubmodule`; conditional success messages in `verbAdd`
6. Add change summary with entity details to `verbAdd` output
7. Add empty entity list validation in batch parser
8. Copy entity-specific flags from global flags in batch mode

See `fix/FIX-01-cli-behavioral.md` for the complete worker prompt.

**Complexity**: Complex — requires systematic understanding of dispatch flow, `processAddEntity`, `performMutation`, batch parsing, and multiple verb functions. Several changes are interdependent (render timing, batch rollback, output messages).

**Regression tests**: REGTEST-01 (Tests F01 through F08)

#### FIX-02: Hide fine-grained verbs from `--help` routing (P2-9)

**Root cause**: `buildArchitectureHelpPage()` routes `familyPages[verb]` for any verb without checking whether it should be hidden.

**Files involved**: `skills/init-project-html/lib/atlas/cli-help.js` > `buildArchitectureHelpPage()` (L790-792)

**Fix approach**: Add a `hiddenVerbs` Set in the routing check that excludes 9 fine-grained verbs from `familyPages` routing.

**Complexity**: Simple — single-line change with a Set-based filter.

**Regression test**: REGTEST-01 (Test F09)

#### P3-10 through P3-13: Test coverage gaps

These are P3 findings that require only regression tests (no source code changes):
- Remove module happy path via unified dispatch (P3-10)
- Remove relation happy path via unified dispatch (P3-11)
- Auto-render after remove (P3-12)
- Template verb integration test (P3-13)

**Regression tests**: REGTEST-01 (Tests P3-10 through P3-13)

---

## 3. Execution Plan

### Worker Prompt Index

**Fix Worker Prompts:**

| Fix ID | Worker Prompt File | Description |
|---|---|---|
| FIX-01 | `fix/FIX-01-cli-behavioral.md` | All 8 cli.js behavioral fixes (3 P1 + 5 P2 issues) |
| FIX-02 | `fix/FIX-02-help-hidden.md` | Hide fine-grained verbs from `--help` routing (1 P2 issue) |

**Regression Test Worker Prompts:**

| Test ID | Worker Prompt File | Related Fix | Description |
|---|---|---|---|
| REGTEST-01 | `fix/REGTEST-01-integration.md` | FIX-01, FIX-02 | 13 integration tests in atlas-cli.test.js |

### Batch Schedule

#### Batch 1 — Fix Source Code (Parallel — zero file overlap)

**FIX-01 Worker**: All `cli.js` behavioral fixes (8 issues)
**FIX-02 Worker**: `cli-help.js` familyPages routing fix (1 issue)

- **Strategy**: **Parallel** — zero file overlap between cli.js and cli-help.js
- **Gate**:
  - [ ] FIX-01 worker reports success
  - [ ] FIX-02 worker reports success
  - [ ] Verification: `node --test test/atlas-cli.test.js` → all existing tests pass
  - [ ] Verification: `node --test packages/tools/architecture/index.test.ts` → all tests pass
  - [ ] Verification: `node --test test/tools/architecture-error-types.test.js` → all tests pass
  - [ ] Verification: `node --test test/architecture-script.test.js` → all tests pass

#### Batch 2 — Regression Test Implementation

**REGTEST-01 Worker**: 13 integration tests in `atlas-cli.test.js`

- **Strategy**: Sequential (single file, single worker)
- **Depends on**: Batch 1 completed
- **Gate**:
  - [ ] REGTEST-01 worker reports success
  - [ ] `node --test test/atlas-cli.test.js` → all tests pass (new + existing)
  - [ ] Logical check: each REGTEST oracle is "fails on unfixed code, passes after fix"
  - [ ] Existing test suite passes: `node --test packages/tools/architecture/index.test.ts`
  - [ ] Existing test suite passes: `node --test test/tools/architecture-error-types.test.js`
  - [ ] Existing test suite passes: `node --test test/architecture-script.test.js`

#### Batch 3 — Final Integration

- **Tasks**: Full test suite, cross-check REPORT.md
- **Strategy**: Sequential
- **Depends on**: Batch 2 completed
- **Gate**:
  - [ ] Full test suite passes: `npm test`
  - [ ] Every issue in REPORT.md (P1-P3) confirmed resolved

---

## 4. Final Verification

- [ ] Every issue in REPORT.md (P1: 3, P2: 6, P3: 4) has a completed fix
- [ ] Every fix has a corresponding regression test that passes
- [ ] All worker prompts in Section 3 have been dispatched and returned success
- [ ] `npm test` passes with no regressions
- [ ] All changes committed in a single commit

---

## 5. References

- **Worker prompt files**:
  - `fix/FIX-01-cli-behavioral.md` — All 8 cli.js behavioral fixes (P1-1 through P2-8)
  - `fix/FIX-02-help-hidden.md` — Hide fine-grained verbs from --help routing (P2-9)
  - `fix/REGTEST-01-integration.md` — 13 integration tests in atlas-cli.test.js

- **Code files to modify** (across all fixes and regression tests):
  - `skills/init-project-html/lib/atlas/cli.js` — FIX-01 worker
  - `skills/init-project-html/lib/atlas/cli-help.js` — FIX-02 worker
  - `test/atlas-cli.test.js` — REGTEST-01 worker

- **Project context files**:
  - `CLAUDE.md` — Project instructions
  - `docs/architecture/cli-architecture.md` — CLI architecture docs

- **Related documents**:
  - `docs/plans/2026-06-07/architecture-simplify/REPORT.md` — Review findings (source of all issues)
  - `docs/plans/2026-06-07/architecture-simplify/SPEC.md` — Business requirements
  - `docs/plans/2026-06-07/architecture-simplify/DESIGN.md` — Technical design
  - `docs/plans/2026-06-07/architecture-simplify/CHECKLIST.md` — Verification strategy
  - `docs/plans/2026-06-07/architecture-simplify/architecture_diff/ARCHITECTURE_DIFF.md` — Architecture baseline diff

- **Fix History**:
  ### Round 1 — 2026-06-07
  - **Issues fixed**: FIX-01, FIX-02, REGTEST-01, REGTEST-02, REGTEST-03 (P1:5, P2:8, P3:7)
  - **Outcome**: All resolved — 20 issues in REPORT.md Round 1 were fixed in commit f9ae733.
  - **Key notes**: All Round 1 P1 issues (batch flag leakage, module relation flags, remove errors) were addressed.

  ### Round 2 — 2026-06-07
  - **Issues fixed**: FIX-01, FIX-02, REGTEST-01 (P1:3, P2:6, P3:4)
  - **Outcome**: TBD (this plan)
  - **Key notes**: Round 2 uncovered issues in module render timing, --data-flow-to for module, batch spec-mode rollback, and output message quality. All fixes are in this plan.
