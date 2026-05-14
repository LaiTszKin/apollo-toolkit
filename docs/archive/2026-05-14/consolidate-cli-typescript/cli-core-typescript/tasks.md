# Tasks: CLI Core TypeScript Conversion

- Date: 2026-05-14
- Feature: CLI Core TypeScript Conversion

## **Task 1: 建立共享型別定義**

Purpose: 定義所有模組共享的 TypeScript 型別，確保一致性
Requirements: R2.1
Scope: `lib/types.ts`（新檔案）
Out of scope: 任何執行時邏輯、具體工具 handler 實作

- 1. [ ] **`lib/types.ts`** — 定義 `ToolHelp`、`ToolExample`、`ToolDefinition`（含可選 `handler` 欄位）、`ToolContext`、`RunnerKind`（`'node' | 'python3' | 'swift'`）
  - Verify: `npx tsc --noEmit` 通過型別檢查

- 2. [ ] **`lib/types.ts`** — 定義 `InstallMode`、`InstallTarget`、`InstallResult`、`ManifestData`、`SyncResult` 型別
  - Verify: `npx tsc --noEmit` 通過型別檢查

- 3. [ ] **`lib/types.ts`** — 定義 `ParsedArguments`、`CliContext` 型別
  - Verify: `npx tsc --noEmit` 通過型別檢查

## **Task 2: 建立共享工具模組**

Purpose: 提供跨模組共享的純函數（顏色輸出、動畫、格式化）
Scope: `lib/utils/`（新目錄）
Out of scope: CLI 流程邏輯、工具執行邏輯

- 1. [ ] **`lib/utils/terminal.ts`** — 從 `lib/cli.js` 提取 `supportsColor()`、`supportsAnimation()`、`color()`、`clearScreen()`、`sleep()` 函數
  - Verify: 單元測試驗證 color() 在啟用/禁用時輸出行為正確

- 2. [ ] **`lib/utils/format.ts`** — 提取 `formatToolList()`、`formatExamples()`、`buildToolDiscoveryHelp()` 等格式化函數
  - Verify: 單元測試驗證格式化輸出與現有版本一致

## **Task 3: 轉換 tool-runner 模組**

Purpose: 將 `lib/tool-runner.js` 轉換為 TypeScript，新增 handler 直接呼叫支援
Requirements: R2.1, R2.2, R2.3, R2.4
Scope: `lib/tool-runner.ts`（新檔案）、`lib/tool-runner.js`（保留至全 batch 完成）
Out of scope: 修改 TOOL_COMMANDS 中的具體工具定義（由 Spec 2/3/4 負責）

- 1. [ ] **`lib/tool-runner.ts`** — 定義完整型別的 `TOOL_COMMANDS` 陣列（從 `tool-runner.js` 移植），每個工具定義新增可選 `handler` 欄位
  - Verify: `npx tsc --noEmit` 通過型別檢查；`TOOL_COMMANDS` 陣列長度與現有一致（18 個工具）

- 2. [ ] **`lib/tool-runner.ts`** — 重構 `runTool()`：檢查 `tool.handler` 是否存在，存在則直接呼叫 `handler(toolArgs, context)`，否則使用原始 spawn 邏輯
  - Verify: 使用現有 spawn 模式執行 `apltk architecture --help` 確認輸出正確

- 3. [ ] **`lib/tool-runner.ts`** — 移植所有輔助函數：`getToolCommand()`、`listToolCommands()`、`resolveToolCommand()`、`buildToolOverview()`、`buildToolExamples()`、`captureCommandOutput()`、`isTopLevelToolHelpRequest()`
  - Verify: 型別檢查通過

- 4. [ ] **`lib/tool-runner.ts`** — 導出所有公開 API，確保 `cli.ts` 可正常 import
  - Verify: `npx tsc --noEmit` 通過；從 `cli.ts` import 無錯誤

## **Task 4: 轉換 installer 模組**

Purpose: 將 `lib/installer.js` 轉換為 TypeScript
Requirements: R3.1, R3.2, R3.3
Scope: `lib/installer.ts`（新檔案）
Out of scope: 移除 `scripts` 複製邏輯（由 Spec 4 負責）

- 1. [ ] **`lib/installer.ts`** — 完整移植所有常數、型別、函數（`TARGET_DEFINITIONS`、`VALID_MODES`、`resolveToolkitHome()`、`normalizeModes()`、`listSkillNames()`、`syncToolkitHome()`、`installLinks()`、`uninstallSkills()` 等）
  - Verify: 型別檢查通過；匯出 API 與原 `installer.js` 一致

- 2. [ ] **`lib/installer.ts`** — 所有回調函數使用 async/await 替代 Promise 鏈
  - Verify: 型別檢查通過

## **Task 5: 轉換 updater 模組**

Purpose: 將 `lib/updater.js` 轉換為 TypeScript
Requirements: R3.x（輔助）
Scope: `lib/updater.ts`（新檔案）
Out of scope: 修改更新檢查邏輯

- 1. [ ] **`lib/updater.ts`** — 完整移植 `checkForPackageUpdate()` 及相關型別
  - Verify: 型別檢查通過；匯出 API 一致

## **Task 6: 轉換 CLI 核心模組**

Purpose: 將 `lib/cli.js` 轉換為 TypeScript，整合所有子模組
Requirements: R1.1, R1.2, R1.3, R1.4, R1.5
Scope: `lib/cli.ts`（新檔案）
Out of scope: 修改 CLI 行為或新增功能

- 1. [ ] **`lib/cli.ts`** — 將所有 `require()` 改為 TypeScript import；所有函數加上型別註釋
  - Verify: `npx tsc --noEmit` 通過型別檢查

- 2. [ ] **`lib/cli.ts`** — 移植 `parseArguments()`、`buildHelpText()`、`buildInstallHelpText()`、`buildUninstallHelpText()`、`buildToolsHelp()` 等所有函數
  - Verify: `apltk --help` 輸出與原版逐行比對一致

- 3. [ ] **`lib/cli.ts`** — 移植互動式 UI 函數（`promptForModes()`、`promptForUninstallModes()`、`promptSymlinkChoice()` 等）
  - Verify: TTY 環境下 `apltk`（無參數）顯示目標選擇器

- 4. [ ] **`lib/cli.ts`** — `run()` 函數使用 TypeScript import 引用 `tool-runner`、`installer`、`updater`
  - Verify: 型別檢查通過；邏輯與原版一致

## **Task 7: 更新入口檔案和構建配置**

Purpose: 建立 TypeScript bin 入口，更新 package.json
Requirements: R1.1
Scope: `bin/apollo-toolkit.ts`（新）、`package.json`
Out of scope: 其他 package.json 欄位

- 1. [ ] **`bin/apollo-toolkit.ts`** — 從 `lib/cli.ts` import `run`，並執行 `run(process.argv.slice(2))`
  - Verify: `node dist/bin/apollo-toolkit.js --help` 輸出正確

- 2. [ ] **`package.json`** — 更新 `"main"` 指向 `dist/lib/cli.js`、`"bin"` 指向 `dist/bin/apollo-toolkit.js`
  - Verify: `apltk --help` 通過編譯輸出正常執行

## **Task 8: 撰寫 TypeScript 單元測試**

Purpose: 為轉換後的模組新增 TypeScript 測試，確保行為一致
Requirements: R1.x, R2.x, R3.x
Scope: `test/` 目錄（新測試檔案）
Out of scope: 修改現有測試（`*.test.js`）

- 1. [ ] **`test/types.test.ts`** — 驗證型別定義可正確 import 和使用
  - Verify: `npx ts-node test/types.test.ts` 或通過編譯

- 2. [ ] **`test/cli-parsing.test.ts`** — 測試 `parseArguments()` 對各種 CLI 參數組合的解析結果
  - Verify: 所有測試案例通過（`--help`、`install codex --copy`、`tools <name> --help`、`uninstall --yes` 等）

- 3. [ ] **`test/tool-runner.test.ts`** — 測試 `getToolCommand()`、`resolveToolCommand()`、`buildToolOverview()`、雙模式執行
  - Verify: 所有測試案例通過
