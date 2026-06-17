# Regression Test Worker Prompt: REGTEST-04-remove-shameful-hoist

- **Related fix**: FIX-04 — remove project-wide shameful hoisting

---

## 1. Mission & Rules

### Mission

Add a config regression test that fails if broad pnpm hoisting is reintroduced.

### Context

FIX-04 removes `shamefully-hoist` settings. The regression protects the pnpm migration requirement for strict dependency resolution.

### Rules

- Only create or modify test files.
- Do not modify pnpm config files.
- The test must fail on the unfixed config and pass after FIX-04.
- Workers are leaf nodes; do not spawn sub-workers.

---

## 2. Context

### Input Files

- `pnpm-workspace.yaml` — config under test.
- `.npmrc` — config under test; may not exist after FIX-04.
- Existing tests under `test/` — use project test style.
- `docs/plans/2026-06-17/quality-gate-upgrade/fix/FIX-04-remove-shameful-hoist.md` — fix context.

### Test Design

- **Test ID**: REGTEST-04
- **Type**: Configuration unit test
- **Location**: `test/quality-gate-workflows.test.js`
- **Scenario**: GIVEN pnpm workspace and npmrc config WHEN scanning text THEN neither file contains `shamefullyHoist`, `shamefully-hoist`, or `shamefully-hoist=true`.
- **Oracle**: The unfixed config contains both hoist settings and fails; after FIX-04 it passes.

---

## 3. Tasks

1. Open or create `test/quality-gate-workflows.test.js`.
2. Add a test named `REGTEST-04: pnpm config does not use broad shameful hoisting`.
3. Read `pnpm-workspace.yaml` and, if `.npmrc` exists, read `.npmrc`.
4. Assert neither text contains:
   - `shamefullyHoist`
   - `shamefully-hoist`
5. Do not require `.npmrc` to exist.

### Output

When done, report back to the coordinator:

- **Test file**: `test/quality-gate-workflows.test.js`
- **Test name**: `REGTEST-04: pnpm config does not use broad shameful hoisting`
- **Oracle confirmed**: fails before FIX-04, passes after FIX-04
- **Risks or concerns**: or `None`

---

## 4. Verification

1. Run before FIX-04 if possible: `node --test test/quality-gate-workflows.test.js`
   - Expected: REGTEST-04 fails.
2. Run after FIX-04: `node --test test/quality-gate-workflows.test.js`
   - Expected: REGTEST-04 passes.
3. Run: `npx --yes pnpm@11.6.0 install --frozen-lockfile`
   - Expected: strict install succeeds.

---

## 5. Scope & References

### Allowed Files

- `test/quality-gate-workflows.test.js` — config regression tests.

### Forbidden Files

- `pnpm-workspace.yaml` and `.npmrc` — owned by FIX-04.
- All source files — test-only worker.

### Related Documents

- `docs/plans/2026-06-17/quality-gate-upgrade/fix/FIX-04-remove-shameful-hoist.md`
- `docs/plans/2026-06-17/quality-gate-upgrade/pnpm-migration/SPEC.md`
