# Regression Test Worker Prompt: REGTEST-05-lint-staged-scope

- **Related fix**: FIX-05 — lint-staged staged-file scope

---

## 1. Mission & Rules

### Mission

Add a config regression test that fails if lint-staged formats Markdown files again.

### Context

FIX-05 removes the out-of-scope Markdown lint-staged entry while preserving TS/JS, JSON, and YAML handling.

### Rules

- Only create or modify test files.
- Do not modify `.lintstagedrc.json`.
- The test must fail on the unfixed lint-staged config and pass after FIX-05.
- Workers are leaf nodes; do not spawn sub-workers.

---

## 2. Context

### Input Files

- `.lintstagedrc.json` — config under test.
- Existing tests under `test/` — use project test style.
- `docs/plans/2026-06-17/quality-gate-upgrade/fix/FIX-05-lint-staged-scope.md` — fix context.

### Test Design

- **Test ID**: REGTEST-05
- **Type**: Configuration unit test
- **Location**: `test/quality-gate-workflows.test.js`
- **Scenario**: GIVEN lint-staged config WHEN parsed as JSON THEN it includes TS/JS, JSON, and YAML patterns, and does not include any Markdown pattern.
- **Oracle**: The unfixed config includes `"*.md"` and fails; after FIX-05 it passes.

---

## 3. Tasks

1. Open or create `test/quality-gate-workflows.test.js`.
2. Add a test named `REGTEST-05: lint-staged only targets specified staged file types`.
3. Parse `.lintstagedrc.json`.
4. Assert expected keys exist:
   - `*.{ts,mjs,js,cjs}`
   - `*.json`
   - `*.{yaml,yml}`
5. Assert no key includes `.md` or `md`.

### Output

When done, report back to the coordinator:

- **Test file**: `test/quality-gate-workflows.test.js`
- **Test name**: `REGTEST-05: lint-staged only targets specified staged file types`
- **Oracle confirmed**: fails before FIX-05, passes after FIX-05
- **Risks or concerns**: or `None`

---

## 4. Verification

1. Run before FIX-05 if possible: `node --test test/quality-gate-workflows.test.js`
   - Expected: REGTEST-05 fails.
2. Run after FIX-05: `node --test test/quality-gate-workflows.test.js`
   - Expected: REGTEST-05 passes.
3. Run: `npx --yes pnpm@11.6.0 test`
   - Expected: full suite passes.

---

## 5. Scope & References

### Allowed Files

- `test/quality-gate-workflows.test.js` — config regression tests.

### Forbidden Files

- `.lintstagedrc.json` — owned by FIX-05.
- All source files — test-only worker.

### Related Documents

- `docs/plans/2026-06-17/quality-gate-upgrade/fix/FIX-05-lint-staged-scope.md`
- `docs/plans/2026-06-17/quality-gate-upgrade/quality-gate-setup/SPEC.md`
