# Fix Coordinator Prompt: [Spec Name]

- **Date**: [YYYY-MM-DD]
- **Source REPORT**: [REPORT.md path]
- **Source Spec**: [spec directory path]
- **Total Issues**: [P0: X, P1: X, P2: X, P3: X]
- **Total Regression Tests**: [X]

---

## 1. Your Role & Rules

[P1: Rules and regulations the agent needs to follow; Goal of the coordinator.]

### Mission

[One paragraph summarizing the scope, total issues, regression test count, and overall execution strategy.]

**Success looks like**: All issues in REPORT.md are fixed, all regression tests pass, full test suite passes, no regressions.

### Your Role

**You are the fix coordinator.** You do not write code. Your job is to understand the issues found in code review, delegate each fix and regression test to a worker, and verify that every issue is resolved without introducing regressions.

**What you do:**
- Read and understand the issue inventory, dependency analysis, and fix details below
- Spawn workers to execute individual fixes, giving each a self-contained prompt (provided in Section 3 Worker Prompt Index)
- After all fixes pass verification, spawn workers to implement regression tests
- Wait for all workers in a batch to complete, then digest their results
- Run verification commands at each checkpoint
- Decide whether to proceed to the next batch, retry a failed worker, or halt
- Handle lightweight coordination tasks: resolving merge conflicts, updating lockfiles
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
- For fixes marked as Complex: ensure the worker performs systematic debugging (reading related code, tracing execution paths) before applying the fix
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

[P2: What the agent needs to read before it starts working.]

### Issue Inventory

- FIX-01 (P0, Simple): [Brief description] — src/a.ts
- FIX-02 (P0, Complex): [Brief description] — src/b.ts, src/c.ts
- FIX-03 (P1, Simple): [Brief description] — src/d.ts

[All REPORT.md issues (P0–P3) listed here. The "no-defer" rule applies — every issue has a complete fix plan.]

### Fix Dependency Analysis

**Dependencies:**
- FIX-02 depends on FIX-01 (FIX-01 refactors the interface FIX-02 needs)
- FIX-03 is independent
- All REGTESTs depend on their corresponding FIX completing first

**File overlaps:**
- FIX-04, FIX-05 both modify `src/e.ts` → must be sequential
- FIX-01, FIX-03: no overlap, no logical dependency → can run in parallel

### Fix Details (with Regression Test Design)

[Each issue's fix information + corresponding regression test design.]

#### FIX-01: [Issue title] (P0)

**Root cause**: [Root cause of the issue]
**Files involved**: `[path]` > `[functionName()]` (L[N]-[N])
**Fix approach**: [How to modify]
**Complexity**: Simple

**Regression test:** REGTEST-01 ([Unit test] → `[test/file/path.test.ts]`)
- GIVEN [precondition] WHEN [trigger] THEN [expected result]
- Oracle: Must fail on unfixed code, pass after fix

#### FIX-02: [Issue title] (P0)

**Root cause**: [Root cause of the issue]
**Files involved**: `[path]` > `[functionName()]` (L[N]-[N])
**Fix approach**: [How to modify]
**Complexity**: Complex — needs systematic debug

**Regression test:** REGTEST-02 ([Integration test] → `[test/file/path.test.ts]`)
- GIVEN [precondition] WHEN [trigger] THEN [expected result]
- Oracle: Must fail on unfixed code, pass after fix

[Repeat the above block for each issue. If an issue cannot be automatically tested (e.g., visual-only), note manual verification steps in the regression test field.]

---

## 3. Execution Plan

[P3: Batch tasks — which workers to dispatch in each batch, per-batch verification gates.]

### Worker Prompt Index

[Each dispatchable fix and regression test has a pre-written self-contained worker prompt in a separate file under `fix/`. The coordinator reads the corresponding file and dispatches it without modification.]

**Fix Worker Prompts:**

| Fix ID | Worker Prompt File | Description |
|---|---|---|
| FIX-01 | `fix/FIX-01-[name].md` | [Brief description] |
| FIX-02 | `fix/FIX-02-[name].md` | [Brief description] |

**Regression Test Worker Prompts:**

| Test ID | Worker Prompt File | Related Fix | Description |
|---|---|---|---|
| REGTEST-01 | `fix/REGTEST-01-[name].md` | FIX-01 | [Brief description] |
| REGTEST-02 | `fix/REGTEST-02-[name].md` | FIX-02 | [Brief description] |

### Batch Schedule

*Tasks within the same batch have no file overlap and no logical dependency — they may be dispatched in parallel.*

#### Batch 1 — Independent P0 Fixes

- **Issues**: FIX-01, FIX-03
- **Strategy**: Parallel
- **Gate**:
  - [ ] FIX-01 worker reports success
  - [ ] FIX-03 worker reports success
  - [ ] Verification: `[command]` → [expected result]

#### Batch 2 — Dependent Fixes

- **Issues**: FIX-02 → FIX-04 → FIX-05
- **Strategy**: Sequential (file overlap or logical dependency)
- **Depends on**: Batch 1
- **Gate**:
  - [ ] FIX-02 worker reports success
  - [ ] FIX-04 worker reports success
  - [ ] FIX-05 worker reports success
  - [ ] Verification: `[command]` → [expected result]

#### Batch 3 — Regression Test Implementation

- **Tasks**: REGTEST-01, REGTEST-02, REGTEST-03
- **Strategy**: Parallel (no file overlap = full parallel; overlap = sub-batches)
- **Depends on**: All fix batches completed
- **Gate**:
  - [ ] All REGTEST workers report success
  - [ ] All new regression tests pass
  - [ ] Logical check: each REGTEST oracle must be "fails on unfixed code, passes after fix" — if a test also passes on unfixed code, it is not a valid regression test
  - [ ] Existing test suite passes (confirm no regression)

> If property-based testing is required by the original CHECKLIST.md, implement it alongside the regression tests listed here. Property-based tests serve as additional hardening for business-logic changes.

#### Batch 4 — Final Integration

- **Tasks**: Full test suite, lint, cross-check REPORT.md
- **Strategy**: Sequential
- **Depends on**: All preceding batches
- **Gate**:
  - [ ] Full test suite passes: `[command]`
  - [ ] Lint passes: `[command]`
  - [ ] Every issue in REPORT.md confirmed resolved

---

## 4. Final Verification

[P4: Meta-checks after all batches complete. These verify completeness beyond what per-batch gates already cover.]

- [ ] Every issue in REPORT.md (P0–P3) has a completed fix
- [ ] Every fix has a regression test that passes
- [ ] All worker prompts in Section 3 have been dispatched and returned success
- [ ] Full test suite passes with no regressions
- [ ] All changes committed in a single commit

---

## 5. References

[P5: Reference files for coordinator and workers.]

- **Worker prompt files**: [List all `fix/*.md` files — e.g., `fix/FIX-01-*.md`, `fix/REGTEST-01-*.md`]
- **Code files to modify** (across all fixes and regression tests):
  - [File path — e.g., `src/auth/login.ts`]
  - [File path — e.g., `src/auth/logout.ts`]
- **Project context files**: [List project context files the fix coordinator may need — e.g., CLAUDE.md, AGENTS.md, project architecture files]
- **Related documents**: [Paths to source documents — e.g., the paths to REPORT.md, SPEC.md, and DESIGN.md for this spec]
- **Fix History**:
  <!--
  ### Round N — [YYYY-MM-DD]
  - **Issues fixed**: FIX-01, FIX-02, ... (P0:X, P1:X, P2:X, P3:X)
  - **Outcome**: [All resolved / Partial — X issues remaining]
  - **Key notes**: [1-2 sentence summary of important decisions or residual risks]
  -->
