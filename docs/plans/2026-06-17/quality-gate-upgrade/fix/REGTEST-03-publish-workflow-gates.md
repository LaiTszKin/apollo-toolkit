# Regression Test Worker Prompt: REGTEST-03-publish-workflow-gates

- **Related fix**: FIX-03 — publish workflow quality gates

---

## 1. Mission & Rules

### Mission

Add a configuration regression test that fails when the publish workflow lacks lint or format-check before publishing.

### Context

FIX-03 updates `.github/workflows/publish-npm.yml`. The regression should protect the workflow contract without needing to run GitHub Actions locally.

### Rules

- Only create or modify test files.
- Do not modify workflow files.
- Use existing Node test style under `test/`.
- The test must fail on the current unfixed workflow and pass after FIX-03.
- Workers are leaf nodes; do not spawn sub-workers.

---

## 2. Context

### Input Files

- `.github/workflows/publish-npm.yml` — config under test.
- Existing tests under `test/` — use `node:test` and `assert/strict` style.
- `docs/plans/2026-06-17/quality-gate-upgrade/fix/FIX-03-publish-workflow-gates.md` — fix context.

### Test Design

- **Test ID**: REGTEST-03
- **Type**: Configuration unit test
- **Location**: `test/quality-gate-workflows.test.js`
- **Scenario**: GIVEN the publish workflow content WHEN scanning ordered commands THEN `pnpm lint --cache` and `pnpm format:check` appear before `pnpm publish --access public`.
- **Oracle**: The unfixed workflow lacks both commands and fails; after FIX-03 it passes.

---

## 3. Tasks

1. Create or update `test/quality-gate-workflows.test.js`.
2. Import `node:test`, `node:assert/strict`, and `node:fs`.
3. Read `.github/workflows/publish-npm.yml` as UTF-8.
4. Add a test named `REGTEST-03: publish workflow runs lint and format checks before publish`.
5. Use `indexOf` or equivalent ordered string checks:
   - `lintIndex = workflow.indexOf('pnpm lint --cache')`
   - `formatIndex = workflow.indexOf('pnpm format:check')`
   - `publishIndex = workflow.indexOf('pnpm publish --access public')`
   - Assert each index is not `-1`.
   - Assert `lintIndex < publishIndex` and `formatIndex < publishIndex`.

### Output

When done, report back to the coordinator:

- **Test file**: `test/quality-gate-workflows.test.js`
- **Test name**: `REGTEST-03: publish workflow runs lint and format checks before publish`
- **Oracle confirmed**: fails before FIX-03, passes after FIX-03
- **Risks or concerns**: or `None`

---

## 4. Verification

1. Run before FIX-03 if possible: `node --test test/quality-gate-workflows.test.js`
   - Expected: test fails because commands are absent.
2. Run after FIX-03: `node --test test/quality-gate-workflows.test.js`
   - Expected: test passes.
3. Run: `npx --yes pnpm@11.6.0 test`
   - Expected: full suite passes.

---

## 5. Scope & References

### Allowed Files

- `test/quality-gate-workflows.test.js` — workflow configuration regression test.

### Forbidden Files

- `.github/workflows/publish-npm.yml` — owned by FIX-03.
- All source files — this is a test-only worker.

### Related Documents

- `docs/plans/2026-06-17/quality-gate-upgrade/fix/FIX-03-publish-workflow-gates.md`
- `docs/plans/2026-06-17/quality-gate-upgrade/quality-gate-setup/SPEC.md`
