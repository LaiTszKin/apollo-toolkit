---
name: test-case-strategy
description: >-
  為實作工作選擇最小且足夠的測試組合。當 spec、功能開發、功能增強、重構或 bug 修復
  需要明確決定單元、回歸、property、integration、E2E、對抗性測試或 drift check 時使用。
---

# 測試案例策略

## Dependencies

- Required: 無
- Conditional: 無
- Optional: 無
- Fallback: 無

## Standards

- Evidence: 只根據需求、風險、受影響模組、依賴形態與現有覆蓋情況選擇測試，不為了湊數加測試
- Execution: 先盤點風險與 oracle，再選最小可證明風險的測試層級，必要時才升級到更重的測試
- Quality: 每個測試都要有可重現、可驗證的明確 oracle，而不是從新寫出的實作反推
- Output: 產出可直接執行的測試決策，包含測試 ID、目標、層級、oracle、fixture/mock 策略、驗證命令與 `N/A` 理由

## 技能目標

提供一套統一的測試決策流程，讓spec技能與實作技能都能用一致的方法挑出高價值測試，並用最快、最聚焦的檢查及早發現實作偏移。

## 驗收條件

- 每個非平凡變更都已建立風險清單，並明確指出需求或風險來源
- 每個測試決策都選擇了最小但足以證明風險的測試層級，而不是預設往大測試堆
- 每個測試都有明確 oracle、fixture 或 mock 策略，以及可執行的驗證方式
- 若某種測試層級不適用，已留下具體 `N/A` 理由而非含糊跳過

## 工作流程

1. 先盤點變更行為、需求編號、受影響模組與風險，至少涵蓋 boundary、regression、authorization、invalid transition、idempotency、concurrency、data integrity、external failure、partial write 與 adversarial abuse
2. 先重用現有測試，再決定新增哪些測試；只有在能說出既有 suite、case 與它覆蓋的風險時，才算真的能重用
3. 依風險選擇最窄的有效測試層級：局部邏輯用 unit 或 regression；可描述不變量的邏輯用 property；跨模組與受控外部狀態用 integration；只有在關鍵使用者流程無法被較低層級證明時才使用 E2E；惡意輸入、重播、偽造、越界與異常組合用 adversarial
4. 在實作前先定義 oracle，來源只能是 `spec.md`、`design.md`、`contract.md`、官方文件或既有正確行為，不能從新實作反推
5. 對每個非平凡原子任務補上 unit drift check；若做不到，必須記錄最小替代檢查與具體原因
6. 用統一格式記錄測試決策，讓後續技能可以直接執行與驗證

## 使用範例

- 「修改驗證器的邊界規則」-> 優先選 unit test，加一個 drift check 驗證邊界值、錯誤類型與無副作用
- 「新增排序與去重邏輯」-> 使用 property-based tests 驗證單調性、資料保留與重播不變量
- 「改動 repository、service 與 API handler 的協作」-> 使用 integration tests 驗證跨模組資料流與錯誤處理
- 「高價值結帳流程可能被權限與狀態機影響」-> 僅在 unit / integration 不足以證明風險時才加最小 E2E

## 參考資料索引

- `references/unit-tests.md`：單元測試與 drift check 設計
- `references/property-based-tests.md`：property tests 的選擇與 oracle 設計
- `references/integration-tests.md`：整合測試與外部狀態場景設計
- `references/e2e-tests.md`：E2E 決策與替代規則
