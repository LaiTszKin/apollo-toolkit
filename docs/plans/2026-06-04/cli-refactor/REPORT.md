# Review Report — Round 5

- **Spec**: CLI 工具全面重構 (cli-refactor)
- **Date**: 2026-06-04
- **Reviewer**: Claude Code (agent-review)
- **Verdict**: Needs Attention

---

## Verdict

**Needs Attention** — 17/21 項 Round 4 問題已修復，4 項 P2 維持未處理或為本次新增（review-threads `_rawArgs` 未遷移、codegraph SystemError 判斷回歸、PlatformAdapter 消費缺口、Coverage scope 未擴充）。全數 P1 已修復，但 4 項 P2 代表 SPEC 完整性仍有風險。無 P0/P1。

---

## Requirement Status Summary

| Requirement | Status | Evidence Location | Open Findings |
|---|---|---|---|
| Req 1 — Tool boilerplate reduction | ⚠️ Partial | `packages/tools/review-threads/index.ts`（schema 已定義但 `_rawArgs` 繞道未移除），其餘 18/19 工具已正確轉換 | 1 P2, 2 P3 |
| Req 2 — Cross-platform abstraction | ⚠️ Partial | `packages/tool-utils/platform-adapter.ts`（isWindows 已建立且 terminal.ts 已消費），但 normalizePath/EOL/homeDir 零消費者；`resolveHomeDirectory()` 未委派給 adapter | 1 P2 |
| Req 3 — Unified error handling | ⚠️ Partial | 5 工具 handler catch 已移除、open-github-issue 14 處 Error→UserInputError 已轉換，但 codegraph SystemError `code` 屬性判斷回歸 | 1 P2 |
| Req 4 — Coverage >=80% + CI matrix | ⚠️ Partial | Windows CI bash 已修復（P1→FIXED），SPEC.md c8→node 更新已完成，但 Group 2 coverage scope 未擴充 | 1 P2 |
| Req 5 — Dispatch isolation | ✅ Complete | ToolArgsParser 已納入 dispatch table，dead code 移除，InstallArgsParser 重複實例化解決 | 2 P3 (deferred) |

---

## Findings

### P2 — Requirement Risk

| # | Description | Impact | File | Line | Dimension | Requirement |
|---|---|---|---|---|---|---|
| 1 | **review-threads `_rawArgs` 繞道未遷移至 Schema `multiple`**：SchemaOption 已支援 `multiple: true`（FIX-09 已修復），但 review-threads 仍保留模組層級 `_rawArgs` 變數、handler 內的二次 `parseArgs` 呼叫、以及 tool entry point 的 `_rawArgs = args` 賦值。模組層級 mutable state 在 dispatch 順序變更時仍有未初始化風險。L68 的註解「since SchemaOption does not support the `multiple` property」現已過時，對維護者具誤導性 | SPEC Req 1 要求「引數定義、help 文字、驗證邏輯全部來自同一個 schema 宣告」— review-threads 仍依賴模組變數繞道，違反此規範。find-github-issues 已正確遷移，review-threads 為唯一未遷移的工具 | `packages/tools/review-threads/index.ts` | L67-70, L532-535, L578 | Spec implementation omission | Req 1 |
| 2 | **codegraph SystemError `code` 屬性判斷回歸**：FIX-12 將 catch 中原始 error 包裝為 `new SystemError(error.message, { code: (error as any).code })`，但 `SystemError` 建構子將 `code` 固定為 `'SYSTEM_ERROR'`，傳入的 `{ code: ... }` 存放在 `details` 而非 `code`。第 47 行 `(sysError as any).code === 'MODULE_NOT_FOUND'` 永遠為 false（實為 `'SYSTEM_ERROR'`）。此錯誤被 `.includes('Cannot find module')` 訊息後備條件遮蓋，但原始程式碼的 `.code` 直接判斷已失效 | 若 Node.js 或第三方模組拋出 `code === 'MODULE_NOT_FOUND'` 但錯誤訊息不包含 "Cannot find module"，則友善提示訊息不會出現。修復前的原始程式碼直接檢查 `error.code`—此為修復引入的回歸 | `packages/tools/codegraph/index.ts` | L44-47, L143-148 | Spec implementation deviation | Req 3 |
| 3 | **PlatformAdapter 跨平台封裝消費缺口**：`isWindows()`（新增）與 `symlinkType()`（既有）各有 1 個消費者，`resolveCommand()` 有 1 個消費者。但 `normalizePath()`、`EOL`、`homeDir()` 三項方法零消費者。`resolveHomeDirectory()`（installer.ts:27）仍為獨立函數，未委派給 `adapter.homeDir()`，且兩者對 `HOME`/`USERPROFILE` 的優先順序不一致。`sync-memory-index/index.ts:106` 仍直接使用 `process.env.HOME` | SPEC Req 2 列舉的四項封裝（路徑、EOL、symlink、spawn）中，半數未被消費。統一抽象層的封裝目標部分未達成 | `packages/tool-utils/platform-adapter.ts`（定義）、`packages/cli/installer.ts`（resolveHomeDirectory 未委派）、`packages/tui/stdio-adapter.ts`（仍有 `\n` 硬編碼） | 遍佈 | Spec implementation omission | Req 2 |
| 4 | **Coverage scope 未擴充至 Group 2**：FIX-08 提議將 coverage flags 套用至 Group 2（package tests without mock.module），但 `scripts/test.sh` 未修改。Group 2 仍以 `node --test $PACKAGE_TEST_FILES` 執行（無 `$GROUP1_FLAGS`） | 非 `test/` 目錄的 package test 涵蓋的程式碼不被 coverage 測量追蹤。涵蓋率門檻僅反映 Group 1 涵蓋的程式碼，非整體。目前總涵蓋率（93.32% lines）仍高於門檻，但數字不代表全貌 | `scripts/test.sh` | L35-36 | Architecture defect | Req 4 |

### P3 — Suggestion

| # | Description | Impact | File | Line | Dimension | Requirement |
|---|---|---|---|---|---|---|
| 1 | **review-threads 過時註解**：L68 註解「since SchemaOption does not support the `multiple` property」在 FIX-09 修復後已不正確（SchemaOption 現已支援 `multiple`） | 誤導維護者，暗示需要繞道 | `packages/tools/review-threads/index.ts` | L68 | Redundant code | Req 1 |
| 2 | **`helpTopic` 型別從精確聯合放寬為 `string`**：`ParsedArguments` 介面中 `helpTopic: string` 失去 parser 層的 `'overview' \| 'install' \| 'uninstall'` 型別精確度 | 編譯期型別安全縫隙，消費端靠執行時字串比對。已存在於 Round 4 審查，未修復 | `packages/cli/types.ts` | L45 | Architecture defect | Req 5 |
| 3 | **dist/ 匯入路徑未改用套件名**（FIX-15 延遲）：parser 單元測試匯入 `../../packages/cli/dist/parsers/...` 而非 `@laitszkin/cli` 套件名 | 若 tsconfig 映射變更，dist/ 路徑可能失效。影響 4 個測試檔案 | `test/cli/install-args-parser.test.js`, `uninstall-args-parser.test.js`, `tool-args-parser.test.js`, `help-text-builder.test.js` | L3-11 | Architecture defect | Req 5 |
| 4 | **`cli-parsing.test.js` 與 `dispatch-table.test.js` 測試重疊**（FIX-16 延遲）：7 個 `parseArguments` 分類測試案例在兩個檔案間完全重複 | 雙向維護增加不一致風險。`dispatch-table.test.js` 另有 15 個 `run()` 整合測試為 `cli-parsing.test.js` 所無 | `test/cli-parsing.test.js`, `test/cli/dispatch-table.test.js` | 遍佈 | Redundant code | Req 5 |

---

## Cross-requirement Interaction Summary

發現總數 8 項（P2: 4, P3: 4）。依維度統計：
- **Spec implementation omission**: 2 項 (P2: 2)
- **Spec implementation deviation**: 1 項 (P2: 1)
- **Architecture defect**: 2 項 (P2: 1, P3: 1)
- **Redundant code**: 2 項 (P3: 2)

**Requirement Groups 分析**：

| Group | Requirements | Interaction Type | Summary |
|---|---|---|---|
| A | Req 1, Req 2, Req 3, Req 5 | Shared modules | Round 4 的 Group A 架構問題多數已修復，但殘留 3 項 P2（review-threads `_rawArgs`、codegraph SystemError 回歸、PlatformAdapter 消費缺口）以及 4 項 P3。SchemaOption `multiple` 支援雖已到位，但 review-threads 未遷移使 Req 1 的 schema 完整性在此工具失效。codegraph 的 SystemError 判斷回歸使 Req 3 的錯誤處理一致性受損 |
| B | Req 4 | Isolated | Coverage scope 未擴充，但 CI 雙平台基礎設施已修復 |

**互動層級專屬發現**：

| # | Description | Impact | Severity | Requirement |
|---|---|---|---|---|
| I1 | **review-threads `_rawArgs` 為唯一殘留的模組層級 mutable state**：find-github-issues 已遷移至 `multiple: true`，但 review-threads 仍使用 `_rawArgs` 繞道。此變數在 handler wrapper 中設定、handler 主體中消費，若執行次序變更有未初始化風險 | 使 SchemaOption `multiple` 支援的修復（FIX-09）在此工具上完全無效 | P2 | Req 1, Req 5 |
| I2 | **codegraph SystemError 判斷由 fix 引入的新回歸**：原始程式碼正確檢查 `error.code`，FIX-12 包裝為 SystemError 後 `sysError.code` 永遠為 `'SYSTEM_ERROR'`。此為修復引入的架構回歸，非既有問題 | 友善 MODULE_NOT_FOUND 提示可能在某些邊界情況下失效 | P2 | Req 3 |

---

## Fix Coverage Summary

前一輪審查（Round 4，2026-06-04）共發現 21 項問題（1 P1 + 11 P2 + 9 P3），本次審查結果：

| 狀態 | 數量 | 說明 |
|---|---|---|
| ✅ FIXED | 17 | 包含 1 P1（Windows CI bash）、11 P2 中 8 項、9 P3 中 6 項 |
| ❌ NOT FIXED | 2 | P2: review-threads `_rawArgs` 未遷移（Part of FIX-09）、Coverage scope Group 2 未擴充（FIX-08） |
| 🔴 NEW (regression) | 1 | P2: codegraph SystemError MODULE_NOT_FOUND 判斷回歸（FIX-12 引入） |
| ⏳ DEFERRED | 2 | P3: dist/ 匯入路徑（FIX-15）、測試重疊（FIX-16）— 與前一輪相同 |

17 項修復細節如下：

| 原因項 | 類別 | 檔案 | 修復方式 |
|---|---|---|---|
| FIX-01 (P1) | Windows CI bash | `.github/workflows/test.yml`, `package.json` | 改為 `bash scripts/test.sh` + env 語法 |
| FIX-02 (P2) | Handler catch 移除 | 5 個工具 index.ts | 外層格式化 try/catch 全部移除 |
| FIX-03 (P2) | Dead code | `packages/cli/index.ts` | 移除 platformAdapter 模組變數 |
| FIX-04 (P2) | spawn shell:true | `packages/cli/updater.ts` | 加入 `shell: true` |
| FIX-05 (P2) | isWindows + terminal.ts | `platform-adapter.ts`, `terminal.ts` | 新增介面方法 + 遷移消費者 |
| FIX-07 (P2) | SPEC.md c8→node | `SPEC.md` | 更新測試工具描述 |
| FIX-09+FIX-11 (P2) | SchemaOption multiple + AppError | `schema.ts`, `find-github-issues/index.ts` | 型別擴充 + _rawArgs 移除 |
| FIX-10 (P2) | StdioWriter type | `tool-registry/types.ts` | 加入 ToolContext 欄位 |
| FIX-12 (P3) | codegraph AppError | `codegraph/index.ts` | 加入 SystemError（但有回歸） |
| FIX-13 (P3) | open-github-issue Error→UserInputError | `open-github-issue/index.ts` | 14 處批次轉換 |
| FIX-14 (P3) | ToolArgsParser dispatch table | `cli/index.ts` | 整合進派發表格 |
| REGTEST-02 (P3) | 回歸測試 | `test/tools/handler-error-propagation.test.js` | 新增 6 個測試案例 |
| REGTEST-03 (P3) | 回歸測試 | `test/updater-extras.test.js` | 更換為 execCommand 測試 |
| REGTEST-04 (P3) | 回歸測試 | `test/tools/schema-multiple-args.test.js` | 新增 3 個測試案例 |

---

## Review History

### Round 4 — 2026-06-04

**Verdict**: Needs Work — 1 項 P1（Windows CI bash-only test.sh 中斷）、11 項 P2（PlatformAdapter 消費不足、工具錯誤處理架構偏離、覆蓋率範圍系統性缺口）、9 項 P3。

**Key findings (21 total):**
- **P1 × 1**：Windows CI 因 bash 語法中斷
- **P2 × 11**：Handler 重複 catch、PlatformAdapter 消費不足、SchemaOption 缺 multiple、AppError 基底檢查缺失、StdioWriter 型別缺失、Coverage 範圍缺口
- **P3 × 9**：codegraph/open-github-issue Error 型別、ToolArgsParser 未入 dispatch table、重複測試等

**Outcome**: 17/21 修復於 `df6f957`。2 項 P2 未處理（review-threads `_rawArgs`、Coverage scope），1 項 P2 為修復引入的回歸（codegraph SystemError 判斷），2 項 P3 延遲。

### Round 3 — 2026-06-04

**Verdict**: Needs Work — 1 P1（Windows CI bash 中斷），11 P2（PlatformAdapter 消費不足、工具錯誤處理架構偏離、覆蓋率範圍系統性缺口），9 P3。

**Key findings (21 total):**
- 與 Round 4 相同發現，因 Round 3 的 FIX.md 執行後再無獨立報告留存

### Round 2 — 2026-06-04

**Verdict**: Needs Attention — 2 項 P2（createToolRunner catch block 格式化失效 + 21/22 工具未採用 schema）。

**Key findings (2 total):**
- **P2 × 2**：createToolRunner catch block 使 typed error 格式化失效；多數工具未採用單一 schema 宣告機制

**Outcome**: 2 項全數修復（FIX-01 + FIX-02a/b/c/d），並修復 3 項回歸問題。

### Round 1 — 2026-06-04

**Verdict**: Needs Work — 1 項 P0（create-specs args 遺漏）、4 項 P1、13 項 P2、6 項 P3。

**Key findings (23 total):**
- **P0 × 1**：create-specs handler 呼叫 `parseArgs()` 時未傳遞 `args` 參數
- **P1 × 1**：單一 schema 宣告機制完全不存在
- **P2 × 13**：PlatformAdapter 未被消費；3 個工具未使用 AppError；錯誤輸出在 stdout；StdioWriter 未整合等

**Outcome**: 16 項修正於 `eecb6ce`、6 項修正於 `baec86f`、6 項 deferred。
