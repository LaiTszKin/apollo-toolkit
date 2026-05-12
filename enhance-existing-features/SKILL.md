---
name: enhance-existing-features
description: >-
  用於在既有系統上增強或調整產品行為。必須先讀懂實際受影響的模組，再決定是直接實作，
  還是先走 `generate-spec` / `recover-missing-plan`；所有非平凡變更都要經過 `test-case-strategy`。
---

# 增強既有功能

## Dependencies

- Required: `test-case-strategy`
- Conditional: `generate-spec`、`recover-missing-plan`、`commit-and-push`
- Optional: 無
- Fallback: `test-case-strategy` 不可用時必須停止；需要spec但 `generate-spec` 或 `recover-missing-plan` 不可用時也必須停止；若使用者要求提交或推送但 `commit-and-push` 不可用，必須說明後停止

## Standards

- Evidence: 先閱讀實際程式碼、整合點與外部文件，再決定流程與修改方案
- Execution: 探索範圍 -> 判斷是否需要 spec -> 查官方資料 -> 最小實作 -> 測試 -> 回填或總結
- Quality: 不因怕麻煩而跳過 spec，也不為小改動硬開 spec；只做與需求直接相關的修改
- Output: 交付符合需求的行為變更、可追溯的測試結果，以及在需要時保持誠實的計劃文件狀態

## 技能目標

在不打亂既有系統邊界的前提下，為 brownfield 專案安全地增強功能或調整行為，並用合適的spec流程與測試策略把風險控制在可驗證範圍內。

## 驗收條件

- 在動手前已讀懂受影響模組、入口點、整合邊界與變更爆炸半徑
- 已正確判斷這次工作是直接實作還是必須先走 `generate-spec` / `recover-missing-plan`
- 每個非平凡變更都經過 `test-case-strategy`，並留下清楚的 oracle、驗證方式與 `N/A` 理由
- 若使用了 spec，則批准、實作、回填與真實狀態同步全部完成；若未使用 spec，則最終摘要足以說明風險、測試與限制

## 工作流程

1. 先完整閱讀相關模組、資料流、整合點與現有測試，明確界定這次變更會影響哪些地方
2. 判斷是否需要spec流程；若涉及新的或改變後的使用者可見行為、跨模組協調、高風險敏感流程、重大歧義，則走 `generate-spec`；如果使用者指定的 plan 路徑缺失或不一致，先用 `recover-missing-plan`
3. 若不需要 spec，明確說出不開 spec 的理由；若需要 spec，必須等批准後才能改產品程式碼
4. 查閱變更所依賴的官方文件、API spec或工具文件，尤其是外部整合與契約邏輯
5. 以最小差異實作需求，不順手做額外重構或範圍擴張
6. 使用 `test-case-strategy` 選擇單元、回歸、property、integration、E2E 或 adversarial 測試，跑測試並修正失敗
7. 若使用了 spec，回填 `spec.md`、`tasks.md`、`checklist.md`、`contract.md`、`design.md` 與任何 `coordination.md`；若未使用 spec，輸出簡潔的結果摘要、測試證據與剩餘限制

## 使用範例

- 「新增一套影響 API、資料庫與 UI 的權限模型」-> 先走 `generate-spec`，批准後再實作，並補上跨層測試
- 「修正分頁 off-by-one，讓行為回到 README 描述」-> 不開 spec，直接修復並加回歸測試
- 「目前指定的 `docs/plans/...` 不見了，但使用者要沿著它繼續做」-> 先用 `recover-missing-plan` 還原或重建，再繼續

## 參考資料索引

- `generate-spec`：需要書面批准時的spec流程
- `recover-missing-plan`：修復缺失或不一致的計劃檔
- `test-case-strategy`：非平凡變更的測試選型與 oracle 設計
- `commit-and-push`：使用者要求提交或推送時的最終交付流程
