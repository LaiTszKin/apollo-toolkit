---
name: qa
description: Reads spec documents and the review output REPORT.md, then generates a self-contained fix coordinator prompt (FIX.md) with issue inventory, dependency analysis, batch scheduling, regression test design, and pre-written worker prompts. The generated FIX.md is consumed directly by the fix skill.
---

## Goal

Transform the review findings from REPORT.md into a **fix coordinator prompt** (FIX.md).

This prompt defines a fix coordinator agent:
- The **main agent** only coordinates and supervises: understands issues, dispatches workers to fix them, dispatches workers to write regression tests, checks results, merges, verifies
- **Workers** handle fixes and test writing: each receives a pre-written self-contained prompt and reports back

This skill is responsible for "planning the fix strategy" — extracting information from REPORT.md + SPEC/DESIGN/CHECKLIST, writing worker prompts for each fix and regression test, and scheduling batch execution order.

## Acceptance Criteria

- `docs/plans/<YYYY-MM-DD>/<spec_name>/FIX.md` is produced and placed in the spec directory (same level as REPORT.md)
- FIX.md is a **self-contained fix coordinator prompt**, containing:
  - Coordinator role definition
  - Issue inventory with dependency analysis
  - Pre-written worker prompt for every fix issue
  - Regression test design and worker prompt for every fix
  - Batch schedule (fix batches + regression test batches + final verification)
  - Error recovery strategy
  - Boundary rules
- **Every issue in REPORT.md (including P2/P3) has a complete fix plan with a corresponding worker prompt in FIX.md.** No issue may be deferred to a future round or marked as "handle later."

## Workflow

### 1. Read Input Documents

**If a previous FIX.md exists**: Before reading new inputs, condense the old FIX.md's fix summary into one history entry. Prepend it to the Fix History section, keeping all past rounds. Then proceed with a fresh plan — do not let prior results bias the new assessment.

Read all of the following:

- **SPEC.md + DESIGN.md + CHECKLIST.md**: Full spec and design documentation
- **REPORT.md**: Review findings (verdict + P0-P3 issue list + dimension summary)

Understand the original design intent of the spec and the nature of each issue in REPORT.md.

### 2. Read Affected Code

Based on the file paths marked in REPORT.md, dispatch subagents in parallel to read the affected code.
Each subagent understands the actual code context of their assigned issue to enable precise fix and test design.

### 3. Analyze Each Issue and Design the Fix

**No-defer rule**: Every issue in REPORT.md — P0, P1, P2, and P3 — must have a complete fix plan in this FIX.md. There is no "handle later" or "defer to next round." If the number of issues is large, use batch scheduling to distribute them across phases, but every issue must be assigned to a specific batch with a complete worker prompt.

For each issue in REPORT.md (in P0 → P1 → P2 → P3 order) → FIX.md Section 5 (Fix Details):

- **Root cause analysis**: Determine the root cause through code reading
- **Fix approach**: Describe concrete changes (which files, which functions, how to modify)
- **Verification**: Define how to verify the fix
- **Complexity classification**:
  - **Simple fix**: Clear change within a single file
  - **Complex fix**: Cross-file, requires deep understanding of execution paths — worker prompt needs more context

### 4. Design Regression Tests for Each Fix

For every fix issue, design a concrete regression test → FIX.md Section 5 (Fix Details, regression test field) → FIX.md Section 6 (Worker Prompt Library, REGTEST entries).

Design principles:
- **Every P0/P1 issue needs at least one regression test.** For P2/P3 issues, if automated testing is impractical, define manual verification steps.
- **The regression test must fail on the unfixed code and pass after the fix is applied.** This is the core oracle.
- Test type selection:
  - Logic errors (wrong output) → Unit test, directly test the fixed function with input/output pairs that would fail before the fix
  - State errors (intermittent, order-dependent) → Integration test, simulate the trigger condition
  - Integration errors (boundary/contract) → Integration or contract test
  - Hallucinated code → Unit test verifying the code is actually executed
  - Architecture defects → Integration test verifying the new structure works correctly

**Regression test design format** (stored in Fix Details):

```
- Test ID: REGTEST-{sequence}
- Type: [Unit / Integration / E2E]
- Location: [file path, new or existing file]
- Scenario: GIVEN/WHEN/THEN
- Oracle: [pass condition — must fail before fix, must pass after fix]
- Related fix: FIX-{sequence}
```

### 5. Analyze Fix Dependencies → FIX.md Section 4

- **File overlap dependency**: Multiple issues touch the same file → must be sequential. This is a hard constraint — parallel workers are only permitted when file sets have ZERO overlap, regardless of logical independence
- **Logical dependency**: Fix B depends on Fix A being completed first
- **Independent issues**: No file overlap and no logical dependency → can be parallel
- **Regression test dependency**: Regression tests must run after their corresponding fix is complete (tests verify the fixed code)

### 6. Detect File Overlap (Parallelism Gate)

File overlap detection is the **gate that determines parallel vs sequential execution**. Perform this across all fixes and regression tests:

1. Collect the file list for each fix and regression test
2. Compare file lists and mark overlaps — zero overlap is the only condition for parallel execution
3. Any file overlap at all → must be sequential. This is a hard constraint — never dispatch parallel workers for overlapping files

### 7. Write Worker Prompts

#### 7a. Fix Worker Prompts → FIX.md Section 6

Write a self-contained worker prompt for each fix issue.

Each fix worker prompt must include:

```
## Mission — What to fix and why
## Context — Which review dimension, which spec requirement
## Input — Which files to read
## What to do — Concrete fix steps (describe "what" to do, not "which tool" to use)
## Scope — Allowed and forbidden files
## Output — What to report on completion
## Verify — Verification commands and expected results
## Boundaries — Constraints (don't conflict with spec, preserve existing test semantics, report blockers)
```

**Simple fixes can be merged**: Multiple simple, non-conflicting fixes can be combined into one worker prompt.
**Complex fixes stand alone**: Complex fixes (requiring systematic debug) must have independent worker prompts.

#### 7b. Regression Test Worker Prompts → FIX.md Section 6

Write a self-contained worker prompt for each regression test. The regression test worker is responsible for **writing test code**.

Each regression test worker prompt must include:

```
## Mission — Which fix needs a regression test and why
## Context — What the fix addressed (summary), root cause
## Input — Which files to read (fix-related files + existing test files as format reference)
## What to do — Concrete test writing steps:
  1. Create the test at the specified location
  2. Test scenario (GIVEN/WHEN/THEN)
  3. Oracle (must fail before fix, must pass after fix)
## Scope — Allowed test files only
## Verify — Run the test, confirm it passes (proving the fix works)
```

#### 7c. Cases That Do Not Need a Worker

- Single-line typo fixes (multiple typos can be batched into one worker)
- Pure documentation or comment fixes
- Extremely simple fixes that can be combined with their regression test in the same worker

### 8. Create Batch Schedule → FIX.md Section 7

**Batch partitioning principles (file overlap is the hard gate):**
- Fix batches: Ordered by dependencies. P0 issues first. Within each batch, workers require ZERO file overlap to run in parallel — overlapping fixes must be sequentialized across sub-batches
- Regression test batches: Dispatched **after all fixes are complete**, because tests verify the fixed code. Regression tests without file overlap can run in parallel; those sharing files must be sequential
- Final batch: Full test suite + lint + confirmation that all issues are resolved.

**Typical schedule:**

```
Batch 1: Independent P0 fixes → verification
Batch 2: Dependent P0 fixes → verification
Batch 3: P1/P2 fixes → verification
Batch 4: Regression test implementation (all REGTESTs in parallel)
Batch 5: Final — full test suite + lint + cross-check REPORT.md
```

Group regression test workers by file overlap: no overlap = parallel, overlap = sub-batches.

### 9. Set Verification Checkpoints and Error Recovery → FIX.md Sections 9-11

- Per-batch gate verification
- Special gate for regression test batches: confirm each REGTEST worker's test fails on the unfixed code (logical check)
- Worker failure handling (retain context → retry once → pause and report)
- Boundary rules (ALWAYS / ASK FIRST / NEVER)

### 10. Fill FIX.md Sections

Use `assets/templates/FIX.md`. Fill according to the table below.

| Section | Content Source |
|---------|---------------|
| 1. Your Role | Fixed template (no modification needed) |
| 2. Mission | REPORT.md verdict + total issue count |
| 3. Issue Inventory | REPORT.md issue list (condensed to NL one-liners) |
| 4. Fix Dependency Analysis | Steps 5-6 (dependency analysis + file overlap) |
| 5. Fix Details (with regression test design) | Step 3 (fix plan) + Step 4 (regression test design) |
| 6. Worker Prompt Library | Step 7a (fix prompts) + Step 7b (regression test prompts) |
| 7. Fix Batch Schedule | Step 8 (batch schedule) |
| 8. Regression Test Inventory | Step 4 full list. If regtests ≤ 3, omit (Section 5 is sufficient). If ≥ 4, include a condensed NL list. |
| 9. Verification Checkpoints | Fixed scaffold, customized with spec-specific commands |
| 10. Error Recovery | Fixed scaffold (natural language) |
| 11. Fix History | Fixed scaffold (history entries only, no instructions) |
| 12. Boundaries | Fixed scaffold + spec-specific rules |

### 11. Produce FIX.md

Place FIX.md in the spec directory (same level as REPORT.md).

## Examples

- REPORT.md has 3 P0 issues (hallucinated code, deviation, omission) and 2 P1 issues → Each P0/P1 gets 1+ regression test → FIX.md has 3 fix workers + 5 regression test workers → Schedule: Batch 1 parallel fix 3 P0 → Batch 2 fix 2 P1 → Batch 3 parallel 5 regtests → Batch 4 final
- Two P0 issues both modify `src/auth.ts` → File overlap → Separate into sequential batches → Regression tests run after all fix batches complete
- A P0 logic error: `getDiscount()` does not handle negative input → Regression test: unit test with GIVEN negative input WHEN calling getDiscount THEN return 0 (before fix, returns incorrect negative discount)

## References

- `assets/templates/FIX.md` — FIX.md template
