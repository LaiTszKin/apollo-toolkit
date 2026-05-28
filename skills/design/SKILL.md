---
name: design
description: 讀取 SPEC.md，通過網路調研驗證技術可行性、尋找現有高質量實現、確認兼容技術棧後，產出 DESIGN.md（架構設計、外部依賴）、CHECKLIST.md（驗證策略）與 Architecture Diff。不用於沒有 SPEC.md 的情境。
---

## 技能目標

將業務規格（SPEC.md）轉化為技術方案。
先調研，再設計——確保不重複造輪子、技術選擇有據可依。

## 驗收條件

- 已完成三項網路調研並記錄結果
- 產出 DESIGN.md，包含：架構設計、外部依賴（含 API 事實與限制）、資料持久化、不變量、技術取捨
- 產出 CHECKLIST.md，包含行為驗證對照、hardening 要求、測試層級選擇
- 產出 Architecture Diff，採用 C4 模型層級

## 工作流程

### 1. 閱讀 SPEC.md

完整閱讀 SPEC.md，理解：
- 業務目標與範圍
- 每個 BDD 行為需求
- 錯誤與邊界案例
- 不確定性標記與 Clarification Questions

### 2. 網路調研（Research-First）

在進行架構設計之前，完成三項網路調研。使用 `deep-research` 或直接進行網路搜索。

#### 2a. 技術可行性驗證

針對 SPEC.md 中的每個需求：
- 驗證在現有技術棧下是否可實現
- 標記高風險或不確定的技術點
- 記錄關鍵限制條件

產出：可行性判斷 + 風險點清單

#### 2b. 現有高質量實現參考

搜索是否有成熟的開源方案或社群最佳實踐：
- 搜索類似功能的實現模式
- 尋找官方推薦的實作方式
- 記錄值得參考的設計決策

產出：參考實現清單 + 可借鑑的設計模式

#### 2c. 兼容技術棧調研

確認外部依賴與 repo 現有依賴的兼容性：
- 檢查版本衝突風險
- 比較備選方案（如有多個可用 library）
- 確認授權兼容性

產出：推薦技術棧 + 兼容性報告

### 3. 設計業務架構 → DESIGN.md

基於調研結果，設計業務架構。使用 `assets/templates/DESIGN.md` 模板。

涵蓋以下區段：
- **架構總覽**：模組清單與職責、進入點、信任邊界
- **互動設計**：模組之間的呼叫關係、耦合方式、失敗傳播
- **外部依賴**（吸收原 contract.md）：API 事實、限制與失敗模式、安全與密鑰
- **資料持久化**：儲存資源、一致性期望
- **系統不變量**：不可違反的架構約束
- **技術取捨**：每個決策的替代方案與鎖定影響

### 4. 制定驗證策略 → CHECKLIST.md

使用 `test-case-strategy` 技能為設計方案制定驗證策略。
使用 `assets/templates/CHECKLIST.md` 模板。

涵蓋以下區段：
- **行為測試對照**：每個 BDD 需求對應的測試
- **Hardening 要求**：回歸測試、drift checks、property-based 測試、邊界測試
- **測試層級選擇**：單元/整合/E2E 的決策與理由

### 5. 產生 Architecture Diff

通過 `apltk architecture` CLI 工具生成架構圖，採用 C4 模型層級逐步展開。

#### 5a. 閱讀現有架構圖

閱讀項目現有架構圖（`resources/project-architecture/atlas/atlas.index.yaml` + 受影響的 feature YAML）。
不讀取無關的 feature 或模組，維持 context economy。

若無現有架構圖，跳過基準比對，直接從 System Context 開始定義本次 spec 的邊界。

#### 5b. 測量基準 drift

比對現有架構圖與當前程式碼，確認基準 atlas 的可靠程度：
- 若基準 atlas 與程式碼有顯著偏離（> 20% entries 不一致），在 architecture diff 中標記風險
- 若基準 atlas 可靠，diff 可直接疊加在基準之上

#### 5c. 依 C4 層級逐步定義 diff

1. **System Context**：定義 external actor、系統邊界、跨系統 edge
2. **Container 層級**（功能模塊）：定義新增或修改的 feature，以及 feature 之間的 edge
3. **Component 層級**（子模塊）：定義子模塊內部的 function、variable、dataflow、error rows
4. **Code 層級**（選擇性）：只在關鍵路徑補充函式層級細節

#### 5d. 證據追溯

每個 component 應連結到：
- SPEC.md 中的需求編號（需求 → 模組）
- 調研結果中的技術決策（決策 → 外部依賴選擇）

#### 5e. 產生 diff 並驗證

```bash
apltk architecture --spec <spec_dir> render
apltk architecture --spec <spec_dir> validate
```

確認驗證通過後，使用 `apltk architecture diff` 產生可視化對比。

### 6. 交付前自我審查

- 調研結果是否記錄在 DESIGN.md 中作為技術決策證據
- 每個架構決策是否有取捨記錄
- 外部依賴的 API 事實是否可追溯至官方文檔
- CHECKLIST.md 是否完整覆蓋 SPEC.md 的所有 BDD 需求
- Architecture Diff 是否覆蓋完整變更範圍

## 範例

- "SPEC.md 定義了一個即時通訊功能" → 調研 WebSocket vs SSE vs Polling 的取捨 → 確認 repo 現有依賴兼容性 → 選擇 SSE → 設計架構 → 產出 DESIGN.md + CHECKLIST.md + Architecture Diff
- "SPEC.md 要求支援 CSV 匯出，repo 無相關 library" → 調研 Node.js CSV library（json2csv vs csv-writer vs papaparse）→ 確認與現有依賴兼容 → 選擇最輕量的方案 → 設計匯出流程架構

## 參考資料

- `assets/templates/DESIGN.md` — DESIGN.md 模板
- `assets/templates/CHECKLIST.md` — CHECKLIST.md 模板
- `references/architecture.md` — apltk architecture 工具的完整參數說明（從 spec skill 遷移）
- `references/definition.md` — 架構圖之中功能模塊及子模塊的具體定義（從 spec skill 遷移）
