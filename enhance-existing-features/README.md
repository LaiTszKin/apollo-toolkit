# enhance-existing-features

針對既有（brownfield）系統的功能擴充 skill：先釐清依賴、再驗證文件、再實作。

## 核心能力

- 先做依賴與資料流盤點，降低改動風險。
- specs 條件觸發：只有在以下範圍才強制建立 specs 並先取得使用者確認：
  - 高複雜度變更
  - 關鍵模塊變更
  - 跨模組變更
- specs 產物固定為：`spec.md`、`tasks.md`、`checklist.md`。
- specs 輸出路徑固定為：`docs/plans/{YYYY-MM-DD}_{change_name}/`。
- 若使用者在 specs 階段回覆澄清問題，agent 必須先勾選澄清相關 checkbox、審視並更新規格，並再次取得同意後才可實作。
- 即便不需要 specs，仍必須補齊相關測試（或明確標註 `N/A` 理由）：
  - 單元測試
  - Property-based 測試
  - 對用戶關鍵邏輯鏈路的整合測試
  - 端對端（E2E）測試

## 檔案結構

```text
.
├── SKILL.md
├── agents/
│   └── openai.yaml
├── references/
│   ├── templates/
│   │   ├── spec.md
│   │   ├── tasks.md
│   │   └── checklist.md
│   ├── unit-tests.md
│   ├── property-based-tests.md
│   ├── integration-tests.md
│   └── e2e-tests.md
└── scripts/
    └── create-specs
```

## 使用方式

```text
Use $enhance-existing-features to extend this brownfield feature.
If scope is high complexity / critical module / cross-module, create specs first,
wait for explicit approval. If user clarifies requirements, update checklist/specs and get approval again before implementation.
Even without specs, still add tests for unit/property-based/integration of
user-critical logic chain/e2e (or record clear N/A reasons).
```

## 建立 specs（必要時）

```bash
python3 scripts/create-specs "功能名稱" --change-name your-change-name
```

預設產出：

```text
docs/plans/<today>_your-change-name/
├── spec.md
├── tasks.md
└── checklist.md
```

## 測試要求（每次變更都要評估）

- Unit：變更邏輯、邊界、失敗路徑
- Property-based：不變量與廣域輸入組合
- Integration：對用戶關鍵邏輯鏈路（跨層/跨模組）
- E2E：受影響關鍵用戶路徑

若 E2E 不可行，需以更強整合測試替代並記錄理由。
