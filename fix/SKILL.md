---
name: fix
description: 依照 code review report 中的建議方案修復代碼問題。P0-P3 等級逐一處理。
---

## 技能目標

遵照 code review report 的建議方案修正代碼問題。
逐一處理所有發現的問題。

## 驗收條件

- 所有 code review report 中明確列出的 P0-P3 問題都已被完全修復。

## 工作流程

### 1. 完整閱讀 code review report

完整閱讀 code review report 及相關受影響代碼，理解建議修復方案。
如果外部環境允許使用 subagents，建議通過並行調度 subagents 完成對代碼的深度閱讀。

### 2. 修復發現的問題

按 code review report 的嚴重度排序。
從最高嚴重度的問題開始修復。
使用 `systematic-debug` 技能。

若外部環境允許使用 subagents，將修復任務拆分並分配給多個 subagents。
透過 worktree 並行完成修復。
結束後合併回當前分支。