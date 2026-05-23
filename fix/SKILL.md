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

若外部環境允許使用 subagents，建議按照以下流程加速修復進度：
1. 讀取審查結果所發現的問題，識別每個問題對應的改進建議。
2. 閱讀相關審查代碼，並識別任務之間的相依性。
3. 將任務切分為多個批次，確保每個批次內的 subagents 都能夠並行工作。
4. 按照批次之間的依賴順序，調度 suabgents 完成所有修復任務，並將 subagents 的修復合併回當前分支。
5. 將已經合併的分支和 worktree 清理

如果使用 subagents，subagents 需要嚴格按照以下流程完成修復工作：
1. 閱讀受影響的檔案。
2. 創建分支及 worktree。
3. 在獨立 worktree 之中按照 code review report 的建議修復方案實作修復。