---
name: init-project-html
description: >-
  使用 `apltk architecture` 初始化專案 HTML 架構圖譜，生成基礎 atlas YAML 與渲染後的 HTML 頁面。所有宣告必須基於倉庫證據，跨模組關係只能用 `call`、`return`、`data-row`、`failure` 邊表達；每個功能模組由一個可寫子 agent 負責，主 agent 必須等待全部子 agent 完成後，才能補跨功能連接並執行 `render` 與 `validate`。
---

# 初始化專案 HTML 架構圖

## 技能目標

透過 `apltk architecture` 為目前倉庫建立基礎專案架構圖譜，產出受 CLI 管理的 `resources/project-architecture/atlas/` 狀態檔與對應 HTML 頁面，而不是手寫 SVG 或 HTML。

## 驗收條件

- 只透過 `apltk architecture` 修改圖譜；不得手改 `resources/project-architecture/**/*.html`。
- 渲染後的宏觀圖完整表達功能與子模組關係；所有跨邊界互動都必須落在 `call`、`return`、`data-row`、`failure` 邊上，不能藏在子模組頁面文案裡。
- 每個非平凡子模組都具備足夠的內部結構：已宣告的 `function`、`variable`、有序 `dataflow`、必要時的 `error`，且 `dataflow` 中的函式與讀寫變數引用可被校驗通過。
- 所有宣告都能追溯到真實程式碼、設定、SQL 或外部邊界；無法確認的部分用 `TBD` 或在 `meta.summary` 中明確記錄遺漏原因。
- 採用「每個功能一個可寫子 agent」的分工；主 agent 必須等所有子 agent 完成後，才允許補跨功能邊並執行 `apltk architecture validate`，且驗證結果為通過。

## 工作流程

1. 先執行 `apltk architecture --help`，把 CLI 說明當作唯一命令真源；本技能只定義語義規則，不重複維護參數細節。
2. 先做整倉淺層盤點，只列出功能模組的 `slug`、使用者視角職責、入口點與主要邊界資源；此階段不要深讀函式實作。
3. 為每個待建圖功能派發一個可寫子 agent。每個子 agent 只深讀自己負責的功能，並負責宣告該功能內的全部子模組、函式、變數、資料流、本地錯誤，以及所有功能內邊。
4. 子 agent 返回的內容只能是：子模組摘要，以及需要由主 agent 稍後補上的跨功能邊界資訊；主 agent 不得回頭重讀已委派功能原始碼，也不得重複宣告子 agent 已擁有的功能內元件。
5. 等全部子 agent 完成後，主 agent 統一補齊跨功能 `edge`，必要時補共享 `meta` 或 `actor`，隨後執行 `apltk architecture render` 與 `apltk architecture validate`。
6. 打開渲染結果進行抽查，確認宏觀圖和至少一個代表性子模組頁都滿足驗收條件，並在彙報中記錄功能數、子模組數、邊數量、未覆蓋路徑與原因。

## 使用範例

- 「替這個倉庫首次生成 HTML 架構圖。」 -> 「先梳理功能模組，再按功能分派子 agent，最後彙總跨功能邊，生成基礎 atlas 與渲染頁面。」
- 「把系統的資料流、呼叫關係和回滾路徑視覺化。」 -> 「使用 `call` / `return` / `data-row` / `failure` 邊表達跨邊界關係，並為每個關鍵子模組補齊內部 `dataflow`。」

## 參考資料索引

- `references/TEMPLATE_SPEC.md`：atlas 欄位、列舉和 CLI 寫入形狀速查表。
- `lib/atlas/cli.js`：`apltk architecture` 的實作入口。
- `lib/atlas/schema.js`：圖譜資料結構與校驗規則。
- `sample-demo/`：完整示例輸出，可用於理解基礎 atlas 的最終形態。
- `spec-to-project-html/SKILL.md`：面向規劃文件的 overlay 版本。
- `update-project-html/SKILL.md`：面向已存在基礎 atlas 的增量刷新版本。
