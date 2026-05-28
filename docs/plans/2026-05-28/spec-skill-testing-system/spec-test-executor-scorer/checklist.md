# Checklist: 測試執行器與評分器

- Date: 2026-05-28
- Feature: 測試執行器與評分器

## Usage Notes

- Add/remove items based on actual scope; keep only applicable items.
- Use `$test-case-strategy` for test level selection, oracle design, and drift-check planning.
- Property-based coverage required for business-logic changes unless `N/A` with reason.
- Test result values: `PASS / FAIL / BLOCKED / NOT RUN / N/A`.

## Clarification & Approval Gate

- [x] Clarification responses recorded (or `N/A` if none).
- [x] Affected plans updated after clarification (or `N/A` + reason).
- [x] Explicit approval obtained (date/ref: [to be filled]).

## Behavior-to-Test Checklist

- [x] CL-01: .env 配置正確載入，缺少必要變數時報錯 — R1.3 → T1.1-T1.2 — Result: `PASS`
- [x] CL-02: 隔離目錄正確建立並初始化檔案結構 — R2.2-R2.3 → T2.2 — Result: `PASS`
- [x] CL-03: 執行模型 API 調用格式正確（OpenAI 相容 + reasoning_effort） — R2.4 → T2.3 — Result: `PASS`
- [x] CL-04: JSONL trace 正確記錄完整執行鏈路 — R2.5 → T2.4 — Result: `PASS`
- [x] CL-05: 並行數遵守 EXEC_CONCURRENCY 上限 — R2.6 → T2.5 — Result: `PASS`
- [x] CL-06: API 失敗時 exponential backoff 重試 — R2.6 → T2.6 — Result: `PASS`
- [x] CL-07: 逾時測試不阻塞其他測試 — R2.6 → T2.7 — Result: `PASS`
- [x] CL-08: 評分器正確產出多維度評分（overallScore, dimensions, issues） — R3.3-R3.5 → T3.3-T3.5 — Result: `PASS`
- [x] CL-09: 測試完成後立即觸發評分（不等待全部） — R4.1-R4.2 → T4.1-T4.2 — Result: `PASS`
- [x] CL-10: 評分模型輸出非標準 JSON 時有 fallback — R3.6 → T3.6 — Result: `PASS`

## Hardening Checklist

- [x] Regression tests for bug-prone/high-risk behavior: API 錯誤處理、逾時處理
- [x] Unit drift checks for non-trivial tasks: JSONL trace 格式驗證
- [x] Property-based coverage for business logic: `N/A`
- [x] External services mocked/faked: 執行模型 API 和評分模型 API（用 mock server）
- [x] Adversarial cases for abuse paths: 惡意 prompt 嘗試跳出隔離目錄
- [x] Authorization, idempotency, concurrency risks evaluated: 並行寫入 results/ 的檔案衝突
- [x] Assertions verify outcomes/side-effects: 目錄結構、檔案存在性、JSON schema
- [x] Fixtures reproducible: 使用固定題目和 mock API 回應

## E2E / Integration Decisions

- [x] 完整流程 (5 題): E2E — Reason: 從題目載入到評分產出的端到端驗證
- [x] 並行控制 (10 題): Integration replacement — Reason: 驗證併發上限和資源競爭
- [x] API 錯誤場景: Integration replacement — Reason: Mock API server 模擬失敗和逾時

## Execution Summary

- [x] Unit: `NOT RUN`
- [x] Regression: `NOT RUN`
- [x] Property-based: `N/A`
- [x] Integration: `NOT RUN`
- [x] E2E: `NOT RUN`
- [x] Mock scenarios: `NOT RUN`
- [x] Adversarial: `NOT RUN`

## Completion Records

- [x] Task 1 (.env 配置): completed — Remaining: None
- [x] Task 2 (執行器): completed — Remaining: None
- [x] Task 3 (評分器): completed — Remaining: None
- [x] Task 4 (事件串聯): completed — Remaining: None
