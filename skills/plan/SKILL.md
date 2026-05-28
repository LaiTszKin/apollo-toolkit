---
name: plan
description: 將 SPEC.md + DESIGN.md + CHECKLIST.md 轉換為一份非常詳細的實作計畫（PROMPT.md），包含任務分解、依賴分析、批次排程與智能體路由。讓 implement 直接讀取計畫執行，不需要自己思考如何協同。不用於沒有 spec/design 的情境。
---

## 技能目標

將業務規格（SPEC.md）與技術方案（DESIGN.md + CHECKLIST.md）轉化為可執行的實作方法論（PROMPT.md）。
分離「規劃如何協同」與「執行實作」兩個階段。

本技能負責：
- 將架構設計拆分為具體的檔案/函式級別任務（取代舊 tasks.md）
- 分析依賴關係、檢測檔案重疊
- 建立批次排程與 subagent 路由
- 定義驗證檢查點與錯誤恢復策略

## 驗收條件

- 產出 PROMPT.md，放置在 spec 或 batch spec 的根目錄下
- PROMPT.md 包含完整的任務分解、依賴分析、批次排程、檔案所有權分配、驗證檢查點
- PROMPT.md 可直接被 implement 消費，無需 implement 再做協同決策

## 工作流程

### 1. 識別 Spec 類型

閱讀用戶指定的目錄，判斷類型：

- **單 Spec**：目錄內有一份 SPEC.md + DESIGN.md + CHECKLIST.md
- **Batch Spec**：目錄內有多個子目錄，每個子目錄有各自的 SPEC.md + DESIGN.md + CHECKLIST.md

### 2. 閱讀並理解所有文檔

完整閱讀：
- `SPEC.md` — 業務需求與範圍（BDD 格式的 GIVEN/WHEN/THEN）、In/Out of Scope
- `DESIGN.md` — 模組架構、互動錨點（INT-###）、外部依賴（EXT-###）、資料持久化、系統不變量、技術取捨
- `CHECKLIST.md` — 行為驗證對照、Hardening 要求、測試層級選擇

### 3. 任務分解

將 DESIGN.md 的架構設計拆分為精確到檔案或函式級別的任務。

**任務分解原則：**
- 每個任務對應一個可獨立驗證的結果
- 任務粒度：精確到具體檔案和函式
- 每個任務定義明確的驗證方式（命令或檢查步驟）
- 遵循 DESIGN.md 中 INT-### 定義的互動錨點順序
- 遵循 DESIGN.md 中 EXT-### 定義的外部依賴設置順序

**任務格式：**
```
T1.1 [ ] [file/function] — [具體修改；預期結果]
  - Verify: [驗證命令/檢查]
```

### 4. 提取關鍵資訊

**從 DESIGN.md 提取：**
- 模組清單與職責
- 互動錨點（INT-###）及其依賴順序
- 外部依賴設置順序（EXT-###）
- 並行/循序約束
- 技術取捨對實作的影響

**從 CHECKLIST.md 提取：**
- 行為測試對照（CL-### → SPEC 需求）
- Hardening checklist 要求
- E2E / Integration 決策
- 測試執行命令

### 5. 分析依賴關係

#### 5a. 單 Spec：任務級別依賴分析

分析任務之間的依賴關係：
- 同檔案依賴：多個任務觸及相同檔案 → 必須循序
- 模組依賴：任務 A 的輸出是任務 B 的輸入 → A 先於 B
- INT 錨點順序：DESIGN.md 中定義的 INT-### 順序約束
- EXT 錨點順序：外部依賴的設置必須在消費之前

產出任務 DAG。

#### 5b. Batch Spec：Spec 級別依賴分析

分析各 spec 之間的依賴關係：
- 從各 DESIGN.md 的互動錨點識別跨 spec 依賴
- 識別 spec 之間可能共享的檔案
- 從各 DESIGN.md 的模組清單識別模組所有權重疊

產出 spec DAG。

### 6. 檢測檔案重疊

對所有工作單元進行檔案重疊檢測：

1. 收集每個工作單元預計修改的檔案列表（從任務分解中提取）
2. 比對檔案清單，標記重疊
3. 檔案重疊的工作單元不得並行處理

### 7. 建立批次排程

根據依賴分析和檔案重疊檢測結果，建立批次排程：

**批次劃分原則：**
- 同一批次內的工作單元之間：無檔案重疊、無邏輯依賴
- 不同批次之間：前一批次完成並驗證後，才開始下一批次
- 每個批次的產出是可獨立驗證的中間狀態

### 8. 決定 Subagent 路由

對於需要並行處理的批次，定義 subagent 路由：

**每個 subagent 的定義包含：**
- 目標：這個 subagent 要完成什麼
- 工作目錄：對應的 spec 目錄（batch spec）或任務範圍（單 spec）
- 任務清單：要完成的具體任務
- 允許修改的檔案清單
- 禁止修改的檔案（屬於其他 subagent）
- 風險標記：auth / schema / migration / 外部 API
- 驗證命令

### 9. 定義 Lockfile 策略

若多個工作單元可能修改 lockfile：
- 指定一個 subagent 負責最終 lockfile 更新
- 或告知所有 subagent 不修改 lockfile，在最終批次統一處理

### 10. 設定驗證檢查點

在每個批次邊界設定驗證檢查點，結合 CHECKLIST.md 中的定義：

- **批次前檢查**：確認前置批次的測試全部通過
- **整合檢查點**：合併後執行跨 spec 的整合驗證
- **最終驗證**：執行 CHECKLIST.md 定義的完整測試套件 + Hardening 要求

### 11. 定義錯誤恢復策略

- 若 subagent 失敗，重試一次；再次失敗則暫停並通知用戶
- 同批次其他成功的 subagent 結果不受影響
- 已完成的批次不需重做

### 12. 產出 PROMPT.md

使用 `assets/templates/PROMPT.md` 模板，填入完整計劃。
將 PROMPT.md 放置在 spec 或 batch spec 的根目錄下。

## 範例

- "為單一 spec 生成執行計畫" → 讀取 SPEC.md + DESIGN.md → 分解任務 → 分析依賴 → 決定是否需要 subagent 並行 → 產出 PROMPT.md
- "為含 4 份 spec 的 batch spec 生成執行計畫" → 讀取所有 SPEC.md + DESIGN.md → 建立 spec DAG → 檢測檔案重疊 → 排程批次 → 分配 subagent → 產出 PROMPT.md
- "兩個 spec 的 DESIGN.md 顯示它們修改相同模組" → 在 PROMPT.md 中將它們分到不同批次，定義嚴格的檔案所有權邊界

## 參考資料

- `assets/templates/PROMPT.md` — PROMPT.md 的綁定模板
