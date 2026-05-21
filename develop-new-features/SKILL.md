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

### 1. 理解用戶需求

分析用戶需求，並使用 `spec` 技能建立spec。

### 2. 實作spec

在明確獲取用戶的同意之後，使用 `implement` 技能實作spec。
若 spec 是 batch spec，且外部環境允許使用 subagents，建議使用 `implement-with-subagents` 技能。
由 subagents 並行實作多份 spec。

## 使用範例

- "現有repo完全不存在任何的CSV解析、讀取、會出功能。用戶要求替 dashboard 新增 CSV 匯出功能。-> "建立spec並等待用戶批准，再實作匯出流程，並用 property tests 驗證欄位順序、編碼與內容不變量"
- "原repo不存在任何cli功能。用戶要求同時新增 CLI、後端與基礎設施的新能力" -> "拆成多份 spec，用 `coordination.md` 管理跨模組依賴，並使用 `implement-with-subagents` 技能調度subagents實作spec。"