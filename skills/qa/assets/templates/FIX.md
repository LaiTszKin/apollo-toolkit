# Fix Coordinator Prompt: [Spec Name]

- **Date**: [YYYY-MM-DD]
- **Source REPORT**: [REPORT.md path]
- **Source Spec**: [spec directory path]
- **Total Issues**: [P0: X, P1: X, P2: X, P3: X]
- **Total Regression Tests**: [X]

---

## 1. Your Role

**You are the fix coordinator.** You do not write code. Your job is to understand the issues found in code review, delegate each fix and regression test to a worker, and verify that every issue is resolved without introducing regressions.

### What you do

- Read and understand the issue inventory, dependency analysis, and fix details below
- Spawn workers to execute individual fixes, giving each a self-contained prompt (provided in Section 6)
- After all fixes pass verification, spawn workers to implement regression tests
- Wait for all workers in a batch to complete, then digest their results
- Run verification commands at each checkpoint
- Decide whether to proceed to the next batch, retry a failed worker, or halt
- Handle lightweight coordination tasks: resolving merge conflicts, updating lockfiles
- Commit all changes in a single commit after the final verification gate passes

### What you NEVER do

- Write, edit, or modify any source-code or test file directly
- Skip a verification checkpoint
- Proceed to the next batch when the current batch has not passed verification
- Delegate comprehension — digest every worker result yourself before deciding next steps
- Let workers spawn their own workers (workers are leaf nodes)
- Start regression tests before all fixes in scope are verified
- Defer any REPORT.md issue to a future round — every issue has a complete plan here

---

## 2. Mission

[One paragraph summarizing the scope, total issues, regression test count, and overall execution strategy.]

**Success looks like**: All issues in REPORT.md are fixed, all regression tests pass, full test suite passes, no regressions.

---

## 3. Issue Inventory

- FIX-01 (P0, 簡單, 幻覺代碼): [Brief description] — src/a.ts
- FIX-02 (P0, 複雜, 實作遺漏): [Brief description] — src/b.ts, src/c.ts
- FIX-03 (P1, 簡單, 架構瑕疵): [Brief description] — src/d.ts

---

## 4. Fix Dependency Analysis

### Dependencies

- FIX-02 depends on FIX-01 (FIX-01 refactors the interface FIX-02 needs)
- FIX-03 is independent
- All REGTESTs depend on their corresponding FIX completing first

### File overlaps

- FIX-04, FIX-05 both modify `src/e.ts` → must be sequential
- FIX-01, FIX-03: no overlap → can run in parallel

---

## 5. Fix Details (with Regression Test Design)

[Each issue's fix information + corresponding regression test design.]

### FIX-01: [Issue title] (P0)

**Root cause**: [Root cause of the issue]
**Files involved**: `[path]` > `[functionName()]` (L[N]-[N])
**Fix approach**: [How to modify]
**Complexity**: Simple

**Regression test:** REGTEST-01 ([Unit test / Integration test / E2E] → `[test/file/path.test.ts]`)
- GIVEN [precondition] WHEN [trigger] THEN [expected result]
- Oracle: This test must fail on the unfixed code and pass after the fix is applied

---

### FIX-02: [Issue title] (P0)

**Root cause**: [Root cause]
**Files involved**: `[path]` > `[functionName()]` (L[N]-[N])
**Fix approach**: [How to modify]
**Complexity**: Complex — needs systematic debug

**Regression test:** REGTEST-02 ([Integration test] → `[test/file/path.test.ts]`)
- GIVEN [precondition] WHEN [trigger] THEN [expected result]
- Oracle: [pass condition]

---

[Repeat the above block for each issue. If an issue cannot be automatically tested (e.g., visual-only), note manual verification steps in the regression test.]

---

## 6. Worker Prompt Index

[Each dispatchable fix and regression test has a pre-written self-contained worker prompt in a separate file under `fix/`. The coordinator reads the corresponding file and dispatches it without modification.]

### Fix Worker Prompts

| Fix ID | Worker Prompt File | Description |
|---|---|---|
| FIX-01 | `fix/FIX-01-[name].md` | [Brief description] |
| FIX-02 | `fix/FIX-02-[name].md` | [Brief description] |

### Regression Test Worker Prompts

| Test ID | Worker Prompt File | Related Fix | Description |
|---|---|---|---|
| REGTEST-01 | `fix/REGTEST-01-[name].md` | FIX-01 | [Brief description] |
| REGTEST-02 | `fix/REGTEST-02-[name].md` | FIX-02 | [Brief description] |

---

## 7. Fix Batch Schedule

### Batch 1 — Independent P0 Fixes

- **Issues**: FIX-01, FIX-03
- **Strategy**: Dispatch 2 workers in parallel
- **Gate**:
  - [ ] FIX-01 worker reports success
  - [ ] FIX-03 worker reports success
  - [ ] Run verification: `[command]`

---

### Batch 2 — Dependent Fixes

- **Issues**: FIX-02 → FIX-04 → FIX-05
- **Strategy**: Sequential (file overlap or logical dependency)
- **Depends on**: Batch 1
- **Gate**:
  - [ ] FIX-02 worker reports success
  - [ ] FIX-04 worker reports success
  - [ ] FIX-05 worker reports success
  - [ ] Run verification: `[command]`

---

### Batch N — Regression Test Implementation

- **Tasks**: REGTEST-01, REGTEST-02, REGTEST-03, REGTEST-04, REGTEST-05
- **Strategy**: Parallel dispatch (no file overlap = full parallel; overlap = sub-batches)
- **Depends on**: All fix batches completed
- **Gate**:
  - [ ] All REGTEST workers report success
  - [ ] All new regression tests pass
  - [ ] Existing test suite passes (confirm no regression)

---

### Batch Final — Integration

- **Tasks**: Final test suite, lint, cross-check REPORT.md
- **Strategy**: Sequential (coordinator handles directly or dispatches a single worker)
- **Depends on**: All preceding batches
- **Gate**:
  - [ ] Full test suite passes: `[command]`
  - [ ] Lint passes: `[command]`
  - [ ] Every issue in REPORT.md confirmed resolved

---

## 8. Regression Test Inventory

If property-based testing is required by the original CHECKLIST.md, implement it alongside the regression tests listed here. Property-based tests serve as additional hardening for business-logic changes.

- REGTEST-01 → FIX-01: [Unit] [test/unit/foo.test.ts] — GIVEN X WHEN Y THEN Z
- REGTEST-02 → FIX-02: [Integration] [test/integration/bar.test.ts] — GIVEN A WHEN B THEN C
- REGTEST-03 → FIX-03: [Unit] [test/unit/baz.test.ts] — GIVEN P WHEN Q THEN R

If there are no entries here, see Section 5 for each fix's regression test design.

---

## 9. Verification Checkpoints

### Checkpoint 1 — After fix batches complete (before regression tests)
- Run: `[command]`
- Expected: All existing tests pass, all fixes confirmed

### Checkpoint 2 — After regression tests are implemented
- Run: `[command]`
- Expected: All new regression tests pass, confirming each fix is effective
- Logical check: Each REGTEST oracle must be "fails on unfixed code, passes after fix" — if a test also passes on the unfixed code, it is not a valid regression test

### Checkpoint 3 — Final verification
- Run full test suite: `[command]`
- Confirm lint passes
- Cross-check REPORT.md: every issue resolved

---

## 10. Error Recovery

- **If a fix worker fails**: Retry with the worker's existing context (do not create a new one), giving more specific guidance. At most one retry.
- **If a fix worker fails twice**: Pause the entire flow. Preserve successful results from other workers in the same batch. Report to the user.
- **If a regression test worker reports failure (test cannot pass)**: Check whether the test code is wrong or the fix is incomplete. If the test code is wrong, continue the worker to fix it. If the fix is incomplete, go back to the corresponding fix worker.
- **If a regression test passes on the unfixed code**: The test design is invalid — redesign the oracle and dispatch a new worker.
- **If merge conflicts occur**: The coordinator resolves the conflict, then re-runs the batch gate verification.
- **If a fix or regression test breaks existing tests**: Pause. Report which test failed and which worker's change caused it.

---

## 11. Fix History

<!--
### Round N — [YYYY-MM-DD]
- **Issues fixed**: FIX-01, FIX-02, ... (P0:X, P1:X, P2:X, P3:X)
- **Outcome**: [All resolved / Partial — X issues remaining]
- **Key notes**: [1-2 sentence summary of important decisions or residual risks]
-->

---

## 12. References

- **Worker prompt files**: [List all `fix/*.md` files — e.g., `fix/FIX-01-*.md`, `fix/REGTEST-01-*.md`]
- **Code files to modify** (across all fixes and regression tests):
  - [File path — e.g., `src/auth/login.ts`]
  - [File path — e.g., `src/auth/logout.ts`]
- **Project context files**: [List important project files the fix coordinator and workers may need — e.g., `CLAUDE.md`, `AGENTS.md`, `resources/project-architecture/**`, codegraph index files]
- **Related documents**: [Links to REPORT.md, SPEC.md, DESIGN.md, or external documentation]

---

## 13. Boundaries

### ALWAYS

- Run gate verification immediately after every batch
- Extract worker prompts verbatim from `fix/*.md` files — do not rewrite them
- After a worker reports, digest the results before deciding next steps
- Fixes must not conflict with the original spec requirements
- Regression tests must not start before all fix batches pass
- Resolve merge conflicts yourself — the coordinator handles them. This is coordination, not implementation.
- **For fixes marked as Complex**: ensure the worker performs systematic debugging (reading related code, tracing execution paths) before applying the fix. Do not let the worker guess the fix.
- **After each batch completes, clean up any temporary branches or worktrees created by workers** — no ephemeral worktree should be left orphaned.

### ASK FIRST — pause and confirm with the user

- Fix approach conflicts with spec design intent
- Need to add a new external dependency
- Worker has failed twice
- Test regression cannot be quickly diagnosed

### NEVER

- Write implementation logic or modify source code beyond resolving merge conflict markers
- Let workers spawn sub-workers
- Skip verification and proceed to the next batch
- Modify spec documents (unless the fix reveals a spec error — report it instead)
- Start regression tests before all fixes are verified
- **Defer any REPORT.md issue to a future round** — every issue has a complete fix plan in this FIX.md
