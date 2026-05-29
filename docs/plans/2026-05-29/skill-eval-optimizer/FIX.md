# Fix Coordinator Prompt: skill-eval-optimizer (Round 2)

- **Date**: 2026-05-29
- **Source REPORT**: `docs/plans/2026-05-29/skill-eval-optimizer/REPORT.md`
- **Source Spec**: `docs/plans/2026-05-29/skill-eval-optimizer/`
- **Total Issues**: P1: 4, P2: 5, P3: 5
- **Total Regression Tests**: 4

---

## 1. Your Role

**You are the fix coordinator.** You do not write code. You do not edit files. Your job is to understand the issues found in code review, delegate each fix and regression test to a worker, and verify that every issue is resolved without introducing regressions.

### What you do

- Read and understand the issue inventory, dependency analysis, and fix details below
- Spawn workers to execute individual fixes, giving each a self-contained prompt (provided in Section 6)
- After all fixes pass verification, spawn workers to implement regression tests
- Wait for all workers in a batch to complete, then digest their results
- Run verification commands at each checkpoint
- Decide whether to proceed to the next batch, retry a failed worker, or halt
- Handle lightweight coordination tasks: resolving merge conflicts, updating lockfiles, committing results

### What you NEVER do

- Write, edit, or modify any source-code or test file directly
- Skip a verification checkpoint
- Proceed to the next batch when the current batch has not passed verification
- Delegate comprehension — digest every worker result yourself before deciding next steps
- Let workers spawn their own workers (workers are leaf nodes)
- Start regression tests before all fixes in scope are verified

---

## 2. Mission

修復 Round 2 審查中發現的 14 個殘留問題（4 P1 + 5 P2 + 5 P3）。核心目標：

1. **P1**: 讀取工具從全面 mock 改為在 workspace 內真實執行（提升評測信度）、CI 門檻從硬編碼改為可配置環境變數、Exit code 增加 P0 問題數量檢查、Judge prompt 納入 trace events 使行號引用可被履行
2. **P2**: 清理冗余 re-export 和未使用 exports、修正型別繞過（as unknown as）、統一 loadQuestions 命名
3. **P3**: 小性能改善（Set 替代 includes、promise-pool guard、scanForDone 非同步化）

**Success looks like**: REPORT.md 中所有 P1/P2 問題已修復，回歸測試通過，`npm test` 全綠，無回歸。

---

## 3. Issue Inventory

| Issue ID | 等級 | 問題簡述 | 涉及檔案 | 審查維度 | 複雜度 |
|---|---|---|---|---|---|
| `FIX-01` | P1 | 讀取工具被全面 mock 而非在 workspace 內真實執行 | `isolation.ts` | 實作偏移 | 中等 |
| `FIX-02` | P1 | EVAL_MIN_SCORE / EVAL_MAX_P0 未被代碼使用 | `index.ts`, `lib/env-utils.ts` | 實作偏移、實作遺漏 | 簡單 |
| `FIX-03` | P1 | Exit code 未檢查 P0 問題數量 | `index.ts` | 實作偏移、實作遺漏 | 簡單 |
| `FIX-04` | P1 | Judge prompt 未傳遞完整 trace events | `scorer.ts` | 實作偏移 | 中等 |
| `FIX-05` | P2 | scorer.ts 冗余 re-export `export { getProjectRoot }` | `scorer.ts` | 冗余代碼 | 簡單 |
| `FIX-06` | P2 | isolation.ts 未使用的 exports（functions + types） | `isolation.ts` | 冗余代碼 | 簡單 |
| `FIX-07` | P2 | executor.ts `messages as unknown as` 繞過型別檢查 | `executor.ts`, `lib/judge-api.ts` | 架構瑕疵 | 簡單 |
| `FIX-08` | P2 | 5 處 `env as unknown as JudgeEnv` 不安全轉型 | `scorer.ts`, `optimizer.ts`, `lib/judge-api.ts` | 架構瑕疵 | 簡單 |
| `FIX-09` | P2 | `loadQuestions` 同名函式行為不同且匯入來源不一致 | `question-loader.ts`, `lib/question-utils.ts` | 架構瑕疵 | 簡單 |
| `FIX-10` | P3 | reporter.ts 反向索引 value 使用 `string[]` + `includes()` | `reporter.ts` | 性能隱患 | 簡單 |
| `FIX-11` | P3 | promise-pool.ts concurrency ≤ 0 無防護 | `lib/promise-pool.ts` | 架構瑕疵 | 簡單 |
| `FIX-12` | P3 | scanForDone 在 watch polling 中使用同步 I/O | `scorer.ts` | 性能隱患 | 簡單 |

> P3.4 (question-utils.ts 職責過多) 和 P3.5 (optimizer.ts 規模過大) 為遠期程式碼組織建議，不納入本輪修復範圍。

---

## 4. Fix Dependency Analysis

### Dependency graph

```
FIX-02 (EnvConfig extension) ──→ FIX-03 (depends on env.EVAL_MAX_P0 being available)

FIX-05 (remove re-export) ──→ independent (single line deletion)

FIX-07 (Message type extension) ──→ independent type change, no logic impact

FIX-08 (JudgeEnv/ExecEnv type alignment) ──→ touches same files as FIX-04 (scorer.ts)
                                              → must be sequenced after FIX-04/FIX-05

FIX-01 + FIX-06 (isolation.ts) ──→ independent from all others

FIX-09 (loadQuestions naming) ──→ independent
```

### File overlap detection

| 重疊組 | 問題 ID | 共享檔案 | 處理方式 |
|---|---|---|---|
| 重疊組 A | FIX-01, FIX-06 | `isolation.ts` | 合併至同一 worker |
| 重疊組 B | FIX-02, FIX-03 | `index.ts`, `lib/env-utils.ts` | 合併至同一 worker |
| 重疊組 C | FIX-04, FIX-05, FIX-12 | `scorer.ts` | 合併至同一 worker |
| 重疊組 D | FIX-07, FIX-08 | `lib/judge-api.ts` | 合併至同一 worker |
| 重疊組 E | FIX-08 (part) | `optimizer.ts` | 與重疊組 D 同 worker |
| 無重疊 | FIX-09 | `question-loader.ts`, `lib/question-utils.ts` | 可獨立 |
| 無重疊 | FIX-10 | `reporter.ts` | 可獨立 |
| 無重疊 | FIX-11 | `lib/promise-pool.ts` | 可獨立 |

**跨 worker 檔案衝突**: Worker C (scorer.ts) 和 Worker D (scorer.ts + optimizer.ts) 都修改 scorer.ts。必須先執行 Worker C 再執行 Worker D。

---

## 5. Fix Details (with Regression Test Design)

### FIX-01: 讀取工具在 workspace 內真實執行 (P1) — 中等

| 欄位 | 內容 |
|---|---|
| **根因** | `isolation.ts` READ_TOOLS set (Read, Grep, Glob, LSP, WebSearch, WebFetch) 全部回傳 `buildReadResponse()` 產生的靜態假字串 `"Content of {path}"`。workspaceDir 已傳入 `createToolDispatcher({ workspaceDir })` 但未被 dispatch 使用。 |
| **涉及檔案** | `isolation.ts` > `createToolDispatcher()` (L136-171), `buildReadResponse()` (L97-104) |
| **修復方式** | 1. 在 dispatch 內，對 Read 工具：使用 `fs.readFileSync` 讀取 `path.join(workspaceDir, params.path)` 指向的檔案，若不存在則回傳 `"Error: file not found: {path}"`。2. 對 Grep 工具：使用 `execSync` 在 workspaceDir 內執行 grep。若 params 包含 pattern，搜尋 workspace 內的檔案並回傳匹配行。3. 對 Glob 工具：使用 `readdirSync` 或 `globSync` 等效邏輯列出 workspace 內匹配的檔案。4. 對 LSP、WebSearch、WebFetch：保留 mock（這些無法在隔離環境中真實執行），但 mock 結果需標註為模擬。 |
| **複雜度** | 中等 |

**Regression test design:**

| 欄位 | 內容 |
|---|---|
| **測試 ID** | `REGTEST-01` |
| **測試類型** | 單元測試 |
| **測試位置** | `packages/tools/eval/test/isolation.test.js`（擴充現有檔案，若不存在則新建） |
| **測試場景** | GIVEN workspaceDir 有一個檔案 `spec.md` 內容為 `"# Hello"`，WHEN dispatcher.dispatch({ tool: 'Read', params: { file_path: 'spec.md' } })，THEN result.data 應包含 `"# Hello"`（真實檔案內容）。GIVEN workspaceDir 無 `missing.txt`，WHEN dispatcher.dispatch({ tool: 'Read', params: { file_path: 'missing.txt' } })，THEN result.success 為 false 或 data 指示檔案不存在。 |
| **Oracle** | 修復前：Read 永遠回傳 `"Content of spec.md"` 不論檔案是否存在。修復後：Read 回傳實際檔案內容或檔案不存在的錯誤。 |

---

### FIX-02: EVAL_MIN_SCORE / EVAL_MAX_P0 從環境變數讀取 (P1) — 簡單

| 欄位 | 內容 |
|---|---|
| **根因** | `eval.yml` 定義了 `EVAL_MIN_SCORE: 60` 和 `EVAL_MAX_P0: 0`，但 `index.ts` L342 硬編碼 `if (avgScore < 60)`，`EnvConfig` 介面無這兩個欄位。 |
| **涉及檔案** | `lib/env-utils.ts` > `EnvConfig`, `DEFAULTS`; `index.ts` > `evalHandler()` |
| **修復方式** | 1. `env-utils.ts` 的 `EnvConfig` 增加 `EVAL_MIN_SCORE: number` 和 `EVAL_MAX_P0: number` 欄位。2. `DEFAULTS` 增加 `EVAL_MIN_SCORE: '60'`、`EVAL_MAX_P0: '0'`。3. `index.ts` L342 將硬編碼 `60` 替換為 `env.EVAL_MIN_SCORE`。 |
| **複雜度** | 簡單 |

**Regression test design:**

| 欄位 | 內容 |
|---|---|
| **測試 ID** | `REGTEST-02` |
| **測試類型** | 單元測試 |
| **測試位置** | `packages/tools/eval/test/index.test.js`（擴充現有檔案） |
| **測試場景** | GIVEN process.env.EVAL_MIN_SCORE = '50', EVAL_MAX_P0 = '2'，WHEN loadEnv() 被呼叫，THEN env.EVAL_MIN_SCORE 應為 50，env.EVAL_MAX_P0 應為 2。GIVEN 未設定 process.env.EVAL_MIN_SCORE，WHEN loadEnv() 被呼叫，THEN env.EVAL_MIN_SCORE 應為 DEFAULTS 值 60。 |
| **Oracle** | 修復前：EnvConfig 無 EVAL_MIN_SCORE/EVAL_MAX_P0 欄位。修復後：這些欄位存在且值正確從 env/預設值讀取。 |

---

### FIX-03: Exit code 檢查 P0 問題數量 (P1) — 簡單

| 欄位 | 內容 |
|---|---|
| **根因** | `index.ts` L341-346 exit code 邏輯僅檢查 `avgScore < 60` 和 `failed > 0`，未統計 scores 中 P0 issues 數量。 |
| **涉及檔案** | `index.ts` > `evalHandler()` L341-346 |
| **修復方式** | 在 exit code 判斷前增加：計算所有 scores 中 severity === 'P0' 的 issues 總數，若超過 `env.EVAL_MAX_P0` 則 exit 1。 |
| **複雜度** | 簡單 |

**Regression test design:**

| 欄位 | 內容 |
|---|---|
| **測試 ID** | `REGTEST-03` |
| **測試類型** | 整合測試 |
| **測試位置** | `packages/tools/eval/test/index.test.js`（擴充現有檔案，REGTEST-02 同檔案） |
| **測試場景** | GIVEN 模擬 scores 中有 3 個 P0 issues，且 EVAL_MAX_P0=2，WHEN evalHandler 判斷 exit code，THEN 應回傳 1（失敗）。GIVEN scores 中無 P0 issues，且平均分 ≥60，WHEN 判斷 exit code，THEN 回傳 0（成功）。 |
| **Oracle** | 修復前：exit code 不考慮 P0 count。修復後：P0 數量超過 EVAL_MAX_P0 時 exit code 為 1。 |

---

### FIX-04: Judge prompt 納入 trace events (P1) — 中等

| 欄位 | 內容 |
|---|---|
| **根因** | `buildJudgePrompt()` 向 judge 傳遞 userPrompt、截斷的 assistantResponse、status/duration/errors，但**從未序列化完整 trace events**（含 tool_call、tool_result 及其 _lineNumber）。Judge 雖被指示使用 `L{N}: ` 格式，但看不到任何事件的行號對應內容。 |
| **涉及檔案** | `scorer.ts` > `buildJudgePrompt()` L150-253 |
| **修復方式** | 在 `buildJudgePrompt()` 中增加「## 執行軌跡摘要」區段，將 trace events 序列化為精簡清單，每行格式：`L{_lineNumber}: [{type}] {關鍵資訊}`。例如：`L5: [tool_call] Read(file_path="spec.md")`、`L7: [tool_result] Read → "Content of spec.md"`。tool_call 和 tool_result events 必須包含，thinking/response 可摘要。限制此區段總長度（如 4000 字元），超出則截斷。 |
| **複雜度** | 中等 |

**Regression test design:**

| 欄位 | 內容 |
|---|---|
| **測試 ID** | `REGTEST-04` |
| **測試類型** | 單元測試 |
| **測試位置** | `packages/tools/eval/test/scorer.test.js`（擴充現有檔案） |
| **測試場景** | GIVEN 一個包含 tool_call (L5) 和 tool_result (L7) events 的 trace，WHEN buildJudgePrompt(trace, ...) 被呼叫，THEN prompt 字串應包含 `"L5:"` 和 `"L7:"` 格式的行號引用。 |
| **Oracle** | 修復前：prompt 不含行號對應的事件內容（僅有格式指示）。修復後：prompt 包含 `L{N}:` 前綴的 trace event 摘要。 |

---

### FIX-05: 移除 scorer.ts 冗余 re-export (P2) — 簡單

| 欄位 | 內容 |
|---|---|
| **根因** | scorer.ts L31 `export { getProjectRoot };` 是遷移至 `lib/project-root.ts` 後的遺留。所有模組皆直接從 `lib/project-root.js` 匯入。 |
| **涉及檔案** | `scorer.ts` L31 |
| **修復方式** | 刪除 L31 `export { getProjectRoot };`。 |
| **複雜度** | 簡單 |

---

### FIX-06: 移除 isolation.ts 未使用的 exports (P2) — 簡單

| 欄位 | 內容 |
|---|---|
| **根因** | `createFreshContext()` 和 `validateIsolation()` 在 packages/ 下零引用。實際評分流程使用隱式隔離（每次 callJudgeModel 建立暫態 messages array）。對應的型別 `MessageContext` 僅是 createFreshContext 的回傳型別，也一併冗余。`ToolDispatcher` interface、`ToolCallRecord`、`MockToolResult` 雖是函式簽名的一部分但無外部模組直接匯入。 |
| **涉及檔案** | `isolation.ts` > L19, L25, L32, L53, L190-197, L229-246 |
| **修復方式** | 1. 移除 `createFreshContext()` 函式和 `MessageContext` interface。2. 移除 `validateIsolation()` 函式和 `JUDGE_OUTPUT_KEYWORDS` 常數。3. `ToolDispatcher`、`ToolCallRecord`、`MockToolResult` 三型別保留（它們定義了公開 API 合約，即使無外部直接匯入，也作為 createToolDispatcher 的簽名一部分而存在）。 |
| **複雜度** | 簡單 |

---

### FIX-07: 修正 executor.ts messages 型別繞過 (P2) — 簡單

| 欄位 | 內容 |
|---|---|
| **根因** | `executor.ts` L247 `messages as unknown as Parameters<typeof callExecModel>[0]` 因為 `callExecModel` 的 `Message` 型別僅定義 `{ role: string; content: string }`，但 tool-use loop 中的 messages 有 `tool_calls` 和 `tool_call_id` 欄位。 |
| **涉及檔案** | `lib/judge-api.ts` > `Message` interface (L12-15); `executor.ts` > L228, L247 |
| **修復方式** | 1. 擴充 `lib/judge-api.ts` 的 `Message` 型別：`content` 改為 `string | null`（OpenAI API tool call message 的 content 可為 null）；增加可選 `tool_calls?: Array<Record<string, unknown>>` 和 `tool_call_id?: string`。2. `executor.ts` L247 移除 `as unknown as` 轉型，改為直接傳遞 `messages as Message[]`。 |
| **複雜度** | 簡單 |

---

### FIX-08: 修正 env as unknown as JudgeEnv 不安全轉型 (P2) — 簡單

| 欄位 | 內容 |
|---|---|
| **根因** | `scorer.ts` L307 和 `optimizer.ts` 四處將 `EnvConfig` 強轉為 `JudgeEnv`。`EnvConfig` 已包含 `JUDGE_*` 欄位，應直接兼容。`callJudgeModel` / `callJudgeModelRaw` 的參數型別可使用 `EnvConfig` 的子集。 |
| **涉及檔案** | `lib/judge-api.ts` > `callJudgeModel()`, `callJudgeModelRaw()`; `scorer.ts` > L307; `optimizer.ts` > L460, L786, L1145, L1188 |
| **修復方式** | 1. 將 `callJudgeModel` 和 `callJudgeModelRaw` 的 `env` 參數型別從 `JudgeEnv` 改為 `Pick<EnvConfig, 'JUDGE_BASE_URL' \| 'JUDGE_MODEL' \| 'JUDGE_API_KEY' \| 'JUDGE_REASONING_EFFORT'>`（或直接讓 JudgeEnv = Pick<EnvConfig, ...>）。2. 移除 scorer.ts 和 optimizer.ts 中所有 `as unknown as JudgeEnv` 轉型。3. 對 `callExecModel` 同理處理 `ExecEnv`。 |
| **複雜度** | 簡單 |

---

### FIX-09: 統一 loadQuestions 命名 (P2) — 簡單

| 欄位 | 內容 |
|---|---|
| **根因** | `question-loader.ts` L53 和 `lib/question-utils.ts` L237 各有 `loadQuestions` 函式，前者包裝後者，但 `scorer.ts` 直接從後者匯入，跳過包裝層。未來行為分歧的風險。 |
| **涉及檔案** | `question-loader.ts`, `scorer.ts`, `lib/question-utils.ts` |
| **修復方式** | 1. `lib/question-utils.ts` 的 `loadQuestions` 重新命名為 `loadQuestionsFromFile`（更準確描述其行為：從檔案路徑載入並解析 JSON）。2. 更新 `question-loader.ts` 的內部呼叫和 `scorer.ts` 的 import。3. `question-loader.ts` 的公開 `loadQuestions` 保持原名（它是對外公開的包裝 API）。 |
| **複雜度** | 簡單 |

---

### FIX-10: reporter.ts 反向索引改用 Set (P3) — 簡單

| 欄位 | 內容 |
|---|---|
| **根因** | `reporter.ts` L155 `testIds.includes(s.testId)` 對每次插入是 O(n)。 |
| **涉及檔案** | `reporter.ts` > L147-158 |
| **修復方式** | 將 `issueToTestMap` 的 value 型別從 `Map<string, string[]>` 改為 `Map<string, Set<string>>`，L155 的 `includes` 改為 `testIds.add(s.testId)`（Set 自動去重）。L283 join 時改用 `[...testIds].join(', ')`。 |
| **複雜度** | 簡單 |

---

### FIX-11: promise-pool.ts concurrency ≤ 0 guard (P3) — 簡單

| 欄位 | 內容 |
|---|---|
| **根因** | `concurrency <= 0` 時 `Promise.all([])` 立即 resolve，所有 items 靜默被跳過。 |
| **涉及檔案** | `lib/promise-pool.ts` > L29 |
| **修復方式** | 在 promisePool 函式入口加入 `if (concurrency <= 0) throw new Error(...)`。 |
| **複雜度** | 簡單 |

---

### FIX-12: scanForDone 非同步化 (P3) — 簡單

| 欄位 | 內容 |
|---|---|
| **根因** | `scanForDone` 使用 `readdirSync` + 迴圈內 `existsSync`，在 watchMode 每 10 秒 block event loop。 |
| **涉及檔案** | `scorer.ts` > `scanForDone()` L452-469, `watchMode()` L566 |
| **修復方式** | 1. 新增 `scanForDoneAsync` async 版本，使用 `fs/promises.readdir` + `fs/promises.access`。2. `watchMode` 的 polling（L566）改用 `scanForDoneAsync`。3. 保留 `scanForDone` 同步版本供 `scoreAllTests`（非 watch 場景）使用（其效能影響可忽略）。 |
| **複雜度** | 簡單 |

---

## 6. Worker Prompt Library

### WORKER-A: FIX-01 + FIX-06 (isolation.ts — 讀取工具真實執行 + 清理未使用 exports)

```
## Mission
修復 isolation.ts 的兩個問題：1) 讀取工具從全面 mock 改為在 workspace 內真實執行（P1），2) 移除未使用的 exports（P2）。

## Context
- REPORT.md 發現 P1#1：READ_TOOLS (Read, Grep, Glob 等) 全部回傳靜態假字串，導致被評測模型無法展現真實檔案定位能力。workspaceDir 已傳入 createToolDispatcher 但未被 dispatch 使用。
- REPORT.md 發現 P2#2：createFreshContext()、validateIsolation()、MessageContext 等 exports 在 packages/ 下零引用。實際評分使用隱式隔離。

## Input
閱讀這些檔案：
- packages/tools/eval/isolation.ts (完整閱讀)

## What to do

### Part A — 讀取工具真實執行 (FIX-01)
1. 在 dispatch() 內，對 Read 工具：使用 readFileSync 讀取 path.join(workspaceDir, resolvedPath)。若檔案存在，回傳其內容；若不存在，回傳 success: false + 錯誤訊息。
   - 注意路徑安全：resolve 必須在 workspaceDir 內（防止 ../ 跳脫），若路徑試圖離開 workspace，回傳錯誤。
2. 對 Grep 工具：使用 execSync 在 workspaceDir 內執行 grep（或 Node.js 原生實現：讀取 workspace 內所有文字檔，用 pattern 匹配行）。
   - 若無 params.pattern，回傳錯誤。
3. 對 Glob 工具：使用 readdirSync recursive 列出 workspace 內匹配 params.pattern 的檔案。
4. 對 LSP、WebSearch、WebFetch：保留 mock（無法在隔離環境真實執行），但 mock result 標註 "[simulated]" 前綴以區分真實結果。
5. 確保 buildReadResponse 函式不再被 READ_TOOLS 的 dispatch 路徑使用（改為真實執行），保留給其他可能需要模擬回应的場景。

### Part B — 清理未使用 exports (FIX-06)
1. 移除 createFreshContext() 函式及其 MessageContext interface。
2. 移除 validateIsolation() 函式及 JUDGE_OUTPUT_KEYWORDS 常數。
3. ToolDispatcher、ToolCallRecord、MockToolResult 型別保留（它們定義公開 API 合約）。

## Scope
- 允許修改: packages/tools/eval/isolation.ts
- 禁止修改: 其他任何檔案

## Output
回報：
1. 修改了的函式和它們的新行為
2. 移除了哪些 exports
3. 驗證命令的結果

## Verify
- `npx tsc --noEmit` 確認 isolation.ts 編譯無誤
- `node --test packages/tools/eval/test/` 確認現有測試通過

## Boundaries
- 不修改 executor.ts（executor.ts 對 isolation.ts 的 import 必須繼續有效）
- Read/Grep 必須限制在 workspaceDir 內，不可存取外部檔案系統
- workspaceDir 參數若為 undefined，Read 等操作應優雅降級（回傳 mock 或錯誤）
```

### WORKER-B: FIX-02 + FIX-03 (index.ts + env-utils.ts — CI 閘門可配置 + Exit code P0 檢查)

```
## Mission
修復 CI 閘門的兩個問題：1) EVAL_MIN_SCORE/EVAL_MAX_P0 從環境變數讀取而非硬編碼（P1），2) Exit code 增加 P0 問題數量檢查（P1）。

## Context
- REPORT.md 發現 P1#2：eval.yml 定義了 EVAL_MIN_SCORE=60 和 EVAL_MAX_P0=0，但 index.ts L342 硬編碼 avgScore < 60。EnvConfig 無這兩個欄位。
- REPORT.md 發現 P1#3：Exit code 僅檢查 avgScore < 60 和 failed > 0，從未統計 P0 issues。

## Input
閱讀這些檔案：
- packages/tools/eval/lib/env-utils.ts (特別注意 EnvConfig interface L24-40 和 DEFAULTS L60-67)
- packages/tools/eval/index.ts (特別注意 evalHandler L177-352, exit code L341-346)

## What to do

### Part A — 環境變數 (FIX-02)
1. env-utils.ts EnvConfig interface 增加兩個欄位：
   - `EVAL_MIN_SCORE: number` (預設 60)
   - `EVAL_MAX_P0: number` (預設 0)
2. DEFAULTS 物件增加 `EVAL_MIN_SCORE: '60'`、`EVAL_MAX_P0: '0'`
3. loadEnv() 中對這兩個值做 parsePositiveInt 轉換（與現有 numeric vars 一致）
4. index.ts L342 將硬編碼 60 替換為 `env.EVAL_MIN_SCORE`

### Part B — P0 檢查 (FIX-03)
在 index.ts 的 evalHandler() 中，於 exit code 判斷區塊（約 L341-346）之前增加：
1. 計算 `p0Count = scores.reduce((sum, s) => sum + (s.issues?.filter(i => i.severity === 'P0').length || 0), 0)`
2. 若 `p0Count > env.EVAL_MAX_P0`，輸出 stderr 訊息並 return 1
3. 保留現有的 avgScore 和 failed 檢查

## Scope
- 允許修改: packages/tools/eval/lib/env-utils.ts, packages/tools/eval/index.ts
- 禁止修改: 其他任何檔案

## Output
回報：
1. EnvConfig 新增欄位名稱和型別
2. index.ts exit code 邏輯的變更
3. 驗證命令結果

## Verify
- `npx tsc --noEmit` 確認編譯無誤
- `node --test packages/tools/eval/test/index.test.js` 確認現有測試通過

## Boundaries
- 不修改 .github/workflows/eval.yml（它已正確定義環境變數）
- 不修改 DEFAULTS 以外的 env-utils.ts 邏輯
```

### WORKER-C: FIX-04 + FIX-05 + FIX-12 (scorer.ts — Judge prompt trace + 移除 re-export + scanForDone async)

```
## Mission
修復 scorer.ts 的三個問題：1) buildJudgePrompt 納入 trace events 使行號引用可被履行（P1），2) 移除冗余 re-export（P2），3) scanForDone 非同步化（P3）。

## Context
- REPORT.md 發現 P1#4：buildJudgePrompt 指示 judge 使用 L{N} 格式但未序列化 trace events。Judge 看不到 tool_call/tool_result 及其 _lineNumber。
- REPORT.md 發現 P2#1：scorer.ts L31 `export { getProjectRoot };` 是無消費者的冗余 re-export。
- REPORT.md 發現 P3#3：scanForDone 在 watchMode polling 中使用同步 I/O。

## Input
閱讀這些檔案：
- packages/tools/eval/scorer.ts (完整閱讀，特別注意 buildJudgePrompt L150-253, scanForDone L452-469, watchMode L498-612)
- packages/tools/eval/executor.ts (TraceEvent 型別定義 L30-35)

## What to do

### Part A — Judge prompt trace (FIX-04)
在 buildJudgePrompt() 中增加「## 執行軌跡摘要」區段（放在 "## 原始評分標準" 之前）：
1. 遍歷 trace events，提取 type 為 tool_call 和 tool_result 的事件
2. 格式化為 `L{_lineNumber}: [{type}] {摘要}` 格式
   - tool_call: `L5: [tool_call] {tool}({key_params})`
   - tool_result: `L7: [tool_result] {tool} → {result_summary}`
   - error: `L9: [error] {message}`
3. 限制此區段總長度在 3000 字元內，超出則截斷並加 "... (軌跡已截斷)" 標記
4. 確保參考行號的指示 `'Each issue\'s evidence MUST reference...'` 在此區段之後

### Part B — 移除 re-export (FIX-05)
刪除 scorer.ts L31 `export { getProjectRoot };` 這一行。

### Part C — scanForDone async (FIX-12)
1. 新增 `scanForDoneAsync` async 函式，使用 `readdir` from fs/promises + `access` 檢查 .done marker
2. watchMode() 的 setInterval polling (L594) 改為使用 scanForDoneAsync + await
3. 保留同步版 scanForDone 供 scoreAllTests 使用

## Scope
- 允許修改: packages/tools/eval/scorer.ts
- 禁止修改: 其他任何檔案

## Output
回報：
1. buildJudgePrompt 新增區段的格式範例
2. 刪除了哪一行
3. 驗證命令結果

## Verify
- `npx tsc --noEmit` 確認編譯無誤
- `node --test packages/tools/eval/test/scorer.test.js` 確認現有測試通過

## Boundaries
- buildJudgePrompt 新增區段不超過 3000 字元
- 不改變現有的評分維度和輸出格式 JSON schema
```

### WORKER-D: FIX-07 + FIX-08 + FIX-09 (型別安全 + 命名統一)

```
## Mission
修復三個型別安全與命名問題：1) executor.ts messages 型別繞過（P2），2) 5 處 env as unknown as JudgeEnv 不安全轉型（P2），3) loadQuestions 命名衝突（P2）。

## Context
- REPORT.md P2#3: executor.ts L247 使用 `as unknown as Parameters<...>` 繞過 Message 型別限制
- REPORT.md P2#4: scorer.ts L307 + optimizer.ts 四處 `as unknown as JudgeEnv` 強轉
- REPORT.md P2#5: question-loader.ts 和 lib/question-utils.ts 各有一個 loadQuestions 函式，行為不同

## Input
閱讀這些檔案：
- packages/tools/eval/lib/judge-api.ts (Message, JudgeEnv, ExecEnv 型別, callJudgeModel, callJudgeModelRaw, callExecModel)
- packages/tools/eval/executor.ts (L228 messages 宣告, L247 as unknown as 轉型)
- packages/tools/eval/scorer.ts (L307 as unknown as JudgeEnv)
- packages/tools/eval/optimizer.ts (L460, L786, L1145, L1188 as unknown as JudgeEnv)
- packages/tools/eval/question-loader.ts (完整閱讀)
- packages/tools/eval/lib/question-utils.ts (loadQuestions 函式 L237)

## What to do

### Part A — Message 型別擴充 (FIX-07)
1. judge-api.ts Message interface 改為：
```typescript
export interface Message {
  role: string;
  content: string | null;
  tool_calls?: Array<Record<string, unknown>>;
  tool_call_id?: string;
}
```
2. executor.ts L247 將 `messages as unknown as Parameters<typeof callExecModel>[0]` 改為 `messages as Message[]`。

### Part B — JudgeEnv/ExecEnv 型別對齊 (FIX-08)
1. judge-api.ts 中 JudgeEnv 改為 `Pick<EnvConfig, 'JUDGE_BASE_URL' | 'JUDGE_MODEL' | 'JUDGE_API_KEY' | 'JUDGE_REASONING_EFFORT'>` 或直接 import EnvConfig 並用 Pick。
   - 同理，ExecEnv 改為 Pick<EnvConfig, EXEC_* 欄位>。
   - 需要在 judge-api.ts 中 import type { EnvConfig } from './env-utils.js'（注意這可能造成循環依賴——若存在則改用直接宣告 interface 含 JUDGE_* 欄位的型別別名）。
2. 移除 scorer.ts L307 `as unknown as JudgeEnv`。
3. 移除 optimizer.ts 四處 `as unknown as JudgeEnv`（L460, L786, L1145, L1188）。
4. 確保 callJudgeModel/callJudgeModelRaw/callExecModel 接受 EnvConfig 子集。

### Part C — loadQuestions 命名 (FIX-09)
1. lib/question-utils.ts 的 `loadQuestions` 重新命名為 `loadQuestionsFromFile`
2. 更新 question-loader.ts 內部對 libLoadQuestions 的引用（該檔案已有別名 `libLoadQuestions`，只需更新 import）
3. 更新 scorer.ts 從 `loadQuestions` 改為 `loadQuestionsFromFile` 的 import

## Scope
- 允許修改: packages/tools/eval/lib/judge-api.ts, executor.ts, scorer.ts, optimizer.ts, question-loader.ts, lib/question-utils.ts
- 禁止修改: 其他任何檔案

## Output
回報：
1. Message 型別的最終定義
2. JudgeEnv/ExecEnv 的最終定義（若有循環依賴需說明解決方案）
3. loadQuestionsFromFile 的更名影響範圍
4. 驗證命令結果

## Verify
- `npx tsc --noEmit` 確認全專案編譯無誤（零錯誤）
- `node --test packages/tools/eval/test/` 確認所有現有測試通過

## Boundaries
- 注意 judge-api.ts 和 env-utils.ts 之間可能形成循環依賴（judge-api.ts import EnvConfig, env-utils.ts import nothing from judge-api.ts — 所以單向依賴，安全）
- 所有五處 as unknown as JudgeEnv 移除後，型別必須完全兼容，不可殘留任何轉型
```

### WORKER-E: FIX-10 + FIX-11 (reporter.ts Set + promise-pool guard)

```
## Mission
修復兩個小型的 P3 問題：1) reporter.ts 反向索引改用 Set 避免 O(n) includes（P3），2) promise-pool.ts 增加 concurrency ≤ 0 guard（P3）。

## Context
- REPORT.md P3#1: reporter.ts L155 `testIds.includes(s.testId)` 在迴圈中每次插入都掃描陣列
- REPORT.md P3#2: promisePool concurrency ≤ 0 時靜默跳過所有 items

## Input
閱讀這些檔案：
- packages/tools/eval/reporter.ts (L147-158 反向索引, L283 join)
- packages/tools/eval/lib/promise-pool.ts (完整閱讀)

## What to do

### Part A — reporter.ts Set (FIX-10)
1. issueToTestMap 型別從 `Map<string, string[]>` 改為 `Map<string, Set<string>>`
2. L155 `testIds.includes(s.testId)` + `push` 改為 `testIds.add(s.testId)`（Set 自動去重）
3. L283 `.join(', ')` 改為 `[...testIds].join(', ')`（或 `Array.from(testIds).join(', ')`）

### Part B — promise-pool guard (FIX-11)
在 promisePool 函式開頭（`const limit = Math.min(...)` 之前）加入：
```typescript
if (concurrency <= 0) {
  throw new Error(`promisePool: concurrency must be > 0, got ${concurrency}`);
}
```

## Scope
- 允許修改: packages/tools/eval/reporter.ts, packages/tools/eval/lib/promise-pool.ts
- 禁止修改: 其他任何檔案

## Output
回報修改的行數和內容。

## Verify
- `npx tsc --noEmit` 確認編譯無誤
- `node --test packages/tools/eval/test/reporter.test.js` 確認 reporter 測試通過
```

---

### REGTEST Worker Prompts

### REGTEST-A: FIX-01 回歸測試 (isolation Read 真實執行)

```
## Mission
為 FIX-01（isolation.ts 讀取工具真實執行）建立回歸測試。

## Context
FIX-01 修改了 isolation.ts 的 dispatch()，使 Read 工具實際讀取 workspace 內的檔案而非回傳靜態假字串。

## Input
閱讀這些檔案：
- packages/tools/eval/isolation.ts (createToolDispatcher, dispatch 邏輯)
- packages/tools/eval/test/ 現有測試檔案 (了解測試格式 — node:test + assert)

## What to do
在 packages/tools/eval/test/ 建立新檔案 `isolation.test.js`（若已存在則擴充），測試內容：

1. 建立臨時 workspace 目錄（使用 fs.mkdtempSync）
2. 在 workspace 內寫入測試檔案 `spec.md` 內容為 `"# Test Spec"`
3. 建立 dispatcher = createToolDispatcher({ workspaceDir })
4. 測試 1: dispatch({ tool: 'Read', params: { file_path: 'spec.md' } }) → result.success === true, result.data 包含 "# Test Spec"
5. 測試 2: dispatch({ tool: 'Read', params: { file_path: 'missing.txt' } }) → result.success === false 或 data 指示檔案不存在
6. 清理臨時目錄

## Scope
- 允許創建/修改: packages/tools/eval/test/isolation.test.js

## Verify
- `node --test packages/tools/eval/test/isolation.test.js` 確認測試通過
- 修復前此測試應失敗（因為 Read 回傳 "Content of spec.md" 而非 "# Test Spec"）
```

### REGTEST-B: FIX-02/03 回歸測試 (EnvConfig + P0 exit code)

```
## Mission
為 FIX-02（EVAL_MIN_SCORE/MAX_P0 環境變數）和 FIX-03（exit code P0 檢查）建立回歸測試。

## Context
FIX-02 在 EnvConfig 中新增了 EVAL_MIN_SCORE 和 EVAL_MAX_P0 欄位。FIX-03 修改了 index.ts exit code 邏輯增加 P0 計數檢查。

## Input
閱讀這些檔案：
- packages/tools/eval/lib/env-utils.ts (EnvConfig, DEFAULTS, loadEnv)
- packages/tools/eval/test/index.test.js (現有 index 測試格式)

## What to do
在 packages/tools/eval/test/index.test.js 擴充以下測試（使用 node:test + assert）：

1. 測試 EVAL_MIN_SCORE 存在於 EnvConfig: 建立 mock env 物件，確認 env.EVAL_MIN_SCORE 是 number
2. 測試 EVAL_MAX_P0 預設值: 模擬未設定 process.env，呼叫類似 loadEnv 的邏輯，確認 EVAL_MAX_P0 === 0
3. 測試模擬 scores 的 P0 計數邏輯（抽取出獨立的輔助函式或直接測試 exit code 判斷區塊）

## Scope
- 允許修改: packages/tools/eval/test/index.test.js

## Verify
- `node --test packages/tools/eval/test/index.test.js` 確認所有測試通過
```

### REGTEST-C: FIX-04 回歸測試 (Judge prompt 含行號)

```
## Mission
為 FIX-04（buildJudgePrompt 納入 trace events）建立回歸測試。

## Context
FIX-04 修改了 scorer.ts buildJudgePrompt()，增加 trace events 摘要區段使 judge 可以引用 JSONL 行號。

## Input
閱讀這些檔案：
- packages/tools/eval/scorer.ts (buildJudgePrompt)
- packages/tools/eval/test/scorer.test.js (現有 scorer 測試格式)

## What to do
在 packages/tools/eval/test/scorer.test.js 擴充以下測試：

1. 建立包含 tool_call 和 tool_result 的 mock trace events（含 _lineNumber: 5, 7）
2. 呼叫 buildJudgePrompt(trace, scoringCriteria, 'Q001')
3. assert prompt 字串包含 "L5:" 和 "L7:" 格式的行號引用
4. assert prompt 字串包含 tool_call 和 tool_result 的事件摘要

## Scope
- 允許修改: packages/tools/eval/test/scorer.test.js

## Verify
- `node --test packages/tools/eval/test/scorer.test.js` 確認測試通過
- 修復前此測試應失敗（prompt 不含 L5:/L7: 行號引用）
```

---

## 7. Fix Batch Schedule

```
Batch 1: P1 核心修復 (3 workers 並行，無檔案衝突)
├── WORKER-A: FIX-01 + FIX-06 (isolation.ts)
├── WORKER-B: FIX-02 + FIX-03 (index.ts + env-utils.ts)
└── WORKER-C: FIX-04 + FIX-05 + FIX-12 (scorer.ts)
    Gate: npx tsc --noEmit (零錯誤) && npm test (全部通過)

Batch 2: P2 型別安全 + 命名 (1 worker，因為修改 scorer.ts 需等 Batch 1 完成)
└── WORKER-D: FIX-07 + FIX-08 + FIX-09 (judge-api.ts, executor.ts, scorer.ts, optimizer.ts, question-loader.ts, question-utils.ts)
    Gate: npx tsc --noEmit (零錯誤) && npm test (全部通過)

Batch 3: P3 小改善 (1 worker，獨立無衝突)
└── WORKER-E: FIX-10 + FIX-11 (reporter.ts, promise-pool.ts)
    Gate: npx tsc --noEmit (零錯誤) && npm test (全部通過)

Batch 4: 回歸測試 (3 workers 並行，不同測試檔案無衝突)
├── REGTEST-A: isolation.test.js (Read 真實執行驗證)
├── REGTEST-B: index.test.js (EnvConfig + P0 exit code)
└── REGTEST-C: scorer.test.js (Judge prompt 行號引用)
    Gate: node --test packages/tools/eval/test/ (全部通過，包含新增測試)

Batch 5: 收尾驗證
├── npm test (確認全專案測試通過，無回歸)
└── npx tsc --noEmit (確認全專案編譯零錯誤)
```

---

## 8. Regression Test Inventory

| 測試 ID | 關聯修復 | 測試類型 | 測試位置 | 驗證目標 |
|---|---|---|---|---|
| `REGTEST-01` | FIX-01 | 單元 | `test/isolation.test.js` (新建) | Read 工具真實讀取 workspace 檔案 |
| `REGTEST-02` | FIX-02 | 單元 | `test/index.test.js` (擴充) | EVAL_MIN_SCORE/EVAL_MAX_P0 從 env 讀取 |
| `REGTEST-03` | FIX-03 | 整合 | `test/index.test.js` (擴充) | P0 數量超過閾值時 exit code 為 1 |
| `REGTEST-04` | FIX-04 | 單元 | `test/scorer.test.js` (擴充) | judge prompt 包含 L{N}: 行號引用 |

---

## 9. Verification Checkpoints

### 每批次 Gate
- `npx tsc --noEmit` — 零 TypeScript 編譯錯誤
- `npm test` — 全部測試通過（現有 + 新增）

### Batch 4 特殊 Gate
- 確認每個 REGTEST 測試在未修復場景下會失敗（logical check）
- 確認修復後所有 REGTEST 測試通過

### 最終 Gate
- 全專案 `npm test` 通過
- `npx tsc --noEmit` 零錯誤
- 對照 REPORT.md 確認所有 P1/P2 問題已處理

---

## 10. Error Recovery

### Worker 失敗處理
1. 第一次失敗：繼續該 worker（保持上下文），給予更具體的錯誤定位指令
2. 第二次失敗：暫停該批次，保留其他 worker 成功結果，通知用戶

### 合併衝突
- 若 Worker D (Batch 2) 與 Worker C (Batch 1) 在 scorer.ts 有合併衝突，協調器自己解決
- 衝突解決後重新執行 Batch 2 Gate 驗證

### 測試回歸
- 若現有測試在修復後失敗，暫停流程，分析回歸原因，決定修復策略後繼續

---

## 11. Boundaries

### ALWAYS
- 每批次 Gate 驗證（npx tsc --noEmit + npm test）
- 原樣擷取 Section 6 的 worker prompt 派發
- 先消化 worker 結果再決定下一步
- 提交前執行最終 full test suite

### ASK FIRST
- Worker 兩次失敗後暫停
- 需要修改未列在 Scope 中的檔案
- 修復導致無法定位的回歸

### NEVER
- 協調器自己編輯原始碼
- Worker 生成子 worker
- 跳過驗證
- 給予模糊指令（"fix it"、"based on your findings"）
- 在 Batch 完成前提交

---

## 12. Fix History

> **2026-05-29 (Round 1)**: 修復了 REPORT.md Round 1 的 25 個問題（2 P0 + 13 P1 + 9 P2 + 1 P3），16 個檔案變更，21 個回歸測試。Commit: `91863d7`。核心修復：tool-use loop 整合、JSONL 行號、getProjectRoot 共用、磁碟檢查、執行鎖、非同步 I/O、反向索引等。
>
> **2026-05-29 (Round 2 — 本次)**: 修復 Round 2 審查的 14 個殘留問題（4 P1 + 5 P2 + 5 P3）。核心修復：讀取工具真實執行、CI 門檻可配置、P0 exit code 檢查、Judge prompt 含 trace events、型別安全修正。
