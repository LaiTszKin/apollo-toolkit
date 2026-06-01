---
name: version-release
description: 協助完成自動化版本發佈。同步文檔、更新版本號、推送 tag 並建立 GitHub Release。
---

## 技能目標

協助用戶完成自動化版本發佈流程。

## 驗收條件

- `CHANGELOG.md`, `docs/` 下所有項目文檔已經被同步到最新狀態
- GitHub release 與 version tag 已被建立

## 工作流程

### 1. 檢查並確認 repo 狀態

檢查 repo 狀態。
若有未提交變更，使用 `commit` 技能暫存並提交。推送到 remote。

### 2. 更新項目文檔狀態

通過並行調度 subagents 完成變更的逐行深度閱讀，檢查文檔是否存在錯誤或遺漏。
若有，使用 `docs-project`、`maintain-project-constraints` 將文檔同步到最新。

### 3. 發佈版本

確認所有文檔已更新。
更新 repo 的版本文件（如 pyproject.toml）。
使用 `commit` 技能提交並推送所有變更。
最後推送 version tag 並建立 GitHub release。

## 參考資料索引

- `references/semantic-versioning.md`：版本號選擇規則
- `references/commit-messages.md`：release commit 訊息格式
- `references/branch-naming.md`：分支命名慣例
- `references/changelog-writing.md`：`CHANGELOG.md` 與 `Unreleased` 維護規則
- `references/readme-writing.md`：README 只在必要時同步更新
