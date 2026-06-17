# Regression Test Worker Prompt: REGTEST-02-codegraph-async-rejection

- **Related fix**: FIX-02 — CodeGraph async rejection contract

---

## 1. Mission & Rules

### Mission

Strengthen the CodeGraph regression test so it explicitly detects synchronous throws from `createOrOpenIndex`.

### Context

FIX-02 makes `createOrOpenIndex` an `async` function. The existing test caught the failure through `assert.rejects`, but it does not explicitly document the promise contract that was broken.

### Rules

- Only modify test files.
- The test must fail if `createOrOpenIndex` throws synchronously before returning a promise.
- Do not modify source files.
- Do not skip or weaken the existing initialized-project assertion.
- Workers are leaf nodes; do not spawn sub-workers.

---

## 2. Context

### Input Files

- `packages/tools/codegraph/lib/cg-instance.test.ts` — existing test location.
- `packages/tools/codegraph/lib/cg-instance.ts` — source contract to understand expected behavior.
- `docs/plans/2026-06-17/quality-gate-upgrade/fix/FIX-02-codegraph-async-rejection.md` — fix context.

### Test Design

- **Test ID**: REGTEST-02
- **Type**: Unit
- **Location**: `packages/tools/codegraph/lib/cg-instance.test.ts`
- **Scenario**: GIVEN an initialized temporary project WHEN `createOrOpenIndex(tmpDir)` is called THEN the call returns a promise and that promise rejects with a message containing `sync`.
- **Oracle**: On the unfixed code, the direct call throws synchronously before a promise can be asserted; after FIX-02, the call returns a promise and `await assert.rejects(promise, ...)` passes.

---

## 3. Tasks

1. Open `packages/tools/codegraph/lib/cg-instance.test.ts`.
2. In the existing test `should throw when project is already initialized`, replace the `assert.rejects(() => createOrOpenIndex(tmpDir), ...)` shape with an explicit promise-contract assertion:
   - First assign `const result = createOrOpenIndex(tmpDir);`
   - Assert `result instanceof Promise`.
   - Then `await assert.rejects(result, predicate)`.
3. Keep the predicate that checks `err instanceof Error` and `err.message` matches `/sync/`.
4. Keep the temporary `.codegraph/codegraph.db` setup unchanged.

### Output

When done, report back to the coordinator:

- **Test file**: `packages/tools/codegraph/lib/cg-instance.test.ts`
- **Test name**: `should throw when project is already initialized`
- **Oracle confirmed**: whether synchronous throw fails before FIX-02 and passes after FIX-02
- **Risks or concerns**: or `None`

---

## 4. Verification

1. Run before FIX-02 if possible: `npx --yes pnpm@11.6.0 build && node --test packages/tools/codegraph/dist/lib/cg-instance.test.js`
   - Expected: test fails because the direct call throws synchronously.
2. Run after FIX-02: `npx --yes pnpm@11.6.0 build && node --test packages/tools/codegraph/dist/lib/cg-instance.test.js`
   - Expected: test passes.
3. Run: `npx --yes pnpm@11.6.0 test`
   - Expected: full test suite passes.

---

## 5. Scope & References

### Allowed Files

- `packages/tools/codegraph/lib/cg-instance.test.ts` — strengthen existing regression test.

### Forbidden Files

- All source code files — test worker must not modify source.

### Related Documents

- `docs/plans/2026-06-17/quality-gate-upgrade/fix/FIX-02-codegraph-async-rejection.md`
- `docs/plans/2026-06-17/quality-gate-upgrade/codebase-refactoring/SPEC.md`
