# Design: Observability and GitHub Tools Migration

- Date: 2026-05-14
- Feature: Observability and GitHub Tools Migration
- Change Name: observability-github-tools

> **Purpose:** High-level architectural context for `tasks.md`.

## Traceability

|                             |                                                                              |
| --------------------------- | ---------------------------------------------------------------------------- |
| Requirement IDs             | R1.x, R2.x, R3.x, R4.x, R5.x                                               |
| In-scope modules (≤3)       | `lib/tools/filter-logs.ts`, `lib/tools/search-logs.ts`, `lib/tools/log-cli-utils.ts`, `lib/tools/open-github-issue.ts`, `lib/tools/find-github-issues.ts`, `lib/tools/read-github-issue.ts`, `lib/tools/review-threads.ts` |
| External systems touched    | GitHub API (via gh CLI)                                                     |
| Batch coordination          | [`../coordination.md`](../coordination.md)                                   |

## Target vs baseline

|                       | Baseline (today) | Target (after this change) |
| --------------------- | ---------------- | --------------------------- |
| Structure / ownership | Python 腳本在技能 `scripts/`；通過 `spawn python3` 執行 | TypeScript 模組在 `lib/tools/`；通過 handler 函數直接呼叫 |

## Boundaries

- Entry surface(s): CLI — `apltk <tool-name> [...args]` → `runTool()` → `handler(args, context)`
- Trust boundary crossed: `None`（內部工具）
- Outside → inside (one line): `User (shell)` → `apltk <tool>` → `handler()` → `gh CLI (僅 GitHub 工具)` or `stdio`

## Modules (nouns only)

| Module key | Responsibility (one sentence) | Owned artifacts (types, tables, queues) |
| ---------- | ---------------------------- | ---------------------------------------- |
| `filter-logs` | 按時間範圍過濾日誌行 | 無 |
| `search-logs` | 按關鍵字/regex 搜尋日誌 | 無 |
| `log-cli-utils` | 日誌處理共享函數（時間戳解析、IO 迭代） | 無 |
| `open-github-issue` | 通過 gh CLI 發布結構化 GitHub issue | 無 |
| `find-github-issues` | 通過 gh CLI 搜尋/過濾 issues | 無 |
| `read-github-issue` | 通過 gh CLI 讀取單一 issue 詳情 | 無 |
| `review-threads` | 通過 gh CLI 管理 PR review threads | 無 |

---

## Interaction anchors (`INT-###`)

| ID        | Intent | Caller → Callee | Coupling kind | Information crossing | Failure propagation |
| --------- | ------ | --------------- | ------------- | -------------------- | ------------------- |
| `INT-010` | 日誌工具調用共享工具 | `filter-logs` / `search-logs` → `log-cli-utils` | sync call `parseTimestamp()`, `iterLines()` | 時間戳字串、檔案路徑 | 解析錯誤拋出並顯示 |
| `INT-011` | GitHub 工具調用 gh CLI | `open-github-issue` / `find-github-issues` / `read-github-issue` / `review-threads` → `child_process` | spawn `gh` | CLI 參數、JSON stdout | gh 錯誤 → stderr 顯示 |
| `INT-012` | CLI 調用工具 handler | `tool-runner` → 各工具 handler | sync call `handler(args, context)` | CLI 參數、stdio handles | handler 錯誤 → 非零退出碼 |

**Ordering / concurrency (design-level):** 工具之間無依賴，可任意順序移植

## Requirement linkage (coarse ordering)

### R1.x / R2.x cluster（日誌工具）
- Anchor order hint: `log-cli-utils` → `filter-logs` / `search-logs`
- Narrative glue: 共享工具需先實作，filter-logs 和 search-logs 可並行

### R3.x / R4.x / R5.x cluster（GitHub 工具）
- Anchor order hint: 三者互相獨立，可並行移植
- Narrative glue: 每個工具的 handler 均通過 `child_process.execFileSync` 調用 `gh`

## Data & persistence (design-level)

| Resource                      | Typical readers/writers | Consistency expectation |
| ----------------------------- | ----------------------- | ----------------------- |
| 日誌檔案（本地檔案系統） | filter-logs, search-logs (read) | 唯讀；不修改原始檔案 |
| GitHub Issues (remote API) | open-github-issue (write), find-github-issues/read-github-issue (read), review-threads (read/write) | 通過 gh CLI 的 best-effort |

## Invariants (system-level)

| Invariant | What breaks it architecturally | Symptoms if violated |
| --------- | ------------------------------ | -------------------- |
| CLI 參數向後兼容 | 修改工具參數名稱或語義 | 現有工作流腳本中斷 |
| gh CLI 作為 GitHub API 的唯一介面 | 直接使用 REST API 替代 gh CLI | 與現有行為不一致、auth 機制不同 |

## Tradeoffs inherited by implementation

| Decision | Rejected alternative | Locks in |
| -------- | -------------------- | -------- |
| 保留 gh CLI spawn（不直接呼叫 GitHub REST API） | 使用 octokit SDK（需新增依賴） | GitHub 工具仍通過 `gh` child_process |
| 日誌工具使用純 Node.js 實作（無 spawn） | 保留 Python spawn | 無外部依賴，效能更好 |

## Batch-only

- 共享型別（`ToolDefinition`、`ToolContext`）由 Spec 1 定義
- 舊腳本清理由 Spec 4 負責
