---
name: generate-spec
description: >-
  Create or refresh approval-gated planning docs under `docs/plans/...` with
  `apltk create-specs`, `test-case-strategy`, and optional batch coordination or
  preparation files. Use for drafting or restructuring specs, not implementation.
---

# 生成規格

## 目標
將用戶需求轉化為明確、有清晰完成條件的規格文檔。

## 驗收條件
- 已經產出了嚴格遵循模板格式的規格文檔。
- 為規格文檔當中的需求制定了明確的驗收條件及測試策略

## 工作流程
1. 理解用戶需求並閱讀代碼庫
分析用戶需求，並在代碼庫之中搜索、列出可能相關的內容。完成搜索之後，深入閱讀相關代碼，識別變更範圍。
如果外部環境存在subagents功能，建議通過調度subagents來完成深入閱讀代碼庫的任務。

2. 拆分用戶需求及設計業務架構
將用戶需求轉化、拆分為明確、存在邊界的工程需求。結合現有代碼，設計業務架構。在設計的過程中，你需要考慮包括但不限於以下設計事項：
- 錯誤處理
- 測試策略
- 模塊之間的呼叫、回傳
- 資料流
在這個階段，如果用戶有任何不清晰的需求，且該需求會影響你的設計方案，你需要紀錄並在稍後填入規格文檔，等待用戶的回答。

3. 將整個設計方案拆分成可執行任務
將上一步之中你構思的完整設計方案拆分為精確到函式或檔案級別的任務。你必須確保每一個任務都是可以直接執行，且沒有歧義的。以此確保執行設計方案的開發者不會偏離設計方案。

4. 制定驗收條件
為任務制定基於測試的驗收條件，確保每一個任務在完成之後都能夠被驗證。
同時，為需求制定驗收條件，確保用戶需求能夠被測試清晰地驗收、檢驗成果。

5. 使用 `apltk` cli工具協助完成規格文檔
使用cli工具，產生規格文檔的模板。將你的完整計劃填入到模板之中，並通過cli工具生成完整架構圖讓用戶審閱。
如果該規格文檔設計超過三個模塊，則需要創建規格批次。

## 範例
- "製作一個網頁德州撲克小遊戲" -> "拆分成多個模塊：遊戲本體邏輯、前端頁面渲染、前端頁面交互邏輯；制定單元測試、整合測試等策略，並製作一份單一的規格文檔指導實作工作。"
- "提升現有系統的性能" -> "識別目前代碼庫之中拖累性能的代碼。製作規格批次文檔，將代碼庫的全量優化拆分為以三個模塊為一組的優化。對於必須改動業務邏輯才可以做到的性能提升，填寫clarification questions，並等待用戶回答之後更新規格文檔。"

## 參考資料
- `scripts/create-specs` - `apltk create-specs` 背後使用的模板產生器。
- `references/templates/spec.md` - `spec.md` 的綁定模板。
- `references/templates/tasks.md` - `tasks.md` 的綁定模板。
- `references/templates/checklist.md` - `checklist.md` 的綁定模板。
- `references/templates/contract.md` - `contract.md` 的綁定模板。
- `references/templates/design.md` - `design.md` 的綁定模板。
- `references/templates/coordination.md` - batch root 的 coordination 模板。
- `references/templates/preparation.md` - batch root 的前置工作模板。
- `references/TEMPLATE_SPEC.md` - `apltk` cli工具相關格式指引。
- `test-case-strategy/SKILL.md` - 測試策略選擇技能。
