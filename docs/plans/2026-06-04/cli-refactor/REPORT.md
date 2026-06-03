# Review Report

- **Spec**: CLI 工具全面重構 (cli-refactor)
- **Date**: 2026-06-04
- **Reviewer**: Claude Code (agent-review)
- **Verdict**: Needs Work

---

## Verdict

**Needs Work** — 1 項 P1 (Requirement Defect) 導致至少 1 個需求僅被部分滿足，且 1 項 P0 級生產程式碼缺陷（非 SPEC 需求而未列於需求狀態表，但構成產品品質阻塞）。

---

## Requirement Status Summary

| Requirement | Status | Evidence Location | Open Findings |
|---|---|---|---|
| Req 1 — Tool boilerplate reduction | ⚠️ Partial | `packages/tools/create-specs/index.ts:42` | 1 P1 (新), 0 P2, 0 P3 |
| Req 2 — Cross-platform abstraction | ✅ Complete | `packages/cli/installer.ts:361`, `packages/cli/updater.ts:70` | 0 P1, 0 P2, 0 P3 |
| Req 3 — Unified error handling | ⚠️ Partial | `packages/tools/sync-memory-index/index.ts:127` | 0 P1, 1 P2 (新), 0 P3 |
| Req 4 — Coverage >=80% + CI matrix | ✅ Complete | `.github/workflows/test.yml`, coverage: line 93.40%, branch 81.92%, func 95.02% | 0 P1, 0 P2, 0 P3 |
| Req 5 — Dispatch isolation | ✅ Complete | `packages/cli/index.ts:95` (Map dispatch table), `packages/cli/types.ts:28` (type import) | 0 P1, 0 P2, 0 P3 |

---

## Findings

### P0 — Requirement Blocked

| # | Description | Impact | File | Line | Dimension | Requirement |
|---|---|---|---|---|---|---|
| 1 | **create-specs handler 呼叫 `parseArgs()` 時未傳遞 `args` 參數**：handler 在第 42 行呼叫 `parseArgs({options: {...}, allowPositionals: true})`，遺漏了 `args: args`。`parseArgs` 在無 `args` 參數時預設讀取 `process.argv.slice(2)`（Node.js CLI 引數），而非 handler 收到的工具引數。這導致所有 positional argument（如 featuer 名稱）永遠為空陣列，handler 總是在第 79 行擲出 `UserInputError('feature_name is required.')`。4 個既有測試全部失敗。此缺陷在重構提交 `2776a86` 中引入，已在上一輪審查中遺漏 | create-specs 工具完全無法使用；所有需要 feature_name 的功能路徑失效 | `packages/tools/create-specs/index.ts` | L42-53 (parseArgs call) | Spec implementation omission | Req 1 |

### P1 — Requirement Defect

| # | Description | Impact | File | Line | Dimension | Requirement |
|---|---|---|---|---|---|---|
| 2 | **仍無單一 schema 宣告機制（前輪遺留）**：SPEC 要求「arg 定義、help 文字、驗證邏輯全部來自同一個 schema 宣告」，但 18 個工具全數仍分別以三份各自維護的程式碼（`parseArgs` options 定義、手寫 help 字串 block、事後 if 驗證）實作。此項已在 FIX.md 中標記為「不在此階段處理」但仍為未滿足的 SPEC 需求 | Req 1 核心架構目標未達；新增工具仍需三處手動修改 | `packages/tools/*/index.ts` | 全數 | Spec implementation omission | Req 1 |

### P2 — Requirement Risk

| # | Description | Impact | File | Line | Dimension | Requirement |
|---|---|---|---|---|---|---|
| 3 | **sync-memory-index 的 SystemError 分支未輸出 stack trace**：FIX-E 統一修正了 8 個工具的 catch block，使 `SystemError` 輸出 `err.message + '\n' + err.stack`。但 `sync-memory-index`（FIX-B）的 catch block 對 `SystemError` 只輸出 `'Error: ' + err.message`，未輸出 stack trace，與統一的工具錯誤處理模式不一致 | 違反 SPEC 對 SystemError 應包含 stack trace 的紀律；日後除錯時無法從 sync-memory-index 取得 stack | `packages/tools/sync-memory-index/index.ts` | L127 | Spec implementation deviation | Req 3 |
| 4 | **StdioWriter 未被生產程式碼消費（前輪遺留）**：`StdioWriter` 介面與 `StdioWriterImpl` 類別已定義、測試、匯出（`packages/tui/stdio-adapter.ts`），但沒有任何生產程式碼呼叫 `createStdioWriter()`。所有 18 個工具仍透過 `context.stdout.write`/`stderr.write` 直接輸出。FIX-05 在 FIX.md 中被規劃為「在 cli/index.ts run() 中建立 StdioWriter 實例 + 加入 CliContext」但完全未實作 | 結構化輸出（`--json` 模式）雖然實作了但無法被觸發；18 個工具仍重複相同的 `stdout`/`stderr` fallback 樣板 | `packages/tui/stdio-adapter.ts` | L14-75 | Spec implementation omission | Req 2 |
| 5 | **Sync-memory-index 測試依賴實際 `run()` 而非獨立 handler 測試**：`test/tools/sync-memory-index-error.test.js` 透過 `run(['sync-memory-index', '--agents-file'])` 測試，依賴完整的 CLI 派發鏈而非單元測試 handler 的 catch block。當 `--agents-file` 的 `parseArgs` 擲回 `Error`（非 `UserInputError`）時，error boundary 以泛型處理，無法驗證 handler 內部的 `instanceof` 分支是否正確 | 測試覆蓋的程式碼路徑是 CLI boundary 而非 handler 的 catch block；若 handler catch block 壞掉，此測試無法捕捉 | `test/tools/sync-memory-index-error.test.js` | L19-77 | Test coverage gap | Req 3 |
| 6 | **ToolNotFoundError 仍為 dead code（前輪遺留）**：已定義、匯出、測試，但沒有任何生產程式碼擲出或捕捉它。FIX-J 僅新增了註解 | 無直接衝擊，但錯誤階層中有 1/4 的類別未被使用 | `packages/tool-utils/app-error.ts` | L57-62 | Redundant code | Req 3 |

---

## Cross-requirement Interaction Summary

發現總數 6 項（含 P0+P1+P2），依維度統計：
- **Spec implementation omission**: 3 項 (P0: 1, P1: 1, P2: 1)
- **Spec implementation deviation**: 1 項 (P2: 1)
- **Redundant code**: 1 項 (P2: 1)
- **Test coverage gap**: 1 項 (P2: 1)

**Requirement Groups 分析**：

| Group | Requirements | Interaction Type | Summary |
|---|---|---|---|
| A | Req 1, 3 | Shared module (`create-specs`, `sync-memory-index`) | 兩者皆為工具層級的錯誤處理不一致問題，但無直接功能耦合。各自獨立的程式碼缺陷 |
| B | Req 2 | None | StdioWriter 整合缺失孤立於其他需求之外 |

---

## Fix Coverage Summary

前輪審查報告（2026-06-04）共發現 23 項問題（0 P0, 4 P1, 13 P2, 6 P3），經由 fix commit `eecb6ce` 處理：

| 狀態 | 數量 | 說明 |
|---|---|---|
| ✅ FIXED | 16 | PlatformAdapter 消費、AppError 使用、parser 錯誤型別、dispatch table、CI 設定、catch block 分支、error boundary 測試、filter-logs --help 等 |
| 📋 Deferred | 7 | 單一 schema 宣告（P1→技術債）、tool-level help 統一（P2）、coverage exclude（P2→設計決定）、package tests 排除（P2→設計決定）、ToolNotFoundError dead code（P3→預留）、toolsHelp 外部依賴（P3→正常耦合）、dist/ import 慣例（P3→現有慣例） |
| ❌ Unfixed | 1 | StdioWriter 整合（P2）— FIX-05 在 FIX.md 中有規劃但未實作 |

---

## Review History

### Round 1 — 2026-06-04

**Verdict**: Needs Work — 4 項 P1 (Requirement Defect) 導致至少 3 個需求僅被部分滿足。

**Key findings (23 total):**
- **P1 × 4**：單一 schema 機制遺漏；PlatformAdapter 未被消費；3 個工具未使用 AppError；2 個工具錯誤輸出在 stdout
- **P2 × 13**：StdioWriter 未整合；--home 錯誤正規化重複；--symlink/--copy 衝突不透明；8 個工具泛型 catch；error boundary 測試不足；型別重複定義；dead code；CI 雙重執行等
- **P3 × 6**：ToolNotFoundError dead code；filter-logs 無 --help；HelpTextBuilder 輸出測試不足等

**Outcome**: 16 項修正於 commit `eecb6ce`，1 項有規劃未實作（StdioWriter），6 項標記為 deferred。
