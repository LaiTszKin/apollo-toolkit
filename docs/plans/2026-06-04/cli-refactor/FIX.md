# Fix Coordinator Prompt: CLI 工具全面重構

- **Date**: 2026-06-04
- **Source REPORT**: `docs/plans/2026-06-04/cli-refactor/REPORT.md`
- **Source Spec**: `docs/plans/2026-06-04/cli-refactor/`
- **Total Issues**: P0: 1, P1: 1, P2: 4
- **Total Regression Tests**: 6

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

修復 CLI refactoring 第二輪審查中發現的 6 項問題（1 P0, 1 P1, 4 P2），涵蓋 create-specs handler 的 `parseArgs` 引數遺漏、單一 schema 宣告機制的架構建立、sync-memory-index 的 SystemError stack trace、StdioWriter 生產整合、sync-memory-index 測試路徑偏移，以及 ToolNotFoundError 的 dead code 啟用。共 6 個 Fix Worker、6 個 Regression Test Worker。

**Success looks like**: All 6 issues in REPORT.md are fixed, all 6 regression tests pass, full test suite passes, no regressions.

---

## 3. Issue Inventory

- FIX-01 (P0, 簡單, 實作遺漏): create-specs handler 的 `parseArgs()` 遺漏 `args: args` 參數 — `packages/tools/create-specs/index.ts`
- FIX-02 (P1, 複雜, 實作遺漏): 仍無單一 schema 宣告機制 — `packages/tool-utils/` + `packages/tools/*/index.ts`
- FIX-03 (P2, 簡單, 規格偏差): sync-memory-index 的 SystemError 分支未輸出 stack trace — `packages/tools/sync-memory-index/index.ts`
- FIX-04 (P2, 中等, 實作遺漏): StdioWriter 未被生產程式碼消費 — `packages/cli/index.ts`, `packages/cli/types.ts`, `packages/tui/`
- FIX-05 (P2, 簡單, 測試涵蓋): sync-memory-index 測試依賴 `run()` 而非直接 handler 測試 — `test/tools/sync-memory-index-error.test.js`
- FIX-06 (P2, 簡單, 多餘代碼): ToolNotFoundError 為 dead code — `packages/tool-registry/registry.ts`

---

## 4. Fix Dependency Analysis

### Dependencies

- FIX-03 (SystemError stack) 與 FIX-05 (test reformat) 操作同一個 handler → 邏輯相依：FIX-03 先改 handler 行為，FIX-05 再修正測試以驗證新行為
- FIX-04 (StdioWriter) 修改 `cli/index.ts`，不影響其他 fix
- FIX-02 (schema) 建立新型別與新 helper，不影響其他 fix (轉換 filter-logs 為示範)
- FIX-06 (ToolNotFoundError) 修改 `tool-registry/registry.ts`，不影響其他 fix
- 所有 REGTEST 依賴對應的 FIX 先完成

### File overlaps

| Worker | Files | Overlaps With |
|--------|-------|--------------|
| FIX-01 | `packages/tools/create-specs/index.ts` | 無 |
| FIX-02 | `packages/tool-utils/schema.ts` (新), `packages/tools/filter-logs/index.ts` | 無 |
| FIX-03 | `packages/tools/sync-memory-index/index.ts` | 無 (FIX-05 操作不同檔案: test file) |
| FIX-04 | `packages/cli/index.ts`, `packages/cli/types.ts`, `packages/tui/stdio-adapter.ts` | 無 |
| FIX-05 | `test/tools/sync-memory-index-error.test.js` | 無 (FIX-03 操作 source file) |
| FIX-06 | `packages/tool-registry/registry.ts` | 無 |

**所有 Fix Worker 的檔案集完全無重疊** → 全部可平行執行。

> **注意**：FIX-03 與 FIX-05 雖有邏輯相依（FIX-03 改 handler → FIX-05 改對應測試），但兩者操作不同檔案（source vs test），可平行執行。Regression test worker 的 verify 步驟需等待 source fix 完成。

---

## 5. Fix Details (with Regression Test Design)

### FIX-01: create-specs handler 遺漏 `args` 參數 (P0)

**Root cause**: `packages/tools/create-specs/index.ts` 第 42 行呼叫 `parseArgs({options: {...}, allowPositionals: true})` 時遺漏 `args: args` 參數。`parseArgs` 在無 `args` 時使用 `process.argv.slice(2)` 而非 tool arguments，導致所有 positional argument 永遠為空陣列。

**Files involved**: `packages/tools/create-specs/index.ts:42` → `createSpecsHandler()` (L38-158)

**Fix approach**: 在 `parseArgs()` 的 options object 中加入 `args: args`：
```typescript
const { values, positionals } = parseArgs({
  args,  // ← 加入此行
  options: { ... },
  allowPositionals: true,
});
```

**Complexity**: Simple — 單行變更

**Regression test:** REGTEST-01 (Integration → 使用既有 `test/tools/create-specs.test.js`)
- 4 個既有 failing test 即為 regression tests
- Oracle: 修正前 handler 總是回傳 1（positionals 為空陣列）；修正後正確解析 positional argument，handler 回傳 0

---

### FIX-02: 建立單一 schema 宣告機制 (P1)

**Root cause**: 18 個工具全數以三份各自維護的程式碼（`parseArgs` options 定義、手寫 help 字串 block、事後 if 驗證）實作引數處理。無統一抽象層強制將這些資訊集中在同一個 schema 宣告中。

**Files involved**: 
- `packages/tool-utils/schema.ts` (新檔案) — `ToolSchema` 型別 + `createToolRunner()` helper
- `packages/tools/filter-logs/index.ts` — 示範轉換（1 個工具）

**Fix approach**:
1. 在 `packages/tool-utils/` 下新增 `schema.ts`：
   - 定義 `ToolSchema` 型別，包含 `options`, `helpText`, `usage`, `handler`
   - 定義 `createToolRunner(schema: ToolSchema): ToolHandler` helper 函數
   - helper 內部：`parseArgs` → `--help` 自動輸出 → 呼叫 `schema.handler(values, positionals, context)`
2. 轉換 `packages/tools/filter-logs/index.ts` 為示範：
   - 定義 `schema: ToolSchema` 
   - handler 改為接收 `values` 與 `positionals`（由 `createToolRunner` 負責 arg parsing）
   - 匯出 `tool` 時將 `schema` 傳遞給 `createToolRunner`

> **後續工具轉換**：其餘 17 個工具的轉換為機械性操作，遵循相同模式。每個工具可獨立轉換，無檔案重疊，可在本批次完成後排入個別 worker。

**Complexity**: Complex — 需設計型別系統與 helper 實作

**Regression test:** REGTEST-02 (Integration → `test/tools/filter-logs.test.js`)
- 既有的 filter-logs 測試透過 `run()` 間接測試，應全部繼續通過
- GIVEN filter-logs 已轉換為 ToolSchema WHEN 執行 filter-logs handler THEN 所有既有行為不變

---

### FIX-03: sync-memory-index SystemError 分支未輸出 stack trace (P2)

**Root cause**: `packages/tools/sync-memory-index/index.ts` 第 129 行對 `SystemError` 分支輸出 `Error: ${err.message}`，與 FIX-E 統一設定的模式不符（應為 `${err.message}\n${err.stack}`）。

**Files involved**: `packages/tools/sync-memory-index/index.ts:127-129` → `syncMemoryIndexHandler()` catch block

**Fix approach**: 將 L127-L129 由：
```typescript
} else if (err instanceof SystemError) {
  stderr.write(`Error: ${err.message}\n`);
```
改為：
```typescript
} else if (err instanceof SystemError) {
  stderr.write(`${err.message}\n${err.stack}\n`);
```

**Complexity**: Simple — 單行變更

**Regression test:** REGTEST-03 (Unit → `test/tools/system-error-display.test.js`, 建立新測試)
- GIVEN sync-memory-index handler catch block WHEN 捕捉到 SystemError THEN output 包含 stack trace（至少有一行 "at "）
- Oracle: 修正前只有 "Error: message"；修正後有 "message\nSystemError: message\n at ..."

---

### FIX-04: StdioWriter 整合入生產程式碼 (P2)

**Root cause**: `StdioWriter` 與 `StdioWriterImpl` 已定義、測試、匯出一年，但沒有任何生產程式碼呼叫 `createStdioWriter()`。所有 18 個工具仍透過 `context.stdout.write()`/`context.stderr.write()` 直接輸出。

**Files involved**:
- `packages/tui/stdio-adapter.ts` — 現有實作（不需修改）
- `packages/cli/index.ts` — `run()` 建立 StdioWriter 實例
- `packages/cli/types.ts` — `CliContext` 加入 `stdioWriter?: StdioWriter`

**Fix approach**:
1. 在 `packages/cli/index.ts` 的 `run()` 中建立模組級或函數級 `StdioWriter` 實例：
   ```typescript
   import { createStdioWriter } from '@laitszkin/tui';
   const stdioWriter = createStdioWriter({ stdout, stderr, env });
   ```
2. 在 `packages/cli/types.ts` 的 `CliContext` 加入可選欄位：
   ```typescript
   import type { StdioWriter } from '@laitszkin/tui';
   
   export interface CliContext {
     // ...existing fields...
     stdioWriter?: StdioWriter;
   }
   ```
3. 將 `CliContext` 中的 `stdioWriter` 設定為已建立的實例
4. 不修改任何工具（scope 過大）— `stdioWriter` 為工具作者可選使用的基礎建設

**Complexity**: Medium — 跨 2 個檔案，需確保型別匯入正確

**Regression test:** REGTEST-04 (Integration → `test/cli/stdio-writer-context.test.js`)
- GIVEN CliContext 包含 `stdioWriter` WHEN 在工具 handler 中存取 `context.stdioWriter` THEN 型別正確，可呼叫 `info()` / `error()` 等方法

---

### FIX-05: sync-memory-index 測試補強 (P2)

**Root cause**: `test/tools/sync-memory-index-error.test.js` 透過 `run(['sync-memory-index', '--agents-file'])` 測試，依賴完整 CLI 派發鏈。`--agents-file` 的 `parseArgs` 擲回 `Error`（非 `UserInputError`），error boundary 以泛型處理，無法驗證 handler 內部的 `instanceof` 分支是否正確。

**Files involved**: `test/tools/sync-memory-index-error.test.js`

**Fix approach**:
在既有測試檔案中新增直接 handler 測試：
1. 從 `@laitszkin/tool-sync-memory-index` 匯入 `handler`
2. 建立 mock stdout/stderr stream
3. 直接呼叫 handler 並注入情境使 handler 拋出 `UserInputError` 與 `SystemError`
4. 驗證 handler 的 catch block 行為符合預期（不經過 CLI boundary 的 error boundary）

**Complexity**: Simple — 單一測試檔案修改

**Regression test:** REGTEST-05 (Unit → `test/tools/sync-memory-index-error.test.js`, 新增測試)
- GIVEN handler 被直接呼叫且業務邏輯擲出 UserInputError WHEN catch block 處理 THEN stderr 輸出 "Error: " 前綴
- GIVEN handler 被直接呼叫且業務邏輯擲出 SystemError WHEN catch block 處理 THEN stderr 輸出 message + stack

---

### FIX-06: ToolNotFoundError 啟用為 live code (P2)

**Root cause**: `ToolNotFoundError` 在 `app-error.ts` 中定義、匯出、測試，但沒有任何生產程式碼擲出或捕捉它。

**Files involved**: `packages/tool-registry/registry.ts:31-33` → `runTool()` function

**Fix approach**:
將 `packages/tool-registry/registry.ts` 第 31-33 行的直接輸出改為拋出 `ToolNotFoundError`：
```typescript
// 修改前
if (!tool) {
  stderr.write(`Unknown tool: ${toolName}\n\nAvailable tools:\n${formatToolList()}\n`);
  return 1;
}

// 修改後
if (!tool) {
  throw new ToolNotFoundError(`Unknown tool: ${toolName}`);
}
```
CLI error boundary 會攔截 `ToolNotFoundError`（它繼承自 `AppError`），自動格式化為 `Error: Unknown tool: xxx` 輸出。

注意事項：
- `formatToolList()` 的輸出會遺失，因為 error boundary 不輸出工具列表。需在 `CliContext` 或 error boundary 層處理工具列表顯示，或接受此行為變更（SPEC 無明確要求「未知工具時顯示列表」）

**Complexity**: Simple — 單行變更，但需注意行為變更：原實作會顯示工具列表，新實作只顯示錯誤訊息

**Regression test:** REGTEST-06 (Integration → `test/tools/tool-not-found-error.test.js`)
- GIVEN 呼叫 `run(['nonexistent-tool'])` WHEN 執行 THEN stderr 包含 "Error:" 前綴，exit code 為 1
- Oracle: 修正前 stderr 為 "Unknown tool: nonexistent-tool\n\nAvailable tools:\n..."；修正後為 "Error: Unknown tool: nonexistent-tool"

---

## 6. Worker Prompt Library

### Fix Worker Prompts

#### FIX-01: 修復 create-specs handler 遺漏的 `args` 參數

```
## Mission
修復 create-specs handler 的 `parseArgs()` 呼叫，補上遺漏的 `args: args` 參數。

## Context
- Review dimension: Spec implementation omission
- Spec requirement: Req 1 (Tool boilerplate)
- Severity: P0

## Input
讀取以下檔案：
- packages/tools/create-specs/index.ts（完整讀取，特別是 createSpecsHandler 函數 L38-53）
- packages/tools/filter-logs/index.ts（作為對照，參考 args 的正確傳遞方式 L22-28）

## What to do
在 packages/tools/create-specs/index.ts 第 42 行：
```typescript
const { values, positionals } = parseArgs({
```
在 `options:` 行之前加入 `args,`（或 `args: args,`）：

```typescript
const { values, positionals } = parseArgs({
  args,
  options: {
    'batch-name': { type: 'string' },
    ...
  },
  allowPositionals: true,
});
```

## Scope
- Allowed files:
  - packages/tools/create-specs/index.ts — 只修改 parseArgs 的參數物件
- Forbidden files:
  - 任何測試檔案
  - 其他工具檔案

## Output
On completion, report:
- 修改的行號與內容
- 執行 `node --test test/tools/create-specs.test.js` 的結果（4 個測試應全部通過）

## Verify
- 執行 `node --test test/tools/create-specs.test.js`
- 預期：4 個測試全部通過（修正前全部失敗）
- 執行 `npm run build` 確認 TypeScript 編譯通過

## Boundaries
- 只加一行 `args,` — 不修改任何其他邏輯
- 不修改 handler 的業務邏輯
```

#### FIX-02: 建立單一 schema 宣告機制 (ToolSchema + createToolRunner)

```
## Mission
建立單一 schema 宣告機制：定義 ToolSchema 型別與 createToolRunner helper，讓工具開發者能從一個 schema 宣告產生完整的引數解析、help 文字、與驗證邏輯。

## Context
- Review dimension: Spec implementation omission
- Spec requirement: Req 1 (Tool boilerplate) — 所有 arg 定義、help 文字、驗證邏輯必須來自同一個 schema 宣告
- Severity: P1

## Input
讀取以下檔案，理解現有工具 pattern：
- packages/tools/filter-logs/index.ts（完整讀取，作為轉換示範目標）
- packages/tools/create-specs/index.ts（參照既有 handler 模式）
- packages/tool-utils/index.ts（了解現有匯出機制）
- packages/tool-utils/app-error.ts（參考現有型別位置）

## What to do
1. 在 packages/tool-utils/schema.ts（新檔案）定義：

```typescript
import type { ToolContext } from '@laitszkin/tool-registry';

/** Option definition for parseArgs schema. */
export type SchemaOption = 
  | { type: 'string'; default?: string; short?: string }
  | { type: 'boolean'; default?: boolean; short?: string };

/**
 * Complete tool schema — single source of truth for args, help, and validation.
 * 
 * Example:
 * ```ts
 * const schema: ToolSchema = {
 *   options: {
 *     start: { type: 'string', short: 's' },
 *     end: { type: 'string', short: 'e' },
 *     help: { type: 'boolean', short: 'h' },
 *   },
 *   allowPositionals: true,
 *   usage: 'apltk filter-logs [options] [<file>...]',
 *   description: 'Filter log lines by time window.',
 *   handler: async (values, positionals, ctx) => { ... },
 * };
 * ```
 */
export interface ToolSchema {
  options: Record<string, SchemaOption>;
  allowPositionals?: boolean;
  usage?: string;
  description?: string;
  category?: string;
  handler: (
    values: Record<string, unknown>,
    positionals: string[],
    context: ToolContext,
  ) => Promise<number> | number;
}

/**
 * Creates a tool handler function from a ToolSchema declaration.
 * Automatically handles:
 *   - Argument parsing via node:util.parseArgs
 *   - --help / -h flag (auto-generates help text from options)
 *   - Strict mode validation
 */
export function createToolRunner(schema: ToolSchema) {
  return async (args: string[], context: ToolContext): Promise<number> => {
    // ...implementation...
    // 1. parseArgs with schema.options
    // 2. If values.help → auto-build help from schema, write to stdout, return 0
    // 3. Call schema.handler(values, positionals, context)
  };
}
```

2. 實作 `createToolRunner`：
   - 從 `schema.options` 建立 `parseArgs` 的 options 格式
   - 自動加入 `help: { type: 'boolean', short: 'h' }`
   - 當 `values.help === true` 時，自動組合 usage + options 表格輸出到 stdout
   - 否則呼叫 `schema.handler(values, positionals, context)`

3. 在 packages/tool-utils/index.ts 中匯出：
```typescript
export type { ToolSchema, SchemaOption } from './schema.js';
export { createToolRunner } from './schema.js';
```

4. 轉換 packages/tools/filter-logs/index.ts：
   - 定義 `schema: ToolSchema` 包含所有現有 options
   - 將 handler 改為新簽名：`async (values, positionals, context)`
   - 移除 handler 內部的 `parseArgs()` 和 `--help` 處理（由 createToolRunner 負責）
   - 在 `tool` export 中用 `createToolRunner(schema)` 包裹

## Scope
- Allowed files:
  - packages/tool-utils/schema.ts（新檔案）
  - packages/tool-utils/index.ts（新增匯出）
  - packages/tools/filter-logs/index.ts（示範轉換）
- Forbidden files:
  - 任何測試檔案
  - 其他工具檔案（本次只轉換 filter-logs）

## Output
On completion, report:
- schema.ts 的完成內容（型別定義 + createToolRunner 實作）
- filter-logs 的修改摘要
- 執行 `node --test test/tools/filter-logs.test.js` 的結果

## Verify
- 執行 `node --test test/tools/filter-logs.test.js` — 既有測試通過
- 執行 `node --test test/tui/stdio-adapter.test.js` — 確認無 side effect
- 執行 `npm run build` — TypeScript 編譯通過

## Boundaries
- 只轉換 filter-logs — 不修改其他 17 個工具
- 不改變 filter-logs 的外部行為 — 所有引數、help 文字、錯誤處理必須與修改前完全相同
- ToolSchema 的 handler 簽名為 `(values, positionals, context)`，與 `ToolDefinition.handler` 的 `(args, context)` 不同—`createToolRunner` 負責轉換
```

#### FIX-03: 修復 sync-memory-index 的 SystemError stack trace 輸出

```
## Mission
修正 sync-memory-index handler 的 SystemError 輸出，將 `${err.message}` 改為 `${err.message}\n${err.stack}`，與其他 8 個工具已統一的模式一致。

## Context
- Review dimension: Spec implementation deviation
- Spec requirement: Req 3 (Unified error handling)
- Severity: P2

## Input
- packages/tools/sync-memory-index/index.ts（完整讀取，特別是 L124-134 的 catch block）
- packages/tools/create-review-report/index.ts（作為正確的 SystemError 輸出參考，L193-194）

## What to do
在 packages/tools/sync-memory-index/index.ts 第 127-129 行：
```typescript
} else if (err instanceof SystemError) {
  stderr.write(`Error: ${err.message}\n`);
```
改為：
```typescript
} else if (err instanceof SystemError) {
  stderr.write(`${err.message}\n${err.stack}\n`);
```

## Scope
- Allowed files:
  - packages/tools/sync-memory-index/index.ts（只修改 L128-129）
- Forbidden files:
  - 任何測試檔案

## Output
On completion, report:
- 修改的行號
- 確認修改後的 catch block 完整內容

## Verify
- 執行 `node --test test/tools/system-error-display.test.js` — 確認新測試的 oracle 行為符合
- 執行 `node --test test/tools/sync-memory-index-error.test.js` — 確認同步測試通過
- 執行 `node --test test/tool-runner.test.js` — 確認無 regression

## Boundaries
- 只修改 catch block 的 SystemError 分支 — 不修改任何其他邏輯
- 不改 UserInputError 分支（維持 `Error: ` 前綴）
```

#### FIX-04: StdioWriter 整合入生產程式碼

```
## Mission
將 StdioWriter 整合入 cli/index.ts 的 run() 與 CliContext 型別，使工具作者可選用結構化輸出功能。

## Context
- Review dimension: Spec implementation omission
- Spec requirement: Req 2 (Cross-platform abstraction)
- Severity: P2

## Input
讀取以下檔案：
- packages/tui/stdio-adapter.ts（完整讀取，了解 StdioWriter 介面）
- packages/tui/types.ts（了解 StdioWriter 型別定義）
- packages/tui/index.ts（了解匯出方式）
- packages/cli/index.ts（完整讀取 run() 函數）
- packages/cli/types.ts（了解 CliContext 型別）

## What to do
1. 在 packages/cli/index.ts 中：
   a. 在現有 import 區塊加入：`import { createStdioWriter } from '@laitszkin/tui';`
   b. 在 run() 內建立 StdioWriter 實例（在 stderr/stdout 變數初始化之後）：
   ```typescript
   import type { StdioWriter } from '@laitszkin/tui';
   // ...inside run()...
   const stdioWriter: StdioWriter = createStdioWriter({ stdout, stderr, env });
   ```

2. 在 packages/cli/types.ts 中：
   a. 在 import 區塊加入：`import type { StdioWriter } from '@laitszkin/tui';`
   b. 在 CliContext 介面加入可選欄位：
   ```typescript
   export interface CliContext {
     // ...existing fields...
     stdioWriter?: StdioWriter;
   }
   ```

3. 在 packages/cli/index.ts 的 run() 中，將 `stdioWriter` 傳入調用工具 handler 的 CliContext 物件。

## Scope
- Allowed files:
  - packages/cli/types.ts（CliContext 加入 StdioWriter）
  - packages/cli/index.ts（建立實例並注入 CliContext）
- Forbidden files:
  - 任何工具檔案（tools/*）
  - packages/tui/stdio-adapter.ts（不需修改）

## Output
On completion, report:
- cli/types.ts 的修改內容
- cli/index.ts 的修改位置與內容
- 確認 CliContext 的 stdioWriter 欄位正確傳遞至 runTool

## Verify
- 執行 `npm run build` — TypeScript 編譯通過
- 執行 `node --test test/cli/error-boundary.test.js` — error boundary 測試通過
- 執行 `node --test test/tui/stdio-adapter.test.js` — StdioWriter 測試通過

## Boundaries
- 不要修改任何工具檔案
- 不要修改 tools/ 下的任何 handler
- `stdioWriter` 是可選欄位 — 既有工具不須使用
```

#### FIX-05: sync-memory-index 直接 handler 測試補強

```
## Mission
在 sync-memory-index 錯誤處理測試中補強直接 handler 測試，驗證 handler catch block 的 instanceof 分支行為。

## Context
- Review dimension: Test coverage gap
- Spec requirement: Req 3 (Unified error handling)
- Severity: P2

## Input
讀取以下檔案：
- test/tools/sync-memory-index-error.test.js（完整讀取，理解既有測試）
- packages/tools/sync-memory-index/index.ts（特別是 catch block L124-134）
- test/tools/system-error-display.test.js（作為 mock handler 測試的參考）
- test/tools/validation-error-handling.test.js（作為直接 handler 測試的參考）

## What to do
在 test/tools/sync-memory-index-error.test.js 中新增 2 個測試：

1. UserInputError 分支測試：
   - 建立一個模擬情境，讓 syncMemoryIndexHandler 的業務邏輯擲出 UserInputError
   - 方法：傳入無效的 --agents-file 路徑（或利用 mock 方式使 handler 進入 catch）
   - 驗證：stderr 輸出包含 "Error:" 前綴

2. SystemError 分支測試（確認 stack trace 存在）：
   - 建立模擬情境使 handler 進入 SystemError 分支
   - 方法：可透過 import handler 直接呼叫，或利用 file system 權限錯誤
   - 驗證：stderr 輸出包含 stack trace（"at " 字串）

參考 test/tools/validation-error-handling.test.js 直接測試 handler 的模式（從 tool module 匯入 handler，直接呼叫 handler 而非透過 run()）：

```javascript
import { tool as syncMemoryIndexTool } from '@laitszkin/tool-sync-memory-index';
const syncMemoryIndexHandler = syncMemoryIndexTool.handler;

// 直接呼叫 handler
const code = await syncMemoryIndexHandler(args, { stdout, stderr });
assert.equal(code, 1);
```

## Scope
- Allowed files:
  - test/tools/sync-memory-index-error.test.js（新增測試）
- Forbidden files:
  - 任何生產程式碼檔案

## Output
On completion, report:
- 新增的測試名稱與內容
- 測試執行結果（全部通過）

## Verify
- 執行 `node --test test/tools/sync-memory-index-error.test.js`
- 確認所有既有測試 + 新測試通過

## Boundaries
- 不要修改 packages/tools/sync-memory-index/index.ts（由 FIX-03 負責）
- 測試必須獨立執行，不依賴外部狀態
```

#### FIX-06: 啟用 ToolNotFoundError 為 live code

```
## Mission
在 tool-registry 的 runTool() 中使用 ToolNotFoundError，使其從 dead code 變成 live code。

## Context
- Review dimension: Redundant code
- Spec requirement: Req 3 (Error hierarchy)
- Severity: P2

## Input
讀取以下檔案：
- packages/tool-registry/registry.ts（完整讀取，特別是 runTool 函數 L22-40）
- packages/tool-utils/app-error.ts（了解 ToolNotFoundError 介面）
- packages/cli/index.ts L479-490（了解 error boundary 如何處理 AppError 子類別）

## What to do
1. 在 packages/tool-registry/registry.ts 的 import 區塊加入：
```typescript
import { ToolNotFoundError } from '@laitszkin/tool-utils';
```

2. 將 L31-33 的：
```typescript
if (!tool) {
  stderr.write(`Unknown tool: ${toolName}\n\nAvailable tools:\n${formatToolList()}\n`);
  return 1;
}
```
改為：
```typescript
if (!tool) {
  throw new ToolNotFoundError(`Unknown tool: ${toolName}`);
}
```

> 注意：此變更會改變「未知工具」的行為。原實作會輸出工具列表，新實作只輸出錯誤訊息（CLI error boundary 以 `Error: Unknown tool: xxx` 格式化）。

## Scope
- Allowed files:
  - packages/tool-registry/registry.ts（修改 import 與 runTool）
- Forbidden files:
  - 任何測試檔案
  - packages/cli/index.ts（error boundary 不須修改 — AppError 分支已存在）

## Output
On completion, report:
- 修改的檔案與行號
- 修改後的 runTool 函數相關段落

## Verify
- 執行 `node --test test/utils/app-error.test.js` — ToolNotFoundError 測試仍通過
- 執行 `node --test test/tool-runner.test.js` — runTool 相關測試通過
- 驗證：執行 `node dist/bin/apollo-toolkit.js nonexistent-tool` 應輸出 "Error: Unknown tool: nonexistent-tool" 至 stderr 且 exit code 為 1

## Boundaries
- 不修改 CLI error boundary（已正確處理 AppError 階層）
- 不修改 formatToolList() — 放棄工具列表輸出是接受的行為變更（SPEC 未強制要求）
- 如果既有測試依賴舊的行為（stderr 包含 "Available tools:"），需要更新測試
```

---

### Regression Test Worker Prompts

#### REGTEST-01: create-specs handler 引數解析回歸測試 (FIX-01)

```
## Mission
建立 create-specs handler 的引數解析回歸測試，確保 `args` 參數被正確傳遞給 `parseArgs`。

## Context
- Fix summary: create-specs handler 在 parseArgs 呼叫中補上遺漏的 `args: args`
- Root cause: parseArgs 無 args 參數時預設讀取 process.argv，導致所有 positional argument 為空
- Fix files: packages/tools/create-specs/index.ts

## Input
讀取以下檔案：
- packages/tools/create-specs/index.ts（了解 handler 的 parseArgs 呼叫）
- test/tools/create-specs.test.js（完整讀取，既有 4 個測試）

## What to do
既有 test/tools/create-specs.test.js 中的 4 個測試即為 REGTEST-01 的全部內容。
不需新增測試檔案或修改既有測試。

確認：修正前這 4 個測試全部失敗；修正後全部通過。

## Scope
- 無需修改任何檔案 — 確認既有 4 個測試通過即為回歸驗證

## Verify
- 執行：`node --test test/tools/create-specs.test.js`
- 預期：4 個測試全部通過（修正前全部 failure）
```

#### REGTEST-02: filter-logs schema 轉換回歸測試 (FIX-02)

```
## Mission
確認 filter-logs 在轉換為 ToolSchema 後行為不變，所有既有測試通過。

## Context
- Fix summary: filter-logs 從自含 parseArgs 改為使用 ToolSchema + createToolRunner
- Root cause: 無—此為架構變更，行為必須維持一致
- Fix files: packages/tools/filter-logs/index.ts, packages/tool-utils/schema.ts

## Input
- test/tools/filter-logs.test.js（完整讀取，理解既有測試）
- packages/tools/filter-logs/index.ts（理解轉換後的 handler）

## What to do
執行既有 filter-logs 測試確認全部通過。不需新增測試。

如果既有測試因 schema 轉換而失敗（例如 help text 輸出格式變更），請調整 createToolRunner 的 help 輸出格式以匹配原有的 help 文字格式。

## Scope
- 無需修改測試檔案
- 如果 need，可調整 packages/tool-utils/schema.ts 的 help 輸出格式

## Verify
- 執行：`node --test test/tools/filter-logs.test.js`
- 預期：所有 filter-logs 測試通過
- 手動驗證：`node dist/bin/apollo-toolkit.js filter-logs --help` 輸出與轉換前一致
```

#### REGTEST-03: SystemError stack trace 輸出回歸測試 (FIX-03)

```
## Mission
建立測試驗證 sync-memory-index 的 SystemError catch 分支正確輸出 stack trace。

## Context
- Fix summary: sync-memory-index 的 SystemError 分支從 `Error: ${err.message}` 改為 `${err.message}\n${err.stack}`
- Root cause: 與其他 8 個工具的統一 pattern 不一致
- Fix files: packages/tools/sync-memory-index/index.ts

## Input
- packages/tools/sync-memory-index/index.ts（了解 catch block）
- test/tools/system-error-display.test.js（作為測試 pattern 參考）

## What to do
在 test/tools/system-error-display.test.js 中新增測試（或新檔案 test/tools/sync-memory-index-system-error.test.js）：

1. 從 `@laitszkin/tool-sync-memory-index` 匯入 handler
2. 建立 mock stdout/stderr
3. 注入一個使 handler 拋出 SystemError 的條件（如不可寫的檔案路徑）
4. 驗證：
   - stderr 包含 stack trace（至少有一行 "at "）
   - stderr 包含 "SystemError:"（stack 的第一行包含類別名稱）

```javascript
test('sync-memory-index: SystemError outputs stack trace', async () => {
  const stdout = createMemoryStream();
  const stderr = createMemoryStream();
  // 使用一個會觸發 SystemError 的條件（如不可寫的路徑）
  const code = await syncMemoryIndexHandler(
    ['--agents-file', '/nonexistent/deep/path/AGENTS.md'],
    { stdout, stderr },
  );
  assert.equal(code, 1);
  const output = stderr.toString();
  assert.ok(output.includes('SystemError:'), 'stderr should contain SystemError: with stack');
  assert.ok(output.includes('at '), 'stderr should contain stack trace');
});
```

## Scope
- Allowed files:
  - test/tools/system-error-display.test.js 或新檔案 test/tools/sync-memory-index-system-error.test.js

## Verify
- 執行新測試：`node --test test/tools/sync-memory-index-system-error.test.js`
- Oracle: 修正前測試失敗（stderr 不含 stack）；修正後測試通過
```

#### REGTEST-04: CliContext StdioWriter 回歸測試 (FIX-04)

```
## Mission
建立測試驗證 CliContext 中 stdioWriter 欄位的存在性與型別正確性。

## Context
- Fix summary: CliContext 加入可選的 `stdioWriter?: StdioWriter` 欄位，cli/index.ts 建立實例並注入
- Root cause: StdioWriter 已定義但未被生產程式碼使用
- Fix files: packages/cli/types.ts, packages/cli/index.ts

## Input
- packages/cli/types.ts（CliContext 介面）
- packages/cli/index.ts（run() 中的 StdioWriter 建立與注入）
- test/cli/error-boundary.test.js（作為 context 注入測試的參考）

## What to do
在 test/cli/stdio-writer-context.test.js（新檔案）建立測試：

1. StdioWriter 存在性測試：
   - 呼叫 `run(['filter-logs', '--help'])` 並注入包含自訂 stdout/stderr 的 context
   - 驗證 handler 收到的 context.stdioWriter 為物件且包含 info/error/warn 方法

2. 或透過型別檢查：
```javascript
import { createStdioWriter } from '@laitszkin/tui';

test('run() creates and injects StdioWriter into CliContext', async () => {
  const stdout = createMemoryStream();
  const stderr = createMemoryStream();
  const result = await run(['filter-logs', '--help'], {
    sourceRoot: PROJECT_ROOT,
    stdout,
    stderr,
    env: {},
    runTool: async (toolName, args, ctx) => {
      // 驗證 ctx.stdioWriter 存在且為物件
      assert.ok(ctx.stdioWriter, 'context.stdioWriter should exist');
      assert.equal(typeof ctx.stdioWriter.info, 'function');
      assert.equal(typeof ctx.stdioWriter.error, 'function');
      assert.equal(typeof ctx.stdioWriter.warn, 'function');
      return 0;
    },
  });
});
```

## Scope
- Allowed files:
  - test/cli/stdio-writer-context.test.js（新檔案）

## Verify
- 執行：`node --test test/cli/stdio-writer-context.test.js`
- 預期：測試通過
- Oracle: 修正前 context.stdioWriter 為 undefined；修正後為 StdioWriter 實例
```

#### REGTEST-05: sync-memory-index 直接 handler 測試 (FIX-05)

```
## Mission
在 sync-memory-index 錯誤處理測試中加入直接 handler（而非透過 run()）的測試案例。

## Context
- Fix summary: 新增直接 handler 測試，驗證 handler catch block 的 instanceof 分支
- Root cause: 既有測試依賴 run()，無法驗證 handler 內部的 catch block
- Fix files: test/tools/sync-memory-index-error.test.js

## Input
- test/tools/sync-memory-index-error.test.js（既有測試）
- packages/tools/sync-memory-index/index.ts（handler catch block）
- test/tools/validation-error-handling.test.js（作為直接 handler 測試的參考）

## What to do
在 test/tools/sync-memory-index-error.test.js 中新增測試：

1. 匯入直接 handler：
```javascript
import { tool as syncMemoryIndexTool } from '@laitszkin/tool-sync-memory-index';
const syncMemoryIndexHandler = syncMemoryIndexTool.handler;
```

2. UserInputError 分支測試：
```javascript
test('sync-memory-index direct handler: UserInputError displays Error: prefix', async () => {
  const stdout = createMemoryStream();
  const stderr = createMemoryStream();
  // --agents-file without value triggers parseArgs error → generic Error
  // (handled by CLI boundary, not handler's catch block)
  // Instead, trigger a business logic UserInputError directly:
  const code = await syncMemoryIndexHandler(
    ['--agents-file', '/tmp/nonexistent/path/AGENTS.md'],
    { stdout, stderr },
  );
  assert.equal(code, 1);
  const output = stderr.toString();
  assert.ok(output.includes('Error:'), 'handler should output "Error:" prefix for errors');
});
```

## Scope
- Allowed files:
  - test/tools/sync-memory-index-error.test.js（新增測試）
- Forbidden files:
  - 任何生產程式碼

## Verify
- 執行：`node --test test/tools/sync-memory-index-error.test.js`
- 預期：所有測試通過
```

#### REGTEST-06: ToolNotFoundError 回歸測試 (FIX-06)

```
## Mission
建立測試驗證 ToolNotFoundError 的正確拋出與 CLI error boundary 的格式化行為。

## Context
- Fix summary: runTool() 改為拋出 ToolNotFoundError 而非直接輸出 stderr + return 1
- Root cause: ToolNotFoundError 從未被生產程式碼擲出
- Fix files: packages/tool-registry/registry.ts

## Input
- packages/tool-registry/registry.ts（了解修改後的 runTool）
- packages/tool-utils/app-error.ts（了解 ToolNotFoundError）
- test/cli/error-boundary.test.js（作為 mock stream 與 run() 測試的參考）

## What to do
在 test/tools/tool-not-found-error.test.js（新檔案）建立測試：

1. 透過 run() 呼叫不存在的工具名稱：
```javascript
test('run: nonexistent tool triggers ToolNotFoundError via error boundary', async () => {
  const stdout = createMemoryStream();
  const stderr = createMemoryStream();
  const result = await run(['nonexistent-tool'], {
    sourceRoot: PROJECT_ROOT,
    stdout,
    stderr,
    env: {},
  });
  assert.equal(result, 1);
  const err = stderr.toString();
  assert.ok(err.includes('Error:'), 'stderr should contain "Error:" prefix');
  assert.ok(err.includes('Unknown tool: nonexistent-tool'), 'stderr should identify the unknown tool');
});
```

2. 如果既有 test/tool-runner.test.js 中有測試依賴舊的 "Available tools:" 輸出格式，需更新那些測試。

## Scope
- Allowed files:
  - test/tools/tool-not-found-error.test.js（新檔案）
  - test/tool-runner.test.js（如有需要，更新依賴舊格式的既有測試）

## Verify
- 執行：`node --test test/tools/tool-not-found-error.test.js`
- 執行：`node --test test/tool-runner.test.js` — 確認既有測試通過或已被正確更新
```

---

## 7. Fix Batch Schedule

### Batch 1 — 所有修復（平行，無檔案重疊）

- **Issues**: FIX-01, FIX-02, FIX-03, FIX-04, FIX-05, FIX-06
- **Strategy**: 6 個 worker 平行執行（各自完全獨立的檔案集）
- **Depends on**: 無
- **Remark**: FIX-03 與 FIX-05 雖有邏輯相依，但操作不同檔案，可平行執行。FIX-05 的 verify 步驟需在 FIX-03 完成後執行。
- **Gate**:
  - [ ] FIX-01 worker 報告成功
  - [ ] FIX-02 worker 報告成功
  - [ ] FIX-03 worker 報告成功
  - [ ] FIX-04 worker 報告成功
  - [ ] FIX-06 worker 報告成功
  - [ ] FIX-05 worker 報告成功（需在 FIX-03 通過後驗證）
  - [ ] 執行驗證：`npm run build && npm test`

---

### Batch 2 — Regression Test 實作

- **Tasks**: REGTEST-01, REGTEST-02, REGTEST-03, REGTEST-04, REGTEST-05, REGTEST-06
- **Strategy**: 6 個 worker 平行執行（各自獨立的測試檔案）
  - REGTEST-01: 既有 test/tools/create-specs.test.js（不需修改，確認通過即可）
  - REGTEST-02: 既有 test/tools/filter-logs.test.js（不需修改，確認通過即可）
  - REGTEST-03: 新檔案或既有 test/tools/system-error-display.test.js
  - REGTEST-04: 新檔案 test/cli/stdio-writer-context.test.js
  - REGTEST-05: 既有 test/tools/sync-memory-index-error.test.js
  - REGTEST-06: 新檔案 test/tools/tool-not-found-error.test.js + 更新 test/tool-runner.test.js
- **Depends on**: Batch 1
- **Gate**:
  - [ ] All REGTEST workers report success
  - [ ] 所有新測試通過
  - [ ] 既有測試套件無 regression

---

### Batch 3 — 最終整合

- **Tasks**: 完整測試套件、跨比對 REPORT.md
- **Strategy**: Coordinator 直接處理
- **Depends on**: Batch 2
- **Gate**:
  - [ ] 完整測試套件通過：`npm run build && npm test`
  - [ ] 涵蓋率門檻：`npm run test:coverage`
  - [ ] 逐一對照 REPORT.md 的 6 項發現，確認每項已被解決

---

## 8. Regression Test Inventory

- REGTEST-01 → FIX-01: [Integration] `test/tools/create-specs.test.js` — 4 個既有測試驗證 create-specs handler 正確解析 positional argument
- REGTEST-02 → FIX-02: [Integration] `test/tools/filter-logs.test.js` — 既有測試驗證 filter-logs 在 ToolSchema 轉換後行為不變
- REGTEST-03 → FIX-03: [Unit] `test/tools/sync-memory-index-system-error.test.js`（新）— 驗證 SystemError 分支輸出 stack trace
- REGTEST-04 → FIX-04: [Integration] `test/cli/stdio-writer-context.test.js`（新）— 驗證 CliContext.stdioWriter 存在
- REGTEST-05 → FIX-05: [Unit] `test/tools/sync-memory-index-error.test.js` — 新增直接 handler 測試驗證 catch block
- REGTEST-06 → FIX-06: [Integration] `test/tools/tool-not-found-error.test.js`（新）— 驗證 ToolNotFoundError 被正確拋出

---

## 9. Verification Checkpoints

### Checkpoint 1 — After all fix batches complete (before regression tests)
- Run: `npm run build && npm test`
- Expected: Build succeeds, all existing tests pass, no regressions
- Special attention: 注意 create-specs 測試（REGTEST-01）— 修正前 4 個 failure，修正後應全部通過

### Checkpoint 2 — After regression tests are implemented
- Run: `node --test test/tools/create-specs.test.js test/tools/filter-logs.test.js test/cli/stdio-writer-context.test.js test/tools/sync-memory-index-error.test.js test/tools/tool-not-found-error.test.js test/tools/system-error-display.test.js`
- Expected: All new regression tests pass, confirming each fix is effective
- Logical check: Each REGTEST oracle must be "fails on unfixed code, passes after fix" — confirm by inspecting test logic

### Checkpoint 3 — Final verification
- Run full test suite: `npm run build && npm test`
- Run coverage: `npm run test:coverage`
- Cross-check REPORT.md: every issue resolved

---

## 10. Error Recovery

- **If a fix worker fails**: Retry with the worker's existing context (do not create a new one), giving more specific guidance. At most one retry.
- **If a fix worker fails twice**: Pause the entire flow. Preserve successful results from other workers in the same batch. Report to the user.
- **If a regression test worker reports failure (test cannot pass)**: Check whether the test code is wrong or the fix is incomplete. If the test code is wrong, continue the worker to fix it. If the fix is incomplete, go back to the corresponding fix worker.
- **If a regression test passes on the unfixed code**: The test design is invalid — redesign the oracle and dispatch a new worker.
- **If merge conflicts occur**: The coordinator resolves the conflict, then re-runs the batch gate verification.
- **If a fix or regression test breaks existing tests**: Pause. Report which test failed and which worker's change caused it.
- **TypeScript build errors**: Always fix build errors first — `npm run build` must pass before any test verification.

---

## 11. Fix History

### Round 1 — 2026-06-04 — Fix coordinator: QA skill

- **Issues fixed**: 16 of 23 (P0: 0, P1: 4, P2: 13, P3: 6 → 16 fixed, 1 unfixed, 7 deferred)
- **Fixes applied**: PlatformAdapter consumption, AppError integration (3 tools), parser UserInputError, dispatch table, CI config, 8-tool catch instanceof, error boundary tests, type dedup, filter-logs --help, parser-utils.ts, validate tool dead code removal
- **Unfixed**: StdioWriter integration (FIX-05 → deferred to Round 2)
- **Deferred**: Single schema (P1), tool-level help (P2), coverage exclude (P2), package tests (P2), ToolNotFoundError (P3), toolsHelp dependency (P3), dist/ import convention (P3)

### Round 2 — 2026-06-04

- **Issues fixed**: (current round — to be filled after execution)
- **Outcome**: TBD
- **Key notes**: Round 2 addresses the 6 residual issues (1 P0, 1 P1, 4 P2) found in the second review round, including the deferred single-schema architecture and StdioWriter integration.

---

## 12. Boundaries

### ALWAYS

- Run gate verification immediately after every batch
- Extract worker prompts verbatim from Section 6 — do not rewrite them
- After a worker reports, digest the results before deciding next steps
- Fixes must not conflict with the original spec requirements
- Regression tests must not start before all fix batches pass
- Resolve merge conflicts yourself — the coordinator handles them. This is coordination, not implementation.
- **For fixes marked as Complex**: ensure the worker performs systematic debugging before applying the fix
- Run `npm run build` after every batch to catch TypeScript errors early
- **File overlap is the hard gate**: never parallel workers that modify the same file, even if logically independent
- FIX-03 (handler fix) and FIX-05 (test fix) modify different files (source vs test) but are logically dependent. Verify FIX-03 first before confirming FIX-05 passes.

### ASK FIRST — pause and confirm with the user

- Fix approach conflicts with spec design intent
- Need to add a new external dependency
- Worker has failed twice
- Test regression cannot be quickly diagnosed
- If FIX-02 (ToolSchema) requires changes to ToolDefinition type in tool-registry (affects all tool consumers)
- If FIX-06 (ToolNotFoundError) changes cause cascading test failures — the behavior change from "Available tools:" to bare error may break multiple tests

### NEVER

- Write implementation logic or modify source code beyond resolving merge conflict markers
- Let workers spawn sub-workers
- Skip verification and proceed to the next batch
- Modify spec documents (unless the fix reveals a spec error — report it instead)
- Start regression tests before all fixes are verified
- **Defer any REPORT.md issue to a future round** — every issue has a complete fix plan in this FIX.md
- Modify the `eval` tool or `codegraph` tool (out of spec scope)
