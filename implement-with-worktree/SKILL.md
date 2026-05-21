---
name: implement-with-worktree
description: 在獨立分支及工作樹中實作 spec。按 tasks.md 逐項實作，按 checklist.md 逐項驗收。完成後提交到子分支，保持主分支乾淨。
---

## 技能目標

在獨立分支及工作樹中實作用戶指定的 spec，確保所有任務完成且用戶需求被滿足。

## 驗收條件

- 對所有被要求實作的 spec，相關文件中的任務 checkboxes 全部被勾選為完成
- 這些文件包括 `checklist.md`、`tasks.md`、`spec.md`
- 不包含用戶自行填寫的項目

## 工作流程

### 1. 定位實作範圍

閱讀用戶指定的spec：

- `spec.md` 定義了用戶的需求
- `tasks.md` 定義了詳細的實作任務
- `checklist.md` 定義了任務的完成和驗收條件
- `contract.md` 定義了spec的外部依賴
- `design.md` 定義了相關業務鏈路的架構設計
- `coordination.md`（如有）定義了batch spec之中各份spec各自的實作邊界
- `preparation.md`（如有）定義了實作batch spec之前各spec的共用準備工作

閱讀 repo。
理解本次 spec 的實作範圍。

### 2. 創建子分支及worktree

從當前分支創建子分支及 worktree。
分支以規格文檔的實際變更命名，且需符合通用開發規範（如 feat/event-bus-backend）。

### 3. 實作spec任務

嚴格按照 `tasks.md` 定義的任務逐項實作。
若有多份 `tasks.md` 存在於多份 spec 中，依照 `coordination.md` 建議的 merge 順序進行實作。
在確認完成所有任務之後，將 `tasks.md` 中的所有 checkboxes 勾選為完成。

若實作的 spec 是 batch spec，且有 `preparation.md`，在開始實作前先完成其規定的任務。
驗收條件滿足後回填 `preparation.md`。

### 4. 驗證實作

按照 `checklist.md` 定義的驗收標準，逐項驗收並檢查任務是否完成。
未達到驗收標準的任務必須重新實作與驗收。
通過後將 `checklist.md` 中的 checkboxes 勾選為完成。

### 5. 回填spec

確保所有實作任務完成並通過驗收之後，更新 `spec.md` 中的需求 checkboxes。
以反映實際代碼實作狀態。

### 6. 提交變更

使用 `commit` 將變更提交到子分支上。不需要將變更推送到remote。

## 範例

- "用戶指定了一份有四份spec的batch spec並要求實作這份batch spec。同時，`coordination.md` 之中建議merge順序是 spec 1 -> spec 2 -> spec 3 -> spec 4。" -> "創建子分支及工作樹；從spec 1開始進行完整的實作流程，並在完成回填spec之後再開始實作spec 2，直至4份spec都被完成"
- "用戶指定了一份有2份spec的batch spec並要求實作這份batch spec。同時，`coordination.md` 之中的建議merge順序是spec 2 -> spec 1，並且 `preparation.md` 存在於該batch spec之中。" -> "創建子分支及工作樹；先實作 `preparation.md` 之中要求的任務並按照當中的驗收標準進行驗收。確定完成之後，從spec 2開始完整的實作流程。並在完成spec 2之後再實作 spec 1。"

## 參考資料

- `references/branch-naming.md` - 建議分支命名方式