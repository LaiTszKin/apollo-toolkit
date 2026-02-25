# develop-new-features

PRD-first 的功能開發技能，先產生並確認 PRD，再開始實作。

這是一個給 Codex/Claude 類 Agent 使用的 skill，適合在新增功能前先把需求、流程與測試寫成可驗證的 PRD，再進入開發。

此 skill 用於「新增功能／修改產品行為／綠地功能設計」等情境，目標是讓需求、流程、測試與實作順序一致，降低直接改碼造成的返工風險。

## 功能重點

- 以 `references/prd-template.md` 為唯一模板來源
- 優先使用 `scripts/create_prd.py` 建立 PRD 檔案
- 固定輸出到 `docs/plans/{YYYY-MM-DD}-{feature_name}.md`
- 要求在 PRD 中記錄：
  - 官方文件與必要參考來源
  - 預計修改/新增檔案
  - 需要澄清問題（若無則填「無」）
  - 單元測試、Property-based 測試、整合測試規劃
- **未獲使用者確認前，不進入實作**

## 專案結構

```text
.
├── SKILL.md
├── examples/
│   └── membership-upgrade-flow-prd.md
├── references/
│   ├── prd-template.md
│   ├── testing-unit.md
│   ├── testing-property-based.md
│   ├── testing-integration.md
│   └── testing-e2e.md
└── scripts/
    └── create_prd.py
```

## 需求環境

- Python 3.9+

## 快速開始

### 1) 建立 PRD

```bash
python3 scripts/create_prd.py "會員升級流程優化"
```

預設會建立：

```text
docs/plans/<today>-hui-yuan-sheng-ji-liu-cheng-you-hua.md
```

> 檔名 slug 由英數字轉換規則產生；若中文名稱導致 slug 不符合需求，可使用 `--slug` 手動指定。

### 2) 指定 slug（建議）

```bash
python3 scripts/create_prd.py "會員升級流程優化" --slug membership-upgrade-flow
```

### 3) 其他常用參數

```bash
python3 scripts/create_prd.py "功能名稱" \
  --output-dir docs/plans \
  --template references/prd-template.md \
  --force
```

- `--output-dir`：輸出資料夾（預設 `docs/plans`）
- `--template`：模板路徑（預設 `references/prd-template.md`）
- `--force`：若同名檔案存在則覆蓋

## Example

可參考完整範例 PRD：`examples/membership-upgrade-flow-prd.md`

## 建議工作流程

1. 查詢本次功能需要的官方文件（只查必要部分）
2. 用腳本產生 PRD 檔案
3. 探索現有代碼與模組依賴
4. 補齊 PRD：核心需求、業務流程、澄清問題、測試規劃
5. 取得使用者「可開始實作」確認
6. 再進入程式碼修改

## 測試策略參考

- 單元測試：`references/testing-unit.md`
- Property-based 測試：`references/testing-property-based.md`
- 整合測試：`references/testing-integration.md`
- E2E 測試（僅被要求時）：`references/testing-e2e.md`

## License

本專案採用 MIT 授權，詳見 `LICENSE`。
