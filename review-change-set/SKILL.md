---
name: review-change-set
description: >-
  面向當前 `git diff` 的只讀審查技能。先從架構與模組邊界切入，再檢查是否存在真正能降低複雜度的簡化機會；忽略對話偏見，不做 style-only 評論。當變更跨多個檔案或模組時，優先按 scope cluster 派發只讀 subagent，各自讀完整個責任區後回傳結構化發現，由主代理統一去重與彙總。
---

## 目標
輸出一份針對活躍變更集的審查報告，聚焦真正有價值的架構問題與可維護性簡化機會，而不是風格雜訊。報告需要標明審查範圍、staged/unstaged 狀態、已確認的架構問題、已確認的簡化建議，以及剩餘不確定性。

## 驗收條件
- 已完整覆蓋本次活躍變更集；若 staged 與 unstaged 同時存在，必須明確區分哪些發現命中哪一部分。
- 每個發現都基於完整 diff 與最小必要上下文，並附帶 `path:line` 證據；不得只靠對話記憶、作者意圖或主觀風格偏好下結論。
- 架構與責任邊界問題優先於 style-only 建議；抽象必須能消除重複、釐清歸屬或穩定邊界。
- 簡化建議必須是行為等價且真正降低複雜度的改動，不能只是把複雜度搬到別處。
- 對於跨多檔、多模組或大變更，應按 coherent scope cluster 使用只讀 subagent；主代理只負責聚合、去重與整理，不重讀已委派檔案。
- 若沒有可操作發現，最終需明確輸出 `No actionable abstraction or simplification finding identified`。

## 工作流程
1. 檢查 git 狀態。
   - 先確認 `git status`、staged diff 與 unstaged diff，避免只審其中一半。
   - 若目前沒有活躍變更集，直接輸出 `No active git change set to review`。
2. 決定閱讀策略。
   - 單檔或很小的同模組變更可直接 inline 審查。
   - 多檔、多模組或跨層變更需先按功能、套件、層級或邏輯關切點切成 scope cluster，並優先以一個只讀 subagent 對應一個 cluster。
3. 建立基線並收斂上下文。
   - Inline 路徑下，讀完整個變更檔案與最小必要的 caller、callee、配置。
   - Subagent 路徑下，等待所有 cluster 結果返回，再根據共享邊界與 outbound concerns 做去重。
   - 所有判斷都必須回到代碼、測試、配置與可觀察行為本身。
4. 先做架構審查。
   - 只報告有明確證據支撐的問題，例如跨層洩漏、重複工作流、錯誤 helper 歸屬、重複條件樹、脆弱介面或責任模糊。
   - 每條架構發現都要指出候選抽象或責任落點，以及當前寫法為何更弱。
5. 再做簡化審查。
   - 只在確定不改變行為的前提下，指出多餘分支、包裝層、深巢狀、重複驗證、過大函式或歷史相容殘骸。
   - 若建議只是把複雜度移位，則不應作為有效簡化發現。
6. 輸出報告。
   - 先交代審查範圍、staged/unstaged 區分、補讀的上下文與 cluster 情況。
   - 再依序輸出架構發現、簡化發現與剩餘不確定性。

## 使用範例
- 「幫我 review 這次 branch 的變更」-> 先完整覆蓋 staged 與 unstaged diff，再按架構問題與簡化機會輸出報告。
- 「我想知道這次重構有沒有真正變簡單」-> 聚焦行為等價的簡化空間，而不是風格偏好。
- 「這次改動跨很多 package，請不要漏看邊界」-> 先按 package 或邏輯責任分 cluster，用只讀 subagent 分治後再由主代理去重彙總。
- 「如果沒有值得改的地方，直接講沒有」-> 若無可操作發現，明確輸出 `No actionable abstraction or simplification finding identified`。

## 參考資料索引
- 下游工作流如 `commit-and-push`、`version-release`、`review-spec-related-changes` 會自行決定是否追加安全或邊界情況審查；本技能只負責變更集的架構與簡化分析。
