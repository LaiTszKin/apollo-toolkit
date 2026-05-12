---
name: commit-and-push
description: 提供提交指引以及作為提交前的必要品控閘門。當你需要將變更提交到git repo或者是推送到remote，使用這個技能。
---

## 目標

在不破壞使用者既有工作樹與提交邊界的前提下，安全地完成本地 commit 與可選 push，並確保所有提交前的審查、文件同步與 changelog 門檻都已真正完成。

## 驗收條件

- 所有暫存的變更已經被提交和推送到remote

## 工作流程

### 1. 檢查變更狀態

檢查目前的git變更狀態。識別變更範圍及確認目前暫存變更之中是否包含代碼變更。

### 2. 品控閘門（選用）

如果變更範圍設計代碼變更，使用 `review-change`, `discover-edge-cases`, `discover-security-issues` 這三個技能，並遵從當中的任務指引，對代碼變更進行審查。
如果外部環境允許使用subagents，建議通過調度subagents完成三個不同維度的代碼審查工作。
如果在審查過程中發現問題，修復發現的問題並暫存。

### 3. 同步項目文檔

使用 `submission-readiness-check` 並遵照當中的指引，同步更新項目文檔，確保項目文檔時刻與repo保持一致。

### 4. 提交及推送變更

依使用者的 staging 邊界建立 commit，提交訊息遵循 `references/commit-messages.md`。
只有在使用者明確要求更新remote時才 push。

## 範例

- 「只把已 staged 的 `foo.ts` 提交」-> 只能提交已暫存內容，不能順手把未 staged 的 `bar.ts` 一起帶進來
- 「幫我 push 這個 branch」-> 先完成 review 與 readiness gate，再 push，最後用 hash 證明remote已同步
- 「順便幫我發版」-> 不使用本技能，改走 `version-release`

## 參考資料索引

- `references/commit-messages.md`：提交訊息格式
- `references/branch-naming.md`：分支命名慣例