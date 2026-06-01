---
name: docs-project
description: >-
    以 repo 程式碼為唯一依據，維護標準化的 docs/features/、docs/architecture/、docs/principles/ 文檔，
    並清理已失效或重複的舊文檔。每條文檔記述必須可追溯至實際程式碼證據。
---

## 目標

以整個生產 repo 為唯一依據，建立或維護標準化的 `docs/features/`、`docs/architecture/`、`docs/principles/` 文檔。
清理已失效或重複的舊文檔。
完成後同步刷新根目錄約束文件。

## 驗收條件

- repo 的所有細節被仔細閱讀，並轉化為標準化的 `docs/features/`、`docs/architecture/`、`docs/principles/` 文檔
- 每條文檔記述皆有可追溯的來源證據（檔案路徑 + 行號區間）；無法證明的內容標記為 `[INFERRED]`
- `AGENTS.md` / `CLAUDE.md` 已被同步更新
- 舊的非標準文檔已被遷移、合併或移除

## 工作流程

### 1. 建立對 repo 的基線認知

閱讀項目現有文檔，建立對 repo 的基線認知，制定後續閱讀策略。

### 2. 比對 repo 及項目文檔

按照上一步建立的閱讀策略，通過並行調度 subagents 全面搜索整個 repo，驗證並確保現有項目文檔的描述正確、無遺漏。

### 3. 制定文檔更新策略

根據上一步發現的文檔遺漏或脫節之處，制定文檔更新策略。
閱讀模板文檔；使用模板規定的格式重寫所有項目文檔。
移除舊有說明文檔（必要文檔如 `CHANGELOG.md`、`CONTRIBUTION.md` 除外）。

### 4. 後續維護指引

完成初始文檔後，在 `docs/README.md` 中記錄以下維護指引：

- **證據追溯**：維護文檔時，每條 claim 都必須附上來源檔案與行號區間。無法從程式碼直接證明的 claim 標記為 `[INFERRED]` 而非偽造。
- **LLM 安全原則**：產生文檔時，只餵給 LLM 結構化中繼資料（檔案列表、模組邊界、API 端點、函式簽名），不傳輸原始碼完整內容。
- **增量更新**：當程式碼變更時，只重新產生受影響的文檔區段。可使用 `git diff` 識別變更範圍，再決定哪些 `.md` 檔案需要更新。
- **定期 drift detection**（建議）：定期（每月或每季）比對文檔與實際程式碼，確認無重大偏離。發現 drift 時只修補受影響章節，不全面重寫。

## 參考資料
- `assets/templates/standardized-docs-template.md` - 三類文檔的目標結構、分類規則與清理檢查表。