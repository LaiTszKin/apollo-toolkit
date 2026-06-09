---
name: maintain-project-constraints
description: 基於 repo 最新程式碼與文檔，更新 CLAUDE.md 和 AGENTS.md 這兩份項目規範文件。注意兩者服務不同的 coding agent：CLAUDE.md 給 Claude Code，AGENTS.md 給 Codex 等非 Claude agent。
---

## 技能目標

基於當前 repo 的最新文檔與程式碼，維護項目規範文件。

## 驗收條件

- `CLAUDE.md`、`AGENTS.md` 已經被更新到最新狀態
- `AGENTS.md` 保持 agent 中立（架構 + 指令 + conventions），`CLAUDE.md` 可包含 Claude Code 特有設定
- 兩者皆維持在 100 行以內，只放最高訊號的內容
- 已知禁令已從專案歷史萃取並納入 prohibitions 區塊

## 工作流程

### 1. 閱讀 repo

通過並行調度 subagents 完成對 repo 代碼的深入閱讀，建立對項目的全面認知。

### 2. 萃取已知禁令

從以下來源萃取消 prohibitions（禁止事項）：
- 過去 issues 中反覆出現的錯誤模式
- git commit 歷史中的 revert / fix 記錄
- CI 配置中明確禁止的操作
- 專案既有文檔中標註的不可行方案

這些將納入 `AGENTS.md` 與 `CLAUDE.md` 的 prohibitions 區塊。

### 3. 更新項目規範文檔

按模板格式更新或創建 `CLAUDE.md` 與 `AGENTS.md`，注意以下區分：

- **AGENTS.md**（給 Codex 等非 Claude agent）：agent 中立格式，只包含架構概覽、建構指令、通用慣例。不使用 Claude 特有語法。
- **CLAUDE.md**（給 Claude Code）：在 AGENTS.md 的基礎上，可加入 Claude Code 特有設定（hooks、scheduled tasks、cowork 整合、MCP servers）。

若專案中已存在 `docs/features/`、`docs/architecture/`、`docs/principles/` 標準化文檔，應在 Documentation Index 中列出。

> 兩份檔案皆應維持在 100 行以內。若超過此限制，優先精煉而非擴充。

#### 加入 `apltk` 工具使用規則

在兩份文檔的 `Common Development Commands` 區塊中，加入：

- 通用規則：使用任何 `apltk` 或 `node dist/bin/apollo-toolkit.js` 命令前，先執行對應 `--help`，依 live CLI 指引選擇子命令與 flags。
- `apltk codegraph <subcommand> [options]` — CodeGraph 代碼庫探索工具。開始前用 `apltk codegraph --help` 與子命令 help 確認最新用法。

#### 加入代碼調查要求

在兩份文檔中，明確要求 agent 在開始實作前，應先執行相關 `apltk ... --help`；若需要代碼調查，先執行 `apltk codegraph --help`，再根據子命令 help 選擇合適的 CodeGraph 探索命令，確保變更基於對現有代碼的真實理解。此規則可放在 `Common Development Commands` 區塊的開頭作為前置條件說明。

## 參考資料

- `references/constraint-file-reference.md`：三區塊契約、撰寫規則、AGENTS.md vs CLAUDE.md 區分指引、核對清單與輸出模板。
