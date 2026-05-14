# Design: CLI Core TypeScript Conversion

- Date: 2026-05-14
- Feature: CLI Core TypeScript Conversion
- Change Name: cli-core-typescript

> **Purpose:** High-level architectural context for `tasks.md` — structure, coupling, sequencing intent.

## Traceability

|                             |                                                                              |
| --------------------------- | ---------------------------------------------------------------------------- |
| Requirement IDs             | R1.x, R2.x, R3.x                                                            |
| In-scope modules (≤3)       | `lib/cli.ts`, `lib/tool-runner.ts`, `lib/installer.ts`, `lib/updater.ts`, `lib/types.ts`, `lib/utils/` |
| External systems touched    | None (標準輸入輸出除外)                                                    |
| Batch coordination          | [`../coordination.md`](../coordination.md)                                   |

## Target vs baseline

|                       | Baseline (today) | Target (after this change) |
| --------------------- | ---------------- | --------------------------- |
| Structure / ownership | `lib/*.js` CommonJS；工具執行通過 spawn | `lib/*.ts` TypeScript → 編譯為 CommonJS；工具執行支援 handler + spawn fallback |

## Boundaries

- Entry surface(s): CLI (`bin/apollo-toolkit.js` → 編譯自 `bin/apollo-toolkit.ts`)
- Trust boundary crossed: `None`
- Outside → inside (one line): `User (shell)` → `apltk <command>` → `run()` → `runTool()` → `handler( )` or `spawn()`

## Modules (nouns only)

| Module key | Responsibility (one sentence) | Owned artifacts (types, tables, queues) |
| ---------- | ---------------------------- | ---------------------------------------- |
| `cli`      | CLI 參數解析、安裝/解除安裝流程、互動式 UI、幫助文本 | 無 |
| `tool-runner` | 工具註冊表維護、工具查找、handler 呼叫與 spawn fallback | `TOOL_COMMANDS`、`ToolDefinition` type |
| `installer` | 技能安裝/解除安裝的檔案系統操作、manifest 管理 | `ManifestData` type |
| `updater`  | npm 套件更新檢查 | 無 |
| `types`    | 全專案共享型別定義 | `ToolDefinition`、`ToolContext`、`InstallMode` 等 |
| `utils`    | 共享純函數（檔案操作、字串處理、日誌格式化） | 無 |

---

## Interaction anchors (`INT-###`)

| ID        | Intent (when this coupling matters) | Caller → Callee | Coupling kind | Information / state crossing (summary) | Failure / propagation expectation (summary) |
| --------- | ------------------------------------ | --------------- | ------------- | -------------------------------------- | ------------------------------------------- |
| `INT-001` | CLI 呼叫工具執行 | `cli` → `tool-runner` | sync call `runTool(name, args, context)` | 工具名稱、CLI 參數、stdio handles | 工具錯誤 → CLI 返回非零退出碼 |
| `INT-002` | 安裝流程中同步 toolkit home | `cli` → `installer` | sync call `syncToolkitHome(...)`, `installLinks(...)` | sourceRoot、toolkitHome、modes | 檔案系統錯誤 → 拋出並顯示 |
| `INT-003` | CLI 啟動時檢查更新 | `cli` → `updater` | sync call `checkForPackageUpdate(...)` | package name、當前版本 | 網路錯誤 → 靜默跳過更新檢查 |

**Ordering / concurrency (design-level):** 所有呼叫為同步順序執行（單線程 CLI 工具）

## Requirement linkage (coarse ordering)

### R1.x cluster（CLI 入口）
- Anchor order hint: `types` 定義 → `cli.ts` 轉換 → `bin/apollo-toolkit.ts` 轉換
- Narrative glue: 型別先行定義，再轉換 CLI 邏輯，最後更新入口

### R2.x cluster（工具執行機制）
- Anchor order hint: `types` 定義 → `tool-runner.ts` 轉換（含雙模式支援）
- Narrative glue: 型別定義 ToolDefinition.handler 欄位 → tool-runner 實作雙模式

### R3.x cluster（安裝功能）
- Anchor order hint: `types` 定義 → `installer.ts` 轉換
- Narrative glue: 型別定義 ManifestData → installer 轉換，行為不變

## Data & persistence (design-level)

| Resource                      | Typical readers/writers (module keys) | Consistency expectation (ordering, idempotency) |
| ----------------------------- | ------------------------------------- | ------------------------------------------------ |
| `~/.apollo-toolkit/` (toolkit home) | installer (write), cli (read) | 檔案系統操作；同次執行內一致 |
| `.apollo-toolkit-manifest.json` | installer (write), cli (read) | JSON write 為 atomic（先寫 tmp 再 rename） |

## Invariants (system-level)

| Invariant | What breaks it architecturally | Symptoms if violated |
| --------- | ------------------------------ | -------------------- |
| CLI 參數向後兼容 | 移除或改名現有 CLI flags | 舊指令/腳本失效 |
| TOOL_COMMANDS 結構不變 | 改變 registry 欄位名稱但未同步更新查詢邏輯 | 工具無法被找到 |
| npm test 必須通過 | 修改 installer/cli 行為但未更新測試 | CI 失敗 |

## Tradeoffs inherited by implementation

| Decision | Rejected alternative | Locks in (for `tasks.md`) |
| -------- | -------------------- | ---------------------------- |
| 輸出 CommonJS（非 ESM） | ESM 需要更新 package.json type、所有 import 路徑 | 維持 `"type": "commonjs"`，import 使用 `require` 風格 |
| spawn fallback 保留 | 一次全部移植所有工具（風險更高） | `runTool()` 必須支援雙模式 |
| 型別定義放在 `lib/types.ts` | 型別放在各自模組中 | 跨模組型別集中在 types.ts，避免循環依賴 |

## Batch-only

- TypeScript 基礎設施（tsconfig、build scripts）由 preparation.md 覆蓋
- 具體工具的 handler 實作由 Spec 2/3/4 提供
- 舊腳本清理和測試更新由 Spec 4 負責
