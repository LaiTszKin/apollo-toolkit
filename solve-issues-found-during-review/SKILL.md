---
name: solve-issues-found-during-review
description: >-
  用於根據已確認的 review finding 清單逐項修復問題。必須按嚴重度排序、最小化修改、
  每項修完立即驗證，並在結束前證明 spec 合規與相關安全 / edge-case finding 已真正清乾淨。
---

# 修復審查發現的問題

## Dependencies

- Required: 使用者必須提供既有 review 報告或可重建的 finding 清單
- Conditional: `review-spec-related-changes`、`review-change-set`、`systematic-debug`、`discover-security-issues`、`discover-edge-cases`、`commit-and-push`
- Optional: 無
- Fallback: 若沒有可重建的 finding 清單就必須停止；若 `review-change-set` 不可用，至少要用針對性測試與 diff 證據補足；若使用者要求提交或推送但 `commit-and-push` 不可用，也必須停止

## Standards

- Evidence: 每個修改都要能對應到一條已確認 finding、受影響程式碼與驗證證據
- Execution: 依嚴重度由高到低處理，每項 finding 修完就驗證，再進入下一項；最後再做全域重驗證
- Quality: 僅修確認問題，不夾帶順手重構或推測性 hardening；不能重現時必須留下 `Could not reproduce` 證據
- Output: 交付逐項狀態、驗證證據、spec 合規結果、 ancillary review 清理結果，以及是否真正完成本輪修復

## 技能目標

把 review 報告中的 confirmed findings 轉成一條可追蹤、可驗證、可收斂的修復流程，避免只做表面修改，並在結束前證明相關spec、安全與 edge-case 要求沒有留下實質風險。

## 驗收條件

- 每個程式碼改動都能對應到明確的 finding，且沒有混入無關修補
- 所有 finding 均按嚴重度順序處理，並在每項修復後留下通過的驗證證據
- 若此範圍受 `docs/plans/...`、`spec.md`、`tasks.md`、`checklist.md` 或 contract 約束，最終已有 spec 合規證據
- 安全、edge-case 與其他隨附 review finding 已被修復或以可重現證據標記 `Could not reproduce`；若仍有 `Deferred`，只有在使用者明確縮 scope 時才能宣稱本輪完成

## 工作流程

1. 先完整閱讀 report 與受影響程式碼；若使用者只說「修 review finding」但沒提供內容，先嘗試從近期輸出或 diff 重建清單，重建失敗就停止
2. 擷取每條 finding 的嚴重度、標題、證據位置與重現方式，並排除沒有被 reviewer 明確確認的猜測性項目
3. 按 Critical -> High -> Medium -> Low 排序；只有在工作空間完全隔離且檔案不重疊時，才允許平行處理不同群組，否則一律串行
4. 逐條處理 finding：先讀程式碼與重現路徑，再用最小修改修復，立刻執行最窄且足夠的驗證；若驗證結果不清楚，交給 `systematic-debug`
5. 全部 finding 處理完後，對修改範圍做整體重驗證；若是 code-affecting 變更，重新跑 `review-change-set`
6. 若存在綁定 spec 或計劃檔，使用 `review-spec-related-changes` 證明已重新符合要求；若 inbound package 含安全或 edge-case finding，使用 `discover-security-issues` 或 `discover-edge-cases` 的 rerun / scoped proof 證明該維度已清空
7. 向使用者輸出逐項狀態、驗證命令、殘留阻塞與本輪是否真的完成；若要求提交或推送，再交給 `commit-and-push`

## 使用範例

- 「修這份 review 裡的 HIGH SSRF finding」-> 只修該 finding 對應路徑，跑針對性測試與重現命令，確認通過後才處理下一條
- 「report 裡還有 edge-case 與 security finding」-> 修完主問題後，還要補 rerun / scoped proof，不能只靠口頭說明就宣稱完成
- 「reviewer 指的路徑現在不存在」-> 記錄檢查過的 commit 與路徑，若無法重現則標成 `Could not reproduce`，而不是虛構一個修復

## 參考資料索引

- `review-spec-related-changes`：驗證修復後仍符合 spec / plan
- `review-change-set`：修復後的 code-affecting 差異重審
- `systematic-debug`：修復過程中遇到不明測試或 runtime 問題時使用
- `discover-security-issues`：清理安全 finding 時的 scoped proof
- `discover-edge-cases`：清理 edge-case / hardening finding 時的 scoped proof
- `commit-and-push`：使用者要求提交或推送時的最終交付流程
