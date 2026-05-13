---
name: version-release
description: 當你需要協助用戶完成版本發佈時，使用這個技能。
---

## 技能目標

幫用戶完成自動化版本發佈流程

## 驗收條件

- `CHANGELOG.md`, `docs/` 下所有項目文檔已經被同步到最新狀態
- Github release, Github version tag 被完成創建

## 工作流程

### 1. 檢查並確認 repo 狀態

閱讀目前的 repo 狀態。查看是否依然存在未提交變更。如有，使用 `commit-and-push` 技能將目前為提交的變更暫存並提交。推送到 remote。

### 2. 更新項目文檔狀態

完整閱讀上一次發佈版本至今的所有變更，並檢查文檔之中的表述是否存在錯誤或遺漏。如有，使用 `align-project-documents`, `maintain-project-constraints` 這兩個技能將所有項目文檔同步到最新狀態。
如果外部環境允許使用 subagents，建議通過調度subagents完成變更的逐行深度閱讀。

### 3. 發佈版本

確認所有文檔都已經被更新之後，更新 repo 的版本文件（如 pyproject.toml, cargo.toml）。
使用 `commit-and-push` 技能將所有變更提交並推送到 remote。
最後，將用戶要求的版本所對應的 version tag 推送到 remote 並建立 github release。

## 參考資料索引

- `references/semantic-versioning.md`：版本號選擇規則
- `references/commit-messages.md`：release commit 訊息格式
- `references/branch-naming.md`：分支命名慣例
- `references/changelog-writing.md`：`CHANGELOG.md` 與 `Unreleased` 維護規則
- `references/readme-writing.md`：README 只在必要時同步更新
