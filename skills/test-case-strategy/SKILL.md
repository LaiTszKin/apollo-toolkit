---
name: test-case-strategy
description: 基於風險分析設計測試策略，選擇最適合當前脈絡的測試層級與方法。不用於不需測試的探索性任務，不用於已有明確定義的單一測試類型任務。
---

## 技能目標

基於當前需求與架構脈絡，規劃完整的測試策略。

## 驗收條件

- 所有需求及實作任務存在關鍵性驗證測試
- 測試選型的決策理由已記錄
- 不包含無對應風險的冗餘測試

## 決策框架

測試策略的形狀（Pyramid / Trophy / Diamond）是脈絡分析的結果，不是起點。
從以下決策軸推導出適合當前專案的測試分布：

```
風險 → 邊界 → 驗證機制
(什麼重要) → (在哪驗) → (怎麼驗)
```

## 工作流程

### 1. 理解用戶需求並閱讀相關代碼

理解用戶需求。同時，閱讀相關代碼實作，了解可用的測試方式與當前架構。

### 2. 識別風險與邊界

對每個需求，評估以下面向：

**可能性 × 影響度 = 風險等級**
- 可能性：該功能出錯的機率（複雜度、變更頻率、歷史缺陷）
- 影響度：出錯後的影響範圍（金錢損失、使用者體驗、安全性）

**測試邊界判斷**：
- 該行為是否可以在單一函式內驗證？→ 單元測試
- 該行為是否需要跨模組協作？→ 整合測試
- 該行為是否只在完整使用者流程中可觀察？→ E2E 測試
- 該行為是否有可描述的恆成立規則？→ 基於屬性測試（PBT）
- 該行為是否涉及**跨多步驟的狀態轉移**，且有**可描述的 invariants**？→ 整合式 PBT（stateful / state machine testing）— 見 `references/integrated-pbt.md`

> 整合式 PBT 特別適合：工作流引擎、訂單狀態機、資料庫同步、或有明確不變性（如總金額守恆）的系統。

### 3. 設計測試策略

根據步驟 2 的分析結果選擇測試方法，並記錄決策理由。

閱讀相關參考資料，了解不同場景下常見的測試策略設計。

### 4. 記錄決策

為每個測試案例記錄：
- 測試 ID（UT-xx / IT-xx / E2E-xx / PBT-xx）
- 目標範圍（函式 / 模組 / API / 流程）
- 驗證 oracle（通過條件）
- 對應的需求編號

若跳過某測試層級，記錄跳過理由。

## 測試模型選擇脈絡

以下模型是常見的測試分布結果，可作為參考而非規範：

| 專案類型 | 常見分布 | 原因 |
|----------|----------|------|
| 前端 SPA | Integration 為主，Unit 中等，E2E 少量 | 元件整合是核心風險，Testing Trophy 模式 |
| 後端 API | Integration 為主，Unit 中等，E2E 少量 | DB/外部服務整合是關鍵，Testing Diamond 模式 |
| 微服務 | Unit 為主，Integration 中等，E2E 最少 | 服務隔離是重點，Test Pyramid 模式 |
| 全端 Monolith | 混合分布 | 依層級混合最佳策略 |

每個專案的最終形狀應由實際的風險分析決定，而非套用固定模型。

## 參考資料

- `references/unit-tests.md`：單元測試與 drift check 設計
- `references/property-based-tests.md`：property tests 的選擇與 oracle 設計
- `references/integrated-pbt.md`：整合式 PBT（stateful / state machine testing）— 跨多步驟的流程正確性與不變性驗證
- `references/integration-tests.md`：整合測試與外部狀態場景設計
- `references/e2e-tests.md`：E2E 決策與替代規則
- `references/contract-tests.md`：合約測試與 API 邊界驗證
