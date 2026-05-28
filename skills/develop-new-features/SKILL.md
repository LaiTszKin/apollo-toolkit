---
name: develop-new-features
description: 從零開始打造新專案。將產品需求轉化為可批准的 spec，再實作為可驗證的交付成果。
---

## 技能目標

將新的產品需求轉化為可批准、可實作、可驗證的交付流程。
避免在需求未定稿前直接撰寫產品程式碼。
確保最終功能、測試與規劃文件彼此一致。

## 驗收條件

- 產出完全符合用戶需求的 spec，將其精確定義為可實作的工程指導文檔
- 遵照 spec 完成用戶需求的實作

## 工作流程

### 1. 建立 spec

分析用戶需求，並使用 `spec` 技能建立 SPEC.md（純業務規格）。

### 2. 技術設計

在明確獲取用戶對 SPEC.md 的同意之後，使用 `design` 技能進行技術方案設計。
design 會進行網路調研（可行性、現有實現、兼容技術棧），然後產出 DESIGN.md、CHECKLIST.md 與 Architecture Diff。

### 3. 生成實作計畫

使用 `plan` 技能將 SPEC.md + DESIGN.md + CHECKLIST.md 轉化為 PROMPT.md。
plan 會自動識別單 spec 或 batch spec，進行任務分解，並生成對應的執行計畫與智能體路由策略。

### 4. 實作 spec

使用 `implement` 技能讀取 PROMPT.md，嚴格按照計畫執行實作。

## 使用範例

- "現有repo完全不存在任何的CSV解析、讀取、會出功能。用戶要求替 dashboard 新增 CSV 匯出功能。-> "建立spec並等待用戶批准，再實作匯出流程，並用 property tests 驗證欄位順序、編碼與內容不變量"
- "原repo不存在任何cli功能。用戶要求同時新增 CLI、後端與基礎設施的新能力" → "拆成多份 spec。使用 `design` 為每份 spec 進行技術設計，再使用 `plan` 生成 PROMPT.md 定義協同策略與 subagent 路由，最後使用 `implement` 按計畫執行。"