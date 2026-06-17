# Fix Worker Prompt: FIX-02-codegraph-async-rejection

- **Related issue**: P1-002

---

## 1. Mission & Rules

### Mission

Make `createOrOpenIndex` reject asynchronously when a project is already initialized so the existing package test and full pnpm test suite pass.

### Context

The review found `pnpm test` fails in `packages/tools/codegraph/lib/cg-instance.test.ts` because `assert.rejects(() => createOrOpenIndex(tmpDir), ...)` receives a synchronous throw instead of a rejected promise. This blocks pnpm-migration Req 3 and codebase-refactoring Req 3.

### Rules

- Only modify files listed as Allowed in Section 5.
- Preserve the existing error message, including the `sync` guidance.
- Preserve public return type compatibility: callers should still receive a `Promise<CodeGraphInstance>`.
- Do not weaken or remove existing tests.
- Workers are leaf nodes; do not spawn sub-workers.

---

## 2. Context

### Input Files

- `packages/tools/codegraph/lib/cg-instance.ts` — `createOrOpenIndex` implementation.
- `packages/tools/codegraph/lib/cg-instance.test.ts` — failing test and expected error contract.
- `docs/plans/2026-06-17/quality-gate-upgrade/REPORT.md` — P1-002 issue details.

### Root Cause

`createOrOpenIndex` is declared as a normal function returning `Promise<CodeGraphInstance>`, but it performs the initialized-project check before returning `CodeGraph.init(...)`. Throwing before a promise exists produces a synchronous exception, so `assert.rejects` fails even though the message is correct.

---

## 3. Tasks

### `packages/tools/codegraph/lib/cg-instance.ts` — make rejection asynchronous

1. Open `packages/tools/codegraph/lib/cg-instance.ts`.
2. Locate `createOrOpenIndex` at lines 204-228.
3. Change the function declaration from:
   ```ts
   export function createOrOpenIndex(
   ```
   to:
   ```ts
   export async function createOrOpenIndex(
   ```
4. Keep the return type as `Promise<CodeGraphInstance>`.
5. Leave the initialized-project error message unchanged.
6. Keep returning `CodeGraph.init(projectRoot, initOptions)`; because the function is now `async`, both explicit throws and returned promises are normalized through the promise contract.

### Output

When done, report back to the coordinator:

- **Files modified**: `packages/tools/codegraph/lib/cg-instance.ts`
- **Change summary**: asynchronous rejection contract restored for `createOrOpenIndex`
- **Test results**: command outcomes from Section 4
- **Risks or concerns**: or `None`

---

## 4. Verification

1. Run: `npx --yes pnpm@11.6.0 build`
   - Expected: TypeScript build succeeds.
2. Run: `node --test packages/tools/codegraph/dist/lib/cg-instance.test.js`
   - Expected: `createOrOpenIndex should throw when project is already initialized` passes.
3. Run: `npx --yes pnpm@11.6.0 test`
   - Expected: all test groups pass.

---

## 5. Scope & References

### Allowed Files

- `packages/tools/codegraph/lib/cg-instance.ts` — source contract fix.

### Forbidden Files

- `packages/tools/codegraph/lib/cg-instance.test.ts` — owned by REGTEST-02.
- Other CodeGraph command files — not needed for this issue.

### Related Documents

- `docs/plans/2026-06-17/quality-gate-upgrade/REPORT.md`
- `docs/plans/2026-06-17/quality-gate-upgrade/pnpm-migration/SPEC.md`
- `docs/plans/2026-06-17/quality-gate-upgrade/codebase-refactoring/SPEC.md`
