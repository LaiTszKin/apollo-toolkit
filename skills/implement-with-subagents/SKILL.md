---
name: implement-with-subagents
description: 當有多份規格文檔需並行實作時，調度 subagents 按依賴關係分批完成各份 spec，並將變更合併回當前分支。不用於單一 spec 的實作（請使用 implement），不用於無 coordination.md 的 batch spec。
---

## 目標

調度多個 subagents 並行完成規格文檔的實作。

## 驗收條件

- 對所有被要求實作的 spec，相關文件中的任務 checkboxes 全部被勾選為完成
- 這些文件包括 `checklist.md`、`tasks.md`、`spec.md`
- 不包含用戶自行填寫的項目
- 所有變更已從各 subagents 的工作分支合併回當前分支
- 所有 subagents 建立的工作分支及工作樹已被清理
- 所有批次合併後測試套件通過

## 工作流程

### 1. 定位實作範圍

閱讀用戶指定的 spec：

- `spec.md` 定義了用戶的需求
- `tasks.md` 定義了詳細的實作任務
- `checklist.md` 定義了任務的完成和驗收條件
- `contract.md` 定義了 spec 的外部依賴
- `design.md` 定義了相關業務鏈路的架構設計
- `coordination.md`（如有）定義了 batch spec 之中各份 spec 各自的實作邊界
- `preparation.md`（如有）定義了實作 batch spec 之前各 spec 的共用準備工作

按照以上文件，閱讀 repo，理解本次 spec 的實作範圍。

### 2. 完成前置準備工作（如有）

若 batch spec 有 `preparation.md`，在開始實作前先完成其規定的任務。
驗收後回填 `preparation.md`。
使用 `commit` 技能提交前置準備工作。不需要推送到 remote。

### 3. 規劃 subagents 調度順序

識別各份 spec 之間的依賴關係，並建立調度順序。將多份 spec 的實作切分為多個實作批次。每一個實作批次內部的 spec 之間沒有互相依賴。

#### 3a. Scope Contract

為每個批次中的每份 spec 建立簡短宣告：

```text
Spec: [spec 名稱]
目標檔案: [預計修改的檔案列表]
變更類型: [新增功能 / 重構 / bug fix]
風險標記: [auth / schema / 資料庫 migration / 外部 API]

```

若兩份同批次的 spec 目標檔案有重疊，不應並行處理。

#### 3b. 檔案重疊檢測

在派發 subagent 前，對同一批次內的各份 spec 進行檔案重疊檢查：
- 比對各 spec 預計修改的檔案列表
- 若存在檔案重疊，將該等 spec 移至不同批次或改為循序執行
- 可使用 `git merge-tree` 對不同分支進行預先衝突檢測（無需實際合併）

**非重疊的檔案所有權是平行開發最重要的規則**。沒有兩個 subagent 應同時編輯相同檔案。

#### 3c. Lockfile 處理規則

若批次中有多份 spec 可能修改 lockfile（`package-lock.json`、`yarn.lock` 等）：
- 在調度層指定**一個 subagent** 負責最終的 lockfile 更新
- 或告知所有 subagent 不要修改 lockfile，由 CI 在合併後統一重新產生

#### 3d. 派發 subagent

每一個被創建的 subagent 都需要有專屬的獨立 worktree。

每一個 subagent 的工作流程如下：
1. 使用 `implement` 技能實作 spec
2. 使用 `commit` 技能將變更提交到所屬 worktree

#### 3e. 錯誤恢復

若 subagent 執行失敗（超時、當機、或回報無法完成）：
- 若失敗原因明確（如外部服務不可用），記錄後跳過該 spec，繼續其他任務
- 若失敗原因不明，重試一次。再次失敗則記錄異常並通知用戶
- 同批次中其他成功的 subagent 結果不受影響 — 不因單一失敗而廢棄整批成果

### 4. 批次邊界驗證

在開始新的實作批次前，使用 `merge-changes-from-local-branches` 技能。
將前一批次的變更從本地其他分支合併回來。

**合併後必須執行完整測試套件**，確認無 regression 後才進入下一批次。

### 5. 最終驗收工作

完成所有批次的合併後：
1. 閱讀所有 spec 中的 `checklist.md`、`tasks.md`、`spec.md`，確保非用戶填寫的任務 checkboxes 都被勾選為完成
2. 執行完整測試套件，確認所有測試通過
3. 確認 lockfile 無衝突（若有指定 lockfile agent，確認其變已被納入）

## 範例

- "用戶要求實作一份含 5 份 spec 的 batch spec。spec 2 依賴 spec 1，spec 4 依賴 spec 3，spec 5 依賴 spec 2 與 spec 4。" -> "切分為 3 個批次。第一批派發兩個 subagents 實作 spec 1、spec 3。第二批派發兩個 subagents 實作 spec 2、spec 4。第三批派發 subagent 實作 spec 5。每批次完成後合併回當前分支，執行測試，確認通過後再進入下一批次。完成驗證後回報成果。"
- "用戶要求實作含 3 份 spec 的 batch spec，存在 `preparation.md`。3 份 spec 之間無依賴。" -> "先完成 `preparation.md` 的實作並提交。啟動三個 subagents 並行完成三份 spec。完成後合併回當前分支。執行測試套件確認無 regression。驗證後回報結果。"
- "用戶要求實作含 4 份 spec 的 batch spec，其中 spec 1 與 spec 2 都修改了 user model" -> "spec 1 與 spec 2 有檔案重疊，不能並行。調整為第一批：spec 1（循序），第二批：spec 2 + spec 3（並行），第三批：spec 4。"
