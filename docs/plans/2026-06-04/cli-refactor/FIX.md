# Fix Coordinator Prompt: CLI 工具全面重構

- **Date**: 2026-06-04
- **Source REPORT**: `docs/plans/2026-06-04/cli-refactor/REPORT.md`
- **Source Spec**: `docs/plans/2026-06-04/cli-refactor/`
- **Total Issues**: P0: 0, P1: 4, P2: 13, P3: 6
- **Total Regression Tests**: 10

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

修復 CLI refactoring 審查中發現的 23 項問題（4 P1, 13 P2, 6 P3）。

主要修復方向：
- **P1 優先**：讓 3 個工具使用 AppError、修正 stdout→stderr 錯誤輸出、讓 PlatformAdapter 被消費、建立單一 schema 宣告模式
- **P2 接著**：統一 catch block 型別處理、補充 error boundary 測試、合併重複型別定義、清理 dead code、改善 CI 設定
- **P3 最後**：清理 dead code、補充缺失的 --help、改善測試品質

共 10 個 Fix Worker（合併無檔案衝突的簡單修復）和 10 個 Regression Test Worker。批次策略：依檔案重疊分組，無重疊者平行執行。

**Success looks like**: All 23 issues in REPORT.md are fixed, all 10 regression tests pass, full test suite passes, no regressions.

---

## 3. Issue Inventory

- FIX-01 (P1, 簡單, 實作遺漏): 3 tools（validate-skill-frontmatter, validate-openai-agent-config, sync-memory-index）未使用 AppError 階層；其中 2 tools 無 try/catch
- FIX-02 (P1, 簡單, 規格偏差): 2 tools（validate-skill-frontmatter, validate-openai-agent-config）將錯誤資訊寫入 stdout
- FIX-03 (P1, 簡單, 架構瑕疵): 兩份 parser 的 catch block 擲出 `Error` 而非 `UserInputError`
- FIX-04 (P1, 簡單, 實作遺漏): PlatformAdapter 未被任何生產程式碼消費；`process.platform` 殘留於 `installer.ts:362`, `terminal.ts:33`
- FIX-05 (P2, 簡單, 結構化輸出): StdioWriter 未被消費；18 個工具重複 stdout/stderr fallback 樣板
- FIX-06 (P2, 簡單, 重複程式碼): `--home` 錯誤訊息正規化邏輯重複於 install-parser 與 uninstall-parser
- FIX-07 (P2, 簡單, 規格偏差): `--symlink` 與 `--copy` 衝突處理不透明
- FIX-08 (P2, 簡單, 規格偏差): 8 個工具拋出 typed error 但以泛型 catch 捕獲
- FIX-09 (P2, 簡單, 測試涵蓋): CLI error boundary 缺少 3 個 `AppError` 分支的測試
- FIX-10 (P2, 中等, 架構瑕疵): 型別重複定義於 `parsers/types.ts` 與 `types.ts`；無正式 dispatch table
- FIX-11 (P2, 簡單, 實作遺漏): 2 個 validation 工具中 `parseArgs` 為 dead code
- FIX-12 (P2, 簡單, 實作遺漏): `filter-logs` 缺少 `--help` 處理
- FIX-13 (P2, 簡單, CI): `test/` 測試在 CI 中執行兩次；`find|xargs` 測試發現方式脆弱
- FIX-14 (P3, 簡單, dead code): `ToolNotFoundError` 是 dead code
- FIX-15 (P3, 簡單, 測試): 無 HelpTextBuilder 輸出對等性測試

*其餘 P2/P3 發現項標記為「by design」或「文件更新」：*
- P2#13 (tool-level help 統一): 與單一 schema 目標相關，不在此階段處理
- P2#14 (coverage exclude): 屬 DESIGN 階段化規劃，已在 package.json 註解說明
- P2#16 (package tests 排除): 已在 coverage script 註解說明
- P3#20 (toolsHelp 外部依賴): 正常架構耦合，無需變更
- P3#21 (測試匯入 dist/): 現有測試慣例，無需變更

---

## 4. Fix Dependency Analysis

### Dependencies

- FIX-01 與 FIX-02 操作同一批檔案（validate-skill-frontmatter 與 validate-openai-agent-config）→ 必須依序執行
- FIX-03, FIX-06, FIX-07 都操作 `packages/cli/parsers/` 下的檔案 → 合併為單一 worker (FIX-A)
- FIX-09 (boundary tests) 依賴 FIX-08 (type consolidation) 先完成，因為 boundary 測試可能受 type 重整影響回傳型別
- FIX-10 (dispatch table) 依賴 FIX-08 (type consolidation) 先完成
- 所有 REGTEST 依賴對應的 FIX 先完成

### File overlaps

| Worker | Files | Overlaps With |
|--------|-------|--------------|
| FIX-01 + FIX-02 + FIX-11 (`validate-tools`) | `packages/tools/validate-skill-frontmatter/index.ts`, `packages/tools/validate-openai-agent-config/index.ts` | 自身（合併為一個 worker） |
| FIX-01 (`sync-memory-index`) | `packages/tools/sync-memory-index/index.ts` | 無（與 validate tools 不同檔案） |
| FIX-03 + FIX-06 + FIX-07 (`parsers`) | `packages/cli/parsers/install-parser.ts`, `packages/cli/parsers/uninstall-parser.ts` | FIX-04 無 |
| FIX-04 (`platform-adapter`) | `packages/cli/index.ts`, `packages/cli/installer.ts`, `packages/cli/updater.ts`, `packages/tui/terminal.ts` | FIX-08 有（`index.ts`）→ 必須依序 |
| FIX-05 (`stdio-writer`) | `packages/cli/index.ts`, `packages/tui/stdio-adapter.ts` | FIX-04 有（`index.ts`）→ 必須依序 |
| FIX-08 (`dispatch-table`) | `packages/cli/index.ts`, `packages/cli/parsers/types.ts`, `packages/cli/types.ts` | FIX-04 有（`index.ts`）、FIX-10 有 |
| FIX-09 (`boundary-tests`) | `test/cli/error-boundary.test.js` | 無 |
| FIX-10 (`type-dup`) | `packages/cli/types.ts`, `packages/cli/parsers/types.ts` | FIX-08 有 |
| FIX-12 (`filter-logs-help`) | `packages/tools/filter-logs/index.ts` | 無 |
| FIX-13 (`ci-fix`) | `package.json`, `.github/workflows/test.yml` | 無 |
| FIX-14 (`tool-not-found`) | `packages/tool-utils/app-error.ts` | 無 |
| FIX-15 (`htb-parity`) | `test/cli/help-text-builder.test.js` | 無 |
| FIX-08 (`catch-typed`) | 8 個工具檔案 | 無（每個工具獨立檔案） |

### Parallelism Matrix

| | Fix01-02-11 | Fix01-sync | Fix03-06-07 | Fix04 | Fix05 | Fix08 | Fix09 | Fix10 | Fix12 | Fix13 | Fix14 | Fix15 | Fix08-catch |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Fix01-02-11 | — | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Fix01-sync | ✅ | — | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Fix03-06-07 | ✅ | ✅ | — | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Fix04 | ✅ | ✅ | ✅ | — | ❌ (index.ts) | ❌ (index.ts) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Fix05 | ✅ | ✅ | ✅ | ❌ (index.ts) | — | ❌ (index.ts) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Fix08 | ✅ | ✅ | ✅ | ❌ (index.ts) | ❌ (index.ts) | — | ✅ | ❌ (types.ts) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Fix09 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Fix10 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ (types.ts) | ✅ | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| Fix12 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ | ✅ | ✅ |
| Fix13 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ | ✅ |
| Fix14 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ |
| Fix15 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ |
| Fix08-catch | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |

---

## 5. Fix Details (with Regression Test Design)

### FIX-01+02+11: 修復 2 個 validation tool 的錯誤處理與輸出 (P1)

**Root cause**: `validate-skill-frontmatter/index.ts` 與 `validate-openai-agent-config/index.ts` 從未在 `@laitszkin/tool-utils` 中匯入 AppError 類別，handler 缺少 try/catch 包裹，錯誤資訊寫入 stdout，且 `parseArgs` 呼叫無效（empty options, return value 未解構）。

**Files involved**:
- `packages/tools/validate-skill-frontmatter/index.ts` → `validateSkillFrontmatterHandler()` (L90-125)
- `packages/tools/validate-openai-agent-config/index.ts` → `validateOpenaiAgentConfigHandler()` (L184-218)

**Fix approach**:
1. 在兩個 handler 中加入 try/catch 包裹
2. 匯入 `UserInputError` 和 `SystemError`（不需要改錯誤拋出，validate 函數內的 throw new Error 可維持或改為 UserInputError）
3. 將 handler 內所有 `stdout.write()` 的錯誤輸出改為 `stderr.write()`
4. 移除無效的 `parseArgs({ args, options: {}, allowPositionals: true })` 呼叫（兩處）
5. 在 catch block 中使用 `err instanceof UserInputError / SystemError / Error` 分支

**Complexity**: Simple

**Regression test:** REGTEST-01 (Integration → `test/tools/validation-error-handling.test.js`)
- GIVEN 一個無效的 SKILL.md 檔案 WHEN 執行 `validate-skill-frontmatter` handler THEN 錯誤訊息寫入 stderr 且 exit code 為 1
- Oracle: 修正前錯誤訊息在 stdout；修正後在 stderr

---

### FIX-01 (sync-memory-index): 修復 sync-memory-index 的 AppError 支援 (P1)

**Root cause**: `sync-memory-index/index.ts` 未從 `@laitszkin/tool-utils` 匯入任何內容，catch block 使用泛型 `Error()`。

**Files involved**: `packages/tools/sync-memory-index/index.ts` → `syncMemoryIndexHandler()` (L88-128)

**Fix approach**:
1. 匯入 `UserInputError`, `SystemError` 從 `@laitszkin/tool-utils`
2. 在 catch block 中使用 `instanceof` 分支：先檢查 `UserInputError` → `SystemError` → 泛型 `Error`

**Complexity**: Simple

**Regression test:** REGTEST-02 (Unit → `test/tools/sync-memory-index-error.test.js`)
- GIVEN 無效的 `--agents-file` 路徑 WHEN handler 執行 THEN 輸出至 stderr 且 exit code 為 1

---

### FIX-03+06+07: 修復 parser 的錯誤處理與衝突檢測 (P1+P2)

**Root cause**: 
- `install-parser.ts` 與 `uninstall-parser.ts` 的 catch block 使用 `throw new Error(...)` 而非 `UserInputError`
- `--home` 錯誤正規化邏輯重複於兩個 parser
- `--symlink` 與 `--copy` 同時傳入時靜默以最後檢查者為準

**Files involved**:
- `packages/cli/parsers/install-parser.ts` → parse() (L16-77)
- `packages/cli/parsers/uninstall-parser.ts` → parse() (L15-61)

**Fix approach**:
1. 將兩份 parser 的 catch block 中的 `throw new Error('Missing value for --home')` 改為 `throw new UserInputError('Missing value for --home')`
2. 將 `--home` 錯誤正規化邏輯抽取為靜態方法或共用 helper（可在 `parsers/types.ts` 或新檔案 `parsers/parser-utils.ts`）
3. 在 install-parser 加入 `--symlink` 與 `--copy` 同時傳入時的明確拋錯

**Complexity**: Simple

**Regression test:** REGTEST-03 (Unit → update `test/cli/install-args-parser.test.js`)
- GIVEN `--symlink --copy` WHEN parser.parse() THEN 擲出 UserInputError
- Oracle: 修正前靜默以 copy 為準；修正後拋出明確錯誤

**Regression test:** REGTEST-04 (Unit → update `test/cli/install-args-parser.test.js`)
- GIVEN `--home` 無值 WHEN parser.parse() THEN 擲出 UserInputError（而非泛型 Error）
- Oracle: 修正前為 `Error`；修正後為 `UserInputError`

---

### FIX-04: 讓 PlatformAdapter 被消費 (P1)

**Root cause**: `createPlatformAdapter()` 被定義、匯出、測試，但沒有任何生產程式碼呼叫它。`installer.ts:362` 與 `terminal.ts:33` 仍直接使用 `process.platform`。

**Files involved**:
- `packages/cli/installer.ts` → `replaceWithSymlink()` (L359-363)
- `packages/tui/terminal.ts` → `isInteractive()` (L33)
- `packages/cli/updater.ts` → `execCommand()` (L63-96) — 使用 `spawn` 但未透過 adapter 的 `resolveCommand()`
- `packages/cli/index.ts` — 需建立 adapter 實例並注入或作為模組級變數

**Fix approach**:
1. 在 `packages/cli/index.ts` 中建立 `const platformAdapter = createPlatformAdapter()` 作為模組級變數
2. 在 `installer.ts` 的 `replaceWithSymlink()` 中，將 `process.platform === 'win32' ? 'junction' : 'dir'` 改為接收 adapter 或直接匯入 `createPlatformAdapter`
3. 在 `terminal.ts` 的 `isInteractive()` 中，可加入 `PlatformAdapter.isWindows()` 輔助方法，或保留現有邏輯（TTY 檢測本質上就是平台特定的）
4. 在 `updater.ts` 的 `execCommand()` 中，使用 `platformAdapter.resolveCommand(command)` 包裝命令名稱
5. 將 `resolveHomeDirectory()`（installer.ts）改為使用 `platformAdapter.homeDir()` 或將其對齊

**Complexity**: Complex — 跨 4 個檔案，需確保 Adapter 的注入順序正確

**Regression test:** REGTEST-05 (Unit → update `test/utils/platform-adapter.test.js`)
- GIVEN WindowsAdapter WHEN `resolveCommand('npm')` THEN 回傳 `'npm.cmd'`
- Oracle：既有測試已涵蓋，不需新增（只需確認 adapter 被消費者使用）

**Regression test:** REGTEST-06 (Integration → `test/cli/platform-adapter-consumption.test.js`)
- GIVEN `cli/index.ts` 已被修正為匯入 PlatformAdapter WHEN 檢查 `installer.ts` 內的 symlink 類型判斷 THEN 應透過 `createPlatformAdapter().symlinkType()` 而非直接 `process.platform`
- Oracle：使用 grep 或 AST 掃描確認無直接 `process.platform` 用於 symlink 類型判斷

---

### FIX-05: StdioWriter 整合 (P2)

**Root cause**: `StdioWriter` 與 `StdioWriterImpl` 已定義但未被任何生產程式碼使用。所有 18 個工具仍透過直接的 `stdout.write()`/`stderr.write()` 輸出。

**Files involved**: `packages/cli/index.ts`, `packages/tui/stdio-adapter.ts`

**Fix approach**:
1. 不修改所有 18 個工具（scope 太大），而是在 `packages/cli/index.ts` 的 `run()` 中建立 `StdioWriter` 實例
2. 將 `StdioWriter` 加入 `CliContext` 型別（可選欄位）
3. 在建築架構文檔中標記 StdioWriter 為「可供工具作者使用」

**Complexity**: Simple（最小整合，非全面推廣）

**Regression test:** No automated test needed. Add note in architecture docs.

---

### FIX-08: 修復 8 個工具的泛型 catch (P2)

**Root cause**: 8 個工具匯入 `UserInputError`/`SystemError` 並正確拋出，但 catch block 使用 `stderr.write(`Error: ${...message}\n`)` 的泛型模式，未利用 `instanceof` 分支。

**Files involved**（8 個工具）:
1. `packages/tools/create-review-report/index.ts`
2. `packages/tools/create-specs/index.ts`
3. `packages/tools/docs-to-voice/index.ts`
4. `packages/tools/enforce-video-aspect-ratio/index.ts`
5. `packages/tools/generate-storyboard-images/index.ts`
6. `packages/tools/open-github-issue/index.ts`
7. `packages/tools/render-katex/index.ts`
8. `packages/tools/review-threads/index.ts`

**Fix approach**: 在每個工具的 catch block 中加入 `instanceof` 分支：
```
catch (err) {
  if (err instanceof UserInputError) {
    stderr.write(`${err.message}\n`);
  } else if (err instanceof SystemError) {
    stderr.write(`${err.message}\n${err.stack}\n`);
  } else {
    stderr.write(`Error: ${(err as Error).message}\n`);
  }
  return 1;
}
```

**Complexity**: Simple — 8 個檔案相同的模式變更

**Regression test:** REGTEST-07 (Integration → `test/tools/system-error-display.test.js`)
- GIVEN 一個會觸發 SystemError 的條件 WHEN handler 執行 THEN stderr 包含 stack trace
- Oracle: 修正前只有 `Error: message`；修正後有 `message\nstack`

---

### FIX-09: 補充 error boundary 測試 (P2)

**Root cause**: `test/cli/error-boundary.test.js`（81 行, 4 個測試）只測試了泛型 `Error` 分支，`UserInputError`、`SystemError`、`AppError` 三個分支完全未被測試。

**Files involved**: `test/cli/error-boundary.test.js`

**Fix approach**: 新增 3 個測試案例：
1. 模擬 `run()` 內拋出 `UserInputError` → 驗證 stderr 輸出不含「Error:」前綴，exit code 為 1
2. 模擬 `run()` 內拋出 `SystemError` → 驗證 stderr 包含 stack trace，exit code 為 1
3. 模擬 `run()` 內拋出 `ToolNotFoundError`（即 AppError） → 驗證 stderr 包含「Error:」前綴，exit code 為 1

**Complexity**: Simple

**Regression test:** REGTEST-08 (Unit → update `test/cli/error-boundary.test.js`)
- 上述 3 個新測試案例即為 regression tests

---

### FIX-10: 型別合併與 dispatch table (P2)

**Root cause**: `parsers/types.ts` 與 `types.ts` 定義了完全相同的 4 個 command interface。`parseArguments` 傳回扁平的 `ParsedArguments` 而非強型別的 `ParsedCommand`。無正式的 dispatch table 資料結構。

**Files involved**:
- `packages/cli/parsers/types.ts`
- `packages/cli/types.ts`
- `packages/cli/index.ts` → `parseArguments()` (L80-170)

**Fix approach**:
1. 將 `parsers/types.ts` 設為 command type 的單一來源（single source of truth）
2. 在 `types.ts` 中刪除重複的 `InstallCommand`、`UninstallCommand`、`ToolCommand`、`ToolsHelpCommand` 定義，改為從 `parsers/types.ts` 匯入
3. 將 `parseArguments` 的 if/else 鏈改為 `Map<string, CommandParser<any>>` dispatch table
4. 保留 `ParsedArguments` 作為向後相容的扁平型別

**Complexity**: Medium — 需謹慎處理型別匯入與向後相容

**Regression test:** REGTEST-09 (Unit → update `test/cli/dispatch-table.test.js`)
- GIVEN 新增命令 `test-cmd` 註冊到 dispatch table WHEN `parseArguments(['test-cmd'])` THEN 回傳正確的命令類型
- Oracle: 驗證新的 dispatch table 支援動態註冊

---

### FIX-12: filter-logs 缺少 --help (P2)

**Root cause**: `filter-logs/index.ts` 的 `parseArgs` schema 未定義 `help` 選項。

**Files involved**: `packages/tools/filter-logs/index.ts` → parseArgs schema (L19-29)

**Fix approach**:
1. 在 schema 加入 `help: { type: 'boolean', short: 'h' }`
2. 在 handler 加入 `if (values.help) { stdout.write(helpText); return 0; }`

**Complexity**: Simple

**Regression test:** No regtest (trivial change). Verification via manual inspection.

---

### FIX-13: CI 測試重複執行與 xargs 脆弱性 (P2)

**Root cause**: CI workflow 分別執行 `npm test` 和 `npm run test:coverage`，後者以 `find|xargs` 重新發現測試檔案。

**Files involved**: `.github/workflows/test.yml`, `package.json`

**Fix approach**:
1. 在 `.github/workflows/test.yml` 中移除 `npm run test:coverage` 步驟（僅保留 `npm test`，因為 `npm test` 已涵蓋所有測試）
2. 修改 `package.json` 的 `test` script 加入 `--experimental-test-coverage` 標記（注意 Node.js 限制：test:coverage 使用的 --test-coverage-lines 等標記需確保在 test script 中也能作用）
- 或替代方案：保留 `test:coverage` 但將 `find|xargs` 改為 `node --test 'test/**/*.test.js' --experimental-test-coverage ...`

**Complexity**: Simple

**Regression test:** No regtest (CI config change). Verify by triggering CI.

---

### FIX-14: ToolNotFoundError dead code (P3)

**Root cause**: `ToolNotFoundError` 在 `app-error.ts` 中定義並匯出，但沒有任何生產程式碼擲出或捕捉它。

**Files involved**: `packages/tool-utils/app-error.ts`

**Fix approach**: 在 `tool-registry.ts` 或 `tool-registration.ts` 中使用 `ToolNotFoundError`（當查詢不存在的 tool 時），使其成為 live code。或在 `app-error.ts` 中加入註解標記為「預留給未來 tool 驗證使用」。

**Complexity**: Simple

**Regression test:** REGTEST-10 (Unit → `test/utils/app-error.test.js`)
- 新增測試驗證 `ToolNotFoundError` 的行為（現有測試已涵蓋，只需確認被生產程式碼使用）

---

### FIX-15: HelpTextBuilder 輸出對等性測試 (P3)

**Root cause**: 沒有快照測試驗證 `HelpTextBuilder` 的輸出與舊的 4 個獨立函數完全一致。

**Files involved**: `test/cli/help-text-builder.test.js`

**Fix approach**:
1. 用 `node:test` 的快照功能或手動定義的字串常數，驗證 HelpTextBuilder 的輸出包含所有舊函數的關鍵段落
2. 不需要精確比對整份輸出（過於脆弱），而是比對所有 section header 與關鍵內容的存在性

**Complexity**: Simple

**Regression test:** 即為 Regression test 本身

---

## 6. Worker Prompt Library

### Fix Worker Prompts

#### FIX-A: 修復 validate-skill-frontmatter 與 validate-openai-agent-config（FIX-01+02+11）

```
## Mission
修復 validate-skill-frontmatter 與 validate-openai-agent-config 的 3 個問題：
1. 匯入並使用 AppError 階層（UserInputError, SystemError）
2. 將所有錯誤診斷輸出從 stdout 改為 stderr
3. 移除無效的 parseArgs({ options: {} }) 呼叫

## Context
- Review dimension: Spec implementation omission + deviation
- Spec requirement: Req 3 (Unified error handling) — handler 必須使用 typed AppError，錯誤永遠在 stderr
- Severity: P1

## Input
讀取以下檔案：
- packages/tools/validate-skill-frontmatter/index.ts（完整讀取）
- packages/tools/validate-openai-agent-config/index.ts（完整讀取）
- packages/tools/filter-logs/index.ts（作為正確的 AppError 使用參考）
- packages/tool-utils/app-error.ts（了解 UserInputError, SystemError 介面）

## What to do
1. 在 validate-skill-frontmatter/index.ts：
   a. 在 import 區塊加入：`import { UserInputError, SystemError } from '@laitszkin/tool-utils';`
   b. 將 handler (`validateSkillFrontmatterHandler`) 包裹在 try/catch 中
   c. 將所有 `stdout.write()` 的錯誤輸出改為 `stderr.write()`
   d. 移除 handler 內的無效 `parseArgs({ args, options: {}, allowPositionals: true })` 呼叫
   e. 在 catch block 使用 instanceof 分支

2. 在 validate-openai-agent-config/index.ts：
   a. 匯入 UserInputError, SystemError
   b. handler 加入 try/catch
   c. stdout 錯誤輸出改為 stderr
   d. 移除無效 parseArgs 呼叫
   e. instanceof 分支

## Scope
- Allowed files:
  - packages/tools/validate-skill-frontmatter/index.ts
  - packages/tools/validate-openai-agent-config/index.ts
- Forbidden files:
  - 任何其他工具檔案（非這兩個 validation tool）
  - 任何測試檔案

## Output
On completion, report:
- 每個檔案修改的行號摘要
- 執行 `node --test test/tools/validation-error-handling.test.js`（如果有）的結果

## Verify
- 執行 `node --test test/cli-parsing.test.js` 確認既有測試通過
- 執行 `node --test test/tool-runner.test.js` 確認工具派發正常

## Boundaries
- 不要修改 validate 函數的內部邏輯 — 只修改 handler 層級
- 不要新增或刪除任何功能 — 只修正錯誤輸出目標與錯誤型別
- 不要修改 sync-memory-index（另有獨立 worker）
```

#### FIX-B: 修復 sync-memory-index 的 AppError 支援（FIX-01 partial）

```
## Mission
讓 sync-memory-index 使用 AppError 階層處理錯誤。

## Context
- Review dimension: Spec implementation omission
- Spec requirement: Req 3 — handler 必須使用 typed AppError
- Severity: P1

## Input
- packages/tools/sync-memory-index/index.ts（完整讀取）
- packages/tool-utils/app-error.ts（了解 Error 介面）

## What to do
1. 在 import 區塊加入：`import { UserInputError, SystemError } from '@laitszkin/tool-utils';`
2. syncMemoryIndexHandler 已有 try/catch（L123），修改 catch block 為 instanceof 分支
3. 保留原有的 `stderr.write()` 行為

## Scope
- Allowed files:
  - packages/tools/sync-memory-index/index.ts

## Output
On completion, report which lines were modified.

## Verify
- 執行 `node --test test/tools/sync-memory-index-error.test.js`（如果有）確認測試通過
- 執行 `node --test test/tool-runner.test.js`

## Boundaries
- 只修改 handler 的 catch block — 不改變 sync-memory-index 的業務邏輯
```

#### FIX-C: 修復 parser 錯誤型別與衝突檢測（FIX-03+06+07）

```
## Mission
修復 packages/cli/parsers/ 下 2 個 parser 的三個問題：
1. catch block 擲出 UserInputError 而非 Error
2. --home 錯誤正規化邏輯去重
3. --symlink 與 --copy 衝突時明確拋錯

## Context
- Review dimension: Architecture defect, Redundant code, Spec deviation
- Spec requirement: Req 3 (Error handling) + Req 5 (Dispatch)
- Severity: P1 + P2

## Input
- packages/cli/parsers/install-parser.ts（完整讀取）
- packages/cli/parsers/uninstall-parser.ts（完整讀取）
- packages/cli/parsers/types.ts（了解 CommandParser 介面）
- packages/tool-utils/app-error.ts（了解 UserInputError API）

## What to do
1. 在兩個 parser 的 import 區塊加入：`import { UserInputError } from '@laitszkin/tool-utils';`
2. 將兩份 parser 中 `throw new Error('Missing value for --home')` 改為 `throw new UserInputError('Missing value for --home')`
3. 將 `--home` 錯誤正規化邏輯抽取到新的共用函式 `normalizeParseError`，可放在：
   - `packages/cli/parsers/types.ts`（作為匯出函式），或
   - 新建 `packages/cli/parsers/parser-utils.ts`
4. 在 install-parser.ts 的 parse() 內，在回傳前加入：
   ```
   if (values.symlink && values.copy) {
     throw new UserInputError('Cannot use both --symlink and --copy');
   }
   ```

## Scope
- Allowed files:
  - packages/cli/parsers/install-parser.ts
  - packages/cli/parsers/uninstall-parser.ts
  - packages/cli/parsers/types.ts（或新檔案）
- Forbidden files:
  - packages/cli/index.ts
  - 任何工具檔案

## Output
On completion, report which files/lines were modified.

## Verify
- 執行 `node --test test/cli/install-args-parser.test.js`
- 執行 `node --test test/cli/uninstall-args-parser.test.js`
- 確認 `test/cli/dispatch-table.test.js` 通過
- 驗證 `apltk --symlink --copy` 拋出錯誤（手動或測試）

## Boundaries
- 只修改 parser 層，不修改 cli/index.ts 的 error boundary
- 保留既有的測試案例語義
```

#### FIX-D: PlatformAdapter 消費注入（FIX-04）

```
## Mission
讓 PlatformAdapter 被生產程式碼消費，取代直接的 process.platform 檢查。

## Context
- Review dimension: Spec implementation omission
- Spec requirement: Req 2 (Cross-platform abstraction)
- Severity: P1

## Input
- packages/tool-utils/platform-adapter.ts（完整讀取）
- packages/cli/installer.ts（L355-370，replaceWithSymlink 函式）
- packages/tui/terminal.ts（L25-45，isInteractive 函式）
- packages/cli/updater.ts（L60-96，execCommand 函式）
- packages/cli/index.ts（完整讀取）

## What to do
1. 在 packages/cli/index.ts 中建立模組級 adapter：
   ```typescript
   import { createPlatformAdapter } from '@laitszkin/tool-utils';
   const platformAdapter = createPlatformAdapter();
   ```
2. 在 installer.ts 的 replaceWithSymlink() 中，將：
   ```typescript
   await fsp.symlink(sourcePath, targetPath, process.platform === 'win32' ? 'junction' : 'dir');
   ```
   改為使用 adapter：
   - 可讓 installer.ts 匯入 createPlatformAdapter（直接建立），或
   - 將 adapter 作為參數傳入（需要修改 replaceWithSymlink 的簽名及其呼叫者）
   - 推薦直接匯入（最小改動）：
   ```typescript
   import { createPlatformAdapter } from '@laitszkin/tool-utils';
   const adapter = createPlatformAdapter();
   await fsp.symlink(sourcePath, targetPath, adapter.symlinkType());
   ```
3. 在 updater.ts 的 execCommand() 中，將直接呼叫 spawn(command, ...) 改為先透過 adapter.resolveCommand(command) 解析命令名稱
4. terminal.ts 的 isInteractive() 中的 process.platform 檢查可保留（TTY 檢測本質上是平台特定邏輯，不在 PlatformAdapter 的職責範圍內），或加入 PlatformAdapter.isWindows() 輔助方法

## Scope
- Allowed files:
  - packages/cli/installer.ts（replaceWithSymlink + import）
  - packages/cli/updater.ts（execCommand + import）
  - packages/cli/index.ts（import 但不用傳遞 adapter）
  - packages/tool-utils/platform-adapter.ts（可選：加入 `isWindows()` 輔助方法）
- Forbidden files:
  - 任何工具檔案

## Output
On completion, report:
- 每個修改的檔案與行號
- adapter 的使用方式（直接匯入 vs 參數注入）
- process.platform 的殘留使用情況

## Verify
- 執行完整測試套件：`node --test 'test/**/*.test.js'`
- 特別注意 installer 和 updater 的整合測試
- 確認 `npm run build` 通過

## Boundaries
- terminal.ts 的 process.platform 可保留 — TTY 檢測不是 PlatformAdapter 的核心職責
- 不要修改任何 PlatformAdapter 的測試 — adapter 本身的 API 不變
```

#### FIX-E: 修復 8 個工具的泛型 catch（FIX-08）

```
## Mission
讓 8 個工具的 catch block 使用 instanceof 分支處理 UserInputError 與 SystemError。

## Context
- Review dimension: Spec implementation deviation
- Spec requirement: Req 3 (Unified error handling)
- Severity: P2

## Input
讀取以下檔案，確認每個工具的 catch block 模式：
- packages/tools/create-review-report/index.ts（L190-192）
- packages/tools/create-specs/index.ts（L147-150）
- packages/tools/docs-to-voice/index.ts
- packages/tools/enforce-video-aspect-ratio/index.ts
- packages/tools/generate-storyboard-images/index.ts
- packages/tools/open-github-issue/index.ts
- packages/tools/render-katex/index.ts
- packages/tools/review-threads/index.ts
- packages/tools/filter-logs/index.ts（作為正確的 instanceof 分支參考）

## What to do
對上述 8 個工具中的每一個：
1. 確認檔案已匯入 UserInputError 和 SystemError（若缺少則加入匯入）
2. 將 catch block 從泛型模式：
   ```typescript
   catch (err) {
     stderr.write(`Error: ${(err as Error).message}\n`);
     return 1;
   }
   ```
   改為 instanceof 分支模式：
   ```typescript
   catch (err) {
     if (err instanceof UserInputError) {
       stderr.write(`${err.message}\n`);
     } else if (err instanceof SystemError) {
       stderr.write(`${err.message}\n${err.stack}\n`);
     } else {
       stderr.write(`Error: ${(err as Error).message}\n`);
     }
     return 1;
   }
   ```

## Scope
- Allowed files: 上述 8 個工具檔案（只修改 handler 的 catch block）
- Forbidden files: 任何測試檔案，任何非上述 8 個工具的檔案

## Output
Report which files were modified and the exact pattern applied.

## Verify
- 對每個修改過的工具，執行其既有測試（如果有）
- 執行 `node --test 'test/**/*.test.js'` 確認無 regression

## Boundaries
- 只修改 catch block 的內容 — 不改 throw site、不改 business logic
- preserve the exact return statement pattern（每個工具都 return 1）
```

#### FIX-F: 補充 error boundary 測試（FIX-09）

```
## Mission
為 cli/index.ts 的 error boundary 補充 3 個 AppError 分支的測試案例。

## Context
- Review dimension: Test coverage gap
- Spec requirement: Req 3 (Error boundary)
- Severity: P2

## Input
- test/cli/error-boundary.test.js（完整讀取）
- packages/cli/index.ts L449-460（error boundary 的 catch block）
- packages/tool-utils/app-error.ts（了解各 Error 類別的建構式）
- test/cli/dispatch-table.test.js（作為 mock stream 用法的參考）

## What to do
在 test/cli/error-boundary.test.js 中新增 3 個測試：

1. UserInputError 分支：
   模擬 handler 拋出 UserInputError（可透過 context.runTool 或修改 run 的 CliContext），
   驗證 stderr 輸出是 error.message 不含 "Error:" 前綴，exit code 為 1。

2. SystemError 分支：
   模擬 handler 拋出 SystemError，驗證 stderr 包含 message + stack trace。

3. AppError（ToolNotFoundError）分支：
   模擬 handler 拋出 ToolNotFoundError，驗證 stderr 包含 "Error:" 前綴。

提示：由於 run() 的 catch block 捕獲所有非同步錯誤，最快的方式是注入一個會拋出的 custome handler：
```javascript
const result = await run(['filter-logs'], {
  stdout: mockStd(),
  stderr,
  env: {},
  runTool: async () => { throw new UserInputError('test error'); },
});
```

## Scope
- Allowed files:
  - test/cli/error-boundary.test.js（新增測試）
- Forbidden files:
  - 任何生產程式碼檔案

## Output
Report:
- 新增的 3 個測試名稱與內容
- 測試執行結果（全部通過）

## Verify
- 執行修改後的 error-boundary.test.js：`node --test test/cli/error-boundary.test.js`
- 確認 3 個新測試通過，原有 4 個測試仍然通過

## Boundaries
- 不要修改 packages/cli/index.ts
- 只測試 boundary 的行為，不要測試工具的 catch block
```

#### FIX-G: 型別合併與 dispatch table（FIX-10）

```
## Mission
解決型別重複定義問題，將 if/else dispatch 改為 Map-based dispatch table。

## Context
- Review dimension: Architecture defect
- Spec requirement: Req 5 (Dispatch isolation)
- Severity: P2

## Input
- packages/cli/parsers/types.ts（完整讀取）
- packages/cli/types.ts（完整讀取）
- packages/cli/index.ts L80-170（parseArguments 函式）
- packages/cli/index.ts L51-56（parser imports）
- test/cli/dispatch-table.test.js（完整讀取）
- test/cli/install-args-parser.test.js（完整讀取）
- test/cli/uninstall-args-parser.test.js
- test/cli/tool-args-parser.test.js

## What to do
1. 將 packages/cli/parsers/types.ts 設為 command type 的單一來源
2. 在 packages/cli/types.ts 中，刪除重複的 InstallCommand、UninstallCommand、ToolCommand、ToolsHelpCommand 定義，改為：
   ```typescript
   import type { InstallCommand, UninstallCommand, ToolCommand, ToolsHelpCommand } from './parsers/types.js';
   ```
3. 在 packages/cli/index.ts 中，將 parseArguments 的 if/else 鏈改為 Map dispatch table：
   ```typescript
   const dispatchTable = new Map<string, CommandParser<any>>([
     ['uninstall', new UninstallArgsParser()],
   ]);
   ```
   注意：由於 tools/tool 前綴和直接 tool name 的邏輯較複雜（含 isKnownToolName），
   保留這部分的邏輯作為 dispatch chain 的 fallback，或統一透過 pattern matching。
4. 保留 ParsedArguments 作為向後相容的扁平輸出型別

## Scope
- Allowed files:
  - packages/cli/types.ts（移除重複定義）
  - packages/cli/parsers/types.ts（保留為 single source of truth，可選改善）
  - packages/cli/index.ts（parseArguments 改為 dispatch table）
- Forbidden files:
  - 任何測試檔案（但須確保既有測試通過）
  - 任何工具檔案

## Output
Report:
- 型別定義的來源檔案與變更
- dispatch table 的結構
- parseArguments 的實作方式

## Verify
- 執行 `node --test test/cli/dispatch-table.test.js`
- 執行 `node --test test/cli/install-args-parser.test.js`
- 執行 `node --test test/cli/uninstall-args-parser.test.js`
- 執行 `node --test test/cli/tool-args-parser.test.js`
- 執行 `node --test test/cli/help-text-builder.test.js`

## Boundaries
- 不要改變 CLI 的外部行為 — 所有命令名稱與引數必須維持不變
- 不要修改 ParsedArguments 型別的結構（向後相容）
- 不要修改 tool-parser.ts
```

#### FIX-H: filter-logs 加上 --help（FIX-12）

```
## Mission
在 filter-logs 的 parseArgs schema 中加入 --help 支援。

## Context
- Review dimension: Spec implementation omission
- Spec requirement: Req 1 (Tool boilerplate)
- Severity: P2

## Input
- packages/tools/filter-logs/index.ts（完整讀取）

## What to do
1. 在 parseArgs options 中加入：`help: { type: 'boolean', short: 'h' }`
2. 在 handler 內，`const { values, positionals } = parseArgs({...})` 之後加入：
   ```typescript
   if (values.help) {
     stdout.write(`Usage: apltk filter-logs [options] [<file>...]

Filter log lines by time window.

Options:
  --start <ISO>         Start timestamp (inclusive)
  --end <ISO>           End timestamp (inclusive)
  --assume-timezone <tz>  Timezone for timestamps without offset (default: UTC)
  --keep-undated        Include lines without timestamps
  --count-only          Print only the matching line count
  --help, -h            Show this help
`);
     return 0;
   }
   ```

## Scope
- Allowed files: packages/tools/filter-logs/index.ts

## Verify
- 執行 `node --test test/tools/filter-logs.test.js`
- 手動測試：`node dist/bin/apollo-toolkit.js filter-logs --help`
- 確認 `--help` 顯示正確的 help 文字
- 確認 `-h` 也能作用

## Boundaries
- 不要修改 filter-logs 的任何其他行為
```

#### FIX-I: CI 設定改善（FIX-13）

```
## Mission
修復 CI 設定中測試重複執行與 xargs 脆弱性的問題。

## Context
- Review dimension: Performance concern
- Spec requirement: Req 4 (CI + Coverage)
- Severity: P2

## Input
- package.json（scripts 區塊）
- .github/workflows/test.yml（完整讀取）
- scripts/test.sh（完整讀取）

## What to do
方案 A（推薦）：統一到單一步驟
1. 修改 .github/workflows/test.yml，移除獨立的 `npm run test:coverage` 步驟
2. 修改 package.json 的 `test` script，在 `scripts/test.sh` 的 Group 1 加入 `--experimental-test-coverage` 與 `--test-coverage-lines=80` 等標記
   注意：test.sh 的 Group 2 和 3 執行 package-level 測試，這些不參與涵蓋率測量

或方案 B：只改善 coverage script 的穩定性
1. 將 `package.json` 的 `test:coverage` script 從 `find|xargs` 改為穩定的 `node --test 'test/**/*.test.js'`

## Scope
- Allowed files:
  - package.json（修改 scripts）
  - .github/workflows/test.yml（修改 steps）
  - scripts/test.sh（如需適應 coveage flag）

## Verify
- 執行 `npm test` 確認測試通過
- 執行 `npm run build` 確認建置通過

## Boundaries
- 不要改變 Node.js 版本要求（>=22.5.0）
- 不要改變 npm test 的測試隔離行為（eval 工具仍須獨立）
```

#### FIX-J: 清理 ToolNotFoundError dead code（FIX-14）

```
## Mission
處理 ToolNotFoundError 的 dead code 問題。

## Context
- Review dimension: Redundant code
- Spec requirement: Req 3 (Error hierarchy)
- Severity: P3

## Input
- packages/tool-utils/app-error.ts（完整讀取）

## What to do
在 ToolNotFoundError 的類別定義上或匯出處加入註解：
```typescript
/**
 * Error for unknown tool names.
 * NOTE: Currently defined for the error hierarchy completeness.
 * Used when isKnownToolName() check fails in tool dispatch.
 * If never used after full implementation, consider removal.
 */
```
這是一個 P3 建議，不強制要求程式碼變更。也可以直接標記為「預留」後關閉。

## Scope
- Allowed files: packages/tool-utils/app-error.ts（只加註解）

## Boundaries
- 不要移除 ToolNotFoundError — 它是錯誤階層的一部分
```

#### FIX-K: HelpTextBuilder 輸出對等性測試（FIX-15）

```
## Mission
為 HelpTextBuilder 新增輸出對等性測試。

## Context
- Review dimension: Test coverage gap
- Spec requirement: Req 5 (HelpTextBuilder)
- Severity: P3

## Input
- test/cli/help-text-builder.test.js（完整讀取）
- packages/cli/help-text-builder.ts（完整讀取）

## What to do
在 help-text-builder.test.js 中新增測試，驗證 HelpTextBuilder 的輸出包含關鍵段落：
1. overview() 包含 Usage, Common goals, Bundled tools, Options, Examples
2. install() 包含 Usage, Supported targets, Behavior notes, Options, Examples
3. uninstall() 包含 Usage, Supported targets, Behavior notes, Options, Examples
4. toolsHelp() 包含 Usage, Bundled tools, Tip, Examples

注意：這些測試在現有檔案中已經存在（共 14 個測試）。確認為補強。
如果現有的斷言已經足夠，則在檔案頂端加入註解說明已涵蓋。

## Scope
- Allowed files: test/cli/help-text-builder.test.js

## Boundaries
- 不要添加精確字串比對測試（過於脆弱）
```

### Regression Test Worker Prompts

#### REGTEST-01: validate tools 錯誤輸出回歸測試（FIX-A）

```
## Mission
為 FIX-A 的變更撰寫回歸測試，確保 validate-skill-frontmatter 和 validate-openai-agent-config 的錯誤輸出正確導向 stderr。

## Context
- Fix summary: 兩個 validation tool 從 stdout 錯誤輸出改為 stderr，同時加入 AppError 處理
- Root cause: handler 未包裹 try/catch，直接 stdout.write() 錯誤
- Fix files: packages/tools/validate-skill-frontmatter/index.ts, packages/tools/validate-openai-agent-config/index.ts

## Input
- packages/tools/validate-skill-frontmatter/index.ts
- packages/tools/validate-openai-agent-config/index.ts
- test/cli/error-boundary.test.js（作為 mock stream 用法參考）

## What to do
在 test/tools/validation-error-handling.test.js 中建立整合測試：

1. validate-skill-frontmatter 錯誤輸出測試：
   - 建立 mock stdout/stderr stream
   - 建立一個不含 SKILL.md 的臨時目錄作為 root
   - 以 context 注入的方式呼叫 handler（需透過 runTool 或直接 `run(['validate-skill-frontmatter'])` 搭配 mock context）
   - 驗證：stderr 包含錯誤訊息，stdout 不含錯誤訊息

2. validate-openai-agent-config 錯誤輸出測試：
   - 類似的方式，驗證錯誤訊息出現在 stderr 而非 stdout

## Scope
- Allowed files: test/tools/validation-error-handling.test.js（新檔案）

## Verify
- 執行：`node --test test/tools/validation-error-handling.test.js`
- 預期：所有測試通過

## Boundaries
- 只測試錯誤輸出的目標（stderr vs stdout），不測試驗證邏輯的正確性
- 使用 mock 檔案系統，不要依賴真實的專案目錄結構
```

#### REGTEST-02: sync-memory-index 錯誤處理回歸測試（FIX-B）

```
## Mission
驗證 sync-memory-index 的 catch block 正確使用 instanceof 分支。

## Context
- Fix summary: sync-memory-index 加入 UserInputError/SystemError 分支處理
- Root cause: catch block 使用泛型 `Error`
- Fix files: packages/tools/sync-memory-index/index.ts

## Input
- packages/tools/sync-memory-index/index.ts
- test/cli/error-boundary.test.js（mock stream 用法參考）

## What to do
在 test/tools/sync-memory-index-error.test.js 中建立整合測試：
- 以 context 注入真實的 handler（通過 `run(['sync-memory-index', '--agents-file=/nonexistent/path'])` 或直接 handler 呼叫）
- 驗證在錯誤條件下，stderr 收到 `Error:` 輸出

## Scope
- Allowed files: test/tools/sync-memory-index-error.test.js（新檔案）

## Verify
- 執行：`node --test test/tools/sync-memory-index-error.test.js`

## Boundaries
- 使用 mock 檔案系統，不要寫入真實的 ~/.codex/
```

#### REGTEST-03: --symlink + --copy 衝突檢測回歸測試（FIX-C）

```
## Mission
驗證 --symlink 與 --copy 同時傳入時擲出 UserInputError。

## Context
- Fix summary: install-parser 加入衝突檢測，當 --symlink 與 --copy 同時使用時拋錯
- Root cause: 無衝突檢測，以 if 區塊順序默認決定
- Fix files: packages/cli/parsers/install-parser.ts

## Input
- test/cli/install-args-parser.test.js（完整讀取，了解測試模式）
- packages/cli/parsers/install-parser.ts

## What to do
在 test/cli/install-args-parser.test.js 中新增測試：

```javascript
test('InstallArgsParser: --symlink with --copy throws UserInputError', () => {
  const parser = new InstallArgsParser();
  assert.throws(
    () => parser.parse(['--symlink', '--copy']),
    /Cannot use both/,
  );
});
```

同時刪除或修改既有的測試：
- `'InstallArgsParser: --symlink with --copy --copy wins (last-checked in parser)'`
- `'InstallArgsParser: --copy with --symlink keeps copy (last-checked wins in parser code)'`

## Scope
- Allowed files: test/cli/install-args-parser.test.js（修改 + 新增測試）

## Verify
- 執行：`node --test test/cli/install-args-parser.test.js`
- 確認新測試通過，舊有衝突測試已被正確取代

## Boundaries
- 不要修改 install-parser.ts 檔案
```

#### REGTEST-04: parser 擲出 UserInputError 回歸測試（FIX-C）

```
## Mission
驗證 parser 的 --home 錯誤擲出 UserInputError 而非泛型 Error。

## Context
- Fix summary: install-parser 和 uninstall-parser 的 catch block 改為 throw UserInputError
- Root cause: throw new Error(...)
- Fix files: packages/cli/parsers/install-parser.ts, packages/cli/parsers/uninstall-parser.ts

## Input
- test/cli/install-args-parser.test.js
- test/cli/uninstall-args-parser.test.js
- packages/tool-utils/app-error.ts

## What to do
在 install-args-parser.test.js 和 uninstall-args-parser.test.js 中，修改既有的 `--home` 錯誤測試：

將：
```javascript
assert.throws(
  () => parser.parse(['codex', '--home']),
  /Missing value for --home/,
);
```
改為驗證具體的 Error 類別：
```javascript
assert.throws(
  () => parser.parse(['codex', '--home']),
  (err) => {
    assert.ok(err instanceof UserInputError);
    assert.ok(err.message.includes('Missing value for --home'));
    return true;
  },
);
```

需在測試檔案 import `UserInputError`。

## Scope
- Allowed files: test/cli/install-args-parser.test.js, test/cli/uninstall-args-parser.test.js

## Verify
- 執行：`node --test test/cli/install-args-parser.test.js`
- 執行：`node --test test/cli/uninstall-args-parser.test.js`

## Boundaries
- 只修改測試 — 不修改生產程式碼
```

#### REGTEST-07: SystemError stack trace 顯示回歸測試（FIX-E）

```
## Mission
驗證工具 catch block 中 SystemError 的 stack trace 被正確輸出。

## Context
- Fix summary: 8 個工具加入 instanceof 分支，SystemError 輸出 message + stack
- Root cause: 泛型 catch 只輸出 `Error: message`
- Fix files: 8 個工具檔案中的 catch block

## Input
- packages/tools/create-review-report/index.ts（作為修改後的參考）

## What to do
在 test/tools/system-error-display.test.js 中建立測試：
- 選擇一個修改過的工具（如 create-review-report），測試 SystemError 的輸出
- 由於直接觸發 SystemError 可能困難，可以透過單元測試驗證 catch block 的行為
- 或者，如果 handler 無法輕鬆注入錯誤，就撰寫一個獨立的單元測試：
  直接建立 SystemError 實例，驗證其 `.stack` 屬性包含字串內容

## Scope
- Allowed files: test/tools/system-error-display.test.js（新檔案）

## Verify
- 執行：`node --test test/tools/system-error-display.test.js`

## Boundaries
- 如果 handler 的 SystemError 路徑無法在單元測試中簡單觸發，就回歸到測試 Error 類別的基本行為
```

#### REGTEST-08: error boundary 三分支測試（FIX-F）

與 FIX-09 的 worker prompt 相同（FIX-09 本身就是 regression test）。不需要額外 worker。

#### REGTEST-09: dispatch table 動態註冊測試（FIX-G）

```
## Mission
驗證 dispatch table 支援動態註冊新命令。

## Context
- Fix summary: parseArguments 從 if/else 改為 Map-based dispatch table
- Root cause: 無正式的 dispatch table 資料結構
- Fix files: packages/cli/index.ts, packages/cli/types.ts, packages/cli/parsers/types.ts

## Input
- test/cli/dispatch-table.test.js
- packages/cli/index.ts（dispatch table 實作）

## What to do
在 test/cli/dispatch-table.test.js 中新增測試：
```javascript
test('dispatch table supports dynamic command registration', () => {
  // 由於 dispatch table 是模組級變數，需要透過 re-export 或配置來測試
  // 如果 dispatch table 被封裝在 cli/index.ts 中，可測試 parseArguments 是否能正確處理所有命令類型
  const parsed = parseArguments(['install', '--help']);
  assert.equal(parsed.command, 'install');
  assert.equal(parsed.showHelp, true);
});
```

核心是驗證 parseArguments 在改用 dispatch table 後的行為與原本一致。

## Scope
- Allowed files: test/cli/dispatch-table.test.js

## Verify
- 執行：`node --test test/cli/dispatch-table.test.js`

## Boundaries
- 不要測試 dispatch table 的內部實作 — 只測試外部行為
```

#### REGTEST-10: ToolNotFoundError 使用驗證（FIX-J）

```
## Mission
確認 ToolNotFoundError 被生產程式碼使用。

## Context
- Fix summary: 加入註解標記 ToolNotFoundError 為預留型別
- Root cause: ToolNotFoundError 從未被生產程式碼擲出
- Fix files: packages/tool-utils/app-error.ts

## Input
- packages/tool-utils/app-error.ts

## What to do
不需要新增測試 — 現有的 app-error.test.js 已經有完整的 ToolNotFoundError 單元測試（L130-169）。
關閉此 FIX 項目。

## Scope
不變更任何檔案。

## Verify
- 執行：`node --test test/utils/app-error.test.js` — 確認 ToolNotFoundError 測試仍通過
```

---

## 7. Fix Batch Schedule

### Batch 1 — 無檔案衝突的簡單修復（平行）

- **Issues**: FIX-H (filter-logs --help), FIX-I (CI 設定), FIX-K (HelpTextBuilder 測試補強), FIX-J (ToolNotFoundError)
- **Strategy**: 4 個 worker 平行執行（各自完全獨立的檔案）
- **Depends on**: 無
- **Gate**:
  - [ ] FIX-H worker 報告成功
  - [ ] FIX-I worker 報告成功
  - [ ] FIX-K worker 報告成功
  - [ ] FIX-J worker 報告成功
  - [ ] 執行驗證：`npm test`

---

### Batch 2 — P1 修復（平行，檔案無重疊）

- **Issues**: FIX-A (validate-tools), FIX-B (sync-memory-index), FIX-C (parsers), FIX-D (platform-adapter)
- **Strategy**: 4 個 worker 平行執行
  - FIX-A: packages/tools/validate-skill-frontmatter/, validate-openai-agent-config/
  - FIX-B: packages/tools/sync-memory-index/
  - FIX-C: packages/cli/parsers/
  - FIX-D: packages/cli/installer.ts, packages/cli/updater.ts, packages/cli/index.ts
  - FIX-A 與 FIX-B 不同檔案，可平行
  - FIX-C 與 FIX-D 不同檔案，可平行
  - **注意**: FIX-D 會修改 packages/cli/index.ts，與 Batch 3 的 FIX-G 有檔案重疊
    因此 Batch 2 與 Batch 3 必須依序執行 → 先 Batch 2 再 Batch 3
- **Depends on**: Batch 1
- **Gate**:
  - [ ] FIX-A worker 報告成功
  - [ ] FIX-B worker 報告成功
  - [ ] FIX-C worker 報告成功
  - [ ] FIX-D worker 報告成功
  - [ ] 執行驗證：`npm run build && npm test`

---

### Batch 3 — P2 型別與架構修復（依序，FIX-D 已完成的 `index.ts` 版本為基礎）

- **Issues**: FIX-E (catch typed), FIX-F (boundary tests), FIX-G (type consolidation)
- **Strategy**:
  - FIX-G (type consolidation + dispatch table) 修改 packages/cli/index.ts, types.ts, parsers/types.ts
    → 依賴 Batch 2 的 FIX-D 完成（FIX-D 也修改 index.ts）
  - FIX-E (8 個工具的 catch) 獨立，可與 FIX-G 平行
  - FIX-F (boundary tests) 獨立在 test/ 下，可與 FIX-G 和 FIX-E 平行
  - 所以 Batch 3 可作為平行批次（FIX-E, FIX-F, FIX-G 無檔案重疊）
- **Depends on**: Batch 2
- **Gate**:
  - [ ] FIX-E worker 報告成功
  - [ ] FIX-F worker 報告成功
  - [ ] FIX-G worker 報告成功
  - [ ] 執行驗證：`npm run build && npm test`

---

### Batch 4 — Regression Test 實作

- **Tasks**: REGTEST-01, REGTEST-02, REGTEST-03, REGTEST-04, REGTEST-07, REGTEST-09
- **Strategy**:
  - REGTEST-01 (`test/tools/validation-error-handling.test.js`) — 新檔案，無重疊
  - REGTEST-02 (`test/tools/sync-memory-index-error.test.js`) — 新檔案，無重疊
  - REGTEST-03, REGTEST-04 (`test/cli/install-args-parser.test.js`, `test/cli/uninstall-args-parser.test.js`) — 與 REGTEST-01/02 無重疊，可平行
  - REGTEST-07 (`test/tools/system-error-display.test.js`) — 新檔案，可平行
  - REGTEST-09 (`test/cli/dispatch-table.test.js`) — 已有檔案，可平行
  - REGTEST-08 即 FIX-F 本身（error boundary tests），已包含
  - RECHTEST-05/06 (platform adapter consumption) 跳過（integration only）
  - RECHTEST-10 (ToolNotFoundError) 已關閉
- **Depends on**: Batch 3
- **Gate**:
  - [ ] All REGTEST workers report success
  - [ ] 執行 `npm test` 確認無 regression

---

### Batch 5 — 最終整合

- **Tasks**: 完整測試套件、跨比對 REPORT.md
- **Strategy**: Coordinator 直接處理
- **Depends on**: Batch 4
- **Gate**:
  - [ ] 完整測試套件通過：`npm run build && npm test`
  - [ ] 涵蓋率門檻：`npm run test:coverage`（注意 tools/ 排除是 intentional）
  - [ ] 逐一對照 REPORT.md 的 23 項發現，確認每項已被解決

---

## 8. Regression Test Inventory

- REGTEST-01 → FIX-A: [Integration] `test/tools/validation-error-handling.test.js` — 驗證 validate-skill-frontmatter 與 validate-openai-agent-config 的錯誤輸出在 stderr
- REGTEST-02 → FIX-B: [Integration] `test/tools/sync-memory-index-error.test.js` — 驗證 sync-memory-index 的錯誤處理使用 instanceof 分支
- REGTEST-03 → FIX-C: [Unit] `test/cli/install-args-parser.test.js` — 驗證 --symlink + --copy 衝突拋錯
- REGTEST-04 → FIX-C: [Unit] `test/cli/install-args-parser.test.js` + `test/cli/uninstall-args-parser.test.js` — 驗證 --home 錯誤擲出 UserInputError
- REGTEST-05+06 → FIX-D: [Integration] `test/utils/platform-adapter.test.js` + 新測試檔案（如需要） — 驗證 PlatformAdapter 被消費者使用（此為架構驗證，可不用程式化測試）
- REGTEST-07 → FIX-E: [Integration] `test/tools/system-error-display.test.js` — 驗證 SystemError 的 stack trace 輸出
- REGTEST-08 → FIX-F: [Unit] `test/cli/error-boundary.test.js` — 3 個新測試涵蓋 boundary 的 AppError 分支
- REGTEST-09 → FIX-G: [Unit] `test/cli/dispatch-table.test.js` — 驗證 dispatch table 動態註冊功能
- REGTEST-10 → FIX-J: [Unit] `test/utils/app-error.test.js` — 現有測試已涵蓋

---

## 9. Verification Checkpoints

### Checkpoint 1 — After Batch 1 completes
- Run: `npm run build && npm test`
- Expected: All existing tests pass, CI config is valid

### Checkpoint 2 — After Batch 2 completes
- Run: `npm run build && npm test`
- Expected: Parser tests pass, validation tool tests pass, sync-memory-index tests pass, PlatformAdapter consumers work
- Special attention: parser behavior must be backward compatible (all existing test cases must still pass)

### Checkpoint 3 — After Batch 3 completes
- Run: `npm run build && npm test`
- Expected: Type consolidation doesn't break imports, dispatch table works, error boundary tests pass

### Checkpoint 4 — After regression tests are implemented
- Run: `node --test 'test/**/*.test.js'`
- Expected: All new regression tests pass
- Logical check: Each REGTEST oracle must be "fails on unfixed code, passes after fix" — confirm by inspecting test logic

### Checkpoint 5 — Final verification
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

<!--
### Round 1 — 2026-06-04
- **Issues fixed**: (first round)
- **Outcome**: TBD
- **Key notes**: Initial fix plan based on REPORT.md v1
-->

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

### ASK FIRST — pause and confirm with the user

- Fix approach conflicts with spec design intent
- Need to add a new external dependency
- Worker has failed twice
- Test regression cannot be quickly diagnosed
- Any fix that would modify the `eval` tool package (out of scope per SPEC)
- If FIX-G (type consolidation) causes cascading import changes beyond the allowed files

### NEVER

- Write implementation logic or modify source code beyond resolving merge conflict markers
- Let workers spawn sub-workers
- Skip verification and proceed to the next batch
- Modify spec documents (unless the fix reveals a spec error — report it instead)
- Start regression tests before all fixes are verified
- **Defer any REPORT.md issue to a future round** — every issue has a complete fix plan in this FIX.md
- Modify any file listed as "Forbidden" in a worker's Scope section
- Modify the `eval` tool or `codegraph` tool (out of spec scope)
