# Fix Coordinator Prompt: CLI 工具全面重構 — Round 5

- **Date**: 2026-06-04
- **Source REPORT**: `docs/plans/2026-06-04/cli-refactor/REPORT.md`
- **Source Spec**: `docs/plans/2026-06-04/cli-refactor/`
- **Total Issues**: P0: 0, P1: 0, P2: 4, P3: 4
- **Total Regression Tests**: 2

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

修復 CLI refactoring Round 5 審查中發現的 8 項問題（4 P2 + 4 P3）。核心目標：

1. **review-threads `_rawArgs` 繞道遷移至 Schema `multiple: true`** — 消除唯一殘留的模組層級 mutable state
2. **修復 codegraph SystemError MODULE_NOT_FOUND 偵測回歸** — 改用 `details.code` 而非已覆蓋的 `code`
3. **改善 PlatformAdapter 委派** — `resolveHomeDirectory()` 與 `sync-memory-index` 改走 adapter
4. **Coverage scope 擴充至 Group 2** — 讓 package tests 也受涵蓋率門檻追蹤
5. **所有 P3 建議事項納入處理** — helpTopic 型別縮窄、test dist/ imports 遷移、test 重疊清理

共 7 個 Fix Workers（無檔案重疊）、2 個 Regression Test Workers。

**Success looks like**: 所有 8 項 REPORT.md issue 已修復或處理完畢，2 個 regression tests 通過，完整 test suite 通過，無回歸。

---

## 3. Issue Inventory

**P2 (4)**:

- **FIX-A** (P2, 簡單, 實作缺漏): review-threads `_rawArgs` 繞道未遷移至 Schema `multiple: true` — `packages/tools/review-threads/index.ts`
- **FIX-B** (P2, 簡單, 規格偏離): codegraph SystemError `code` 屬性判斷回歸 — `packages/tools/codegraph/index.ts`
- **FIX-C** (P2, 簡單, 實作缺漏): `resolveHomeDirectory()` 未委派給 adapter、sync-memory-index 直接使用 `process.env.HOME` — `packages/cli/installer.ts`, `packages/tools/sync-memory-index/index.ts`
- **FIX-D** (P2, 簡單, 架構瑕疵): Coverage scope 未擴充至 Group 2 — `scripts/test.sh`

**P3 (4)**:

- **FIX-E** (P3, 簡單, 實作缺漏): `helpTopic` 型別未縮窄 — `packages/cli/types.ts`
- **FIX-F** (P3, 簡單, 建構瑕疵): 測試匯入使用 `dist/` 路徑 — `test/cli/install-args-parser.test.js`, `test/cli/tool-args-parser.test.js`, `test/cli/uninstall-args-parser.test.js`, `test/cli/help-text-builder.test.js`
- **FIX-G** (P3, 簡單, 冗余程式碼): `cli-parsing.test.js` 與 `dispatch-table.test.js` 測試重疊 — `test/cli-parsing.test.js`

---

## 4. Fix Dependency Analysis

### Dependencies

- **邏輯相依性**：無。所有 fix 彼此獨立，無前後依賴關係。
- **檔案重疊**：所有 fix 的檔案集合完全不相交。以下為核對結果：

| Worker | Files | Overlaps With |
|--------|-------|--------------|
| FIX-A | `packages/tools/review-threads/index.ts` | 無 |
| FIX-B | `packages/tools/codegraph/index.ts` | 無 |
| FIX-C | `packages/cli/installer.ts`, `packages/tools/sync-memory-index/index.ts` | 無（clipper/types.ts 不同檔） |
| FIX-D | `scripts/test.sh` | 無 |
| FIX-E | `packages/cli/types.ts` | 無 |
| FIX-F | `test/cli/install-args-parser.test.js`, `tool-args-parser.test.js`, `uninstall-args-parser.test.js`, `help-text-builder.test.js` | 無 |
| FIX-G | `test/cli-parsing.test.js` | 無 |

**結論**：全部 7 個 fix worker 可在同一批次中平行執行。

### Regression test dependencies

- REGTEST-01 (codegraph) 依賴 FIX-B 先完成
- REGTEST-02 (PlatformAdapter) 依賴 FIX-C 先完成

---

## 5. Fix Details (with Regression Test Design)

### FIX-A: review-threads `_rawArgs` 繞道遷移至 Schema `multiple: true` (P2 + P3)

**Root cause**: review-threads 在建立時 SchemaOption 尚未支援 `multiple` 屬性，因此使用模組層級 `_rawArgs` 變數繞道重新解析 `--thread-id`。FIX-09 (Round 4) 已在 `SchemaOption` 型別中加入 `multiple?: boolean` 支援且 find-github-issues 已遷移，但 review-threads 被遺漏。L68 的過時註解現具誤導性。

**Files involved**: `packages/tools/review-threads/index.ts`
- `let _rawArgs: string[] = []` (L67-69) — 模組變數宣告
- `_rawArgs = args` 賦值 (L578) — tool handler entry
- `parseArgs` 重新解析 (L532-538) — handler 主體
- 過時註解 (L67-68) — 需更新

**Fix approach**:
1. 在 schema 的 `'thread-id'` 選項中加入 `multiple: true`：`'thread-id': { type: 'string' as const, multiple: true }`
2. 移除 `_rawArgs` 變數宣告 (L67-69) 及上方相關註解
3. 移除 handler 主體中的 `parseArgs` 重新解析區塊 (L532-538)，改為使用 `values['thread-id']`
4. 將 handler 中的 `const threadId = (parsed['thread-id'] as string[]) ?? []` 改為 `const threadId = (values['thread-id'] as string[]) ?? []`
5. 移除 tool entry 中的 `_rawArgs = args` 賦值 (L578)
6. 若 `parseArgs` 在檔案中無其他使用，從 import 行移除 `parseArgs`
7. 更新 L67-68 的過時註解或移除

**注意**：此 fix 僅移除繞道邏輯，不改寫 `--thread-id` 的行為。執行期行為完全相同。

**Complexity**: 簡單

**Regression test**: 無需獨立 regtest。`parseArgs` 的 `multiple` 行為已在 `test/tools/schema-multiple-args.test.js` 涵蓋。此 fix 僅移除繞道，行為一致。現有 test suite 通過即可驗證。

---

### FIX-B: codegraph SystemError MODULE_NOT_FOUND 偵測回歸 (P2)

**Root cause**: `SystemError` 建構子固定 `code = 'SYSTEM_ERROR'`（見 `app-error.ts:68`）。兩個 catch 區塊（L44-47, L145-148）將原始 error 包裝為 `new SystemError(error.message, { code: (error as any).code })`，原始錯誤的 `.code`（如 `'MODULE_NOT_FOUND'`）被存放在 `details` 而非 `code`。但後續檢查 `(sysError as any).code === 'MODULE_NOT_FOUND'` 永遠為 false（實際為 `'SYSTEM_ERROR'`）。

此錯誤被 `.message.includes('Cannot find module')` 後備條件遮蓋，但原本正確的 `error.code` 直接偵測已失效。

**Files involved**: `packages/tools/codegraph/index.ts`
- Catch 區塊 A (L44-47): `if ((sysError as any).code === 'MODULE_NOT_FOUND' || ...)`
- Catch 區塊 B (L145-148): 相同的條件

**Fix approach**: 在兩個 catch 區塊中，將：
```ts
if ((sysError as any).code === 'MODULE_NOT_FOUND' || (sysError.message && sysError.message.includes('Cannot find module'))) {
```
改為：
```ts
if ((sysError.details?.code as string) === 'MODULE_NOT_FOUND' || (sysError.message && sysError.message.includes('Cannot find module'))) {
```
這會正確讀取儲存在 `details.code` 的原始錯誤碼。

**Complexity**: 簡單（同一檔案兩行變更）

**Regression test: REGTEST-01** (Unit → `test/tools/codegraph-error-detection.test.js`)
- Test 1: GIVEN `new SystemError('msg', { code: 'MODULE_NOT_FOUND' })` WHEN check `details.code` THEN equals `'MODULE_NOT_FOUND'`
- Test 2: GIVEN `new SystemError('msg')` WHEN check `details?.code` THEN `undefined`
- Oracle: before fix, `sysError.code` returns `'SYSTEM_ERROR'`; after fix, `sysError.details.code` returns `'MODULE_NOT_FOUND'`

---

### FIX-C: PlatformAdapter 委派 — `resolveHomeDirectory` + `sync-memory-index` (P2)

**Root cause**: 兩個平台相關的家目錄解析點未使用 PlatformAdapter：
1. `installer.ts:27-29` 的 `resolveHomeDirectory()` 是獨立函數，直接使用 `env.HOME || env.USERPROFILE || os.homedir()`，未委派給 `adapter.homeDir()`
2. `sync-memory-index/index.ts:106` 直接使用 `process.env.HOME || ''`，完全無 Windows 後備

**Files involved**:
- `packages/cli/installer.ts` — `resolveHomeDirectory()` 函數 (L27-29)，已匯入 `createPlatformAdapter` (L2)
- `packages/tools/sync-memory-index/index.ts` — L106 的 `process.env.HOME` 使用

**Fix approach**:

**installer.ts `resolveHomeDirectory()`**:
將：
```ts
export function resolveHomeDirectory(env: NodeJS.ProcessEnv = process.env): string {
  return env.HOME || env.USERPROFILE || os.homedir();
}
```
改為委派給 adapter：
```ts
export function resolveHomeDirectory(env: NodeJS.ProcessEnv = process.env): string {
  const adapter = createPlatformAdapter();
  return adapter.homeDir();
}
```

注意：此變更會改變行為—新版本忽略傳入的 `env` 參數，直接讀取 `process.env`。需確認所有呼叫者是否依賴 `env` 注入（用於測試覆寫環境變數）。

**替代方案**（保留 `env` 參數）：
```ts
export function resolveHomeDirectory(env: NodeJS.ProcessEnv = process.env): string {
  const home = env.USERPROFILE || env.HOME || os.homedir();
  return home;
}
```
但這樣就喪失了委派的意義。**建議**保持簡潔且直接使用 adapter，因為 `resolveHomeDirectory` 的呼叫者多數不傳入 `env`（預設使用 `process.env`）。測試可以透過 mock `process.env` 來覆蓋。

**sync-memory-index **:
將 L106：
```ts
const homeDir = process.env.HOME || '';
```
改為使用 `os.homedir()` 或透過 `createPlatformAdapter().homeDir()`：
```ts
import { createPlatformAdapter } from '@laitszkin/tool-utils';
// ...
const adapter = createPlatformAdapter();
const homeDir = adapter.homeDir();
```
但注意 `sync-memory-index` 目前使用 `homeDir = ''` 做為字串兜底，而 `adapter.homeDir()` 永不傳回空字串（最後會 fallback 到 `os.homedir()`）。行為略有不同。若需保留空字串兜底行為，可改為：
```ts
const homeDir = process.env.HOME || process.env.USERPROFILE || '';
```

**建議**：由於 `sync-memory-index` 已使用 `createToolRunner` 包裝，且目前無 PlatformAdapter 匯入，直接改用 `os.homedir()` 簡化：
```ts
import { homedir } from 'node:os';
// ...
const homeDir = homedir() || '';
```

**Complexity**: 簡單（機械變更）

**Regression test: REGTEST-02** (Unit → `test/utils/platform-adapter.test.js` 擴充)
- 在現有 platform-adapter.test.js 中新增測試案例：
  - GIVEN `WindowsAdapter` WHEN `homeDir()` with `USERPROFILE` set THEN returns `USERPROFILE` value
  - GIVEN `PosixAdapter` WHEN `homeDir()` with `HOME` set THEN returns `HOME` value
- oracle 為平台特定的優先順序（Windows: USERPROFILE > HOME；POSIX: HOME > USERPROFILE）

---

### FIX-D: Coverage scope 擴充至 Group 2 (P2)

**Root cause**: `scripts/test.sh` 的 Group 2 命令（L35-36）為 `node --test $PACKAGE_TEST_FILES`，未包含 `$GROUP1_FLAGS`，因此 package tests 不受涵蓋率門檻監督。

**Files involved**: `scripts/test.sh`
- Group 2 run_test_group 命令 (L35-36)

**Fix approach**: 將 Group 2 命令改為包含 `$GROUP1_FLAGS`：
```bash
run_test_group "Package tests (no mock.module)" \
  node $GROUP1_FLAGS --test $PACKAGE_TEST_FILES
```

注意：此變更可能影響涵蓋率數字，需確認仍 >= 80%。

**Complexity**: 簡單（一行變更）

**Regression test**: 無需獨立 regtest。由 CI pipeline 驗證（涵蓋率必須 >= 80%）。

---

### FIX-E: `helpTopic` 型別縮窄 (P3)

**Root cause**: `ParsedArguments` 介面（`types.ts:45`）中 `helpTopic: string` 的型別過於寬鬆，底層 parser（`InstallCommand.helpTopic: 'overview' | 'install'`, `UninstallCommand.helpTopic: 'uninstall'`）已有精確字面量型別。

**Files involved**: `packages/cli/types.ts`
- `ParsedArguments` interface 中的 `helpTopic` 欄位 (L45)

**Fix approach**: 將：
```ts
helpTopic: string;
```
改為：
```ts
helpTopic: 'overview' | 'install' | 'uninstall';
```

確認 `parseArguments` 的實作中所有回傳 `helpTopic` 的地方都符合此型別。已確認：
- InstallArgsParser: `helpTopic: 'overview' | 'install'` ✅
- UninstallArgsParser: `helpTopic: 'uninstall'` ✅
- ToolArgsParser: 不回傳 helpTopic（tool command 路徑無 helpTopic）✅
- 預設 install fallback: `helpTopic: 'overview'` ✅

**Complexity**: 簡單（一行型別變更）

**Regression test**: 無需獨立 regtest。TypeScript 編譯會驗證型別正確性。若型別不符，`tsc --noEmit` 會報錯。

---

### FIX-F: 測試匯入使用 `dist/` 路徑遷移至套件名 (P3)

**Root cause**: 4 個 parser 測試檔案使用 `../../packages/cli/dist/parsers/...` 的相對路徑而非 `@laitszkin/cli` 套件名，若 tsconfig 映射變更可能失效。

**Files involved**:
- `test/cli/install-args-parser.test.js` (L4): `import { InstallArgsParser } from '../../packages/cli/dist/parsers/install-parser.js'`
- `test/cli/tool-args-parser.test.js` (L3): `import { ToolArgsParser } from '../../packages/cli/dist/parsers/tool-parser.js'`
- `test/cli/uninstall-args-parser.test.js` (L4): `import { UninstallArgsParser } from '../../packages/cli/dist/parsers/uninstall-parser.js'`
- `test/cli/help-text-builder.test.js` (L11): `import { HelpTextBuilder } from '../../packages/cli/dist/help-text-builder.js'`

**Fix approach**: 將所有 4 個檔案的 import 路徑從 `../../packages/cli/dist/...` 改為 `@laitszkin/cli`。

但需先確認 `@laitszkin/cli` 的 `package.json` exports 或 `index.ts` 的 re-export 是否包含這些 parser 類別與 HelpTextBuilder。

**檢查 `packages/cli/index.ts` exports** (從 Round 4 審查可知)：
- `export { InstallArgsParser } from './parsers/install-parser.js';` — 需確認是否存在
- `export { ToolArgsParser } from './parsers/tool-parser.js';` — 需確認是否存在
- `export { UninstallArgsParser } from './parsers/uninstall-parser.js';` — 需確認是否存在
- `export { HelpTextBuilder } from './help-text-builder.js';` — 需確認是否存在

若未匯出，則此 fix 需先在 `packages/cli/index.ts` 加入對應的 re-export。

**Complexity**: 簡單（4 行 import 變更），但需先確認 package 匯出狀態。

---

### FIX-G: `cli-parsing.test.js` 與 `dispatch-table.test.js` 測試重疊清理 (P3)

**Root cause**: `test/cli-parsing.test.js` 與 `test/cli/dispatch-table.test.js` 之間有 7 個 `parseArguments` 分類測試案例完全重複。`dispatch-table.test.js` 另有 15 個 `run()` 整合測試為 `cli-parsing.test.js` 所無。

**Files involved**:
- `test/cli-parsing.test.js` — 7 個重複的 parseArguments 測試 + 12 個獨立的 parseArguments 進階測試
- `test/cli/dispatch-table.test.js` — 7 個重複測試 + 15 個 run() 整合測試

**Fix approach**: 
1. 先比對兩個檔案的測試案例，確認 dispatch-table.test.js 已涵蓋 cli-parsing.test.js 的所有 `parseArguments` 測試
2. 將 cli-parsing.test.js 中**未在** dispatch-table.test.js 出現的 parseArguments 測試（進階/邊界案例）遷移至 dispatch-table.test.js
3. 刪除 `test/cli-parsing.test.js`

注意：需要逐案比對測試。clipping.test.js 有 12 個非重疊的 parseArguments 測試（如 `'parseArguments passes through tool args'`, `'parseArguments handles codegraph --json'` 等）。需要將這些案例遷移到 dispatch-table.test.js 後才能刪除。

**Complexity**: 中等（需逐案比對並遷移測試，但無邏輯變更）

**Regression test**: 無需獨立 regtest。變更後執行 `node --test` 確認所有測試仍然通過。

---

## 6. Worker Prompt Library

### Fix Worker Prompts

#### FIX-A: review-threads `_rawArgs` 遷移至 Schema `multiple: true`

```
## Mission
將 review-threads 工具中殘留的 `_rawArgs` 模組變數繞道遷移至 Schema 的 `multiple: true` 支援。SchemaOption 已在 Round 4 新增 `multiple` 屬性（find-github-issues 已遷移），但 review-threads 未被更新。

## Context
- Review dimension: Spec implementation omission
- Spec requirement: Req 1 — 引數定義、help 文字、驗證邏輯全部來自同一個 schema 宣告
- Severity: P2 (review-threads 仍自行實作 parseArgs 繞道)

## Input
Read these files:
- `packages/tools/review-threads/index.ts` — 目標檔案

## What to do
1. 在 schema.options 的 `'thread-id'` 中加入 `multiple: true`：
   ```
   'thread-id': { type: 'string' as const, multiple: true },
   ```

2. 移除模組層級 `_rawArgs` 變數宣告（約 L67-69）及上方註解：
   ```
   // Holds the raw argv for re-parsing the --thread-id option with multiple:true,
   // since SchemaOption does not support the `multiple` property.
   let _rawArgs: string[] = [];
   ```

3. 在 handler 主體中，移除 L532-538 的 `parseArgs` 重新解析區塊：
   ```
   // Re-parse --thread-id with multiple:true from raw args
   const { values: parsed } = parseArgs({
     args: _rawArgs,
     options: { 'thread-id': { type: 'string', multiple: true } },
     strict: false,
     allowPositionals: true,
   });
   const threadId = (parsed['thread-id'] as string[]) ?? [];
   ```
   改為直接使用 schema values：
   ```
   const threadId = (values['thread-id'] as string[]) ?? [];
   ```

4. 在 tool entry handler（約 L578）中移除 `_rawArgs = args` 賦值。

5. 若 `parseArgs` 在檔案中無其他使用，從 import 行移除 `{ parseArgs }` from `'node:util'`。

6. 確認 handler 主體中所有 `threadId` 的使用不受影響（變數名與型別皆維持 `string[]`）。

## Scope
- Allowed files:
  - `packages/tools/review-threads/index.ts` — 獨一修改目標
- Forbidden files:
  - 所有其他檔案（不屬於此 worker）

## Output
Report:
- Lines removed (module variable + parseArgs block + entry assignment)
- Lines modified (schema thread-id added multiple, threadId variable source)
- Any edge cases encountered

## Verify
- Run: `node --test 'test/**/*.test.js'`
- Expected: All tests pass
- Specifically: The test suite should run without errors; no behavioral change

## Boundaries
- 不要改動任何其他程式碼
- 不改寫 handler 邏輯或 `threadId` 變數的消費方式（只改變來源）
- 移除後的行為必須與移除前一致（`--thread-id` 可接受多個值）
```

#### FIX-B: codegraph SystemError MODULE_NOT_FOUND 偵測修復

```
## Mission
修復 codegraph handler 中 SystemError MODULE_NOT_FOUND 偵測回歸。目前 `(sysError as any).code === 'MODULE_NOT_FOUND'` 永遠為 false，因為 SystemError 的建構子將 `code` 固定為 `'SYSTEM_ERROR'`。原始錯誤碼存放在 `sysError.details.code`。此 bug 被 `message.includes('Cannot find module')` 後備條件遮蓋，但當錯誤訊息格式變更時會失效。

## Context
- Review dimension: Spec implementation deviation (回歸由 Round 4 FIX-12 引入)
- Spec requirement: Req 3 — 統一錯誤類別
- Severity: P2

## Input
- `packages/tools/codegraph/index.ts` — 目標檔案，兩個 catch 區塊

## What to do
在兩個 catch 區塊中（L44-47 和 L145-148），將：
```
if ((sysError as any).code === 'MODULE_NOT_FOUND' || (sysError.message && sysError.message.includes('Cannot find module'))) {
```
改為：
```
if ((sysError.details?.code as string) === 'MODULE_NOT_FOUND' || (sysError.message && sysError.message.includes('Cannot find module'))) {
```

兩個位置都需要修改。只有 `(sysError as any).code` 改為 `(sysError.details?.code as string)`，其他部分保持不變。

修改後，當原始錯誤的 `.code` 為 `'MODULE_NOT_FOUND'` 時，`sysError.details.code` 會正確回傳該值，不再永遠為 `'SYSTEM_ERROR'`。

## Scope
- Allowed files:
  - `packages/tools/codegraph/index.ts` — 獨一修改目標（L47, L148 各一行變更）
- Forbidden files:
  - 所有其他檔案

## Output
Report:
- Exact lines modified (line numbers confirmed)
- Verification results

## Verify
- Run: `node --test 'test/**/*.test.js'`
- Expected: All existing tests pass
- Confirm: `node --test test/tools/system-error-display.test.js` passes

## Boundaries
- 只修改 `(sysError as any).code` → `(sysError.details?.code as string)` 兩處
- 不改動任何其他邏輯、條件順序或錯誤訊息
- 不改動 SystemError 或 AppError 的類別定義
```

#### FIX-C: PlatformAdapter 委派 — `resolveHomeDirectory` + `sync-memory-index`

```
## Mission
將兩個平台相關的家目錄解析點改為使用 PlatformAdapter：
1. installer.ts 的 `resolveHomeDirectory()` 應委派給 `adapter.homeDir()`
2. sync-memory-index 應使用 `os.homedir()` 而非直接 `process.env.HOME`

## Context
- Review dimension: Spec implementation omission
- Spec requirement: Req 2 — 跨平台抽象層統一處理
- Severity: P2

## Input
- `packages/cli/installer.ts` — resolveHomeDirectory 函數 (L27-29)
- `packages/tools/sync-memory-index/index.ts` — L106 的 process.env.HOME 使用

## What to do

### Part 1: installer.ts resolveHomeDirectory()
目前程式碼：
```ts
export function resolveHomeDirectory(env: NodeJS.ProcessEnv = process.env): string {
  return env.HOME || env.USERPROFILE || os.homedir();
}
```
改為直接委派給 adapter（注意：installer.ts 已匯入 `createPlatformAdapter`）：
```ts
export function resolveHomeDirectory(env: NodeJS.ProcessEnv = process.env): string {
  return createPlatformAdapter().homeDir();
}
```

這會改變行為：新版本忽略傳入的 `env` 參數，直接讀取 `process.env`。但 `resolveHomeDirectory` 的所有呼叫者（L33, L35, L44, L269）皆使用預設值（未傳入 `env`），因此無實際影響。

### Part 2: sync-memory-index
目前程式碼 (L106)：
```ts
const homeDir = process.env.HOME || '';
```
改為使用 `os.homedir()`：
```ts
const homeDir = homedir() || '';
```
並在檔案頭加入 import：
```ts
import { homedir } from 'node:os';
```

## Scope
- Allowed files:
  - `packages/cli/installer.ts` — resolveHomeDirectory function
  - `packages/tools/sync-memory-index/index.ts` — homeDir resolution
- Forbidden files:
  - 所有其他檔案
  - 不要修改 platform-adapter.ts（adapter 定義維持不變）

## Output
Report:
- Changes made in installer.ts
- Changes made in sync-memory-index.ts
- Any edge cases (e.g. empty HOME behavior change)

## Verify
- Run: `node --test 'test/**/*.test.js'`
- Expected: All tests pass
- Specifically: `node --test test/installer.test.js` and `node --test test/tools/sync-memory-index-error.test.js test/tools/sync-memory-index-system-error.test.js`

## Boundaries
- 不改動 platform-adapter.ts 的定義
- installer.ts 的 `resolveHomeDirectory` 行為應維持不變（僅改實作方式）
- sync-memory-index 的兜底行為從 `''` 改為 `os.homedir()`（非空字串），這是改善而非退化
- 不修改已匯出的函數簽名（保留 `resolveHomeDirectory(env)` 簽名）
```

#### FIX-D: Coverage scope 擴充至 Group 2

```
## Mission
將 `scripts/test.sh` 中 Group 2 的測試命令加入 `$GROUP1_FLAGS`，使 package tests 也受 `--experimental-test-coverage` 門檻監督。

## Context
- Review dimension: Architecture defect
- Spec requirement: Req 4 — 測試涵蓋率 >= 80%
- Severity: P2

## Input
- `scripts/test.sh` — Group 2 run_test_group 命令 (L35-36)

## What to do
將：
```bash
run_test_group "Package tests (no mock.module)" \
  node --test $PACKAGE_TEST_FILES
```
改為：
```bash
run_test_group "Package tests (no mock.module)" \
  node $GROUP1_FLAGS --test $PACKAGE_TEST_FILES
```

## Scope
- Allowed files:
  - `scripts/test.sh` — 獨一修改目標
- Forbidden files:
  - 所有其他檔案

## Output
Report:
- Exact change made (line numbers)
- Coverage numbers before and after change

## Verify
- Run: `COVERAGE=true bash scripts/test.sh`
- Expected: Test suite passes, coverage thresholds met (lines >= 80%, branches >= 60%, funcs >= 75%)
- The coverage report should now include lines from package code that Group 2 covers

## Boundaries
- 不改動 Group 3（mock-dependent tests）— 保留 `--experimental-test-module-mocks` 獨立執行
- 不改變 `$GROUP1_FLAGS` 的內容
- 不改動 Group 1 的 flag 使用方式
```

#### FIX-E: `helpTopic` 型別縮窄

```
## Mission
將 `ParsedArguments` 介面中的 `helpTopic` 型別從 `string` 縮窄為 `'overview' | 'install' | 'uninstall'`，與底層 parser 的精確型別一致。

## Context
- Review dimension: Architecture defect
- Spec requirement: Req 5 — 派發表格隔離
- Severity: P3

## Input
- `packages/cli/types.ts` — ParsedArguments interface (L45)
- `packages/cli/parsers/types.ts` — InstallCommand.helpTopic (L13), UninstallCommand.helpTopic (L25)

## What to do
在 `packages/cli/types.ts` 中，將：
```ts
helpTopic: string;
```
改為：
```ts
helpTopic: 'overview' | 'install' | 'uninstall';
```

確認所有回傳 `ParsedArguments` 的程式碼路徑都符合此型別：
- InstallArgsParser 回傳 `helpTopic: 'overview' | 'install'` ✅
- UninstallArgsParser 回傳 `helpTopic: 'uninstall'` ✅
- 工具命令路徑不回傳 helpTopic（未設定）— 但 `ParsedArguments` 介面中 `helpTopic` 為必要欄位。需確認工具命令路徑有正確設定 `helpTopic`（設為 `'overview'` 或其他合理值）

## Scope
- Allowed files:
  - `packages/cli/types.ts` — ParsedArguments.helpTopic type
- Forbidden files:
  - 所有其他檔案

## Output
Report:
- The one-line change
- Confirmation that the TypeScript compiler accepts the narrowed type
- Any compilation errors encountered

## Verify
- Run: `npx tsc --noEmit`（或對應的 TS 編譯指令）
- Expected: No type errors
- Run: `node --test` — All tests pass

## Boundaries
- 只修改 `types.ts` 中 `helpTopic` 的型別一行
- 不改動任何執行時期行為（純型別變更）
- 若發現工具命令路徑缺少 `helpTopic` 設定，在 `index.ts` 中補上（設為 `'overview'`）
```

#### FIX-F: 測試匯入使用 `dist/` 路徑遷移至套件名

```
## Mission
將 4 個 parser 測試檔案的 import 路徑從 `../../packages/cli/dist/parsers/...` 相對路徑改為 `@laitszkin/cli` 套件名。

## Context
- Review dimension: Architecture defect
- Spec requirement: Req 5 — 測試可獨立執行
- Severity: P3

## Input
Read these files:
- `test/cli/install-args-parser.test.js` — import line
- `test/cli/tool-args-parser.test.js` — import line
- `test/cli/uninstall-args-parser.test.js` — import line
- `test/cli/help-text-builder.test.js` — import line
- `packages/cli/index.ts` — 確認 re-export 狀態

## What to do

### Step 1: 檢查 `packages/cli/index.ts` exports
確認以下符號是否已從 `@laitszkin/cli` 匯出：
- `InstallArgsParser`
- `ToolArgsParser`
- `UninstallArgsParser`
- `HelpTextBuilder`

### Step 2: 若缺少 re-export，在 `packages/cli/index.ts` 加入
```ts
export { InstallArgsParser } from './parsers/install-parser.js';
export { UninstallArgsParser } from './parsers/uninstall-parser.js';
export { ToolArgsParser } from './parsers/tool-parser.js';
export { HelpTextBuilder } from './help-text-builder.js';
```

### Step 3: 更新測試檔案 imports
將每個檔案中的：
```ts
import { Xxx } from '../../packages/cli/dist/parsers/xxx-parser.js';
```
改為：
```ts
import { Xxx } from '@laitszkin/cli';
```

受影響的檔案：
1. `test/cli/install-args-parser.test.js` — `InstallArgsParser`
2. `test/cli/tool-args-parser.test.js` — `ToolArgsParser`
3. `test/cli/uninstall-args-parser.test.js` — `UninstallArgsParser`
4. `test/cli/help-text-builder.test.js` — `HelpTextBuilder`

## Scope
- Allowed files:
  - `test/cli/install-args-parser.test.js`
  - `test/cli/tool-args-parser.test.js`
  - `test/cli/uninstall-args-parser.test.js`
  - `test/cli/help-text-builder.test.js`
  - `packages/cli/index.ts`（僅在需要加入 re-export 時修改）
- Forbidden files:
  - 所有其他檔案

## Output
Report:
- Which re-exports were added to index.ts (if any)
- Each test file's old import → new import

## Verify
- Run: `node --test 'test/cli/install-args-parser.test.js' 'test/cli/tool-args-parser.test.js' 'test/cli/uninstall-args-parser.test.js' 'test/cli/help-text-builder.test.js'`
- Expected: All 4 tests pass
- Run: `node --test 'test/**/*.test.js'`
- Expected: All tests pass

## Boundaries
- 只修改 import 路徑與必要的 re-export
- 不改動測試邏輯或測試案例
```

#### FIX-G: `cli-parsing.test.js` 與 `dispatch-table.test.js` 測試重疊清理

```
## Mission
移除 `test/cli-parsing.test.js` 與 `test/cli/dispatch-table.test.js` 之間 7 個重複的 `parseArguments` 測試案例，並將 cli-parsing.test.js 中獨有的進階測試遷移至 dispatch-table.test.js，最終刪除 cli-parsing.test.js。

## Context
- Review dimension: Redundant code
- Spec requirement: Req 5 — 派發測試
- Severity: P3

## Input
Read these files:
- `test/cli-parsing.test.js` — 全部內容
- `test/cli/dispatch-table.test.js` — 全部內容

## What to do

### Step 1: 比對兩個檔案的 test titles
標記哪些測試在兩個檔案中重複：

重複的（已在 dispatch-table.test.js 中存在）：
- parseArguments recognizes --help flag → dispatch test 已有 "classifies --help as overview help"
- parseArguments recognizes install codex --copy → dispatch test 是否有對應案例？需確認
- ...更多案例需逐案比對

### Step 2: 遷移獨有的 parseArguments 測試
將 cli-parsing.test.js 中存在的、但 dispatch-table.test.js 中沒有的 parseArguments 測試案例附加到 dispatch-table.test.js：
- 例如 "parseArguments passes through tool args"（約 L60-65）
- 例如 "parseArguments handles codegraph --json"（約 L100-106）
- 注意：不需要搬遷已被完整涵蓋的案例

### Step 3: 刪除 cli-parsing.test.js
確認所有測試案例已遷移後，刪除 `test/cli-parsing.test.js` 檔案。

注意：cli-parsing.test.js 中可能包含「run() 整合測試已涵蓋但 dispatch-table 未涵蓋」的 parseArguments 純分類測試。只搬遷那些未被涵蓋的。

## Scope
- Allowed files:
  - `test/cli-parsing.test.js` — 讀取並最終刪除
  - `test/cli/dispatch-table.test.js` — 新增遷移的測試案例
- Forbidden files:
  - 所有其他檔案

## Output
Report:
- Number of tests moved from cli-parsing to dispatch-table
- Number of duplicate tests identified (removed without migration)
- Final confirmation of deletion

## Verify
- Run: `node --test 'test/**/*.test.js'`
- Expected: All tests pass (same count or slightly adjusted for dedup)
- Specifically: `node --test 'test/cli/*.test.js'` shows all dispatch-table tests pass

## Boundaries
- 不要修改測試邏輯或 assert 行為（只移動測試位置）
- 不要修改 `parseArguments` 或 `run()` 的實作
- 不要修改 `test/cli/dispatch-table.test.js` 中已有的測試案例
- 只添加缺失的、cli-parsing.test.js 中獨有的 parseArguments 測試
```

---

### Regression Test Worker Prompts

#### REGTEST-01: codegraph SystemError MODULE_NOT_FOUND detection regression test

```
## Mission
為 FIX-B 建立回歸測試。驗證 `SystemError.details.code` 正確保留了原始錯誤的 `.code` 屬性（如 `'MODULE_NOT_FOUND'`），而非被 `SystemError` 固定為 `'SYSTEM_ERROR'`。

## Context
- Fix summary: codegraph catch 區塊中的 MODULE_NOT_FOUND 偵測改用 `details.code` 而非 `code`
- Root cause: SystemError 建構子將 `code` 固定為 `'SYSTEM_ERROR'`，原始錯誤碼存放在 `details` 中
- Fix files involved: `packages/tools/codegraph/index.ts`（2 行變更）

## Input
- Read fix-related files: `packages/tool-utils/app-error.ts` (SystemError class)
- Read existing test files as format reference: `test/utils/platform-adapter.test.js`

## What to do
Create a new test file at `test/tools/codegraph-error-detection.test.js`:

Test 1: SystemError preserves original error code in `details.code`
```js
test('SystemError stores original error code in details.code, not in code', () => {
  const originalCode = 'MODULE_NOT_FOUND';
  const sysError = new SystemError('Cannot find module "something"', { code: originalCode });
  assert.strictEqual(sysError.details?.code, 'MODULE_NOT_FOUND');
  // sysError.code is always 'SYSTEM_ERROR' (SystemError hardcoded value)
  assert.strictEqual(sysError.code, 'SYSTEM_ERROR');
  // This proves that checking sysError.code === 'MODULE_NOT_FOUND' would fail
  assert.notStrictEqual(sysError.code, 'MODULE_NOT_FOUND');
});
```

Test 2: SystemError without details still works (no crash on .details?.code)
```js
test('SystemError without details handles optional chaining', () => {
  const sysError = new SystemError('generic error');
  assert.strictEqual(sysError.details?.code, undefined);
  // This proves the optional chaining works
  assert.strictEqual((sysError.details?.code as string) === 'MODULE_NOT_FOUND', false);
});
```

Test 3: SystemError preserves error message from original error
```js
test('SystemError preserves original error message', () => {
  const sysError = new SystemError('Cannot find module "lodash"', { code: 'MODULE_NOT_FOUND' });
  assert.ok(sysError.message.includes('Cannot find module'));
});
```

## Scope
- Allowed files:
  - `test/tools/codegraph-error-detection.test.js` — create new test file
- Forbidden files:
  - All source code files

## Verify
- Run: `node --test test/tools/codegraph-error-detection.test.js`
- Expected: All 3 tests pass
- Confirm existing tests: `node --test 'test/**/*.test.js'`

## Boundaries
- Do not modify any source code files
- Test must be independently executable with no external state
- Test should verify both `details.code` and `code` to make the regression clear
```

#### REGTEST-02: PlatformAdapter.homeDir platform priority regression test

```
## Mission
為 FIX-C 建立回歸測試。驗證 `PlatformAdapter.homeDir()` 在 Windows 與 POSIX 平台有不同的環境變數優先順序。

## Context
- Fix summary: 改善 PlatformAdapter 消費率 — resolveHomeDirectory 改為委派給 adapter
- Root cause: 家目錄解析散落各處，部分未透過 PlatformAdapter
- Fix files involved: `packages/cli/installer.ts`, `packages/tools/sync-memory-index/index.ts`

## Input
- Read fix-related files: `packages/tool-utils/platform-adapter.ts` (WindowsAdapter.homeDir, PosixAdapter.homeDir)
- Read existing test files as format reference: `test/utils/platform-adapter.test.js`

## What to do
擴充 `test/utils/platform-adapter.test.js`（或建立 `test/utils/platform-adapter-home-dir.test.js`）：

Test 1: WindowsAdapter.homeDir prefers USERPROFILE over HOME
- GIVEN a WindowsAdapter
- WHEN both USERPROFILE and HOME are set
- THEN homeDir() returns USERPROFILE value

Test 2: PosixAdapter.homeDir prefers HOME over USERPROFILE
- GIVEN a PosixAdapter
- WHEN both HOME and USERPROFILE are set
- THEN homeDir() returns HOME value

Test 3: Both adapters fall back to os.homedir() when no env vars set
- GIVEN either adapter
- WHEN neither HOME nor USERPROFILE is set
- THEN homeDir() returns os.homedir()

Implementation approach (use mock environment):
```js
// For WindowsAdapter test
const origEnv = { ...process.env };
process.env.USERPROFILE = '/fake/user';
process.env.HOME = '/fake/home';
try {
  const adapter = new WindowsAdapter();
  assert.strictEqual(adapter.homeDir(), '/fake/user');
} finally {
  Object.assign(process.env, origEnv);
}
```

注意：`WindowsAdapter` 和 `PosixAdapter` 可能需要從 `@laitszkin/tool-utils` 匯入。檢查是否有 public export。若無，可透過 `createPlatformAdapter()` 與 `process.platform` 判斷來間接測試。

若無法直接存取 `WindowsAdapter`/`PosixAdapter` 類別，則改為測試 `createPlatformAdapter()` 回傳的 adapter instance 的行為。

## Scope
- Allowed files:
  - `test/utils/platform-adapter.test.js` — 擴充既有檔案
  - 或 `test/utils/platform-adapter-home-dir.test.js` — 新建檔案
- Forbidden files:
  - All source code files

## Verify
- Run: `node --test test/utils/platform-adapter.test.js`（如果是擴充既有檔案）
- Expected: All tests pass (existing + new)

## Boundaries
- Do not modify any source code files
- Clean up env var mocks after each test (use try/finally)
```

---

## 7. Fix Batch Schedule

### Batch 1 — All Fix Workers (Parallel — no file overlap)

所有 7 個 fix worker 可平行執行，因為檔案集合完全不相交。

| Worker | Description | Files | Complexity |
|--------|-------------|-------|-----------|
| FIX-A | review-threads _rawArgs migration | `packages/tools/review-threads/index.ts` | 簡單 |
| FIX-B | codegraph SystemError details.code | `packages/tools/codegraph/index.ts` | 簡單 |
| FIX-C | PlatformAdapter delegation | `packages/cli/installer.ts`, `packages/tools/sync-memory-index/index.ts` | 簡單 |
| FIX-D | Coverage scope Group 2 | `scripts/test.sh` | 簡單 |
| FIX-E | helpTopic type narrowing | `packages/cli/types.ts` | 簡單 |
| FIX-F | Test imports dist/ → package name | 4 test files + optional `packages/cli/index.ts` | 簡單 |
| FIX-G | Test overlap cleanup | `test/cli-parsing.test.js`, `test/cli/dispatch-table.test.js` | 中等 |

**Gate**:
- [ ] All 7 workers report success
- [ ] Run verification: `node --test 'test/**/*.test.js'` — all pass
- [ ] If FIX-E (type change) requires TypeScript check: run `npx tsc --noEmit` — no type errors
- [ ] If FIX-D (coverage scope): verify `COVERAGE=true bash scripts/test.sh` — thresholds met

---

### Batch 2 — Regression Test Implementation (Parallel)

| Worker | Description | Files | Related Fix |
|--------|-------------|-------|-------------|
| REGTEST-01 | codegraph error detection | `test/tools/codegraph-error-detection.test.js` (new) | FIX-B |
| REGTEST-02 | PlatformAdapter homeDir priority | `test/utils/platform-adapter.test.js` (extend) | FIX-C |

**Gate**:
- [ ] REGTEST-01 worker reports success → run `node --test test/tools/codegraph-error-detection.test.js` passes
- [ ] REGTEST-02 worker reports success → run `node --test test/utils/platform-adapter.test.js` passes
- [ ] Full test suite: `node --test 'test/**/*.test.js'` passes

---

### Batch 3 — Final Integration Verification

- **Tasks**: Full test suite, cross-check REPORT.md
- **Strategy**: Sequential (coordinator handles directly)
- **Depends on**: Batch 2 completed

**Gate**:
- [ ] Full test suite: `COVERAGE=true bash scripts/test.sh` — all pass
- [ ] Every issue in REPORT.md confirmed resolved:
  - [ ] P2 #1 (P2)— review-threads `_rawArgs`: 遷移至 `multiple: true`
  - [ ] P2 #2 (P2)— codegraph SystemError: `details.code` 取代 `code`
  - [ ] P2 #3 (P2)— PlatformAdapter 委派: resolveHomeDirectory + sync-memory-index
  - [ ] P2 #4 (P2)— Coverage scope: Group 2 加入 `$GROUP1_FLAGS`
  - [ ] P3 #1 (P3)— review-threads 過時註解: 已移除（FIX-A 合併處理）
  - [ ] P3 #2 (P3)— helpTopic 型別: 已縮窄
  - [ ] P3 #3 (P3)— 測試 imports: 已遷移至套件名
  - [ ] P3 #4 (P3)— 測試重疊: cli-parsing.test.js 已刪除

---

## 8. Regression Test Inventory

因 regression tests 僅 2 項（≤ 3），已完整描述於 Section 5 (Fix Details) 與 Section 6 (Worker Prompt Library)，此處不再重複列出。

---

## 9. Verification Checkpoints

### Checkpoint 1 — After Batch 1 (all fixes)
- Run: `node --test 'test/**/*.test.js'`
- Expected: All tests pass
- If FIX-E modified types.ts: `npx tsc --noEmit` — no type errors
- If FIX-D modified scripts/test.sh: `COVERAGE=true bash scripts/test.sh` — thresholds met

### Checkpoint 2 — After Batch 2 (regression tests)
- Run REGTEST-01: `node --test test/tools/codegraph-error-detection.test.js`
- Run REGTEST-02: `node --test test/utils/platform-adapter.test.js`
- Expected: All new regression tests pass
- Full suite: `node --test 'test/**/*.test.js'`

### Checkpoint 3 — Final verification
- Run: `COVERAGE=true bash scripts/test.sh`
- Expected: Full test suite passes, coverage thresholds met
- Cross-check REPORT.md: every issue resolved

---

## 10. Error Recovery

- **If a fix worker fails**: Retry once with the worker's existing context, giving more specific guidance. Do not create a new worker.
- **If a fix worker fails twice**: Pause the entire flow. Preserve successful results from other workers in Batch 1. Report to the user.
- **If a regression test worker reports failure (test cannot pass)**: Check whether the test code is wrong or the fix is incomplete. If the test code is wrong, continue the worker to fix it. If the fix is incomplete, go back to the corresponding fix worker.
- **If a regression test passes on the unfixed code**: The test design is invalid — redesign the oracle and dispatch a new worker.
- **If merge conflicts occur**: The coordinator resolves the conflict, then re-runs the batch gate verification.
- **If a fix or regression test breaks existing tests**: Pause. Report which test failed and which worker's change caused it.

---

## 11. Fix History

### Round 4 — 2026-06-04

- **Issues fixed**: 17/21 issues from Round 4 review (1 P1 + 8 P2 + 6 P3 + 2 regressions)
- **Outcome**: Windows CI bash (P1→FIXED), 5 tools handler catch removal, SchemaOption `multiple` + AppError base class, codegraph/open-github-issue Error→AppError, ToolArgsParser dispatch integration, StdioWriter type, PlatformAdapter isWindows + shell:true
- **Not fixed**: review-threads `_rawArgs` (P2), Coverage scope Group 2 (P2), 2 P3 items deferred (test imports, test overlap)
- **Regression**: codegraph SystemError MODULE_NOT_FOUND detection broken by FIX-12
- **Commit**: `df6f957`

### Round 3 — 2026-06-04

- **Issues fixed**: FIX-01 (createToolRunner catch), FIX-02a/b/c/d (schema conversion for 19 tools), 3 regression fixes
- **Outcome**: All 5 sub-workers completed, 19 tools converted
- **Key notes**: Architecture tool escaped createToolRunner wrapper due to sub-command incompatibility (deliberate design). 3 regressions found and fixed in follow-up `1e727b9`.

### Round 2 — 2026-06-04

- **Issues fixed**: FIX-01 through FIX-06 (P0: 1, P1: 1, P2: 4)
- **Outcome**: All 6 issues resolved in commit `baec86f`
- **Key notes**: create-specs args 修復 (原 P0)、ToolSchema 機制建立 (原 P1)、StdioWriter 整合、sync-memory-index stack trace、ToolNotFoundError 啟用。

### Round 1 — 2026-06-04

- **Issues fixed**: 16 項 (P1: 3, P2: 11, P3: 2) in commit `eecb6ce`
- **Outcome**: 16 fixed, 6 deferred, 1 unfixed (StdioWriter, later fixed in Round 2)
- **Key notes**: PlatformAdapter 消費、AppError 使用、dispatch table、CI 設定、error boundary 等基礎架構全面建立。

---

## 12. Boundaries

### ALWAYS

- Run gate verification immediately after every batch
- Extract worker prompts verbatim from Section 6 — do not rewrite them
- After a worker reports, digest the results before deciding next steps
- Fixes must not conflict with the original spec requirements
- Regression tests must not start before all fix batches pass
- Resolve merge conflicts yourself — the coordinator handles them. This is coordination, not implementation.
- **For FIX-A (review-threads)**: ensure the worker reads the complete source file before modifying. The `_rawArgs` removal must not leave dangling references.
- **For FIX-B (codegraph)**: the fix is two lines. Confirm both catch blocks are modified.
- **For FIX-F (test imports)**: first check if the symbols are re-exported from `@laitszkin/cli`. If not, add re-exports AND modify test imports in a single worker.

### ASK FIRST — pause and confirm with the user

- Fix approach conflicts with spec design intent
- Need to add a new external dependency
- Worker has failed twice
- Test regression cannot be quickly diagnosed
- FIX-E (helpTopic type narrowing) causes TypeScript compilation errors beyond the expected interface change
- FIX-G (test overlap) reveals that cli-parsing.test.js has tests not covered by any other test file

### NEVER

- Write implementation logic or modify source code beyond resolving merge conflict markers
- Let workers spawn sub-workers
- Skip verification and proceed to the next batch
- Modify spec documents (unless the fix reveals a spec error — report it instead)
- Start regression tests before all fixes are verified
- Defer any REPORT.md issue to a future round — every issue has a complete fix plan in this FIX.md
- Delete `test/cli-parsing.test.js` (FIX-G) without first confirming all its unique tests are migrated to `test/cli/dispatch-table.test.js`
