---
name: develop-new-features
description: Spec-first feature development workflow that generates spec/tasks/checklist documents from templates, captures BDD requirements and executable test plans, then waits for user confirmation before implementation. Use when users ask to design or implement new features, change product behavior, request a planning-first process, or ask for a greenfield feature that is complex and has no existing base (plan before action).
---

# Develop New Features

## 目的
- 先產出 `spec.md`、`tasks.md`、`checklist.md`，再開始實作。
- 以 BDD 描述需求，讓需求、任務、測試結果可追蹤。

## 工作流程
1. 先搜尋外部依賴/技術堆疊/API 的官方文件。
   - 只查本次功能必要的官方資訊。
   - 記錄將引用的來源，後續填入 `spec.md`。
2. 再產生規劃文件模板。
   - 優先使用 `python3 scripts/create-specs "<功能名稱>" --change-name <kebab-case>`。
   - 模板固定使用：
     - `references/templates/spec.md`
     - `references/templates/tasks.md`
     - `references/templates/checklist.md`
   - 將文件儲存到 `docs/plans/{YYYY-MM-DD}_{change_name}/`。
3. 再探索代碼庫。
   - 釐清現有流程、相關模組與可重用元件。
   - 蒐集需要引用的文件、風險點與可能修改檔案清單。
4. 填寫 `spec.md`。
   - 核心需求必須使用關鍵詞：`GIVEN`、`WHEN`、`THEN`、`AND`、`Requirements`。
   - 每條需求都要可驗收，並覆蓋權限、邊界與錯誤/例外路徑。
   - 若需求不清楚，列出 3-5 個需要澄清的問題；若需求清楚，填「無」。
5. 填寫 `tasks.md`。
   - 主任務格式固定為 `## **Task N: [任務標題]**`。
   - 每個主任務標題下都要有「任務內容」及需求對應描述（含核心目的）。
   - 任務清單固定使用 `- N. [ ] ...`，子任務使用 `- N.x [ ] ...`。
6. 填寫 `checklist.md`。
   - Checklist 必須全面使用 `- [ ]` checkbox 形式，不使用表格。
   - Checklist 是起始模板，agent 必須依實際情況增刪與改寫條目，避免機械套用。
   - 將程式行為對齊測試案例（UT/PBT/IT/E2E），並填寫測試結果欄位（PASS/FAIL/BLOCKED/NOT RUN/N/A）。
7. 規劃測試覆蓋策略。
   - 單元與 Property-based 測試依需求風險規劃。
   - E2E 由 agent 根據功能重要性、複雜度、跨層風險判斷是否建立，不再等待使用者特別要求。
   - 若 E2E 難以穩定或成本過高，至少補齊覆蓋關鍵路徑的整合測試，並在 `checklist.md` 記錄原因。
8. 取得使用者確認。
   - 明確詢問是否可以開始實作。
   - 未獲得確認前，不要修改或新增產品程式碼。
9. 使用者確認後才開始實作。
10. 完成實作與測試後，回填文件狀態。
   - `tasks.md`：依實際完成情況勾選/保留每個任務 checkbox。
   - `checklist.md`：依實際測試與驗證結果勾選對應 checkbox，並更新結果欄位。

## 工作規範
- 預設使用使用者語言撰寫規劃文件。
- 保持內容精簡、可執行，避免加入未被需求支持的額外功能。
- `change_name` 使用 kebab-case，避免空白與特殊字元。
- 需求編號、任務編號、測試案例編號必須可互相追蹤。
- 文件不是一次性草稿：agent 在工作完成後必須更新 `tasks.md` 與 `checklist.md` 的 checkbox 狀態。
- Checklist 以「貼近實況」優先：允許增刪項目、調整測試層級，並補充必要備註。

## 參考資源
- `references/templates/spec.md`：總體需求模板（BDD）。
- `references/templates/tasks.md`：任務拆解模板。
- `references/templates/checklist.md`：行為與測試對齊模板。
- `references/testing-unit.md`：單元測試原則。
- `references/testing-property-based.md`：Property-based 測試原則。
- `references/testing-integration.md`：整合測試原則。
- `references/testing-e2e.md`：E2E 測試決策與設計原則。
- `scripts/create-specs`：規劃文件產生腳本（一次產生三份文件）。
