# develop-new-features

Spec-first 的功能開發技能，先產生並確認 `spec.md`、`tasks.md`、`checklist.md`，再開始實作。

這是一個給 Codex/Claude 類 Agent 使用的 skill，適合在新增功能前先把需求、任務與測試追蹤寫成可驗證文件，再進入開發。

此 skill 用於「新增功能／修改產品行為／綠地功能設計」等情境，目標是讓需求、任務、測試與實作順序一致，降低直接改碼造成的返工風險。

## 功能重點

- 以 `references/templates/spec.md`、`references/templates/tasks.md`、`references/templates/checklist.md` 為模板來源
- 優先使用 `scripts/create-specs` 一次建立三份規劃文件
- 固定輸出到 `docs/plans/{YYYY-MM-DD}_{change_name}/`
- `spec.md` 要記錄官方文件、預計修改檔案、澄清問題與 BDD 需求行為
- `tasks.md` 要用 `## **Task N: ...**` + `- N. [ ]` / `- N.x [ ]` 格式
- `checklist.md` 必須使用 `- [ ]` 清單格式，並可依實際情況彈性增刪條目與調整測試層級
- E2E 由 agent 依功能重要性與複雜度判斷是否建立；若不適合 E2E，至少補整合測試
- Agent 完成後必須依實際情況回填 `tasks.md` 與 `checklist.md` 的 checkbox
- **未獲使用者確認前，不進入實作**

## 專案結構

```text
.
├── SKILL.md
├── references/
│   ├── templates/
│   │   ├── spec.md
│   │   ├── tasks.md
│   │   └── checklist.md
│   ├── testing-unit.md
│   ├── testing-property-based.md
│   ├── testing-integration.md
│   └── testing-e2e.md
└── scripts/
    └── create-specs
```

## 需求環境

- Python 3.9+

## 快速開始

### 1) 建立規劃文件

```bash
python3 scripts/create-specs "會員升級流程優化" --change-name membership-upgrade-flow
```

預設會建立目錄：

```text
docs/plans/<today>_membership-upgrade-flow/
├── spec.md
├── tasks.md
└── checklist.md
```

> 若未傳 `--change-name`，會以 feature name 轉為 kebab-case；中文名稱通常建議手動提供 `--change-name`。

### 2) 其他常用參數

```bash
python3 scripts/create-specs "功能名稱" \
  --output-dir docs/plans \
  --template-dir references/templates \
  --force
```

- `--output-dir`：輸出資料夾（預設 `docs/plans`）
- `--template-dir`：模板資料夾（預設 `references/templates`）
- `--force`：若同名目錄下既有文件存在則覆蓋

## 建議工作流程

1. 查詢本次功能需要的官方文件（只查必要部分）
2. 用腳本產生 `spec.md` / `tasks.md` / `checklist.md`
3. 探索現有代碼與模組依賴
4. 補齊 `spec.md`：BDD 核心需求、澄清問題、參考來源
5. 補齊 `tasks.md`：主任務/子任務拆解與實作順序
6. 補齊 `checklist.md`：行為與測試案例對齊 + 測試結果
7. 由 agent 依重要性與複雜度決定是否建立 E2E；若 E2E 不適合，至少補整合測試
8. 取得使用者「可開始實作」確認
9. 再進入程式碼修改
10. 完成後回填 `tasks.md` 與 `checklist.md` 的 checkbox 與結果

## 文件填寫規範

- `spec.md`：使用 BDD 關鍵詞 `GIVEN / WHEN / THEN / AND / Requirements`
- `tasks.md`：每個主任務都用 `## **Task N: [任務標題]**`，正文描述「任務內容」及需求對應，並用 `- N. [ ]`、`- N.x [ ]` 列出任務
- `checklist.md`：必須使用 `- [ ]` 格式，不使用表格；它是起始模板，允許增刪/改寫條目，完成後依實際情況更新 checkbox 與 `PASS/FAIL/BLOCKED/NOT RUN/N/A`

## 測試策略參考

- 單元測試：`references/testing-unit.md`
- Property-based 測試：`references/testing-property-based.md`
- 整合測試：`references/testing-integration.md`
- E2E 測試決策：`references/testing-e2e.md`

## License

本專案採用 MIT 授權，詳見 `LICENSE`。
