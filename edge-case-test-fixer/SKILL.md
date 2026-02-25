---
name: edge-case-test-fixer
description: Read code to identify edge cases, write tests that cover those edge cases, and fix the implementation if tests expose failures. Use when a user asks to add edge-case tests, harden behavior, or validate that existing code handles unusual inputs or error paths (e.g., empty data, nulls, boundaries, invalid formats, timeouts, retries).
---

# Edge Case Test Fixer

## Overview

Systematically harden code by identifying edge cases, writing tests that encode those behaviors, and applying minimal fixes until tests pass. Favor clarity and small, targeted changes.

Scope rule:
- If `git diff` is not empty, inspect only changed files and the minimum dependency chain.
- If `git diff` is empty, run a full-codebase edge-case scan. If actionable issues are found, create a git worktree, fix them there, then commit/push and open a PR.

## Workflow

### 0) 判斷掃描範圍（必做）
- 先執行 `git diff --name-only`。
- 若有 diff：只掃描變更檔案與最短必要呼叫鏈，依序執行步驟 1–5。
- 若無 diff：掃描整個專案，優先看核心 domain、外部 API 邊界、狀態/併發敏感模組，再依序執行步驟 1–6。
- 若無 diff 且找不到可行動的邊緣案例：明確回報「未發現可修復邊緣案例」，停止，不建立 worktree。

### 1) 建立事實基礎（依掃描範圍）
- 有 diff 時：讀取變更區塊與其直接相依（同檔或同模組內）段落。
- 無 diff 時：讀取候選高風險模組與其直接相依段落，避免無界展開。
- 視需要執行相關測試或最小重現；記錄目前行為與預期落差。
- 釐清輸入/輸出契約：型別、允許範圍、空值、錯誤處理方式。

### 2) 盤點邊緣案例（只選與掃描範圍直接相關者）
優先從以下類型挑選 2–5 個最有風險的案例：
- 空集合/空字串/None/null
- 邊界值：0、1、-1、最大/最小、溢位
- 重複/順序/排序假設
- 例外路徑：外部依賴失敗、超時、重試、部分資料缺失
- 格式錯誤：無效日期/時間區、無效字串格式、非預期型別
- 併發/重入：多次呼叫、狀態污染
- **架構層邊緣案例**：優先檢視併發/背壓/資源/超時傳播等跨模組風險
- **錯誤處理回滾**：跨模組/跨步驟中斷時，回滾點與回滾策略

需要更完整清單時，視變更類型讀：
- `references/architecture-edge-cases.md`
- `references/code-edge-cases.md`

#### 外部 API 特別要求
若變更涉及外部 API 呼叫，必須補上/驗證以下邊緣案例（視變更範圍最小化覆蓋）：
- **心跳/健康檢查**：有可用性驗證或可觀測的存活檢查路徑（或明確不需要的理由）。
- **錯誤降級**：至少涵蓋 429（限流）與 500（服務端錯誤）的處理與退避/降級策略。
- **錯誤日誌**：記錄關鍵欄位（狀態碼、請求識別、重試次數、延遲等），避免吞錯。

### 3) 寫測試（先寫失敗再修）
- 優先沿用現有測試風格與 fixtures；需要 mock 時使用既有工具。
- 每個邊緣案例一個測試，命名清楚描述行為。
- 只關注可觀測結果（回傳值、資料庫寫入、日誌、例外型別）。
- 外部 API 相關測試需涵蓋：429/500、重試/降級路徑、心跳/健康檢查行為（若有）。

### 4) 修復實作（最小改動）
- 以最小範圍修復：在問題來源處處理，不在上層做過度包裝。
- 保持既有 API 兼容；若需改契約，更新測試並明確記錄。
- 不做無關重構；避免新增未被測試覆蓋的行為。

### 5) 驗證與清理
- 重新跑相關測試；若新增暫存檔案或測試資料，完成後移除。
- 簡要說明新增的邊緣案例、測試與修復點。

### 6) 無 diff 且有修復時：建立 worktree、提交並開 PR
- 只在「無 diff 且找到可修復問題」時執行此步驟。
- 建立獨立分支與 worktree（分支名需用 `codex/` 前綴），在 worktree 內完成修改與測試。
- 修復完成後，直接使用 git 完成 commit 與 push。
- push 後建立 PR（例如使用 `gh pr create`），在 PR 內說明：邊緣案例清單、對應測試、修復摘要與風險。

## Test Design Hints
- 優先測「目前可錯」的地方，而不是理論上的所有可能。
- 如果失敗需要大量 setup，考慮縮小輸入或抽出 helper fixture。
- 對外部 I/O 使用 mock 或假物件，保持測試快且穩定。
