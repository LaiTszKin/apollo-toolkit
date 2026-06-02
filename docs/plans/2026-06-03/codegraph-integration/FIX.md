# Fix Coordinator Prompt: CodeGraph Integration

- **Date**: 2026-06-03
- **Source Specs**:
  - `docs/plans/2026-06-03/codegraph-integration/codegraph-lifecycle/SPEC.md`
  - `docs/plans/2026-06-03/codegraph-integration/codegraph-discovery/SPEC.md`
  - `docs/plans/2026-06-03/codegraph-integration/codegraph-validation/SPEC.md`
- **Source Design**: `docs/plans/2026-06-03/codegraph-integration/DESIGN.md`
- **Source Report**: `docs/plans/2026-06-03/codegraph-integration/REPORT.md`

---

## 1. Your Role

**You are the fix coordinator.** You do not write code. Your job is to think, plan, delegate, synthesize, and verify.

### What you do

- Read and understand the mission, issue inventory, and task definitions below
- Spawn workers to execute individual fixes, giving each a self-contained prompt (provided in Section 6)
- Spawn workers to write regression tests
- Wait for all workers in a batch to complete, then digest their results
- Run verification commands at each checkpoint
- Decide whether to proceed to the next batch, retry a failed worker, or halt
- Commit all changes after the final verification gate passes

### What you NEVER do

- Write implementation logic or modify source code beyond resolving merge conflict markers
- Skip a verification checkpoint
- Proceed to the next batch when the current batch has not passed verification
- Delegate comprehension — digest every worker result yourself before deciding next steps
- Let workers spawn their own workers (workers are leaf nodes)

---

## 2. Mission

Fix all 27 issues identified in REPORT.md (2 P0, 10 P1, 14 P2, 1 P3) to make the `@colbymchenry/codegraph` integration fully spec-compliant. The implementation must pass all behavior-to-test checklist items from CHECKLIST.md.

**The core problems are:**
1. **P0**: `codegraph verify` cannot reliably validate existing function references (broken YAML parser in `cmd-verify.ts`) and cannot verify edge relationships (`checker.ts`).
2. **P1**: Several spec-required features are missing: init error for already-initialized projects, duration in init summary, explore file grouping, survey call-graph analysis, list-apis directory grouping, template error handling, and skill workflow updates.
3. **P2**: Multiple correctness and robustness gaps across the codebase.

---

## 3. Issue Inventory

### P0 — Requirement Blocked (2 issues)

| ID | Requirement | Summary | Affected Files |
|---|---|---|---|
| #1 | V1 | `parseSimpleYamlFeature` parses `"name: init"` instead of `"init"`; for-loop breaks after first function | `cmd-verify.ts:102-136` |
| #2 | V1 | Edge relationship verification only checks endpoint existence, never calls `getCallers()`/`getCallees()` | `checker.ts:105-136` |

### P1 — Requirement Defect (10 issues)

| ID | Requirement | Summary | Affected Files |
|---|---|---|---|
| #3 | V4 | design SKILL.md Step 5e still uses old render/validate/diff, missing `architecture apply` + `verify` | `skills/design/SKILL.md:186-200` |
| #4 | L1 | Already-initialized project silently opens instead of error with sync suggestion | `cg-instance.ts:38-40` |
| #5 | L2 | `init --index` summary missing duration field | `cmd-init.ts:43-52` |
| #6 | D2 | Grouper only groups by file, no call graph connectivity analysis | `grouper.ts:19-58` |
| #7 | D2 | Cross-boundary calls filtered intra-directory (opposite of spec) | `cmd-survey.ts:148-149` |
| #8 | D3 | `list-apis --all` output not grouped by directory | `formatter.ts:64-79`, `cmd-list-apis.ts:68-72` |
| #9 | D1 | explore output not grouped by file | `cmd-explore.ts:78-112` |
| #10 | L4 | status output missing "supported languages" list | `cmd-status.ts:26-39` |
| #11 | V3 | Wrong SPEC.md path silently generates blank skeleton instead of error | `architecture/index.ts:464-473` |
| #12 | V5 | init-project-html SKILL.md missing `architecture apply` from workflow | `skills/init-project-html/SKILL.md:90-101` |

### P2 — Requirement Risk (14 issues)

| ID | Requirement | Summary | Affected Files |
|---|---|---|---|
| #13 | V3 | CodeGraph `list-apis --all` integration absent in template (optional per spec) | `architecture/index.ts:464-486` |
| #14 | V1 | Custom YAML parser can't handle real atlas overlay format → data loss | `cmd-verify.ts:18-96`, `:102-140` |
| #15 | V1 | Submodule `action: add` guard never triggers | `cmd-verify.ts:120` |
| #16 | D1 | `--feature` flag parsed but never passed to explore handler | `index.ts:86`, `cmd-explore.ts:7-9` |
| #17 | D2 | Entry points identified by `isExported` alone, not by actual external callers | `cmd-survey.ts:72` |
| #18 | D2 | Non-existent directory returns empty report instead of error | `scanner.ts:41-45` |
| #19 | D3 | TTY mode only shows caller count, not caller names | `formatter.ts:77` |
| #20 | D3 | Return type not independently accessible (CodeGraph limitation) | `cmd-list-apis.ts:39,59` |
| #21 | L3 | Progress events collected but never displayed in sync | `cmd-sync.ts:14-19` |
| #22 | L3 | No `isInitialized()` check before `CodeGraph.open()` in sync | `cmd-sync.ts:12` |
| #23 | L2 | Duplicate `--index` flag check in dispatch | `index.ts:42,63` |
| #24 | L1+L2 | API call uses `{index: true}` option instead of `.indexAll()` from DESIGN.md | `cg-instance.ts:42-45` |
| #25 | V2 | Submodule remove doesn't cascade cross-feature edges | `architecture/index.ts:56-66` |
| #26 | V2 | Edge add lacks referential integrity validation | `architecture/index.ts:329-385` |
| #27 | V4+V5 | Skill workflows added CodeGraph query but omitted `architecture apply` downstream | `skills/design/SKILL.md`, `skills/init-project-html/SKILL.md` |

### P3 — Suggestion (1 issue)

No P3 findings are tracked as actionable — all functionality is correct. P3 findings (e.g., minor code style, help text) are addressed as part of the fix workers touching the same files.

---

## 4. Fix Dependency Analysis

### File Overlap Matrix

| Fix Group | Files Touched | Overlaps With |
|---|---|---|
| FG-1 (verify parser+checker) | `cmd-verify.ts`, `checker.ts` | — |
| FG-2 (cg-instance) | `cg-instance.ts` | — |
| FG-3 (cmd-init duration) | `cmd-init.ts` | — |
| FG-4 (cmd-sync fixes) | `cmd-sync.ts` | — |
| FG-5 (cmd-status lang list) | `cmd-status.ts` | — |
| FG-6 (explore+dispatch) | `cmd-explore.ts`, `index.ts` | FG-10 (same `index.ts`) |
| FG-7 (survey fixes) | `grouper.ts`, `cmd-survey.ts`, `scanner.ts` | — |
| FG-8 (list-apis+formatter) | `cmd-list-apis.ts`, `formatter.ts` | — |
| FG-9 (architecture tool) | `architecture/index.ts` | — |
| FG-10 (dispatch cleanup) | `index.ts` | FG-6 (same `index.ts`) |
| FG-11 (design SKILL.md) | `skills/design/SKILL.md` | — |
| FG-12 (init-project-html SKILL.md) | `skills/init-project-html/SKILL.md` | — |

### Merge Decision

**FG-6 and FG-10** both modify `packages/tools/codegraph/index.ts` → **merge into one worker** (FG-6 covers both explore grouping and dispatch cleanup).

### Logical Dependencies

| Dependency | Reason |
|---|---|
| FG-1 → REGTEST-1, REGTEST-2 | Regression tests verify fixed verify code |
| FG-2 → REGTEST-3 | Regression test verifies fixed init behavior |
| FG-3 → REGTEST-4 | Regression test verifies duration in output |
| FG-4 → REGTEST-5 | Regression test verifies sync progress + init check |
| FG-5 → REGTEST-6 | Regression test verifies language list in status |
| FG-6 → REGTEST-7, REGTEST-8 | Regression tests verify explore grouping + --feature |
| FG-7 → REGTEST-9, REGTEST-10, REGTEST-11, REGTEST-12 | Regression tests for survey fixes |
| FG-8 → REGTEST-13, REGTEST-14 | Regression tests for list-apis grouping + TTY callers |
| FG-9 → REGTEST-15, REGTEST-16, REGTEST-17 | Regression tests for template error, cascade, validation |
| FG-11 → manual verification | Documentation-only change |
| FG-12 → manual verification | Documentation-only change |

### Independent Groups (can run in parallel)

- FG-1 (verify), FG-2 (cg-instance), FG-5 (status), FG-7 (survey), FG-8 (list-apis), FG-11 (design skill), FG-12 (init-project-html skill) — **no file overlap, independent**.
- FG-3 (cmd-init), FG-4 (cmd-sync) — **no file overlap with each other or others**.
- FG-6 (explore+dispatch merged), FG-9 (architecture tool) — **no file overlap**.

**Result**: All 11 fix workers have no file overlap, meaning **all fix batches can run in parallel** in a single batch. The only merge needed was FG-6 + FG-10 (same `index.ts`), now merged.

---

## 5. Fix Details (with Regression Test Design)

### FIX-1: Rewrite verify parser and implement edge relationship validation
- **Issue IDs**: #1 (P0), #2 (P0), #14 (P2), #15 (P2)
- **Root cause**: `cmd-verify.ts` uses a hand-written line-by-line YAML parser that cannot handle object-format function declarations, causing `"name: init"` extraction. `checker.ts` never calls `getCallers()`/`getCallees()` for edge validation.
- **Fix approach**: 
  1. Replace `loadOverlay()` custom parser with `js-yaml`-based parsing (same pattern as `state.js::loadOverlay`)
  2. Replace `parseSimpleYamlFeature()` with `js-yaml` parsing
  3. Fix `checker.ts::verifyOverlay` to call `cg.getCallers()`/`cg.getCallees()` for each edge and verify the relationship exists (use `findNearestCodeGraphRoot` for CodeGraph import)
  4. Fix `cmd-verify.ts:120` to properly parse submodule `action: add`
- **Complexity**: Complex — crosses two files, replaces parser logic
- **Verification**: 
  - `cd packages/tools/codegraph && npx tsc --noEmit` compiles
  - REGTEST-1 passes on fixed code
  - REGTEST-2 passes on fixed code

**Regression test REGTEST-1**:
- **Type**: Unit test
- **Location**: `packages/tools/codegraph/lib/cmd-verify.test.ts` (new)
- **Scenario**: GIVEN a mock overlay YAML with object-format functions (`- name: init\n  in: string\n  out: void\`) WHEN loadOverlay reads it THEN function names are correctly extracted as `["init"]` (not `["name: init"]`)
- **Oracle**: `assert.strictEqual(feature.submodules[0].functions[0], "init")`
- **Related fix**: FIX-1

**Regression test REGTEST-2**:
- **Type**: Integration test
- **Location**: `packages/tools/codegraph/lib/verify/checker.test.ts` (new)
- **Scenario**: GIVEN a CodeGraph index with known symbols and an overlay declaring an edge between two symbols that DON'T have a caller/callee relationship WHEN verifyOverlay runs THEN the edge is reported as failed
- **Oracle**: `assert.strictEqual(report.failed.length > 0)`
- **Related fix**: FIX-1

### FIX-2: Fix init already-initialized behavior and align API
- **Issue IDs**: #4 (P1), #24 (P2)
- **Root cause**: `cg-instance.ts:38-40` silently calls `CodeGraph.open()` when project is already initialized, instead of erroring with sync suggestion. API call uses `{index: true}` option instead of `.indexAll()`.
- **Fix approach**:
  1. In `createOrOpenIndex`, when `isInit` is true and the caller expected `init` (not `open`), throw an error with message "Project already initialized. Use `apltk codegraph sync` to update the index." 
  2. Check `@colbymchenry/codegraph`'s `CodeGraph.init()` API signature: if it supports `{index: true}`, add a comment documenting this; if not, change to `.init()` + `.indexAll({onProgress})` 
  3. Add `require('@colbymchenry/codegraph')` not-installed error handling: catch `MODULE_NOT_FOUND` and display install guide
- **Complexity**: Simple — single file, localized changes
- **Verification**: REGTEST-3 passes

**Regression test REGTEST-3**:
- **Type**: Unit test
- **Location**: `packages/tools/codegraph/lib/cg-instance.test.ts` (new)
- **Scenario**: GIVEN an initialized CodeGraph project WHEN `createOrOpenIndex()` is called with `init` semantics THEN an error is thrown with message containing "sync"
- **Oracle**: `assert.rejects(async () => ..., /sync/)`
- **Related fix**: FIX-2

### FIX-3: Add duration to init --index summary
- **Issue ID**: #5 (P1)
- **Root cause**: `cmd-init.ts` never captures timing around the `CodeGraph.init()` call
- **Fix approach**: Add `const start = Date.now()` before `createOrOpenIndex()`, compute `const elapsed = Date.now() - start` after, include `elapsed` in the output summary and the result object. For JSON mode, include `durationMs`.
- **Complexity**: Simple — single file, 3-4 line change
- **Verification**: REGTEST-4 passes

**Regression test REGTEST-4**:
- **Type**: Unit test
- **Location**: `packages/tools/codegraph/lib/cmd-init.test.ts` (new)
- **Scenario**: GIVEN a mock or temp project WHEN `handleInit` with `--index` completes THEN the output (both TTY summary and JSON) contains a `durationMs` or `Duration:` field
- **Oracle**: `assert.ok(output.includes("Duration") || output.includes("durationMs"))`
- **Related fix**: FIX-3

### FIX-4: Fix sync progress display and add init check
- **Issue IDs**: #21 (P2), #22 (P2)
- **Root cause**: `cmd-sync.ts:14-19` collects `progressEvents` but never displays them. No `isInitialized()` check before `CodeGraph.open()`.
- **Fix approach**:
  1. Display progress in TTY mode (same pattern as `cmd-init.ts:15-17`)
  2. Include `progressEvents` in JSON output
  3. Add `CodeGraph.isInitialized(projectRoot)` check before `CodeGraph.open()`, emit helpful error if not initialized
- **Complexity**: Simple — single file, localized changes
- **Verification**: REGTEST-5 passes

**Regression test REGTEST-5**:
- **Type**: Unit test
- **Location**: `packages/tools/codegraph/lib/cmd-sync.test.ts` (new)
- **Scenario**: GIVEN an uninitialized project WHEN `handleSync` is called THEN the handler returns exit code 1 with an error indicating "init" must be run first
- **Oracle**: `assert.strictEqual(exitCode, 1)` and error message contains "init"
- **Related fix**: FIX-4

### FIX-5: Add languages list to status output
- **Issue ID**: #10 (P1)
- **Root cause**: `cmd-status.ts:26-39` human-readable path doesn't read `filesByLanguage` from `stats`
- **Fix approach**: Add a loop over `stats.filesByLanguage` entries (filter non-zero) and display them in the human-readable output, same format as `nodesByKind` / `edgesByKind`
- **Complexity**: Simple — single file, ~5 lines added
- **Verification**: REGTEST-6 passes

**Regression test REGTEST-6**:
- **Type**: Unit test
- **Location**: `packages/tools/codegraph/lib/cmd-status.test.ts` (new)
- **Scenario**: GIVEN a `stats` object with `filesByLanguage: { typescript: 10, javascript: 5 }` WHEN `handleStatus` formats the human-readable output THEN the output contains "typescript" and "javascript" entries
- **Oracle**: `assert.ok(output.includes("typescript") && output.includes("javascript"))`
- **Related fix**: FIX-5

### FIX-6: Fix explore file grouping and add --feature support
- **Issue IDs**: #9 (P1), #16 (P2), #23 (P2)
- **Root cause**: `cmd-explore.ts:78-112` outputs per-symbol sections instead of grouping by file. `--feature` not passed to explore handler. Duplicate `--index` check in dispatch.
- **Fix approach**:
  1. In `cmd-explore.ts` human-readable output: group details by `filePath`, print file header once, list all symbols in that file under the header
  2. Add `feature` to `ExploreOptions` interface, pass from dispatch
  3. In `cmd-survey.ts` and `cmd-list-apis.ts`: actually use `options.feature` (tag output)
  4. In `index.ts:63`: simplify to `index: shouldIndex`
- **Complexity**: Medium — output restructuring in explore, small dispatch changes
- **Verification**: REGTEST-7, REGTEST-8 pass

**Regression test REGTEST-7**:
- **Type**: Unit test
- **Location**: `packages/tools/codegraph/lib/cmd-explore.test.ts` (new)
- **Scenario**: GIVEN explore results with 2 symbols in the same file WHEN formatOutput generates human-readable text THEN the symbols appear under a single file header
- **Oracle**: The output has one `=== filename ===` header followed by both symbols, not two separate headers
- **Related fix**: FIX-6

**Regression test REGTEST-8**:
- **Type**: Unit test
- **Location**: `packages/tools/codegraph/lib/cmd-explore.test.ts` (new, same file)
- **Scenario**: GIVEN an `ExploreOptions` with `feature: "auth"` WHEN `handleExplore` is called THEN the feature parameter is accepted without error
- **Oracle**: No exception thrown; output contains the feature tag
- **Related fix**: FIX-6

### FIX-7: Implement call graph connectivity analysis and fix survey correctness
- **Issue IDs**: #6 (P1), #7 (P1), #17 (P2), #18 (P2)
- **Root cause**:
  - `grouper.ts` never receives `cg` instance → no call graph data → only per-file grouping
  - `cmd-survey.ts:148-149` filters `fileSet.has()` (intra-directory) instead of `!fileSet.has()` (cross-boundary)
  - `cmd-survey.ts:72` only checks `isExported` for entry points
  - `scanner.ts` has no directory existence check
- **Fix approach**:
  1. **grouper.ts**: Add `cg: any` parameter; implement BFS connectivity analysis on call graph (via `cg.getCallees()`); connected components become submodule candidates; unassigned symbols fall back to per-file grouping
  2. **cmd-survey.ts:148-149**: Change `if (fileSet.has(...))` to `if (!fileSet.has(...))`; add dedup for source::target pairs
  3. **cmd-survey.ts**: Lift `fileSet` to `handleSurvey` scope; compute entry points by checking `cg.getCallers()` for external callers
  4. **cmd-survey.ts**: Before `scanDirectory`, check `fs.existsSync()` with the resolved directory path
- **Complexity**: Complex — multi-file changes, algorithm implementation
- **Verification**: REGTEST-9, REGTEST-10, REGTEST-11, REGTEST-12 pass

**Regression test REGTEST-9**:
- **Type**: Unit test
- **Location**: `packages/tools/codegraph/lib/survey/grouper.test.ts` (new)
- **Scenario**: GIVEN a scan result with functions A, B, C where A calls B and B calls C (connected chain) WHEN `groupIntoSubmodules(scan, mockCg)` runs THEN A, B, C are grouped into one submodule
- **Oracle**: One submodule contains all three functions; connectivity-based grouping takes priority over per-file
- **Related fix**: FIX-7

**Regression test REGTEST-10**:
- **Type**: Unit test
- **Location**: `packages/tools/codegraph/lib/cmd-survey.test.ts` (new)
- **Scenario**: GIVEN a survey target directory with known symbols WHEN the scan has callees in other directories THEN `suggestedEdges` includes edges pointing outside the scanned directory
- **Oracle**: At least one edge has a target file outside `fileSet`
- **Related fix**: FIX-7

**Regression test REGTEST-11**:
- **Type**: Unit test
- **Location**: `packages/tools/codegraph/lib/cmd-survey.test.ts` (new, same file)
- **Scenario**: GIVEN exported symbol X that is never called from outside its directory WHEN computing entry points THEN X is NOT listed as an entry point
- **Oracle**: Entry points array does not contain X
- **Related fix**: FIX-7

**Regression test REGTEST-12**:
- **Type**: Unit test
- **Location**: `packages/tools/codegraph/lib/cmd-survey.test.ts` (new, same file)
- **Scenario**: GIVEN a non-existent directory path WHEN `handleSurvey` is called THEN the function returns exit code 1 with an error message
- **Oracle**: `assert.strictEqual(exitCode, 1)` and stderr contains "Directory not found"
- **Related fix**: FIX-7

### FIX-8: Add directory grouping to list-apis and show TTY caller details
- **Issue IDs**: #8 (P1), #19 (P2)
- **Root cause**: `formatter.ts:64-79` outputs flat list; TTY mode only shows caller count
- **Fix approach**:
  1. In `cmd-list-apis.ts`: before output, group `apis` by directory (extract directory from `filePath`). Create `Record<string, ApiEntry[]>`.
  2. In `formatter.ts`: add `formatApiListGrouped()` that renders grouped output with directory headers
  3. For TTY mode: when `callerCount > 0`, show first 5 caller names after the API entry line
- **Complexity**: Medium — output transformation
- **Verification**: REGTEST-13, REGTEST-14 pass

**Regression test REGTEST-13**:
- **Type**: Unit test
- **Location**: `packages/tools/codegraph/lib/cmd-list-apis.test.ts` (new)
- **Scenario**: GIVEN APIs from multiple directories WHEN `handleListApis` with `--all` formats output THEN the TTY output is grouped under directory headers
- **Oracle**: Output contains directory name as headers with APIs listed underneath
- **Related fix**: FIX-8

**Regression test REGTEST-14**:
- **Type**: Unit test
- **Location**: `packages/tools/codegraph/lib/formatter.test.ts` (new)
- **Scenario**: GIVEN an API entry with 3 callers WHEN `formatApiList` generates TTY output THEN each caller's name appears in the entry (not just caller count)
- **Oracle**: Output contains the caller names, not just "(3 callers)"
- **Related fix**: FIX-8

### FIX-9: Fix architecture tool template error handling, cascade, and validation
- **Issue IDs**: #11 (P1), #13 (P2), #25 (P2), #26 (P2)
- **Root cause**: Multiple issues in `architecture/index.ts`
- **Fix approach**:
  1. **handleTemplate** (#11): Add `else` branch after `fs.existsSync(specPath)` check — emit error message with directory diagnostic (list `.md` files in specDir), return exit code 1
  2. **handleTemplate** (#13): Use `createRequire` to dynamically import `@colbymchenry/codegraph`; check `CodeGraph.isInitialized()`; if yes, call `cg.getNodesByKind('function')` and prepend API list as YAML comments to the generated `proposal.yaml`
  3. **removeSubmodule** (#25): Add optional `merged` parameter; in the apply loop, when calling `removeSubmodule(parent, sub.slug)`, also pass `merged`; the function filters `merged.edges` for any edge whose endpoint references `feature.slug + sub.slug`
  4. **handleApply edge add** (#26): Before adding an edge, validate that `findFeature(merged, from.feature)` and `findFeature(merged, to.feature)` exist; if `submodule` specified, also validate `findSubmodule(feature, sub.slug)` exists; throw descriptive error if missing
- **Complexity**: Medium — multiple functions in one file
- **Verification**: REGTEST-15, REGTEST-16, REGTEST-17 pass

**Regression test REGTEST-15**:
- **Type**: Unit test
- **Location**: `packages/tools/architecture/index.test.ts` (new)
- **Scenario**: GIVEN a non-existent --spec path with no SPEC.md WHEN `handleTemplate` is called THEN exit code is 1 and stderr contains diagnostic about the missing path
- **Oracle**: `assert.strictEqual(exitCode, 1)` and stderr includes helpful path suggestion
- **Related fix**: FIX-9

**Regression test REGTEST-16**:
- **Type**: Integration test
- **Location**: `packages/tools/architecture/index.test.ts` (new, same file)
- **Scenario**: GIVEN a batch YAML with a submodule `remove` action on a feature that has cross-feature edges in `merged.edges` WHEN `handleApply` processes the batch THEN after removal, no cross-feature edge references the removed submodule
- **Oracle**: All `merged.edges` entries are checked: none have `from.submodule === slug` or `to.submodule === slug` combined with `from.feature === parentSlug` / `to.feature === parentSlug`
- **Related fix**: FIX-9

**Regression test REGTEST-17**:
- **Type**: Unit test
- **Location**: `packages/tools/architecture/index.test.ts` (new, same file)
- **Scenario**: GIVEN a batch YAML with an edge declaring `from: non-existent-feature/sub` WHEN `handleApply` processes the edge THEN an error is thrown with message containing the missing feature slug
- **Oracle**: `rejects` or `strictEqual(exitCode, 1)` with error message referencing "non-existent-feature"
- **Related fix**: FIX-9

### FIX-10: Update design SKILL.md workflow with full pipeline
- **Issue IDs**: #3 (P1), #27 (P2)
- **Root cause**: Step 5e in `skills/design/SKILL.md` still describes the old render/validate/diff flow
- **Fix approach**: Replace Step 5e content with:
  1. LLM fills `proposal.yaml` based on CodeGraph data and design decisions
  2. `apltk architecture apply proposal.yaml` (batch mutation)
  3. `apltk codegraph verify --spec <spec_dir>` (deterministic verification)
  4. Keep the existing render/validate/diff as optional fallback (prepend "Alternatively, if using the classic workflow:")
- **Complexity**: Simple — documentation-only
- **Verification**: Manual grep: `grep -c "apply" skills/design/SKILL.md` returns ≥1
- **No regression test**: Documentation-only change

### FIX-11: Update init-project-html SKILL.md with architecture apply reference
- **Issue IDs**: #12 (P1), #27 (P2)
- **Root cause**: Workflow step 2 only references "apltk cli 工具" without specifying `architecture apply`
- **Fix approach**: In step 2, replace generic reference with explicit instruction: "使用 `apltk architecture apply <proposal.yaml>` 進行批次 atlas 寫入（取代逐一手動 mutation）"
- **Complexity**: Simple — documentation-only
- **Verification**: Manual grep: `grep -c "architecture apply" skills/init-project-html/SKILL.md` returns ≥1
- **No regression test**: Documentation-only change

---

## 6. Worker Prompt Library

### FIX-1: Fix verify parser and edge validation

```
## Mission — Fix the `codegraph verify` YAML parser and edge relationship validation

## Context
Two P0 issues in the verify command:
1. `cmd-verify.ts::parseSimpleYamlFeature` parses object-format functions as raw strings — `"name: init"` instead of `"init"`, and the for-loop breaks after the first function entry. Root cause: hand-written line-by-line YAML parser.
2. `checker.ts::verifyOverlay` only checks that edge endpoint symbols exist via `searchNodes()`, but never verifies the actual caller/callee RELATIONSHIP via `getCallers()`/`getCallees()`.

## Input — Files to read
- `packages/tools/codegraph/lib/cmd-verify.ts` — the verify handler with the broken parser
- `packages/tools/codegraph/lib/verify/checker.ts` — the verification logic
- `skills/init-project-html/lib/atlas/state.js` — reference `loadOverlay` using `js-yaml` (lines 147-183)
- `packages/tools/codegraph/lib/cg-instance.ts` — existing pattern for importing CodeGraph
- `packages/tools/architecture/index.ts` — for reference on how `js-yaml` is imported (line 5: `import yaml from 'js-yaml'`)

## What to do

### Step 1: Replace `loadOverlay()` custom parser with js-yaml
In `cmd-verify.ts`:
- Remove the custom `loadOverlay()` function (lines 18-96)
- Remove `parseSimpleYamlFeature()` (lines 102-140)
- Remove helper functions: `extractValue()`, `extractValueFromLines()`, `findLineIndex()`, `extractYamlListItems()`
- Import `js-yaml`: `import yaml from 'js-yaml'`
- Import `fs` and `path`
- Import `normalizeFeature` from `skills/init-project-html/lib/atlas/state.js` (or inline a minimal version)
- Rewrite `loadOverlay()` to:
  - Read `atlas.index.yaml` via `yaml.load(fs.readFileSync(...))` → extract `features` array, `edges`, `meta`
  - Read feature files from `features/` directory via `yaml.load()` for each `.yaml` file
  - Read `_removed.yaml` via `yaml.load()` if exists
  - Return the same overlay structure as before: `{ features, edges, removed, meta, featureOrder }`
- Make sure function objects have `name` as a string property (not `{name: ...}` object syntax)

### Step 2: Fix `verifyOverlay` in `checker.ts` to validate edge relationships
In `checker.ts`:
- Import CodeGraph via `createRequire` (same pattern as other cmd-*.ts files)
- In the edge verification loop (around line 105-136):
  - For each edge with both `from` and `to` resolved to symbol names:
    - Search for `from` symbol via `searchNodes()`
    - For the matched from-node, call `cg.getCallers(fromNode.id)` or `cg.getCallees(fromNode.id)`
    - Verify that the `to` symbol appears in the callee list (for a `call` edge)
    - If the relationship doesn't exist, add a failure entry
- The checker function signature should accept `cg` parameter — it's already passed from `handleVerify`

### Step 3: Fix submodule `action: add` guard
In the replacement `parseSimpleYamlFeature` (or equivalent parser in `loadOverlay`):
- When parsing submodules from YAML, capture `action` field directly from parsed YAML object
- No `if (sub.action)` guard needed when using js-yaml — the field will be parsed correctly

## Scope
- Allowed files: `packages/tools/codegraph/lib/cmd-verify.ts`, `packages/tools/codegraph/lib/verify/checker.ts`
- Read-only for reference: `skills/init-project-html/lib/atlas/state.js`, `packages/tools/architecture/index.ts`
- Forbidden: any other file

## Output
Report:
- Summary of changes to `cmd-verify.ts` (what was removed, what was added)
- Summary of changes to `checker.ts` (edge validation logic)
- Test results from verify step

## Verify
- `cd packages/tools/codegraph && npx tsc --noEmit` — must pass
- `cd /tmp && mkdir -p test-verify && echo 'features:\n  - slug: existing-feature\n    action: add' > test-verify/architecture_diff/atlas/atlas.index.yaml && node -e "..."` — verify loads without parse errors

## Boundaries
- After replacing the parser, the overlay structure returned by `loadOverlay()` must be backward-compatible with what `handleVerify` expects
- Do not change `handleVerify()`'s caller interface — only the internal parser
- Edge validation: report a FAILURE when the relationship doesn't exist, not a crash
```

### FIX-2: Fix cg-instance.ts init behavior

```
## Mission — Fix init behavior for already-initialized projects

## Context
Two issues in `cg-instance.ts`:
1. `createOrOpenIndex()` silently calls `CodeGraph.open()` when project is already initialized, instead of erroring with sync suggestion
2. Missing `@colbymchenry/codegraph` install error handling

## Input — Files to read
- `packages/tools/codegraph/lib/cg-instance.ts`
- `packages/tools/codegraph/index.ts` — dispatch, especially the try/catch at lines 112-114
- `packages/tools/codegraph/lib/cmd-init.ts` — how handleInit uses createOrOpenIndex

## What to do

### Step 1: Fix already-initialized behavior
In `createOrOpenIndex()` (lines 34-46):
- When `CodeGraph.isInitialized(projectRoot)` is true, throw an error with message:
  "Project is already initialized at {projectRoot}. Use `apltk codegraph sync` to update the index."
- Let the caller's catch block (in `handleInit`) handle the error display

### Step 2: Add install guide for missing dependency
In `index.ts` `codegraphHandler` catch block (line 112-114):
- Check if `error.code === 'MODULE_NOT_FOUND'` OR `error.message.includes('Cannot find module')`
- If yes, write to stderr: "`@colbymchenry/codegraph` is not installed. Run `npm install @colbymchenry/codegraph` in your project directory."
- Otherwise, write the generic error message as before

### Step 3: Align API with DESIGN.md (if needed)
Check `@colbymchenry/codegraph` npm package API:
- If `CodeGraph.init(projectRoot, {index: true})` works → add a comment documenting this deviation
- If not → change to `cg = CodeGraph.init(projectRoot); await cg.indexAll({onProgress})`

## Scope
- Allowed: `packages/tools/codegraph/lib/cg-instance.ts`, `packages/tools/codegraph/index.ts`
- Forbidden: any other file

## Verify
- `cd packages/tools/codegraph && npx tsc --noEmit`
- Review the changed `cg-instance.ts` to confirm the error message contains "sync"

## Boundaries
- Preserve the function signature `createOrOpenIndex(projectRoot, options?)` — callers depend on it
- The already-initialized error should only apply to `init` semantics, not `open` — but since this function is only called from `handleInit`, it's safe
```

### FIX-3: Add duration to init --index summary

```
## Mission — Add duration tracking to `cmd-init.ts` for `init --index` summary

## Context
Spec requires `init --index` to display "duration" in its summary. Currently only Files, Nodes, Edges are shown.

## Input — Files to read
- `packages/tools/codegraph/lib/cmd-init.ts`
- `packages/tools/codegraph/lib/cmd-sync.ts` — has `durationMs` in output (reference pattern)

## What to do
1. In `handleInit()`, add `const start = Date.now()` before `createOrOpenIndex()`
2. Add `const durationMs = Date.now() - start` after `closeIndex(cg)` 
3. Include `durationMs` in the `result` object
4. In the TTY summary, add a line: `summary.push(['Duration:', `${durationMs}ms`])`
5. Add a `Duration:` timer output, same format as `cmd-sync.ts:43`

## Scope
- Allowed: `packages/tools/codegraph/lib/cmd-init.ts`
- Forbidden: any other file

## Verify
- `cd packages/tools/codegraph && npx tsc --noEmit`
- Grep for "Duration" or "durationMs" in `cmd-init.ts` — should show matches
```

### FIX-4: Fix sync progress display and init check

```
## Mission — Fix sync command: display progress and add init check

## Context
Two issues in `cmd-sync.ts`:
1. Progress events are collected (line 14-19) but never displayed, unlike `cmd-init.ts` which shows real-time progress
2. No `CodeGraph.isInitialized()` check before calling `CodeGraph.open()` — uninitialized projects get cryptic errors

## Input — Files to read
- `packages/tools/codegraph/lib/cmd-sync.ts`
- `packages/tools/codegraph/lib/cmd-init.ts` — reference for onProgress display pattern (lines 15-17)
- `packages/tools/codegraph/lib/cg-instance.ts` — findProjectRoot and the CodeGraph require

## What to do

### Step 1: Display progress in TTY mode
In `handleSync()`, modify the `onProgress` callback (lines 15-19):
- Same pattern as `cmd-init.ts:15-17`: if `process.stdout.isTTY`, write `\r  Indexing: ${p.phase} ${p.current}/${p.total}` to stdout
- After sync() completes, if TTY, write `\n`

### Step 2: Include progress in JSON output
Add `progress: progressEvents` to the `output` object

### Step 3: Add initialized check
Before `CodeGraph.open()` at line 12:
- Import `{ CodeGraph }` via `createRequire` (already done at lines 1-3)
- Check `CodeGraph.isInitialized(projectRoot)` — if false, write to stderr: "CodeGraph is not initialized. Run `apltk codegraph init` first." and return 1

## Scope
- Allowed: `packages/tools/codegraph/lib/cmd-sync.ts`
- Forbidden: any other file

## Verify
- `cd packages/tools/codegraph && npx tsc --noEmit`
- Review the code to confirm progress output and init check are present
```

### FIX-5: Add languages list to status output

```
## Mission — Add "supported languages" list to `codegraph status` human-readable output

## Context
Spec requires status to show "supported languages list". The `GraphStats` object has `filesByLanguage` data, but the human-readable path never reads it.

## Input — Files to read
- `packages/tools/codegraph/lib/cmd-status.ts`

## What to do
1. After line 36 where `edgeKindSummary` is built, add similar code for `filesByLanguage`:
```typescript
const langEntries = Object.entries(stats.filesByLanguage || {}).filter(([, v]) => (v as number) > 0);
const langSummary = langEntries.length > 0 
  ? langEntries.map(([lang, count]) => `    ${lang.padEnd(14)} ${count}`).join('\n')
  : '    (no files indexed)';
```
2. After writing `edgesByKind` (line 39), write languages:
```typescript
process.stdout.write('\nLanguages:\n');
process.stdout.write(langSummary + '\n');
```

## Scope
- Allowed: `packages/tools/codegraph/lib/cmd-status.ts`
- Forbidden: any other file

## Verify
- `cd packages/tools/codegraph && npx tsc --noEmit`
- Review output to confirm Languages section is present
```

### FIX-6: Fix explore output grouping and --feature support

```
## Mission — Fix explore output to group by file, add --feature support, and clean dispatch

## Context
Three issues:
1. explore output per-symbol instead of grouped by file (spec requires "按所屬檔案分組")
2. `--feature` flag not supported for explore command
3. Duplicate `--index` flag check in dispatch

## Input — Files to read
- `packages/tools/codegraph/lib/cmd-explore.ts`
- `packages/tools/codegraph/index.ts`
- `packages/tools/codegraph/lib/cmd-list-apis.ts` — reference for how --feature is received by handler

## What to do

### Step 1: Group explore output by file
In `cmd-explore.ts` human-readable section (lines 78-112):
- Instead of iterating `details` directly, group by `filePath`
- For each file, print `=== filePath ===` header, then list all symbols in that file:
  ```
  === src/utils.ts ===
  
    someFunction [function] line 10-25
      QName: ...
      Callers (N): ...
      Callees (N): ...
      Source: ...
  
    someClass [class] line 30-90
      ...
  ```

### Step 2: Add --feature to explore
In `cmd-explore.ts`:
- Add `feature?: string` to `ExploreOptions` interface
- In `handleExplore`, after getting results, if `options.feature` is set, tag the output
- In `index.ts:86`, pass `featureName` to `handleExplore`: `{ json: isJson, feature: featureName }`

### Step 3: Fix duplicate --index flag check
In `index.ts:63`, simplify to: `return await handleInit(projectRoot, { index: shouldIndex, json: isJson })`

### Step 4: Actually use --feature in survey and list-apis
In `cmd-survey.ts` and `cmd-list-apis.ts`, ensure `options.feature` is actually consumed (not just received and ignored):
- In survey: include feature slug in the report object
- In list-apis: filter by feature path if --feature is provided

## Scope
- Allowed: `packages/tools/codegraph/lib/cmd-explore.ts`, `packages/tools/codegraph/index.ts`
- Also modify: `packages/tools/codegraph/lib/cmd-survey.ts` (consume feature flag)
- Also modify: `packages/tools/codegraph/lib/cmd-list-apis.ts` (consume feature flag for directory filter if both --feature and [path] are provided)
- Forbidden: any other file

## Verify
- `cd packages/tools/codegraph && npx tsc --noEmit`
```

### FIX-7: Implement survey call graph connectivity and fix correctness

```
## Mission — Implement call graph connectivity analysis in grouper, fix cross-boundary edges, entry points, and directory check

## Context
Four issues in the survey module:
1. grouper.ts only groups by file, no call graph connectivity (DESIGN.md Section 7.2 violation)
2. Cross-boundary calls are filtered intra-directory instead of inter-directory
3. Entry points only check isExported, not actual external callers
4. Non-existent directory returns empty report instead of error

## Input — Files to read
- `packages/tools/codegraph/lib/survey/grouper.ts`
- `packages/tools/codegraph/lib/survey/scanner.ts`
- `packages/tools/codegraph/lib/cmd-survey.ts`
- `docs/plans/2026-06-03/codegraph-integration/DESIGN.md` Section 7.2

## What to do

### Step 1: Add call graph connectivity to grouper.ts
- Add `cg: any` parameter to `groupIntoSubmodules(scan, cg)`
- Build adjacency map: for each symbol in `scan.allSymbols`, find its node via `cg.getNodesByName()`, call `cg.getCallees(node.id)`, collect callee names that are also in `scan.allSymbols`
- Run BFS/DFS on the undirected graph to find connected components
- Components with ≥2 symbols → create submodule suggestion
- Remaining unassigned symbols → fall back to per-file grouping (existing logic)
- The algorithm structure:
  1. Build adjacency map (symbol name → callee names within scan)
  2. BFS to find connected components
  3. Components ≥2 → submodule candidates using existing inferKind/inferRole
  4. Remaining symbols → per-file fallback (existing code)
  5. Apply mergeByDirectoryPrefix as final step

### Step 2: Fix cross-boundary edges in cmd-survey.ts
- Change `if (fileSet.has(callee.node.filePath))` to `if (!fileSet.has(callee.node.filePath))` at line 149
- This makes `suggestedEdges` contain edges that go OUTSIDE the scanned directory
- Add dedup via a `Set<string>` of `source::target` pairs

### Step 3: Fix entry point detection in cmd-survey.ts
- Lift `fileSet` construction from `buildEdgeSuggestions` to `handleSurvey` scope
- Replace line 72 with logic that:
  - For each exported symbol, find its node via `cg.getNodesByName()`
  - Call `cg.getCallers(node.id)`
  - Include in entryPoints if ANY caller comes from outside `fileSet`

### Step 4: Add directory existence check in cmd-survey.ts
- Before `scanDirectory()` at line 53, add:
```typescript
import { existsSync } from 'node:fs';
const targetPath = path.resolve(projectRoot, dirPath);
if (!existsSync(targetPath)) {
  process.stderr.write(`Error: Directory not found: ${dirPath}\n`);
  return 1;
}
```

### Step 5: Update makefile for grouper import

## Scope
- Allowed: `packages/tools/codegraph/lib/survey/grouper.ts`, `packages/tools/codegraph/lib/survey/scanner.ts`, `packages/tools/codegraph/lib/cmd-survey.ts`
- Forbidden: any other file

## Verify
- `cd packages/tools/codegraph && npx tsc --noEmit`
- Review the grouper algorithm: ensure connectivity analysis produces different (better) groupings than per-file-only when symbols in different files call each other
```

### FIX-8: Add directory grouping to list-apis and TTY caller details

```
## Mission — Group list-apis output by directory and show caller details in TTY mode

## Context
Two issues in `list-apis`: output not grouped by directory (spec requires it for --all), and TTY mode only shows caller count.

## Input — Files to read
- `packages/tools/codegraph/lib/cmd-list-apis.ts`
- `packages/tools/codegraph/lib/formatter.ts`
- `packages/tools/codegraph/lib/cmd-explore.ts` — reference for how caller details are shown in TTY (lines 84-91)

## What to do

### Step 1: Group by directory for --all
In `cmd-list-apis.ts`, before output:
- Group `apis` by directory: extract directory from `filePath`, create `Map<directory, ApiEntry[]>`
- For TTY output: iterate directories, print directory header, list APIs under it
- For JSON: if `--all`, output `Record<directory, ApiEntry[]>` instead of flat array

### Step 2: Add new formatter function
In `formatter.ts`:
- Add `formatApiListGrouped(apis: ApiEntry[]): string` that groups by directory and renders with headers
- Each API entry line includes: `name [kind] filePath:line (N callers)` [+ signature if available]

### Step 3: Show caller names in TTY mode
In `formatter.ts` `formatApiList()` (line 64-79):
- After each API entry line, if `callerCount > 0`, indent and show first 5 caller names:
```typescript
if (api.callerCount > 0 && api.callers) {
  const callerLines = api.callers.slice(0, 5).map(c => `      Called by: ${c.name}  ${c.filePath}:${c.startLine}`);
  lines.push(...callerLines);
  if (api.callerCount > 5) lines.push(`      ... and ${api.callerCount - 5} more`);
}
```

## Scope
- Allowed: `packages/tools/codegraph/lib/cmd-list-apis.ts`, `packages/tools/codegraph/lib/formatter.ts`
- Forbidden: any other file

## Verify
- `cd packages/tools/codegraph && npx tsc --noEmit`
```

### FIX-9: Fix architecture tool template, cascade, and validation

```
## Mission — Fix handleTemplate error handling, CodeGraph integration, submodule remove cascade, and edge validation

## Context
Four issues in `packages/tools/architecture/index.ts`:
1. Wrong SPEC.md path silently generates blank skeleton (P1)
2. CodeGraph `list-apis --all` integration absent in template (P2, optional)
3. Submodule remove doesn't cascade cross-feature edges (P2)
4. Edge add lacks referential integrity validation (P2)

## Input — Files to read
- `packages/tools/architecture/index.ts`
- `packages/tools/codegraph/lib/cg-instance.ts` — CodeGraph import and isInitialized pattern
- `packages/tools/codegraph/lib/cmd-list-apis.ts` — for reference on how to call CodeGraph

## What to do

### Step 1: Add error for wrong SPEC.md path
In `handleTemplate()`, after `const specPath = path.resolve(specDir, 'SPEC.md')`:
- Add `else` branch after the `if (fs.existsSync(specPath))` block:
  - Check if `specDir` exists: `fs.existsSync(specDir)`
  - If directory doesn't exist: error "Spec directory not found: {specDir}"
  - If directory exists but no SPEC.md: list `.md` files found, or say "No .md files found"
  - Write error to stderr, return 1

### Step 2: Add CodeGraph integration
In `handleTemplate()`, after writing the base `proposal.yaml`:
- Use `createRequire` to import `@colbymchenry/codegraph`
- Call `CodeGraph.isInitialized(projectRoot)` to check if index exists
- If yes, open CodeGraph, call `cg.getNodesByKind('function')`
- Prepend a comment block with up to 50 API entries as YAML comments
- Wrap in try/catch — if CodeGraph not installed or errors, skip silently

### Step 3: Fix submodule remove cascade
In `removeSubmodule()` (lines 56-66):
- Add optional third parameter `merged?: any`
- After filtering `feature.edges`, also filter `merged.edges`:
```typescript
if (merged) {
  merged.edges = (merged.edges || []).filter((e: any) => {
    const fromEp = typeof e.from === 'object' && e.from;
    const toEp = typeof e.to === 'object' && e.to;
    const fromMatch = fromEp && fromEp.feature === feature.slug && fromEp.submodule === slug;
    const toMatch = toEp && toEp.feature === feature.slug && toEp.submodule === slug;
    return !fromMatch && !toMatch;
  });
}
```
- In the submodule processing loop (line 281), pass `merged`: `removeSubmodule(parent, sub.slug, merged)`

### Step 4: Add edge referential integrity validation
In the edge processing loop (lines 329-385), in the `case 'add'` branch:
- Before the existing add logic, validate:
  - `findFeature(merged, from.feature)` — throw descriptive error if missing
  - If `from.submodule`: `findSubmodule(fromFeature, from.submodule)` — throw if missing
  - Same for `to.feature` and `to.submodule`
- Change `ensureFeature` to `findFeature` in the intra-feature edge path (don't auto-create)
- Error format: `edge "${edge.from} → ${edge.to}": source feature "${from.feature}" not found`

## Scope
- Allowed: `packages/tools/architecture/index.ts`
- Forbidden: any other file

## Verify
- `cd packages/tools/architecture && npx tsc --noEmit`
```

### FIX-10: Update design SKILL.md

```
## Mission — Update skills/design/SKILL.md Step 5e to include the new CodeGraph pipeline

## Context
Step 5e still uses the old render/validate/diff flow. The spec requires: proposal.yaml → architecture apply → codegraph verify.

## Input — Files to read
- `skills/design/SKILL.md` (entire file, especially Step 5 around lines 130-200)

## What to do
1. In Step 5e (Generate Architecture Diff), replace the current content with:
   ```
   ### 5e. Generate Architecture Diff

   #### New flow (CodeGraph-integrated):

   1. **Fill the proposal skeleton**: Based on your design decisions from steps 5a-5d,
      fill in the `proposal.yaml` file generated by `apltk architecture template`.
      Define the feature, its submodules, their functions, and cross-feature edges.

   2. **Apply batch mutations**:
      ```bash
      apltk architecture apply <spec_dir>/architecture_diff/atlas/proposal.yaml --spec <spec_dir>
      ```
      This processes all mutations in one call with undo protection.

   3. **Verify correctness**:
      ```bash
      apltk codegraph verify --spec <spec_dir>
      ```
      This confirms every symbol and edge reference in the spec overlay exists in the actual code.

   4. **Render and validate** (optional, for visual confirmation):
      ```bash
      apltk architecture diff --spec <spec_dir>
      ```

   Alternatively, if using the classic workflow (without CodeGraph):
   ```bash
   apltk architecture --spec <spec_dir> render
   apltk architecture --spec <spec_dir> validate
   apltk architecture diff
   ```
   ```
2. Keep step 5b.1 (CodeGraph query) unchanged — it's already correct.

## Scope
- Allowed: `skills/design/SKILL.md`
- Forbidden: any other file

## Verify
- `grep -c "apply" skills/design/SKILL.md` — should return ≥1 match
```

### FIX-11: Update init-project-html SKILL.md

```
## Mission — Update skills/init-project-html/SKILL.md Workflow step 2 to reference architecture apply

## Context
The CodeGraph survey step was correctly added, but step 2 only says "使用 apltk cli 工具" without specifying `architecture apply`.

## Input — Files to read
- `skills/init-project-html/SKILL.md` (entire file)

## What to do
1. In the Workflow Step 2 (around line 90-101), find the sentence that mentions "apltk cli 工具"
2. Replace or augment with explicit instruction:
   "使用 `apltk architecture apply <proposal.yaml>` 進行批次 atlas 寫入（取代逐一手動 mutation）"
3. Ensure the reference section already listing codegraph commands is preserved (line 122)

## Scope
- Allowed: `skills/init-project-html/SKILL.md`
- Forbidden: any other file

## Verify
- `grep -c "architecture apply" skills/init-project-html/SKILL.md` — should return ≥1 match
```

---

## 7. Fix Batch Schedule

All 11 fix workers have **no file overlap** after merging FG-6 and FG-10. Therefore:

### Batch 1 — All P0/P1/P2 Fixes (parallel)
| Worker | Issues | Complexity | Verify Gate |
|---|---|---|---|
| FIX-1 (verify parser + checker) | #1 P0, #2 P0, #14 P2, #15 P2 | Complex | `tsc --noEmit` |
| FIX-2 (cg-instance init) | #4 P1, #24 P2 | Simple | `tsc --noEmit` |
| FIX-3 (cmd-init duration) | #5 P1 | Simple | `tsc --noEmit` |
| FIX-4 (cmd-sync progress) | #21 P2, #22 P2 | Simple | `tsc --noEmit` |
| FIX-5 (cmd-status languages) | #10 P1 | Simple | `tsc --noEmit` |
| FIX-6 (explore + dispatch) | #9 P1, #16 P2, #23 P2 | Medium | `tsc --noEmit` |
| FIX-7 (survey fixes) | #6 P1, #7 P1, #17 P2, #18 P2 | Complex | `tsc --noEmit` |
| FIX-8 (list-apis grouping) | #8 P1, #19 P2 | Medium | `tsc --noEmit` |
| FIX-9 (architecture tool) | #11 P1, #13 P2, #25 P2, #26 P2 | Medium | `tsc --noEmit` |
| FIX-10 (design SKILL.md) | #3 P1, #27 P2 | Simple | grep match |
| FIX-11 (init-project-html SKILL.md) | #12 P1, #27 P2 | Simple | grep match |

**Gate checks:**
- [ ] All 11 workers report success
- [ ] `cd packages/tools/codegraph && npx tsc --noEmit` (passes)
- [ ] `cd packages/tools/architecture && npx tsc --noEmit` (passes)
- [ ] `grep -c "apply" skills/design/SKILL.md` ≥ 1
- [ ] `grep -c "architecture apply" skills/init-project-html/SKILL.md` ≥ 1

### Batch 2 — Regression Tests (parallel, after all fixes complete)
| Worker | Tests | Files |
|---|---|---|
| REGTEST-1, REGTEST-2 | Verify parser + edge validation | `cmd-verify.test.ts`, `checker.test.ts` |
| REGTEST-3 | Init already-initialized | `cg-instance.test.ts` |
| REGTEST-4 | Init duration | `cmd-init.test.ts` |
| REGTEST-5 | Sync init check + progress | `cmd-sync.test.ts` |
| REGTEST-6 | Status languages | `cmd-status.test.ts` |
| REGTEST-7, REGTEST-8 | Explore grouping + --feature | `cmd-explore.test.ts` |
| REGTEST-9, REGTEST-10, REGTEST-11, REGTEST-12 | Survey fixes (4 tests) | `grouper.test.ts`, `cmd-survey.test.ts` |
| REGTEST-13, REGTEST-14 | list-apis grouping + TTY callers | `cmd-list-apis.test.ts`, `formatter.test.ts` |
| REGTEST-15, REGTEST-16, REGTEST-17 | Architecture tool fixes (3 tests) | `index.test.ts` |

**Gate checks:**
- [ ] Each REGTEST worker reports all tests passing
- [ ] `npm test` from project root passes

### Batch 3 — Final Verification
- [ ] Full build: `npm run build`
- [ ] Full test suite: `npm test`
- [ ] `npx tsc --noEmit` (project root)
- [ ] All 27 REPORT.md issues addressed (cross-check issue IDs)
- [ ] Commit: `fix: address codegraph-integration review findings — verify parser, survey grouping, explore output, skill workflows`

---

## 8. Regression Test Inventory

17 regression tests across 11 test files:

| Test ID | Type | File | Related Fix | Oracle |
|---|---|---|---|---|
| REGTEST-1 | Unit | `cmd-verify.test.ts` | FIX-1 | Function names parsed correctly from object-format YAML |
| REGTEST-2 | Integration | `checker.test.ts` | FIX-1 | Non-existent edge relationship reported as failure |
| REGTEST-3 | Unit | `cg-instance.test.ts` | FIX-2 | Error thrown with "sync" for already-initialized |
| REGTEST-4 | Unit | `cmd-init.test.ts` | FIX-3 | Output contains durationMs |
| REGTEST-5 | Unit | `cmd-sync.test.ts` | FIX-4 | Exit 1 with "init" message on uninitialized project |
| REGTEST-6 | Unit | `cmd-status.test.ts` | FIX-5 | Output lists language names |
| REGTEST-7 | Unit | `cmd-explore.test.ts` | FIX-6 | Symbols in same file under one header |
| REGTEST-8 | Unit | `cmd-explore.test.ts` | FIX-6 | --feature accepted without error |
| REGTEST-9 | Unit | `grouper.test.ts` | FIX-7 | Connected functions grouped together |
| REGTEST-10 | Unit | `cmd-survey.test.ts` | FIX-7 | suggestedEdges includes external targets |
| REGTEST-11 | Unit | `cmd-survey.test.ts` | FIX-7 | Entry points filtered by external callers |
| REGTEST-12 | Unit | `cmd-survey.test.ts` | FIX-7 | Non-existent directory returns exit code 1 |
| REGTEST-13 | Unit | `cmd-list-apis.test.ts` | FIX-8 | Output grouped by directory |
| REGTEST-14 | Unit | `formatter.test.ts` | FIX-8 | TTY output shows caller names |
| REGTEST-15 | Unit | `index.test.ts` | FIX-9 | Wrong spec path returns exit 1 with diagnostic |
| REGTEST-16 | Integration | `index.test.ts` | FIX-9 | Submodule remove cascades cross-feature edges |
| REGTEST-17 | Unit | `index.test.ts` | FIX-9 | Edge to non-existent feature returns error |

---

## 9. Verification Checkpoints

### Per-batch

| Batch | Verification Command | Expected Result |
|---|---|---|
| Batch 1 | `cd packages/tools/codegraph && npx tsc --noEmit` | Pass |
| Batch 1 | `cd packages/tools/architecture && npx tsc --noEmit` | Pass |
| Batch 2 | `npm test` (from project root) | All tests pass |
| Batch 3 | `npm run build` | Build succeeds |
| Batch 3 | `npx tsc --noEmit` (project root) | No errors |

### Regression test special gate

For each REGTEST, the worker must confirm:
- The test scenario exercises code that was broken before the fix
- The test passes on the fixed code

### Final verification

- [ ] `npm run build` — full project build
- [ ] `npm test` — all tests pass (existing + new)
- [ ] All 27 REPORT.md issues cross-checked: every issue has a corresponding fix worker
- [ ] No lint/type errors: `npx tsc --noEmit`

---

## 10. Error Recovery

| Scenario | Response |
|---|---|
| A single fix worker reports failure | Retry with the worker's existing context (do not create a new one), giving more specific guidance. At most one retry. |
| Same worker fails twice | Pause the entire flow. Preserve successful results from other workers. Report to the user: which task failed, what was tried, suggested next steps. |
| Merge conflict (merging worker results) | Coordinator resolves the conflict, then re-runs the batch gate verification. |
| Test regression (new code breaks existing tests) | Pause. Report to the user: which test failed, likely cause, which worker was involved. Do not weaken the test to make it pass. |
| `@colbymchenry/codegraph` API doesn't match expectations | Pause. Check the installed version. Document the discrepancy and report. |

---

## 11. Fix History

This is the first fix round. No previous FIX.md exists.

---

## 12. Boundaries

### ALWAYS
- Run gate verification immediately after every batch
- Extract worker prompts verbatim from Section 6 — do not rewrite them
- After a worker reports success/failure, digest the results before deciding next steps
- Follow the File Ownership implied by task assignments — do not let two workers modify the same file
- Resolve merge conflicts yourself when combining worker results
- After two failures, pause and ask — do not keep retrying
- When writing regression tests: ensure the test would have FAILED on the pre-fix code

### ASK FIRST
- Need to modify a file not listed in any fix worker's scope
- Need to add a new external dependency
- Worker has failed twice
- Test regression cannot be quickly diagnosed
- `@colbymchenry/codegraph` API doesn't match expectations (check version in package.json)

### NEVER
- Remove or alter existing passing functionality (tests, behavior) to make a regression test pass
- Skip verification and proceed to the next batch
- Workers spawn sub-workers
- Give workers vague instructions
- Expand fix scope beyond the issues listed in this FIX.md
- Proceed to the next batch when the current batch's gate has not passed
