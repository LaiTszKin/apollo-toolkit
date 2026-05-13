---
name: init-project-html
description: >-
  使用 `apltk architecture` 初始化專案 HTML 架構圖譜，生成基礎 atlas YAML 與渲染後的 HTML 頁面。所有宣告基於倉庫證據；每個功能模組由一個可寫子 agent 負責，主 agent 必須等待全部子 agent 完成後，才能補跨功能連接並執行 render 與 validate。
---

## 技能目標

透過 `apltk architecture` 為目前倉庫建立基礎專案架構圖譜，產出受 CLI 管理的 atlas 狀態檔與渲染後的 HTML 頁面。

## 驗收條件

- 只透過 `apltk architecture` 修改圖譜；不得手改 `resources/project-architecture/**/*.html`。
- 所有宣告可追溯到真實程式碼、設定、SQL 或外部邊界；無法確認的部分用 `TBD` 或在 `meta.summary` 記錄遺漏原因。
- 宏觀圖完整表達功能與子模組關係；所有跨邊界互動使用 `call`、`return`、`data-row`、`failure` 邊表達。
- 每個非平凡子模組具備足夠內部結構：已宣告 `function`、`variable`、有序 `dataflow`、必要時的 `error`，且引用可通過校驗。
- 採用「每個功能一個可寫子 agent」分工；主 agent 等所有子 agent 完成後才補跨功能邊，且 `apltk architecture validate` 通過。

## 工作流程

1. 執行 `apltk architecture --help`，以 CLI 說明為唯一命令真源。
2. 做整倉淺層盤點，列出功能模組的 slug、使用者視角職責、入口點與主要邊界資源。
3. 為每個功能派發一個可寫子 agent，負責宣告該功能的全部子模組、函式、變數、資料流、本地錯誤與功能內邊。子 agent 返回子模組摘要及需要主 agent 補上的跨功能邊界資訊。
4. 主 agent 不得重讀已委派功能的原始碼，也不得重複宣告子 agent 已處理的功能內元件。
5. 全部子 agent 完成後，主 agent 統一補齊跨功能 edge、必要時補共享 meta 或 actor，然後執行 `apltk architecture render` 與 `apltk architecture validate`。
6. 抽查渲染結果，確認宏觀圖和至少一個代表性子模組頁滿足驗收條件，彙報功能數、子模組數、邊數量、未覆蓋路徑與原因。

## 使用範例

- 「替這個倉庫首次生成 HTML 架構圖」→ 梳理功能模組，按功能分派子 agent，彙總跨功能邊，生成基礎 atlas 與渲染頁面。交付物為 `resources/project-architecture/` 下的完整 atlas 狀態檔與通過驗證的 HTML 頁面。
- 「把系統的資料流、呼叫關係和回滾路徑視覺化」→ 使用 `call` / `return` / `data-row` / `failure` 邊表達跨邊界關係，為每個關鍵子模組補齊內部 `dataflow`。

## 參考資料索引

- `references/TEMPLATE_SPEC.md`：atlas 欄位、列舉和 CLI 寫入形狀速查表。
- `lib/atlas/cli.js`：`apltk architecture` 的實作入口。
- `lib/atlas/schema.js`：圖譜資料結構與校驗規則。
- `sample-demo/`：完整示例輸出，用於理解基礎 atlas 的最終形態。
- `spec-to-project-html/SKILL.md`：面向規劃文件的 overlay 版本。
- `update-project-html/SKILL.md`：面向已存在基礎 atlas 的增量刷新版本。
