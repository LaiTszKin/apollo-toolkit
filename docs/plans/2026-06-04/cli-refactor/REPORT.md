# Review Report — Round 6

- **Spec**: CLI 工具全面重構 (cli-refactor)
- **Date**: 2026-06-04
- **Reviewer**: Claude Code (agent-review)
- **Verdict**: Needs Work

---

## Verdict

**Needs Work** — 8/8 Round 5 issues resolved, but a new P1 regression found: `search-logs` `keyword`/`regex` options lack `multiple: true` in schema, producing incorrect runtime behavior when users pass multiple values. All other requirements are fully satisfied or have only P3-level suggestions.

---

## Requirement Status Summary

| Requirement | Status | Evidence Location | Open Findings |
|---|---|---|---|
| Req 1 — Tool boilerplate reduction | ⚠️ Partial | 19/19 in-scope tools use `createToolRunner` with schema; 1 tool has schema/handler type mismatch | 1 P1 |
| Req 2 — Cross-platform abstraction | ✅ Complete | `PlatformAdapter` interface defined; `resolveHomeDirectory()` delegates to `adapter.homeDir(env)`; `sync-memory-index` uses `os.homedir()`; CI config correct | 0 |
| Req 3 — Unified error handling | ✅ Complete | `codegraph` MODULE_NOT_FOUND detection fixed (both `details.code` and `includes` fallback); no `process.exit()` in in-scope tools; CLI boundary handles `UserInputError`/`SystemError`/`AppError` | 0 |
| Req 4 — Coverage >=80% + CI matrix | ✅ Complete | 93.33% lines, 81.88% branches, 95.25% funcs (thresholds 80/60/75); Group 2 now includes `$GROUP1_FLAGS`; CI matrix on `ubuntu-latest` + `windows-latest` | 0 |
| Req 5 — Dispatch isolation | ✅ Complete | `helpTopic` narrowed to union type; `dist/` imports replaced with `@laitszkin/cli`; `cli-parsing.test.js` overlap removed; all parsers independently testable | 0 |

---

## Cross-requirement Interaction Summary

**Requirement Groups**:

| Group | Requirements | Interaction Type | Summary |
|---|---|---|---|
| A | Req 1, Req 3, Req 5 | Shared modules | All three requirements affect the CLI dispatch/tool execution pipeline. Req 1's boilerplate reduction ensures tools use schema-based parsing; Req 3 ensures errors are typed `AppError` instances; Req 5 ensures dispatch is testable. The P1 finding in `search-logs` is contained within Req 1's schema scope and does not create interface mismatches between requirements. Architecture is consistent. |
| B | Req 2 | Isolated | Cross-platform abstraction lives in `packages/tool-utils` and is consumed by `packages/cli` (installer, updater) and `packages/tui` (terminal). No interaction issues with other requirements. |
| C | Req 4 | Isolated | CI and coverage are test infrastructure, no code-level interaction with other requirements. |

---

## Findings

### P1 — Requirement Defect

| # | Description | Impact | File | Line | Dimension | Requirement |
|---|---|---|---|---|---|---|
| 1 | **`search-logs` `keyword`/`regex` 缺少 `multiple: true`**：Schema 中 `keyword` 與 `regex` 宣告為 `{ type: 'string' }`（無 `multiple: true`），但 handler 以 `(values.keyword as string[])` 強轉為陣列型別。`node:util.parseArgs` 對無 `multiple` 的 `string` 選項僅保留最後一次傳入值（單一字串）。當使用者執行 `--keyword foo --keyword bar` 時，`values.keyword` 為 `"bar"`（字串），而非 `["foo", "bar"]`。`for...of` 迭代字串時逐字元遍歷，造成比對結果錯誤 | 多關鍵字搜尋傳回錯誤結果。單關鍵字路徑不受影響。對比 `find-github-issues` 正確使用 `label: { type: 'string', multiple: true }` | `packages/tools/search-logs/index.ts` | L56-57 (schema), L83-84 (handler) | Spec implementation deviation | Req 1 |

### P3 — Suggestion

| # | Description | Impact | File | Line | Dimension | Requirement |
|---|---|---|---|---|---|---|
| 1 | **PlatformAdapter `normalizePath()` / `EOL` 零消費者**：Interface 已定義且實作正確，但無任何生產程式碼消費這兩項方法。Round 5 中此缺口為 P2 的一部分，FIX-C 已處理 `homeDir`/`resolveHomeDirectory` 委派與 `sync-memory-index` 修正，此剩餘部分不影響正確性，但統一抽象層的封裝目標在此兩項目未達消費端完整覆蓋 | `path.normalize` 在各處直接使用，行為一致；終端輸出通吃 `\n`。API surface 完整可用，無功能錯誤 | `packages/tool-utils/platform-adapter.ts`（定義）；遍佈（無消費者） | 遍佈 | Spec implementation omission | Req 2 |
| 2 | **`_runner` 中介變數**：`find-github-issues`（L187）與 `review-threads`（L557）使用 `const _runner = createToolRunner(schema);` 作為中介，再以 `handler: (args, context) => _runner(args, context)` 委派。對比 `filter-logs`、`search-logs`、`read-github-issue` 等 11 個工具直接使用 `handler: createToolRunner(schema)`。此中介變數僅使用一次且無額外邏輯 | 無功能影響，屬多餘變數。`_runner` 前綴底線暗示「未使用」，實則使用一次 | `packages/tools/find-github-issues/index.ts`, `packages/tools/review-threads/index.ts` | L187, L557 | Redundant code | Req 1 |

---

## Review History

### Round 6 — 2026-06-04

**Verdict**: Needs Work — 1 new P1 (search-logs `keyword`/`regex` missing `multiple: true`), 8/8 Round 5 issues resolved. 2 P3 suggestions.

### Round 5 — 2026-06-04

**Verdict**: Needs Attention — 17/21 Round 4 issues resolved; 4 P2 remaining.

**Key findings (8 total):**
- **P2 × 4**: review-threads `_rawArgs` not migrated; codegraph SystemError regression; PlatformAdapter consumption gaps; Coverage scope Group 2
- **P3 × 4**: review-threads stale comment; helpTopic type widened; dist/ import paths; test overlap

**Outcome**: 8/8 fixed in `117f9b7`.

### Round 4 — 2026-06-04

**Verdict**: Needs Work — 1 P1 (Windows CI bash), 11 P2, 9 P3.

**Key findings (21 total):**
- **P1 × 1**: Windows CI bash syntax
- **P2 × 11**: Handler duplicate catch, PlatformAdapter consumption gaps, SchemaOption missing `multiple`, AppError base check, StdioWriter type missing, Coverage scope gaps
- **P3 × 9**: codegraph/open-github-issue Error types, ToolArgsParser not in dispatch table, test overlap, etc.

**Outcome**: 17/21 fixed in `df6f957`.

### Round 3 — 2026-06-04

**Verdict**: Needs Work — Same findings as Round 4.

### Round 2 — 2026-06-04

**Verdict**: Needs Attention — 2 P2 (createToolRunner catch block formatting; 21/22 tools not using schema).

**Outcome**: 2/2 fixed.

### Round 1 — 2026-06-04

**Verdict**: Needs Work — 1 P0 (create-specs args missing), 4 P1, 13 P2, 6 P3.

**Outcome**: 16 fixed in `eecb6ce`, 6 in `baec86f`, 6 deferred.
