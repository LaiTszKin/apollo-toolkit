# Regression Test Worker Prompt: REGTEST-03-error-paths

- **Related fix**: FIX-01 (remove error handling — FIX-01-4, FIX-01-5)
- **Source REPORT**: `docs/plans/2026-06-07/architecture-simplify/REPORT.md`

---

## 1. Mission & Rules

### Mission

Update error path tests in `architecture-error-types.test.js` to verify that `apply`/`template` return exit code 1 with specific error messages suggesting `add`, and add new tests for remove error paths.

### Context

FIX-01-4 changes remove to throw errors on non-existent entities (instead of silently succeeding). FIX-01-5 adds `--dry-run` forwarding to `verbRemove`. The existing error path tests use mock modules and must be updated to reflect the changed error messages.

### Rules

- Only create or modify test files — never modify source code
- The test must fail on the unfixed code and pass after the fix is applied
- Follow the existing patterns in `architecture-error-types.test.js` 
- Workers are leaf nodes — do not spawn sub-workers

---

## 2. Context

### Input Files

- `test/tools/architecture-error-types.test.js` — Modify and extend tests here
- `packages/tools/architecture/dist/index.js` — The handler under test
- `packages/tools/architecture/index.ts` — Read for context

### Test Design Reference

Existing patterns:
- Import `{ architectureHandler }` from `../../packages/tools/architecture/dist/index.js`
- Create mock `writeMockAtlasModules()` with state
- Run handler with args, check exit code and stderr message
- All tests currently verify that `apply`/`template` return 1 with "Unknown verb" in stderr

---

## 3. Tasks

### Task 1: Update apply/template error message assertions

The existing ~18 tests all verify that `apply`/`template` return 1 with "Unknown verb" in stderr. After FIX-01-12, update the assertion to check for "add" suggestion instead.

For each test with this pattern (lines 28, 43, 55, 74, 89, 100, 115, 127, 141, 155, 167, 181, 193, etc.), update:

**Before**:
```javascript
assert.ok(stderr.toString().includes('Unknown verb'));
```

**After**:
```javascript
assert.ok(stderr.toString().includes('add'), `stderr should suggest "add": ${stderr.toString()}`);
assert.ok(stderr.toString().includes('apply') || stderr.toString().includes('template'), `stderr should mention the verb`);
```

### Task 2: Add a remove-specific error test

Add a new test that verifies `architectureHandler(['remove', 'feature', 'nonexistent'], context)` returns non-zero with a meaningful error. This tests the remove error handling path through the full handler (which delegates to cli.js):

```javascript
test('remove non-existent entity returns error through handler', async () => {
  const { architectureHandler } = await import(
    '../../packages/tools/architecture/dist/index.js'
  );
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apltk-rmerr-'));
  const stderr = createMemoryStream();
  try {
    writeMockAtlasModules(tmpDir, {
      features: [{ slug: 'existing', title: 'Existing', submodules: [], edges: [] }],
      edges: [],
    });
    const result = await architectureHandler(
      ['remove', 'feature', 'nonexistent', '--no-render'],
      { stdout: { write: () => {} }, stderr, sourceRoot: tmpDir },
    );
    assert.strictEqual(result, 1, 'remove non-existent should return 1');
    assert.ok(stderr.toString().includes('not found'), `stderr should say "not found": ${stderr.toString()}`);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
```

**Oracle**: Must fail before FIX-01 (returns 0, silent success). Must pass after FIX-01 (returns 1 with error).

### Task 3: Add remove --dry-run test

```javascript
test('remove --dry-run returns 0 without mutating mock', async () => {
  const { architectureHandler } = await import(
    '../../packages/tools/architecture/dist/index.js'
  );
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apltk-dry-'));
  const stderr = createMemoryStream();
  try {
    writeMockAtlasModules(tmpDir, {
      features: [{ slug: 'test', title: 'Test', submodules: [], edges: [] }],
      edges: [],
    });
    const result = await architectureHandler(
      ['remove', 'feature', 'test', '--no-render', '--dry-run'],
      { stdout: { write: () => {} }, stderr, sourceRoot: tmpDir },
    );
    assert.strictEqual(result, 0, 'dry-run should return 0');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
```

### Output

When done, report back to the coordinator:
- **Files modified**: `test/tools/architecture-error-types.test.js`
- **Tests added**: [list new tests]
- **Changes**: Updated apply/template assertions and added remove error tests
- **Test results**: `node --test test/tools/architecture-error-types.test.js` — all pass
- **Risks or concerns**: [or "None"]

---

## 4. Verification

1. Run on unfixed code:
   ```bash
   node --test test/tools/architecture-error-types.test.js
   ```
   - Expected: The updated apply/template assertion tests fail (they now check for "add" message which the unfixed code doesn't have). The new remove error test fails (returns 0 instead of 1).

2. After fix is applied, run:
   ```bash
   node --test test/tools/architecture-error-types.test.js
   ```
   - Expected: All tests pass

3. Run full test suite:
   ```bash
   npm test
   ```
   - Expected: All tests pass (no regressions)

---

## 5. Scope & References

### Allowed Files

- `test/tools/architecture-error-types.test.js` — Update assertions and add new tests

### Forbidden Files

- All source code files — do not modify production code
- `test/atlas-cli.test.js` — handled by REGTEST-01 worker
- `packages/tools/architecture/index.test.ts` — handled by REGTEST-02 worker

### Related Documents

- `docs/plans/2026-06-07/architecture-simplify/fix/FIX-01-cli-fixes.md` — Tasks 5, 9 (remove error handling, legacy verb message)
