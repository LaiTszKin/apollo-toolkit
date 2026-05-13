---
name: systematic-debug
description: >-
  用於系統化排查程式問題。先釐清預期與實際行為，再對所有合理原因做可重現驗證，
  找出真正根因並以最小修復完成驗證；凡是出現 observed-vs-expected mismatch 都應優先使用。
---

# 系統化除錯

## Dependencies

- Required: 無
- Conditional: 視情況可搭配 `test-case-strategy`、`analyse-app-logs`
- Optional: 無
- Fallback: 無

## Standards

- Evidence: 先收集預期與實際行為、程式碼路徑、測試輸出與單一可信 runtime artifact，再判斷原因
- Execution: 為每個合理假設建立可重現證據，定位最後一個成功階段，再區分工具鏈、測試契約、測試隔離與產品邏輯問題
- Quality: 修復只針對真實根因；不能重現的假設必須明確排除；不得混用不同執行批次的證據
- Output: 產出根因候選、重現方式、最終分類、最小修復、驗證結果，以及在 runtime 問題中使用的 canonical evidence

## 技能目標

把「它應該做 X，實際卻做了 Y」這類問題轉成可驗證的除錯流程，避免靠猜測改碼，並確保最後交付的是已被重現、已被證明、已被驗證的修復。

## 驗收條件

- 已清楚記錄預期行為、實際行為、受影響路徑，以及 runtime 問題使用的單一 canonical 證據來源
- 所有合理根因都已被重現、驗證或明確排除，而不是只修第一個看起來像的原因
- 已區分問題屬於工具鏈 / 平台、測試契約過期、測試干擾、流程編排，還是真正的產品邏輯缺陷
- 最終修復是最小且聚焦的，並由失敗後轉成功的測試或 bounded rerun 證明有效

## 工作流程

1. 先整理使用者回報、測試輸出、日誌與程式碼路徑，明確寫出預期與實際差異；若問題涉及 runtime artifact，先指定一個 canonical run 或輸出目錄
2. 把流程拆成具體階段，例如 setup、startup、readiness、steady-state、persistence、shutdown，找出最後一個已確定成功的階段
3. 為每個合理根因建立重現方式；能用測試重現就優先用測試，涉及真實執行流程時則用相同模式的 bounded rerun，而不是中途切換到不同 fidelity 的環境
4. 若失敗只在平行執行、共享 shell-out、共享暫存路徑或舊報告路徑下出現，先調查測試隔離、共享狀態與 artifact routing 問題
5. 用重現證據確認真正根因，並明確排除非原因；若測試失敗其實來自 stale assertion 或 fixture drift，先修正測試契約，不要反向削弱產品行為
6. 實作最小修復並反覆驗證，直到所有重現案例、相關測試或 bounded rerun 都通過
7. 向使用者回報根因清單、最終分類、修復摘要、驗證結果，以及任何仍受限於執行環境或資料品質的部分

## 使用範例

- 「這個 API 應該回 200，現在卻變成 500」-> 先確認預期契約，再重現所有合理根因，最後定位是 handler 邏輯、依賴服務還是測試 fixture 問題
- 「測試單獨跑會過，但整個 suite 會 flaky」-> 優先排查共享狀態、鎖、暫存目錄與環境污染，而不是先改產品邏輯
- 「bounded run 幾乎沒有事件發生」-> 先沿著 lifecycle funnel 判斷停在哪個階段，再確認是 profile 過度破壞、編排錯誤，還是實際業務邏輯問題

## 參考資料索引

- `test-case-strategy`：需要補重現測試或 drift check 時使用
- `analyse-app-logs`：問題主要來自應用日誌時使用

