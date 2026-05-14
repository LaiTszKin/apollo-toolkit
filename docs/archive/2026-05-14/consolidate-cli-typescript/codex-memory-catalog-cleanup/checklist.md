# Checklist: Codex Memory Catalog and Cleanup

- Date: 2026-05-14
- Feature: Codex Memory Catalog and Cleanup

## Usage Notes

- Spec 4 是最後的整合和清理階段，必須在所有前三個 spec 完成後執行
- 清理操作具有破壞性（刪除檔案），需在合併前驗證所有 handler 正常運作

## Clarification & Approval Gate

- [ ] Clarification responses recorded (N/A — no clarification questions).
- [ ] Affected plans updated after clarification (N/A).
- [ ] Explicit approval obtained (date/ref: [to be filled]).

## Behavior-to-Test Checklist

- [ ] CL-01: `apltk validate-skill-frontmatter` 輸出正確 — R3.1 → snapshot test — Result: `NOT RUN`
- [ ] CL-02: `apltk validate-openai-agent-config` 輸出正確 — R3.2 → snapshot test — Result: `NOT RUN`
- [ ] CL-03: `apltk extract-codex-conversations --hours 24` 行為一致 — R1.x → `test/tools/extract-conversations.test.ts` — Result: `NOT RUN`
- [ ] CL-04: `apltk extract-skill-conversations --hours 24` 行為一致 — R1.x → 同上 — Result: `NOT RUN`
- [ ] CL-05: `apltk sync-codex-memory-index` 行為一致 — R2.1 → `test/tools/sync-memory-index.test.ts` — Result: `NOT RUN`
- [ ] CL-06: `apltk architecture diff` 生成正確 viewer — R4.x → `test/tools/architecture.test.ts` — Result: `NOT RUN`
- [ ] CL-07: 所有 `scripts/` 目錄已刪除 — R5.1 → `find . -name scripts -type d` — Result: `NOT RUN`
- [ ] CL-08: `npm test` 全部通過 — R5.5 → CI — Result: `NOT RUN`
- [ ] CL-09: SKILL.md 無遺留腳本引用 — R6.x → `grep -r "scripts/" --include="SKILL.md"` — Result: `NOT RUN`

## Hardening Checklist

- [ ] 清理前建立備份或確認 git 可回復（commit 已保存）
- [ ] 每個腳本刪除前確認對應 handler 已正確實作且測試通過
- [ ] Adversarial cases: 確認不會誤刪 `scripts/` 目錄外的文件
- [ ] installer 修改後驗證 install round-trip 測試通過

## E2E / Integration Decisions

- [ ] Install→Tool execution round-trip: E2E — Reason: 驗證安裝後的技能可正常通過 CLI 使用所有工具
- [ ] Full `npm test` run: Integration — Reason: 確認所有測試通過

## Execution Summary

- [ ] Unit: `NOT RUN`
- [ ] Regression: `NOT RUN`
- [ ] Property-based: `N/A`
- [ ] Integration: `NOT RUN`
- [ ] E2E: `NOT RUN`
- [ ] Mock scenarios: `N/A`
- [ ] Adversarial: `NOT RUN`

## Completion Records

- [ ] All tools migrated & cleanup done: pending — Remaining: 全部 tasks
