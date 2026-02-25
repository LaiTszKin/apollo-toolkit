# Checklist： [功能名稱]

- Date: [YYYY-MM-DD]
- Feature: [功能名稱]

## Usage Notes
- 此清單是「起始模板」，請依功能實際情況新增、刪減或改寫項目，不要機械照抄。
- 所有條目使用 `- [ ]`；完成後改為 `- [x]`。
- 若項目不適用，請保留或補充 `N/A` 與原因，避免留下模糊狀態。
- 測試結果建議使用：`PASS / FAIL / BLOCKED / NOT RUN / N/A`。

## Behavior-to-Test Checklist（可增刪）

- [ ] CL-01 [可觀察行為]
  - 需求對應：[R1.x]
  - 實際測試案例：[UT/PBT/IT/E2E-xx]
  - 測試層級：[Unit / Property-based / Integration / E2E]
  - 測試結果：`PASS / FAIL / BLOCKED / NOT RUN / N/A`
  - 備註（可選）：[風險、限制、觀察]

- [ ] CL-02 [可觀察行為]
  - 需求對應：[R?.?]
  - 實際測試案例：[UT/PBT/IT/E2E-xx]
  - 測試層級：[Unit / Property-based / Integration / E2E]
  - 測試結果：`PASS / FAIL / BLOCKED / NOT RUN / N/A`
  - 備註（可選）：[風險、限制、觀察]

- [ ] CL-03 [可觀察行為]
  - 需求對應：[R?.?]
  - 實際測試案例：[UT/PBT/IT/E2E-xx]
  - 測試層級：[Unit / Property-based / Integration / E2E]
  - 測試結果：`PASS / FAIL / BLOCKED / NOT RUN / N/A`
  - 備註（可選）：[風險、限制、觀察]

## E2E Decision Record（擇一或自訂）
- [ ] 建立 E2E（案例：[E2E-xx]；原因：[重要性/複雜度/跨層風險]）
- [ ] 不建立 E2E，改以整合測試覆蓋（替代案例：[IT-xx]；原因：[穩定性/成本/環境限制]）
- [ ] 不需額外 E2E/整合強化（原因：[風險可由現有測試充分覆蓋]）

## Execution Summary（依實際填寫）
- [ ] 單元測試：`PASS / FAIL / NOT RUN / N/A`
- [ ] Property-based 測試：`PASS / FAIL / NOT RUN / N/A`
- [ ] 整合測試：`PASS / FAIL / NOT RUN / N/A`
- [ ] E2E 測試：`PASS / FAIL / NOT RUN / N/A`

## Completion Rule
- [ ] Agent 已依實際情況更新 checkbox、測試結果與必要備註（含新增/刪減項目）。
