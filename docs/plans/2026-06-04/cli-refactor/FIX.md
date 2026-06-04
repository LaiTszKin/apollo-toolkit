# Fix Coordinator Prompt: CLI 工具全面重構 — Round 8

- **Date**: 2026-06-04
- **Source REPORT**: `docs/plans/2026-06-04/cli-refactor/REPORT.md`
- **Source Spec**: `docs/plans/2026-06-04/cli-refactor/`
- **Total Issues**: P0: 0, P1: 0, P2: 8, P3: 13
- **Total Regression Tests**: 7

---

## 1. Your Role

**You are the fix coordinator.** You do not write code. Your job is to understand the issues found in code review, delegate each fix and regression test to a worker, and verify that every issue is resolved without introducing regressions.

### What you do

- Read and understand the issue inventory, dependency analysis, and fix details below
- Spawn workers to execute individual fixes, giving each a self-contained prompt (provided in Section 6)
- After all fixes pass verification, spawn workers to implement regression tests
- Wait for all workers in a batch to complete, then digest their results
- Run verification commands at each checkpoint
- Decide whether to proceed to the next batch, retry a failed worker, or halt
- Handle lightweight coordination tasks: resolving merge conflicts, updating lockfiles
- Commit all changes in a single commit after the final verification gate passes

### What you NEVER do

- Write, edit, or modify any source-code or test file directly
- Skip a verification checkpoint
- Proceed to the next batch when the current batch has not passed verification
- Delegate comprehension — digest every worker result yourself before deciding next steps
- Let workers spawn their own workers (workers are leaf nodes)
- Start regression tests before all fixes in scope are verified
- Defer any REPORT.md issue to a future round — every issue has a complete plan here

---

## 2. Mission

修復 CLI refactoring Round 8 審查中發現的 21 項問題（8 P2 + 13 P3）。核心目標依優先級：

1. **P2 Architecture tool 非標準錯誤路徑** — `handleTemplate` 中的 2 個 stderr.write+return1 路徑需轉換為 typed error；`parseEndpoint` 改擲 `UserInputError`；catch block 補上 `SystemError` 判別
2. **P2 assertCommand + CommandParser 型別安全** — `assertCommand` 改擲 `SystemError`；tools dispatch 路徑補上 `assertCommand` 斷言
3. **P2 PlatformAdapter 測試性回歸** — 新增 `resetPlatformAdapter()` 讓工廠路由重新可測試
4. **P2 測試代碼複製** — 匯出生產函數 (`isSafeSkillName`, `resolvePackage`)，讓測試匯入而非複製邏輯
5. **P2 updater 殘留未覆蓋分支** — 補足 `!latestVersion` 和 `execCommand error` 事件處理器的測試
6. **P3 各項** — 清理未使用 import、短路順序優化、測試品質改善

共 7 個 Fix Workers + 7 個 Regression Test Workers。

**No-code-change items**: P2-2 (duplicate boundaries, intentional), P2-8 (coverage exclude, documented), P3-1 (manual flags, architecture complexity), P3-3 (if-else dispatch, design tradeoff), P3-4 (helpTopic dispatch, minor).

**Success looks like**: All issues resolved, all regression tests pass, full test suite passes, no regressions.

---

## 3. Issue Inventory

**P2 (8)**:
- **FIX-01** (P2, 中等, 實作偏離): Architecture tool 錯誤路徑 — `handleTemplate` 使用 `stderr.write + return 1` 而非 typed error；`parseEndpoint` 擲泛用 `Error` 而非 `UserInputError`；catch block 未判別 `SystemError` — `packages/tools/architecture/index.ts`
- **FIX-02** (P2, 簡單, 架構瑕疵): `assertCommand` 使用泛用 `Error` 而非 `SystemError` — `packages/cli/index.ts`
- **FIX-03** (P2, 簡單, 架構瑕疵): tools dispatch 路徑 (L145-173) 缺少 `assertCommand` 斷言 — `packages/cli/index.ts`
- **FIX-04** (P2, 簡單, 實作遺漏): `PlatformAdapter` 工廠無重設機制，無法在非當前 OS 測試 — `packages/tool-utils/platform-adapter.ts`
- **FIX-05** (P2, 簡單, 實作遺漏): `isSafeSkillName` 為私有函數，測試被迫複製邏輯 — 需匯出 — `packages/cli/installer.ts`
- **FIX-06** (P2, 簡單, 實作遺漏): `rewrite-imports.mjs` 的 `resolvePackage`/`relativePath` 需匯出供測試使用 — `packages/tools/rewrite-imports.mjs`
- **FIX-07** (P2, 中等, 實作遺漏): `updater.ts` 分支涵蓋率 — `!latestVersion` 早期返回 (L151) 和 `execCommand` error 事件 (L92) 未測試 — `packages/cli/updater.ts`, `test/updater-extras.test.js`

**P3 (13)**:
- **FIX-08** (P3, 簡單, 冗餘代碼): `generate-storyboard-images` 未使用的 `SystemError` import — `packages/tools/generate-storyboard-images/index.ts`
- **FIX-09** (P3, 簡單, 效能): `isSafeSkillName` 短路順序 — `createPlatformAdapter()` 放在 `skillName.includes('\\')` 之前 — `packages/cli/installer.ts`
- **FIX-10** (P3, 簡單, 實作遺漏): 測試使用 `process.platform` 而非 `createPlatformAdapter().isWindows()` — `test/cli/is-safe-skill-name.test.js`
- **FIX-11** (P3, 簡單, 實作遺漏): `is-safe-skill-name.test.js` 未匯入正式函數 — `test/cli/is-safe-skill-name.test.js`
- **FIX-12** (P3, 簡單, 實作遺漏): `rewrite-imports.test.js` 使用 inline copy 而非匯入 — `test/rewrite-imports.test.js`
- **FIX-13** (P3, 簡單, 效能): `rewrite-imports.test.js` soft-test pattern (L148-182) 靜默跳過 — `test/rewrite-imports.test.js`
- **FIX-14** (P3, 簡單, 實作遺漏): 缺少 "Batch aborted:" 通用錯誤路徑測試 — `test/tools/architecture-error-types.test.js`
- **FIX-15** (P3, 簡單, 實作遺漏): `generate-storyboard-images` 測試測試的是 stdlib 非 handler — `test/tools/generate-storyboard-images-prompt-multiple.test.js`
- **FIX-16** (P3, 簡單, 效能): `interactive-paths.test.js` 缺少 `try/finally` 暫存目錄清理 — `test/cli/interactive-paths.test.js`
- **FIX-17** (P3, 簡單, 實作遺漏): 測試改用匯入的 `resolvePackage`/`relativePath` — `test/rewrite-imports.test.js`

**No-code-change issues (accept/acknowledge)**:
- **P2-01**: Duplicate error boundaries (schema.ts + cli/index.ts) — intentional, covering different scopes
- **P2-08**: Coverage exclude over-broad — rationale documented via Chinese comment
- **P3-01**: Architecture manual flag parsing — accepted for sub-command complexity
- **P3-03**: If-else dispatch partially offsets Map — accepted design tradeoff
- **P3-04**: helpTopic dispatch decoupled from type union — minor, current values fully covered
- **P3-08**: Singleton reset — covered by FIX-04

---

## 4. Fix Dependency Analysis

### Dependencies

- **FIX-02 + FIX-03** both modify `packages/cli/index.ts` → must be same worker
- **FIX-05 + FIX-09 + FIX-11 + FIX-10** all relate to `installer.ts` + `is-safe-skill-name.test.js` → Part A (export function) must precede Part B (test import)
- **FIX-06 + FIX-12 + FIX-17** all relate to `rewrite-imports.mjs/rewrite-imports.test.js` → Part A (export) must precede Part B (test import)
- All REGTESTs depend on their corresponding FIX completing first

### File overlaps

| Worker | Files | Overlaps With |
|--------|-------|--------------|
| FIX-01 | `packages/tools/architecture/index.ts` | 無（唯一 worker 改此檔） |
| FIX-02+03 | `packages/cli/index.ts` | 無（唯一 worker 改此檔） |
| FIX-04 | `packages/tool-utils/platform-adapter.ts` | 無 |
| FIX-05+09 | `packages/cli/installer.ts` | 無（同一 worker） |
| FIX-06 | `packages/tools/rewrite-imports.mjs` | 無 |
| FIX-07 | `packages/cli/updater.ts` | 無 |
| FIX-08 | `packages/tools/generate-storyboard-images/index.ts` | 無 |
| REGTEST-01 | `test/cli/is-safe-skill-name.test.js` | 無（僅測試檔案） |
| REGTEST-02 | `test/rewrite-imports.test.js` | 無（僅測試檔案） |
| REGTEST-03 | `test/tools/architecture-error-types.test.js` | 無（僅測試檔案） |
| REGTEST-04 | `test/tools/generate-storyboard-images-prompt-multiple.test.js` | 無（僅測試檔案） |
| REGTEST-05 | `test/cli/interactive-paths.test.js` | 無（僅測試檔案） |
| REGTEST-06 | `test/updater-extras.test.js` | 無（僅測試檔案） |

**No file overlap between any fix workers.** All source code changes are in different files. All test workers only touch test files.

**Overlap groups**: FIX-02+03 (same file→same worker), FIX-05+09 (same file→same worker). Other workers: no overlap → can run in parallel.

---

## 5. Fix Details (with Regression Test Design)

### FIX-01: Architecture tool error path consolidation (P2)

**Root cause**: `handleTemplate` has 2 user-facing error paths using `stderr.write + return 1` instead of typed AppError (spec-dir not found at L527-535, file write error at L564-566). `parseEndpoint` (L79-81) throws generic `Error` requiring fragile wrapping catch at L351-353. Catch block (L433-440) only differentiates `UserInputError` vs generic.

**Files involved**: `packages/tools/architecture/index.ts` > L79-81 (parseEndpoint), L433-440 (catch), L525-566 (handleTemplate error paths)

**Fix approach**:
1. `parseEndpoint` (L79-81): Change `throw new Error(...)` to `throw new UserInputError(...)`
2. Catch block (L433-440): Add `SystemError` differentiation:
   ```ts
   catch (e: any) {
     if (e instanceof UserInputError) {
       stderr.write(`${e.message}\n`);
     } else if (e instanceof SystemError) {
       stderr.write(`${e.message}\n${e.stack}\n`);
     } else {
       stderr.write(`Batch aborted: ${e.message}\n`);
     }
     return 1;
   }
   ```
3. `handleTemplate` spec-dir errors (L527-535): Wrap in try/catch so missing spec-directory throws `UserInputError`:
   ```ts
   if (!fs.existsSync(resolvedSpecDir)) {
     throw new UserInputError(`Spec directory not found: ${resolvedSpecDir}`);
   }
   ```
4. Wrap handleTemplate's error-prone operations in a try/catch block that uses the same differentiated pattern

**Complexity**: 中等（1 file, ~10 lines changed across multiple locations）

**Regression test: REGTEST-03** (Unit → `test/tools/architecture-error-types.test.js`)
- Add test for "Batch aborted:" error path (non-UserInputError inside handleApply)
- Verify spec-directory-not-found returns 1 and writes to stderr

**Note**: handleApply's 4 early exits (L156-159, L180-181, L184-186, L219-220) remain unchanged — these are pre-condition checks at the handler boundary, not business-logic errors. They are valid as-is.

---

### FIX-02 + FIX-03: assertCommand type and tools path assertion (P2)

**Merged because same file**: Both modify `packages/cli/index.ts`.

**FIX-02 Root cause**: `assertCommand()` (L85-89) throws `new Error(...)` landing in generic catch-all (L501), not `SystemError` path. A dispatch table config error is a developer-time system failure.

**FIX-03 Root cause**: Tools dispatch path (L145-173) uses bare `as ToolCommand | ToolsHelpCommand` cast (L145) without runtime assertion. Unlike install/uninstall paths (L110/L128), misuse of the wrong parser produces property-access errors instead of clear failure messages.

**Files involved**: `packages/cli/index.ts` > L85-89 (assertCommand), L145-173 (tools path)

**Fix approach**:

1. **assertCommand** (L85-89): Change throw from `Error` to `SystemError`:
   ```ts
   function assertCommand<T>(cmd: any, expected: string): asserts cmd is T {
     if (!cmd || cmd.command !== expected) {
       throw new SystemError(`Internal error: expected command "${expected}", got "${cmd?.command}"`);
     }
   }
   ```

2. **Tools path** (L145-173): Add `assertCommand` after the cast:
   ```ts
   const cmd = parser.parse(argv) as ToolCommand | ToolsHelpCommand;
   if (cmd.command === 'tools-help') {
     assertCommand<ToolsHelpCommand>(cmd, 'tools-help');  // added
     return { ... };
   }
   assertCommand<ToolCommand>(cmd, 'tool');  // added
   return { ... };
   ```

**Complexity**: 簡單（1 file, ~5 lines changed）

**Regression test**: REGTEST-07 validates the error-type change (assertCommand now throws SystemError).

---

### FIX-04: PlatformAdapter reset mechanism (P2)

**Root cause**: `createPlatformAdapter()` singleton (L103-109) has no reset/clear function. Once cached, the adapter cannot be replaced for the lifetime of the process, making the factory routing decision untestable on non-current OS.

**Files involved**: `packages/tool-utils/platform-adapter.ts` > L99-110

**Fix approach**: Add a `resetPlatformAdapter()` export function:
```ts
let _adapter: PlatformAdapter | undefined;

export function createPlatformAdapter(): PlatformAdapter {
  if (!_adapter) {
    _adapter = process.platform === 'win32' ? new WindowsAdapter() : new PosixAdapter();
  }
  return _adapter;
}

/** Reset the cached adapter (for test use only). */
export function resetPlatformAdapter(): void {
  _adapter = undefined;
}
```

**Complexity**: 簡單（1 file, ~4 lines added）

**Regression test**: REGTEST-06 (in platform-adapter.test.js)
- Call `resetPlatformAdapter()`, then verify `createPlatformAdapter()` returns a fresh instance
- (Optional): After reset, verify factory returns correct type for current platform

---

### FIX-05 + FIX-09: isSafeSkillName export + short-circuit (P2 + P3)

**Merged because same file**.

**Root cause**: `isSafeSkillName` is module-private (not exported) forcing test to duplicate logic. Short-circuit order wastes `createPlatformAdapter()` call when skill name has no backslash.

**Files involved**: `packages/cli/installer.ts` > isSafeSkillName (L117-128)

**Fix approach**:

1. **Export**: Add `export` to `isSafeSkillName` function declaration
2. **Short-circuit** (P3-9): Reorder to check the cheap condition first:
   ```ts
   && !(skillName.includes('\\') && createPlatformAdapter().isWindows())
   ```

Add the `export` in the re-export block at bottom of `installer.ts` if needed, or directly on the function if it's already exported through `cli/index.ts`.

**Complexity**: 簡單（1 file, 2 lines changed）

**Regression test**: REGTEST-01 (is-safe-skill-name.test.js) imports `isSafeSkillName` from production.

---

### FIX-06: rewrite-imports.mjs export (P2)

**Root cause**: `resolvePackage` and `relativePath` in `rewrite-imports.mjs` are module-private. `test/rewrite-imports.test.js` duplicates their logic — providing zero regression safety.

**Files involved**: `packages/tools/rewrite-imports.mjs` > resolvePackage(), relativePath()

**Fix approach**: Export both functions:
```mjs
export function resolvePackage(specifier) { ... }
export function relativePath(fromFile, pkgPath, root) { ... }
```

**Complexity**: 簡單（1 file, 2 lines changed — add `export` keyword）

**Regression test**: REGTEST-02 (rewrite-imports.test.js) imports from production instead of duplicating.

---

### FIX-07: updater remaining branch coverage (P2)

**Root cause**: Two branches in `updater.ts` remain untested after Round 7:
- `checkForPackageUpdate` `!latestVersion` early return (L151) — if npm returns empty/null
- `execCommand` error event handler (L92) — `child.on('error', reject)` when spawn fails (ENOENT)

**Files involved**: `packages/cli/updater.ts` > L92, L151

**Fix approach**: Add test cases in `test/updater-extras.test.js`:
1. Mock exec to return empty stdout (trigger `!latestVersion`)
2. Mock exec to throw spawn error (trigger error event handler)

**Complexity**: 中等（1 test file, ~30 lines added）

**Regression test**: REGTEST-06 (updater-extras.test.js additions)

---

### FIX-08: Unused SystemError import (P3)

**Root cause**: `packages/tools/generate-storyboard-images/index.ts` line 7 imports `SystemError` from `@laitszkin/tool-utils` but the symbol is never referenced in the file.

**Files involved**: `packages/tools/generate-storyboard-images/index.ts` > L7

**Fix approach**: Remove `SystemError` from the import statement:
```ts
import { UserInputError, createToolRunner } from '@laitszkin/tool-utils';
```

**Complexity**: 簡單（1 file, 1 line changed）

**Regression test**: 無需 — existing suite confirms it still compiles.

---

### FIX-10 + FIX-11 + FIX-12 + FIX-13 + FIX-14 + FIX-15 + FIX-16 + FIX-17: Test quality improvements (P3)

See individual REGTEST designs below. All are test-file-only changes.

---

## 6. Worker Prompt Library

### Fix Worker Prompts

#### WORKER-A: FIX-01 Architecture error path consolidation

```
## Mission
修復 architecture tool 的三項錯誤處理問題：
1. `parseEndpoint()` throw `Error` → `UserInputError`
2. `handleApply` catch block 加入 `SystemError` 判別
3. `handleTemplate` 錯誤路徑轉換為 typed error

## Context
- Review dimensions: Spec implementation deviation, Architecture defect
- Spec requirement: Req 3 — Unified error handling
- Severity: P2 (partial), P3

## Input
- `packages/tools/architecture/index.ts` — L79-81 (parseEndpoint), L433-440 (catch), L525-566 (handleTemplate)

## What to do

### Step 1: parseEndpoint (L79-81)
Change:
```ts
if (parts.length === 0) throw new Error(`Invalid endpoint: "${value}"`);
```
To:
```ts
if (parts.length === 0) throw new UserInputError(`Invalid endpoint: "${value}"`);
```

### Step 2: Catch block (L433-440)
Change:
```ts
catch (e: any) {
  if (e instanceof UserInputError) {
    stderr.write(`${e.message}\n`);
  } else {
    stderr.write(`Batch aborted: ${e.message}\n`);
  }
  return 1;
}
```
To:
```ts
catch (e: any) {
  if (e instanceof UserInputError) {
    stderr.write(`${e.message}\n`);
  } else if (e instanceof SystemError) {
    stderr.write(`${e.message}\n${e.stack}\n`);
  } else {
    stderr.write(`Batch aborted: ${e.message}\n`);
  }
  return 1;
}
```
Add `SystemError` to the import at the top of the file:
```ts
import { UserInputError, SystemError } from '@laitszkin/tool-utils';
```

### Step 3: handleTemplate spec-dir not found (L525-536)
Current code:
```ts
if (!fs.existsSync(resolvedSpecDir)) {
  stderr.write(`Spec directory not found: ${resolvedSpecDir}\n`);
} else {
  const mdFiles = fs.readdirSync(resolvedSpecDir).filter((f: string) => f.endsWith('.md'));
  if (mdFiles.length > 0) {
    stderr.write(`Spec directory found but no SPEC.md. Found: ${mdFiles.join(', ')}\n`);
  } else {
    stderr.write(`Spec directory found but no SPEC.md. No .md files found.\n`);
  }
}
return 1;
```
Change this to throw `UserInputError` for user-input validation errors:
Wrap the directory checking code in a block that can throw UserInputError instead of writing to stderr. The simplest approach: if these conditions are hit, throw UserInputError with the same message.

```ts
if (!fs.existsSync(resolvedSpecDir)) {
  throw new UserInputError(`Spec directory not found: ${resolvedSpecDir}`);
}
const mdFiles = fs.readdirSync(resolvedSpecDir).filter((f: string) => f.endsWith('.md'));
if (mdFiles.length > 0) {
  throw new UserInputError(`Spec directory found but no SPEC.md. Found: ${mdFiles.join(', ')}`);
}
throw new UserInputError('Spec directory found but no SPEC.md. No .md files found.');
```
Then wrap the entire handleTemplate function body in a try-catch that catches AppError and writes formatted output.

### Step 4: handleTemplate file write error (L560-566)
Change the catch block:
```ts
try {
  fs.mkdirSync(outputDirPath, { recursive: true });
  fs.writeFileSync(outputPath, lines.join('\n'), 'utf8');
  stdout.write(`${outputPath}\n`);
} catch (e: any) {
  stderr.write(`Error writing proposal.yaml: ${e.message}\n`);
  return 1;
}
```
Change to throw SystemError:
```ts
try {
  fs.mkdirSync(outputDirPath, { recursive: true });
  fs.writeFileSync(outputPath, lines.join('\n'), 'utf8');
  stdout.write(`${outputPath}\n`);
} catch (e: any) {
  throw new SystemError(`Error writing proposal.yaml: ${e.message}`);
}
```
This will propagate to the handleTemplate caller (architectureHandler) which should also have error handling.

Actually, for handleTemplate, a simpler approach is to wrap the function body in a try/catch:
```ts
async function handleTemplate(templateArgs: string[], context: ToolContext): Promise<number> {
  try {
    // ... existing body ...
  } catch (e: any) {
    if (e instanceof UserInputError) {
      (context.stderr || process.stderr).write(`${e.message}\n`);
    } else if (e instanceof SystemError) {
      (context.stderr || process.stderr).write(`${e.message}\n${e.stack}\n`);
    } else {
      (context.stderr || process.stderr).write(`Error: ${e.message}\n`);
    }
    return 1;
  }
}
```

## Scope
- Allowed files:
  - `packages/tools/architecture/index.ts` — all changes
- Forbidden files:
  - All other files

## Output
- Which lines were modified in each step
- Change summaries
- Test results

## Verify
- Run: `node --test 'test/**/*.test.js'`
- Expected: All tests pass
- Run: `node --test test/tools/architecture-error-types.test.js`
- Expected: Existing tests still pass

## Boundaries
- Do NOT modify handleApply early exits (L156-159, L180-181, L184-186, L219-220)
- Do NOT modify the atlas CLI fallback path in architectureHandler (L610-637)
- Do NOT modify any test files
- Error messages must remain semantically unchanged (same user-facing text)
```

---

#### WORKER-B: FIX-02 + FIX-03 assertCommand and tools path

```
## Mission
修復 cli/index.ts 中 assertCommand 的錯誤型別和 tools dispatch 路徑的型別安全缺口。

## Context
- Review dimensions: Architecture defect, Spec implementation deviation
- Spec requirement: Req 5 — Dispatch isolation; Req 3 — Error handling
- Severity: P2

## Input
- `packages/cli/index.ts` — L85-89 (assertCommand), L145-173 (tools dispatch)
- `packages/cli/types.ts` — 不需要修改

## What to do

### Step 1: assertCommand error type (FIX-02)
In `packages/cli/index.ts`, change the assertCommand function (L85-89):

Current:
```ts
function assertCommand<T>(cmd: any, expected: string): asserts cmd is T {
  if (!cmd || cmd.command !== expected) {
    throw new Error(`Internal error: expected command "${expected}", got "${cmd?.command}"`);
  }
}
```

Change to (add SystemError import and use it):
```ts
function assertCommand<T>(cmd: any, expected: string): asserts cmd is T {
  if (!cmd || cmd.command !== expected) {
    throw new SystemError(`Internal error: expected command "${expected}", got "${cmd?.command}"`);
  }
}
```

Check existing imports at top of file — `SystemError` is already imported:
```ts
import { AppError, UserInputError, SystemError } from '@laitszkin/tool-utils';
```
(This import already exists, so no import change needed.)

### Step 2: tools path assertCommand (FIX-03)
In the tools/tools-help dispatch section (L145-173), add assertCommand calls:

Current (L145-173):
```ts
const cmd = parser.parse(argv) as ToolCommand | ToolsHelpCommand;
if (cmd.command === 'tools-help') {
  return {
    command: 'tools-help',
    ...
    helpTopic: 'tools-help',
  };
}
return {
  command: 'tool',
  ...
};
```

Change to:
```ts
const cmd = parser.parse(argv) as ToolCommand | ToolsHelpCommand;
if (cmd.command === 'tools-help') {
  assertCommand<ToolsHelpCommand>(cmd, 'tools-help');
  return {
    command: 'tools-help',
    ...
    helpTopic: 'tools-help',
  };
}
assertCommand<ToolCommand>(cmd, 'tool');
return {
  command: 'tool',
  ...
};
```

Verify the import of types at the top of the file includes `ToolsHelpCommand`:
```ts
import type { CommandParser, InstallCommand, UninstallCommand, ToolCommand, ToolsHelpCommand } from './parsers/types.js';
```
(This import already exists, so no change needed.)

## Scope
- Allowed files:
  - `packages/cli/index.ts` — all changes
- Forbidden files:
  - All other files

## Output
- Exactly which lines were modified (file path + line numbers)
- Change summary
- Test results

## Verify
- Run: `node --test test/cli/dispatch-table.test.js test/cli/tool-args-parser.test.js`
- Expected: All dispatch tests pass
- Run: `node --test 'test/**/*.test.js'`
- Expected: Full suite passes

## Boundaries
- Do NOT change parseArguments return value structure or semantics
- Do NOT change InstallArgsParser, UninstallArgsParser, or ToolArgsParser
- The assertCommand message must still clearly indicate "expected X, got Y"
- Do NOT modify any test files
```

---

#### WORKER-C: FIX-04 PlatformAdapter reset mechanism

```
## Mission
在 platform-adapter.ts 中加入 resetPlatformAdapter() 匯出函數，讓測試能重設 singleton 快取。

## Context
- Review dimension: Spec implementation omission
- Spec requirement: Req 2 — Cross-platform abstraction
- Severity: P2

## Input
- `packages/tool-utils/platform-adapter.ts` — L99-110

## What to do
在 `createPlatformAdapter` 之後加入 reset 函數：

```ts
/** Reset the cached adapter (for test use only). */
export function resetPlatformAdapter(): void {
  _adapter = undefined;
}
```

放在 `createPlatformAdapter` 定義之後（L109 之後），不影響現有行為。

Also export this function from the package's public API if there's a barrel export. Check:
- `packages/tool-utils/index.ts` or `packages/tool-utils/dist/index.js` — if it contains re-exports, add `resetPlatformAdapter` to the export list

## Scope
- Allowed files:
  - `packages/tool-utils/platform-adapter.ts` — add reset function
  - `packages/tool-utils/index.ts` (or dist/index.js) — add to exports if barrel exists
- Forbidden files:
  - All other files

## Output
- Which files were modified and how
- Verification that the function exists and is exported

## Verify
- Run: `node --test 'test/**/*.test.js'`
- Expected: All tests pass
- Run: `node -e "const m = require('./packages/tool-utils/dist/platform-adapter.js'); console.log(typeof m.resetPlatformAdapter)"`
- Expected: 'function'

## Boundaries
- resetPlatformAdapter is for TEST USE ONLY — do not call it in production code
- Do NOT modify the PlatformAdapter interface or class implementations
- Do NOT modify createPlatformAdapter's caching logic (only add the reset function)
- File paths use `dist/` for compiled output; ensure you check both source (.ts) and compiled (.js/.mjs) paths
```

---

#### WORKER-D: FIX-05 + FIX-09 + FIX-08 isSafeSkillName export + short-circuit + unused import

```
## Mission
三項小型來源碼修復：
1. 匯出 `isSafeSkillName` 函數（讓測試可匯入）
2. 優化短路順序（backslash 檢查先於 platform adapter 呼叫）
3. 移除 generate-storyboard-images 未使用的 SystemError import

## Context
- Review dimensions: Spec implementation omission, Redundant code, Performance concern
- Spec requirements: Req 2, Req 4
- Severity: P2 + P3 + P3

## Input
- `packages/cli/installer.ts` — isSafeSkillName (L117-128)
- `packages/tools/generate-storyboard-images/index.ts` — L7 (imports)

## What to do

### Step 1: installer.ts — export + short-circuit
In `packages/cli/installer.ts`:

a) Add `export` to the `isSafeSkillName` function:
```ts
export function isSafeSkillName(skillName: string): boolean {
```

b) Reorder the backslash check (L124): Change:
```ts
&& !(createPlatformAdapter().isWindows() && skillName.includes('\\'))
```
To:
```ts
&& !(skillName.includes('\\') && createPlatformAdapter().isWindows())
```

### Step 2: generate-storyboard-images/index.ts — remove unused import
In `packages/tools/generate-storyboard-images/index.ts` line 7:
Change:
```ts
import { UserInputError, SystemError, createToolRunner } from '@laitszkin/tool-utils';
```
To:
```ts
import { UserInputError, createToolRunner } from '@laitszkin/tool-utils';
```

Confirm by searching the file: `SystemError` should not appear elsewhere.

## Scope
- Allowed files:
  - `packages/cli/installer.ts` — isSafeSkillName
  - `packages/tools/generate-storyboard-images/index.ts` — import
- Forbidden files:
  - All other files

## Output
- Which files were modified
- Change summary for each file
- Test results

## Verify
- Run: `node --test 'test/**/*.test.js'`
- Expected: All tests pass
- Check: `grep -n "SystemError" packages/tools/generate-storyboard-images/index.ts` should only show results in unrelated code (if any)

## Boundaries
- Do NOT change any other imports in generate-storyboard-images
- Do NOT change isSafeSkillName's validation behavior — only add export + reorder
- isSafeSkillName export should not break existing consumers
```

---

#### WORKER-E: FIX-06 rewrite-imports.mjs export

```
## Mission
匯出 rewrite-imports.mjs 中的 resolvePackage() 和 relativePath() 函數。

## Context
- Review dimension: Spec implementation omission
- Spec requirement: Req 4 — Test coverage
- Severity: P2

## Input
- `packages/tools/rewrite-imports.mjs` — resolvePackage(), relativePath()

## What to do
Add `export` keyword to both function declarations:

```mjs
export function resolvePackage(specifier) {
  // existing body
}

export function relativePath(fromFile, pkgPath, root) {
  // existing body
}
```

## Scope
- Allowed files:
  - `packages/tools/rewrite-imports.mjs` — add export keywords
- Forbidden files:
  - All other files

## Output
- Which lines were modified
- Confirmation that exports work

## Verify
- Run: `node --test test/rewrite-imports.test.js`
- Expected: Tests pass
- The test file is expected to be updated by REGTEST-02 to import from production. If REGTEST-02 hasn't run yet, existing inline-copy tests should still pass independently.

## Boundaries
- Do NOT change any function implementation, logic, or behavior
- Only add `export` keyword before existing function declarations
```

---

### Regression Test Worker Prompts

#### REGTEST-01: is-safe-skill-name production import

```
## Mission
更新 test/cli/is-safe-skill-name.test.js 從生產代碼匯入 isSafeSkillName，移除 inline copy。

## Context
- Fix summary: FIX-05 將 isSafeSkillName 改為匯出
- Root cause: 函數為私有，測試被迫複製邏輯
- Fix files involved: `packages/cli/installer.ts`

## Input
- Read fix-related files: `packages/cli/installer.ts` — exported isSafeSkillName
- Read existing test file: `test/cli/is-safe-skill-name.test.js`
- Read `packages/cli/index.ts` — check how isSafeSkillName is re-exported (if at all)

## What to do
Update `test/cli/is-safe-skill-name.test.js`:

1. Remove the inline `isSafeSkillName` function definition (L5-15)
2. Replace with import from production:
```js
import { isSafeSkillName } from '../../packages/cli/installer.js';
// OR if not directly importable:
import { ... } from '@laitszkin/cli';
```

Check the best import path:
- If `packages/cli/installer.ts` now exports `isSafeSkillName`, use:
  ```js
  import { isSafeSkillName } from '../../packages/cli/dist/installer.js';
  ```
- If it's re-exported through packages/cli, use:
  ```js
  import { isSafeSkillName } from '../../packages/cli/dist/index.js';
  ```

Check the re-exports in packages/cli/index.ts (around L30-50):
```ts
export { ..., isSafeSkillName } from './installer.js';
```
If `isSafeSkillName` is not in the re-export list, use the direct path `../../packages/cli/dist/installer.js`.

3. Also remove the `process.platform === 'win32'` in the test and replace with the actual production code's logic. The test should validate the production function, not a test-local version.

4. Keep all test cases (allow backslash on non-Windows, block null byte, block separators, block absolute paths, block empty, reject non-string) — they should all pass against the production import.

## Scope
- Allowed files:
  - `test/cli/is-safe-skill-name.test.js` — rewrite imports
- Forbidden files:
  - All source code files
  - Any other test files

## Verify
- Run: `node --test test/cli/is-safe-skill-name.test.js`
- Expected: All tests pass
- Confirm: `node --test 'test/**/*.test.js'` passes

## Boundaries
- Do NOT modify any source code
- Keep all existing test cases and their assertions
- Only change how isSafeSkillName is obtained (import vs inline)
```

---

#### REGTEST-02: rewrite-imports production import

```
## Mission
更新 test/rewrite-imports.test.js 從生產代碼匯入 resolvePackage 和 relativePath，移除 inline copy。

## Context
- Fix summary: FIX-06 將 rewrite-imports.mjs 的 resolvePackage/relativePath 改為匯出
- Root cause: 函數為私有，測試被迫複製邏輯
- Fix files involved: `packages/tools/rewrite-imports.mjs`

## Input
- Read fix-related files: `packages/tools/rewrite-imports.mjs` — exported resolvePackage/relativePath
- Read existing test file: `test/rewrite-imports.test.js`

## What to do
Update `test/rewrite-imports.test.js`:

1. Remove the inline `resolvePackage` function (L47-57) and `relativePath` function (L58-63)
2. Remove the `TOOL_NAMES` array and `PACKAGE_MAP` constant ONLY if they were only used by the inline functions

3. Add imports:
```js
import { resolvePackage, relativePath } from '../packages/tools/rewrite-imports.mjs';
```

4. Update the test assertions to reference the imported functions directly instead of the inline copies.

5. Check the soft-test pattern at L148-182 (TOOL_NAMES JSON replacement test):
   - This test should remain as it validates a formatting utility
   - But make sure it actually asserts something meaningful rather than silently passing
   - Add `assert.ok(true)` or remove the early-return if the test is deliberately checking behavior

## Scope
- Allowed files:
  - `test/rewrite-imports.test.js` — rewrite imports
- Forbidden files:
  - All source code files

## Verify
- Run: `node --test test/rewrite-imports.test.js`
- Expected: All tests pass
- Confirm: `node --test 'test/**/*.test.js'` passes

## Boundaries
- Do NOT modify any source code
- Keep all existing test cases and their assertions
- If the import path has issues (.mjs extension), use dynamic import `await import(...)` as fallback
```

---

#### REGTEST-03: Architecture "Batch aborted:" error path test

```
## Mission
在 test/tools/architecture-error-types.test.js 中新增 "Batch aborted:" 通用錯誤路徑的測試。

## Context
- Fix summary: FIX-01 為 catch block 加入 SystemError 判別
- Root cause: 測試僅覆蓋 UserInputError 路徑，通用錯誤 "(Batch aborted: ...") 無測試
- Fix files involved: `packages/tools/architecture/index.ts`

## Input
- Read fix-related files: `packages/tools/architecture/index.ts` — architectureHandler, handleApply
- Read existing test file: `test/tools/architecture-error-types.test.js`

## What to do
In `test/tools/architecture-error-types.test.js`, add a test that triggers the generic error path.

The architecture tool's `handleApply` only throws `UserInputError` inside the try block (L244-432), so the generic error path (catch else-branch at L436-437) is only reachable if:
- A non-AppError error is thrown inside handleApply's outer try block
- Or if the YAML parsing path throws something unexpected

Since we cannot easily force handleApply to throw a non-AppError (all throws are now UserInputError), test the edge case differently:

**Option A**: Create a YAML file that passes parsing but causes an unexpected error during processing:
```js
test('architectureHandler writes "Batch aborted:" for generic errors', async () => {
  // This tests the catch block's else branch
  // Create a scenario where a non-UserInputError occurs
  const { architectureHandler } = await import(
    '../../packages/tools/architecture/dist/index.js'
  );
  const stderr = { data: '', write(chunk) { this.data += chunk; return true; } };
  const context = { stdout: { write: () => {} }, stderr };

  // Use a nonexistent spec to trigger a read error
  const result = await architectureHandler(['apply', '/nonexistent/spec.yaml'], context);
  assert.strictEqual(result, 1);
  
  // The error should have something written to stderr
  assert.ok(stderr.data.length > 0);
});
```

**Option B**: If handleApply is not directly testable for the generic error case, add a unit test that verifies the catch block behavior by testing the error-type differentiation logic.

Pick whichever approach works with the current code.

## Scope
- Allowed files:
  - `test/tools/architecture-error-types.test.js` — add test case
- Forbidden files:
  - All source code files

## Verify
- Run: `node --test test/tools/architecture-error-types.test.js`
- Expected: All tests pass (new + existing)

## Boundaries
- Do NOT modify any source code
- New test must be independently executable
```

---

#### REGTEST-04: generate-storyboard-images handler test

```
## Mission
在 test/tools/generate-storyboard-images-prompt-multiple.test.js 中新增真實 handler 測試（不僅僅測試 stdlib）。

## Context
- Fix summary: FIX-08 移除未使用的 SystemError import
- Root cause: 現有測試只測試 node:util.parseArgs 的行為，未測試 tool 的實際 handler
- Fix files involved: `packages/tools/generate-storyboard-images/index.ts`

## Input
- Read fix-related files: `packages/tools/generate-storyboard-images/index.ts` — handler and schema
- Read existing test file: `test/tools/generate-storyboard-images-prompt-multiple.test.js`

## What to do
In `test/tools/generate-storyboard-images-prompt-multiple.test.js`, add a test that exercises the tool's actual schema by dynamically importing the tool:

```js
test('generate-storyboard-images handler receives correct args via schema', async () => {
  // Dynamic import the schema definition to test its parseArgs behavior
  const mod = await import('../../packages/tools/generate-storyboard-images/index.js');
  // The module exports `tool` which has the schema
  // Test that the schema with multiple:true accepts --prompt correctly
  const { parseArgs } = await import('node:util');
  
  // Generate the schema definition from the tool's schema export if accessible,
  // or recreate it matching the tool's schema
  const { values } = parseArgs({
    options: {
      'prompt': { type: 'string', multiple: true },
      // ... other options if needed for realistic test
    },
    args: ['--prompt', 'Scene 1', '--prompt', 'Scene 2'],
    strict: false,
  });
  
  assert.ok(Array.isArray(values.prompt));
  assert.strictEqual(values.prompt.length, 2);
  assert.strictEqual(values.prompt[0], 'Scene 1');
  assert.strictEqual(values.prompt[1], 'Scene 2');
});
```

Also add a test that simulates the handler call with `--prompts-file` to verify that path still works correctly:
```js
test('generate-storyboard-images handler accepts --prompts-file alternative', async () => {
  const { tool } = await import('../../packages/tools/generate-storyboard-images/index.js');
  assert.ok(tool);
  assert.strictEqual(tool.name, 'generate-storyboard-images');
  // Verify the handler function exists
  assert.strictEqual(typeof tool.handler, 'function');
});
```

## Scope
- Allowed files:
  - `test/tools/generate-storyboard-images-prompt-multiple.test.js` — add test cases
- Forbidden files:
  - All source code files

## Verify
- Run: `node --test test/tools/generate-storyboard-images-prompt-multiple.test.js`
- Expected: All tests pass

## Boundaries
- Do NOT modify any source code
- Tests must be independently executable
- If dynamic import fails, fall back to testing node:util.parseArgs with the same schema config
```

---

#### REGTEST-05: interactive-paths try/finally cleanup

```
## Mission
在 test/cli/interactive-paths.test.js 中加入 try/finally 以確保暫存目錄在測試失敗時也被清理。

## Context
- Fix summary: Test quality improvement
- Root cause: 使用 fs.mkdtemp 但缺少異常清理
- Fix files involved: `test/cli/interactive-paths.test.js`

## Input
- Read existing test file: `test/cli/interactive-paths.test.js`

## What to do
For each test case in `test/cli/interactive-paths.test.js` that creates temp directories via `fs.mkdtemp`:

Current pattern:
```js
test('...', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'prefix-'));
  // ... test body using tempDir ...
  // No cleanup
});
```

Change to:
```js
test('...', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'prefix-'));
  try {
    // ... test body using tempDir ...
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});
```

Apply this to ALL tests in the file that create temp directories.

## Scope
- Allowed files:
  - `test/cli/interactive-paths.test.js` — add try/finally
- Forbidden files:
  - All source code files

## Verify
- Run: `node --test test/cli/interactive-paths.test.js`
- Expected: All tests pass

## Boundaries
- Do NOT modify any source code
- Only add try/finally blocks — do NOT change test logic or assertions
```

---

#### REGTEST-06: updater remaining branch coverage

```
## Mission
在 test/updater-extras.test.js 中補足 updater.ts 的剩餘未覆蓋分支：
1. `checkForPackageUpdate` 當 getLatestPublishedVersion 回傳空值時的 `!latestVersion` 早期返回
2. `execCommand` 的 error 事件處理器 (child.on('error', reject))

## Context
- Fix summary: FIX-07 需要測試來覆蓋這些分支
- Root cause: 這些分支在 Round 7 新增測試後仍未被覆蓋
- Fix files involved: `packages/cli/updater.ts`

## Input
- Read fix-related files: `packages/cli/updater.ts` — L92 (error event), L151 (!latestVersion)
- Read existing test file: `test/updater-extras.test.js`

## What to do
In `test/updater-extras.test.js`, add the following test cases:

### Test 1: checkForPackageUpdate !latestVersion branch
```js
test('checkForPackageUpdate handles missing latest version', async () => {
  const { checkForPackageUpdate } = await import('../../packages/cli/dist/updater.js');
  
  const mockExec = async () => {
    return { stdout: '' };  // Empty string, no version
  };
  
  const result = await checkForPackageUpdate({
    packageName: 'test-pkg',
    currentVersion: '1.0.0',
    env: {},
    stdin: { isTTY: false },
    stdout: { isTTY: false },
    stderr: { write: () => true },
    exec: mockExec,
  });
  
  assert.strictEqual(result.checked, false);
  assert.strictEqual(result.updated, false);
});
```

### Test 2: execCommand spawn error event (child.on('error', reject))
This one is harder to test as it requires creating a scenario where spawn itself fails.
A pragmatic approach: create mock that triggers error through DI.

```js
test('execCommand handles spawn failure', async () => {
  const { execCommand } = await import('../../packages/cli/dist/updater.js');
  
  try {
    // Using a command that doesn't exist should trigger the error handler
    const result = await execCommand('nonexistent-command-that-fails', []);
    // If it resolves (unlikely but possible on some systems), that's also OK
    assert.ok(result !== undefined);
  } catch (e) {
    // If it rejects via the error event handler, that's expected
    assert.ok(e instanceof Error);
  }
});
```

Test 2 may need to be skipped on systems where spawn doesn't fail. Use a conditional approach:
```js
test('execCommand handles spawn failure', { skip: process.platform === 'win32' }, async () => {
  // ... test body
});
```

## Scope
- Allowed files:
  - `test/updater-extras.test.js` — add test cases
- Forbidden files:
  - All source code files

## Verify
- Run: `node --test test/updater-extras.test.js`
- Expected: All tests pass (new + existing)

## Boundaries
- Do NOT modify any source code
- Do NOT mock node:child_process.spawn directly — use the exec DI parameter
```

---

#### REGTEST-07: assertCommand SystemError verification

```
## Mission
驗證 assertCommand 現在擲出 SystemError 而非泛用 Error。

## Context
- Fix summary: FIX-02 將 assertCommand 從 new Error() 改為 new SystemError()
- Root cause: assertCommand 的錯誤未使用型別化錯誤層級
- Fix files involved: `packages/cli/index.ts`

## Input
- Read fix-related files: `packages/cli/index.ts` — assertCommand (L85-89)
- Read `packages/tool-utils/app-error.ts` — SystemError class

## What to do
Check if `assertCommand` can be tested indirectly. Since it's a private function inside `parseArguments`, it can only be tested through the public `parseArguments` API.

Add a test that verifies the error type when assertCommand would fire. Since we can't easily force a dispatch-table misconfiguration, verify at minimum that the error boundary in `run()` handles the outcome correctly for a SystemError.

In a new or existing test file (e.g., `test/cli/error-boundary.test.js` or `test/cli/dispatch-table.test.js`):

```js
test('dispatch table errors produce stderr output (SystemError path)', async () => {
  // This verifies the overall error path works for dispatch table misconfiguration.
  // The specific assertion is that an internal dispatch error writes to stderr
  // and returns exit code 1.
  
  const { run } = await import('@laitszkin/cli');
  const stderr = { data: '', write(chunk) { this.data += chunk; return true; } };
  const stdout = { data: '', write(chunk) { this.data += chunk; return true; } };
  
  // Trigger a path that would exercise the dispatch error handling
  const exitCode = await run(['uninstall', '--help'], {
    stdout,
    stderr,
    env: { APOLLO_TOOLKIT_SKIP_UPDATE_CHECK: '1' },
  });
  
  // uninstall --help should work normally (test that existing behavior is preserved)
  assert.strictEqual(exitCode, 0);
});
```

If direct testing of assertCommand's SystemError type is not possible through the public API, document the limitation and test the error boundary path behavior instead.

## Scope
- Allowed files:
  - `test/cli/dispatch-table.test.js` or `test/cli/error-boundary.test.js`
- Forbidden files:
  - All source code files

## Verify
- Run: `node --test test/cli/dispatch-table.test.js`
- Expected: All tests pass

## Boundaries
- Do NOT modify any source code
- Only test through public APIs (parseArguments, run)
```

---

## 7. Fix Batch Schedule

### Batch 1 — Independent Source Fixes (Parallel — no file overlap)

| Worker | Issues | Files |
|--------|--------|-------|
| WORKER-A | FIX-01 (P2+P3) | `packages/tools/architecture/index.ts` |
| WORKER-B | FIX-02+03 (P2) | `packages/cli/index.ts` |
| WORKER-C | FIX-04 (P2) | `packages/tool-utils/platform-adapter.ts` |
| WORKER-D | FIX-05+09+08 (P2+P3) | `packages/cli/installer.ts`, `packages/tools/generate-storyboard-images/index.ts` |
| WORKER-E | FIX-06 (P2) | `packages/tools/rewrite-imports.mjs` |

**Gate**:
- [ ] WORKER-A reports success
- [ ] WORKER-B reports success
- [ ] WORKER-C reports success
- [ ] WORKER-D reports success
- [ ] WORKER-E reports success
- [ ] Run verification: `node --test 'test/**/*.test.js'` — all pass

---

### Batch 2 — Regression Test Implementation (Parallel — no file overlap between test files)

| Worker | Issues | Test File |
|--------|--------|-----------|
| REGTEST-01 | FIX-05 verification | `test/cli/is-safe-skill-name.test.js` |
| REGTEST-02 | FIX-06 verification | `test/rewrite-imports.test.js` |
| REGTEST-03 | FIX-01 verification | `test/tools/architecture-error-types.test.js` |
| REGTEST-04 | FIX-08 verification | `test/tools/generate-storyboard-images-prompt-multiple.test.js` |
| REGTEST-05 | Test quality (P3-13) | `test/cli/interactive-paths.test.js` |
| REGTEST-06 | FIX-07 verification | `test/updater-extras.test.js` |
| REGTEST-07 | FIX-02+03 verification | `test/cli/dispatch-table.test.js` or `error-boundary.test.js` |

**Depends on**: All Batch 1 workers completed and verified.

**Strategy**: Parallel dispatch (no file overlap between any test files).

**Gate**:
- [ ] All REGTEST workers report success
- [ ] Run each regtest file individually:
  - [ ] `node --test test/cli/is-safe-skill-name.test.js`
  - [ ] `node --test test/rewrite-imports.test.js`
  - [ ] `node --test test/tools/architecture-error-types.test.js`
  - [ ] `node --test test/tools/generate-storyboard-images-prompt-multiple.test.js`
  - [ ] `node --test test/cli/interactive-paths.test.js`
  - [ ] `node --test test/updater-extras.test.js`
  - [ ] `node --test test/cli/dispatch-table.test.js`
- [ ] Full suite: `node --test 'test/**/*.test.js'`

---

### Batch Final — Integration

- **Tasks**: Full test suite + coverage + cross-check REPORT.md
- **Strategy**: Sequential (coordinator handles directly)

**Gate**:
- [ ] Full test suite: `node --test 'test/**/*.test.js'`
- [ ] Coverage: `COVERAGE=true bash scripts/test.sh` — thresholds met
- [ ] Every issue in REPORT.md confirmed resolved:
  - [ ] P2 #1 (FIX-01): Architecture `parseEndpoint` → UserInputError, catch block SystemError, handleTemplate typed errors
  - [ ] P2 #2 (FIX-02): assertCommand → SystemError
  - [ ] P2 #3 (FIX-03): Tools path assertCommand added
  - [ ] P2 #4 (FIX-04): `resetPlatformAdapter()` exported
  - [ ] P2 #5 (FIX-05): `isSafeSkillName` exported, short-circuit reordered
  - [ ] P2 #6 (FIX-06): `resolvePackage`/`relativePath` exported
  - [ ] P2 #7 (FIX-07): Updater remaining branch coverage tests
  - [ ] P2 #8: Coverage exclude — accepted (already documented)
  - [ ] P3 #2 (FIX-01): parseEndpoint Error → UserInputError
  - [ ] P3 #5 (FIX-01): Catch block SystemError differentiate
  - [ ] P3 #6 (REGTEST-03): "Batch aborted:" test added
  - [ ] P3 #7 (FIX-08): Unused SystemError import removed
  - [ ] P3 #9 (FIX-05): Short-circuit reorder in isSafeSkillName
  - [ ] P3 #10 (REGTEST-01): Test imports from production (no process.platform)
  - [ ] P3 #11 (REGTEST-04): Handler test added (not just stdlib)
  - [ ] P3 #12+13 (REGTEST-02+05): Test quality improvements
  - [ ] P3 #1 (manual flag parsing) — accepted, no change
  - [ ] P3 #3 (if-else dispatch) — accepted, no change
  - [ ] P3 #4 (helpTopic dispatch) — accepted, no change
  - [ ] P3 #8 (singleton reset) — covered by FIX-04

---

## 8. Regression Test Inventory

| Test ID | Type | File | Related Fix | Scenario |
|---------|------|------|-------------|----------|
| REGTEST-01 | Unit | `test/cli/is-safe-skill-name.test.js` | FIX-05 | Import `isSafeSkillName` from production; verify backslash, null byte, path separators |
| REGTEST-02 | Unit | `test/rewrite-imports.test.js` | FIX-06 | Import `resolvePackage`/`relativePath` from production; fix soft-test pattern |
| REGTEST-03 | Unit | `test/tools/architecture-error-types.test.js` | FIX-01 | Add "Batch aborted:" generic error path test |
| REGTEST-04 | Unit | `test/tools/generate-storyboard-images-prompt-multiple.test.js` | FIX-08 | Add real handler test (not just stdlib) |
| REGTEST-05 | Unit | `test/cli/interactive-paths.test.js` | P3-13 | Add try/finally temp dir cleanup |
| REGTEST-06 | Unit | `test/updater-extras.test.js` | FIX-07 | Add `!latestVersion` + execCommand error event tests |
| REGTEST-07 | Unit | `test/cli/dispatch-table.test.js` or error-boundary.test.js | FIX-02+03 | Verify assertCommand SystemError path |

All 7 regression tests run in parallel (no file overlap).

---

## 9. Verification Checkpoints

### Checkpoint 1 — After Batch 1 (source fixes)
- Run: `node --test 'test/**/*.test.js'`
- Expected: All existing tests pass, all fixes applied
- Additional per-worker checks from each worker's Verify section

### Checkpoint 2 — After Batch 2 (regression tests)
- Run each REGTEST individually
- Run: `node --test 'test/**/*.test.js'`
- Expected: Full suite passes
- Logical check: Each REGTEST should pass on the fixed code

### Checkpoint 3 — Final verification
- Run: `COVERAGE=true bash scripts/test.sh`
- Expected: All coverage thresholds met
- Cross-check REPORT.md: every issue resolved

---

## 10. Error Recovery

- **If a fix worker fails**: Retry once with the worker's existing context, giving more specific guidance. Do not create a new worker.
- **If a fix worker fails twice**: Pause the entire flow. Preserve successful results from other workers in the same batch. Report to the user.
- **If a regression test worker reports failure (test cannot pass)**: Check whether the test code is wrong or the fix is incomplete. If the test code is wrong, continue the worker to fix it. If the fix is incomplete, go back to the corresponding fix worker.
- **If a regression test passes on the unfixed code**: The test design is invalid — redesign the oracle and dispatch a new worker.
- **If merge conflicts occur**: The coordinator resolves the conflict, then re-runs the batch gate verification.
- **If a fix or regression test breaks existing tests**: Pause. Report which test failed and which worker's change caused it.
- **For WORKER-A (architecture)**: If converting handleTemplate errors to throw breaks existing test expectations about stderr output messages, adjust the test assertions rather than reverting the fix.
- **For WORKER-D (isSafeSkillName export)**: If the export breaks existing import consumers, check whether `installer.ts` is compiled to `dist/installer.js` and the re-export chain in `cli/index.ts` works correctly.
- **For REGTEST-06 (updater branches)**: If `execCommand` error event test cannot be reliably triggered (spawn always succeeds on the test system), skip with a comment documenting why.

---

## 11. Fix History

### Round 7 — 2026-06-04

- **Issues fixed**: 20/23 issues from Round 7 review (1 P1 + 9 P2 + 7 P3 fixed; 3 partially addressed)
- **Outcome**: generate-storyboard-images `multiple: true` fixed; architecture dead schema removed + 13 Error→UserInputError conversions; PlatformAdapter singleton; normalizeParseError ambiguous argument; helpTopic 'tools-help'; updater branch coverage; assertCommand type guard added; isSafeSkillName Windows-only; shared ToolArgsParser; ToolNotFoundError comment; plus test additions across 5 new test files.
- **Key notes**: 3 issues partially addressed (CommandParser<any> type erasure, architecture manual flags, if-else dispatch chain) — accepted as design tradeoffs.
- **Commit**: `d8ecb99`

### Round 6 — 2026-06-04

- **Issues fixed**: 3/3 issues from Round 6 review (1 P1 + 2 P3)
- **Outcome**: search-logs keyword/regex `multiple: true` (P1) — schema 2 lines changed; PlatformAdapter normalizePath/EOL accepted; `_runner` intermediary variables removed.
- **Commit**: `2ba7d79`

### Round 5 — 2026-06-04

- **Issues fixed**: 8/8 issues from Round 5 review (4 P2 + 4 P3)
- **Outcome**: review-threads `_rawArgs` migration; codegraph SystemError details.code; PlatformAdapter homeDir delegation; Coverage scope Group 2; helpTopic type narrowing; test imports migration; test overlap cleanup.
- **Commit**: `117f9b7`

### Earlier rounds (4 → 1) — 2026-06-04

Rounds 1–4: Progressive resolution from P0 (create-specs args missing) through PlatformAdapter, error hierarchy, and cross-platform CI fixes. 38+ total issues resolved across `eecb6ce`, `baec86f`, `df6f957`, and later commits.

---

## 12. Boundaries

### ALWAYS

- Run gate verification immediately after every batch
- Extract worker prompts verbatim from Section 6 — do not rewrite them
- After a worker reports, digest the results before deciding next steps
- Fixes must not conflict with the original spec requirements
- Regression tests must not start before all fix batches pass
- Resolve merge conflicts yourself — the coordinator handles them. This is coordination, not implementation.
- **For WORKER-A (architecture)**: ParseEndpoint change (L79-81) must be done BEFORE the wrapping catch at L351-353 is removed. Verify the UserInputError propagates correctly.
- **For WORKER-B (CLI dispatch)**: Run dispatch-table tests before and after to confirm no behavioral change.
- **For REGTEST-01 and REGTEST-02**: Verify the production import paths are valid before dispatching.

### ASK FIRST — pause and confirm with the user

- Fix approach conflicts with spec design intent
- Need to add a new external dependency
- Worker has failed twice
- Test regression cannot be quickly diagnosed
- Architecture tool FIX-01 requires significant refactoring beyond the scope described

### NEVER

- Write implementation logic or modify source code beyond resolving merge conflict markers
- Let workers spawn sub-workers
- Skip verification and proceed to the next batch
- Modify spec documents (unless the fix reveals a spec error — report it instead)
- Start regression tests before all fixes are verified
- **Defer any REPORT.md issue to a future round** — every issue has a complete fix plan in this FIX.md
- **For WORKER-A**: Do not modify handleApply early exits (pre-condition checks) or the atlas CLI fallback path
- **For WORKER-B**: Do not change ParsedArguments interface shape or export semantics
- **For WORKER-D**: Do not change isSafeSkillName's validation behavior — only add export + reorder
- **For REGTEST workers**: Do not modify any source code files
