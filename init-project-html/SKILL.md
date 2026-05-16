---
name: init-project-html
description: 當你需要為項目初始化架構圖時，使用此技能。
---

## 技能目標

在 `apltk` cli 的幫助下製作項目架構圖，幫助用戶理解項目的軟件架構

## 驗收條件

- 架構圖清楚描述了功能模塊之間的關係及子模塊之間的關係

## 工作流程

### 1. 閱讀並理解代碼庫

按照功能模塊的定義，全面檢索並將代碼庫拆分為單個或多個功能模塊。接著，開始對功能模塊下的子模塊進行識別及深度閱讀。
如果外部環境允許使用 subagents ，建議並行調度 subagents，並為每一個功能模塊分配一個 subagent 進行深度閱讀，要求 subagents 完整列出：
- 該功能模塊與其他功能模塊之間是否存在交互；如有，如何交互。
- 該功能模塊內部存在哪些子模塊，這些子模塊之間如何交互並實現功能模塊的功能。
- 該功能模塊及下屬子模塊的資料流、錯誤處理。

### 2. 使用 `apltk` cli 工具協助生成架構圖

將前一步獲取到的代碼庫只是通過 cli 工具轉化為清晰的架構圖。
完成之後，驗證架構圖格式正確、可渲染。

## 參考資料

- `references/TEMPLATE_SPEC.md`：atlas 欄位、列舉和 CLI 寫入形狀速查表。
- `references/definition.md`: 功能模塊和子模塊的詳細定義。
- `assets/architecture-page.template.html`: 模板html。
- `references/architecture.css`: 風格模板。
- `sample-demo/`：完整示例輸出，用於理解基礎 atlas 的最終形態。
- `apltk architecture --help` - cli 工具的指引指令。