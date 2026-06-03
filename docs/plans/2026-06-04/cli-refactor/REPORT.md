# Review Report

- **Spec**: CLI 工具全面重構 (cli-refactor)
- **Date**: 2026-06-04
- **Reviewer**: Claude Code (agent-review)
- **Verdict**: Needs Attention

---

## Verdict

**Needs Attention** — 2 項 P2 (Requirement Risk)，無 P0/P1。前一輪的 P0 (create-specs args 遺漏) 與 3 項 P2 已全部修復。本輪的新發現集中於 `createToolRunner` 的錯誤格式化偏移與 schema 機制採用覆蓋率不足。

---

## Requirement Status Summary

| Requirement | Status | Evidence Location | Open Findings |
|---|---|---|---|
| Req 1 — Tool boilerplate reduction | ⚠️ Partial | `packages/tool-utils/schema.ts:28` (機制存在), `packages/tools/filter-logs/index.ts:89` (1/22 工具採用) | 1 P2 |
| Req 2 — Cross-platform abstraction | ✅ Complete | `packages/tool-utils/platform-adapter.ts` (定義+實作), `packages/cli/installer.ts:361`, `packages/cli/updater.ts:70` (消費), `packages/cli/index.ts:328,356` (StdioWriter 整合) | 0 |
| Req 3 — Unified error handling | ⚠️ Partial | `packages/tool-utils/app-error.ts` (階層), `packages/cli/index.ts:480-491` (邊界攔截), `packages/tool-utils/schema.ts:96-98` (deviation) | 1 P2 |
| Req 4 — Coverage >=80% + CI matrix | ✅ Complete | `.github/workflows/test.yml` (matrix), coverage: line 93.36%, branch 81.95%, func 94.87% (thresholds: 80/60/75) | 0 |
| Req 5 — Dispatch isolation | ✅ Complete | `packages/cli/parsers/types.ts:53-55` (CommandParser interface), `packages/cli/parsers/*` (3 個實作), `packages/cli/index.ts:95-200` (dispatch table) | 0 |

---

## Findings

### P2 — Requirement Risk

| # | Description | Impact | File | Line | Dimension | Requirement |
|---|---|---|---|---|---|---|
| 1 | **createToolRunner catch block 使 typed error 格式化失效**：`createToolRunner` 的內部 catch (L96-98) 攔截所有錯誤後以 `Error: ${message}` 統一格式輸出。當 handler 擲出 `UserInputError` 時，它被加上不應有的 `Error:` 前綴（正規格式應只有 message）；當擲出 `SystemError` 時，stack trace 遺失（正規格式應包含 `message + '\n' + stack`）。目前影響 filter-logs (唯一使用 `createToolRunner` 的工具) | 架構上偏離 SPEC Req 3 的「業務邏輯層拋例外 → 邊界層依類型格式化」設計。此工具若發生 SystemError，將缺少 stack trace 資訊 | `packages/tool-utils/schema.ts` | L96-98 | Spec implementation deviation | Req 3 (Req 1 間接影響) |
| 2 | **21/22 工具仍未採用單一 schema 宣告機制（前輪 P1 遺留）**：`ToolSchema` 介面與 `createToolRunner` 已定義、匯出、被 filter-logs 採用 (L89-93)，驗證了機制可行。但其餘 21 個工具仍分別以三份各自維護的程式碼（`parseArgs` options 定義、手寫 help 字串 block、事後 if 驗證）實作。前輪已標記為 deferred | 機制雖已存在，但廣泛採用不足導致：(1) 新工具開發者可能不知道應優先使用 schema 機制；(2) 既有工具隨 schema 演進可能脫離統一模式；(3) 維護負擔未實質減輕 | `packages/tools/*/index.ts` | 遍佈 | Spec implementation omission | Req 1 |

---

## Cross-requirement Interaction Summary

發現總數 2 項 (全部 P2)，依維度統計：
- **Spec implementation deviation**: 1 項 (P2: 1)
- **Spec implementation omission**: 1 項 (P2: 1)

**Requirement Groups 分析**：

| Group | Requirements | Interaction Type | Summary |
|---|---|---|---|
| A | Req 1, Req 3 | Shared module (`schema.ts`) | `createToolRunner` 同時服務 Req 1 (schema 簡化) 與 Req 3 (錯誤處理)。Finding #1 是交互層面的問題：採用 schema 機制 (Req 1) 時，會繼承統一的錯誤處理行為，但其 catch block 的泛型格式化與 Req 3 的 typed error 架構不一致 |
| B | Req 2 | Isolated | PlatformAdapter 與 StdioWriter 無跨需求交互衝突 |
| C | Req 4 | Isolated | CI 與覆蓋率設定獨立於架構變更 |
| D | Req 5 | Isolated | dispatch table 變更獨立於其他需求 |

---

## Fix Coverage Summary

前一輪審查（Round 1，2026-06-04）共發現 23 項問題（0 P0, 4 P1, 13 P2, 6 P3），兩波修正後狀態：

| 狀態 | 數量 | 說明 |
|---|---|---|
| ✅ FIXED (round 1, `eecb6ce`) | 16 | PlatformAdapter 消費、AppError 使用、parser 錯誤型別、dispatch table、CI 設定、catch block 分支、error boundary 測試、filter-logs --help 等 |
| ✅ FIXED (round 2, `baec86f`) | 6 | create-specs args 參數 (原 P0)、ToolSchema 定義與匯出、sync-memory-index SystemError stack trace、StdioWriter 整合、ToolNotFoundError 使用於 registry.ts、各工具錯誤處理統一 |
| 📋 Deferred | 6 | 單一 schema 大量採用（原 P1→P2）、tool-level help 統一 (P2)、coverage exclude (P2→設計決定)、package tests 排除 (P2→設計決定)、toolsHelp 外部依賴 (P3→正常耦合)、dist/ import 慣例 (P3→現有慣例) |
| 🆕 New (this round) | 2 | createToolRunner catch block typed error 格式化失效 (P2)、21/22 工具未採用 schema (P2，承接 deferred P1) |

---

## Review History

### Round 1 — 2026-06-04

**Verdict**: Needs Work — 1 項 P0 生產程式碼缺陷 (create-specs args 遺漏)、1 項 P1 (無單一 schema 機制)、4 項 P2。

**Key findings (23 total):**
- **P0 × 1**：create-specs handler 呼叫 `parseArgs()` 時未傳遞 `args` 參數，導致所有 positional argument 永遠為空，工具完全無法使用
- **P1 × 1**：單一 schema 宣告機制完全不存在，18 個工具全數各自維護 arg 定義、help 字串、事後驗證
- **P2 × 13**：PlatformAdapter 未被消費；3 個工具未使用 AppError；2 個工具錯誤輸出在 stdout；StdioWriter 未整合；sync-memory-index 無 stack trace；--home 錯誤正規化重複等
- **P3 × 6**：ToolNotFoundError dead code；filter-logs 無 --help；HelpTextBuilder 輸出測試不足等

**Outcome**: 16 項修正於 `eecb6ce`、6 項修正於 `baec86f`、6 項 deferred、2 項新發現。
