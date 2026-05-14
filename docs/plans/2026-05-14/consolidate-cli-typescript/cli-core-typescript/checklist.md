# Checklist: CLI Core TypeScript Conversion

- Date: 2026-05-14
- Feature: CLI Core TypeScript Conversion

## Usage Notes

- TypeScript 轉換不改變業務邏輯，重點是行為回歸驗證
- 使用 `$test-case-strategy` 進行 drift check

## Clarification & Approval Gate

- [ ] Clarification responses recorded (N/A — no clarification questions).
- [ ] Affected plans updated after clarification (N/A).
- [ ] Explicit approval obtained (date/ref: [to be filled]).

## Behavior-to-Test Checklist

- [ ] CL-01: `apltk --help` 輸出與原版一致 — R1.2 → `test/cli-parsing.test.ts` — Result: `NOT RUN`
- [ ] CL-02: `apltk tools --help` 輸出與原版一致 — R1.3 → `test/cli-parsing.test.ts` — Result: `NOT RUN`
- [ ] CL-03: `apltk <tool> --help` 輸出工具說明 — R2.4 → `test/tool-runner.test.ts` — Result: `NOT RUN`
- [ ] CL-04: `apltk codex --copy` 安裝成功 — R3.1 → `test/installer.test.ts` — Result: `NOT RUN`
- [ ] CL-05: `apltk uninstall codex --yes` 解除安裝成功 — R3.2 → `test/installer.test.ts` — Result: `NOT RUN`
- [ ] CL-06: handler 模式工具執行（待其他 spec 提供 handler 後驗證） — R2.2 → `test/tool-runner.test.ts` — Result: `NOT RUN`

## Hardening Checklist

- [ ] Regression tests for `parseArguments()` 所有分支 — N/A（新測試覆蓋）
- [ ] Unit drift checks: CLI 幫助文本 snapshot 測試
- [ ] Property-based coverage for business logic — N/A（CLI 核心為調度邏輯，非業務邏輯）
- [ ] External services mocked/faked — N/A（無外部服務依賴）
- [ ] Adversarial cases: 異常參數組合（`--home` 缺值、`uninstall` + 無效 mode 等）
- [ ] Authorization, idempotency, concurrency risks evaluated — N/A
- [ ] Assertions verify outcomes/side-effects, not just "returns 200"

## E2E / Integration Decisions

- [ ] Install→Uninstall round-trip: Integration test — Reason: 驗證 installer 模組轉換後行為一致
- [ ] Full CLI help output: Snapshot test — Reason: 保證使用者體驗不變

## Execution Summary

- [ ] Unit: `NOT RUN`
- [ ] Regression: `NOT RUN`
- [ ] Property-based: `N/A`
- [ ] Integration: `NOT RUN`
- [ ] E2E: `NOT RUN`
- [ ] Mock scenarios: `N/A`
- [ ] Adversarial: `NOT RUN`

## Completion Records

- [ ] CLI Core TS Conversion: pending — Remaining: 全部 tasks
