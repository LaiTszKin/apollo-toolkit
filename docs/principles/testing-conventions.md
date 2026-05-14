# 測試慣例

## Node.js 原生測試框架

測試使用 `node:test` 與 `node:assert/strict`，不引入第三方測試框架。執行方式為 `node --test`。

**理由**: Node.js 內建測試框架在 v18.18+ 已足夠穩定，減少依賴管理成本。

**範例**: `test/installer.test.js` 使用 `const { describe, it, before, after } = require('node:test')` 與 `const assert = require('node:assert/strict')`。

## 測試檔案位置

所有測試集中於 `/test/` 目錄。

**理由**: 技能目錄不再包含獨立測試，統一由根層級測試管理。

## 臨時目錄隔離

所有涉及檔案系統操作的測試在臨時目錄中執行，測試前後確保清理。

**理由**: 避免測試間互相干擾，也避免測試遺留殘留檔案。

**範例**: `test/installer.test.js` 使用 `fs.mkdtempSync()` 建立隔離目錄，並在 `try/finally` 區塊中 `fs.rmSync()` 清理。

## 輸出捕捉

CLI 測試透過 `makeIo()` 輔助函數捕捉 stdout/stderr，以 `assert.match()` 驗證輸出內容，而非執行實際的 TTY 互動。

**理由**: 單元測試不應依賴 TTY 環境，捕捉輸出可精確驗證 CLI 的行為。

## 測試涵蓋範圍

測試涵蓋：快樂路徑、邊界案例（空狀態、CJK 文字處理、特殊字元）、錯誤路徑（驗證拒絕、不安全路徑、未知引用）。

**理由**: 安裝器處理檔案系統操作與使用者資料，錯誤處理的正確性與一般功能同等重要。
