---
name: docs-project
description: >-
    以 repo 程式碼為唯一依據，維護標準化的 docs/features/、docs/architecture/、docs/principles/ 文檔，
    並清理已失效或重複的舊文檔。
---

## 目標

以整個生產 repo 為唯一依據，建立或維護標準化的 `docs/features/`、`docs/architecture/`、`docs/principles/` 文檔。
清理已失效或重複的舊文檔。
完成後同步刷新根目錄約束文件。

## 驗收條件

- repo 的所有細節被仔細閱讀，並轉化為標準化的 `docs/features/`、`docs/architecture/`、`docs/principles/` 文檔
- `AGENTS.md` / `CLAUDE.md` 已被同步更新
- 舊的非標準文檔已被遷移、合併或移除

## 工作流程

### 1. 建立對repo的基線認知

閱讀項目現有文檔，建立對 repo 的基線認知，制定後續閱讀策略。

### 2. 比對repo及項目文檔

按照上一步建立的閱讀策略，全面搜索整個 repo，驗證並確保現有項目文檔的描述正確、無遺漏。
如果外部環境存在 subagents 功能，建議通過並行調度 subagents 完成對repo的閱讀。

### 3. 制定文檔更新策略

根據上一步發現的文檔遺漏或脫節之處，制定文檔更新策略。
使用模板規定的格式重寫項目文檔。
移除舊有說明文檔（必要文檔如 `CHANGELOG.md`、`CONTRIBUTION.md` 除外）。

## 參考資料
- `assets/templates/standardized-docs-template.md` - 三類文檔的目標結構、分類規則與清理檢查表。