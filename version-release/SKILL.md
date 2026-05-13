---
name: version-release
description: >-
  用於明確的 semver 發版流程。必須先完成 `commit-and-push` 共用 gate 與
  `submission-readiness-check`，再決定版本、更新 changelog、建立 tag、推送並發布 GitHub Release。
---

# 版本發佈

## Dependencies

- Required: `commit-and-push`、`submission-readiness-check`
- Conditional: `archive-specs`
- Optional: 無
- Fallback: 缺少必需技能時必須停止，不能憑印象手動補一個發版流程

## Standards

- Evidence: 以版本檔、`CHANGELOG.md`、本地/remote tag、既有 GitHub Release 與使用者明確的 bump 意圖作為依據
- Execution: 先確認這真的是 release 請求，再完成所有 gate，之後才更新版本、切 changelog、打 tag、推送與發布 Release
- Quality: 不猜版本、不重複發版、不用原始 diff 臨時拼 release notes；所有版本入口必須同步一致
- Output: 交付可驗證的版本發佈結果，包含版本號、tag、remote驗證與 GitHub Release URL

## 技能目標

把明確的發版需求轉成一條完整、可驗證、可追溯的 semver 流程，確保版本檔、changelog、git tag、remote狀態與 GitHub Release 彼此一致。

## 驗收條件

- 已先確認這是明確的 release / semver 請求；若只是 commit 或 push，必須改走 `commit-and-push`
- 在修改任何版本相關檔案前，已清楚說出 current -> next 版本與將建立的 tag 字串
- `submission-readiness-check` 與必要的 `archive-specs` 都已完成，且 `CHANGELOG.md` 的 `Unreleased` 內容足以支撐本次發版
- 最終已同步版本檔、發布說明、commit、tag、remote refs 與 GitHub Release；若使用者明確要求不發布 Release，需在結果中清楚註明

## 工作流程

1. 先確認使用者是否真的要求 release、publish、tag、patch、minor、major 或其他明確 semver 動作；若沒有，改用 `commit-and-push`
2. 檢查目前 git 狀態、版本檔、既有 tag、本地與remote是否已有同版本 tag，以及 GitHub 上是否已有同版本 Release，避免重複發版
3. 對 code-affecting 範圍執行 `submission-readiness-check`；若它要求 `archive-specs` 或 changelog/文件同步，必須先完成
4. 根據版本檔、repo 歷史與使用者指示決定 current -> next 版本與 tag 格式；若語意不明，優先選較小 bump 並請使用者確認
5. 一致更新所有版本入口，並把 `CHANGELOG.md` 的 `Unreleased` 移到新的版本區塊；release notes 只能來自整理過的 changelog 內容
6. 建立 release commit 與 tag；若是 prerelease retarget，保留版本號不變，只把 tag / Release 移到新的 commit
7. 推送分支與 tag，並驗證remote commit 與 tag 都已正確存在
8. 使用 `gh release create` 或 repo 慣用工具建立或更新 GitHub Release，最後回報版本號、tag 與 release URL

## 使用範例

- 「發 patch release」-> 先確認目前版本與 changelog，再更新到下一個 patch、建立 tag 並發布 Release
- 「把 prerelease tag 移到最新修正」-> 不增加版本號，只重新對準 tag 與對應 Release
- 「幫我 commit 然後 push」-> 不使用本技能，改走 `commit-and-push`

## 參考資料索引

- `references/semantic-versioning.md`：版本號選擇規則
- `references/commit-messages.md`：release commit 訊息格式
- `references/branch-naming.md`：分支命名慣例
- `references/changelog-writing.md`：`CHANGELOG.md` 與 `Unreleased` 維護規則
- `references/readme-writing.md`：README 只在必要時同步更新
- `commit-and-push`：共享的 git 檢查、提交與推送 discipline
