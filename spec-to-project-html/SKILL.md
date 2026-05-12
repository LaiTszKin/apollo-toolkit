---
name: spec-to-project-html
description: >-
  使用 `apltk architecture --spec <spec_dir>` 將專案 HTML 架構圖同步到活躍規劃文件。單個 spec 寫入 `<spec_dir>/architecture_diff/`，批量 spec 寫入 `coordination.md` 旁的共享 overlay；每個受影響功能由一個可寫子 agent 負責功能內 overlay 更新，主 agent 必須等待全部子 agent 完成後，才能補跨功能邊、渲染並驗證。基礎 atlas 不得被此技能修改。
---

# 規劃文件同步到專案 HTML 架構圖

## 技能目標

根據 `docs/plans/...` 下的規劃文件，為專案架構圖生成或更新 spec overlay，使評審者能夠透過 `apltk architecture diff` 直接查看 proposed-after 架構變化，同時保持基礎 atlas 不被污染。

## 驗收條件

- 只透過 `apltk architecture --spec <spec_dir>` 寫入 overlay；單個 spec 產物位於 `<spec_dir>/architecture_diff/`，批量 spec 則寫入 `coordination.md` 同級的共享 overlay；不得手改 `architecture_diff/**/*.html`。
- 讀取規劃文件時遵循 `spec.md` → `design.md` → `contract.md` → `coordination.md` 的順序；所有重要宣告都能同時回溯到 spec 語句和相關程式碼或設計證據。
- 對於程式碼尚未實作、但規劃中已經提出的結構，必須顯式使用 `planned`、`gap` 或 `TBD` 標記，而不能偽裝成已落地實作。
- 按「每個受影響功能一個可寫子 agent」執行 overlay 更新；主 agent 必須等全部子 agent 完成後，才允許補跨功能邊、共享 `meta` 或共享 `actor`。
- `apltk architecture validate --spec <spec_dir>` 通過，且 `apltk architecture diff` 中的頁面配對正確，沒有懸空邊、孤兒頁面或錯誤的 add/remove 配對。

## 工作流程

1. 先定位本次規劃目錄；使用者明確給出路徑時優先使用，否則結合 `coordination.md` 或 `recover-missing-plan` 找到正確 plan 集，並整理相關需求編號用於追蹤。
2. 執行 `apltk architecture --help` 取得最新命令形態，然後按 `spec.md`、`design.md`、`contract.md`、`coordination.md` 的順序讀取內容，確定哪些功能、子模組、邊、變數或錯誤語義會發生變化。
3. 先只列出受影響功能，不要提前把所有原始碼塞進主 agent。除了直接變更的功能，也要納入跨功能邊另一端的功能，確保 overlay 中的跨邊界關係完整。
4. 為每個受影響功能派發一個可寫子 agent。每個子 agent 只負責自己功能內的 overlay 寫入：子模組、函式、變數、資料流、錯誤，以及功能內邊；若規劃領先於程式碼，則在角色、用途或資料流文案中明確標註 `planned`、`gap` 或 `TBD`。
5. 子 agent 只返回功能內變更摘要、跨功能邊界變化和待記錄的 `planned/gap` 標記；主 agent 不得重讀已委派功能原始碼，也不得重複寫功能內元件。
6. 等全部子 agent 完成後，主 agent 統一補跨功能 `edge`、必要的共享 `meta` / `actor`，再執行 `apltk architecture validate --spec <spec_dir>`，並透過 `apltk architecture diff` 檢查 overlay 頁面是否正確映射到 before/after 視圖。
7. 最終報告至少包含：觸及的 overlay 檔案或 CLI 變更類別、`modified` / `added` / `removed` 數量、所有子 agent 已完成後才開始跨功能連線的確認、未解決的 spec 與程式碼差距，以及後續跟進行動。

## 使用範例

- 「把這份新 spec 的架構變化渲染成 before/after HTML 對照。」 -> 「讀取 plan 集，按受影響功能分派子 agent，寫入 `architecture_diff/` overlay，並用 `apltk architecture diff` 驗證。」
- 「批量規劃下多個 spec 共用一份架構 overlay。」 -> 「仍以成員 spec 路徑呼叫 `--spec`，但讓 CLI 自動彙總到 `coordination.md` 同級的共享 overlay 根目錄。」

## 參考資料索引

- `init-project-html/SKILL.md`：基礎語義規則、邊類型與子模組表達約束。
- `references/TEMPLATE_SPEC.md`：overlay 模式下的欄位、列舉與 diff 配對規則速查表。
- `recover-missing-plan`：當 plan 路徑缺失或不明確時用於恢復正確 spec 集。
- `generate-spec`、`implement-specs*`：需求編號和規劃流程的上游來源。
- `apltk architecture --help`：`--spec` 模式命令與參數的唯一真源。
