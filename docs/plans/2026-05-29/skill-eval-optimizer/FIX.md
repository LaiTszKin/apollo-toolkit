# Fix Coordinator Prompt: skill-eval-optimizer (Round 8)

- **Date**: 2026-05-30
- **Source REPORT**: `docs/plans/2026-05-29/skill-eval-optimizer/REPORT.md`
- **Source Spec**: `docs/plans/2026-05-29/skill-eval-optimizer/`
- **Total Issues**: 2 P1 + 8 P2 + 10 P3 = 20
- **Total Workers**: 5 fix (A–E) + 1 regtest
- **Total Regression Tests**: 2

---

## 1. Your Role

**You are the fix coordinator.** You do not write code. You do not edit files. Your job is to understand the issues found in code review, delegate each fix and regression test to a worker, and verify that every issue is resolved without introducing regressions.

### What you do

- Read and understand the issue inventory, dependency analysis, and fix details below
- Spawn workers to execute individual fixes, giving each a self-contained prompt (provided in Section 6)
- After all fixes pass verification, spawn a worker to implement regression tests
- Wait for all workers in a batch to complete, then digest their results
- Run verification commands at each checkpoint
- Decide whether to proceed to the next batch, retry a failed worker, or halt
- Handle lightweight coordination tasks: resolving merge conflicts, committing results

### What you NEVER do

- Write, edit, or modify any source-code or test file directly
- Skip a verification checkpoint
- Proceed to the next batch when the current batch has not passed verification
- Delegate comprehension — digest every worker result yourself before deciding next steps
- Let workers spawn their own workers (workers are leaf nodes)
- Start regression tests before all fixes in scope are verified

---

## 2. Mission

修復 Round 8 審查發現的全部 20 個問題（2 P1 + 8 P2 + 10 P3），核心目標：

1. **FIX-01 (P1)**: 移除 executor.ts `sigintCleanup` 中的 `process.exit(1)`，讓 index.ts 的 finally 區塊能正常執行優雅關閉
2. **FIX-02 (P1)**: 降低 Phase 2 語意去重的關鍵字預過濾器閾值（0.25 → 0.1），確保語意相似但詞彙不同的重複問題能送達 LLM 語意比對
3. 8 個 P2 涵蓋：dry-run 內容改善、死碼移除、重複邏輯提取、Map 鍵值碰撞、replaceAll、API 錯誤截斷
4. 10 個 P3 涵蓋：效能改善、不必要 exports 移除、YAML 驗證強化、shebang 移除、維度映射說明

**Success looks like**: REPORT.md 中所有 20 個問題已修復，2 個回歸測試通過，63 個現有測試全部通過，TSC 零錯誤。

---

## 3. Issue Inventory

| Issue ID | 等級 | 問題簡述 | 涉及檔案 | 審查維度 | 複雜度 |
|---|---|---|---|---|---|
| `FIX-01` | P1 | executor.ts sigintCleanup 殘留 process.exit(1) 阻止優雅關閉 | `executor.ts` | 架構瑕疵 | 簡單 |
| `FIX-02` | P1 | 去重架構關鍵字優先，Phase 2 關鍵字預過濾器 0.25 過高 | `optimizer.ts` | 實作偏移、性能隱患 | 簡單 |
| `FIX-03` | P2 | Dry-run diff 內容為模板佔位符 | `index.ts`, `optimizer.ts` | 實作偏移 | 簡單 |
| `FIX-04` | P2 | supplyQuestions 死函式及相關 import | `question-loader.ts` | 實作遺漏、冗余代碼 | 簡單 |
| `FIX-05` | P2 | executeGrep/executeGlob 重複 walkDir | `isolation.ts` | 冗余代碼 | 中等 |
| `FIX-06` | P2 | executor/scorer 重複 mkdir 鎖定模式 | `executor.ts`, `scorer.ts` | 冗余代碼、架構瑕疵 | 中等 |
| `FIX-07` | P2 | buildDiffPatch/buildTemplatePatch 重複寫入邏輯 | `optimizer.ts` | 冗余代碼 | 簡單 |
| `FIX-08` | P2 | reporter.ts issueToTestMap substring 鍵值碰撞 | `reporter.ts` | 架構瑕疵 | 簡單 |
| `FIX-09` | P2 | optimizer.ts replace 非 replaceAll | `optimizer.ts` | 架構瑕疵 | 簡單 |
| `FIX-10` | P2 | API 錯誤回應 body 可能含敏感資訊 | `judge-api.ts` | 架構瑕疵 | 簡單 |
| `FIX-11` | P3 | buildJudgePrompt 三次 .find() 重複遍歷 | `scorer.ts` | 性能隱患 | 簡單 |
| `FIX-12` | P3 | sampleQuestions 四次 .filter() | `question-loader.ts` | 性能隱患 | 簡單 |
| `FIX-13` | P3 | 多個不必要 export 符號 | `scorer.ts`, `isolation.ts`, `optimizer.ts`, `question-loader.ts` | 冗余代碼 | 簡單 |
| `FIX-14` | P3 | question-loader.ts 死碼 import | `question-loader.ts` | 冗余代碼 | 簡單 |
| `FIX-15` | P3 | Frontmatter 驗證僅 regex 非 YAML 解析 | `optimizer.ts` | 實作遺漏 | 簡單 |
| `FIX-16` | P3 | reporter 截斷 evidence/description 過短 | `reporter.ts` | 實作偏移 | 簡單 |
| `FIX-17` | P3 | env-utils.ts shebang 行 | `lib/env-utils.ts` | 架構瑕疵 | 簡單 |
| `FIX-18` | P3 | promise-pool 共享 index 脆弱 | `lib/promise-pool.ts` | 架構瑕疵 | 簡單 |
| `FIX-19` | P3 | isolation.ts rel === fullPath 死條件 | `isolation.ts` | 架構瑕疵 | 簡單 |
| `FIX-20` | P3 | scorer.ts 3 維度 vs 4 維度 mismatch | `scorer.ts` | 架構瑕疵 | 簡單 |

---

## 4. Fix Dependency Analysis

### Dependency graph

```
FIX-02 ──→ FIX-07  (FIX-07 合併 buildDiffPatch/buildTemplatePatch，FIX-02 修改的 dedup 流程影響 patch 產出)
FIX-04 ──→ FIX-14  (FIX-04 刪除 supplyQuestions，自然消除 FIX-14 的死碼 import)

所有其他修復互相獨立，無邏輯依賴。

所有 REGTEST 依賴對應的 FIX 先完成。
```

### File overlap detection

| 重疊組 | 問題 ID | 共享檔案 | 處理方式 |
|---|---|---|---|
| 重疊組 1 | FIX-01, FIX-06 | `executor.ts` | 合併至 WORKER-A，同一 worker 內循序處理 |
| 重疊組 2 | FIX-02, FIX-07, FIX-09, FIX-15 | `optimizer.ts` | 合併至 WORKER-B，同一 worker 內循序處理 |
| 重疊組 3 | FIX-04, FIX-12, FIX-13(ql), FIX-14 | `question-loader.ts` | 合併至 WORKER-C，同一 worker 內循序處理 |
| 重疊組 4 | FIX-05, FIX-13(iso), FIX-19 | `isolation.ts` | 合併至 WORKER-D，同一 worker 內循序處理 |
| 重疊組 5 | FIX-06, FIX-11, FIX-13(scr), FIX-20 | `scorer.ts` | FIX-06 executor+scorer 同一 worker (WORKER-A)；FIX-11/13/20 合併至 WORKER-A |
| 重疊組 6 | FIX-03, FIX-08, FIX-10, FIX-16, FIX-17, FIX-18 | 分散在 `index.ts`, `reporter.ts`, `judge-api.ts`, `env-utils.ts`, `promise-pool.ts` | 無檔案內重疊，合併至 WORKER-E |

### Worker assignment

| Worker | 處理的 Issues | 涉及檔案 |
|---|---|---|
| **WORKER-A** | FIX-01, FIX-06, FIX-11, FIX-13(scr), FIX-20 | `executor.ts`, `scorer.ts`, `lib/lock.ts` (new) |
| **WORKER-B** | FIX-02, FIX-07, FIX-09, FIX-15, FIX-13(opt) | `optimizer.ts` |
| **WORKER-C** | FIX-04, FIX-12, FIX-13(ql), FIX-14 | `question-loader.ts` |
| **WORKER-D** | FIX-05, FIX-13(iso), FIX-19 | `isolation.ts` |
| **WORKER-E** | FIX-03, FIX-08, FIX-10, FIX-16, FIX-17, FIX-18 | `index.ts`, `reporter.ts`, `lib/judge-api.ts`, `lib/env-utils.ts`, `lib/promise-pool.ts` |

五個 worker 之間無檔案重疊，可全部並行執行。

---

## 5. Fix Details (with Regression Test Design)

### FIX-01: executor.ts sigintCleanup 移除 process.exit(1) (P1)

| 欄位 | 內容 |
|---|---|
| **根因** | Round 7 修復將 index.ts sigintHandler 中的 `process.exit(1)` 移至 finally 區塊，但 executor.ts:557-561 的 `sigintCleanup` 仍獨立呼叫 `process.exit(1)`。當 SIGINT 送達時，executor handler 同步終止程序，使 index.ts 的 finally 區塊永遠不會執行。 |
| **涉及檔案** | `executor.ts` > `runAllTests()` 內的 `sigintCleanup`（L557-561） |
| **修復方式** | 從 `sigintCleanup` 中移除 `process.exit(1)` 呼叫，僅保留 `rmSync(lockPath)` 確保鎖定目錄被同步清理。handler 清理後程序會自然返回，讓 `finally` 區塊執行 `await rm(lockPath)` 及 index.ts 的優雅關閉邏輯。 |
| **複雜度** | 簡單 |

**Regression test design:**

| 欄位 | 內容 |
|---|---|
| **測試 ID** | `REGTEST-01` |
| **測試類型** | 單元測試（靜態分析） |
| **測試位置** | `packages/tools/eval/test/executor.test.js` — 附加到現有測試 |
| **測試場景** | GIVEN executor.ts 編譯後的 JS 檔案 WHEN 靜態分析 `sigintCleanup` 函式內容 THEN 函式主體不應包含 `process.exit(` 呼叫 |
| **Oracle** | 對編譯後的 `dist/packages/tools/eval/executor.js` 進行字串搜尋：`sigintCleanup` 函式區塊內不存在 `process.exit(`。修復前此檢查失敗（找到 process.exit），修復後通過。 |

---

### FIX-02: Phase 2 語意去重關鍵字預過濾器閾值降低 (P1)

| 欄位 | 內容 |
|---|---|
| **根因** | Phase 2 (`refineDedupWithJudge`) 的 `jaccardSimilarity >= 0.25` 預過濾器排除了詞彙不相似但語意相似的問題對。Spec R1.1 要求去重使用語意相似度判斷，但當前架構以關鍵字相似度為主要機制，LLM 語意比對為條件性補充。 |
| **涉及檔案** | `optimizer.ts` > `refineDedupWithJudge()`（L468-473） |
| **修復方式** | 將 `jaccardSimilarity` 預過濾器閾值從 `0.25` 降低至 `0.1`。這讓更多詞彙不同但語意可能相似的配對能送達 LLM 語意比較步驟。同時在 Phase 1 (`deduplicateIssues`) 的 Jaccard 閾值保持 `0.15`（已是 Round 7 的較低值）。此修改僅影響 judge 可用時的正式執行路徑，不影響 dry-run。 |
| **複雜度** | 簡單 |

**Regression test design:**

| 欄位 | 內容 |
|---|---|
| **測試 ID** | `REGTEST-02` |
| **測試類型** | 單元測試 |
| **測試位置** | `packages/tools/eval/test/optimizer.test.js` — 附加到現有測試 |
| **測試場景** | GIVEN 兩個描述用詞完全不同但語意相似的 RawIssue（如 "instruction not followed correctly" 與 "did not comply with user directive"）WHEN 計算它們的 Jaccard 相似度 THEN Jaccard < 0.25 但 >= 0.1（驗證新閾值能讓此類配對通過預過濾器） |
| **Oracle** | 計算 Jaccard 相似度後確認：舊閾值 0.25 下此配對被排除，新閾值 0.1 下此配對通過。 |

---

### FIX-03: 改善 dry-run diff 內容 (P2)

| 欄位 | 內容 |
|---|---|
| **根因** | Dry-run 跳過 judge API，`suggestedFix` 為空字串，`buildDiffPatch()` 產出通用佔位符。 |
| **涉及檔案** | `optimizer.ts` > `buildDiffPatch()`（L1147-1196）；`index.ts`（L319-345） |
| **修復方式** | 在 `buildDiffPatch()` 中，當 `suggestedFix` 為空時，FIND 區塊改為顯示 issue 的 `category`、`severity`、`description`、`evidence`，讓開發者能看到具體評分數據而非通用佔位符。同時將 `buildDiffPatch` 和 `buildTemplatePatch` 合併（見 FIX-07）。 |
| **複雜度** | 簡單 |

---

### FIX-04: 移除死碼 supplyQuestions 及相關 import (P2)

| 欄位 | 內容 |
|---|---|
| **根因** | `supplyQuestions` 函式從未被呼叫。`generateVariants` 機制在 `question-utils.ts` 中保留供 REGTEST-F 使用，但 `question-loader.ts` 層的包裝函式為死碼。 |
| **涉及檔案** | `question-loader.ts` > `supplyQuestions()`（L152-168）、imports（L17, L19） |
| **修復方式** | 1. 刪除 `supplyQuestions` 函式定義（L152-168）2. 移除 `generateVariants` import（L17，僅被 `supplyQuestions` 使用）3. 移除 `EnvConfig` type import（L19，僅被 `supplyQuestions` 使用）4. 保留 `loadQuestionsFromFile` import（仍被 `loadQuestions` 使用） |
| **複雜度** | 簡單 |

---

### FIX-05: 提取 executeGrep/executeGlob 共享 walkDir (P2)

| 欄位 | 內容 |
|---|---|
| **根因** | 兩個函式各自獨立實作相同的遞迴目錄遍歷邏輯。 |
| **涉及檔案** | `isolation.ts` > `executeGrep()`（L210-249）、`executeGlob()`（L315-337） |
| **修復方式** | 在 `isolation.ts` 內提取一個私有 `async function walkDir(dir: string, onFile: (fullPath: string, relPath: string, entry: Dirent) => Promise<void>): Promise<number>` 函式。此函式回傳 skippedCount。`executeGrep` 和 `executeGlob` 改為傳入各自的檔案處理回呼。 |
| **複雜度** | 中等 — 需重構但不改變對外行為 |

---

### FIX-06: 提取 executor/scorer 共享鎖定模組 (P2)

| 欄位 | 內容 |
|---|---|
| **根因** | `executor.ts:526-554` 與 `scorer.ts:367-393` 各自實作完全相同的陳舊鎖偵測邏輯。 |
| **涉及檔案** | `executor.ts` > `runAllTests()` lock 獲取（L526-554）；`scorer.ts` > `scoreSingleTest()` lock 獲取（L367-393） |
| **修復方式** | 1. 建立新檔案 `packages/tools/eval/lib/lock.ts`，export `async function acquireLock(lockPath: string, lockName: string): Promise<void>` 2. 此函式封裝：mkdir 嘗試、EEXIST 處理、陳舊鎖偵測（5 分鐘閾值）、statSync mtime 檢查、rmSync 清理 + mkdir 重建 3. `executor.ts` 和 `scorer.ts` 改為 import 並呼叫此共用函式，傳入各自的 lockPath 和 lockName。executor 失敗時 throw，scorer 失敗時 return `{ skipped: true }` — 透過參數控制（`options: { onConflict: 'throw' | 'skip' }`）。 |
| **複雜度** | 中等 — 建立新模組 + 兩個呼叫點重構 |

---

### FIX-07: 合併 buildDiffPatch/buildTemplatePatch 重複邏輯 (P2)

| 欄位 | 內容 |
|---|---|
| **根因** | 兩個函式包含完全相同的 4 行 getProjectRoot + resolve + mkdir + writeFile。 |
| **涉及檔案** | `optimizer.ts` > `buildDiffPatch()`（L1147-1196）、`buildTemplatePatch()`（L1199-1231） |
| **修復方式** | 提取共享的 `async function writePatchFile(lines: string[], date: string): Promise<string>`，包含 getProjectRoot → resolve → mkdir → writeFile 邏輯。`buildDiffPatch` 和 `buildTemplatePatch` 各自準備自己的內容陣列後呼叫此共享函式。 |
| **複雜度** | 簡單 |

---

### FIX-08: 修復 reporter.ts issueToTestMap 鍵值碰撞 (P2)

| 欄位 | 內容 |
|---|---|
| **根因** | 使用 `issue.description.substring(0, 80)` 作為 Map 鍵值，不同 issue 前 80 字元相同時會碰撞。 |
| **涉及檔案** | `reporter.ts` > `generateReport()`（L135） |
| **修復方式** | 將鍵值改為 `${issue.severity}:${issue.category}:${issue.description}`（完整描述，不截斷）。Map 鍵值長度對效能影響極小（報告中的 issue 數量有限）。 |
| **複雜度** | 簡單 |

---

### FIX-09: 修復 applySkillChanges replace → replaceAll (P2)

| 欄位 | 內容 |
|---|---|
| **根因** | FIND/REPLACE 使用 `string.replace()` 僅取代首次匹配。 |
| **涉及檔案** | `optimizer.ts` > `applySkillChanges()`（L971-1023） |
| **修復方式** | 在 FIND 模式匹配邏輯中，將 `newContent.replace(findPattern, replacePattern)` 改為使用正則表達式全域旗標：`newContent.replace(new RegExp(escapeRegex(findPattern), 'g'), replacePattern)`。需加入 `escapeRegex` 輔助函式處理特殊字元。 |
| **複雜度** | 簡單 |

---

### FIX-10: API 錯誤回應 body 截斷 (P2)

| 欄位 | 內容 |
|---|---|
| **根因** | `judge-api.ts` 將完整 API 錯誤回應 body 拼接進 Error 訊息。 |
| **涉及檔案** | `lib/judge-api.ts` > `callJudgeModelRaw()`（L78）、`callExecModel()`（L211） |
| **修復方式** | 在兩處錯誤處理中，將 `${errorText}` 改為 `${truncateError(errorText)}`，其中 `truncateError` 截斷至前 200 字元並附加 `... (truncated)`。 |
| **複雜度** | 簡單 |

---

### FIX-11: 合併 buildJudgePrompt 三次 .find() (P3)

| 欄位 | 內容 |
|---|---|
| **根因** | 連續三次 `.find()` 對同一 trace 陣列進行 O(n) 遍歷。 |
| **涉及檔案** | `scorer.ts` > `buildJudgePrompt()`（L162-164） |
| **修復方式** | 改用單次 `for...of` 迴圈或 `reduce`，一次遍歷同時收集 thinking、response、end 三種事件。 |
| **複雜度** | 簡單 |

---

### FIX-12: 合併 sampleQuestions 四次 .filter() (P3)

| 欄位 | 內容 |
|---|---|
| **根因** | 對完整問題陣列進行四次 .filter() 建立四個新陣列。 |
| **涉及檔案** | `question-loader.ts` > `sampleQuestions()`（L87-89, L112） |
| **修復方式** | 改用單次 `reduce` 將問題一次性分類至 `{ basic, advanced, edge }` 三個桶中，避免多次陣列複製。 |
| **複雜度** | 簡單 |

---

### FIX-13: 移除不必要的 export 符號 (P3)

| 欄位 | 內容 |
|---|---|
| **根因** | 多個符號被 export 但僅在定義模組內部使用或無外部消費者。 |
| **涉及檔案** | `scorer.ts`（`scanForDoneAsync` L624）、`isolation.ts`（`ToolDispatcher` L32）、`optimizer.ts`（`RawIssue` L28、`OptimizationPlan` L46、`extractKeywords` L297、`jaccardSimilarity` L329）、`question-loader.ts`（`Question` re-export L23） |
| **修復方式** | 逐一移除上述符號的 `export` 關鍵字。若符號在 test 檔案中被引用，保留 export。 |
| **複雜度** | 簡單 |

---

### FIX-14: 移除 question-loader.ts 死碼 import (P3)

| 欄位 | 內容 |
|---|---|
| **根因** | `generateVariants` 和 `EnvConfig` 僅被 `supplyQuestions` 使用，後者為死碼。 |
| **涉及檔案** | `question-loader.ts` > imports（L17, L19） |
| **修復方式** | 與 FIX-04 合併處理：刪除 `supplyQuestions` 時一併移除這兩個 import。 |
| **複雜度** | 簡單（合併至 FIX-04） |

---

### FIX-15: 強化 frontmatter YAML 驗證 (P3)

| 欄位 | 內容 |
|---|---|
| **根因** | Frontmatter 驗證僅檢查 `---` 分隔符存在，不驗證 YAML 語法。 |
| **涉及檔案** | `optimizer.ts` > frontmatter validation（L1289-1306） |
| **修復方式** | 在現有分隔符檢查後，增加基本的 YAML key-value 行驗證：檢查 frontmatter 內容的每一非空行是否符合 `key: value` 格式（`/^[a-zA-Z_][\w-]*\s*:.*/`）。不引入外部 YAML 解析庫。 |
| **複雜度** | 簡單 |

---

### FIX-16: 增加 reporter 截斷上限 (P3)

| 欄位 | 內容 |
|---|---|
| **根因** | Issue 的 evidence 截斷至 80 字元、description 截斷至 60 字元過短。 |
| **涉及檔案** | `reporter.ts` > `generateReport()`（L268-269） |
| **修復方式** | 將 evidence 截斷上限從 80 提高至 200，description 從 60 提高至 120。 |
| **複雜度** | 簡單 |

---

### FIX-17: 移除 env-utils.ts shebang (P3)

| 欄位 | 內容 |
|---|---|
| **根因** | `#!/usr/bin/env node` 對庫模組無作用。 |
| **涉及檔案** | `lib/env-utils.ts`（L1） |
| **修復方式** | 刪除第一行的 `#!/usr/bin/env node`。 |
| **複雜度** | 簡單 |

---

### FIX-18: 改善 promise-pool 脆弱性標註 (P3)

| 欄位 | 內容 |
|---|---|
| **根因** | 共享可變 `index` 變數依賴 JS 單執行緒特性。 |
| **涉及檔案** | `lib/promise-pool.ts`（L22-31） |
| **修復方式** | 在現有註解基礎上加強警告，明確標註「WARNING: 此實作依賴 JavaScript 單執行緒執行模型」並加入更詳細的重構注意事項。不需改變執行邏輯（目前為安全）。 |
| **複雜度** | 簡單 |

---

### FIX-19: 移除 isolation.ts 路徑防護死條件 (P3)

| 欄位 | 內容 |
|---|---|
| **根因** | `rel === fullPath` 條件在 macOS/Linux 上永遠為 false。 |
| **涉及檔案** | `isolation.ts` > 路徑防護檢查（L145） |
| **修復方式** | 簡化條件：直接使用 `rel.startsWith('..') || path.isAbsolute(rel)`（移除 `|| rel === fullPath`）。保留 `path.isAbsolute(rel)` 以防 Windows 不同磁碟機代號情境。 |
| **複雜度** | 簡單 |

---

### FIX-20: 說明 scorer 3→4 維度映射 (P3)

| 欄位 | 內容 |
|---|---|
| **根因** | `JUDGE_DIMENSIONS` 使用 3 個維度，但 `ScoringCriteria` 定義 4 個維度，缺少顯式映射說明。 |
| **涉及檔案** | `scorer.ts` > `JUDGE_DIMENSIONS`（L117-118） |
| **修復方式** | 在 `JUDGE_DIMENSIONS` 上方加入 JSDoc 註解，說明三個 judge 維度（指令遵循、工具調用、結果質量）與四個評分標準維度（outcome/process/style/efficiency）之間的映射關係：outcome → 指令遵循 + 結果質量、process → 工具調用 + 指令遵循、style → 結果質量、efficiency → 工具調用。 |\n| **複雜度** | 簡單 |

---

## 6. Worker Prompt Library

### Fix Worker Prompts

#### WORKER-A: executor.ts + scorer.ts（FIX-01, FIX-06, FIX-11, FIX-13-scorer, FIX-20）

```
## Mission
修復 5 個問題：
- FIX-01 (P1): executor.ts sigintCleanup 移除 process.exit(1)
- FIX-06 (P2): 提取 executor/scorer 共享鎖定模組至 lib/lock.ts
- FIX-11 (P3): buildJudgePrompt 三次 .find() 合併為單次迴圈
- FIX-13-scorer (P3): 移除 scorer.ts 不必要的 export（scanForDoneAsync）
- FIX-20 (P3): 加入 JUDGE_DIMENSIONS 3→4 維度映射說明

## Context
- 審查維度: 架構瑕疵、冗余代碼、性能隱患
- Round 7 修復將 process.exit(1) 從 index.ts 移至 finally，但 executor.ts 的 sigintCleanup 仍獨立呼叫它
- executor.ts:526-554 和 scorer.ts:367-393 有完全相同的陳舊鎖偵測邏輯（5 分鐘過期、statSync、rmSync+mkdir）

## Input
- 閱讀: packages/tools/eval/executor.ts（L515-599）
- 閱讀: packages/tools/eval/scorer.ts（L117-118, L162-164, L367-393, L624）
- 閱讀: packages/tools/eval/lib/promise-pool.ts（作為 lib/ 模組格式參考）

## What to do

1. **FIX-01 — executor.ts sigintCleanup**: 在 L557-561 的 `sigintCleanup` 函式中，移除 `process.exit(1)` 行。僅保留 `try { rmSync(lockPath, { recursive: true, force: true }); } catch {}`。handler 返回後 finally 區塊會正常清理。

2. **FIX-06 — 共享鎖定模組**:
   a. 建立 `packages/tools/eval/lib/lock.ts`:
      - export async function acquireLock(lockPath: string, options?: { staleMs?: number; onConflict?: 'throw' | 'skip' }): Promise<{ skipped?: boolean }>
      - 封裝: mkdir → EEXIST catch → statSync mtime → stale check → rmSync + mkdir / throw / return { skipped: true }
      - 預設 staleMs = 5 * 60 * 1000, onConflict = 'throw'
   b. 重構 executor.ts L526-554: 刪除內聯鎖定邏輯，改為 `await acquireLock(lockPath)`（預設 throw）
   c. 重構 scorer.ts L367-393: 刪除內聯鎖定邏輯，改為 `const lockResult = await acquireLock(lockPath, { onConflict: 'skip' }); if (lockResult.skipped) return { ... }`

3. **FIX-11**: 在 scorer.ts buildJudgePrompt 中（L162-164 附近），將三次 `.find()` 改為單次 for...of 迴圈，一次遍歷收集 thinkingContent、responseContent、endData 三個變數。

4. **FIX-13-scorer**: 移除 `scanForDoneAsync` 的 `export` 關鍵字（L624），改為內部函式。

5. **FIX-20**: 在 JUDGE_DIMENSIONS（L117）上方加入 JSDoc:
   ```
   /**
    * Judge evaluation dimensions (mapped from 4 scoring criteria dimensions):
    * - outcome → 指令遵循 + 結果質量
    * - process → 工具調用 + 指令遵循
    * - style → 結果質量
    * - efficiency → 工具調用
    */
   ```

## Scope
- 允許修改: `executor.ts`, `scorer.ts`
- 允許建立: `lib/lock.ts`
- 禁止修改: 其他所有檔案

## Output
回報每個修改的檔案、變更摘要、遇到的阻礙。

## Verify
- `npx tsc --noEmit -p packages/tools/eval/tsconfig.json` → 零錯誤
- `node --test "packages/tools/eval/test/executor.test.js" "packages/tools/eval/test/scorer.test.js"` → 全部通過

## Boundaries
- 不要修改其他 worker 負責的檔案
- 鎖定模組的行為必須與現有邏輯完全等價
- 不要更改 REGTEST 測試的行為語義
```

---

#### WORKER-B: optimizer.ts（FIX-02, FIX-07, FIX-09, FIX-15, FIX-13-opt）

```
## Mission
修復 5 個 optimizer.ts 問題：
- FIX-02 (P1): 降低 Phase 2 語意去重 jaccardSimilarity 預過濾器閾值 0.25 → 0.1
- FIX-07 (P2): 合併 buildDiffPatch/buildTemplatePatch 重複寫入邏輯
- FIX-09 (P2): applySkillChanges replace → replaceAll
- FIX-15 (P3): 強化 frontmatter YAML 驗證
- FIX-13-opt (P3): 移除不必要 export（RawIssue, OptimizationPlan, extractKeywords, jaccardSimilarity）

## Context
- 審查維度: 實作偏移、冗余代碼、架構瑕疵、實作遺漏
- Spec R1.1 要求語意相似度判斷，但 Phase 2 的 jaccardSimilarity >= 0.25 預過濾器排除了語意相似但詞彙不同的問題對
- buildDiffPatch 和 buildTemplatePatch 有 4 行完全相同的 getProjectRoot + resolve + mkdir + writeFile

## Input
- 閱讀: packages/tools/eval/optimizer.ts（全檔，重點 L420-574 Phase 2, L637-782 Phase 1, L971-1023 applySkillChanges, L1147-1231 patch functions, L1289-1306 frontmatter validation）
- 閱讀: packages/tools/eval/index.ts L32-40（optimizer imports 參考）

## What to do

1. **FIX-02**: 在 `refineDedupWithJudge` 函式中（約 L471），將 `jaccardSimilarity(s1, s2) >= 0.25` 改為 `>= 0.1`。

2. **FIX-07**: 
   a. 提取共享函式 `async function writePatchFile(lines: string[], date: string): Promise<string>` — 包含 getProjectRoot → resolve → mkdir → writeFile
   b. `buildDiffPatch` 和 `buildTemplatePatch` 各自準備內容陣列後呼叫此函式

3. **FIX-09**: 
   a. 加入 escapeRegex 輔助函式: `function escapeRegex(s: string): string { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }`
   b. 在 applySkillChanges 中（約 L1007），將 `newContent.replace(findPattern, replacePattern)` 改為 `newContent.replace(new RegExp(escapeRegex(findPattern), 'g'), replacePattern)`

4. **FIX-15**: 在 frontmatter 分隔符檢查後（L1298-1306 附近），新增基本 YAML key-value 行驗證:
   - 檢查每行非空內容是否符合 `/^[a-zA-Z_][\w-]*\s*:.*/` 或為註解（`#` 開頭）
   - 若不符合，驗證失敗並還原備份

5. **FIX-13-opt**: 移除以下符號的 `export` 關鍵字:
   - `RawIssue` interface（L28）
   - `OptimizationPlan` interface（L46）
   - `extractKeywords` function（L297）
   - `jaccardSimilarity` function（L329）
   先確認這些符號在 test/ 和 index.ts 中未被直接 import。

## Scope
- 允許修改: `optimizer.ts`
- 禁止修改: 其他所有檔案

## Output
回報每個修改的檔案、變更摘要、遇到的阻礙。

## Verify
- `npx tsc --noEmit -p packages/tools/eval/tsconfig.json` → 零錯誤
- `node --test "packages/tools/eval/test/optimizer.test.js"` → 全部通過

## Boundaries
- 去重邏輯變更不得改變現有測試的通過/失敗狀態
- replaceAll 需要正確處理 FIND 模式中的特殊 regex 字元
```

---

#### WORKER-C: question-loader.ts（FIX-04, FIX-12, FIX-13-ql, FIX-14）

```
## Mission
修復 4 個 question-loader.ts 問題：
- FIX-04 (P2): 移除死碼 supplyQuestions 函式
- FIX-12 (P3): 合併 sampleQuestions 四次 .filter() 為單次 reduce
- FIX-13-ql (P3): 移除 Question re-export
- FIX-14 (P3): 移除死碼 import（generateVariants, EnvConfig）

## Context
- 審查維度: 實作遺漏、冗余代碼、性能隱患
- supplyQuestions 是唯一呼叫 generateVariants 的函式，但從未被 index.ts 使用
- sampleQuestions 對完整陣列做四次 .filter()（basic/advanced/edge 分類 + used-id 過濾）

## Input
- 閱讀: packages/tools/eval/question-loader.ts（全檔）
- 閱讀: packages/tools/eval/lib/question-utils.ts（L317-365 generateVariants）

## What to do

1. **FIX-04 + FIX-14**（合併處理）:
   a. 刪除 `supplyQuestions` 函式定義（L152-168）
   b. 從 import L17 中移除 `generateVariants`（保留 `loadQuestionsFromFile`）
   c. 移除 `import type { EnvConfig } from './lib/env-utils.js'`（L19）

2. **FIX-12**: 將 `sampleQuestions` 中的 difficulty 分類（L87-89 的三次 .filter()）改為單次 reduce:
   ```
   const byDifficulty = { basic: [] as Question[], advanced: [] as Question[], edge: [] as Question[] };
   for (const q of questions) { byDifficulty[q.difficulty].push(q); }
   ```
   Fast 模式的 used-id 過濾（L111-112）也改用 Set 檢查而非 .filter()。

3. **FIX-13-ql**: 移除 L23 的 `export type { Question } from './lib/question-utils.js';`（無外部消費者從 question-loader import Question）

## Scope
- 允許修改: `question-loader.ts`
- 禁止修改: 其他所有檔案（包括 lib/question-utils.ts）

## Output
回報每個修改的檔案、變更摘要、遇到的阻礙。

## Verify
- `npx tsc --noEmit -p packages/tools/eval/tsconfig.json` → 零錯誤
- `node --test "packages/tools/eval/test/question-loader.test.js"` → 全部通過

## Boundaries
- generateVariants 在 lib/question-utils.ts 中保持不變（REGTEST-F 需要）
- sampleQuestions 的行為必須與修改前完全等價
```

---

#### WORKER-D: isolation.ts（FIX-05, FIX-13-iso, FIX-19）

```
## Mission
修復 3 個 isolation.ts 問題：
- FIX-05 (P2): 提取 executeGrep/executeGlob 共享 walkDir
- FIX-13-iso (P3): 移除 ToolDispatcher interface export
- FIX-19 (P3): 移除 path.relative 死條件 rel === fullPath

## Context
- 審查維度: 冗余代碼、架構瑕疵
- executeGrep (L210-249) 和 executeGlob (L315-337) 各自實作相同的遞迴目錄遍歷
- isolation.ts L145 的 `rel === fullPath` 在 macOS/Linux 上永遠為 false

## Input
- 閱讀: packages/tools/eval/isolation.ts（全檔，重點 L140-160 路徑防護, L193-267 executeGrep, L279-350 executeGlob）

## What to do

1. **FIX-05**: 在 executeGrep 和 executeGlob 之前定義共享 walkDir:
   ```
   async function walkDir(
     dir: string,
     workspaceDir: string,
     onFile: (fullPath: string, relPath: string, entry: Dirent) => Promise<void>,
   ): Promise<number> {
     // 回傳 skippedCount
     // 封裝: readdir → 跳過 .git/node_modules → 遞迴 / onFile
   }
   ```
   executeGrep 和 executeGlob 改為傳入各自的檔案處理回呼。

2. **FIX-19**: 在路徑防護檢查（約 L145）中，將 `if (rel.startsWith('..') || rel === fullPath || path.isAbsolute(rel))` 簡化為 `if (rel.startsWith('..') || path.isAbsolute(rel))`。

3. **FIX-13-iso**: 移除 `ToolDispatcher` interface 的 `export` 關鍵字（L32）。

## Scope
- 允許修改: `isolation.ts`
- 禁止修改: 其他所有檔案

## Output
回報每個修改的檔案、變更摘要、遇到的阻礙。

## Verify
- `npx tsc --noEmit -p packages/tools/eval/tsconfig.json` → 零錯誤
- `node --test "packages/tools/eval/test/isolation.test.js"` → 全部通過

## Boundaries
- walkDir 回呼簽章必須支援非同步（executeGrep 的逐行比對是同步的，但需包裝為 async）
- 不改變 executeGrep/executeGlob 的回傳格式或行為
```

---

#### WORKER-E: index.ts + reporter.ts + lib/*（FIX-03, FIX-08, FIX-10, FIX-16, FIX-17, FIX-18）

```
## Mission
修復 6 個分散在 5 個檔案的問題：
- FIX-03 (P2): 改善 dry-run diff 內容（index.ts + optimizer.ts 注意：optimizer.ts 由 WORKER-B 負責，你只改 index.ts 的 dry-run 呼叫方式）
- FIX-08 (P2): reporter.ts issueToTestMap 鍵值碰撞
- FIX-10 (P2): judge-api.ts API 錯誤回應截斷
- FIX-16 (P3): reporter.ts 增加截斷上限
- FIX-17 (P3): env-utils.ts 移除 shebang
- FIX-18 (P3): promise-pool.ts 加強脆弱性警告

## Context
- 審查維度: 實作偏移、架構瑕疵
- Dry-run diff 產出通用佔位符而非實際問題內容
- reporter.ts 使用 substring(0,80) 作為 Map 鍵值可能碰撞
- API 錯誤回應 body 完整洩漏到 Error 訊息
- env-utils.ts 第一行是無作用的 shebang
- promise-pool.ts 的共享 index 模式依賴 JS 單執行緒

## Input
- 閱讀: packages/tools/eval/index.ts（L319-345 dry-run path）
- 閱讀: packages/tools/eval/reporter.ts（L135 key, L268-269 truncation）
- 閱讀: packages/tools/eval/lib/judge-api.ts（L78, L211 error handling）
- 閱讀: packages/tools/eval/lib/env-utils.ts（L1 shebang）
- 閱讀: packages/tools/eval/lib/promise-pool.ts（L22-31 shared index）

## What to do

1. **FIX-03**: 在 index.ts dry-run 路徑（L319-345）改善內容品質：在產生 `dedupedLike` 時，`suggestedFix` 設為基於 `category` + `severity` + `evidence` 組合的描述性字串（而非空字串），例如 `` `[${r.severity}] ${r.category}: ${r.description} — Evidence: ${r.evidence.substring(0, 200)}` ``。這樣 buildDiffPatch 至少會顯示具體問題資訊。

2. **FIX-08**: 在 reporter.ts L135，將鍵值從 `issue.description.substring(0, 80)` 改為 `${issue.severity}:${issue.category}:${issue.description}`（完整描述，不使用 substring）。

3. **FIX-10**: 在 judge-api.ts 加入輔助函式 `function truncateError(text: string): string { return text.length > 200 ? text.substring(0, 200) + '... (truncated)' : text; }`，然後在 L78 和 L211 將 `${errorText}` 改為 `${truncateError(errorText)}`。

4. **FIX-16**: 在 reporter.ts L268-269，將 evidence 截斷 `80` → `200`，description 截斷 `60` → `120`。

5. **FIX-17**: 刪除 env-utils.ts 第一行的 `#!/usr/bin/env node`。

6. **FIX-18**: 在 promise-pool.ts L22 註解上方加入更明顯的 WARNING 區塊：
   ```
   /**
    * WARNING: 此實作依賴 JavaScript 單執行緒執行模型（shared mutable index）。
    * 不要在 `const i = index++` 和 `fn(items[i], i)` 之間加入 await，
    * 否則會引入競態條件導致項目被跳過或重複處理。
    */
   ```

## Scope
- 允許修改: `index.ts`, `reporter.ts`, `lib/judge-api.ts`, `lib/env-utils.ts`, `lib/promise-pool.ts`
- 禁止修改: 其他所有檔案（特別注意不要修改 optimizer.ts — 由 WORKER-B 負責）

## Output
回報每個修改的檔案、變更摘要、遇到的阻礙。

## Verify
- `npx tsc --noEmit -p packages/tools/eval/tsconfig.json` → 零錯誤
- `node --test "packages/tools/eval/test/index.test.js" "packages/tools/eval/test/reporter.test.js"` → 全部通過

## Boundaries
- 不要修改 optimizer.ts（WORKER-B 負責）
- 不要修改 isolation.ts（WORKER-D 負責）
- 不要修改 question-loader.ts（WORKER-C 負責）
- API 錯誤截斷保持前 200 字元完整，不可截斷中間部分
```

---

### Regression Test Worker Prompts

#### REGTEST-01: SIGINT handler 不含 process.exit（關聯 FIX-01）

```
## Mission
為 FIX-01（executor.ts sigintCleanup 移除 process.exit(1)）建立回歸測試。確保此問題未來不會再次出現。

## Context
- 修復的問題: executor.ts runAllTests() 內的 sigintCleanup handler 不應呼叫 process.exit(1)
- 根因: Round 7 修復後 executor 的 SIGINT handler 殘留 process.exit(1)
- 修復後: sigintCleanup 僅執行 rmSync 清理鎖定目錄，程序退出由 finally 區塊處理

## Input
- 閱讀: packages/tools/eval/executor.ts（L556-561 sigintCleanup 定義）
- 閱讀: packages/tools/eval/dist/packages/tools/eval/executor.js（編譯後 JS）
- 參考: packages/tools/eval/test/executor.test.js 中 REGTEST-01 (R7) 的靜態分析測試格式（對 index.ts/dist/.../index.js 做 process.exit 字串搜尋）

## What to do
在 `packages/tools/eval/test/executor.test.js` 加入 REGTEST-08 (R8) 測試：

測試場景:
- GIVEN executor.ts 已編譯為 dist/packages/tools/eval/executor.js
- WHEN 對編譯後 JS 進行靜態分析
- THEN sigintCleanup 函式區塊內不應包含 `process.exit(` 呼叫

Oracle: 讀取 dist 檔案內容，使用 regex 提取 sigintCleanup 函式主體（從 `const sigintCleanup = () => {` 到對應的 `};`），確認其中不包含 `process.exit(`。修復前此檢查應失敗（找到 process.exit），修復後應通過。

## Scope
- 允許修改: `packages/tools/eval/test/executor.test.js`
- 禁止修改: 所有非測試原始碼檔案

## Output
回報建立的測試名稱、測試執行結果。

## Verify
- 執行: `node --test "packages/tools/eval/test/executor.test.js"`
- 預期: REGTEST-08 (R8) 測試通過（確認 sigintCleanup 不含 process.exit(1)）

## Boundaries
- 參考現有 REGTEST-01 (R7) 的測試格式（也是靜態分析類型）
- 測試必須能獨立執行，不依賴外部狀態
```

---

#### REGTEST-02: 降低 Phase 2 Jaccard 預過濾器閾值（關聯 FIX-02）

```
## Mission
為 FIX-02（Phase 2 jaccardSimilarity 閾值 0.25 → 0.1）建立回歸測試。確保語意相似但詞彙不同的問題對能通過預過濾器。

## Context
- 修復的問題: refineDedupWithJudge 中的 jaccardSimilarity 預過濾器閾值從 0.25 降至 0.1
- 根因: 舊閾值 0.25 排除了詞彙不同但語意相似的問題對
- 修復後: 閾值 0.1，更多候選對送達 LLM 語意比較

## Input
- 閱讀: packages/tools/eval/optimizer.ts（L468-473 預過濾器, L329 jaccardSimilarity 函式）
- 參考: packages/tools/eval/test/optimizer.test.js 現有測試格式

## What to do
在 `packages/tools/eval/test/optimizer.test.js` 加入 REGTEST-XX (R8 dedup threshold) 測試：

測試場景:
- GIVEN 兩個描述用詞不同但語意相似的 RawIssue：
  - issue1: "instruction not followed correctly in the output"
  - issue2: "did not comply with user directive in response"
- WHEN 計算它們的 Jaccard 相似度
- THEN Jaccard 相似度應小於舊閾值 0.25 但大於等於新閾值 0.1

Oracle: 如果 jaccardSimilarity 實作正確，這兩個句子的 Jaccard 應該在 [0.1, 0.25) 範圍內。確認新閾值 0.1 下此配對能通過預過濾器。使用 optimizer.ts export 的 jaccardSimilarity 函式直接測試。

## Scope
- 允許修改: `packages/tools/eval/test/optimizer.test.js`
- 禁止修改: 所有非測試原始碼檔案

## Output
回報建立的測試名稱、計算出的 Jaccard 值、測試執行結果。

## Verify
- 執行: `node --test "packages/tools/eval/test/optimizer.test.js"`
- 預期: 新測試通過，Jaccard 值在 [0.1, 0.25) 範圍內

## Boundaries
- 如果 jaccardSimilarity 已因 FIX-13-opt 移除 export，使用間接方式測試（透過計算已知相似度的文字對）
```

---

## 7. Fix Batch Schedule

### Batch 1 — 全部 P1/P2/P3 修復（5 個 worker 並行）

- **Issues**: 全部 FIX-01 至 FIX-20（由 WORKER-A 至 WORKER-E 分工）
- **Strategy**: 並行派發 5 個 worker，無檔案重疊
- **Gate**:
  - [ ] WORKER-A 回報成功
  - [ ] WORKER-B 回報成功
  - [ ] WORKER-C 回報成功
  - [ ] WORKER-D 回報成功
  - [ ] WORKER-E 回報成功
  - [ ] TSC: `npx tsc --noEmit -p packages/tools/eval/tsconfig.json` → 零錯誤
  - [ ] 現有測試套件: `node --test "packages/tools/eval/test/*.test.js"` → 全部通過（無退化）

---

### Batch 2 — 回歸測試實現（1 個 worker）

- **Tasks**: REGTEST-01, REGTEST-02
- **Strategy**: 派發 1 個 worker（兩個回歸測試無檔案重疊，同一 worker 內實現）
- **Depends on**: Batch 1（所有修復完成）
- **Gate**:
  - [ ] REGTEST worker 回報成功
  - [ ] REGTEST-01 通過（sigintCleanup 不含 process.exit）
  - [ ] REGTEST-02 通過（Jaccard 閾值驗證）
  - [ ] 完整測試套件通過: `node --test "packages/tools/eval/test/*.test.js"` — 預期 65 個測試全部通過（63 原有 + 2 新增）

---

### Batch Final — 收尾整合

- **Tasks**: 最終驗證、對照 REPORT.md
- **Strategy**: 由協調器直接處理
- **Depends on**: Batch 2
- **Gate**:
  - [ ] TSC 零錯誤
  - [ ] 完整測試套件: `node --test "packages/tools/eval/test/*.test.js"` — 65/65 通過
  - [ ] 對照 REPORT.md，所有 20 個問題已處理

---

## 8. Regression Test Inventory

| 測試 ID | 關聯修復 | 測試類型 | 測試位置 | 測試場景摘要 |
|---|---|---|---|---|
| `REGTEST-01` | FIX-01 | 單元（靜態分析） | `test/executor.test.js` | 對編譯後 JS 靜態分析：sigintCleanup 函式不應含 process.exit( |
| `REGTEST-02` | FIX-02 | 單元 | `test/optimizer.test.js` | 驗證用詞不同但語意相似的文字對的 Jaccard 值落在 [0.1, 0.25) |

---

## 9. Verification Checkpoints

### Checkpoint 1 — Batch 1 完成後
- 執行: `npx tsc --noEmit -p packages/tools/eval/tsconfig.json`
- 預期: 零錯誤
- 執行: `node --test "packages/tools/eval/test/*.test.js"`
- 預期: 63/63 測試通過（確認無回歸）

### Checkpoint 2 — Batch 2 完成後
- 執行: `node --test "packages/tools/eval/test/*.test.js"`
- 預期: 65/65 測試通過（含 2 個新增回歸測試）
- 邏輯檢查: REGTEST-01 若在修復前的編譯產物上執行應失敗（找到 process.exit）；REGTEST-02 驗證 Jaccard 值在正確範圍

### Checkpoint 3 — 最終驗證
- 執行完整測試套件: `node --test "packages/tools/eval/test/*.test.js"`
- 確認 TSC 零錯誤
- 對照 REPORT.md，確認所有 20 個問題已處理

---

## 10. Error Recovery

| 失敗場景 | 處理方式 |
|---|---|
| 修復 worker 回報失敗 | 用 worker 已有的上下文繼續它（不要新建），給予更具體的指令。最多再試一次。 |
| 修復 worker 兩次嘗試後仍失敗 | 暫停整個流程，保留同批次其他成功 worker 的結果。向用戶報告。 |
| 回歸測試 worker 回報失敗（測試無法通過） | 檢查是測試代碼有誤還是修復不完整。若測試代碼有誤，繼續該 worker 修正。若修復不完整，回到對應的修復 worker 繼續修復。 |
| 回歸測試在修復前代碼上也能通過 | 測試設計無效 — 重新設計 oracle，派發新的 worker。 |
| TSC 編譯錯誤 | 錯誤訊息會指出是哪個 worker 的變更導致。繼續對應 worker 修正。 |
| 修復或回歸測試導致現有測試退化 | 暫停，向用戶報告：哪個測試失敗、由哪個 worker 的變更引起。 |

---

## 11. Fix History

> **2026-05-29 (Round 1)**: 首次修復 — 25 個問題（2 P0 + 13 P1 + 9 P2 + 1 P3）。核心修復為 isolation.ts 整合至 executor pipeline。Verdict after: Needs Work（12 殘留）。
>
> **2026-05-29 (Round 2)**: 修復 12 個殘留問題（4 P1 + 8 P2/P3）。Verdict after: Needs Work（18 新發現）。
>
> **2026-05-29 (Round 3)**: 修復 18 個問題（1 P0 + 7 P1 + 6 P2 + 4 P3）。CI gate config、死碼移除、型別安全。Verdict after: Needs Work（26 新發現）。
>
> **2026-05-29 (Round 4)**: 修復 26 個問題（6 P1 + 11 P2 + 9 P3）。LLM variant gen、simulated tag、dead code。Verdict after: Needs Work（32 新發現）。
>
> **2026-05-29 (Round 5)**: 修復 32 個問題（6 P1 + 14 P2 + 12 P3）。首次達到 Spec 100% 覆蓋率。Verdict after: Needs Work（20 新發現）。
>
> **2026-05-29 (Round 6)**: 修復 20 個問題（3 P1 + 5 P2 + 12 P3）。Dry-run diff、Bash 安全、async I/O。Verdict after: Needs Work（20 新發現）。
>
> **2026-05-29 (Round 7)**: 修復 20 個問題（1 P0 + 3 P1 + 8 P2 + 8 P3）。SIGINT lock leak P0、stale lock detection、round event、async I/O migration。Commit: `c086626`。Verdict after: Needs Work（20 新發現 — 本次 Round 8）。

---

## 12. Boundaries

### ALWAYS

- 每個批次完成後立即執行 Gate 驗證
- Worker prompt 必須從 Section 6 原樣擷取，不要自己改寫
- Worker 回報後，先消化結果再決定下一步
- 修復不得與 spec 原始需求衝突（特別是 Spec R1.1 語意去重、R1.3 變體生成需求）
- 回歸測試必須在修復批次全部通過後才能開始派發

### ASK FIRST — 暫停並向用戶確認

- 修復方案與 spec 設計意圖衝突時
- 需要新增外部依賴（如 YAML 解析庫）時
- Worker 兩次嘗試失敗後
- 測試回歸無法快速定位原因

### NEVER

- 協調器自己編輯原始碼或測試檔案
- 讓 worker 生成子 worker
- 跳過驗證直接進入下一批次
- 變更 spec 文檔（除非修復過程中發現 spec 錯誤需回報）
- 在修復未全部完成前開始回歸測試
