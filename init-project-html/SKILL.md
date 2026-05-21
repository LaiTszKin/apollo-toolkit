---
name: init-project-html
description: 為項目初始化架構圖。透過 apltk CLI 將功能模塊與子模塊的關係轉化為可渲染的 HTML 架構圖。
---

## 技能目標

透過 `apltk` CLI 製作項目架構圖。
幫助用戶理解專案的軟體架構。

## 驗收條件

- 所有子模塊之間的 edge 被完整定義
- 所有子模塊內部的 edge 被完整定義
- 架構圖完整展示整個系統之中子模塊之間的關係以及功能模塊之間的關係

## 工作流程

### 1. 閱讀並理解代碼庫

按照功能模塊定義，全面檢索代碼庫。
將其拆分為單個或多個功能模塊。
接著，識別功能模塊下的子模塊，並進行深度閱讀。
如果外部環境允許使用 subagents ，建議並行調度 subagents，並為每一個功能模塊分配一個 subagent 進行深度閱讀，要求 subagents 完整列出：
- 該功能模塊與其他功能模塊之間是否存在交互；如有，如何交互。
- 該功能模塊內部存在哪些子模塊，這些子模塊之間如何交互並實現功能模塊的功能。
- 該功能模塊及下屬子模塊的資料流、錯誤處理。

### 2. 使用 `apltk` cli 工具協助生成架構圖

將前一步獲取的代碼庫知識透過 CLI 工具轉化為清晰的架構圖。
完成後驗證架構圖格式正確且可渲染。

## 參考資料

- `references/TEMPLATE_SPEC.md`：atlas 欄位、列舉和 CLI 寫入形狀速查表。
- `references/definition.md`: 功能模塊和子模塊的詳細定義。
- `assets/architecture-page.template.html`: 模板html。
- `references/architecture.css`: 風格模板。
- `sample-demo/`：完整示例輸出，用於理解基礎 atlas 的最終形態。
- `apltk architecture --help` - cli 工具的指引指令。