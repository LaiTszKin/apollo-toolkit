# Regression Test Worker Prompt: REGTEST-02-ts-handler

- **Related fix**: FIX-01 (legacy verb error message — FIX-01-12), FIX-02 (code cleanup — P3-20)
- **Source REPORT**: `docs/plans/2026-06-07/architecture-simplify/REPORT.md`

---

## 1. Mission & Rules

### Mission

Update TS handler tests in `index.test.ts` to verify that legacy `apply`/`template` verbs produce specific error messages suggesting `add`, and that the handler still correctly delegates to `cli.js` for new verbs.

### Context

FIX-01-12 adds a specific error message for `apply`/`template` suggesting "Use 'apltk architecture add' instead". FIX-02 (P3-20) removes `handleApply()`/`handleTemplate()` from index.ts. The TS handler tests must be updated to reflect these changes.

### Rules

- Only create or modify test files — never modify source code
- The test must fail on the unfixed code and pass after the fix is applied
- Follow the existing patterns in `index.test.ts` (ESM, `node:test`, `makeIo()`, `writeMockAtlasModules()`)
- Workers are leaf nodes — do not spawn sub-workers

---

## 2. Context

### Input Files

- `packages/tools/architecture/index.test.ts` — Modify tests here
- `packages/tools/architecture/index.ts` — Read to understand the handler changes
- `packages/tools/architecture/dist/index.js` — The test imports from dist/index.js

### Test Design Reference

Existing patterns in `index.test.ts`:
- Import `{ tool } from './index.js'` 
- Use `tool.handler(args, makeContext(io))`
- Check `exitCode` with `assert.equal`
- Check stderr text with `assert.ok(io.stderrText.includes('...'))`
- Tests use `writeMockAtlasModules()` helper
- Three test suites: REGTEST-15/16/17

---

## 3. Tasks

### Task 1: Update legacy verb error message assertions

The existing tests in `index.test.ts` verify that `apply`/`template` return exit code 1 with stderr containing "Unknown verb". After FIX-01-12, the error message should suggest using `add` instead.

For each test that checks `apply` or `template` error messages, update the assertion:

#### REGTEST-15 (L124-139): Update stderr assertion

**Before**:
```javascript
assert.ok(
  io.stderrText.includes('Unknown verb'),
  `stderr should contain "Unknown verb": got ${JSON.stringify(io.stderrText)}`,
);
```

**After**:
```javascript
assert.ok(
  io.stderrText.includes('add'),
  `stderr should suggest using "add": got ${JSON.stringify(io.stderrText)}`,
);
assert.ok(
  io.stderrText.includes('template'),
  `stderr should mention the verb "template": got ${JSON.stringify(io.stderrText)}`,
);
```

#### REGTEST-16 (L193-204): Update apply stderr assertion

**Before**:
```javascript
assert.ok(
  io.stderrText.includes('Unknown verb'),
  `stderr should contain "Unknown verb": got ${JSON.stringify(io.stderrText)}`,
);
```

**After**:
```javascript
assert.ok(
  io.stderrText.includes('add'),
  `stderr should suggest using "add": got ${JSON.stringify(io.stderrText)}`,
);
```

#### REGTEST-17 (L256-268): Update apply stderr assertion (same change)

### Task 2: Update all other apply/template error message assertions

The `writeMockAtlasModules` helper creates a mock `cli.js` that returns `1` with "Unknown verb" for `apply`/`template`. Since `index.ts`'s `architectureHandler` now fully delegates to `cli.dispatch()`, the mock behavior is still correct (the real cli.js now returns the specific message). However, the mock's message should be updated to match the real behavior:

In `writeMockAtlasModules()` (L46-119), update the mock cli.js dispatch:
```javascript
if (verb === 'apply' || verb === 'template') {
  if (io && io.stderr) io.stderr.write('Error: "' + verb + '" has been removed. Use "apltk architecture add <feature|module|relation>" instead.\n');
  return 1;
}
```

### Task 3: Add a test verifying handler delegates add/remove to cli.js

Add a new test that verifies `add feature` returns 0 through the handler (after FIX-02 removes the retired code, ensure delegation still works):

```javascript
it('add feature returns 0 through handler delegation', async () => {
  const handler = tool.handler;
  if (!handler) throw new Error('tool.handler is undefined');
  const exitCode = await handler(
    ['add', 'feature', 'test-feat', '--no-render'],
    makeContext(io, { sourceRoot: tmpDir }),
  );
  assert.equal(exitCode, 0, 'Expected exit code 0 for "add feature"');
});
```

(This test is already present in REGTEST-16 as `'add feature returns 0 through CLI dispatch'` — no need to duplicate.)

### Task 4: Verify `apply` and `template` tests still work after retired code removal (P3-20)

No changes needed if the tests already mock cli.js correctly. Verify existing REGTEST-15/16/17 tests pass.

### Output

When done, report back to the coordinator:
- **Files modified**: `packages/tools/architecture/index.test.ts`
- **Changes**: Updated stderr assertions to check for "add" suggestion instead of "Unknown verb"
- **Test results**: `node --test packages/tools/architecture/index.test.ts` — all pass
- **Risks or concerns**: [or "None"]

---

## 4. Verification

1. Run on unfixed code:
   ```bash
   node --test packages/tools/architecture/index.test.ts
   ```
   - Expected: REGTEST-15/16/17 test assertions for "Unknown verb" fail (they now check for "add" instead, and the real unfixed code still says "Unknown verb")

2. After fix is applied, run:
   ```bash
   node --test packages/tools/architecture/index.test.ts
   ```
   - Expected: All tests pass

3. Run full test suite:
   ```bash
   npm test
   ```
   - Expected: All tests pass

---

## 5. Scope & References

### Allowed Files

- `packages/tools/architecture/index.test.ts` — Update error message assertions

### Forbidden Files

- All source code files — do not modify production code
- `test/atlas-cli.test.js` — handled by REGTEST-01 worker

### Related Documents

- `docs/plans/2026-06-07/architecture-simplify/fix/FIX-01-cli-fixes.md` — Task 9 (legacy verb error message)
- `docs/plans/2026-06-07/architecture-simplify/fix/FIX-02-docs-cleanup.md` — Task 4 (retired code removal)
