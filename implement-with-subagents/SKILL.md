---
name: implement-with-subagents
description: 當有多份規格文檔需要被實作時，且環境允許使用subagents，建議使用本技能調度subagents完成任務
---

## 目標

調度多個subagents完成規格文檔的實作。

## 驗收條件

- 在所有被用戶要求實作的spec之中，所有的 `checklist.md`, `tasks.md`, `spec.md` 當中所有非用戶填寫的checkboxes全部被勾選為完成狀態
- 所有變更已經從各個subagents的工作分支合併回當前所在分支
- 所有subagents創建的工作分支及工作樹已經被清理

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

### 2. 完成前置準備工作（如有）

如果實作的batch spec 有 `preparation.md`，你需要在開始實作之前需要先完成 `preparation.md` 之中所規定的任務內容，並在驗收條件滿足之後回填 `preparation.md`。使用 `commit` 技能並遵守當中的流程將前置準備工作提交，不需要推送到remote。

### 3. 規劃subagents調度順序

識別各份spec之間的依賴關係，並建立調度順序。將多份spec的實作切分為多個實作批次。每一個實作批次內部的spec之間沒有互相依賴。完成實作批次的建立之後，為每一個subagents分配僅一份spec，並且開始實作。

在開始實作一個新的實作批次之前，你需要使用 `merge-changes-from-local-branches` 技能，遵守當中的流程，將前一個實作批次的變更從本地其他分支合併回來。

### 4. 驗收工作

完成所有實作批次的合併之後，你需要閱讀所有spec之中的 `checklist.md`, `tasks.md`, `spec.md`，並確保當中非用戶填寫的任務相關checkboxes都被勾選為完成。

## 範例

- "用戶要求實作一份batch spec。該batch spec有5份spec。spec 2依賴於 spec 1，spec 4依賴於spec 3，spec 5依賴於spec 2, spec 4。" -> "將batch spec切分為3個實作批次。第一批，先派發兩個subagents各自實作spec 1, spec 3，並將變更合併回當前分支；第二批派發兩個subagents個字實作spec 2, spec 4，並將變更合併回當前分支；第三批派發subagent實作spec 5，並將變更合併回當前分支。完成驗證工作之後向用戶回報成果。"
- "用戶要求實作一份batch spec。該batch spec有3份spec，並且存在 `preparation.md`。3份spec之間各自無依賴關係。" -> "先完成 `preparation.md` 的實作並提交。然後啟動三個subagents並行完成三份spec的任務。完成之後，將變更合併回當前分支。完成驗證工作之後向用戶回報結果。"