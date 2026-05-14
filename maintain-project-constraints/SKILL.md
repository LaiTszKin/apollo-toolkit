---
name: maintain-project-constraints
description: 當你需要更新 `CLAUDE.md` 或 `AGENTS.md` 這兩份項目規範文檔的時候，調用這個技能。
---

## 技能目標

基於當前 repo 的最新文檔和及代碼，維護項目規範文檔。

## 驗收條件

- `CLAUDE.md`, `AGENTS.md` 已經被更新到最新狀態

## 工作流程

### 1. 閱讀 repo

深入閱讀當前項目文檔及實作代碼，並建立對於項目的全面認知。
如果外部環境允許使用 subagents，建議通過並行調度 subagents 完成對 repo 代碼的深入閱讀。

### 2. 更新項目規範文檔

按照模板當中給出的格式，更新或創建 `CLAUDE.md`, `AGENTS.md`。

## 參考資料

- `references/constraint-file-reference.md`：三區塊契約、撰寫規則、核對清單與輸出模板。