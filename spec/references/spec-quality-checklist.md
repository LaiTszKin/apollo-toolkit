# Spec Quality Checklist

## 需求完整性

- [ ] 每個需求都有明確的業務價值，而非技術實作細節
- [ ] 每個需求都有可驗證的驗收條件
- [ ] 需求之間無矛盾或重疊
- [ ] Out of Scope 已明確定義，防止 scope creep

## 任務分解

- [ ] 每個任務精確到函式或檔案級別
- [ ] 每個任務可直接執行，無需額外解讀
- [ ] 任務之間的依賴關係已標明
- [ ] 任務總量合理（無過大或過小的任務）

## 設計方案

- [ ] 架構 diff 涵蓋所有受影響的模塊
- [ ] 架構 diff 已依 C4 層級逐步定義（Context → Container → Component）
- [ ] 模塊之間的資料流與呼叫關係已定義
- [ ] 錯誤處理策略已說明
- [ ] 測試策略已制定（單元測試 / 整合測試 / E2E）
- [ ] 每個架構宣告可追溯至 spec 中的對應需求或任務

## 不確定性管理

- [ ] 高不確定性的需求已標記（探索性領域）
- [ ] Clarification Questions 已列出需要用戶確認的項目
- [ ] 必要時已建議 spike/prototype 步驟

## 外部依賴

- [ ] 使用的外部函式庫/API 已在 contract.md 中記錄
- [ ] 外部依賴的版本已確認
- [ ] 已通過 deep-research 確認外部依賴的官方文檔

## 內部一致性

- [ ] spec.md 的需求與 tasks.md 的任務可相互追溯
- [ ] checklist.md 的驗收條件與 spec.md 的需求一致
- [ ] design.md 的架構與 tasks.md 的實作範圍一致
- [ ] contract.md 的外部依賴與 spec.md 的技術方案一致
- [ ] coordination.md（如有）的正確反映了 batch spec 的依賴關係

## 交付準備

- [ ] architecture diff 已生成並可視化展示
- [ ] `apltk architecture --spec <spec_dir> validate` 通過
- [ ] spec 目錄結構完整（spec.md, tasks.md, checklist.md, design.md, contract.md）
