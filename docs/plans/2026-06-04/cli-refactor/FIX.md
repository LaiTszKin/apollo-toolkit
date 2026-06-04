# Fix Coordinator Prompt: CLI 工具全面重構 — Round 4

- **Date**: 2026-06-04
- **Source REPORT**: `docs/plans/2026-06-04/cli-refactor/REPORT.md`
- **Source Spec**: `docs/plans/2026-06-04/cli-refactor/`
- **Total Issues**: P0: 0, P1: 1, P2: 11, P3: 9
- **Total Regression Tests**: 4

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

修復 CLI refactoring Round 4 審查中發現的 21 項問題（1 P1 + 11 P2 + 9 P3）。核心目標：
1. **Windows CI 可正常通過** — 解決 bash-only test.sh 在 Windows runner 上的相容性問題
2. **消除 5 個工具中與 createToolRunner 重複的 handler catch** — 讓統一錯誤處理架構生效
3. **改善 PlatformAdapter 消費率** — 遷移既有 `process.platform` 與直接 path/EOL 使用
4. **補齊 SchemaOption 與 AppError 基礎類別缺陷** — `multiple` 支援與 `AppError` 檢查
5. **所有 P3 建議事項納入處理** — 包含 codegraph AppError、ToolArgsParser 整合等

共 10 個 Fix Workers（含合併批次）、5 個 Regression Test Workers。

**Success looks like**: 所有 21 項 REPORT.md issue 已修復或處理完畢，5 個 regression tests 通過，完整 test suite 通過，無回歸。

---

## 3. Issue Inventory

**P1 (1)**:
- FIX-01 (P1, 簡單, 架構瑕疵): Windows CI 因 bash-only test.sh 中斷 — `.github/workflows/test.yml`, `scripts/test.sh`

**P2 (11)**:
- FIX-02 (P2, 複雜, 規格偏離): 5 個工具 handler 層級重複 catch（render-katex, docs-to-voice, create-specs, sync-memory-index, review-threads）+ sync-memory-index UserInputError 格式 — `packages/tools/*/index.ts`
- FIX-03 (P2, 簡單, 冗余程式碼): `index.ts:61` 模組級 `platformAdapter` dead code — `packages/cli/index.ts`
- FIX-04 (P2, 簡單, 規格偏離): `spawn` 未傳遞 `shell: true` — `packages/cli/updater.ts`
- FIX-05 (P2, 簡單, 架構瑕疵): `terminal.ts:33` 內聯 `process.platform` — `packages/tui/terminal.ts`
- FIX-06 (P2, 中等, 實作缺漏): PlatformAdapter 跨平台封裝大量未被消費（normalizePath, EOL, homeDir）— `packages/cli/installer.ts`, `packages/tui/stdio-adapter.ts` 等
- FIX-07 (P2, 簡單, 規格偏離): `--experimental-test-coverage` 替代 `c8` — `scripts/test.sh`
- FIX-08 (P2, 簡單, 架構瑕疵): 涵蓋率僅量測 Group 1，覆蓋範圍系統性不完整 — `scripts/test.sh`
- FIX-09 (P2, 中等, 實作缺漏): SchemaOption 不支援 `multiple: true` — `packages/tool-utils/schema.ts`
- FIX-10 (P2, 簡單, 架構瑕疵): `StdioWriter` 未在 `ToolContext` 型別中宣告 — `packages/tool-registry/types.ts`
- FIX-11 (P2, 簡單, 架構瑕疵): createToolRunner catch 缺少 `AppError` 基底類別檢查 — `packages/tool-utils/schema.ts`

**P3 (9)**:
- FIX-12 (P3, 簡單, 實作缺漏): codegraph handler 未使用 AppError 子類別 — `packages/tools/codegraph/index.ts`
- FIX-13 (P3, 簡單, 實作缺漏): open-github-issue 驗證使用泛型 Error — `packages/tools/open-github-issue/index.ts`
- FIX-14 (P3, 簡單, 規格偏離): ToolArgsParser 未納入派發表格 + InstallArgsParser 實例化兩次 + tool→tools 正規化重疊 — `packages/cli/index.ts`, `packages/cli/parsers/tool-parser.ts`
- FIX-15 (P3, 中等): 部分測試匯入 `dist/` 而非套件名 — `test/cli/*.test.js` 多檔案
- FIX-16 (P3, 簡單): `cli-parsing.test.js` 與 `dispatch-table.test.js` 測試重疊 — 測試檔案

---

## 4. Fix Dependency Analysis

### Dependencies

- FIX-09 (SchemaOption multiple) 優先於 FIX-02（避免工具 handler 移除 catch 後仍無法使用 schema）— 但邏輯上獨立的問題，schema.ts 與工具檔案無重疊，可平行
- FIX-11 (AppError 基底類別) 與 FIX-09 同檔案（schema.ts）— 可合併為同一 worker
- FIX-07 與 FIX-08 同檔案（scripts/test.sh）— 與 FIX-01 的 scripts/test.sh 重疊，需合併批次
- 所有 REGTEST 依賴對應的 FIX 先完成

### File overlaps

| Worker | Files | Overlaps With |
|--------|-------|--------------|
| FIX-01 | `.github/workflows/test.yml`, `scripts/test.sh`, `package.json` (optional) | FIX-07, FIX-08 |
| FIX-02 | `packages/tools/render-katex/index.ts`, `docs-to-voice/index.ts`, `create-specs/index.ts`, `sync-memory-index/index.ts`, `review-threads/index.ts` | 無（各工具獨立檔案）|
| FIX-03 | `packages/cli/index.ts` | FIX-14 |
| FIX-04 | `packages/cli/updater.ts` | 無 |
| FIX-05 | `packages/tui/terminal.ts` | 無 |
| FIX-06 | `packages/tool-utils/platform-adapter.ts`, `packages/cli/installer.ts`, `packages/tui/stdio-adapter.ts` | 無（修改 consumers，非共享核心）|
| FIX-07 | `scripts/test.sh` | FIX-01, FIX-08 |
| FIX-08 | `scripts/test.sh` | FIX-01, FIX-07 |
| FIX-09 + FIX-11 | `packages/tool-utils/schema.ts` | 僅兩者彼此 |
| FIX-10 | `packages/tool-registry/types.ts` | 無 |
| FIX-12 | `packages/tools/codegraph/index.ts` | 無 |
| FIX-13 | `packages/tools/open-github-issue/index.ts` | 無 |
| FIX-14 | `packages/cli/index.ts`, `packages/cli/parsers/tool-parser.ts` | FIX-03 (index.ts) |
| FIX-15 | `test/cli/install-args-parser.test.js`, `uninstall-args-parser.test.js`, `tool-args-parser.test.js`, `help-text-builder.test.js` | 無（測試檔案）|
| FIX-16 | `test/cli-parsing.test.js`, `test/cli/dispatch-table.test.js` | 無（測試檔案）|

---

## 5. Fix Details (with Regression Test Design)

### FIX-01: Windows CI 因 bash-only test.sh 中斷 (P1)

**Root cause**: `npm test` 執行 `COVERAGE=true scripts/test.sh` 使用 bash 語法（`KEY=VALUE command` + `.sh` 檔案），GitHub Actions Windows runner 的預設 shell（PowerShell/cmd.exe）無法解釋。

**Files involved**: `.github/workflows/test.yml > steps.run` (L20), `scripts/test.sh > env var pattern` (L11), `package.json > scripts.test` (L30)

**Fix approach**: 在 workflows YAML 中將 `COVERAGE` 變數透過 GitHub Actions 的 `env` 語法設定，並將 test command 改為 `bash scripts/test.sh`（Windows runner 預設有 Git Bash）。

```yaml
- run: bash scripts/test.sh
  env:
    COVERAGE: 'true'
```

或者在 workflow 層級設定 `defaults.run.shell: bash`。推薦第一種方式（最小變更）。

**Complexity**: 簡單

**Regression test: REGTEST-01** (E2E CI → 無需程式碼，手動確認 CI 通過)
- 此 fix 的驗證依賴 GitHub Actions CI matrix 實際執行
- Oracle: 在 `windows-latest` 與 `ubuntu-latest` 上 CI pipeline 皆通過

---

### FIX-02: 5 個工具 handler 層級重複 catch + sync-memory-index 格式 (P2)

**Root cause**: 5 個工具（render-katex, docs-to-voice, create-specs, sync-memory-index, review-threads）在 `schema.handler` 內將商業邏輯包在 try/catch 區塊中，手動格式化 `UserInputError`/`SystemError`/`Error` 並 `return 1`。createToolRunner (schema.ts:97-106) 已提供完全相同的錯誤包裝，handler 層級的 catch 使其被繞過。sync-memory-index 的 catch 對 UserInputError 使用 `"Error:"` 前綴，偏離 FIX-01 建立的自訂格式規則。

**Files involved**: 
- `packages/tools/render-katex/index.ts` > handler (L172-252 附近)
- `packages/tools/docs-to-voice/index.ts` > handler (L421-694 附近)
- `packages/tools/create-specs/index.ts` > handler (L62-143 附近)
- `packages/tools/sync-memory-index/index.ts` > handler (L98-134 附近) — UserInputError 格式 L126
- `packages/tools/review-threads/index.ts` > handler (L557-570 附近)

**Fix approach**: 對 5 個工具：
1. 檢查 handler 內部的 try/catch，區分「業務邏輯 catch」（處理特定 I/O 失敗並 throw typed error）與「格式化 catch」（僅格式化所有錯誤並 return 1）
2. **移除格式化 catch** — 讓錯誤自然傳播至 createToolRunner 的統一錯誤格式化
3. **保留業務邏輯 catch** — 改為 `throw new UserInputError/SystemError(...)` 取代 `stderr.write`

對於 sync-memory-index：修正 L126 的格式從 `stderr.write(\`Error: ${err.message}\n\`)` 改為 `stderr.write(\`${err.message}\n\`)`（無 "Error:" 前綴）。

**複雜工具注意事項**：
- **render-katex** 與 **docs-to-voice** 的 handler 非常長（150-200+ 行），仔細區分哪個 catch block 是格式化、哪個是業務邏輯
- **create-specs** 已有 `throw new UserInputError(...)` 在業務邏輯中，只需移除外層格式化 catch
- **review-threads** 的 handler 內層 catch 可能包含業務特定的回退處理，保留這些

**額外 Error 型別轉換注意事項**（超出 catch 移除外，一併處理）：
- **render-katex** L120: `throw new Error('Unsupported output format: ...')` → 改為 `throw new UserInputError(...)`
- **docs-to-voice**: 有 9 處 `throw new Error(...)` 需分類：使用者輸入錯誤（如輸入檔案路徑）→ `UserInputError`；系統錯誤（ffmpeg 失敗、API 錯誤）→ `SystemError`
- **review-threads**: 目前未 import AppError 子類別。需在 schema 轉換的基礎上，將 handler 內部的泛型 `Error` 調用分類為適當的 AppError 子類別。檔案中的子命令（cmdList、cmdResolve）在內部 catch 後用自己的 `stderr.write` 處理錯誤 — 這些子命令調用可保留原狀（它們在本地處理錯誤）

**Complexity**: 複雜 — 需要仔細對每個工具的 catch block 類型進行判斷

**Regression test: REGTEST-02** (Integration → `test/tools/handler-error-propagation.test.js`)
- GIVEN 5 個工具的 handler 皆在業務邏輯中拋出具型別的 AppError
- WHEN handler 執行到錯誤路徑
- THEN createToolRunner 的 catch block 處理格式化（UserInputError 無前綴, SystemError 含 stack）
- Oracle: Handler catch 移除前後行為一致（只改變錯誤格式化的位置，不改變輸出內容）

---

### FIX-03: `index.ts:61` platformAdapter dead code (P2)

**Root cause**: `const platformAdapter = createPlatformAdapter()` 在模組層級宣告但全檔無任何引用（工具個別呼叫 `createPlatformAdapter()`）

**Files involved**: `packages/cli/index.ts > line 61`

**Fix approach**: 移除 L61 的宣告與上方相關註解。保留 `// ---- Module-level platform adapter ---` 註解上方的 import。

**Complexity**: 簡單

**Regression test**: 無需獨立 regtest（僅移除 dead code，已有測試覆蓋此路徑），但需與 FIX-14 一併處理（兩者皆修改 index.ts）。

---

### FIX-04: `spawn` 未傳遞 `shell: true` (P2)

**Root cause**: `updater.ts` 的 `execCommand()` 以 `adapter.resolveCommand()` 將 `npm` 改名為 `npm.cmd`，但 `spawn()` 完全未設定 `shell` 選項。

**Files involved**: `packages/cli/updater.ts > execCommand()` (L63-96, 特別是 L70-74)

**Fix approach**: 在 `spawn()` 呼叫中加入 `shell: true` 選項。注意不要破壞非 Windows 平台的行為（`shell: true` 在 POSIX 上會透過 `/bin/sh` 執行，對簡單指令幾乎無影響）。

**注意**：加入 `shell: true` 後需一併考慮安全性（指令注入）— 確認 `command` 與 `args` 來自固定程式碼而非使用者輸入。目前的 `execCommand` 的 caller 使用固定字串如 `'npm'`, `'node'` — 安全。

**Complexity**: 簡單

**Regression test: REGTEST-03** (Unit → `test/updater-extras.test.js` 擴充)
- GIVEN execCommand 被呼叫
- WHEN 在 Windows 平台（process.platform === 'win32'）
- THEN spawn 被呼叫時 options 包含 `shell: true`
- Oracle: 在 Windows 上，spawn 的 options 參數包含 shell: true

---

### FIX-05: `terminal.ts` 內聯 `process.platform` (P2)

**Root cause**: `isInteractive()` 直接在 L33 使用 `if (process.platform === 'win32')`，未透過 PlatformAdapter。

**Files involved**: `packages/tui/terminal.ts > isInteractive()` (L27-L45)，PlatformAdapter 已有 PlatformAdapter interface (但未定義 isWindows 方法)

**Fix approach**: 
1. 在 `PlatformAdapter` interface 中加入 `isWindows(): boolean` 方法
2. 在 `WindowsAdapter` 實作 `return true`
3. 在 `PosixAdapter` 實作 `return false`
4. 修改 `terminal.ts` 的 `isInteractive()` 使用 platformAdapter.isWindows()

注意：`terminal.ts` 目前不匯入 PlatformAdapter。匯入方式應與其他檔案一致（`createPlatformAdapter` from `@laitszkin/tool-utils`）。

**Complexity**: 中等 — 跨兩個 package 的變更（tool-utils → tui）

**Regression test**: 由現有 `test/utils/platform-adapter.test.js` 涵蓋（新增 isWindows 測試），無需獨立 regtest。

---

### FIX-06: PlatformAdapter 跨平台封裝大量未被消費 (P2)

**Root cause**: PlatformAdapter 定義了 `normalizePath()`、`EOL` getter、`homeDir()`，但沒有任何消費者呼叫這些方法。消費者直接使用 `path.join` / `path.normalize`（installer.ts 20+ 處）、`'\n'`（stdio-adapter.ts 6 處 + installer.ts 2 處）、或自有的 `resolveHomeDirectory()`（installer.ts）。

**Files involved**: 
- `packages/tool-utils/platform-adapter.ts` — 定義存在，無需修改
- `packages/cli/installer.ts` — 所有 path.join 與 EOL 使用點
- `packages/tui/stdio-adapter.ts` — 所有 `'\n'` 硬編碼

**Fix approach**: 此為大規模但低風險的機械化變更。在每個消費點：
1. `path.join`/`path.normalize` → 可保留原狀（createPlatformAdapter().normalizePath(path) 與 path.normalize 行為完全一致，已無跨平台差異）
2. `\\n` 在檔案寫入 → 保留原狀（Node.js 在 Windows 上寫入 `\\n` 時，若以 `'w'` 模式開啟 text 檔案會自動轉換為 `\\r\\n`，且 `fs.writeFileSync` 預設為 binary mode 不轉換——但實際 EOL 抽象影響有限。核心問題在 SPEC 描述與實作之間的落差，非功能缺陷）
3. `resolveHomeDirectory()` → adapter.homeDir() 已提供等價功能但缺少 `env` 注入。為維持可測試性，保留 `resolveHomeDirectory()` 但可考慮讓它委派給 adapter

**結論**：此 issue 為架構層級偏離（P2），不建議強制遷移所有消費者。替代方案為：
- 在 adapter 的 API 文件中標註哪些方法已被消費者使用，哪些尚未
- 對新程式碼鼓勵使用 adapter
- 移除未使用的 adapter 方法（homeDir, EOL 等）以保持介面精簡 — 但注意這與 SPEC 的「統一抽象層」目標衝突

**建議行動**：
- 保留所有 adapter 方法定義（與 SPEC 一致）
- 將 `resolveHomeDirectory()` 改為委派給 adapter（共用實作，消除重複）
- 移除 `index.ts:61` 的 dead code（已在 FIX-03）

**Complexity**: 中等 — 需要架構判斷而非純機械變更

**Regression test**: 無需獨立 regtest（無功能變更）。現有測試套件通過即可。

---

### FIX-07: `--experimental-test-coverage` 替代 `c8` (P2)

**Root cause**: SPEC 明確要求「c8 報告的 line coverage >= 80%」，但實作使用 `--experimental-test-coverage`。

**Files involved**: `scripts/test.sh` (L12), `SPEC.md` (L74 — 文字更新)

**Fix approach**: 兩種選項：
- **選項 A**（建議）：將 SPEC.md 中的 `c8` 更新為 `node --experimental-test-coverage`（反映實際決策）
- **選項 B**：安裝 `c8` 作為 devDependency 並修改 test.sh

選擇選項 A，因為 DESIGN.md 已記錄此決策（第 175 行），SPEC.md 應與實際實作一致。

**Complexity**: 簡單（文件更新）

**Regression test**: 無需

---

### FIX-08: 涵蓋率僅量測 Group 1 (P2)

**Root cause**: `scripts/test.sh` 在 Group 1 以外未套用 coverage flags。

**Files involved**: `scripts/test.sh` (L28-30)

**Fix approach**: 將 coverage flag 也套用至 Group 2（package tests without mock.module）。Group 3（mock-dependent tests）因 `--experimental-test-module-mocks` 與 `--experimental-test-coverage` 可能存在 Node.js test runner 相容性問題，保留不變。

將 test.sh 中 Group 2 的命令從：
```bash
node --test $PACKAGE_TEST_FILES
```
改為：
```bash
node $GROUP1_FLAGS --test $PACKAGE_TEST_FILES
```

注意：這可能影響涵蓋率數字，需確認仍 >= 80%。

**Complexity**: 簡單

**Regression test**: 由 CI pipeline 驗證（涵蓋率數字不得低於 80%）。

---

### FIX-09 + FIX-11: SchemaOption 不支援 `multiple` + createToolRunner 缺少 AppError 檢查 (P2)

**Root cause**: `SchemaOption` type (schema.ts:7-9) 只定義 `{ type: 'string' | 'boolean'; default?: ...; short?: ... }`，不支援 `multiple`。createToolRunner catch (L97-104) 檢查 `UserInputError`、`SystemError`、`Error`，但跳過 `AppError`。

**Files involved**: `packages/tool-utils/schema.ts`
- SchemaOption type (L7-9)
- createToolRunner catch block (L97-104)

**Fix approach**:

**SchemaOption multiple**：
在 `SchemaOption` type 中加入 `multiple?: boolean`：
```ts
export type SchemaOption =
  | { type: 'string'; default?: string; short?: string; multiple?: boolean }
  | { type: 'boolean'; default?: boolean; short?: string; multiple?: boolean };
```

在 `createToolRunner` 中傳遞 multiple 到 parseArgs options：
```ts
const entry: { type: 'string' | 'boolean'; default?: string | boolean; short?: string; multiple?: boolean } = { type: opt.type };
if (opt.multiple) entry.multiple = true;
```

同時更新受影響的工具（find-github-issues, review-threads）以使用 Schema 的 multiple，移除 `_rawArgs` 繞道:

**find-github-issues**：`--label` 改為 schema 定義 `{ type: 'string', multiple: true }`，移除 `_rawArgs` + 第二次 parseArgs 呼叫
**review-threads**：`--thread-id` 與 `--instruction-line` 改為 schema 定義，移除 `_rawArgs` + wrapper

**AppError 基底類別**：
在 createToolRunner catch block 中加入 `AppError` 檢查：
```ts
} else if (err instanceof AppError) {
  // AppError 但其餘子類別 — 使用 code 與 details 屬性
  stderr.write(`Error: ${err.message}\n`);
}
```

並加入 import：
```ts
import { UserInputError, SystemError, AppError } from './app-error.js';
```

**Complexity**: 中等（Schema type 變更 + 2 個工具繞道移除 + catch 新增）

**Regression test: REGTEST-04** (Unit → `test/tools/schema-multiple-args.test.js` 或擴充 `test/tools/schema-arg-validation.test.js`)
- GIVEN schema 使用 `{ type: 'string', multiple: true }`
- WHEN handler 被呼叫
- THEN values 中的 multiple 字串陣列正確傳遞
- GIVEN handler 擲出 `new AppError('base')`
- WHEN createToolRunner catch
- THEN stderr 包含 `"Error: "` 前綴（與 run() 的 AppError 分支一致）

---

### FIX-10: StdioWriter 未在 ToolContext 型別中宣告 (P2)

**Root cause**: `cli/index.ts` 建立 `createStdioWriter()` 並傳入 tool handler context，但 `ToolContext` 型別無對應 `stdioWriter` 欄位。

**Files involved**: `packages/tool-registry/types.ts` > ToolContext interface (L28-36)

**Fix approach**: 在 `ToolContext` interface 中加入 `stdioWriter` 欄位：
```ts
import type { StdioWriter } from '@laitszkin/tui';

export interface CliContext {
  // ... 現有欄位
  stdioWriter?: StdioWriter;
}
```

注意：`StdioWriter` 在 `@laitszkin/tui` 中定義，需確認已匯出。若尚未匯出，一併加入匯出。

**Complexity**: 簡單

**Regression test**: 由現有測試（`test/cli/stdio-writer-context.test.js`）涵蓋。

---

### FIX-12: codegraph handler 未使用 AppError 子類別 (P3)

**Root cause**: codegraph handler 的 catch 區塊 (L42-47, L140-147) 使用泛型 Error 而非 `SystemError`/`UserInputError`。

**Files involved**: `packages/tools/codegraph/index.ts` (L42-47, L140-147)

**Fix approach**: 在 codegraph handler 的 catch 中改用 AppError 子類別。對於 `MODULE_NOT_FOUND` 錯誤，這屬於 SystemError。但由於 codegraph 不使用 `createToolRunner`，其錯誤直接輸出至 stderr。改為：
```ts
throw new SystemError(message, { code: error.code });
```

**注意**：codegraph 作為不使用 createToolRunner 的工具，錯誤處理模式與其他工具不同。建議保留 handler 層級 catch + return 1，但使用 `new SystemError(message)` 包裝，讓錯誤類型一致。

**Complexity**: 簡單

**Regression test**: 由現有測試 `test/tools/system-error-display.test.js` 涵蓋。

---

### FIX-13: open-github-issue 使用泛型 Error (P3)

**Root cause**: `hydrateArgs`、`validateIssueContent` 拋出 `new Error()` 而非 `UserInputError`。

**Files involved**: `packages/tools/open-github-issue/index.ts` (L626,637,655,667 等)

**Fix approach**: 將所有輸入驗證相關的 `throw new Error(...)` 取代為 `throw new UserInputError(...)`。注意區分：
- 使用者輸入不正確 → `UserInputError`
- 系統錯誤（I/O 失敗、API 呼叫異常）→ `SystemError`（若有的話）

**Complexity**: 簡單

**Regression test**: 由現有測試涵蓋（`test/tools/validation-error-handling.test.js`）。

---

### FIX-14: ToolArgsParser 未納入派發表格 + 其他 dispatch 問題 (P3)

**Root cause**: ToolArgsParser 透過獨立 if-else 分支（index.ts L136-166）而非 dispatch table 實例化。

**Files involved**: 
- `packages/cli/index.ts` — dispatch table (L95-98), ToolArgsParser 路徑 (L136-166), InstallArgsParser 重複 (L186)
- `packages/cli/parsers/tool-parser.ts` — 內部 `tool`/`tools` 處理 (L18-21)

**Fix approach**: 
1. 將 `ToolArgsParser` 加入 dispatch table
2. 移除 L136-166 的工具特定 if-else 分支
3. 將 `tool`→`tools` 正規化移至 parser 內部（移除 index.ts:86-89 的重複正規化）
4. 消除 InstallArgsParser 的雙重建立（L96 Map + L186 fallback）

**注意**：此變更較大，需確保與 FIX-03（平台 adapter dead code 移除）協調避免衝突。

**Complexity**: 中等

**Regression test**: 由現有測試 `test/cli/dispatch-table.test.js` 與 `test/cli-parsing.test.js` 涵蓋。

---

## 6. Worker Prompt Library

### Fix Worker Prompts

#### FIX-01: Fix Windows CI bash compatibility

```
## Mission
修復 Windows CI runner 因 bash-only test.sh 無法執行的問題。目前 `npm test` 執行 `COVERAGE=true scripts/test.sh`，此 bash 語法在 Windows runner 的 PowerShell/cmd.exe 上無法運作。

## Context
- Review dimension: Architecture defect
- Spec requirement: Req 4 — CI pipeline 在 ubuntu-latest 與 windows-latest 兩者上都通過

## Input
Read the following files:
- `.github/workflows/test.yml` — CI pipeline 設定，matrix 定義
- `scripts/test.sh` — test 執行腳本，COVERAGE=true 環境變數前綴
- `package.json` — scripts.test 欄位

## What to do
1. 編輯 `.github/workflows/test.yml`：將 `- run: npm test` 改為：
   ```yaml
       - run: bash scripts/test.sh
         env:
           COVERAGE: 'true'
   ```
   移除 `package.json` 中 `scripts.test` 的 `COVERAGE=true` 前綴，改為純粹的 `scripts/test.sh`：
   ```
   "test": "scripts/test.sh"
   ```
   
2. 由於 `COVERAGE` 改由 CI environment variable 傳入，更新 `scripts/test.sh` 的變數檢查邏輯使其在無 COVERAGE 變數時不報錯（已經設計為可選）

3. 確認 `scripts/test.sh` 不依賴僅在 bash 中才能執行的語法 — 目前已經都使用標準 bash。

## Scope
- Allowed files:
  - `.github/workflows/test.yml` — CI 設定
  - `package.json` — scripts 欄位
  - `scripts/test.sh` — 環境變數邏輯（如有需要）
- Forbidden files:
  - 所有其他檔案 — 不屬於此 worker

## Output
On completion, report:
- Which files were modified and what changed
- Confirmation that the fix addresses the Windows CI issue

## Verify
- 在本地執行 `bash scripts/test.sh` 確認正常運作（COVERAGE=true 從 CI env 取得）
- 在本地執行 `scripts/test.sh`（無 COVERAGE 變數）確認不報錯（可跳過 coverage 檢查）
- 執行完整測試套件：`COVERAGE=true bash scripts/test.sh`

## Boundaries
- 不要引入 `cross-env` 套件
- 不要修改 GitHub Actions runner 的 shell 設定（保留預設 shell）
- 不要破壞 Ubuntu CI 的行為
```

#### FIX-02: Remove redundant handler-level catches from 5 tools

```
## Mission
從 5 個工具中移除與 createToolRunner 重複的 handler 層級 try/catch 錯誤處理，讓錯誤正確傳播至 createToolRunner 的統一格式化。
受影響工具：
1. render-katex
2. docs-to-voice
3. create-specs
4. sync-memory-index（含 UserInputError "Error:" 前綴修正）
5. review-threads

## Context
- Review dimension: Spec implementation deviation
- Spec requirement: Req 1 + Req 3 — 工具不需要自行實作錯誤處理，由 CLI 邊界統一格式化

## Input
Read the following files for reference:
- `packages/tool-utils/schema.ts` — createToolRunner 的 catch block（L97-106），了解它如何格式化不同錯誤類型
- `test/utils/create-tool-runner-error.test.js` — 確認 createToolRunner error formatting

Read and modify each tool:
- `packages/tools/render-katex/index.ts`
- `packages/tools/docs-to-voice/index.ts`
- `packages/tools/create-specs/index.ts`
- `packages/tools/sync-memory-index/index.ts`
- `packages/tools/review-threads/index.ts`

## What to do
For each tool, perform the following steps:

1. **辨識 handler 內部的 try/catch**：在 schema.handler 函數中找出完整的 `try { ... } catch (err) { ... }` 區塊。

2. **區分 catch 類型**：
   - **格式化 catch**：catch (err) { if/else if/else stderr.write + return 1 } — 這種只做錯誤格式化+返回的，完全與 createToolRunner 重複
   - **業務邏輯 catch**：catch (err) { /* 清理/回退/重試 */ throw new XxxError(...) }
   - **混合 catch**：同時做業務邏輯與格式化 — 保留業務邏輯部分，移除格式化部分

3. **移除格式化 catch**：
   - 移除整個 try 區塊的外層包裝（只保留業務邏輯的主體）
   - 讓 handler 直接 `throw` UserInputError/SystemError，由 createToolRunner 的 catch 處理
   - 確保 handler 內所有 throw 都是具型別的 AppError 子類別

4. **修正 sync-memory-index 的 UserInputError 格式**（L126）：
   - 改為 `throw` 而非 `stderr.write("Error: " + message)`
   - 讓 createToolRunner 以無前綴格式輸出

5. **特別注意**：
   - **render-katex** 的 handler 約 250 行 — 有內層 try/catch (I/O 錯誤)，保留這些
   - **docs-to-voice** 的 handler 約 300 行 — handler 內有多個 try/catch 用於不同階段的錯誤處，仔細區分
   - **create-specs** — handler 已有 `throw new UserInputError(...)` 在業務邏輯中，正確
   - **review-threads** — handler 內有 wrapper (L582-585) 設定 _rawArgs，保留不變

## Scope
- Allowed files:
  - `packages/tools/render-katex/index.ts`
  - `packages/tools/docs-to-voice/index.ts`
  - `packages/tools/create-specs/index.ts`
  - `packages/tools/sync-memory-index/index.ts`
  - `packages/tools/review-threads/index.ts`
- Forbidden files:
  - 所有其他檔案

## Output
On completion, report:
- For each tool: which catch blocks were removed/preserved/modified
- Any edge cases or complexities encountered
- Test results (pass/fail)

## Verify
- Run: `node --test 'test/**/*.test.js'`
- Expected: All existing tests pass
- Specifically verify: `test/tools/sync-memory-index-system-error.test.js` passes (confirms SystemError stack trace preservation)
- Confirm: `node --test test/tools/filter-logs.test.js` still passes

## Boundaries
- 只移除外層的格式化 catch block
- 保留所有內層的業務邏輯 try/catch（I/O 錯誤、API 呼叫、檔案清理等）
- **不改變任何工具的功能行為** — 所有 `stderr.write` + `return 1` 應改為 `throw XxxError`（輸出位置行為相同，但由 createToolRunner 處理格式）
- **render-katex** L120: `throw new Error()` → 應為 `UserInputError`
- **docs-to-voice**: handler 內有 9+ 處 `throw new Error()` — 分類為 UserInputError（使用者輸入）或 SystemError（系統/API 失敗）
- **review-threads**: 目前未 import AppError 子類別。需在轉換的基礎上加入正確的類型 import 與 throw
- 不要改動子命令內部自行處理的錯誤（docs-to-voice 和 review-threads 的子調用自行 catch + stderr.write）
```

#### FIX-03: Remove dead code platformAdapter in index.ts

```
## Mission
移除 `packages/cli/index.ts` 第 61 行的模組級 `platformAdapter` dead code 變數宣告與關聯註解。

## Context
- Review dimension: Redundant code
- Spec requirement: Req 2 — 跨平台抽象層

## Input
- `packages/cli/index.ts` — 目標檔案，L61 附近的宣告與註解

## What to do
1. 移除 L61 的 `const platformAdapter = createPlatformAdapter();` 整行
2. 檢查第 53 行的 `import { ..., createPlatformAdapter } from '@laitszkin/tool-utils'` — 若 `createPlatformAdapter` 在 index.ts 中無其他消費者（已被 FIX-03 等其他 worker 移除），一併從 import 中移除
3. 移除上方的 `// ---- Module-level platform adapter ---` 註解（L59）

## Scope
- Allowed files:
  - `packages/cli/index.ts` — 獨一修改目標
- Forbidden files:
  - 所有其他檔案

## Output
Report:
- Exact lines removed
- Confirmation that `createPlatformAdapter` import is no longer needed (or still needed by other code)

## Verify
- Run: `node --test 'test/**/*.test.js'`
- Expected: All tests pass (dead code removal should have zero behavioral impact)

## Boundaries
- 不要修改任何其他程式碼
- 確認 `createPlatformAdapter` 在 index.ts 中確實無其他使用者才從 import 中移除
```

#### FIX-04: Fix spawn shell:true in updater.ts

```
## Mission
在 `execCommand` 的 `spawn()` 呼叫中加入 `shell: true` 選項，讓 Windows 上 `.cmd` 檔案可被正確解析。

## Context
- Review dimension: Spec implementation deviation
- Spec requirement: Req 2 — 跨平台抽象層

## Input
- `packages/cli/updater.ts` — execCommand 函數 (L63-96)

## What to do
在 `spawn(command, args, { env, stdio: ['ignore', 'pipe', 'pipe'] })` 呼叫中加入 `shell: true`：
```ts
const child = spawn(adapter.resolveCommand(command), args, {
  env,
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: true,
});
```

## Scope
- Allowed files:
  - `packages/cli/updater.ts` — 獨一修改目標
- Forbidden files:
  - 所有其他檔案

## Output
Report:
- The exact line modified
- Verification results

## Verify
- Run: `node --test 'test/**/*.test.js'`
- Expected: All tests pass
- The change is safe as `execCommand` only receives fixed strings like `'npm'`, `'node'` (no user input)

## Boundaries
- 不要修改任何其他檔案
- 不要移除 `adapter.resolveCommand()` 呼叫（雙重保護）
```

#### FIX-05: Add isWindows to PlatformAdapter + migrate terminal.ts

```
## Mission
在 `PlatformAdapter` interface 中加入 `isWindows(): boolean` 方法，並修改 `terminal.ts` 的 `isInteractive()` 使用它而非直接 `process.platform === 'win32'`。

## Context
- Review dimension: Architecture defect
- Spec requirement: Req 2 — 跨平台抽象層

## Input
- `packages/tool-utils/platform-adapter.ts` — PlatformAdapter interface + 實作
- `packages/tui/terminal.ts` — isInteractive() 函數 (L27-L45)
- `packages/tool-utils/index.ts` — 確保新增的方法被匯出

## What to do
1. 在 `platform-adapter.ts` 的 `PlatformAdapter interface`（L14-29）中加入：
   ```ts
   /** Returns true on Windows (process.platform === 'win32'). */
   isWindows(): boolean;
   ```
   
2. 在 `WindowsAdapter` class 中實作：
   ```ts
   isWindows(): boolean {
     return true;
   }
   ```
   
3. 在 `PosixAdapter` class 中實作：
   ```ts
   isWindows(): boolean {
     return false;
   }
   ```

4. 修改 `terminal.ts` 的 import 區（約 L5-10）加入：
   ```ts
   import { createPlatformAdapter } from '@laitszkin/tool-utils';
   ```
   
5. 在 `isInteractive()` 函數中建立 adapter 實例，將 `process.platform === 'win32'` 改為 `adapter.isWindows()`。

## Scope
- Allowed files:
  - `packages/tool-utils/platform-adapter.ts` — interface + 實作
  - `packages/tui/terminal.ts` — isInteractive() 消費者
- Forbidden files:
  - 所有其他檔案

## Output
Report:
- Files modified and changes made
- Test results

## Verify
- Run: `node --test 'test/**/*.test.js'`
- Expected: All tests pass
- Specifically: `node --test test/utils/platform-adapter.test.js` — 確認 isWindows 測試通過

## Boundaries
- 不要在 platform-adapter 的 import 路徑製造循環依賴
- `terminal.ts` 需使用 `@laitszkin/tool-utils` 套件路徑（不是相對路徑）
```

#### FIX-09+FIX-11: Add SchemaOption multiple support + AppError base class check

```
## Mission
在 SchemaOption type 中加入 `multiple?: boolean` 支援，更新 createToolRunner 傳遞 multiple 至 parseArgs，並在 createToolRunner catch 中加入 AppError 基底類別檢查。
同時更新 find-github-issues 與 review-threads 使用 Schema 的 multiple 支援，移除 _rawArgs 繞道。

## Context
- Review dimension: Spec implementation omission
- Spec requirement: Req 1 — tool 引數定義、help 文字、驗證邏輯全部來自同一個 schema 宣告

## Input
- `packages/tool-utils/schema.ts` — SchemaOption type (L7-9), createToolRunner (L69-108)
- `packages/tools/find-github-issues/index.ts` — _rawArgs (L19), handler 第二次 parseArgs
- `packages/tools/review-threads/index.ts` — _rawArgs (L69), wrapper (L582-585)
- `packages/tool-utils/index.ts` — 確認 AppError 匯出

## What to do

### Part A: SchemaOption multiple
1. 修改 `SchemaOption` type，加入 `multiple?: boolean`：
   ```ts
   export type SchemaOption =
     | { type: 'string'; default?: string; short?: string; multiple?: boolean }
     | { type: 'boolean'; default?: boolean; short?: string; multiple?: boolean };
   ```

2. 修改 `createToolRunner` 中的 options 建立邏輯 (L70-77)，加入 multiple 傳遞：
   ```ts
   const entry: { type: 'string' | 'boolean'; default?: string | boolean; short?: string; multiple?: boolean } = { type: opt.type };
   if (opt.default !== undefined) entry.default = opt.default;
   if (opt.short) entry.short = opt.short;
   if (opt.multiple) entry.multiple = true;
   options[key] = entry;
   ```

### Part B: find-github-issues _rawArgs removal
1. 在 schema.options 中為 `--label` 加入 `{ type: 'string', multiple: true }`
2. 移除 `_rawArgs` 模組層變數宣告 (L19)
3. 移除 handler 內的第二次 `parseArgs` 呼叫（約 L155-158）
4. 直接使用 `values['label'] as string[] | undefined`

### Part C: review-threads _rawArgs removal
1. 在 schema.options 中為 `--thread-id` 與 `--instruction-line` 加入 `{ type: 'string', multiple: true }`
2. 移除 top-level `_rawArgs: string[] = []` (L69)
3. 移除 wrapper 設定 `_rawArgs` 的程式碼 (L582-585)
4. 移除 handler 內的第二次 `parseArgs` 呼叫
5. 直接使用 `values['thread-id'] as string[]` 等

### Part D: AppError base class check
1. 在 import 區加入 `AppError`：
   ```ts
   import { UserInputError, SystemError, AppError } from './app-error.js';
   ```
2. 在 catch block 中加入 AppError 檢查，放在 UserInputError/SystemError 之後、generic Error 之前：
   ```ts
   } else if (err instanceof AppError) {
     stderr.write(`Error: ${err.message}\n`);
   }
   ```

## Scope
- Allowed files:
  - `packages/tool-utils/schema.ts` — SchemaOption type + createToolRunner catch
  - `packages/tools/find-github-issues/index.ts` — _rawArgs 移除
  - `packages/tools/review-threads/index.ts` — _rawArgs 移除
- Forbidden files:
  - 所有其他檔案

## Output
Report:
- Schema.ts changes (type definition + catch block + options builder)
- For each tool: _rawArgs removal summary
- Verification results

## Verify
- Run: `node --test 'test/**/*.test.js'`
- Expected: All tests pass
- Specifically: `node --test test/tools/schema-arg-validation.test.js`
- Manually check that `values['label']` works as `string[]` for multiple flags

## Boundaries
- `multiple` 在 SchemaOption 中為選填（`?:`）— 不影響既有工具的 schema
- 不要修改 find-github-issues 或 review-threads 的型別簽名（只移除 _rawArgs 繞道）
- 不要修改 `ToolSchema` interface（選項保有 `multiple` 後，handler 的 values 型別在 `Record<string, unknown>` 下正確）
```

#### FIX-10: Add stdioWriter to ToolContext type

```
## Mission
在 `ToolContext` interface 中加入 `stdioWriter?: StdioWriter` 欄位，使 StdioAdapter 輸出格式化抽象層可被工具型別安全地存取。

## Context
- Review dimension: Architecture defect
- Spec requirement: Req 1 — StdioAdapter 輸出格式化

## Input
- `packages/tool-registry/types.ts` — ToolContext interface (L28-36)
- `packages/tui/index.ts` — 確認 StdioWriter 型別已匯出 (或尋找定義位置)

## What to do
1. 在 `packages/tool-registry/types.ts` 中找到 `ToolContext` interface（可能需要確認 stdioWriter 是放 CliContext 還是 ToolContext — 事實上 cli/index.ts 傳入的是 ToolContext，所以應放在該處）
2. 加入 `stdioWriter` 欄位。如果 `StdioWriter` 型別在 `@laitszkin/tui` 中已匯出，則直接使用：
   ```ts
   import type { StdioWriter } from '@laitszkin/tui';
   
   export interface ToolContext {
     sourceRoot?: string;
     stdout?: NodeJS.WriteStream;
     stderr?: NodeJS.WriteStream;
     stdin?: NodeJS.ReadStream;
     env?: NodeJS.ProcessEnv;
     execCommand?: Function;
     confirmUpdate?: Function;
     runTool?: Function;
     spawnCommand?: Function;
     stdout?: NodeJS.WriteStream;
     stderr?: NodeJS.WriteStream;
     stdioWriter?: StdioWriter;
     // ... 其他現有欄位
   }
   ```

注意：`ToolContext` 可能在 `packages/tool-registry/types.ts` 或 `packages/cli/types.ts` — 讀取檔案確認實際位置。

## Scope
- Allowed files:
  - `packages/tool-registry/types.ts` — ToolContext 定義（待確認確切路徑）
  - 若 `StdioWriter` 未匯出，則修改 `packages/tui/index.ts`
- Forbidden files:
  - 所有其他檔案

## Output
Report:
- Location of ToolContext definition
- The change made
- Verification results

## Verify
- Run: `node --test 'test/**/*.test.js'`
- Expected: All tests pass
- The type change is additive (optional `?:`) and safe

## Boundaries
- `stdioWriter` 必須為 optional（`?:`）— 與現有型別相容
- 不要修改 StdioWriter 本身的型別定義
```

#### FIX-12: codegraph use AppError subclasses

```
## Mission
將 codegraph handler 的 catch 區塊中使用泛型 Error 改為 SystemError 子類別，使錯誤類型一致。

## Context
- Review dimension: Spec implementation omission
- Spec requirement: Req 3 — 所有錯誤路徑採用統一的錯誤類別

## Input
- `packages/tools/codegraph/index.ts` — handler catch (L42-47, L140-147)
- `packages/tool-utils/app-error.ts` — AppError 子類別定義

## What to do
在 codegraph handler 的 catch 區塊中，將兩個 catch 的錯誤處理改為使用 `UserInputError`/`SystemError`：

catch #1 (L42-47, findProjectRoot 錯誤):
```ts
catch (error: any) {
  if (error.code === 'MODULE_NOT_FOUND' || ...) {
    stderr.write('...');
  } else {
    stderr.write(`Error finding project root: ${error.message}\n`);
  }
  return 1;
}
```
→ 改為使用 `SystemError`：
```ts
catch (error: any) {
  if (error.code === 'MODULE_NOT_FOUND' || ...) {
    stderr.write('...');
  } else {
    stderr.write(`Error finding project root: ${error.message}\n`);
  }
  return 1;
}
```
由於 codegraph 不使用 createToolRunner，catch 內部的 stderr.write 模式保持不變，但至少 error 物件本身是具型別的。這需要 import `SystemError` from `@laitszkin/tool-utils`。

注意：codegraph 的 catch 不需要改為 throw，因為 codegraph 不使用 createToolRunner — 保留 handler 層級 catch + return 1 模式，但確保 catch 捕捉/使用 SystemError。

## Scope
- Allowed files:
  - `packages/tools/codegraph/index.ts` — catch block 更新 + import 新增
- Forbidden files:
  - 所有其他檔案

## Output
Report:
- Exact changes made
- Verification results

## Verify
- Run: `node --test 'test/**/*.test.js'`
- Expected: All tests pass

## Boundaries
- codegraph 不使用 createToolRunner，不要改為 throw 模式
- 只增加錯誤型別與匯入，不改變功能行為
```

#### FIX-13: open-github-issue use UserInputError

```
## Mission
將 open-github-issue 的輸入驗證拋出泛型 Error 改為 UserInputError，使 API 欄位驗證錯誤使用統一的錯誤類別。

## Context
- Review dimension: Spec implementation omission
- Spec requirement: Req 3 — 所有錯誤路徑採用統一的錯誤類別

## Input
- `packages/tools/open-github-issue/index.ts` — hydrateArgs 與 validateIssueContent 中的 `throw new Error()`

## What to do
1. 在檔案中搜尋所有 `throw new Error(` 用於輸入驗證的地方（L626,637,655,667 等）
2. 將這些改為 `throw new UserInputError(message)`
3. 確保 `UserInputError` 已從 `@laitszkin/tool-utils` import

## Scope
- Allowed files:
  - `packages/tools/open-github-issue/index.ts` — Error → UserInputError 替換
- Forbidden files:
  - 所有其他檔案

## Output
Report:
- Number of `Error` → `UserInputError` replacements
- Verification results

## Verify
- Run: `node --test 'test/**/*.test.js'`
- Expected: All tests pass
- Specifically check: `test/tools/validation-error-handling.test.js`

## Boundaries
- 只改輸入驗證相關的 Error（form validation, field checks）
- 不改系統錯誤（I/O、API 呼叫）— 那些應保留為 Error
```

#### FIX-14: Integrate ToolArgsParser into dispatch table

```
## Mission
將 ToolArgsParser 整合進派發表格，消除 index.ts 中工具特定的 if-else 分支 (L136-166)。同時消除 InstallArgsParser 的雙重實例化與 tool→tools 正規化重疊。

## Context
- Review dimension: Spec implementation deviation
- Spec requirement: Req 5 — 派發表格條目可獨立增刪

## Input
- `packages/cli/index.ts` — dispatch table (L95-98), tool 路徑 (L136-166), fallback (L186)
- `packages/cli/parsers/tool-parser.ts` — ToolArgsParser 實作 (含 tool/tools 處理)
- `packages/cli/parsers/types.ts` — ToolCommand / ToolsHelpCommand types
- `test/cli/dispatch-table.test.js` + `test/cli-parsing.test.js` — 驗證測試

## What to do

### Step 1: 將 ToolArgsParser 加入 dispatch table
將 L95-98 的 Map 擴充為：
```ts
const commandParsers = new Map<string, CommandParser<any>>([
  ['install', new InstallArgsParser()],
  ['uninstall', new UninstallArgsParser()],
  ['tools', new ToolArgsParser()],
  ['tool', new ToolArgsParser()],  // 處理 tool→tools alias
]);
```

### Step 2: 移除 L86-89 的 tool→tools 正規化
在 `parseArguments` 中移除這三行：
```ts
const normalised = [...argv];
if (normalised[0] === 'tool') {
  normalised[0] = 'tools';
}
```
因為 dispatch table 現在同時包含 `tool` 與 `tools`。

### Step 3: 重構 L136-166 工具分支
在 dispatch table lookup 後，加入統一的 parser 處理邏輯：
```ts
if (parser) {
  if (firstArg === 'tools' || firstArg === 'tool') {
    const cmd = parser.parse(normalised) as ToolCommand | ToolsHelpCommand;
    if (cmd.command === 'tools-help') { ... }
    return { command: 'tool', toolName: cmd.toolName, toolArgs: cmd.toolArgs, ... };
  }
  // ... 原有的 install/uninstall 處理
}
```

### Step 4: 消除 InstallArgsParser 雙重實例化
合併 L95-98 的 dispatch table 與 L186 的 fallback 邏輯：
- 在 dispatch table lookup 後，若無匹配條目且 firstArg 非工具名，直接使用 `commandParsers.get('install')` 已有的 parser 實例
- 或將 InstallArgsParser 實例提取為模組層級單例

## Scope
- Allowed files:
  - `packages/cli/index.ts` — dispatch table + if-else 重構
  - `packages/cli/parsers/tool-parser.ts` — 若需調整 parse() 簽名
- Forbidden files:
  - 所有其他檔案
  - 不要修改 `ParsedArguments` type（保持向後相容）

## Output
Report:
- Dispatch table changes
- Removed if-else branches
- Evidence that existing dispatch tests still validate all command paths

## Verify
- Run: `node --test 'test/**/*.test.js'`
- Expected: All tests pass
- Specifically verify: `node --test test/cli/dispatch-table.test.js test/cli-parsing.test.js test/tool-runner.test.js`

## Boundaries
- 不要改變 ParsedArguments 的 shape — 向後相容是必須的
- ToolArgsParser 的 `tool` vs `tools` 處理應保持所有現有行為
- 不要修改工具 handler（不屬於此 worker 範圍）
```

---

### Regression Test Worker Prompts

#### REGTEST-01: Windows CI fix — CI 手動驗證

無需 regression test worker。此 fix 的驗證依賴 GitHub Actions CI matrix 實際執行。在 PR 合併前確認 CI matrix 的 `windows-latest` 和 `ubuntu-latest` 都通過。

#### REGTEST-02: Handler error propagation regression test

```
## Mission
建立 FIX-02 的回歸測試。驗證移除 handler 層級 catch 後，錯誤正確傳播至 createToolRunner 統一格式化。

## Context
- Fix summary: 5 個工具（render-katex, docs-to-voice, create-specs, sync-memory-index, review-threads）的 handler 層級 try/catch 已被移除，錯誤傳播至 createToolRunner
- Root cause: handler 層級 catch 攔截所有錯誤並以自訂格式輸出，繞過 createToolRunner 的統一格式化
- Fix files involved: 5 個工具各自的 index.ts

## Input
- Read fix-related files: `packages/tool-utils/schema.ts` (createToolRunner source of truth)
- Read existing test files as format reference: `test/utils/create-tool-runner-error.test.js`

## What to do
Create a regression test at `test/tools/handler-error-propagation.test.js`:

Test 1: createToolRunner catches and formats errors from handler
- GIVEN a schema whose handler throws different error types
- WHEN createToolRunner invokes the handler
- THEN the catch block in createToolRunner properly formats each error type

Test 2: Handler-level catch no longer interferes with error propagation
- GIVEN a schema whose handler throws (simulating what a tool handler would throw)
- WHEN createToolRunner invokes the handler
- THEN the error reaches createToolRunner's catch block (not intercepted by handler-level catch)

Use `createMemoryStream()` pattern from existing tests:
```js
function createMemoryStream() {
  let data = '';
  return { write(chunk) { data += chunk; return true; }, toString() { return data; } };
}
```

The test should not import actual tool modules — use a mock schema:
```js
const schema = {
  options: {},
  handler: async () => { throw new UserInputError('test error'); },
};
const runner = createToolRunner(schema);
const stderr = createMemoryStream();
const exitCode = await runner([], { stdout: createMemoryStream(), stderr });
assert.strictEqual(exitCode, 1);
assert.strictEqual(stderr.toString(), 'test error\n'); // no "Error:" prefix
```

## Scope
- Allowed files:
  - `test/tools/handler-error-propagation.test.js` — create new test file
- Forbidden files:
  - All source code files

## Verify
- Run: `node --test test/tools/handler-error-propagation.test.js`
- Expected: All tests pass
- Confirm existing tests: `node --test 'test/**/*.test.js'`

## Boundaries
- Do not modify any source code files
- Test should not import actual tool modules (focus on createToolRunner behavior)
- Must be independently executable with no external state
```

#### REGTEST-03: spawn shell:true regression test

```
## Mission
在現有的 updater 測試中擴充，驗證 `execCommand` 的 `spawn()` 包含 `shell: true` 選項。

## Context
- Fix summary: execCommand spawn 呼叫中加入 shell:true
- Root cause: spawn 只有 resolveCommand 改名但未用 shell，Windows 上 .cmd 解析不完整
- Fix files involved: `packages/cli/updater.ts`

## Input
- Read fix-related files: `packages/cli/updater.ts` (execCommand function)
- Read existing test files as format reference: `test/updater-extras.test.js`

## What to do
在 `test/updater-extras.test.js` 中加入一個測試案例，驗證 `execCommand` 的 spawn 被呼叫時包含 `shell: true`。

由於 execCommand 實際建立子行程，測試應使用 mock 方式驗證 spawn 的 options 包含 shell: true。或者使用 Integration test 確認 npm 命令（如 `npm --version`）能正常執行。

若直接測試 execCommand 困難，改為測試 `adapter.resolveCommand()` 與 spawn 參數的交互。

## Scope
- Allowed files:
  - `test/updater-extras.test.js` — 擴充既有測試
- Forbidden files:
  - All source code files

## Verify
- Run: `node --test test/updater-extras.test.js`
- Expected: All tests pass (existing + new)

## Boundaries
- Do not modify any source code files
- Keep the test simple — avoid network calls
```

#### REGTEST-04: SchemaOption multiple + AppError base class regression test

```
## Mission
建立 FIX-09+FIX-11 的回歸測試。驗證 SchemaOption 的 `multiple: true` 支援與 createToolRunner catch 的 AppError 基底類別檢查。

## Context
- Fix summary: SchemaOption now supports `multiple?: boolean`; createToolRunner catch checks `AppError` base class
- Root cause: SchemaOption type didn't support multiple flags; catch block skipped AppError base class
- Fix files involved: `packages/tool-utils/schema.ts`

## Input
- Read fix-related files: `packages/tool-utils/schema.ts`
- Read existing test files as format reference: `test/utils/create-tool-runner-error.test.js`, `test/tools/schema-arg-validation.test.js`

## What to do
在 `test/tools/schema-arg-validation.test.js` 擴充或建立 `test/tools/schema-multiple-args.test.js`：

Test 1: SchemaOption multiple string
- GIVEN a schema with `options: { tag: { type: 'string', multiple: true } }`
- WHEN createToolRunner(schema) is called with `['--tag', 'a', '--tag', 'b']`
- THEN values.tag equals `['a', 'b']`

Test 2: createToolRunner catch with AppError base class
- GIVEN a schema whose handler throws `new AppError('base error')`
- WHEN createToolRunner(schema) is called
- THEN exit code is 1
- AND stderr starts with 'Error: base error'
- Oracle: Before FIX-11, AppError fell to generic branch with same output format

## Scope
- Allowed files:
  - `test/tools/schema-arg-validation.test.js` — 擴充或新增
  - OR `test/tools/schema-multiple-args.test.js` — create new
- Forbidden files:
  - All source code files

## Verify
- Run: `node --test 'test/**/schema-*.test.js'`
- Expected: All tests pass

## Boundaries
- Do not modify any source code files
- Verify AppError test catches the base class (not subclass)
```

---

## 7. Fix Batch Schedule

### Batch 1 — CI Infrastructure (sequential - file overlap on scripts/test.sh)

- **Issues**: FIX-01 (Windows CI)
- **Strategy**: Single worker (CI config change)
- **說明**：FIX-07 (c8 spec deviation) 與 FIX-08 (coverage scope) 與 FIX-01 同檔案群，但 FIX-07 為文件更新（SPEC.md），可與 FIX-08（scripts/test.sh）合併入此批次或獨立處理。FIX-01 優先。
- **Gate**:
  - [ ] FIX-01 worker reports success
  - [ ] Run verification: `COVERAGE=true bash scripts/test.sh` — passes on local

---

### Batch 2 — Framework Core Fixes (sequential: schema.ts first → index.ts → types.ts)

**Sub-batch 2a — schema.ts (same file for FIX-09+FIX-11)**
- **Issues**: FIX-09+FIX-11 (SchemaOption multiple + AppError base)
- **Strategy**: Single worker (merged — both modify schema.ts)
- **Depends on**: None

**Sub-batch 2b — index.ts + terminal.ts (FIX-03, FIX-05, FIX-14)**
- **Issues**: FIX-03 (dead code), FIX-14 (dispatch table), FIX-05 (terminal.ts platform)
- **Strategy**: FIX-03 + FIX-14 share index.ts → sequential within sub-batch. FIX-05 (terminal.ts) independent and can run in parallel.
- **Depends on**: Sub-batch 2a
- **注意**: FIX-03 (index.ts dead code) 與 FIX-14 (dispatch table) 需順序執行：先 FIX-14 重構 dispatch table，再 FIX-03 移除 dead code（或在 FIX-14 worker 中合併處理這兩項）。建議合併為單一 FIX-03+FIX-14 worker（皆修改 index.ts）。

**Sub-batch 2c — types.ts + updater.ts + tool-registry**
- **Issues**: FIX-10 (StdioWriter), FIX-04 (spawn shell:true)
- **Strategy**: Parallel (no file overlap: tool-registry/types.ts vs updater.ts)

**Gate**:
- [ ] FIX-09+FIX-11 worker (schema.ts) reports success
- [ ] FIX-03+FIX-14 worker (index.ts) + FIX-05 (terminal.ts) report success
- [ ] FIX-10 (types.ts) + FIX-04 (updater.ts) report success
- [ ] Run verification: `node --test 'test/**/*.test.js'`

---

### Batch 3 — Tool Error Handling Fixes (parallel — all different files)

- **Issues**: FIX-02 (5 tools redundant catch), FIX-12 (codegraph AppError), FIX-13 (open-github-issue Error)
- **Strategy**: 3 workers in parallel (FIX-02 modifies 5 tool files; FIX-12 modifies codegraph; FIX-13 modifies open-github-issue — all disjoint)
- **Depends on**: Batch 2 (schema.ts changes needed for correct createToolRunner behavior)
- **Gate**:
  - [ ] FIX-02 worker reports success (5 tools cleaned)
  - [ ] FIX-12 worker reports success (codegraph AppError)
  - [ ] FIX-13 worker reports success (open-github-issue UserInputError)
  - [ ] Run verification: `node --test 'test/**/*.test.js'`

---

### Batch 4 — Regression Test Implementation

- **Tasks**: REGTEST-02, REGTEST-03, REGTEST-04
- **Strategy**: Parallel (different file sets)
- **Depends on**: Batches 1-3 completed
- **說明**：REGTEST-01 為 CI 手動驗證，無需 worker。

**Gate**:
- [ ] REGTEST-02 worker reports success (handler error propagation)
- [ ] REGTEST-03 worker reports success (spawn shell:true)
- [ ] REGTEST-04 worker reports success (schema multiple + AppError)
- [ ] All new regression tests pass: `node --test test/tools/handler-error-propagation.test.js test/updater-extras.test.js test/tools/schema-arg-validation.test.js`
- [ ] Existing test suite passes: `node --test 'test/**/*.test.js'`

---

### Batch 5 — Final Integration Verification

- **Tasks**: Full test suite, cross-check REPORT.md
- **Strategy**: Sequential (coordinator handles directly)
- **Depends on**: Batch 4 completed

**Gate**:
- [ ] Full test suite passes: `COVERAGE=true bash scripts/test.sh`
- [ ] Every issue in REPORT.md confirmed resolved
  - [ ] P1 — Windows CI: .github/workflows/test.yml 已更新，Windows CI 可執行
  - [ ] P2 #1 — Handler 重複 catch: 5 個工具的格式化 catch 已移除
  - [ ] P2 #2 — sync-memory-index UserInputError 格式: 已修正為無前綴
  - [ ] P2 #3-P2 #6 — PlatformAdapter 消費: FIX-05 isWindows + FIX-04 shell:true
  - [ ] P2 #4 — Dead code: index.ts 的 platformAdapter 已移除
  - [ ] P2 #7-P2 #8 — Coverage 設定: 檢討決定
  - [ ] P2 #9 — SchemaOption multiple: 已實現
  - [ ] P2 #10 — StdioWriter type: 已加入
  - [ ] P2 #11 — AppError 基底: createToolRunner catch 已檢查
  - [ ] P3 各項 — 需確認所有 9 項已處理

---

## 8. Regression Test Inventory

因 regression tests 僅 4 項（≤ 3 項強制，4 項總計），請直接參照 Section 5 (Fix Details) 中各 fix 的 regression test 設計與 Section 6 的 worker prompts。

- REGTEST-01 → FIX-01: CI 手動驗證 — 確認 Windows runner 通過
- REGTEST-02 → FIX-02: [Unit] `test/tools/handler-error-propagation.test.js` — 錯誤傳播至 createToolRunner
- REGTEST-03 → FIX-04: [Unit] `test/updater-extras.test.js` 擴充 — spawn 含 shell:true
- REGTEST-04 → FIX-09+FIX-11: [Unit] `test/tools/schema-arg-validation.test.js` 擴充 — multiple + AppError

---

## 9. Verification Checkpoints

### Checkpoint 1 — After Batch 1 (CI fix)
- Run: `COVERAGE=true bash scripts/test.sh`
- Expected: Test suite passes, coverage thresholds met

### Checkpoint 2 — After Batch 2 (framework core)
- Run: `node --test 'test/**/*.test.js'`
- Expected: All existing tests pass
- Confirm: FIX-09+FIX-11 (schema.ts) worker compiled without TypeScript errors
- Confirm: FIX-14 (dispatch table) worker produced correct dispatch behavior — run `node --test test/cli/dispatch-table.test.js test/cli-parsing.test.js`

### Checkpoint 3 — After Batch 3 (tool error handling)
- Run: `node --test 'test/**/*.test.js'`
- Expected: All existing tests pass
- Specifically: `node --test test/tools/sync-memory-index-system-error.test.js test/tools/filter-logs.test.js test/tools/validation-error-handling.test.js`

### Checkpoint 4 — After Batch 4 (regression tests)
- Run: `node --test test/tools/handler-error-propagation.test.js test/updater-extras.test.js test/tools/schema-arg-validation.test.js`
- Expected: All new regression tests pass

### Checkpoint 5 — Final verification
- Run: `COVERAGE=true bash scripts/test.sh`
- Expected: Full test suite passes, coverage thresholds met
- Cross-check REPORT.md: every issue resolved

---

## 10. Error Recovery

- **If a fix worker fails**: Retry with the worker's existing context (do not create a new one), giving more specific guidance. At most one retry.
- **If a fix worker fails twice**: Pause the entire flow. Preserve successful results from other workers in the same batch. Report to the user.
- **If a regression test worker reports failure (test cannot pass)**: Check whether the test code is wrong or the fix is incomplete. If the test code is wrong, continue the worker to fix it. If the fix is incomplete, go back to the corresponding fix worker.
- **If a regression test passes on the unfixed code**: The test design is invalid — redesign the oracle and dispatch a new worker.
- **If merge conflicts occur**: The coordinator resolves the conflict, then re-runs the batch gate verification.
- **If a fix or regression test breaks existing tests**: Pause. Report which test failed and which worker's change caused it.
- **For FIX-02 workers**: If a specific tool's handler cannot be safely modified (too many intertwined catch blocks), skip that tool and report why. Partial success is acceptable — the coordinator will assess scope.

---

## 11. Fix History

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
- **For FIX-02 (Complex)**: ensure the worker reads the complete tool source file before modifying catch blocks. Do not let the worker guess the catch type — they must trace the actual error flow.
- **FIX-02 worker must report each tool's conversion result individually** — not as a batch aggregate — so the coordinator can verify per-tool coverage.

### ASK FIRST — pause and confirm with the user

- Fix approach conflicts with spec design intent
- Need to add a new external dependency
- Worker has failed twice
- Test regression cannot be quickly diagnosed
- **FIX-02 worker reports more than 3 tools as "skipped" due to complexity** — the catch analysis approach may need adjustment

### NEVER

- Write implementation logic or modify source code beyond resolving merge conflict markers
- Let workers spawn sub-workers
- Skip verification and proceed to the next batch
- Modify spec documents (unless the fix reveals a spec error — report it instead)
- Start regression tests before all fixes are verified
- **Defer any REPORT.md issue to a future round** — every issue has a complete fix plan in this FIX.md
- **Remove any catch block without tracing the actual code path** — confirm it's definitely a formatting catch, not business logic
