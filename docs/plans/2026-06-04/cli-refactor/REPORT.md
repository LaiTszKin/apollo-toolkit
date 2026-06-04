# Review Report

- **Spec**: CLI 工具全面重構 (cli-refactor)
- **Date**: 2026-06-04
- **Reviewer**: Claude Code (agent-review)
- **Verdict**: Needs Work

---

## Verdict

**Needs Work** — 1 項 P1（Windows CI 因 bash 語法中斷），11 項 P2 涵蓋 PlatformAdapter 消費不足、工具錯誤處理架構偏離、覆蓋率範圍系統性缺口。前一輪 2 項 P2（createToolRunner catch 格式化 + schema 機制採用）已全數修復，但此輪發現數個架構層級的偏離。

---

## Requirement Status Summary

| Requirement | Status | Evidence Location | Open Findings |
|---|---|---|---|
| Req 1 — Tool boilerplate reduction | ⚠️ Partial | `packages/tools/*/index.ts`（19/19 工具已轉換），但 5 個 handler 含重複 catch | 3 P2, 3 P3 |
| Req 2 — Cross-platform abstraction | ⚠️ Partial | `packages/tool-utils/platform-adapter.ts`（interface 定義完整），但 `symlinkType` 外 3 項抽象無消費者 | 5 P2 |
| Req 3 — Unified error handling | ⚠️ Partial | `packages/tool-utils/app-error.ts`（層級正確）、`packages/cli/index.ts:480-491`（邊界攔截） | 2 P2, 2 P3 |
| Req 4 — Coverage >=80% + CI matrix | ⚠️ Partial | `.github/workflows/test.yml`（matrix 定義）、`scripts/test.sh`（coverage flags） | 1 P1, 3 P2, 1 P3 |
| Req 5 — Dispatch isolation | ✅ Complete | `packages/cli/parsers/*`（3 個 parser 實作 + 獨立測試） | 0 P0-P2, 6 P3 |

---

## Findings

### P1 — Requirement Defect

| # | Description | Impact | File | Line | Dimension | Requirement |
|---|---|---|---|---|---|---|
| 1 | **Windows CI 無法執行 bash-only test.sh**：`npm test` 執行 `COVERAGE=true scripts/test.sh`。`COVERAGE=true` 為 bash 語法；GitHub Actions Windows runner 的預設 shell（PowerShell/cmd.exe）無法解析該語法或執行 `.sh` 檔案。無 `cross-env` 套件或 `.npmrc` `script-shell` 設定 | SPEC Req 4 要求「CI pipeline 在 ubuntu-latest 與 windows-latest 兩者上都通過」。Windows runner 因 shell 解析失敗而中斷，此需求無法滿足。若分支保護規則要求所有 matrix entry 通過，Windows 的失敗直接阻擋合併 | `.github/workflows/test.yml` | L20 | Architecture defect | Req 4 |

### P2 — Requirement Risk

| # | Description | Impact | File | Line | Dimension | Requirement |
|---|---|---|---|---|---|---|
| 1 | **5 個工具 handler 層級包含與 createToolRunner 重複的錯誤處理**：render-katex、docs-to-voice、create-specs、sync-memory-index、review-threads 將商業邏輯包在 try/catch 中，手動格式化 UserInputError/SystemError/Error 並 return 1。createToolRunner schema.ts:97-106 已提供完全相同的錯誤包裝 | SPEC Req 1 要求「THEN tool 不需要自行實作錯誤處理」。5 個工具的 handler 層級 catch 偏離此規範。且因 handler catch 先攔截，[I2] createToolRunner 缺少 AppError 檢查也無法在此路徑觸發 | `packages/tools/render-katex/index.ts`, `docs-to-voice/index.ts`, `create-specs/index.ts`, `sync-memory-index/index.ts`, `review-threads/index.ts` | 遍佈 handler | Spec implementation deviation | Req 1, Req 3 |
| 2 | **sync-memory-index UserInputError 輸出含不應有的 `"Error:"` 前綴**：handler catch 對 UserInputError 使用 `stderr.write(\`Error: ${err.message}\n\`)`，而 createToolRunner 格式約定（schema.ts:99）為無前綴純訊息 | 偏離 FIX-01 建立的格式規則。若 handler 層級 catch 日後被移除（認為是重複程式碼），輸出格式會無聲改變，可能影響依賴此格式的外部解析 | `packages/tools/sync-memory-index/index.ts` | L126 | Spec implementation deviation | Req 1, Req 3 |
| 3 | **PlatformAdapter 跨平台封裝大量未被消費**：`normalizePath()`、`EOL` getter、`homeDir()` 三項抽象在 PlatformAdapter 中定義完整，但無任何消費者。`\n` 硬編碼遍佈寫入路徑（installer.ts:152,232-233；stdio-adapter.ts:33-65 共 6 處），`homeDir()` 被 installer.ts 自有的 `resolveHomeDirectory()` 取代 | SPEC Req 2 列舉的四項封裝（路徑、EOL、symlink、spawn）中，僅 `symlinkType()`（junction 降階）被消費。跨平台抽象層存在但實際未被使用 | `packages/tool-utils/platform-adapter.ts`（定義）、各消費者（installer, stdio-adapter, terminal） | 遍佈 | Spec implementation omission | Req 2 |
| 4 | **`index.ts:61` 模組級 `platformAdapter` 為 dead code**：`const platformAdapter = createPlatformAdapter()` 以模組層級宣告，整個 `index.ts` 無任何一處引用 | 模組層級變數無用，且 adapter 建立位置（index.ts:61）與唯一使用者（updater.ts:70 自行建立 adapter）不一致 | `packages/cli/index.ts` | L61 | Redundant code | Req 2 |
| 5 | **`spawn` 未傳遞 `shell: true`**：updater.ts 以 `adapter.resolveCommand()` 將 `npm` 改名為 `npm.cmd`，但 `spawn()` 完全未設定 `shell` 選項。SPEC 明確列出 `shell: true` 行為為 PlatformAdapter 四項封裝之一 | `.cmd` 解析部分處理了 Windows 需求，但未涵蓋 `shell: true` 的全部行為（PATH 解析、批次檔變數展開） | `packages/cli/updater.ts` | L70-74 | Spec implementation deviation | Req 2 |
| 6 | **`terminal.ts:33` 仍使用內聯 `process.platform` 判斷**：`isInteractive()` 直接判斷 `process.platform === 'win32'`，未透過 PlatformAdapter。DESIGN.md 第 74 行明確列出 terminal.ts:33 的 TTY 偵測應被 PlatformAdapter 取代 | 開發者新增 TTY 邏輯時仍可引入新的直接平台判斷，違反統一抽象層的封裝目標 | `packages/tui/terminal.ts` | L33 | Architecture defect | Req 2 |
| 7 | **`--experimental-test-coverage` 替代 `c8` 偏離 SPEC 工具選擇**：SPEC 明確要求「c8 報告的 line coverage >= 80%」，但實作使用 Node.js 內建 `--experimental-test-coverage` | 涵蓋率門檻等同有效，但偏離 SPEC 對工具選擇的明確規範。`--experimental-test-coverage` 不支援 `statements` 門檻 | `scripts/test.sh` | L12 | Spec implementation deviation | Req 4 |
| 8 | **涵蓋率僅量測 Group 1，覆蓋範圍系統性不完整**：3 組測試中僅 Group 1（`test/` 目錄）套用 coverage flags。非 tool package（cli、tool-utils、tool-registry、tui）若有程式碼僅由 Group 2/3 測試涵蓋，則不被覆蓋率測量追蹤。涵蓋率門檻無法作為整體測試品質的有效守門員 | Group 2/3 測試覆蓋的程式碼若出現低涵蓋率或回歸，不會被發現。目前以此範圍界定維持 80% 門檻，但需要認知到數字不代表全貌 | `scripts/test.sh` | L28-30 | Architecture defect | Req 4 |
| 9 | **`SchemaOption` 不支援 `multiple: true`，迫使工具使用繞道**：find-github-issues 與 review-threads 的 `--label` / `--thread-id` 需要重複旗標，因 Schema 不支援 `multiple`，被迫使用 `_rawArgs` 模組變數繞道手動呼叫 `parseArgs` | 偏離「引數定義、help 文字、驗證邏輯全部來自同一個 schema 宣告」的目標。模組變數 `_rawArgs` 在 createToolRunner 執行次序變更時有未初始化風險 | `packages/tool-utils/schema.ts` | L7-9 | Spec implementation omission | Req 1 |
| 10 | **`StdioWriter` 未在 `ToolContext` 型別中宣告**：cli/index.ts 建立 `createStdioWriter()` 實例並以 `stdioWriter` 傳入 tool handler context，但 `ToolContext` 型別無對應欄位 | DESIGN.md 架構描述的 StdioAdapter 輸出格式化抽象層無法被工具型別安全地存取 | `packages/tool-registry/types.ts` | L28-36 | Architecture defect | Req 1 |
| 11 | **`createToolRunner` catch 缺少 `AppError`（基底類別）檢查**：schema.ts:97-104 的 catch 檢查 `UserInputError`、`SystemError`、通用 `Error`，但跳過 `AppError`。與 `run()` 的 catch（L480-491）有明確的 `AppError` 分支不一致 | 若工具擲出 `new AppError(...)`（不透過子類別），createToolRunner 歸入通用分支，無法利用 `.code` / `.details` 屬性 | `packages/tool-utils/schema.ts` | L97-104 | Architecture defect | Req 1, Req 3 |

### P3 — Suggestion

| # | Description | Impact | File | Line | Dimension | Requirement |
|---|---|---|---|---|---|---|
| 1 | **codegraph handler 未使用 AppError 子類別**：catch 區塊使用泛型 Error 而非 `SystemError`/`UserInputError`。codegraph 為唯一不使用 createToolRunner 的非 out-of-scope 工具 | 輕微偏離 AppError 層級規範，功能正確（stderr + return 1） | `packages/tools/codegraph/index.ts` | L42-47, L140-147 | Spec implementation omission | Req 3 |
| 2 | **open-github-issue 驗證使用泛型 Error 而非 `UserInputError`**：`hydrateArgs`、`validateIssueContent` 拋出 `new Error()` 而非 UserInputError | 使用者輸入錯誤顯示不一致的 `"Error:"` 前綴 | `packages/tools/open-github-issue/index.ts` | L626,637,655,667 | Spec implementation omission | Req 3 |
| 3 | **ToolArgsParser 未納入派發表格**：派發表格僅註冊 install/uninstall parser。ToolArgsParser 透過獨立 if-else 分支 (L136-166) 實例化呼叫 | 若要新增非 install/uninstall 的命令類別，不能只加入派發表格 | `packages/cli/index.ts` | L95-98, L136 | Spec implementation deviation | Req 5 |
| 4 | **`helpTopic` 型別從精確聯合放寬為 `string`**：`ParsedArguments` 介面中 `helpTopic: string` 失去 parser 層的 `'overview' \| 'install' \| 'uninstall'` 型別精確度 | 編譯期型別安全縫隙，消費端靠執行時字串比對 | `packages/cli/types.ts` | L45 | Architecture defect | Req 5 |
| 5 | **部分測試匯入 `dist/` 而非套件名**：parser 單元測試匯入 `../../packages/cli/dist/parsers/...`，而 dispatch-table.test.js 使用 `@laitszkin/cli` 套件名 | 若 `tsconfig` 映射變更，dist/ 路徑可能失效 | `test/cli/install-args-parser.test.js` 等 4 檔案 | L3-11 | Architecture defect | Req 5 |
| 6 | **`cli-parsing.test.js` 與 `dispatch-table.test.js` 測試重疊**：7 個 parseArguments 分類測試案例在兩個檔案間完全重複 | 雙向維護增加不一致風險，建議確認無覆蓋缺口後移除舊檔案 | `test/cli-parsing.test.js`, `test/dispatch-table.test.js` | 遍佈 | Redundant code | Req 5 |
| 7 | **`buildTimezone` 為多餘包裹函數**：僅作 `return parseTimezoneOffset(raw)`，而 parseTimezoneOffset 為同一檔案內的內部函數 | 增加無涵蓋率程式碼 | `packages/tool-utils/dist/log-utils.js` | L142-144 | Redundant code | Req 4 |
| 8 | **InstallArgsParser 在預設路徑下被實例化兩次**：每呼叫 `parseArguments`，Map 建立 InstallArgsParser，但當 firstArg 非 dispatch entry 且非工具名時被丟棄，L186 又建立一次 | 功能正確，parser 無狀態輕量，僅微小程式碼組織浪費 | `packages/cli/index.ts` | L96, L186 | Performance concern | Req 5 |
| 9 | **`parseArguments` `tool→tools` 正規化與 `ToolArgsParser` 內部處理重疊**：兩處對同一件事各自維護一份副本 | 脫鉤風險 | `packages/cli/index.ts:86-89` vs `packages/cli/parsers/tool-parser.ts:18-21` | — | Redundant code | Req 5 |

---

## Cross-requirement Interaction Summary

發現總數 21 項（P1: 1, P2: 11, P3: 9）。依維度統計：
- **Spec implementation deviation**: 4 項 (P2: 4)
- **Spec implementation omission**: 4 項 (P2: 2, P3: 2)
- **Architecture defect**: 6 項 (P1: 1, P2: 4, P3: 1)
- **Redundant code**: 6 項 (P2: 1, P3: 5)
- **Performance concern**: 1 項 (P3: 1)

**Requirement Groups 分析**：

| Group | Requirements | Interaction Type | Summary |
|---|---|---|---|
| A | Req 1, Req 2, Req 3, Req 5 | Shared modules (`schema.ts`, `index.ts`, `app-error.ts`, `platform-adapter.ts`) | Req 1 與 Req 3 透過 schema.ts 共享 createToolRunner 錯誤處理機制。Finding #1（handler 重複 catch）使統一錯誤邊界架構失效。`_rawArgs` 模組變數 (P2 #9) 透過繞過 Schema 的 `multiple` 限制使 Req 1 的 schema 完整性在 Req 5 dispatch 順序變更時有失效風險。Req 2 的 PlatformAdapter 僅 `symlinkType` 被消費 |
| B | Req 4 | Isolated | CI 與覆蓋率設定獨立於其他需求的架構變更 |

**互動層級專屬發現**：

| # | Description | Impact | Severity | Requirement |
|---|---|---|---|---|
| I1 | **`_rawArgs` 模組層級 mutable state 在 dispatch 順序變更時的風險**：find-github-issues 與 review-threads 使用模組層級 `_rawArgs` 繞過 Schema `multiple` 限制。`_rawArgs` 由 handler wrapper 在 createToolRunner 之前設定或 handler 主體內設定。若 dispatch 順序變動，此變數可能在 createToolRunner 執行時尚未初始化 | 2 個工具在 dispatch 重構後可能無聲失效，雙重解析模式無文件說明 | P2 | Req 1, Req 5 |
| I2 | **handler 層級 try/catch 使單一錯誤邊界架構失效**：5 個工具（P2 #1 所列）在 `schema.handler` 內擁有完整 try/catch 錯誤處理，攔截但不重新拋出錯誤，使 createToolRunner 的 catch（schema.ts:97-106）完全被繞過。實務上有三個獨立邊界（handler → createToolRunner → run()）同時處理錯誤 | 若未來在任何層級加入橫切關注（telemetry、結構化錯誤格式化），handler 層級的 catch 會使其中 5 個工具失效 | P2 | Req 1, Req 3 |
| I3 | **`run()` 的 `return (context.runTool \|\| runTool)(...)` 無 `await` 經確認為假警報**：在 `async` 函數中，`return promise` 等同 `await promise; return`，錯誤邊界可正確捕捉所有 rejection | 無影響 | — | Req 3, Req 5 |

---

## Fix Coverage Summary

前一輪審查（Round 2，2026-06-04）共發現 2 項 P2，兩波修正後狀態：

| 狀態 | 數量 | 說明 |
|---|---|---|
| ✅ FIXED (FIX-01) | 1 | createToolRunner catch block typed error 格式化——schema.ts 現正確區分 UserInputError（無前綴）、SystemError（含 stack）、泛型 Error |
| ✅ FIXED (FIX-02a/b/c/d) | 1 | 19/19 in-scope 工具轉換為 ToolSchema（7 簡易 + 4 GitHub + 4 中階 + 3 複雜），2 個剩餘工具（codegraph、eval）明確屬於 out-of-scope |
| ✅ FIXED (regressions) | 3 | validate-skill-frontmatter/validate-openai-agent-config stdout→stderr；schema-arg-validation strict:false 分類；architecture createToolRunner 繞回 |
| 🆕 New (this round) | 21 | 見 Findings 表格——1 P1 + 11 P2 + 9 P3 |

---

## Review History

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
