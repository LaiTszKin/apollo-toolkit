---
name: spec
description: 將用戶模糊的複雜需求拆解為有嚴格實作範圍的規格文檔。產出包含 tasks.md、checklist.md、設計方案、架構 diff 與測試策略。形成完整規格包。
---

## 目標

將用戶需求轉化為有明確完成條件與實作邊界的 spec。

## 驗收條件

- 已經產出了嚴格遵循模板格式的 spec。
- 為 spec 當中的需求制定了明確的驗收條件及測試策略。
- 完成 spec 對應的 architecture diff
- 可視化展示架構設計，方便用戶審核 spec

## 工作流程

### 1. 理解用戶需求並閱讀repo

分析用戶需求。
在 repo 中搜索可能相關的內容。
完成搜索後，深入閱讀相關代碼。
識別變更範圍。
如果外部環境存在 subagents 功能，建議通過並行調度 subagents 來完成深入閱讀 repo 的任務。

### 2. 拆分用戶需求及設計業務架構

將用戶需求拆分為有明確邊界的工程需求。結合現有代碼，設計業務架構。在設計的過程中，你需要考慮包括但不限於以下設計事項：
- 錯誤處理
- 測試策略
- 模塊之間的呼叫、回傳
- 資料流
若用戶有不清晰的需求且該需求會影響設計方案，記錄並填入 spec。
等待用戶回答。

### 3. 將整個設計方案拆分成可執行任務

將完整設計方案拆分為精確到函式或檔案級別的任務。
確保每個任務可直接執行且無歧義。
以此確保開發者不偏離設計方案。

### 4. 制定驗收條件

使用 `test-case-strategy` 為任務制定基於測試的驗收條件。
確保每個任務完成後能被驗證。
同時為需求制定驗收條件。
確保用戶需求能被測試明確驗收。

### 5. 查找開發文檔

在撰寫 spec 前，使用 `deep-research` 技能查找所需外部依賴的官方文檔或源代碼。
確保後續實作符合外部規範。

### 6. 使用 `apltk` cli 工具協助完成 spec

使用 CLI 工具產生 spec 模板。將完整計劃填入模板。
若變更範圍跨多個模塊，建立 batch spec。
盡可能確保每份 spec 可獨立實作。
無法獨立實作的 spec，額外建立 `preparation.md` 定義前置工作。

### 7. 使用 `apltk` cli 工具協助完成 spec architecture diff

通過 CLI 工具生成完整的 architecture diff。
讓用戶審閱本次 spec 的架構設計。

製作架構圖的步驟如下：
1. 定義功能模塊及內涵子模塊
2. 定義子模塊內部的函數、變數、資料流及錯誤處理
3. 定義子模塊之間的資料流、錯誤處理、呼叫及回滾

## 範例

- "製作一個網頁德州撲克小遊戲" -> "拆分成多個模塊：遊戲本體邏輯、前端頁面渲染、前端頁面交互邏輯。制定單元測試、整合測試等策略。製作一份單一 spec 指導實作。"
- "提升現有系統的性能" -> "識別 repo 中拖累性能的代碼。製作 batch spec，將全量優化拆分為以三個模塊為一組的優化。對必須改動業務邏輯才能提升性能的項目，填寫 clarification questions。等待用戶回答後更新 spec。"

## 參考資料

- `apltk create-specs` — spec 模板產生器 CLI 工具（TypeScript handler 取代原本的 Python create-specs）。
- `assets/templates/spec.md` - `spec.md` 的綁定模板。
- `assets/templates/tasks.md` - `tasks.md` 的綁定模板。
- `assets/templates/checklist.md` - `checklist.md` 的綁定模板。
- `assets/templates/contract.md` - `contract.md` 的綁定模板。
- `assets/templates/design.md` - `design.md` 的綁定模板。
- `assets/templates/coordination.md` - batch root 的 coordination 模板。
- `assets/templates/preparation.md` - batch root 的前置工作模板。
- `references/TEMPLATE_SPEC.md` - `apltk` cli工具相關格式指引。
- `apltk create-specs --help` - spec生成相關cli工具的指引命令
- `apltk architecture --help` - 架構圖生成相關cli工具的指引命令
- `references/definition.md` - 架構圖之中功能模塊及子模塊的具體定義