# Review Report

- **Spec**: CLI 工具全面重構 (cli-refactor)
- **Date**: 2026-06-04
- **Reviewer**: Claude Code (agent-review)
- **Verdict**: Needs Work

---

## Verdict

**Needs Work** — 4 項 P1 (Requirement Defect) 導致至少 3 個需求僅被部分滿足。

---

## Requirement Status Summary

| Requirement | Status | Evidence Location | Open Findings |
|---|---|---|---|
| Req 1 — Tool boilerplate reduction | ⚠️ Partial | `packages/tools/*/index.ts` | 1 P1, 2 P2, 2 P3 |
| Req 2 — Cross-platform abstraction | ⚠️ Partial | `packages/tool-utils/platform-adapter.ts`, `packages/cli/installer.ts:362` | 1 P1, 3 P2, 2 P3 |
| Req 3 — Unified error handling | ⚠️ Partial | `packages/tool-utils/app-error.ts`, `packages/cli/index.ts:449-460` | 2 P1, 3 P2, 1 P3 |
| Req 4 — Coverage >=80% + CI matrix | ✅ Complete | `.github/workflows/test.yml`, `test/` | 0 P1, 3 P2, 0 P3 |
| Req 5 — Dispatch isolation | ⚠️ Partial | `packages/cli/parsers/*`, `packages/cli/index.ts:80-170` | 0 P1, 3 P2, 2 P3 |

---

## Findings

### P1 — Requirement Defect

| # | Description | Impact | File | Line | Dimension | Requirement |
|---|---|---|---|---|---|---|
| 1 | **無單一 schema 宣告機制**：SPEC 要求「arg 定義、help 文字、驗證邏輯全部來自同一個 schema 宣告」，但 18 個工具全數分別以三份各自維護的程式碼（`parseArgs` options 定義、手寫 help 字串 block、事後 if 驗證）實作，沒有任何工具具備單一 schema 宣告 | Req 1 核心功能未達；新增工具仍需三處手動修改 | `packages/tools/*/index.ts` | 全數 | Spec implementation omission | Req 1 |
| 2 | **PlatformAdapter 未被任何生產程式碼使用**：`createPlatformAdapter()` 被定義、匯出、測試，但沒有任何 `packages/cli/`、`packages/tools/` 或 `packages/tool-registry/` 的程式碼呼叫它。`packages/cli/installer.ts:362` 仍直接使用 `process.platform === 'win32'` 來決定 symlink 類型，`packages/tui/terminal.ts:33` 也保留直接 `process.platform` 檢查。抽象層與消費之間完全斷開 | Req 2 的統一抽象層未能覆蓋實際的平台分歧點；開發者仍需知道 `process.platform` | `packages/tool-utils/platform-adapter.ts` | L91-96 (`define`), L14-29 (`interface`) | Spec implementation omission | Req 2 |
| 3 | **3 個工具完全未使用 AppError 階層**：`sync-memory-index`、`validate-skill-frontmatter`、`validate-openai-agent-config` 未匯入任何 `AppError` 子類別。其中 `validate-skill-frontmatter` 和 `validate-openai-agent-config` 甚至沒有 handler-level 的 `try/catch` 包裹，非預期錯誤會以未格式化堆疊追蹤的方式傳播。`sync-memory-index` 使用了 `Error` 泛型捕獲 | 違反 SPEC「拋出具類別的 AppError」要求；錯誤路徑行為與其他 15 個工具不一致 | `packages/tools/validate-skill-frontmatter/index.ts`, `packages/tools/validate-openai-agent-config/index.ts`, `packages/tools/sync-memory-index/index.ts` | 全 handler | Spec implementation omission | Req 3 |
| 4 | **2 個工具將錯誤診斷資訊寫入 stdout**：`validate-skill-frontmatter`（L116-118）和 `validate-openai-agent-config`（L210-212）將驗證失敗的錯誤描述寫入 `stdout.write()`，而非 `stderr.write()` | 違反「錯誤永遠在 stderr」的不變量；在 pipe 環境中錯誤輸出會與正常輸出混合 | `packages/tools/validate-skill-frontmatter/index.ts`, `packages/tools/validate-openai-agent-config/index.ts` | L116-118, L210-212 | Spec implementation deviation | Req 3 |

### P2 — Requirement Risk

| # | Description | Impact | File | Line | Dimension | Requirement |
|---|---|---|---|---|---|---|
| 5 | **StdioWriter 未被消費**：`StdioWriter` 介面與 `StdioWriterImpl` 類別已定義、測試、匯出，但沒有任何生產程式碼呼叫 `createStdioWriter()`。所有 18 個工具仍透過 `context.stdout.write(stderr.write` 直接輸出，沒有 `--json` 模式的統一降階路徑 | 結構化輸出（`--json` 模式）雖然實作了但無法被觸發；18 個工具仍重複相同的 `stdout`/`stderr` fallback 樣板 | `packages/tui/stdio-adapter.ts` | L14-75 | Spec implementation omission | Req 2 |
| 6 | **8 個工具拋出具類別的錯誤但統一以泛型捕獲**：`create-review-report`、`create-specs`、`docs-to-voice`、`enforce-video-aspect-ratio`、`generate-storyboard-images`、`open-github-issue`、`render-katex`、`review-threads` 匯入了 `UserInputError`/`SystemError` 並在業務邏輯中拋出，但 catch block 只使用 `stderr.write(`Error: ${...message}\n`)` 的泛型模式。錯誤類別資訊在捕獲時被捨棄 | `SystemError` 要求的 stack trace 從未被工具層輸出；若日後新增含不同 statusCode 的子類別，這些工具會默默忽略 | `packages/tools/*/index.ts` | 各 handler catch | Spec implementation deviation | Req 3 |
| 7 | **CLI error boundary 測試涵蓋不足**：`test/cli/error-boundary.test.js`（81 行, 4 個測試）只測試了泛型 `Error` 分支（`--home` 無值、無效 mode），完全未測試 `UserInputError`、`SystemError`、`AppError`（`ToolNotFoundError`）三個分支到達 boundary 時的行為 | boundary 的 4 層 `instanceof` 檢查中有 3 層未被測試驗證 | `test/cli/error-boundary.test.js` | 全文件 | Test coverage gap | Req 3 |
| 8 | **無正式 dispatch table**：`parseArguments`（`packages/cli/index.ts:80-170`）仍以 `if/else` 鏈判斷命令類型，而非使用 `Map<string, CommandParser>` 或 `Record<string, CommandParser>`。雖然各 parser 類別已獨立存在，但「新增一個命令只需註冊一個 parser」的架構目標未達成 | 新增命令仍需修改 `parseArguments` 的 if/else 鏈，違反 SPEC「dispatch table entries can be independently added/removed」 | `packages/cli/index.ts` | L80-170 | Architecture defect | Req 5 |
| 9 | **型別重複定義在兩個檔案中**：`packages/cli/parsers/types.ts` 與 `packages/cli/types.ts` 定義了完全相同的 `InstallCommand`、`UninstallCommand`、`ToolCommand`、`ToolsHelpCommand` 介面。前者還定義了從未被匯入的 `ParsedCommand` union type。`parseArguments` 傳回舊的扁平 `ParsedArguments`，丟失了各 parser 提供的型別保證 | 新增命令類型需要同步修改兩個檔案；扁平回傳型別中所有欄位皆為 optional，執行期才能驗證 | `packages/cli/parsers/types.ts`, `packages/cli/types.ts` | 全文件 | Architecture defect | Req 5 |
| 10 | **`--symlink` 與 `--copy` 衝突默認處理不透明**：`InstallArgsParser` 以 if 區塊的順序（先檢查 `symlink` 再檢查 `copy`）作為最後勝者。使用者同時傳入 `--symlink --copy` 不會收到錯誤，而是靜默得到 copy 模式。反之 `--copy --symlink` 也得到 copy（因為 `symlink` 被 `copy` 覆蓋，然後 `symlink` 的 `true` 不再觸發第二次 | 使用者無法知道衝突被靜默解決，可能得到非預期的安裝模式 | `packages/cli/parsers/install-parser.ts` | L39-44 | Spec implementation deviation | Req 5 |
| 11 | **`--home` 錯誤訊息正規化邏輯重複**：`InstallArgsParser`（L54-59）和 `UninstallArgsParser`（L46-51）有完全相同的 catch block，依賴 `node:util.parseArgs` 的錯誤訊息字串比對來正規化 `Missing value for --home` | 6 行重複的 try/catch 邏輯；依賴 Node.js 內部錯誤訊息格式，跨版本脆弱 | `packages/cli/parsers/install-parser.ts`, `packages/cli/parsers/uninstall-parser.ts` | L54-59, L46-51 | Redundant code | Req 5 |
| 12 | **Parser 錯誤擲出 `Error` 而非 `UserInputError`**：兩個 parser 的 catch block 將 `parseArgs` 錯誤以 `throw new Error('Missing value for --home')` 重新擲出，而非 `throw new UserInputError(...)`。這導致 error boundary 的 `UserInputError instanceof` 分支永遠不會被 parser 錯誤觸發 | `UserInputError` 分支之路未被 parser 錯誤使用；Generic Error 輸出自帶 "Error:" 前綴 | `packages/cli/parsers/install-parser.ts`, `packages/cli/parsers/uninstall-parser.ts` | L57, L48 | Architecture defect | Req 3, Req 5 |
| 13 | **HelpTextBuilder 僅涵蓋 CLI 層級，未涵蓋工具層級 help**：HelpTextBuilder 提供 `overview()`、`install()`、`uninstall()`、`toolsHelp()`，但未提供從 `parseArgs` schema 自動產生工具 help 文字的機制。每個工具仍手寫 help 字串 | 工具參數變更時，開發者必須同步修改 `parseArgs` schema 和 help 字串兩處 | `packages/cli/help-text-builder.ts`, `packages/tools/*/index.ts` | 全文件 | Spec implementation omission | Req 1 |
| 14 | **`--test-coverage-exclude='packages/tools/**'` 使「總涵蓋率 >=80%」的說法不完整**：涵蓋率測量排除了 `packages/tools/` 下所有原始碼。雖然 DESIGN 以階段化開發（P2 才遷移工具）解釋此舉，但 SPEC Scope 提及「測試總涵蓋率 >=80%」，排除後的真實總涵蓋率可能遠低於 80% | SPEC 的「總」涵蓋率主張與實際測量範圍不一致 | `package.json` | L31 | Spec implementation deviation | Req 4 |
| 15 | **`test/` 下的測試在 CI 中執行兩次**：`npm test`（`scripts/test.sh`）已包含 `test/` 目錄的全部測試，`npm run test:coverage` 又重新發現並執行同一批測試 | 測試耗時加倍 | `.github/workflows/test.yml` | L20-21 | Performance concern | Req 4 |
| 16 | **Package-level 測試被排除在涵蓋率測量之外**：`test:coverage` script 只發現 `test/` 目錄下的 `.test.js` 檔案，不包含 `packages/` 目錄下的測試。`scripts/test.sh` 的 Group 2 和 3 則執行 package-level 測試 | 唯有 package-level 測試覆蓋到的程式碼路徑，對涵蓋率報告完全不可見 | `package.json` | L31 | Architecture defect | Req 4 |
| 17 | **2 個 validation 工具中 `parseArgs` 為 dead code**：`validate-skill-frontmatter`（L96-100）和 `validate-openai-agent-config`（L190-194）呼叫 `parseArgs({ args, options: {}, allowPositionals: true })` 但不解構回傳值。未定義任何選項，`allowPositionals: true` 只是將傳入的 `args` 放到 `positionals` 從不使用 | 無效的 `parseArgs` 呼叫，浪費函數呼叫但不影響行為 | `packages/tools/validate-skill-frontmatter/index.ts`, `packages/tools/validate-openai-agent-config/index.ts` | L96-100, L190-194 | Redundant code | Req 1 |

### P3 — Suggestion

| # | Description | Impact | File | Line | Dimension | Requirement |
|---|---|---|---|---|---|---|
| 18 | **`ToolNotFoundError` 是 dead code**：已定義、匯出、測試，但沒有任何生產程式碼擲出或捕捉它 | 無 | `packages/tool-utils/app-error.ts` | L52-58 | Redundant code | Req 3 |
| 19 | **`filter-logs` 缺少 `--help` 處理**：parseArgs schema 未定義 `help: { type: 'boolean' }`，沒有對應的 help 文字輸出 | 使用者無法取得 `filter-logs` 的使用說明 | `packages/tools/filter-logs/index.ts` | L19-29 | Spec implementation omission | Req 1 |
| 20 | **`toolsHelp()` 依賴外部 `buildToolDiscoveryHelp()`**：HelpTextBuilder 的 `toolsHelp()` 從 `@laitszkin/tool-registry` 匯入外部函數提供關鍵內容 | 外部套件變更可能靜默改變 CLI help 輸出 | `packages/cli/help-text-builder.ts` | L168 | Architecture concern | Req 5 |
| 21 | **測試匯入 `dist/` 而非 TypeScript 原始碼**：所有 parser 測試從 `../../packages/cli/dist/parsers/*.js` 匯入 | 未經 build 的原始碼變更無法被測試捕捉 | `test/cli/install-args-parser.test.js` 等 | L3 | Testability | Req 5 |
| 22 | **無 HelpTextBuilder 輸出對等性測試**：沒有快照測試或字串比較驗證 HelpTextBuilder 的輸出與舊的 4 個獨立函數完全一致 | HelpTextBuilder 的差異（空白、順序）不會被測試發現 | `test/cli/help-text-builder.test.js` | 全文件 | Test coverage gap | Req 5 |
| 23 | **`find | sort | tr | xargs` 測試發現方式在大規模時脆弱**：shell pipeline 組合在大測試量下可能因命令列過長而被 `xargs` 分割成多次 `node` 調用 | 只有最後一次調用的門檻結果決定 exit code | `package.json` | L31 | Performance concern | Req 4 |

---

## Cross-requirement Interaction Summary

發現總數 7+ 項（含 P1+P2+P3），依維度統計：
- **Spec implementation omission**: 6 項 (P1: 3, P2: 2, P3: 1)
- **Spec implementation deviation**: 4 項 (P1: 1, P2: 3)
- **Architecture defect**: 4 項 (P2: 4)
- **Redundant code**: 3 項 (P2: 2, P3: 1)
- **Performance concern**: 2 項 (P2: 1, P3: 1)
- **Test coverage gap**: 2 項 (P2: 1, P3: 1)
- **Testability**: 1 項 (P3: 1)

**Requirement Groups 分析**：

| Group | Requirements | Interaction Type | Summary |
|---|---|---|---|
| A | Req 1, 3, 5 | Shared modules + functional coupling + file overlap | CLI parser 與 error boundary 之間的型別中斷（parser 擲出 `Error` 而非 `UserInputError`）；雙重錯誤處理策略（工具自含 vs boundary 統一捕獲）導致 DESIGN 與實作不一致；`parseArguments` 成為 3 個需求的瓶頸，單一 schema 與 parser dispatch 存在架構衝突 |
| B | Req 2, 3 | Shared module (`tool-utils`) | PlatformAdapter 與 AppError 同在 `tool-utils` package，但前者未被消費，不存在實際的交互問題。兩者之間無介面依賴 |
| C | Req 4 | None | CI 與涵蓋率獨立在所有其他需求之外。無共享檔案或功能耦合。唯一交叉點是 `test/cli/error-boundary.test.js` 不足（已列為 P2 發現 #7） |

---

## Review History

*尚無前次審查記錄。*
