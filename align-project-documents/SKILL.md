---
name: align-project-documents
description: 整理及維護項目文檔。當你需要管理項目說明文檔時，使用此技能。
---

## 目標

以整個生產repo為唯一主證據，建立或維護標準化的 `docs/features/`、`docs/architecture/`、`docs/principles/`，清理已失效或重複的舊文檔，並在完成後同步刷新根目錄約束文件。

## 驗收條件

- repo的所有細節被仔細閱讀並轉化為標準化的 `docs/features/`、`docs/architecture/`、`docs/principles/`，以及同步後的 `AGENTS.md` / `CLAUDE.md`。
- 舊的非標準文檔已被遷移、合併或移除。

## 工作流程

### 1. 建立對repo的基線認知

閱讀項目現有文檔，建立對repo的初步理解，並將其作為對repo的基線認知，制定後續的閱讀策略

### 2. 比對repo及項目文檔

按照上一步建立的閱讀策略，全面搜索、查找整個repo，驗證並確保現有項目文檔的描述正確、無遺漏。
如果外部環境存在subagents功能，建議調度subagents完成對repo的閱讀。

### 3. 制定文檔更新策略

根據上一步找到的所有遺漏或項目文檔與實際代碼脫節之處，制定文檔更新策略。將所有項目文檔更新為符合模板格式的標準化文檔，並移除除必要文檔（如 `CHANGELOG.md`, `CONTRIBUTION.md` ）外的舊有說明文檔。

## 範例

- "根據當前repo重建整套專案文檔。" -> "完整讀碼後重建三類標準文檔，清理舊文檔並同步刷新 `AGENTS.md` / `CLAUDE.md`。"
- "這個倉庫的 docs 很散，請重新對齊成統一結構。" -> "把可保留內容遷入 `docs/features/`、`docs/architecture/`、`docs/principles/`，移除重複或失效文件。"
- "我要的不是 README 小修，而是整個文檔體系重整。" -> "以全倉庫證據為基礎重建標準化文檔樹，而不是只修改單一說明文件。"

## 參考資料
- `references/templates/standardized-docs-template.md` - 三類文檔的目標結構、分類規則與清理檢查表。