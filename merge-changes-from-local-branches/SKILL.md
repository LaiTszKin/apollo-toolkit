---
name: merge-changes-from-local-branches
description: >-
  將使用者指定的本地分支合併回當前分支，依序完成衝突處理、驗證、安全清理與最終提交準備；除非本次對話明確要求，否則不推送遠端。
---

## 技能目標

在工作開始時的當前本地分支上，整合使用者指定的本地分支（或由 spec / batch 規劃可無歧義對應出的分支），完成合併、驗證、清理，並讓整合結果可安全交由 `commit-and-push` 收尾。

## 驗收條件

- 所有合併變更落在流程開始時的原始當前分支，不會未經允許改換目標分支。
- 合併範圍只包含使用者明確指定，或可由 `coordination.md` / spec 無歧義映射出的分支；若映射不清楚則停止並回報。
- 當 batch 規劃存在 `Merge order` / landing order 時，實際整合順序與規劃一致；順序衝突或不明確時不猜測執行。
- 所有衝突以保留正確行為為原則解決，並在刪除來源分支或交給 `commit-and-push` 前完成驗證。
- 只清理已成功合併且已驗證的來源分支或 worktree；不強制刪除尚未真正合入的來源。
- 最終交付是原始當前分支上的整合結果與簡潔摘要；只有使用者於本次對話明確要求時才推送遠端。本技能不單獨執行 `archive-specs`。

## 工作流程

1. 以流程開始時的當前分支為唯一目標分支，確認合併範圍（使用者明確指定的分支，或由 spec / `coordination.md` 無歧義映射出的分支與整合順序）。
2. 確認工作樹適合執行合併：若存在干擾整合的未提交變更，停止並回報，不自行 stash 或切換分支。
3. 依既定順序逐一合併 in-scope 分支。對已合入或無新增內容的分支，跳過並記錄原因。發生衝突時閱讀雙方內容編輯出正確結果；無法在不猜測意圖的前提下解決時停止並回報。必要時使用 `merge-conflict-resolver`。
4. 先對衝突區域或高風險改動執行針對性驗證，再對整體整合結果執行倉庫慣用的標準驗證。驗證失敗先在當前分支修正。
5. 僅清理已完成合併且通過驗證的來源分支與對應 worktree；安全刪除被拒絕時保留來源並回報，不使用強制刪除。
6. 交由 `commit-and-push` 完成必要審查、submission-readiness gate 與本地提交。若 `commit-and-push` 不可用則停止並回報，不走裸 `git commit`。
7. 總結已合併與跳過的分支、順序依據、衝突處理原則、驗證結果，以及流程最終停在本地 `HEAD` 還是包含遠端推送。

## 使用範例

- 「把 `feature/api-layer` 和 `feature/cli-wrapper` 合回目前分支」→ 以目前分支為唯一目標，依指定順序完成整合、驗證與安全清理，再交給 `commit-and-push` 做本地提交。
- 「根據 batch 的 `coordination.md` 把各 worktree 分支合回來，但先不要 push」→ 從 batch 規劃確認無歧義分支映射與 landing order，依序合併、驗證、清理，只做到本地提交。
- 「把那幾個應該相關的分支一起合一下」→ 若無法從使用者輸入或規劃文件明確判定分支集合與順序，停止並回報需要補充資訊。

## 參考資料索引

- `commit-and-push/SKILL.md`：最終提交、submission-readiness 與是否允許推送的權威流程。
- `merge-conflict-resolver/SKILL.md`：衝突需要精確合成時的輔助技能。
- `docs/plans/**/coordination.md`：batch 規劃存在時的 landing order 與分支映射依據。
