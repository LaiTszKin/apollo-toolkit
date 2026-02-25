---
name: develop-new-features
description: PRD-first feature development workflow that generates a PRD file from a reference template, captures requirements, business flow, clarification questions, and test plans, then waits for user confirmation before implementation. Use when users ask to design or implement new features, change product behavior, request a PRD-driven process, or ask for a greenfield feature that is complex and has no existing base (plan before action).
---

# Develop New Features

## 目的
- 產出 PRD 之後才開始實作。
- 以 references 的模板產生一致格式的 PRD。

## 工作流程
1. 先搜尋外部依賴/技術堆疊/API 的官方文件。
   - 只查與新功能實作必要相關的官方文件。
   - 記錄將引用的官方文件來源以供 PRD 的 Reference 欄位使用。
2. 再產生 PRD 模板檔案。
   - 優先使用 `scripts/create_prd.py` 由模板建立檔案。
   - 模板固定使用 `references/prd-template.md`。
   - 將 PRD 儲存到 `docs/plans/{YYYY-MM-DD}-{feature_name}.md`。
3. 再探索代碼庫。
   - 釐清現有流程、相關模組與可重用元件。
   - 蒐集需要引用的文件與可能修改的檔案清單。
4. 根據探索到的內容與使用者描述填寫 PRD。
   - Reference 欄位需列出必要參考文件與預計修改/新增的檔案。
   - 若需求不清楚，列出 3-5 個需要澄清的問題；若需求清楚，保留該段落並填「無」。
   - 規劃單元測試、property-based 測試（需獨立於單元測試）、整合測試（如需），每個測試都要標註目的。
5. 取得使用者確認。
   - 明確詢問是否可以開始實作。
   - 未獲得確認前，不要修改或新增程式碼。
6. 使用者確認後才開始實作。

## 工作規範
- 預設使用使用者的語言撰寫 PRD。
- 保持內容精簡、可執行，避免加入未被需求支持的額外功能。
- `feature_name` 使用 kebab-case，避免空白與特殊字元。
- Reference 欄位需列出必要參考文件與預計修改/新增的檔案路徑。

## 參考資源
- `references/prd-template.md`：PRD 模板（必用）。
- `references/testing-unit.md`：單元測試原則。
- `references/testing-property-based.md`：Property-based 測試原則。
- `references/testing-integration.md`：整合測試原則。
- `references/testing-e2e.md`：E2E 測試原則（僅在使用者要求時）。
- `scripts/create_prd.py`：PRD 檔案產生腳本。
