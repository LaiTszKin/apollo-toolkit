# CLI 設計原則

## 統一進入點、多命令調度

CLI 由 `bin/apollo-toolkit.js` 啟動，委派給 `lib/cli.js` 的 `run()` 函數。命令分類由 `parseArguments()` 處理，支援三種主要流程：安裝、解除安裝與工具執行。所有非工具參數若無法識別則視為目標模式，允許 `apltk codex` 這類簡潔語法。

## 互動與非互動雙模式

在 TTY 環境中提供動畫歡迎畫面、checkbox 選擇器與確認提示；非 TTY 環境則直接使用命令列參數，不中斷管道式或 CI 執行。`--yes` 旗標可跳過解除安裝確認。

## 工具註冊式調度

`lib/tool-runner.js` 維護一份工具登錄清單，每個工具宣告名稱、分類、所屬技能、執行器（node/python3/swift）與腳本路徑。工具可經由 `apltk <tool>` 或 `apltk tools <tool>` 兩種方式呼叫，`--help` 會先顯示 Apollo Toolkit 的上層說明再顯示原生腳本說明。

## 更新檢查閘道

安裝流程啟動時，除非設定 `APOLLO_TOOLKIT_SKIP_UPDATE_CHECK=1`，否則 CLI 會查詢 npm registry 比較版本，在使用者同意後自動執行 `npm install -g`。此檢查在非 TTY 環境中自動跳過。
