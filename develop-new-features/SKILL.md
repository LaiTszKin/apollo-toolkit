---
name: develop-new-features
description: 用於從零開始打造新專案。當你需要從零開始打造一個新專案時，請使用這個技能。
---

## 技能目標

把新的產品需求轉成一套可批准、可實作、可驗證的交付流程，避免在需求未定稿前直接寫產品程式碼，並確保最終功能、測試與規劃文件彼此一致。

## 驗收條件

- 產生了完全符合用戶需求的spec，通過spec將用戶的需求精確定義為可實作的工程指導文檔。
- 遵照可實作的spec，實作了用戶的需求。

## 工作流程

### 1. 理解用戶需求

分析用戶需求，並使用 `generate-spec` 技能建立spec。

### 2. 實作spec

在明確獲取用戶的同意之後，使用 `implement` 技能實作spec。
如果spec是batch spec（存在多份spec），且外部環境允許使用subagents，建議使用 `implement-with-subagents` 技能並行調度 subagents 實作spec。

## 使用範例

- "現有repo完全不存在任何的CSV解析、讀取、會出功能。用戶要求替 dashboard 新增 CSV 匯出功能。-> "建立spec並等待用戶批准，再實作匯出流程，並用 property tests 驗證欄位順序、編碼與內容不變量"
- "原repo不存在任何cli功能。用戶要求同時新增 CLI、後端與基礎設施的新能力" -> "拆成多份 spec，用 `coordination.md` 管理跨模組依賴，並使用 `implement-with-subagents` 技能調度subagents實作spec。"