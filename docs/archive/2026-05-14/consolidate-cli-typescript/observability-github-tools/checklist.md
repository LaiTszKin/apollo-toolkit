# Checklist: Observability and GitHub Tools Migration

- Date: 2026-05-14
- Feature: Observability and GitHub Tools Migration

## Usage Notes

- Python → TypeScript 移植：重點是輸出行為一致性，不是邏輯重構
- GitHub 工具依賴外部 gh CLI，測試需在環境中有 gh 或使用 mock

## Clarification & Approval Gate

- [ ] Clarification responses recorded (N/A — no clarification questions).
- [ ] Affected plans updated after clarification (N/A).
- [ ] Explicit approval obtained (date/ref: [to be filled]).

## Behavior-to-Test Checklist

- [ ] CL-01: `apltk filter-logs` 輸出與 Python 版一致 — R1.1~R1.3 → `test/tools/filter-logs.test.ts` — Result: `NOT RUN`
- [ ] CL-02: `apltk search-logs` 輸出與 Python 版一致 — R2.1~R2.3 → `test/tools/search-logs.test.ts` — Result: `NOT RUN`
- [ ] CL-03: `apltk open-github-issue` JSON 輸出 schema 一致 — R3.1~R3.3 → `test/tools/open-github-issue.test.ts` — Result: `NOT RUN`
- [ ] CL-04: `apltk find-github-issues` 輸出格式一致 — R4.1 → `test/tools/find-github-issues.test.ts` — Result: `NOT RUN`
- [ ] CL-05: `apltk read-github-issue` 輸出格式一致 — R4.2 → `test/tools/read-github-issue.test.ts` — Result: `NOT RUN`
- [ ] CL-06: `apltk review-threads list/resolve` 功能一致 — R5.1~R5.2 → `test/tools/review-threads.test.ts` — Result: `NOT RUN`

## Hardening Checklist

- [ ] Regression tests: 日誌工具的 snapshot 測試（固定輸入 → 固定輸出）
- [ ] External services mocked/faked: gh CLI 通過 mock exec 進行單元測試
- [ ] Adversarial cases: 無效正則、損壞的 JSON payload、空檔案、不存在的 repo
- [ ] Assertions verify outcomes: 比對 stdout/stderr 而非僅檢查退出碼

## E2E / Integration Decisions

- [ ] GitHub 工具 E2E: 需真實 gh 環境 — Reason: 暫以 mock 測試覆蓋，E2E 視需要補充
- [ ] 日誌工具 E2E: Snapshot test with fixture log file — Reason: 確認移植後行為完全一致

## Execution Summary

- [ ] Unit: `NOT RUN`
- [ ] Regression: `NOT RUN`
- [ ] Property-based: `N/A`
- [ ] Integration: `NOT RUN`
- [ ] E2E: `NOT RUN`
- [ ] Mock scenarios: `NOT RUN`
- [ ] Adversarial: `NOT RUN`

## Completion Records

- [ ] All tools migrated: pending — Remaining: 全部 tasks
