---
name: spec
description: 將用戶需求整理、組合、拆分為有嚴格實作範圍的業務規格文檔（SPEC.md）。整理後需求超過 5 個時必須生成 batch spec，每份 spec 專注 3-5 個 BDD 需求。只定義「做什麼」，不涉及技術方案。不用於已有明確實作方案的簡單任務，不用於不需 spec 的單檔案變更。
---

## 目標

將用戶需求轉化為純業務規格的 SPEC.md。
只回答「要達成什麼業務目標」和「什麼範圍內/外」，不碰技術如何實現。

技術方案（架構設計、外部依賴、驗證策略）由 `design` 技能負責。
執行方法論（任務分解、協同路由）由 `plan` 技能負責。

## 驗收條件

- 產出嚴格遵循模板格式的 SPEC.md
- SPEC.md 包含明確的業務目標、範圍（In/Out of Scope）、BDD 行為需求、錯誤案例
- 高不確定性的需求已標記並在 Clarification Questions 中反映

## 工作流程

### 1. 理解用戶需求並閱讀 repo

分析用戶需求。
在 repo 中搜索可能相關的內容。
完成搜索後，深入閱讀相關代碼。
識別變更範圍。
如果外部環境存在 subagents 功能，必須通過並行調度 subagents 來完成深入閱讀 repo 的任務。

### 2. 整理、組合、拆分用戶需求

將用戶需求整理為有明確邊界的 BDD 業務需求（GIVEN/WHEN/THEN）。
在此過程中：

- **整理**：將模糊需求轉化為清晰的 BDD 行為描述
- **組合**：將相關的需求合併為一個連貫的 BDD 需求（避免碎片化）
- **拆分**：將過大的需求分離為獨立可驗證的 BDD 需求

**需求數量規則：**
- 整理後的 BDD 需求總數 **≤ 5 個**：產出單一 SPEC.md
- 整理後的 BDD 需求總數 **> 5 個**：必須建立 batch spec，每份 SPEC.md 專注 **3-5 個** BDD 需求

對每個需求標記**不確定性等級**：
- **已知領域**：團隊已有經驗的技術或業務，風險低
- **探索性領域**：團隊不熟悉或依賴外部系統的部分，需標記為高不確定性
- 高不確定性的需求應在 Clarification Questions 中反映，必要時建議先做 spike/prototype

同時定義：
- **In Scope**：本次變更包含的範圍
- **Out of Scope**：明確排除的範圍（防止實作者過度實作）
- **錯誤與邊界案例**：授權邊界、資料邊界、外部依賴異常、惡意場景

若用戶有不清晰的需求且該需求會影響業務範圍定義，記錄並等待用戶回答。

### 3. 決定產出格式：單一 Spec 或 Batch Spec

根據步驟 2 整理後的 BDD 需求數量決定：

- **≤ 5 個需求**：產出單一 SPEC.md
- **> 5 個需求**：必須建立 batch spec

Batch spec 結構：
- 在 `docs/plans/{YYYY-MM-DD}/{batch_name}/` 下為每組 3-5 個相關需求建立獨立子目錄
- 每個子目錄包含各自的 SPEC.md
- 每份 SPEC.md 專注於相關的需求組，可被獨立理解和執行
- 不需建立 coordination.md —— 協同策略在 `plan` 階段的 PROMPT.md 中定義

**分組原則**：將相關的需求（如屬於同一業務流程、同一使用者角色）分到同一份 SPEC.md，不相關的需求分到不同 SPEC.md。

### 4. 產生 SPEC.md

使用 `apltk create-specs` CLI 工具產生 SPEC.md 模板。
在執行前先閱讀 `references/create-specs.md` 了解所有參數。
將完整計劃填入模板。

### 5. 交付前自我審查

在交付 spec 前，使用 `references/spec-quality-checklist.md` 進行自我審查。
確認以下項目：
- 所有需求是否都有明確的 BDD 驗證條件
- In Scope / Out of Scope 是否清晰無歧義
- 錯誤與邊界案例是否完整
- 高不確定性的需求是否已標記並在 Clarification Questions 中反映
- 各需求之間是否一致（無矛盾）

自我審查通過後才可將 SPEC.md 交付給用戶審核。

## 範例

- "製作一個網頁德州撲克小遊戲" → 整理出 4 個 BDD 需求（發牌、下注、勝負判定、籌碼管理）。≤ 5，產出單一 SPEC.md。
- "重構整個用戶系統：註冊、登入、權限管理、密碼重置、雙因素認證、會話管理" → 整理出 6 個 BDD 需求。> 5，建立 batch spec，拆分為兩份 SPEC.md：認證篇（註冊、登入、密碼重置，3 個需求）和安全篇（權限、雙因素、會話，3 個需求）。

## 參考資料

- `references/create-specs.md` — apltk create-specs 工具的完整參數說明
- `assets/templates/SPEC.md` — SPEC.md 模板
- `references/spec-quality-checklist.md` — spec 交付前自我審查清單
