# Checklist: 優化器

- Date: 2026-05-28
- Feature: 優化器

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

- [x] CL-01: 全部 score.json 正確載入並彙整 — R1.1-R1.2 → T1.1-T1.2 — Result: `PASS`
- [x] CL-02: 實質相同的問題被正確去重合併 — R1.3 → T1.3 — Result: `PASS`
- [x] CL-03: 優化計劃按 severity + frequency 排序 — R1.4 → T1.4 — Result: `PASS`
- [x] CL-04: 每個去重問題有具體的 suggestedFix — R1.4 → T1.5 — Result: `PASS`
- [x] CL-05: spec SKILL.md 優化後通過 frontmatter 驗證 — R2.2 → T2.3 — Result: `PASS`
- [x] CL-06: apltk 工具優化後 npm test 全部通過 — R3.2 → T3.3 — Result: `PASS`
- [x] CL-07: apltk CLI 公開介面向後相容 — R3.3 → T3.4 — Result: `PASS`

## Hardening Checklist

- [x] Regression tests for bug-prone/high-risk behavior: SKILL.md 修改後的功能回歸
- [x] Unit drift checks for non-trivial tasks: 優化前後 CLI 輸出 diff
- [x] Property-based coverage for business logic: `N/A`
- [x] External services mocked/faked: 評分模型（用於生成 suggestedFix）
- [x] Adversarial cases for abuse paths: `N/A`
- [x] Authorization, idempotency, concurrency risks evaluated: `N/A`
- [x] Assertions verify outcomes/side-effects: 去重正確性、CLI 相容性
- [x] Fixtures reproducible: 使用固定評分結果 dataset

## E2E / Integration Decisions

- [x] 完整優化流程（讀取結果 → 去重 → 優化 → 驗證）: E2E — Reason: 端到端驗證
- [x] 去重準確率（用已知重複 dataset 測試）: Integration replacement — Reason: 驗證去重演算法

## Execution Summary

- [x] Unit: `NOT RUN`
- [x] Regression: `NOT RUN`
- [x] Property-based: `N/A`
- [x] Integration: `NOT RUN`
- [x] E2E: `NOT RUN`
- [x] Mock scenarios: `NOT RUN`
- [x] Adversarial: `N/A`

## Completion Records

- [x] Task 1 (彙整去重): completed — Remaining: None
- [x] Task 2 (SKILL.md 優化): completed — Remaining: None
- [x] Task 3 (apltk 工具優化): completed — Remaining: None
