---
name: implement-specs
description: 當你需要在當前分支之中實作spec時，使用這個技能。
---

## 技能目標

實作用戶指定的spec。確保所有任務都被完成，用戶所有需求都被滿足。

## 驗收條件

- 在所有被用戶要求實作的spec之中，所有的 `checklist.md`, `tasks.md`, `spec.md` 當中所有非用戶填寫的任務相關checkboxes全部被勾選為完成狀態

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

按照以上文件，閱讀repo，理解本次spec的實作範圍。

### 2. 實作spec任務

嚴格按照 `tasks.md` 之中定義的任務，逐項完成實作。如果有多份 `tasks.md` 存在於多份spec之中，則依照 `coordination.md` 之中建議的merge順序進行實作。
在確認完成所有任務之後，將 `tasks.md` 之中的所有checkboxes勾選為完成。

如果實作的spec是batch spec，且有 `preparation.md`，在開始實作之前需要先完成 `preparation.md` 之中所規定的任務內容，並在驗收條件滿足之後回填 `preparation.md`。

### 3. 驗證實作

按照 `checklist.md` 之中定義的驗收標準，逐項驗收並檢查任務是否完成。對於未達到驗收標準的任務，必須重新實作及重新驗收，並在完成驗收之後將所有 `checklist.md` 之中的checkboxes勾選為完成。

### 4. 回填spec

確保所有實作任務完成並通過驗收之後，更新 `spec.md` 之中的需求checkboxes反應實際代碼實作狀態。

## 範例

- "用戶指定了一份有四份spec的batch spec並要求實作這份batch spec。同時，`coordination.md` 之中建議merge順序是 spec 1 -> spec 2 -> spec 3 -> spec 4。" -> "從spec 1開始進行完整的實作流程，並在完成回填spec之後再開始實作spec 2，直至4份spec都被完成"
- "用戶指定了一份有2份spec的batch spec並要求實作這份batch spec。同時，`coordination.md` 之中的建議merge順序是spec 2 -> spec 1，並且 `preparation.md` 存在於該batch spec之中。" -> "先實作 `preparation.md` 之中要求的任務並按照當中的驗收標準進行驗收。確定完成之後，從spec 2開始完整的實作流程。並在完成spec 2之後再實作 spec 1。"
