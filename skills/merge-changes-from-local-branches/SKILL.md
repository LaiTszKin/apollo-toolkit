---
name: merge-changes-from-local-branches
description: 將 spec 相關的本地實作分支合併回當前分支。按 coordination.md 的建議順序解決衝突。
---

## 技能目標

將 spec 相關的本地實作分支合併回當前分支。
依 coordination.md 順序處理衝突。

## 驗收條件

- 分支的變更被合併，且所有潛在衝突代碼被解決。

## 工作流程

### 1. 建立規格文檔基線認知

閱讀用戶指定的 spec。
查看目前分支狀態。
找到與 spec 相關的分支。

### 2. 合併分支及處理衝突

按照 `coordination.md` 的建議順序合併分支。
解決衝突時，確保 spec 要求的功能沒有被破壞。

### 3. 提交變更

使用 `commit` 技能，將變更提交到當前分支上，不需要 push 到 remote。