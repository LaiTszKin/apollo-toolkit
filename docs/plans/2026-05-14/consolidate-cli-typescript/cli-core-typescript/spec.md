# Spec: CLI Core TypeScript Conversion

- Date: 2026-05-14
- Feature: CLI Core TypeScript Conversion
- Owner: [To be filled]

## Goal
將 CLI 核心模組（cli、tool-runner、installer、updater、bin 入口）從 CommonJS JavaScript 轉換為 TypeScript，並將工具執行從 child_process.spawn 改為直接函數呼叫。

## Scope

### In Scope
- `lib/cli.js` → `lib/cli.ts` 完整 TypeScript 轉換，保留所有現有行為
- `lib/tool-runner.js` → `lib/tool-runner.ts` 轉換，重構 `runTool()` 支援直接函數呼叫與 spawn fallback 雙模式
- `lib/installer.js` → `lib/installer.ts` 轉換
- `lib/updater.js` → `lib/updater.ts` 轉換
- `bin/apollo-toolkit.js` → `bin/apollo-toolkit.ts` 轉換
- `lib/types.ts` 共享型別定義
- `lib/utils/` 共享工具函數模組
- 更新 `package.json` 的 bin/main 指向編譯輸出
- `npm test` 仍通過

### Out of Scope
- 具體工具腳本的移植（由 Spec 2/3/4 負責）
- 技能 scripts/ 目錄的清理（由 Spec 4 負責）
- SKILL.md 更新（由 Spec 4 負責）
- 新增任何功能
- 修改 CLI 對外介面

## Functional Behaviors (BDD)

### Requirement 1: CLI 入口正常啟動
**GIVEN** Apollo Toolkit 專案已通過 `npm run build` 編譯
**AND** 使用者已安裝 Node.js >= 18.18
**WHEN** 使用者執行 `apltk --help`
**THEN** 顯示幫助文本，包含 banner、usage、bundled tools 列表
**AND** 退出碼為 0

**Requirements**:
- [ ] R1.1 從 TypeScript 編譯出的 `bin/apollo-toolkit.js`（dist/）可被 Node.js 直接執行
- [ ] R1.2 `apltk --help` 輸出與現有版本一致
- [ ] R1.3 `apltk tools --help` 輸出與現有版本一致
- [ ] R1.4 `apltk install --help` 輸出與現有版本一致
- [ ] R1.5 `apltk uninstall --help` 輸出與現有版本一致

### Requirement 2: 工具註冊與執行機制
**GIVEN** CLI 已啟動
**WHEN** 使用者執行 `apltk <tool-name> [...args]`
**THEN** CLI 查找 TOOL_COMMANDS registry 找到對應工具
**AND** 若工具已實作 TypeScript handler，直接呼叫該函數
**AND** 若工具僅有 spawn runner（尚未移植），使用 spawn fallback

**Requirements**:
- [ ] R2.1 `TOOL_COMMANDS` registry 支援 `handler` 欄位（可選的 TypeScript 函數引用）
- [ ] R2.2 當 `handler` 存在時，`runTool()` 直接呼叫 handler，不通過 spawn
- [ ] R2.3 當 `handler` 不存在且 `runner` 存在時，`runTool()` 使用 spawn fallback
- [ ] R2.4 `apltk <tool> --help` 正確顯示工具的 purpose、useWhen、insteadOf、examples

### Requirement 3: 安裝/解除安裝功能
**GIVEN** TypeScript CLI 已就緒
**WHEN** 使用者執行 `apltk codex --copy`
**THEN** 技能被成功安裝到 ~/.codex/skills/
**AND** manifest 被正確寫入

**Requirements**:
- [ ] R3.1 `apltk codex --copy` 成功安裝技能
- [ ] R3.2 `apltk uninstall codex --yes` 成功移除技能
- [ ] R3.3 互動式安裝（TTY）正常運作

## Error and Edge Cases
- [ ] CLI 參數解析錯誤時顯示適當錯誤訊息並返回非零退出碼
- [ ] 未知工具名稱時顯示可用工具列表
- [ ] handler 函數拋出錯誤時正確捕捉並顯示錯誤訊息
- [ ] spawn fallback 執行失敗時正確傳遞退出碼和 stderr
- [ ] 非 TTY 環境下互動式安裝應優雅降級

## Clarification Questions
None

## References
- Official docs:
  - [TypeScript Compiler Options](https://www.typescriptlang.org/tsconfig)
- Related code files:
  - `lib/cli.js` — 現有 CLI 核心（899 行）
  - `lib/tool-runner.js` — 現有工具執行器（637 行）
  - `lib/installer.js` — 現有安裝器（~400 行）
  - `lib/updater.js` — 現有更新檢查器
  - `bin/apollo-toolkit.js` — 現有 CLI 入口
  - `package.json` — 專案配置
