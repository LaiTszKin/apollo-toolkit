# Design: Codex Memory Catalog and Cleanup

- Date: 2026-05-14
- Feature: Codex Memory Catalog and Cleanup
- Change Name: codex-memory-catalog-cleanup

> **Purpose:** High-level architectural context for `tasks.md`.

## Traceability

|                             |                                                                              |
| --------------------------- | ---------------------------------------------------------------------------- |
| Requirement IDs             | R1.x ~ R6.x                                                                 |
| In-scope modules (≤3)       | `lib/tools/extract-conversations.ts` (合併), `lib/tools/sync-memory-index.ts`, `lib/tools/validate-skill-frontmatter.ts`, `lib/tools/validate-openai-agent-config.ts`, `lib/tools/architecture.ts`, `lib/installer.ts` (修改), 14 個技能 `scripts/` (刪除), 14 個 `SKILL.md` (更新) |
| External systems touched    | GitHub API（via gh CLI for architecture-related features）                   |
| Batch coordination          | [`../coordination.md`](../coordination.md)                                   |

## Target vs baseline

|                       | Baseline (today) | Target (after this change) |
| --------------------- | ---------------- | --------------------------- |
| Structure / ownership | 技能目錄包含 `scripts/` 子目錄；Python/Shell/Swift/JS 腳本分散 | 技能目錄無 `scripts/`；所有工具邏輯集中在 `lib/tools/*.ts` |

## Boundaries

- Entry surface(s): CLI — `apltk <tool-name> [...args]`
- Trust boundary crossed: `None`
- Outside → inside (one line): `User` → `apltk` → `handler()` → `filesystem` or `gh CLI`

## Modules (nouns only)

| Module key | Responsibility (one sentence) | Owned artifacts |
| ---------- | ---------------------------- | --------------- |
| `extract-conversations` | 從 Codex 會話歷史提取最近對話（合併兩個相同腳本） | JSON 輸出 |
| `sync-memory-index` | 同步 Codex AGENTS.md 記憶索引 | 更新 AGENTS.md |
| `validate-skill-frontmatter` | 驗證技能 SKILL.md frontmatter | 驗證報告 |
| `validate-openai-agent-config` | 驗證 agents/openai.yaml 配置 | 驗證報告 |
| `architecture` | Atlas CLI — inspect/mutate/validate/diff 架構圖 | YAML/HTML 產物 |
| `installer` | 技能安裝（修改：移除 scripts 複製邏輯） | manifest |

---

## Interaction anchors (`INT-###`)

| ID        | Intent | Caller → Callee | Coupling kind | Information crossing | Failure propagation |
| --------- | ------ | --------------- | ------------- | -------------------- | ------------------- |
| `INT-030` | CLI 調用工具 handler | `tool-runner` → 各 handler | sync call | CLI 參數、檔案路徑 | 工具錯誤 → 非零退出碼 |
| `INT-031` | architecture 工具使用 atlas 模組 | `architecture` → `atlas/*` (state, schema, layout, render, cli) | sync call | YAML state、HTML 產物 | atlas 模組錯誤向上傳播 |
| `INT-032` | installer 複製技能時排除 scripts | `installer` → 檔案系統 | sync file ops | 技能目錄、目標路徑 | 檔案系統錯誤 → 拋出 |

**Ordering / concurrency (design-level):** 移植完成後再執行清理（避免遺留無主腳本）

## Requirement linkage (coarse ordering)

- Anchor order hint: 工具移植（R1~R4）→ TOOL_COMMANDS 更新 → 清理（R5）→ SKILL.md 更新（R6）
- 移植順序：簡單工具優先（validate-* → sync-memory → extract-conversations），architecture 最後（因依賴 atlas 模組）

## Data & persistence (design-level)

| Resource                      | Typical readers/writers | Consistency expectation |
| ----------------------------- | ----------------------- | ----------------------- |
| `resources/project-architecture/` (atlas YAML) | architecture (read/write) | YAML 狀態一致性由 atlas state.js 確保 |
| `~/.codex/AGENTS.md` | sync-memory-index (read/write) | 寫入需保留非索引區塊 |
| 技能 `SKILL.md` 檔案 | validate-* (read), 清理階段 (write) | 唯讀驗證；清理階段僅更新腳本引用 |

## Invariants (system-level)

| Invariant | What breaks it architecturally | Symptoms if violated |
| --------- | ------------------------------ | -------------------- |
| 技能目錄結構：SKILL.md + agents/ + references/（無 scripts/） | 移除 scripts/ 時誤刪其他目錄 | 技能無法載入 |
| 所有腳本功能必須有對應的 CLI handler | 刪除腳本但 handler 未實作 | 工具呼叫失敗 |
| npm test 必須通過 | 移除測試但未新增對應的 TypeScript 測試 | CI 失敗 |

## Tradeoffs inherited by implementation

| Decision | Rejected alternative | Locks in |
| -------- | -------------------- | -------- |
| 合併兩個 extract_recent_conversations.py 為單一 handler | 保留兩個獨立 handler | handler 需要根據呼叫的 CLI 名稱調整行為（如輸出範圍不同） |
| architecture 保留為獨立模組（復用 atlas lib） | 將 atlas lib 也合併進 architecture.ts | architecture handler 通過 import 使用 `init-project-html/lib/atlas/` 模組 |
| 一次性全部清理（不安裝 shim 過渡） | 漸進式移除 | 必須確認所有 handler 已正確實作且由 Spec 1~3 完成 |

## Batch-only

- 工具 handler 的 TOOL_COMMANDS 更新需與 Spec 2/3 協調（按 merge order 合併）
- installer 修改需在 Spec 1 的 `installer.ts` 基礎上進行
- 實際的 Python/Shell/Swift 腳本刪除需在所有 Spec 完成後執行
