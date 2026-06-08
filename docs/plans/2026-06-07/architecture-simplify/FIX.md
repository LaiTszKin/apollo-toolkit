# Fix Coordinator Prompt: 簡化 apltk architecture 指令 (Round 6)

- **Date**: 2026-06-08
- **Source REPORT**: `docs/plans/2026-06-07/architecture-simplify/REPORT.md`
- **Source Spec**: `docs/plans/2026-06-07/architecture-simplify/`
- **Total Issues**: P1:11
- **Total Regression Tests**: 11

---

## 1. Your Role & Rules

### Mission

Fix all 11 P1 defects identified in REPORT.md Round 6 for the architecture CLI simplification. The work is split into seven fix workers and eleven regression-test workers. Most source changes touch `skills/init-project-html/lib/atlas/cli.js`, so those workers must run sequentially unless their allowed file sets have zero overlap.

**Success looks like**: all 11 REPORT.md issues are resolved, all 11 new regression tests pass, `npm test` passes, and no fine-grained architecture command surface remains discoverable through public help or active agent docs.

### Your Role

**You are the fix coordinator.** You do not write code. Your job is to understand the issue inventory, dispatch the worker prompts in `fix/*.md`, digest each worker result, and verify that every issue is resolved without introducing regressions.

**What you do:**
- Read the issue inventory, dependency analysis, and fix details below.
- Dispatch workers using the exact prompt files listed in Section 3.
- Enforce the file-overlap gate: workers that edit the same file run sequentially.
- Run verification commands after every batch.
- Start regression-test workers only after all fix workers pass.
- Resolve merge conflicts if parallel workers touch disjoint files but produce integration conflicts.

**What you NEVER do:**
- Modify source or test files directly, except to resolve conflict markers after workers return.
- Skip a verification checkpoint.
- Start regression tests before all fix batches pass.
- Let workers spawn sub-workers.
- Defer any REPORT.md issue to a later round.

### Boundaries

**ALWAYS**
- Run the listed gate verification immediately after each batch.
- Keep the implementation within the architecture CLI/state/render/test/docs files listed in Section 5.
- Preserve existing CLI behavior unless REPORT.md identifies it as defective.
- Treat `--spec` writes as overlay-only and base writes as direct YAML writes.
- Ensure each new regression test would fail against the Round 6 code and pass after the fix.

**ASK FIRST**
- A worker concludes that fixing a defect requires a new external dependency.
- A worker concludes that the spec/design is internally contradictory and cannot be implemented coherently.
- The same worker fails twice.
- A regression test cannot be made to fail before the fix.

**NEVER**
- Weaken, skip, or delete existing tests to make a batch pass.
- Install uncommitted skill changes directly.
- Modify `.codegraph/codegraph.db`.
- Change unrelated formatting or refactor outside the named functions.

### Error Recovery

| Scenario | Response |
|---|---|
| Fix worker reports failure | Send one retry to the same worker with the failing command/output and the specific file/function to re-check. |
| Same fix worker fails twice | Stop the flow and report the blocked worker, completed workers, and failing verification. |
| Regression test fails after fix | Determine whether the test oracle is wrong or the related fix is incomplete. Return to the responsible worker. |
| Regression test passes on unfixed code | Reject the test and redesign it before proceeding. |
| Merge conflicts | Coordinator resolves conflict markers, then reruns the current batch gate. |
| Existing tests regress | Stop and identify the worker and file that introduced the regression. |

---

## 2. Context

### Issue Inventory

- FIX-01 (P1-1, Complex): Unified `add` writes relation kinds rejected by schema — `cli.js`, `schema.js`, `render.js`, CSS asset if needed.
- FIX-02 (P1-2/P1-3, Complex): Endpoint validation is incomplete for `--deployed-on`, `--implements`, and `--data-flow-to` — `cli.js`.
- FIX-03 (P1-4/P1-6/P1-7, Complex): Single and batch `add` are not atomic enough; failed add writes partial state, `add --spec` batch hits `overlayDir is not defined`, and failed batch leaves undo/history side effects — `cli.js`.
- FIX-04 (P1-5, Medium): Batch entity blocks inherit globally parsed relation flags instead of remaining independent — `cli.js`.
- FIX-05 (P1-8, Medium): `remove module` leaves root-level cross-feature edges that reference the removed module — `cli.js`.
- FIX-06 (P1-9/P1-10, Medium): Fine-grained commands remain discoverable through direct help and active skill docs — `cli.js`, `cli-help.js`, docs.
- FIX-07 (P1-11, Medium): `diff --spec` can reference missing after-side HTML when overlay was created with `--no-render` — `cli.js`.

### Fix Dependency Analysis

**Logical dependencies:**
- FIX-01 should run before FIX-02 because endpoint validation may rely on the final accepted edge-kind vocabulary.
- FIX-03 should run before FIX-04 because the batch parser and atomic processing paths are adjacent; keep the state/rollback changes settled first.
- FIX-07 can run after FIX-03 because both touch `--spec` overlay behavior and `cli.js`.
- FIX-06 docs can run after the CLI help behavior is fixed.

**File overlaps:**
- FIX-01 touches `cli.js`, `schema.js`, `render.js`, and possibly `skills/init-project-html/references/architecture.css`.
- FIX-02, FIX-03, FIX-04, FIX-05, and FIX-07 all touch `cli.js`; run them sequentially.
- FIX-06 touches `cli.js`, `cli-help.js`, `skills/design/references/architecture.md`, `skills/update-project-html/SKILL.md`, and tests; run after the `cli.js` fixes.
- All REGTEST workers modify `test/atlas-cli.test.js` or `test/architecture-script.test.js`; tests sharing the same file must run sequentially.

### Fix Details (with Regression Test Design)

#### FIX-01: Align relation edge kinds with schema/render (P1-1)

**Root cause**: `processAddEntity()` writes `dependency`, `implements`, and `deployed-on` edge kinds, but `schema.js` only accepts `call`, `return`, `data-row`, and `failure`. `render.js` marker/legend generation is also hard-coded to the old four kinds.

**Files involved**: `schema.js` `EDGE_KINDS`; `render.js` marker and legend generation; `cli.js` relation add paths.

**Fix approach**: Add the three unified relation kinds to the schema vocabulary and render marker/legend support. Keep existing `data-row` spelling. Do not re-encode these relationships into labels or unrelated edge kinds.

**Complexity**: Complex.

**Regression test**: REGTEST-33, Integration, `test/atlas-cli.test.js`.
- GIVEN features/modules exist WHEN unified add creates `dependency`, `implements`, and `deployed-on` relationships THEN `validate` returns code 0.
- Oracle: Round 6 code fails validation; fixed code passes.

#### FIX-02: Validate relation endpoints fully (P1-2/P1-3)

**Root cause**: Target checks only verify the feature portion of `feature/submodule` endpoints. Deployment targets are treated as normal atlas endpoints but the example target can be a non-feature infrastructure name.

**Files involved**: `cli.js` `processAddEntity()` and endpoint helper area.

**Fix approach**: Add a shared endpoint validation helper for atlas endpoints. Validate submodules when an endpoint includes `feature/submodule`. For `--deployed-on`, require the target to resolve to an existing feature or submodule unless the implementation introduces a deliberate existing-kind target supported by schema/render. Keep error messages listing available features or submodules.

**Complexity**: Complex.

**Regression tests**: REGTEST-34 and REGTEST-35, Integration, `test/atlas-cli.test.js`.
- REGTEST-34: GIVEN feature `b` exists without submodule `svc` WHEN adding `--implements b/svc` or `--data-flow-to b/svc` THEN command fails and no edge is written.
- REGTEST-35: GIVEN no `eks-cluster` endpoint exists WHEN adding `--deployed-on eks-cluster` THEN command fails without writing an invalid edge.

#### FIX-03: Make add mutations atomic and fix spec-batch overlayDir scope (P1-4/P1-6/P1-7)

**Root cause**: Feature/module creation happens before related edge/target validation. Batch code declares `overlayDir` inside blocks and later references it outside those blocks. Batch processing mutates delegated feature/module operations without forwarding `skipUndo`, so undo/history side effects can remain after rollback.

**Files involved**: `cli.js` `verbAdd()`, `processAddEntity()`, interleaved batch path, simple pair batch path.

**Fix approach**: Pre-validate all relation targets before any entity write for single-entity and batch adds. Hoist or persist `overlayDir` for successful spec-batch undo/history writes. Forward `skipUndo` into delegated `verbFeature()` and `verbSubmodule()` calls during batch processing. Ensure rollback restores YAML and avoids extra history/undo entries for failed batches.

**Complexity**: Complex.

**Regression tests**: REGTEST-36, REGTEST-37, REGTEST-38, Integration, `test/atlas-cli.test.js`.
- REGTEST-36: failed single `add feature bad --depends-on missing` leaves no `bad` feature in state.
- REGTEST-37: successful `add --spec` batch exits 0 and writes overlay under the spec dir.
- REGTEST-38: failed batch leaves no extra `atlas.history.log` or undo stack entries and restores state.

#### FIX-04: Keep batch entity flags independent (P1-5)

**Root cause**: `parseFlags()` captures relation flags before batch parsing, and the interleaved batch parser copies those global relation flags into any entity missing them.

**Files involved**: `cli.js` interleaved batch parser.

**Fix approach**: Only copy true global flags (`project`, `spec`, `no-render`, `dry-run`, `evidence`) into each entity. Do not copy `depends-on`, `part-of`, `data-flow-to`, `implements`, `deployed-on`, or `to` into later entities. Preserve normal single-entity parsing.

**Complexity**: Medium.

**Regression test**: REGTEST-39, Integration, `test/atlas-cli.test.js`.
- GIVEN global-looking `--depends-on target` appears before the first entity in a batch WHEN adding `feature a feature b` THEN only the intended first entity receives the relation or the command requires explicit per-entity flags; later entities do not inherit it silently.
- Oracle: Round 6 code gives both features the dependency; fixed code does not.

#### FIX-05: Cascade remove module across root edges (P1-8)

**Root cause**: `removeSubmodule()` removes local feature edges only. Root-level `state.edges` entries referencing `feature/submodule` are not filtered.

**Files involved**: `cli.js` `removeSubmodule()` and/or `verbSubmodule('remove')`.

**Fix approach**: When removing a submodule, also remove root-level edges whose `from` or `to` endpoint references the removed feature/submodule pair. Keep existing feature-remove cleanup intact.

**Complexity**: Medium.

**Regression test**: REGTEST-40, Integration, `test/atlas-cli.test.js`.
- GIVEN a cross-feature edge from `a/svc` to `b/api` WHEN removing module `svc --part-of a` THEN the edge is removed from `state.edges`.

#### FIX-06: Hide fine-grained command discovery from help/docs (P1-9/P1-10)

**Root cause**: The dispatch help path still renders action-specific pages for hidden verbs, and active skill docs still teach fine-grained command syntax.

**Files involved**: `cli.js` dispatch help branch; `cli-help.js`; `skills/design/references/architecture.md`; `skills/update-project-html/SKILL.md`; `test/architecture-script.test.js`.

**Fix approach**: For hidden verbs, direct `--help` must show general public architecture help or a short message pointing to `add`/`remove`, not fine-grained action pages. Rewrite active docs to teach unified `add`/`remove` for feature/module/relation workflows and avoid listing hidden command examples.

**Complexity**: Medium.

**Regression tests**: REGTEST-41 and REGTEST-42.
- REGTEST-41, Unit, `test/architecture-script.test.js`: `edge add --help` does not contain `apltk architecture edge add` and does contain unified public commands.
- REGTEST-42, Documentation scan, `test/architecture-script.test.js` or a new node:test block: active docs do not contain forbidden examples for hidden verbs.

#### FIX-07: Render after-side pages for diff --spec state overlays (P1-11)

**Root cause**: `collectSingleSpecChanges()` maps after paths under `architecture_diff/` without rendering state-overlay HTML when it is missing.

**Files involved**: `cli.js` `collectDiffChanges()`, `collectSingleSpecChanges()`, `diffToChanges()`.

**Fix approach**: When `diff --spec` finds overlay state, render the merged state into the spec `architecture_diff/` output before building changes, or have `collectSingleSpecChanges()` render missing after pages using the same scoped render logic as `runRender()`. Ensure this does not mutate base atlas state.

**Complexity**: Medium.

**Regression test**: REGTEST-43, Integration, `test/atlas-cli.test.js`.
- GIVEN `add --spec --no-render` writes overlay state only WHEN running `diff --spec` THEN every non-null `afterPath` referenced by the viewer exists on disk.

---

## 3. Execution Plan

### Worker Prompt Index

**Fix Worker Prompts:**

| Fix ID | Worker Prompt File | Description |
|---|---|---|
| FIX-01 | `fix/FIX-01-relation-edge-schema.md` | Align relation edge kinds with schema/render |
| FIX-02 | `fix/FIX-02-endpoint-validation.md` | Validate submodule and deployment targets |
| FIX-03 | `fix/FIX-03-add-atomicity.md` | Fix add atomicity, spec-batch overlayDir, and failed-batch side effects |
| FIX-04 | `fix/FIX-04-batch-flag-scoping.md` | Prevent per-entity batch flag leakage |
| FIX-05 | `fix/FIX-05-remove-module-cascade.md` | Remove root-level edges when removing modules |
| FIX-06 | `fix/FIX-06-hide-fine-grained-help-docs.md` | Hide fine-grained command discovery in help and docs |
| FIX-07 | `fix/FIX-07-diff-spec-render.md` | Ensure diff --spec renders missing after pages |

**Regression Test Worker Prompts:**

| Test ID | Worker Prompt File | Related Fix | Description |
|---|---|---|---|
| REGTEST-33 | `fix/REGTEST-33-relation-kinds-validate.md` | FIX-01 | New relation kinds validate successfully |
| REGTEST-34 | `fix/REGTEST-34-submodule-target-validation.md` | FIX-02 | Missing submodule targets are rejected |
| REGTEST-35 | `fix/REGTEST-35-deployed-on-target-validation.md` | FIX-02 | Missing deployment endpoint is rejected |
| REGTEST-36 | `fix/REGTEST-36-single-add-atomicity.md` | FIX-03 | Failed single add leaves no partial feature |
| REGTEST-37 | `fix/REGTEST-37-spec-batch-success.md` | FIX-03 | add --spec batch exits 0 and writes overlay |
| REGTEST-38 | `fix/REGTEST-38-failed-batch-side-effects.md` | FIX-03 | Failed batch leaves no history/undo side effects |
| REGTEST-39 | `fix/REGTEST-39-batch-flag-scoping.md` | FIX-04 | Batch flags do not leak into later entities |
| REGTEST-40 | `fix/REGTEST-40-remove-module-root-edges.md` | FIX-05 | Removing module removes root edges |
| REGTEST-41 | `fix/REGTEST-41-hidden-verb-help.md` | FIX-06 | Hidden verb help no longer exposes nested syntax |
| REGTEST-42 | `fix/REGTEST-42-docs-hide-fine-grained.md` | FIX-06 | Active docs no longer teach hidden commands |
| REGTEST-43 | `fix/REGTEST-43-diff-spec-renders-after.md` | FIX-07 | diff --spec renders missing after pages |

### Batch Schedule

#### Batch 1 — Relation Vocabulary

- **Worker**: `fix/FIX-01-relation-edge-schema.md`
- **Strategy**: Single worker
- **Gate**:
  - [ ] Worker reports success.
  - [ ] `node --test test/atlas-cli.test.js --test-name-pattern "relation --implements|module --depends-on|module --deployed-on"` passes.
  - [ ] Manual validation command for an `implements` edge returns code 0.

#### Batch 2 — CLI Mutation Semantics

- **Workers, sequential**: `FIX-02` -> `FIX-03` -> `FIX-04` -> `FIX-05` -> `FIX-07`
- **Strategy**: Sequential because all workers edit `cli.js`.
- **Depends on**: Batch 1.
- **Gate**:
  - [ ] Each worker reports success.
  - [ ] `node --test test/atlas-cli.test.js` passes.

#### Batch 3 — Help and Documentation

- **Worker**: `fix/FIX-06-hide-fine-grained-help-docs.md`
- **Strategy**: Single worker after CLI dispatch behavior is stable.
- **Gate**:
  - [ ] Worker reports success.
  - [ ] `node --test test/architecture-script.test.js` passes.
  - [ ] `rg "apltk architecture (feature|submodule|function|variable|dataflow|error|edge|meta|actor) " skills/design/references/architecture.md skills/update-project-html/SKILL.md` returns no active hidden-command examples.

#### Batch 4 — Regression Tests

- **Workers**: REGTEST-33 through REGTEST-43.
- **Strategy**: Sequential by target file: first all `test/atlas-cli.test.js` tests in numeric order, then `test/architecture-script.test.js` tests.
- **Depends on**: All fix batches.
- **Gate**:
  - [ ] Each REGTEST worker reports the oracle would fail on Round 6 code and passes after fixes.
  - [ ] `node --test test/atlas-cli.test.js` passes.
  - [ ] `node --test test/architecture-script.test.js` passes.

#### Batch 5 — Final Integration

- **Tasks**: Full test suite and report cross-check.
- **Gate**:
  - [ ] `npm test` passes.
  - [ ] `npm run build` passes if package build is expected in the current branch.
  - [ ] Every Round 6 finding in `REPORT.md` maps to a completed FIX and REGTEST.
  - [ ] `git diff --check` reports no whitespace errors.

---

## 4. Final Verification

- [ ] Every issue in REPORT.md Round 6 (P1:11) has a completed fix.
- [ ] Every fix has at least one regression test or shared regression test that covers its issue.
- [ ] All worker prompts listed in Section 3 were dispatched and returned success.
- [ ] Full test suite passes with no regressions.
- [ ] Help/docs no longer expose hidden fine-grained verbs as agent-facing commands.
- [ ] All changes are committed in a single commit after verification.

---

## 5. References

- **Worker prompt files**:
  - `fix/FIX-01-relation-edge-schema.md`
  - `fix/FIX-02-endpoint-validation.md`
  - `fix/FIX-03-add-atomicity.md`
  - `fix/FIX-04-batch-flag-scoping.md`
  - `fix/FIX-05-remove-module-cascade.md`
  - `fix/FIX-06-hide-fine-grained-help-docs.md`
  - `fix/FIX-07-diff-spec-render.md`
  - `fix/REGTEST-33-relation-kinds-validate.md`
  - `fix/REGTEST-34-submodule-target-validation.md`
  - `fix/REGTEST-35-deployed-on-target-validation.md`
  - `fix/REGTEST-36-single-add-atomicity.md`
  - `fix/REGTEST-37-spec-batch-success.md`
  - `fix/REGTEST-38-failed-batch-side-effects.md`
  - `fix/REGTEST-39-batch-flag-scoping.md`
  - `fix/REGTEST-40-remove-module-root-edges.md`
  - `fix/REGTEST-41-hidden-verb-help.md`
  - `fix/REGTEST-42-docs-hide-fine-grained.md`
  - `fix/REGTEST-43-diff-spec-renders-after.md`

- **Code files to modify**:
  - `skills/init-project-html/lib/atlas/cli.js`
  - `skills/init-project-html/lib/atlas/schema.js`
  - `skills/init-project-html/lib/atlas/render.js`
  - `skills/init-project-html/references/architecture.css`
  - `skills/init-project-html/lib/atlas/cli-help.js`
  - `skills/design/references/architecture.md`
  - `skills/update-project-html/SKILL.md`
  - `test/atlas-cli.test.js`
  - `test/architecture-script.test.js`

- **Project context files**:
  - `CLAUDE.md`
  - `AGENTS.md`
  - `docs/architecture/cli-architecture.md`
  - `docs/plans/2026-06-07/architecture-simplify/SPEC.md`
  - `docs/plans/2026-06-07/architecture-simplify/DESIGN.md`
  - `docs/plans/2026-06-07/architecture-simplify/CHECKLIST.md`
  - `docs/plans/2026-06-07/architecture-simplify/REPORT.md`
  - `docs/plans/2026-06-07/architecture-simplify/references/README.md`

- **Fix History**:

  ### Round 5 — 2026-06-08
  - **Issues planned**: P1:1, P2:3, P3:10 across `cli.js` and `test/atlas-cli.test.js`.
  - **Plan shape**: Three fix workers and five regression-test workers. Key focus was relation `--depends-on` batch validation, batch undo support, single-entity validation, target validation, remove spec-dir validation, and diff filtering assertions.
  - **Current status**: Round 6 review confirmed the Round 5 P1 was fixed, but found 11 new/current P1 defects requiring a fresh plan.

  ### Round 4 — 2026-06-08
  - **Issues planned**: P1:5, P2:12, P3:10.
  - **Outcome noted by Round 5**: Most Round 4 findings were fixed; remaining concerns were recategorized or superseded.

  ### Round 3 — 2026-06-07
  - **Issues planned**: P2:10, P3:14.
  - **Outcome**: Reported resolved in previous history.

  ### Round 2 — 2026-06-07
  - **Issues planned**: P1:3, P2:6, P3:4.
  - **Outcome**: Reported resolved in previous history.

  ### Round 1 — 2026-06-07
  - **Issues planned**: P1:5, P2:8, P3:7.
  - **Outcome**: Reported resolved in previous history.
