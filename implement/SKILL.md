---
name: implement
description: 在當前分支或獨立 worktree 中依 spec 完成實作。按 tasks.md 逐項實作，按 checklist.md 逐項驗收，最後回填 spec 以反映實際代碼狀態。不用於不需 spec 的單檔案變更，不用於無明確 tasks.md 的探索性任務。
---

## 技能目標

實作用戶指定的 spec，確保所有任務完成且用戶需求被滿足。

## 驗收條件

- 對所有被要求實作的 spec，相關文件中的任務 checkboxes 全部被勾選為完成
- 這些文件包括 `checklist.md`、`tasks.md`、`spec.md`
- 不包含用戶自行填寫的項目
- 所有實作已通過測試驗證（測試套件通過 / 編譯成功 / lint 無誤）
- 若使用 worktree 隔離，需確保 worktree 已清理、無遺留分支

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

閱讀 repo。理解本次 spec 的實作範圍。

### 2. 判斷是否需要隔離環境

參考 `references/isolation-guidance.md` 判斷本次實作是否需要使用 git worktree 隔離：

- **隔離路徑**：變更涉及多個檔案、實驗性修改、或不希望影響當前工作目錄 → 走隔離路徑（步驟 2a）
- **快速路徑**：單一或少數檔案變更、範圍明確 → 跳過隔離，直接在當前分支進行（跳到步驟 3）

#### 2a. 隔離路徑：前置檢查與創建子分支及 worktree

在建立 worktree 前，先檢查當前分支的狀態：
- 若有未提交的變更，先 stash 或提交後再繼續
- 確認當前分支已同步遠端（若需推送）

滿足前置條件後，從當前分支創建子分支及 worktree。
分支以規格文檔的實際變更命名，且需符合通用開發規範（如 feat/event-bus-backend）。

### 3. 實作 spec 任務

嚴格按照 `tasks.md` 定義的任務逐項實作。
若有多份 `tasks.md` 存在於多份 spec 中，依照 `coordination.md` 建議的 merge 順序進行實作。
在確認完成所有任務之後，將 `tasks.md` 中的所有 checkboxes 勾選為完成。

若實作的 spec 是 batch spec，且有 `preparation.md`，在開始實作前先完成其規定的任務。
驗收條件滿足後回填 `preparation.md`。

**實作範圍守門員**：在實作過程中持續對照 spec 的 In Scope / Out of Scope。若發現超出範圍的修改，暫停並與用戶確認後再繼續。

**實作偏離處理**：若在實作過程中發現 tasks.md 的任務無法照計劃完成（如 spec 的假設與實際程式碼不符、外部依賴變更），按以下流程處理：
1. 暫停該任務的實作
2. 記錄偏離原因與實際發現
3. 更新 `spec.md` 中相關需求的 checkboxes 與備註
4. 通知用戶偏離情況，等待用戶決策後再繼續

### 4. 驗證實作

按照 `checklist.md` 定義的驗收標準，逐項驗收並檢查任務是否完成。
未達到驗收標準的任務必須重新實作與驗收。

此外，必須執行以下技術驗證：
- 執行專案測試套件，確認所有測試通過
- 確認代碼可正常編譯
- 確認 lint 無誤

通過後將 `checklist.md` 中的 checkboxes 勾選為完成。

### 5. 回填 spec

確保所有實作任務完成並通過驗收之後，更新 `spec.md` 中的需求 checkboxes。
以反映實際代碼實作狀態。

### 6. 提交變更

使用 `commit` 將變更提交到分支上。不需要將變更推送到 remote。

若與主分支發生合併衝突：
1. 使用 `git merge main` 將主分支最新變更拉入
2. 解決衝突檔案的衝突標記
3. 確認解決後測試套件依然通過
4. 完成合併提交

若使用隔離路徑，提交後清理 worktree。

## 範例

- "實作含四份 spec 的 batch spec，coordination.md 建議 merge 順序為 spec 1 → 2 → 3 → 4" → 從 spec 1 開始逐份完成，在當前分支進行
- "實作含兩份 spec 的 batch spec，且有 preparation.md，coordination.md 建議順序為 spec 2 → 1" → 先完成 preparation.md，再依順序實作 spec 2、spec 1
- "實作 event-bus-backend spec，變更範圍大" → 開 worktree 隔離實作，完成後清理

## 參考資料

- `references/branch-naming.md` - 建議分支命名方式
- `references/isolation-guidance.md` - 判斷何時需要使用 worktree 隔離
