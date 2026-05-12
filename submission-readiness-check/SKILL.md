---
name: submission-readiness-check
description: >-
  用於在 commit、push、PR 或 release 前做最後同步檢查。會確認 `CHANGELOG.md`、
  專案文件、`AGENTS.md` / `CLAUDE.md` 與已完成的 planning artifacts 是否都已更新到可提交狀態。
---

# 提交前就緒檢查

## Dependencies

- Required: `align-project-documents`、`maintain-project-constraints`
- Conditional: `archive-specs`
- Optional: 無
- Fallback: 若必需技能不可用，或明確需要 spec 歸檔但 `archive-specs` 不可用，必須停止並回報，不得給出虛假的 ready verdict

## Standards

- Evidence: 以實際 git diff、staged set、planning artifacts、`CHANGELOG.md` 與現有專案文件作為就緒判斷依據
- Execution: 先確認下游提交類型，再處理 spec 歸檔、文件同步與 changelog，最後才給出 ready 或 blocking verdict
- Quality: 所有命中的條件 gate 都必須真正完成；不能把 stale changelog、未同步文件或仍活躍的 plan set 當成小問題略過
- Output: 回傳清楚的可提交判定，列出已同步項目與仍阻塞下游提交流程的問題

## 技能目標

在任何提交、推送、開 PR 或發版前，先把 repository 的外部說明、內部約束與 planning artifacts 同步到一致狀態，避免把未整理完成的變更交給下一個提交流程。

## 驗收條件

- 已盤點真實的提交面，包括 git 狀態、staged diff、現有 docs、planning artifacts 與目標提交流程
- 當 spec 已完成且應轉成長期文件時，已先完成 `archive-specs`，而不是把它留給後續流程猜測處理
- `docs/`、`AGENTS.md` / `CLAUDE.md` 與必要的 `README.md` 已根據實際行為與工作流程同步
- `CHANGELOG.md` 的 `Unreleased` 區塊已準確對應這次將提交、開 PR 或發版的真實範圍
- 最終輸出的是明確的 ready / blocking verdict，而不是模糊警告

## 工作流程

1. 先讀取 git 狀態、staged / unstaged diff，並盤點 repo 是否有 `CHANGELOG.md`、`AGENTS.md`、`CLAUDE.md`、標準化 `docs/` 結構，以及任何 `docs/plans/...` 計劃集
2. 判斷下游流程屬於 `commit-push`、`pull-request` 或 `release`，因為不同流程對 changelog 與發版資料的要求不同
3. 檢查 planning artifacts 是否應轉檔；只要 plan set 已對應本次交付成果，或專案文件仍未標準化，就必須先跑 `archive-specs`
4. 在 spec 歸檔判斷完成後，同步專案文件；必要時執行 `align-project-documents` 更新 `docs/`，再用 `maintain-project-constraints` 更新 `AGENTS.md` / `CLAUDE.md`
5. 檢查 `CHANGELOG.md`：對 commit / PR 流程，要讓 `Unreleased` 精準反映這次待提交內容，同時保留其他未出貨工作；對 release 流程，`Unreleased` 必須非空且已整理成可直接切版的 release notes
6. 彙整哪些項目已同步、哪些仍阻塞；若還有未完成的 gate，明確回報 blocking item，而不是把責任留給下一個技能

## 使用範例

- 「準備提交這批變更」-> 檢查是否有未同步 changelog、文件與已完成但尚未歸檔的 spec
- 「準備開 PR」-> 確保 `Unreleased` 反映當前 PR 範圍，並把 `AGENTS.md` / `CLAUDE.md` 與 docs 同步好
- 「準備發版」-> 確保 `Unreleased` 非空且可直接作為 release notes，並先完成任何必要的 spec 歸檔與文件標準化

## 參考資料索引

- `align-project-documents`：同步 `docs/features/`、`docs/architecture/`、`docs/principles/`
- `maintain-project-constraints`：同步 `AGENTS.md` / `CLAUDE.md`
- `archive-specs`：在符合條件時轉檔並歸檔 planning artifacts
