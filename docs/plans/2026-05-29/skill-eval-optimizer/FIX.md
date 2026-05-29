# Fix Coordinator Prompt: skill-eval-optimizer

- **Date**: 2026-05-29
- **Source REPORT**: `docs/plans/2026-05-29/skill-eval-optimizer/REPORT.md`
- **Source Spec**: `docs/plans/2026-05-29/skill-eval-optimizer/`
- **Total Issues**: P0: 2, P1: 13, P2: 9, P3: 1
- **Total Regression Tests**: 15

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

修復 REPORT.md 中識別的 25 個問題（2 P0 + 13 P1 + 9 P2 + 1 P3），涵蓋 6 個審查維度。核心目標：

1. **P0**: 整合 isolation.ts 至 executor pipeline（目前 R4 需求完全未實作）、補上 JSONL 行號引用
2. **P1**: 消除 getProjectRoot() 重複實作、修正性能問題（重複讀取 question JSON、O(n²) API 呼叫）、補完 spec 定義的錯誤案例覆蓋（磁碟檢查、無法評分標記、CI 門檻、ALLOWED_FILES 強制、執行鎖、衝突保留）
3. **P2**: 修正幻覺引用（拼寫不一致、廢棄腳本路徑、無效 flag 建議）、清理冗余代碼、修正 exit code 邏輯

**Success looks like**: REPORT.md 中所有問題已修復，所有回歸測試通過，`npm test` 全綠，無回歸。

---

## 3. Issue Inventory

| Issue ID | 等級 | 問題簡述 | 涉及檔案 | 審查維度 | 複雜度 |
|---|---|---|---|---|---|
| `FIX-01` | P0 | isolation.ts 工具模擬層未整合至 executor pipeline | `executor.ts`, `isolation.ts` | 實作偏移、實作遺漏 | 複雜 |
| `FIX-02` | P0 | 軌跡引用未精確到 JSONL 行號 | `executor.ts`, `scorer.ts`, `reporter.ts` | 實作遺漏 | 複雜 |
| `FIX-03` | P1 | getProjectRoot() 重複 4 次 + index.ts 路徑層數錯誤 | `executor.ts`, `scorer.ts`, `reporter.ts`, `index.ts` + new `lib/project-root.ts` | 冗余代碼、幻覺代碼 | 簡單 |
| `FIX-04` | P1 | scorer.ts scoreAllTests 重複讀取 question JSON | `scorer.ts` | 性能隱患 | 簡單 |
| `FIX-05` | P1 | optimizer.ts refineDedupWithJudge O(n²) pairwise API | `optimizer.ts` | 性能隱患 | 複雜 |
| `FIX-06` | P1 | 磁碟空間檢查未實作 | `executor.ts` | 實作遺漏 | 簡單 |
| `FIX-07` | P1 | JSONL 損壞時報告缺少「無法評分」標記 | `scorer.ts`, `reporter.ts` | 實作遺漏 | 中等 |
| `FIX-08` | P1 | CI 分數門檻不可配置 | `.github/workflows/eval.yml` | 實作遺漏 | 簡單 |
| `FIX-09` | P1 | ALLOWED_FILES 白名單定義但未被強制 | `optimizer.ts` | 實作遺漏、架構瑕疵 | 簡單 |
| `FIX-10` | P1 | 優化後僅驗證 YAML frontmatter 不驗證 Markdown 結構 | `optimizer.ts` | 實作遺漏 | 簡單 |
| `FIX-11` | P1 | 執行階段無並發鎖 | `executor.ts` | 實作遺漏、架構瑕疵 | 簡單 |
| `FIX-12` | P1 | 優化 diff 衝突無「保留雙方版本」機制 | `optimizer.ts` | 實作遺漏 | 簡單 |
| `FIX-13` | P1 | scorer.ts 大量同步 I/O 阻斷 event loop | `scorer.ts` | 性能隱患、架構瑕疵 | 中等 |
| `FIX-14` | P2 | help 文字 `--optimise` 拼寫不一致 | `index.ts` | 幻覺代碼 | 簡單 |
| `FIX-15` | P2 | optimizer.ts 警告引用廢棄 .mjs 腳本 | `optimizer.ts`, `question-loader.ts` | 幻覺代碼 | 簡單 |
| `FIX-16` | P2 | question-loader 錯誤訊息建議不存在的 `--questions` flag | `question-loader.ts` | 幻覺代碼 | 簡單 |
| `FIX-17` | P2 | env-utils.ts selfTest 路徑錯誤 | `lib/env-utils.ts` | 幻覺代碼 | 簡單 |
| `FIX-18` | P2 | 清理冗余: 未使用 import、未使用參數、死代碼 | `question-loader.ts`, `optimizer.ts`, `executor.ts` | 冗余代碼 | 簡單 |
| `FIX-19` | P2 | exit code 未反映評分結果 | `index.ts` | 實作偏移 | 簡單 |
| `FIX-20` | P2 | CI 缺少 .env 時無顯式警告 | `.github/workflows/eval.yml` | 實作遺漏 | 簡單 |
| `FIX-21` | P2 | 未檢查 EXEC_MODEL 與 JUDGE_MODEL 相同 | `lib/env-utils.ts` | 實作遺漏 | 簡單 |
| `FIX-22` | P2 | reporter.ts O(n³) 巢狀遍歷 | `reporter.ts` | 性能隱患 | 簡單 |
| `FIX-23` | P2 | optimizer.ts loadAllScores 同步 I/O | `optimizer.ts` | 性能隱患 | 簡單 |
| `FIX-24` | P2 | optimizer.ts refineDedupWithJudge 重複計算 keyword | `optimizer.ts` | 性能隱患 | 簡單 |
| `FIX-25` | P3 | executor.ts 與 isolation.ts ToolCallRecord 型別不一致 | `executor.ts` | 冗余代碼 | 簡單 |

---

## 4. Fix Dependency Analysis

### Dependency graph

```
FIX-03 (shared getProjectRoot) ──→ FIX-01, FIX-02, FIX-04, FIX-06, FIX-07, FIX-11, FIX-13 (all use getProjectRoot)

FIX-01 (isolation integration) ──→ FIX-25 (ToolCallRecord type consolidation)

FIX-02 (JSONL line numbers) ──→ FIX-07 (unscorable marking depends on line number support)

Batch 2 (P1 optimizer fixes: FIX-05, FIX-09, FIX-10, FIX-12) — 同一檔案 optimizer.ts，必須循序或合併至同一 worker

Batch 3 (P2 cleanup) — 大部分獨立，但 FIX-18 觸及 optimizer.ts，必須與 Batch 2 的 optimizer 修復協調
```

### File overlap detection

| 重疊組 | 問題 ID | 共享檔案 | 處理方式 |
|---|---|---|---|
| 重疊組 A | FIX-01, FIX-02, FIX-06, FIX-11, FIX-18, FIX-25 | `executor.ts` | 合併至同一 worker，循序修改 |
| 重疊組 B | FIX-02, FIX-04, FIX-07, FIX-13 | `scorer.ts` | 合併至同一 worker，循序修改 |
| 重疊組 C | FIX-02, FIX-07, FIX-22 | `reporter.ts` | 合併至同 worker（已在重疊組 B 範圍內） |
| 重疊組 D | FIX-05, FIX-09, FIX-10, FIX-12, FIX-15, FIX-18, FIX-23, FIX-24 | `optimizer.ts` | 合併至同一 worker，循序修改 |
| 重疊組 E | FIX-03, FIX-14, FIX-16, FIX-19 | `index.ts` | 合併至同一 worker，循序修改 |
| 重疊組 F | FIX-08, FIX-20 | `.github/workflows/eval.yml` | 合併至同一 worker |
| 無重疊 | FIX-17, FIX-21 | `lib/env-utils.ts` | 可獨立 |
| 無重疊 | FIX-01 (part), FIX-03 (new file) | `isolation.ts`, `lib/project-root.ts` | 可獨立（新建） |

---

## 5. Fix Details (with Regression Test Design)

### FIX-01: 整合 isolation.ts 工具模擬層至 executor pipeline (P0) — 複雜

| 欄位 | 內容 |
|---|---|
| **根因** | executor.ts 的 `executeSingleTest()` 僅做純文字對話呼叫（`callExecModel` 傳入 system+user messages），無 tool-use loop。isolation.ts 定義了完整的工具攔截機制但從未被 import。 |
| **涉及檔案** | `executor.ts` > `executeSingleTest()` (L224-348)、`isolation.ts` (L1-221) |
| **修復方式** | 1. 在 `executor.ts` import `createToolDispatcher`、`createFreshContext` from `./isolation.js`。2. 將 `executeSingleTest()` 改為支援多輪 tool-use loop：模型回傳 tool_call → dispatcher.dispatch() → mock result → 附加到 messages → 繼續呼叫模型，直到模型回傳純文字（無 tool_call）或達到最大輪數限制（如 20 輪）。3. 每輪 tool_call 記錄到 trace（新增 `tool_call` 和 `tool_result` event type）。4. 修正 isolation.ts 中 mock 回傳值，移除 "simulated" 字樣以滿足 R4.1 透明性要求——改為回傳合理且具資訊性的結果（如 Read 回傳檔案內容摘要、Write 回傳 "File written: {path} ({bytes} bytes)"）。 |
| **複雜度** | 複雜 — 需重構 executor 的執行循環 |

**Regression test design:**

| 欄位 | 內容 |
|---|---|
| **測試 ID** | `REGTEST-01` |
| **測試類型** | 整合測試 |
| **測試位置** | `packages/tools/eval/test/isolation-integration.test.ts` — 新檔案 |
| **測試場景** | GIVEN 一個會觸發 tool_call 的 mock exec model（回傳 `finish_reason: tool_calls`） WHEN 執行 `runSingleTest()` THEN trace.jsonl 應包含 `tool_call` 和 `tool_result` event，且 dispatcher 的 records 包含對應的攔截記錄 |
| **Oracle** | 修復前：trace 僅含 thinking/response/end events（無 tool_call events）。修復後：trace 包含完整 tool_call → tool_result 序列 |

---

### FIX-02: JSONL 行號引用 (P0) — 複雜

| 欄位 | 內容 |
|---|---|
| **根因** | `TraceEvent` 型別不含行號欄位；`readTrace()` 未在正常 event 記錄行號；`buildJudgePrompt()` 未指示 judge 引用行號；reporter 未展示行號。 |
| **涉及檔案** | `executor.ts` > `TraceEvent` type (L28-32), `appendTrace()`; `scorer.ts` > `readTrace()` (L112-138), `buildJudgePrompt()` (L181-283); `reporter.ts` > `generateReport()` |
| **修復方式** | 1. `TraceEvent` 增加可選 `_lineNumber?: number` 欄位。2. `readTrace()` 在解析每行時設置 `event._lineNumber = i + 1`。3. `buildJudgePrompt()` 的輸出格式指示 judge 在 issue.evidence 中包含 JSONL 行號（如 `"evidence": "L42: model called Write without checking target dir"`）。4. `generateReport()` 在 issue 摘要中展示行號。 |
| **複雜度** | 複雜 — 跨 3 個檔案，涉及型別變更和 prompt 調整 |

**Regression test design:**

| 欄位 | 內容 |
|---|---|
| **測試 ID** | `REGTEST-02` |
| **測試類型** | 單元測試 |
| **測試位置** | `packages/tools/eval/test/scorer.test.ts` — 附加到現有測試 |
| **測試場景** | GIVEN 一個含 5 行 JSONL 的 trace 檔案 WHEN 調用 `readTrace(tracePath)` THEN 每個 event 的 `_lineNumber` 欄位等於其在檔案中的行號 (1-5) |
| **Oracle** | 修復前：events 無 `_lineNumber`。修復後：events[0]._lineNumber === 1, events[4]._lineNumber === 5 |

---

### FIX-03: 抽取共用 getProjectRoot() (P1) — 簡單

| 欄位 | 內容 |
|---|---|
| **根因** | 相同邏輯在 `executor.ts`、`scorer.ts`、`reporter.ts`、`index.ts` 中各自實作，且 index.ts 版本層數錯誤（source=4/dist=5 vs 正確的 source=3/dist=4）。 |
| **涉及檔案** | 新建 `lib/project-root.ts`；修改 `executor.ts`、`scorer.ts`、`reporter.ts`、`index.ts`、`optimizer.ts`（optimizer 已從 scorer import，改為從新模組 import） |
| **修復方式** | 1. 建立 `packages/tools/eval/lib/project-root.ts`，導出 `getProjectRoot()`（使用 scorer.ts 的正確版本：source=3 層、dist=4 層、fallback cwd 爬行）。2. 所有模組改為 `import { getProjectRoot } from './lib/project-root.js'`。3. 刪除各模組中的私有 getProjectRoot 實作。4. `index.ts` 的 `resolveProjectRoot` 改為調用共用 `getProjectRoot()`，並保留 `context.sourceRoot` 優先邏輯。 |
| **複雜度** | 簡單 |

**Regression test design:**

| 欄位 | 內容 |
|---|---|
| **測試 ID** | `REGTEST-03` |
| **測試類型** | 單元測試 |
| **測試位置** | `packages/tools/eval/test/project-root.test.ts` — 新檔案 |
| **測試場景** | GIVEN 模擬的目錄結構（含 assets/spec/）WHEN 從不同深度目錄調用 `getProjectRoot()` THEN 總是返回正確的專案根目錄 |
| **Oracle** | 修復前：index.ts 版本在非根目錄執行時找錯路徑。修復後：所有模組使用同一函式，路徑正確 |

---

### FIX-04: scorer.ts scoreAllTests 預載入 questionMap (P1) — 簡單

| 欄位 | 內容 |
|---|---|
| **根因** | `scoreAllTests()` 不傳入 `questionMap` 給 `scoreSingleTest()`，導致每個測試重複讀取 `test-questions.json`。`watchMode()` 已正確實作預載入（scorer.ts:517-528），但 `scoreAllTests` 路徑遺漏。 |
| **涉及檔案** | `scorer.ts` > `scoreAllTests()` (L409-456) |
| **修復方式** | 在 `scoreAllTests()` 開頭加入與 `watchMode()` 相同的 questionMap 預載入邏輯：讀取 `test-questions.json` → 建立 `Record<string, Question>` map → 傳入 `scoreSingleTest()`。 |
| **複雜度** | 簡單 |

**Regression test design:**

| 欄位 | 內容 |
|---|---|
| **測試 ID** | `REGTEST-04` |
| **測試類型** | 單元測試 |
| **測試位置** | 附加到 `packages/tools/eval/test/scorer.test.ts` |
| **測試場景** | GIVEN mock 的 test-questions.json 和 3 個 .done marker WHEN 調用 `scoreAllTests()`（mock judge API）THEN `loadQuestions()` 只被調用 1 次（非 3 次） |
| **Oracle** | 修復前：loadQuestions 被調用 3 次。修復後：僅 1 次 |

---

### FIX-05: optimizer.ts refineDedupWithJudge O(n²) 優化 (P1) — 複雜

| 欄位 | 內容 |
|---|---|
| **根因** | `refineDedupWithJudge()` 對同一 category 內所有 issue 兩兩成對建構 pair，形成 n*(n-1)/2 個 pair。 |
| **涉及檔案** | `optimizer.ts` > `refineDedupWithJudge()` (L332-418) |
| **修復方式** | 1. 增加 severity 必須相同才比較的過濾（不同 severity 的 issue 不應合併）。2. 限制每個 category 的最大 pair 數量為 100（超過時只比較 Jaccard similarity 最高的 top-100 pairs）。3. 將 keyword set 預先計算並傳入（見 FIX-24），避免在 pair loop 內重複計算 `extractKeywords()`。 |
| **複雜度** | 複雜 — 需要正確的過濾邏輯 |

**Regression test design:**

| 欄位 | 內容 |
|---|---|
| **測試 ID** | `REGTEST-05` |
| **測試類型** | 單元測試 |
| **測試位置** | 附加到 `packages/tools/eval/test/optimizer.test.ts` |
| **測試場景** | GIVEN 30 個同 category 但不同 severity 的 DedupedIssueInternal WHEN 調用 `refineDedupWithJudge()` THEN pair 數量應顯著少於 435（30*29/2），因為不同 severity 被過濾 |
| **Oracle** | 修復前：產生 435 個 pairs。修復後：僅同 severity 的 issue 之間才產生 pairs |

---

### FIX-06: 磁碟空間檢查 (P1) — 簡單

| 欄位 | 內容 |
|---|---|
| **根因** | SPEC eval-core 錯誤案例明列「磁碟空間不足無法寫入軌跡：提前檢查可用空間」，但完全未實作。 |
| **涉及檔案** | `executor.ts` > `executeSingleTest()` 開始處 |
| **修復方式** | 在寫入 trace 前，使用 `fs.statfsSync`（Node 19+）或 fallback 到簡化檢查：檢查 results 目錄所在磁碟的可用空間，若小於可配置的最小值（預設 `EXEC_MIN_DISK_MB=100`），拋出明確錯誤訊息並中止。 |
| **複雜度** | 簡單 |

**Regression test design:**

| 欄位 | 內容 |
|---|---|
| **測試 ID** | `REGTEST-06` |
| **測試類型** | 單元測試 |
| **測試位置** | 附加到 `packages/tools/eval/test/executor.test.ts` |
| **測試場景** | GIVEN mock 的 `fs.statfsSync` 回傳可用空間 < 100MB WHEN 調用 `runSingleTest()` THEN 應拋出包含「磁碟空間不足」的錯誤 |
| **Oracle** | 修復前：不檢查空間直接寫入。修復後：空間不足時拋出明確錯誤 |

---

### FIX-07: JSONL 損壞時報告標記「無法評分」(P1) — 中等

| 欄位 | 內容 |
|---|---|
| **根因** | `readTrace()` 對損壞行記錄 parse_error 後繼續，但 reporter 無「無法評分」標記。 |
| **涉及檔案** | `scorer.ts` > `scoreSingleTest()`; `reporter.ts` > `generateReport()` |
| **修復方式** | 1. `readTrace()` 在遇到任何 parse_error 時設置標記（如 `hasCorruption: true`）。2. `scoreSingleTest()` 檢測到損壞時在 score.json 中記錄 `scorable: false` 和 `scoringNote: "無法評分：軌跡檔案損壞"`。3. `generateReport()` 在報告中區分「已評分」和「無法評分」的測試，後者顯示為獨立區塊並標註原因。 |
| **複雜度** | 中等 — 跨 2 檔案，新增狀態欄位 |

**Regression test design:**

| 欄位 | 內容 |
|---|---|
| **測試 ID** | `REGTEST-07` |
| **測試類型** | 整合測試 |
| **測試位置** | 附加到 `packages/tools/eval/test/scorer.test.ts` |
| **測試場景** | GIVEN 一個含損壞行的 trace.jsonl（第 3 行為非法 JSON）WHEN 調用 `scoreSingleTest()` THEN score.json 應包含 `scorable: false` 和 non-empty `scoringNote` |
| **Oracle** | 修復前：損壞 trace 仍可能產出正常 score.json。修復後：明確標記為無法評分 |

---

### FIX-08: CI 分數門檻可配置 (P1) — 簡單

| 欄位 | 內容 |
|---|---|
| **根因** | `eval.yml` 無 threshold 設定，`continue-on-error: true` 使評測永遠不阻塞 PR。 |
| **涉及檔案** | `.github/workflows/eval.yml` |
| **修復方式** | 1. 新增 workflow `inputs` 或環境變數 `EVAL_MIN_SCORE`（預設 60）和 `EVAL_MAX_P0`（預設 0）。2. 評測步驟後增加門檻檢查 step：解析 report 中的 overallScore 和 P0 count，低於門檻或超過 P0 上限時 `exit 1`。3. 移除 `continue-on-error: true`，改為條件性失敗。 |
| **複雜度** | 簡單 |

**Regression test design:**

| 欄位 | 內容 |
|---|---|
| **測試 ID** | `REGTEST-08` |
| **測試類型** | 手動驗證 (CI workflow 無法自動化單元測試) |
| **測試位置** | `.github/workflows/eval.yml` |
| **測試場景** | 建立測試 PR 修改 skills/ 下檔案，模擬低分場景，確認 CI 回報失敗 |
| **Oracle** | 總分低於 EVAL_MIN_SCORE 或 P0 > EVAL_MAX_P0 時 CI fail |

---

### FIX-09: ALLOWED_FILES 白名單強制 (P1) — 簡單

| 欄位 | 內容 |
|---|---|
| **根因** | `ALLOWED_FILES` 常數定義於 optimizer.ts L113-118 但零引用。 |
| **涉及檔案** | `optimizer.ts` > `optimizeSkillMd()`, `applySkillChanges()` |
| **修復方式** | 1. 建立 helper `isAllowedFile(filePath: string, skillName: string): boolean`，檢查給定路徑是否在 ALLOWED_FILES 白名單內。2. 在 `optimizeSkillMd()` 中，優化前驗證 `skillMdPath` 是否在白名單內。3. 在 `applySkillChanges()` 處理 FIND/REPLACE 時，檢查 target 路徑是否在允許範圍內。4. 白名單展開：將 `<name>` 替換為實際 skillName 進行比對。 |
| **複雜度** | 簡單 |

**Regression test design:**

| 欄位 | 內容 |
|---|---|
| **測試 ID** | `REGTEST-09` |
| **測試類型** | 單元測試 |
| **測試位置** | 附加到 `packages/tools/eval/test/optimizer.test.ts` |
| **測試場景** | GIVEN skill name "spec" WHEN 調用 `isAllowedFile()` 分別傳入 `skills/spec/SKILL.md`、`/etc/passwd`、`skills/spec/scripts/helper.sh` THEN 僅白名單內路徑回傳 true |
| **Oracle** | 修復前：無白名單檢查函式。修復後：正確識別允許/禁止路徑 |

---

### FIX-10: 優化後 Markdown 結構驗證 (P1) — 簡單

| 欄位 | 內容 |
|---|---|
| **根因** | `optimizeSkillMd()` 僅驗證 YAML frontmatter，不檢查 Markdown 結構完整性。 |
| **涉及檔案** | `optimizer.ts` > `optimizeSkillMd()` (L1100-1117) |
| **修復方式** | 在 frontmatter 驗證通過後，增加基本 Markdown 結構檢查：1. 確認 `## ` 章節標題存在。2. 確認檔案不以 truncated 內容結尾（最後一個區段有實質內容）。3. 確認沒有明顯的格式破壞（如未閉合的 code block ```）。若檢查失敗，同樣觸發備份復原。 |
| **複雜度** | 簡單 |

**Regression test design:**

| 欄位 | 內容 |
|---|---|
| **測試 ID** | `REGTEST-10` |
| **測試類型** | 單元測試 |
| **測試位置** | 附加到 `packages/tools/eval/test/optimizer.test.ts` |
| **測試場景** | GIVEN 優化後的 SKILL.md 內容缺少所有 `## ` 章節標題 WHEN 執行 validateMarkdownStructure() THEN 回傳 false |
| **Oracle** | 修復前：不檢查 Markdown 結構。修復後：結構損壞時驗證失敗並觸發復原 |

---

### FIX-11: 執行階段並發鎖 (P1) — 簡單

| 欄位 | 內容 |
|---|---|
| **根因** | executor 無鎖機制，兩個 eval 進程可同時執行並覆蓋彼此 trace。 |
| **涉及檔案** | `executor.ts` > `runAllTests()`, `executeSingleTest()` |
| **修復方式** | 在 `runAllTests()` 開始時，使用與 scorer 相同的 mkdir mutex 模式：嘗試 `mkdir results/spec/{date}/.exec-lock`，失敗則表示已有評測在執行，拋出錯誤並 exit。執行完成後 (finally) 刪除鎖目錄。 |
| **複雜度** | 簡單 |

**Regression test design:**

| 欄位 | 內容 |
|---|---|
| **測試 ID** | `REGTEST-11` |
| **測試類型** | 單元測試 |
| **測試位置** | 附加到 `packages/tools/eval/test/executor.test.ts` |
| **測試場景** | GIVEN `.exec-lock` 目錄已存在 WHEN 調用 `runAllTests()` THEN 應立即拋出錯誤（不等待 timeout） |
| **Oracle** | 修復前：兩個進程同時執行。修復後：第二個進程被鎖阻擋 |

---

### FIX-12: 優化 diff 衝突保留雙方版本 (P1) — 簡單

| 欄位 | 內容 |
|---|---|
| **根因** | `applySkillChanges()` 在 FIND pattern 不匹配時靜默回傳原始內容，無衝突標記。 |
| **涉及檔案** | `optimizer.ts` > `applySkillChanges()` (L857-903) |
| **修復方式** | 1. 追蹤每個 FIND/REPLACE 的匹配狀態。2. 若任何 FIND pattern 無法匹配，不靜默回退——改為在 patch 檔案中標記「CONFLICT: pattern not found」，並寫出衝突的雙方內容（原始區段 + 建議替換）。3. 回傳值改為 `{ content: string, conflicts: Array<{find: string, replace: string}> }`，讓呼叫方得知有未解決衝突。 |
| **複雜度** | 簡單 |

**Regression test design:**

| 欄位 | 內容 |
|---|---|
| **測試 ID** | `REGTEST-12` |
| **測試類型** | 單元測試 |
| **測試位置** | 附加到 `packages/tools/eval/test/optimizer.test.ts` |
| **測試場景** | GIVEN 一個包含不存在 FIND pattern 的 judge output WHEN 調用 `applySkillChanges()` THEN 回傳的 conflicts 陣列非空，且原始內容未被修改 |
| **Oracle** | 修復前：靜默回傳原內容。修復後：明確回報衝突 |

---

### FIX-13: scorer.ts 同步 I/O 轉非同步 (P1) — 中等

| 欄位 | 內容 |
|---|---|
| **根因** | `readTrace()` 使用 `readFileSync`；`scoreSingleTest()` 使用 `writeFileSync`、`mkdirSync`、`rmSync`。 |
| **涉及檔案** | `scorer.ts` > `readTrace()`, `scoreSingleTest()` |
| **修復方式** | 1. `readTrace()` 改用 `fs/promises.readFile`。2. `scoreSingleTest()` 的檔案寫入改用 `fs/promises.writeFile`、`fs/promises.mkdir`、`fs/promises.rm`。3. `scanForDone()` 和 `isAlreadyScored()` 仍需同步（目錄掃描），保持 `readdirSync` + `existsSync`。 |
| **複雜度** | 中等 |

**Regression test design:**

| 欄位 | 內容 |
|---|---|
| **測試 ID** | `REGTEST-13` |
| **測試類型** | 整合測試 |
| **測試位置** | 附加到 `packages/tools/eval/test/scorer.test.ts` |
| **測試場景** | GIVEN 3 個待評分測試 WHEN 以並發度 3 調用 `scoreAllTests()` THEN 所有操作在 promisePool 內完成，無同步 I/O 阻斷 |
| **Oracle** | 修復前後功能性結果一致，但修復後不再使用 sync I/O 函式 |

---

### FIX-14–FIX-25: P2/P3 修復摘要

以下 P2/P3 修復皆為簡單的單行或少量修改：

| Issue ID | 修復方式 | 涉及檔案 |
|---|---|---|
| FIX-14 | help text L197: `--optimise` → `--optimize`（兩處） | `index.ts` |
| FIX-15 | L205: `"Run run-evals.mjs and score.mjs first."` → `"Run 'apltk eval <skill>' first to generate scores."`; 同樣修復 question-loader.ts L60 | `optimizer.ts`, `question-loader.ts` |
| FIX-16 | L60: 移除 `--questions` flag 建議，改為「請確認題庫檔案存在於 assets/spec/{date}/test-questions.json」 | `question-loader.ts` |
| FIX-17 | L225: 修正 selfTest 的 `.env.example` 路徑為專案根目錄相對路徑 | `lib/env-utils.ts` |
| FIX-18 | 移除 `question-loader.ts` L19 的 `ScoringCriteria` import；移除 `optimizer.ts` `applySkillChanges()` 的 `_hasFrontmatter`、`_frontmatterEnd` 參數及 `generateSkillTemplateChanges()` 的 `_currentContent` 參數；移除 `executor.ts` L40-44 的 `ToolCallRecord` 型別（改為從 isolation.ts re-export 或統一置於 isolation.ts） | `question-loader.ts`, `optimizer.ts`, `executor.ts` |
| FIX-19 | index.ts L370: exit code 邏輯加入評分結果檢查 — 計算 `avgScore`，若低於可配置閾值（預設 60）則 exit 1 | `index.ts` |
| FIX-20 | eval.yml: 在評測步驟前增加 check step：若 secrets 未設定則 echo warning 並 exit 0（skip） | `.github/workflows/eval.yml` |
| FIX-21 | `loadEnv()` 或 `evalHandler()` 中增加檢查：若 `EXEC_MODEL === JUDGE_MODEL && EXEC_BASE_URL === JUDGE_BASE_URL` 則輸出警告 | `lib/env-utils.ts` |
| FIX-22 | reporter.ts `generateReport()` 預先建立 `Map<string, string[]> issueToTests` 反向索引，將巢狀 some/filter 改為 O(1) 查詢 | `reporter.ts` |
| FIX-23 | `loadAllScores()` 改用 `fs/promises.readdir` + `Promise.all(files.map(f => fs.promises.readFile(...)))` | `optimizer.ts` |
| FIX-24 | `refineDedupWithJudge()` 內 loop 不再重新調用 `extractKeywords()`，改為從 `RawIssueWithKeywords._descKeywords` / `_evidKeywords` 讀取快取 | `optimizer.ts` |
| FIX-25 | 刪除 `executor.ts` 的 `ToolCallRecord` 型別；`isolation.ts` 的 `ToolCallRecord` 保留為唯一定義 | `executor.ts` |

**Regression tests for P2 fixes (REGTEST-14, REGTEST-15):**

| 測試 ID | 關聯修復 | 測試類型 | 測試場景 |
|---|---|---|---|
| `REGTEST-14` | FIX-19 | 單元 | GIVEN 所有 test 執行成功但 overallScore 平均 < 60 WHEN evalHandler 返回 THEN exit code === 1 |
| `REGTEST-15` | FIX-22 | 單元 | GIVEN 100 個 scores 各含 10 個 issues WHEN `generateReport()` 產出報告 THEN 執行時間 < 1 秒（不含外部 API call） |

---

## 6. Worker Prompt Library

### Fix Worker Prompts

#### WORKER-A: executor.ts 全套修復 (FIX-01, FIX-02-part, FIX-03-part, FIX-06, FIX-11, FIX-18-part, FIX-25)

```
## Mission
修復 executor.ts 的所有問題：整合 isolation.ts 工具模擬層、加入 JSONL 行號支援、改用共用 getProjectRoot()、增加磁碟空間檢查、增加執行階段並發鎖、清理冗余型別。

## Context
- 來自審查維度: 實作偏移、實作遺漏、架構瑕疵、冗余代碼
- 原始 spec 需求: R4.1-R4.4 (工具模擬與上下文隔離), R3.3 (JSONL 行號), 錯誤案例 (磁碟空間、並發鎖)

## Input
- 閱讀 `packages/tools/eval/executor.ts` (完整)
- 閱讀 `packages/tools/eval/isolation.ts` (完整)
- 閱讀 `packages/tools/eval/lib/project-root.ts` (FIX-03 worker 會先建立此檔案)

## What to do
1. **整合 isolation.ts (FIX-01)**: 
   - import `createToolDispatcher`, `createFreshContext` from `./isolation.js`
   - 重構 `executeSingleTest()` 為多輪 tool-use loop:
     a. 呼叫 exec model → 取得 response
     b. 若 response.choices[0].finish_reason === 'tool_calls' → 解析 tool_calls
     c. 對每個 tool_call 調用 `dispatcher.dispatch(toolCall)` → 取得 mock result
     d. 記錄 `tool_call` 和 `tool_result` events 到 trace
     e. 將 tool_call + tool_result 附加到 messages array
     f. 繼續呼叫 exec model (回到 a)，最多 20 輪
     g. 若 finish_reason === 'stop' → 記錄最終 response 並結束
   - 在 `runSingleTest()` 的 retry 邏輯外層建立 dispatcher（每個 test 一個獨立的 dispatcher）

2. **修正 isolation.ts mock 回傳值 (FIX-01 附帶)**:
   - READ_RESPONSE 改為 `"File read: {path}"` 形式（從 toolCall.params 動態生成）
   - WRITE_RESPONSE 改為 `"File written: {path} ({bytes} bytes)"` 類似格式
   - 移除 "simulated" 字樣以滿足 R4.1 透明性

3. **加入 JSONL 行號 (FIX-02 executor 部分)**:
   - `TraceEvent` type 增加 `_lineNumber?: number` 欄位
   - 不需要在 executor 設置（scorer 的 readTrace 會設置），executor 只需更新型別

4. **改用共用 getProjectRoot (FIX-03 executor 部分)**:
   - 移除 executor.ts 中的私有 `getProjectRoot()` 函式
   - 改為 `import { getProjectRoot } from './lib/project-root.js'`

5. **磁碟空間檢查 (FIX-06)**:
   - 在 `runAllTests()` 開始處增加 `checkDiskSpace(resultsDir)` 
   - 實作 checkDiskSpace: 使用 `fs.statfsSync` 或 fallback，檢查可用空間 >= 100MB
   - 空間不足時拋出明確錯誤: "Eval aborted: insufficient disk space (< 100MB available)"

6. **執行階段並發鎖 (FIX-11)**:
   - 在 `runAllTests()` 開始處嘗試 `mkdir {resultsBase}/.exec-lock`
   - 失敗代表已有評測進程在執行 → 拋錯 "Another eval is already in progress"
   - 在 finally 區塊刪除 `.exec-lock` 目錄

7. **清理冗余 (FIX-18 executor 部分 + FIX-25)**:
   - 刪除 `ToolCallRecord` interface (L40-44)，從 isolation.ts import（若需要）
   - 確保所有 import 都被使用

## Scope
- 允許修改的檔案:
  - `packages/tools/eval/executor.ts` — 主要修改
  - `packages/tools/eval/isolation.ts` — 修正 mock 回傳值
- 禁止修改的檔案: 所有其他檔案（scorer.ts, optimizer.ts 等由其他 worker 負責）

## Output
完成後必須回報：
- 修改了哪些檔案的哪些函式
- executor.ts 的新執行循環結構說明
- 遇到的任何阻礙或風險

## Verify
- 執行: `npx tsc --noEmit -p packages/tools/eval/tsconfig.json`
- 預期: TypeScript 編譯無錯誤

## Boundaries
- 不要修改 lib/ 下的檔案（除非是 isolation.ts）
- 不要修改 scorer.ts, reporter.ts, optimizer.ts
- tool-use loop 最大輪數設為 20（防止無限循環）
- 保留現有 error handling (timeout, retry) 邏輯
- 若 isolation.ts mock 回傳值格式變更影響其他模組，記錄但不要修改其他模組
```

---

#### WORKER-B: scorer.ts + reporter.ts 全套修復 (FIX-02-part, FIX-03-part, FIX-04, FIX-07, FIX-13, FIX-22)

```
## Mission
修復 scorer.ts 和 reporter.ts 的所有問題：JSONL 行號支援、改用共用 getProjectRoot()、questionMap 預載入、無法評分標記、同步 I/O 轉非同步、reporter O(n³) 優化。

## Context
- 來自審查維度: 實作遺漏、性能隱患、冗余代碼
- 原始 spec 需求: R3.3 (JSONL 行號), R3.5 (不重複評分), 錯誤案例 (JSONL 損壞)

## Input
- 閱讀 `packages/tools/eval/scorer.ts` (完整)
- 閱讀 `packages/tools/eval/reporter.ts` (完整)
- 閱讀 `packages/tools/eval/lib/project-root.ts` (FIX-03 worker 會先建立)

## What to do

### scorer.ts:

1. **JSONL 行號支援 (FIX-02 scorer 部分)**:
   - `readTrace()` 在解析每行時設置 `event._lineNumber = i + 1`（i 從 0 開始，行號從 1 開始）
   - `buildJudgePrompt()` 輸出格式指示更新：在 issue.evidence 範例中加入 `"L{N}: {description}"` 格式要求
   - judge prompt 中加入一行指示: "Each issue's evidence MUST reference the JSONL line number(s) using the format 'L42: ...'"

2. **改用共用 getProjectRoot (FIX-03 scorer 部分)**:
   - 移除 `getProjectRoot()` 函式和相關 import (fileURLToPath, dirname)
   - 改為 `import { getProjectRoot } from './lib/project-root.js'`
   - reporter.ts 同樣修改

3. **questionMap 預載入 (FIX-04)**:
   - 在 `scoreAllTests()` 開頭（在 promisePool 之前）加入:
     ```
     const questionsPath = resolve(rootDir, 'assets', 'spec', date, 'test-questions.json');
     const questions = loadQuestions(questionsPath);
     const questionMap: Record<string, Question> = {};
     for (const q of questions) { questionMap[q.id] = q; }
     ```
   - 將 questionMap 傳入每個 `scoreSingleTest()` 呼叫

4. **無法評分標記 (FIX-07)**:
   - `readTrace()` 回傳值增加 `hasCorruption` 屬性：若有任何 parse_error event 則為 true
   - 修改 `readTrace()` 回傳型別為 `{ events: TraceEvent[], hasCorruption: boolean }`
   - `scoreSingleTest()` 在 trace 有損壞時，score.json 中加入 `scorable: false` 和 `scoringNote`
   - reporter.ts `generateReport()` 在報告末尾增加「無法評分」區塊，列出 scorable=false 的測試

5. **同步 I/O 轉非同步 (FIX-13)**:
   - `readTrace()`: `readFileSync` → `await readFile` (from fs/promises)
   - `scoreSingleTest()` 中的 `mkdirSync`、`writeFileSync`、`rmSync` → 改用 `fs/promises` 版本
   - 更新函式簽名確認 async/await 鏈正確

### reporter.ts:

6. **O(n³) 優化 (FIX-22)**:
   - 在 `generateReport()` 開頭建立反向索引: `Map<string, string[]>` (issueKey → testIds)
   - 每個 issue 的 issueKey = `${severity}:${category}:${description.substring(0, 80)}`
   - 將 L269-274 的巢狀 some/filter 改為從 map 直接查詢 O(1)
   - 同樣優化 common pattern analysis 區段

## Scope
- 允許修改的檔案:
  - `packages/tools/eval/scorer.ts`
  - `packages/tools/eval/reporter.ts`
- 禁止修改的檔案: executor.ts, optimizer.ts, index.ts

## Output
完成後必須回報：
- 每個修復項目的變更摘要
- 型別變更（如 readTrace 回傳型別變更）對其他模組的影響
- TypeScript 編譯結果

## Verify
- 執行: `npx tsc --noEmit -p packages/tools/eval/tsconfig.json`
- 預期: 無編譯錯誤

## Boundaries
- 若型別變更（如 readTrace 回傳型別）影響其他模組（optimizer.ts），記錄影響但不修改其他模組
- 保留現有評分邏輯和 fallback 行為
- 不要修改 judge-api.ts 或 env-utils.ts
```

---

#### WORKER-C: optimizer.ts 全套修復 (FIX-05, FIX-09, FIX-10, FIX-12, FIX-15-part, FIX-18-part, FIX-23, FIX-24)

```
## Mission
修復 optimizer.ts 的所有問題：O(n²) pairwise API 優化、ALLOWED_FILES 強制、Markdown 結構驗證、衝突保留、廢棄腳本引用修正、冗余參數清理、非同步 I/O、keyword 快取。

## Context
- 來自審查維度: 性能隱患、實作遺漏、架構瑕疵、幻覺代碼、冗余代碼
- 原始 spec 需求: R1.1-R1.5 (優化 diff 生成)

## Input
- 閱讀 `packages/tools/eval/optimizer.ts` (完整)
- 閱讀 `packages/tools/eval/lib/project-root.ts` (FIX-03 worker 會先建立)

## What to do

1. **O(n²) pairwise 優化 (FIX-05)**:
   - 在 `refineDedupWithJudge()` 中增加 severity 過濾：僅同 severity 的 issue 才產生 pair
   - 限制每個 category 最大 pair 數為 100（若超過，取 Jaccard similarity 最高的 top-100）
   - 使用 FIX-24 的 keyword 快取

2. **ALLOWED_FILES 強制 (FIX-09)**:
   - 建立 export function `isAllowedFile(filePath: string, skillName: string): boolean`
   - 將 ALLOWED_FILES 中的 `<name>` 替換為傳入的 skillName
   - 在 `optimizeSkillMd()` 開頭驗證 skillMdPath 是否在允許範圍

3. **Markdown 結構驗證 (FIX-10)**:
   - 建立 `validateMarkdownStructure(content: string): { valid: boolean; issues: string[] }`
   - 檢查: (a) 至少有一個 `## ` 標題 (b) 無未閉合 ``` 區塊 (c) 檔案非空
   - 在 `optimizeSkillMd()` 的 frontmatter 驗證後調用，失敗時復原備份

4. **衝突保留 (FIX-12)**:
   - 修改 `applySkillChanges()` 回傳型別為 `{ content: string; conflicts: Array<{find: string; replace: string}> }`
   - 追蹤每個 FIND pattern 的匹配狀態，未匹配的記錄到 conflicts
   - 呼叫方 `optimizeSkillMd()` 在 conflicts 非空時記錄警告

5. **廢棄腳本引用 (FIX-15 optimizer 部分)**:
   - L205: `"Skipping score loading. Run run-evals.mjs and score.mjs first."` → `"Skipping score loading. Run 'apltk eval <skill>' to generate scores first."`

6. **冗余參數清理 (FIX-18 optimizer 部分)**:
   - `applySkillChanges()`: 移除 `_hasFrontmatter: boolean` 和 `_frontmatterEnd: number` 參數
   - `generateSkillTemplateChanges()`: 移除 `_currentContent: string` 參數
   - 更新所有內部呼叫點

7. **非同步 I/O (FIX-23)**:
   - `loadAllScores()`: `readdirSync` → `await readdir`; `readFileSync` → `await readFile`
   - 使用 `Promise.all` 並行讀取所有 score.json
   - 更新函式簽名為 async

8. **Keyword 快取 (FIX-24)**:
   - 在 `refineDedupWithJudge()` 內部 loop 中，不再調用 `extractKeywords(a.description)`
   - 改為從 `a._descKeywords` (RawIssueWithKeywords) 讀取已計算的 keyword set
   - 確保 `deduplicateIssues()` phase 1 中 keyword set 已正確附加到 internal types

## Scope
- 允許修改的檔案: `packages/tools/eval/optimizer.ts`
- 禁止修改的檔案: 所有其他檔案

## Output
完成後必須回報：
- 每個修復項目的變更摘要
- 型別/簽名變更（applySkillChanges 回傳型別、loadAllScores async）對其他模組的影響
- TypeScript 編譯結果

## Verify
- 執行: `npx tsc --noEmit -p packages/tools/eval/tsconfig.json`
- 預期: 無編譯錯誤

## Boundaries
- 若型別/簽名變更影響 index.ts，記錄但不修改 index.ts
- 保留現有 NLP 演算法（stemming, Jaccard）不變
- 不要修改 judge-api.ts 或 env-utils.ts
```

---

#### WORKER-D: index.ts 全套修復 (FIX-03-part, FIX-14, FIX-16, FIX-19)

```
## Mission
修復 index.ts 的所有問題：改用共用 getProjectRoot()、修正 help 拼寫、修正 exit code 邏輯。

## Context
- 來自審查維度: 幻覺代碼、實作偏移、冗余代碼
- 原始 spec 需求: R2.1 (CLI 命令格式), R2.4 (exit code)

## Input
- 閱讀 `packages/tools/eval/index.ts` (完整)
- 閱讀 `packages/tools/eval/lib/project-root.ts` (FIX-03 worker 會先建立)

## What to do

1. **改用共用 getProjectRoot (FIX-03 index 部分)**:
   - `resolveProjectRoot()` 改為調用共用 `getProjectRoot()`
   - 保留 `context.sourceRoot` 優先邏輯：`if (context.sourceRoot) return context.sourceRoot; return getProjectRoot();`

2. **修正 help 拼寫 (FIX-14)**:
   - L197: `--optimise` → `--optimize`（兩處：第 3 和第 4 個 example）

3. **修正 exit code (FIX-19)**:
   - L370: 除了檢查 `failed > 0`，增加評分結果檢查：
     - 計算 `avgScore = scores.reduce((sum, s) => sum + s.overallScore, 0) / scores.length`
     - 若 `scores.length > 0 && avgScore < 60` → exit 1
     - 錯誤訊息: "Eval failed: average score {avgScore} below threshold (60)"

## Scope
- 允許修改的檔案: `packages/tools/eval/index.ts`
- 禁止修改的檔案: 所有其他檔案

## Output
完成後必須回報：
- 每個修復的具體行號變更
- TypeScript 編譯結果

## Verify
- 執行: `npx tsc --noEmit -p packages/tools/eval/tsconfig.json`
- 預期: 無編譯錯誤

## Boundaries
- 不修改 CLI flag 解析邏輯（parseArgs）
- 不修改 eval pipeline 流程結構
```

---

#### WORKER-E: lib/ + question-loader 修復 (FIX-17, FIX-21, FIX-15-part, FIX-18-part)

```
## Mission
修復 lib/ 和 question-loader 的問題：env-utils selfTest 路徑、相同模型檢查、question-loader 錯誤訊息修正、冗余 import 清理。

## Context
- 來自審查維度: 幻覺代碼、實作遺漏、冗余代碼

## Input
- 閱讀 `packages/tools/eval/lib/env-utils.ts` (完整)
- 閱讀 `packages/tools/eval/question-loader.ts` (完整)

## What to do

1. **env-utils.ts selfTest 路徑 (FIX-17)**:
   - L225: 修正 `.env.example` 路徑，從 `lib/` 往上一層到 `packages/tools/eval/` 再往四層到專案根目錄
   - 改用 `getProjectRoot()` (import from lib/project-root.js)

2. **相同模型檢查 (FIX-21)**:
   - 在 `loadEnv()` 函式中增加檢查
   - 若 `EXEC_MODEL === JUDGE_MODEL && EXEC_BASE_URL === JUDGE_BASE_URL`：
     - `console.warn('Warning: EXEC_MODEL and JUDGE_MODEL are the same. Context isolation may be compromised.')`
   - 不阻止執行，僅輸出警告

3. **question-loader.ts 錯誤訊息 (FIX-15 question-loader 部分)**:
   - L60: 移除 `--questions` flag 建議
   - 改為: `請確認題庫檔案存在於 assets/spec/{date}/test-questions.json，或使用 'apltk eval <skill>' 自動載入`

4. **question-loader.ts 錯誤訊息 (FIX-16)**:
   - L57-62: 改進檔案不存在時的錯誤訊息，明確說明「需先建立題庫」

5. **冗余 import (FIX-18 question-loader 部分)**:
   - L19: 移除未使用的 `ScoringCriteria` import

## Scope
- 允許修改的檔案:
  - `packages/tools/eval/lib/env-utils.ts`
  - `packages/tools/eval/question-loader.ts`
- 禁止修改的檔案: 所有其他檔案

## Output
完成後必須回報：
- 每個修復的具體變更
- TypeScript 編譯結果

## Verify
- 執行: `npx tsc --noEmit -p packages/tools/eval/tsconfig.json`
- 預期: 無編譯錯誤

## Boundaries
- 不修改 judge-api.ts
- 不修改 promise-pool.ts
- 保留 selfTest 的行為語義
```

---

#### WORKER-F: CI workflow 修復 (FIX-08, FIX-20) + 新建 lib/project-root.ts (FIX-03 基礎)

```
## Mission
1. 建立共用的 `lib/project-root.ts`（所有其他 worker 的基礎依賴）
2. 修復 CI workflow: 可配置分數門檻、缺少 .env 時的顯式警告

## Context
- FIX-03: 從 scorer.ts 提取正確的 getProjectRoot() 邏輯（source=3 層、dist=4 層、fallback cwd 爬行）
- FIX-08: CI 目前 `continue-on-error: true` 使評測永遠不阻塞 PR
- FIX-20: CI 缺少 secrets 時無警告

## Input
- 閱讀 `packages/tools/eval/scorer.ts` L70-98 (getProjectRoot 實作)
- 閱讀 `.github/workflows/eval.yml`

## What to do

### Part A: 建立 lib/project-root.ts

建立 `packages/tools/eval/lib/project-root.ts`:
- 從 scorer.ts L70-98 複製正確版本的 `getProjectRoot()`
- 保持 source=3 層 (packages/tools/eval/lib/ → root)、dist=5 層 (packages/tools/eval/dist/lib/ → root)
- 從 lib/ 目錄角度看: source 路徑 `..` `..` `..` `..` (eval→tools→packages→root)，dist 路徑 `..` `..` `..` `..` `..` (lib→dist→eval→tools→packages→root)
- 計算: lib/ 位於 `packages/tools/eval/lib/`，往上 3 層到 packages/ 的上層 → 4 層到 root
- Wait, 重新計算: `packages/tools/eval/lib/project-root.ts` → 
  - source: resolve(__dirname, '..', '..', '..', '..') = eval→tools→packages→root = 4 levels ✓
  - dist: packages/tools/eval/dist/lib/project-root.js → resolve(__dirname, '..', '..', '..', '..', '..') = lib→dist→eval→tools→packages→root = 5 levels ✓
- export function getProjectRoot(): string
- 包含 self-test: `if (process.argv[1]?.endsWith('project-root.js')) { ... }`

### Part B: 修復 CI workflow

修改 `.github/workflows/eval.yml`:
1. 新增 `env.EVAL_MIN_SCORE` (預設 60) 和 `env.EVAL_MAX_P0` (預設 0)
2. 評測步驟移除 `continue-on-error: true`
3. 新增 "Check eval results" step:
   - 解析 report 或 exit code 判斷通過/失敗
   - 若 failed → `exit 1`
4. 新增 "Check secrets" step (在評測之前):
   - 檢查 `EXEC_API_KEY` 和 `JUDGE_API_KEY` secrets 是否設定
   - 若未設定 → echo "::warning::Eval secrets not configured, skipping eval" → `exit 0`

## Scope
- 允許修改的檔案:
  - `packages/tools/eval/lib/project-root.ts` — 新建
  - `.github/workflows/eval.yml` — 修改
- 禁止修改的檔案: 所有其他檔案

## Output
完成後必須回報：
- project-root.ts 的完整內容和路徑計算驗證
- CI workflow 的變更摘要

## Verify
- 執行: `npx tsc --noEmit -p packages/tools/eval/tsconfig.json`
- 預期: project-root.ts 無編譯錯誤
- CI workflow: 無語法錯誤（YAML 有效）

## Boundaries
- project-root.ts 必須與 scorer.ts 原始邏輯行為完全一致
- CI workflow 不應變更 node version 或其他非相關設定
```

---

### Regression Test Worker Prompts

#### REGTEST-01–REGTEST-15: 回歸測試實現

```
## Mission
為 skill-eval-optimizer 專案的所有 P0/P1 修復建立回歸測試。共 15 個測試（REGTEST-01 至 REGTEST-15），覆蓋 isolation 整合、JSONL 行號、getProjectRoot 共用、questionMap 預載入、O(n²) 優化、磁碟檢查、無法評分標記、ALLOWED_FILES、Markdown 驗證、執行鎖、衝突保留、exit code、reporter 優化。

## Context
所有修復已在其他 worker 中完成。你的任務是建立回歸測試確保這些修復有效且不會回歸。
每個測試的設計規格詳見 Section 5（Fix Details）中的 Regression test design 表格。

## Input
- 閱讀修復後的原始碼（executor.ts, scorer.ts, reporter.ts, optimizer.ts, index.ts, isolation.ts, lib/）
- 閱讀現有測試檔案作為格式參考（若存在 `packages/tools/eval/test/` 目錄）

## What to do

在 `packages/tools/eval/test/` 目錄下建立以下測試：

### 新建測試檔案:

**`packages/tools/eval/test/isolation-integration.test.ts`** (REGTEST-01):
- Mock `callExecModel` 回傳 tool_calls
- 驗證 trace.jsonl 包含 `tool_call` 和 `tool_result` events
- 驗證 dispatcher records 非空

**`packages/tools/eval/test/project-root.test.ts`** (REGTEST-03):
- 使用 tmp dir 建立模擬專案結構（含 assets/spec/）
- 從不同深度調用 getProjectRoot()，驗證回傳正確根目錄

### 附加到現有測試（若 test/ 目錄不存在則全部新建）:

**scorer 測試** (REGTEST-02, REGTEST-04, REGTEST-07, REGTEST-13):
- REGTEST-02: 驗證 readTrace 回傳的 events 有 _lineNumber
- REGTEST-04: 驗證 scoreAllTests 中 loadQuestions 只被調用一次
- REGTEST-07: 損壞 JSONL → score.json 有 scorable: false
- REGTEST-13: 驗證並發評分無同步 I/O 阻斷

**optimizer 測試** (REGTEST-05, REGTEST-09, REGTEST-10, REGTEST-12):
- REGTEST-05: 30 個不同 severity issue → pair 數量少於 435
- REGTEST-09: isAllowedFile 白名單驗證
- REGTEST-10: validateMarkdownStructure 損壞檢測
- REGTEST-12: applySkillChanges 衝突回報

**executor 測試** (REGTEST-06, REGTEST-11):
- REGTEST-06: 磁碟空間不足拋錯
- REGTEST-11: .exec-lock 存在時拋錯

**index 測試** (REGTEST-14):
- REGTEST-14: 低分時 exit code === 1

**reporter 測試** (REGTEST-15):
- REGTEST-15: 100 scores × 10 issues 報告生成 < 1 秒

所有測試使用 `node:test` + `node:assert/strict`，遵循現有測試慣例。
使用 `fs.mkdtempSync()` 隔離檔案系統操作。
外部 API 呼叫全部 mock。

## Scope
- 允許修改/建立的檔案: `packages/tools/eval/test/` 下的所有 .test.ts 檔案
- 禁止修改的檔案: 所有 `packages/tools/eval/*.ts` 原始碼（修復已完成）

## Output
完成後必須回報：
- 建立了哪些測試檔案和測試函式
- 每個測試的執行結果（通過/失敗）
- 若有測試失敗，說明原因（可能是修復不完整）

## Verify
- 執行: `node --test packages/tools/eval/test/`
- 預期: 所有新增回歸測試通過

## Boundaries
- 測試必須能獨立執行，不依賴外部狀態
- 遵循現有測試格式和命名慣例（若無現有測試則使用 describe/it 模式）
- 不修改任何原始碼檔案
```

---

## 7. Fix Batch Schedule

### Batch 0 — 基礎設施 (FIX-03 基礎)

- **Tasks**: WORKER-F Part A (建立 `lib/project-root.ts`)
- **Strategy**: 單一 worker（無依賴，但其他所有 worker 依賴它）
- **Gate**:
  - [ ] `lib/project-root.ts` 建立成功
  - [ ] `npx tsc --noEmit -p packages/tools/eval/tsconfig.json` 通過

---

### Batch 1 — P0 + P1 核心修復 (並行)

- **Tasks**: WORKER-A (executor), WORKER-B (scorer+reporter), WORKER-C (optimizer), WORKER-D (index), WORKER-E (lib+question-loader)
- **Strategy**: 5 個 worker 並行（各自修改不同檔案，無重疊）
- **Depends on**: Batch 0 (project-root.ts)
- **Gate**:
  - [ ] 所有 5 個 worker 回報成功
  - [ ] `npx tsc --noEmit -p packages/tools/eval/tsconfig.json` 通過
  - [ ] `npm test` 通過 (確認無回歸)

---

### Batch 2 — CI workflow 修復

- **Tasks**: WORKER-F Part B (CI workflow)
- **Strategy**: 單一 worker（獨立於 TypeScript 原始碼）
- **Depends on**: Batch 1 (需要 index.ts exit code 修正 FIX-19)
- **Gate**:
  - [ ] `.github/workflows/eval.yml` YAML 語法有效
  - [ ] workflow 邏輯檢查：secrets 缺失 → skip；低分 → fail

---

### Batch 3 — 回歸測試實現

- **Tasks**: REGTEST-01 至 REGTEST-15（合併為 1 個 worker，因測試檔案之間可能有 import 共享）
- **Strategy**: 單一 worker 建立所有回歸測試
- **Depends on**: Batch 1 (所有修復完成)
- **Gate**:
  - [ ] 所有 15 個 REGTEST 通過
  - [ ] `npm test` 全綠（含新測試 + 舊測試）

---

### Batch Final — 收尾整合

- **Tasks**: 完整測試套件、對照 REPORT.md
- **Strategy**: 協調器直接處理
- **Depends on**: Batch 3
- **Gate**:
  - [ ] `npm test` 全綠
  - [ ] `npx tsc --noEmit -p packages/tools/eval/tsconfig.json` 通過
  - [ ] 對照 REPORT.md，所有 25 個問題已處理
  - [ ] 對照 SPEC.md，關鍵需求覆蓋改善

---

## 8. Regression Test Inventory

| 測試 ID | 關聯修復 | 測試類型 | 測試位置 | 測試場景摘要 |
|---|---|---|---|---|
| `REGTEST-01` | FIX-01 | 整合 | `test/isolation-integration.test.ts` | tool-use loop 產生 tool_call/tool_result events |
| `REGTEST-02` | FIX-02 | 單元 | `test/scorer.test.ts` | readTrace 回傳 events 含正確 _lineNumber |
| `REGTEST-03` | FIX-03 | 單元 | `test/project-root.test.ts` | getProjectRoot 從不同深度回傳正確路徑 |
| `REGTEST-04` | FIX-04 | 單元 | `test/scorer.test.ts` | scoreAllTests 僅載入 question JSON 一次 |
| `REGTEST-05` | FIX-05 | 單元 | `test/optimizer.test.ts` | severity 過濾後 pair 數量顯著減少 |
| `REGTEST-06` | FIX-06 | 單元 | `test/executor.test.ts` | 磁碟空間不足時拋出明確錯誤 |
| `REGTEST-07` | FIX-07 | 整合 | `test/scorer.test.ts` | 損壞 trace → scorable: false |
| `REGTEST-08` | FIX-08 | 手動 | CI workflow | 低於門檻時 CI fail |
| `REGTEST-09` | FIX-09 | 單元 | `test/optimizer.test.ts` | isAllowedFile 白名單驗證 |
| `REGTEST-10` | FIX-10 | 單元 | `test/optimizer.test.ts` | validateMarkdownStructure 損壞檢測 |
| `REGTEST-11` | FIX-11 | 單元 | `test/executor.test.ts` | .exec-lock 存在時拋錯 |
| `REGTEST-12` | FIX-12 | 單元 | `test/optimizer.test.ts` | applySkillChanges 衝突回報 |
| `REGTEST-13` | FIX-13 | 整合 | `test/scorer.test.ts` | 並發評分無 sync I/O |
| `REGTEST-14` | FIX-19 | 單元 | `test/index.test.ts` | 低分時 exit code === 1 |
| `REGTEST-15` | FIX-22 | 單元 | `test/reporter.test.ts` | 大量 scores 報告生成 < 1s |

---

## 9. Verification Checkpoints

### Checkpoint 0 — 基礎設施就緒
- 執行: `ls packages/tools/eval/lib/project-root.ts`
- 預期: 檔案存在

### Checkpoint 1 — 核心修復完成
- 執行: `npx tsc --noEmit -p packages/tools/eval/tsconfig.json && npm test`
- 預期: TypeScript 編譯無錯誤，174 個既有測試全數通過

### Checkpoint 2 — CI workflow 有效
- 執行: YAML 語法驗證 (手動檢查或 `yamllint`)
- 預期: workflow 結構正確

### Checkpoint 3 — 回歸測試通過
- 執行: `node --test packages/tools/eval/test/`
- 預期: 15 個新測試全部通過
- 邏輯檢查: 確認 REGTEST 在修復前的代碼上會失敗（oracle 驗證）

### Checkpoint 4 — 最終驗證
- 執行: `npm test`
- 預期: 所有測試通過（174 既有 + 15 新增）
- 對照 REPORT.md: 確認 25 個問題全部處理

---

## 10. Error Recovery

| 失敗場景 | 處理方式 |
|---|---|
| 修復 worker 回報失敗 | 用 worker 已有的上下文繼續它，給予更具體的指令。最多再試一次。 |
| 修復 worker 兩次嘗試後仍失敗 | 暫停整個流程，保留同批次其他成功 worker 的結果。向用戶報告。 |
| 回歸測試 worker 回報失敗 | 檢查是測試代碼有誤還是修復不完整。若測試代碼有誤，繼續該 worker 修正。若修復不完整，回到對應的修復 worker 繼續修復。 |
| TypeScript 編譯失敗 | 檢查錯誤訊息，定位到具體 worker，繼續該 worker 修正型別錯誤。 |
| `npm test` 回歸 | 暫停，用 `git diff` 定位引起回歸的變更，回到對應 worker 修正。 |
| 合併衝突（同檔案被多 worker 修改） | 由於使用檔案隔離策略（按檔案分 worker），不應出現合併衝突。若出現，協調器自己解決。 |

---

## 11. Fix History

> 首次產生，無歷史記錄。

---

## 12. Boundaries

### ALWAYS

- 每個批次完成後立即執行 Gate 驗證
- Worker prompt 必須從 Section 6 原樣擷取
- Worker 回報後，先消化結果再決定下一步
- 修復不得與 spec 原始需求衝突
- 回歸測試必須在修復批次全部通過後才能開始

### ASK FIRST

- 修復方案與 spec 設計意圖衝突時
- 需要新增外部依賴
- Worker 兩次嘗試失敗後
- 測試回歸無法快速定位原因

### NEVER

- 協調器自己編輯原始碼或測試檔案
- 讓 worker 生成子 worker
- 跳過驗證直接進入下一批次
- 變更 spec 文檔
- 在修復未全部完成前開始回歸測試
