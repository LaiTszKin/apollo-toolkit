---
name: review-spec-related-changes
description: >-
  面向spec合規性的只讀審查技能。先唯一確定本次變更受哪一套 `docs/plans/...` 規劃文件約束，再按業務目標逐條判定 `Met`、`Partially met`、`Not met` 或 `Deferred/N/A`；`tasks.md` 的勾選不算證據。若範圍涉及代碼實作，完成業務結論後還必須對同一範圍追加 `review-change-set`、`discover-edge-cases` 與 `discover-security-issues`，並保持固定報告順序。
---

## 目標
輸出一份只讀的spec合規審查報告，先回答「這次變更是否真的滿足規劃中的業務要求」，再補充邊界、安全與代碼審查發現。報告需要對每條關鍵需求給出可追溯的狀態判定、證據來源、缺口說明、通過證據與剩餘不確定性；本技能不負責修改代碼或更新規劃文件。

## 驗收條件
- 在給出任何合規結論前，已唯一確定 governing spec；若存在兩個同樣合理的規劃根目錄且無法由倉庫證據消歧，必須停止並報告歧義，不能猜測。
- 每條業務目標或驗收項只能根據可驗證證據判定為 `Met`、`Partially met`、`Not met` 或 `Deferred/N/A`；證據可來自代碼、測試、命令、日誌或追蹤，`tasks.md` 勾選本身不算證據。
- 未滿足或部分滿足的必選業務要求永遠是最高嚴重度，報告排序中不得被安全、邊界或可維護性意見壓過。
- 若範圍涉及代碼實作，完成業務結論後必須在同一範圍追加 `review-change-set`、`discover-edge-cases` 與 `discover-security-issues`；任一依賴不可用時，不得輸出「完整通過」結論。
- 全流程保持只讀：不得修改實作、測試、spec、archive、commit、push、tag 或 release。
- 最終交付物固定按以下順序輸出：業務缺口 → 邊界情況 → 安全問題 → 代碼審查問題 → 已滿足要求的通過證據 → 剩餘不確定性。

## 工作流程
1. 確定 governing spec。
   - 若使用者已指定具體路徑，直接以該規劃目錄為準，閱讀 `spec.md`、`tasks.md`、`checklist.md`、`contract.md`、`design.md`，以及存在時的 `coordination.md`。
   - 若使用者未指定，需根據 `git status`、diff、相關路徑、近期提交與計劃目錄證據回推出唯一 spec；若仍有歧義，立即停止。
2. 建立spec基線。
   - 從 governing spec 中抽取業務目標、驗收條件、非目標、已明示的延期項與要求執行的驗證。
   - 將「產品必須做到什麼」和「代碼寫得是否漂亮」明確分開。
3. 蒐集實作證據並先做業務判定。
   - 閱讀最小必要代碼路徑、相關 diff、提交與測試，必要時執行 spec 點名且安全可跑的驗證命令。
   - 對每條需求給出 `Met`、`Partially met`、`Not met` 或 `Deferred/N/A`，並附上精確 spec 引用與代碼/測試證據。
   - 若 spec 中存在完全獨立的需求群組，可用只讀 subagent 並行評分；但最終排序、嚴重度與跨需求衝突整理由主代理負責。
4. 對代碼範圍追加次級審查。
   - 若審查對象包含代碼實作，必須在同一範圍追加 `review-change-set`、`discover-edge-cases` 與 `discover-security-issues`。
   - 優先以一個只讀 subagent 對應一個次級技能並行執行，主代理只負責聚合結果，不重跑已委派分析。
   - 若次級審查結果反過來影響某條業務需求的判定，必須先回寫業務結論，再輸出最終報告。
5. 生成固定順序的最終報告。
   - 先列出 `Not met` 與 `Partially met` 的業務缺口，再依序列出邊界情況、安全問題、代碼審查問題。
   - 接著補上所有已確認 `Met` 的通過證據。
   - 最後列出未驗證命令、無法映射的 spec 段落、外部依賴不可驗證處與其他剩餘不確定性。

## 使用範例
- 「這個 PR 有沒有滿足 `coordination.md` 和 `spec.md`？」-> 先唯一確定 governing spec，再按業務要求逐條打分，最後補上同範圍的邊界、安全與變更集審查。
- 「請檢查 `docs/plans/2026-05-01/foo/` 對應的實作是否完成」-> 直接以指定目錄為準做只讀合規審查，不依賴聊天上下文猜測。
- 「`tasks.md` 都打勾了，應該算完成吧？」-> 不能直接採信，仍需用代碼、測試、命令或追蹤證據重新驗證每條要求。
- 「先跟我講哪個 requirement 沒達成，再看程式碼好不好」-> 報告必須先輸出業務缺口，不能先用重構或風格意見掩蓋未滿足的spec要求。

## 參考資料索引
- `review-change-set`：在相同代碼範圍上補做架構與簡化審查，避免將spec合規與代碼品質混為一談。
- `discover-edge-cases`：在相同範圍上補做可重現邊界情況審查，補齊失敗路徑、併發與可觀測性風險。
- `discover-security-issues`：在相同範圍上補做可重現安全審查，補齊攻擊面、授權與資料外洩風險。
