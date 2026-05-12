---
name: update-project-html
description: >-
  使用 `apltk architecture` 按真實程式碼 diff 刷新基礎專案 HTML 架構圖譜。先確定 diff 範圍並過濾出真正影響執行時行為的變更，再按受影響功能分派可寫子 agent 處理功能內更新；主 agent 必須等待全部子 agent 完成後，才能補跨功能邊並執行 `render` 與 `validate`。該技能只更新基礎 atlas，不使用 `--spec`。
---

# 更新專案 HTML 架構圖

## 技能目標

根據目前分支、工作區或指定提交範圍內的真實程式碼變更，增量刷新 `resources/project-architecture/` 下的基礎 atlas 與渲染 HTML，使圖譜持續和實際程式碼保持一致。

## 驗收條件

- 只透過 `apltk architecture` 更新基礎 atlas；不得手改 `resources/project-architecture/**/*.html`，也不得寫入任何 `--spec` overlay 產物。
- 在讀取原始碼前就明確本次 diff 範圍，並在報告中保留所執行的原始命令；過濾掉純文件、靜態資源、鎖檔、生成物和純格式化變更，同時記錄被跳過的類別與原因。
- 選定範圍內每個真正影響行為的 hunk，都要麼體現在功能內元件更新或跨功能邊變化上，要麼在交付報告中明確標註「對圖譜無影響」及原因。
- 按「每個受影響功能一個可寫子 agent」執行；主 agent 必須等全部子 agent 完成後，才允許修改跨功能 `edge`、共享 `meta` 或補充跨功能上下文。
- 更新後的圖譜繼續滿足 `init-project-html` 的語義要求，且 `apltk architecture validate` 通過。

## 工作流程

1. 先確認基礎 atlas 已存在，並執行 `apltk architecture --help` 取得最新 CLI 用法；如果倉庫還沒有 atlas，改用 `init-project-html`；如果需求針對規劃文件 overlay，改用 `spec-to-project-html`。
2. 在讀取原始碼前先決定 diff 範圍。預設同時檢查未暫存與已暫存改動；若使用者明確指定基線、提交或區間，則按使用者指定範圍執行。
3. 僅保留真正影響程式碼行為的變更，並把這些路徑映射到受影響功能；此階段只做結構映射，不深讀函式實作。
4. 為每個受影響功能派發一個可寫子 agent。每個子 agent 只讀取自己負責功能的現有 atlas 與變更檔案，完成全部功能內更新：子模組、函式、變數、資料流、錯誤以及功能內邊，並返回子模組變更摘要與跨功能邊界增量。
5. 主 agent 不得重讀已委派功能的原始碼，也不得重複宣告子 agent 已處理的功能內元件；只能在全部子 agent 完成後，統一補跨功能邊、必要的共享 `meta`，再執行 `apltk architecture render` 與 `apltk architecture validate`。
6. 最終報告至少包含：diff 範圍命令、受影響功能列表、各功能更新摘要、跨功能邊變化、被跳過的 diff 類別及原因、驗證結果，以及渲染輸出位置。

## 使用範例

- 「把目前分支的程式碼變化同步到基礎架構圖。」 -> 「按分支 diff 識別受影響功能，分別更新功能內宣告，再統一補跨功能連接並重新渲染。」
- 「刷新這次 PR 的專案 HTML atlas。」 -> 「先鎖定 PR 的 diff 基線，再僅處理有執行時影響的變更，避免無關文件改動污染圖譜。」

## 參考資料索引

- `init-project-html/SKILL.md`：基礎 atlas 的語義規則、子模組表達約束與總體驗收標準。
- `spec-to-project-html/SKILL.md`：當需求針對 `docs/plans/...` overlay 而非基礎 atlas 時使用。
- `README.md`：本技能的簡要用途說明。
- `apltk architecture --help`：命令、參數和子命令的唯一真源。
