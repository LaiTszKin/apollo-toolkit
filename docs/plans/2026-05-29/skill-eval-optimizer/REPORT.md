# Review Report

- **Spec**: skill-eval-optimizer (eval-core + optimize-and-integrate)
- **Date**: 2026-05-29
- **Reviewer**: Claude Code Review Agent
- **Verdict**: Needs Work

---

## 判決說明

**Verdict**: Needs Work

上一輪 25 個問題已全部修復（commit `91863d7`）。本輪為**修復後再審查**，確認殘留問題。

核心評測流程（tool-use loop → 評分 → 報告 → 優化）已可運作。但發現 4 個 P1 問題：spec R4 的讀取工具 mock 策略與原始需求存在偏移、EVAL_MIN_SCORE / EVAL_MAX_P0 環境變數定義但未被代碼使用導致 CI 閘門不完整、Judge prompt 雖要求 JSONL 行號格式但未傳遞完整 trace 使行號引用無法被履行。

---

## 發現的問題

### P1 — 重要問題

| # | 問題描述 | 影響 | 檔案 | 行數 | 審查維度 |
|---|--------|------|------|------|---------|
| 1 | **讀取工具被全面 mock 而非真實執行**：`isolation.ts` 將 Read、Grep、Glob、LSP、WebSearch、WebFetch 全部歸類為 READ_TOOLS，統一回傳 `"Content of {path}"` 等靜態字串。SPEC R4 要求「工具模擬透明化」和「mock 回傳值含正確性資訊」，但被評測模型永遠拿到模擬內容，無法展現真實的檔案定位與讀取能力，評測結果無法反映模型在真實檔案系統中的行為。 | 評測的信度降低：模型即使錯誤選擇工具或錯誤路徑，仍會收到「模擬成功」的回應 | `isolation.ts` | L74-81, L97-104, L148-149 | 實作偏移 |
| 2 | **EVAL_MIN_SCORE / EVAL_MAX_P0 環境變數未被代碼使用**：`eval.yml` L51-52 定義了 `EVAL_MIN_SCORE: 60` 和 `EVAL_MAX_P0: 0`，但 `index.ts` L342 將平均分門檻硬編碼為 `60`，且完全沒有從 `process.env` 讀取這兩個變數。`EnvConfig` 介面也不包含這兩個欄位。SPEC R3.2 要求「分數門檻和 P0 問題數量閾值可配置」——目前門檻值無法透過環境變數或 CLI flag 調整。 | CI 閘門不可配置：無法按技能或場景調整門檻值 | `index.ts`, `lib/env-utils.ts`, `.github/workflows/eval.yml` | index.ts:342, env-utils.ts:24-40, eval.yml:51-52 | 實作偏移、實作遺漏 |
| 3 | **Exit code 未檢查 P0 問題數量**：`index.ts` L341-346 的 exit code 邏輯僅檢查 `avgScore < 60` 和 `failed > 0`，從未遍歷評分結果中的 issues 統計 P0 數量。SPEC 要求「若評測中出現 P0 級別問題，CI 回報失敗」，但即使所有測試都包含 P0 問題，只要平均分 ≥60 且無執行失敗，exit code 仍為 0。 | CI 無法透過 exit code 阻擋含 P0 問題的 PR | `index.ts` | L341-346 | 實作偏移、實作遺漏 |
| 4 | **Judge prompt 要求 L{N} 格式但未傳遞完整 trace 事件**：`buildJudgePrompt()` L234 指示 judge 以 `L42: <description>` 格式引用 JSONL 行號，且 `readTrace()` 已正確實作 `_lineNumber`。但 `buildJudgePrompt()` 僅向 judge 傳遞 `userPrompt`、截斷的 `assistantResponse`、status/duration/errors 摘要，**從未將完整 trace events（含 tool_call、tool_result 等）序列化進 judge prompt**。Judge 看不到任何 JSONL 行號對應的具體事件內容，行號引用要求實質上無法被履行。SPEC R3.3 要求「報告中的軌跡引用精確到 JSONL 行號」。 | 報告中的 evidence 欄位可能包含無效的行號引用，降低報告可追溯性 | `scorer.ts` | L150-253 | 實作偏移 |

### P2 — 一般問題

| # | 問題描述 | 影響 | 檔案 | 行數 | 審查維度 |
|---|--------|------|------|------|---------|
| 1 | **`scorer.ts` 冗余 re-export `export { getProjectRoot }`**：`scorer.ts` L31 re-export 了 `getProjectRoot`，但沒有任何模組從 `scorer.js` 匯入此函式。所有模組（executor、reporter、optimizer、index、env-utils）皆直接從 `lib/project-root.js` 匯入。此 re-export 是遷移遺留的死代碼。 | 誤導貢獻者使用錯誤的匯入路徑 | `scorer.ts` | 31 | 冗余代碼 |
| 2 | **`isolation.ts` 6 個未使用的匯出符號**：`MockToolResult`、`ToolCallRecord`、`ToolDispatcher`、`MessageContext`、`createFreshContext`、`validateIsolation` 六個匯出符號在整個 packages/ 目錄下零引用。只有 `createToolDispatcher` 和 `ToolCall` 被 executor.ts 實際使用。`createFreshContext` 和 `validateIsolation` 屬於早期設計的顯式上下文隔離 API，但實際評分流程改用隱式隔離（每次 callJudgeModel 建立暫態 messages array），遺留了未使用的公開 API。 | 死代碼增加維護表面積、誤導讀者對模組 API 的理解 | `isolation.ts` | L19, L25, L32, L53, L190, L229 | 冗余代碼 |
| 3 | **`executor.ts` L247 `messages as unknown as` 繞過型別檢查**：tool-use loop 中的 messages array 包含 `tool_calls` 和 `tool_call_id` 欄位，但 `callExecModel` 的參數型別 `Message` 僅定義 `{ role: string; content: string }`。使用雙重 `as unknown as` 轉型強制壓過型別系統，犧牲了所有型別安全防護——若 messages 結構不正確，TypeScript 無法協助捕捉。 | 累積的型別繞過削弱 TypeScript 靜態保證價值 | `executor.ts` | 247 | 架構瑕疵 |
| 4 | **多處 `env as unknown as JudgeEnv` 不安全轉型**：`scorer.ts` L307 和 `optimizer.ts` L460, L786, L1145, L1188 共 5 處將 `EnvConfig` 強轉為 `JudgeEnv`。`EnvConfig` 包含 `EXEC_*` + `JUDGE_*` 欄位（含數字型別），而 `JudgeEnv` 僅含 `JUDGE_*` 字串欄位，兩者形狀不同。 | 型別不安全，重構時易引入 bug | `scorer.ts`, `optimizer.ts` | scorer.ts:307, optimizer.ts:460,786,1145,1188 | 架構瑕疵 |
| 5 | **`loadQuestions` 同名函式行為不同且匯入來源不一致**：`question-loader.ts` L53 和 `lib/question-utils.ts` L237 各匯出一個名為 `loadQuestions` 但行為不同的函式——前者包裝後者並加上更清楚的錯誤訊息。`index.ts` 從前者匯入，`scorer.ts` 從後者匯入。如果未來其中一個的行為改變，兩個匯入來源會出現分歧。 | 維護風險：同名函式語義分歧 | `question-loader.ts`, `lib/question-utils.ts` | question-loader.ts:53, question-utils.ts:237 | 架構瑕疵 |

### P3 — 建議改善

| # | 問題描述 | 影響 | 檔案 | 行數 | 審查維度 |
|---|--------|------|------|------|---------|
| 1 | **`reporter.ts` 反向索引 value 使用 `string[]` + `includes()`**：L155 的 `testIds.includes(s.testId)` 對每個 issue 插入是 O(n)。若大量測試共享相同 issue key，會出現二次膨脹。建議改用 `Set<string>`。 | 極端大量測試時報告生成變慢 | `reporter.ts` | 155 | 性能隱患 |
| 2 | **`promise-pool.ts` concurrency ≤ 0 無防護**：當 `concurrency` 為 0 或負值時，`Promise.all([])` 立即 resolve 空陣列，所有 items 靜默被跳過，無錯誤訊息。 | 環境變數配置錯誤時靜默失敗 | `lib/promise-pool.ts` | 29 | 架構瑕疵 |
| 3 | **`scanForDone` 在 watch polling 中使用同步 I/O**：`readdirSync` + 迴圈內 `existsSync` 每 10 秒阻塞事件循環一次。在 200 測試規模下不顯著，但若擴展到數千測試則可能成瓶頸。 | 大規模 watch mode 時的潛在瓶頸 | `scorer.ts` | 452-469 | 性能隱患 |
| 4 | **`lib/question-utils.ts` 職責過多（493 行）**：包含型別定義、載入、驗證、剝離、schema 載入、自我測試等 5+ 種職責。建議拆分。 | 維護負擔 | `lib/question-utils.ts` | 全檔 | 架構瑕疵 |
| 5 | **`optimizer.ts` 規模過大（1234 行）**：結合問題提取、關鍵字去重、詞幹提取、Jaccard 相似度、計畫生成、SKILL.md 優化、Markdown 驗證、白名單檢查等。建議拆分為 optimizer / dedup / skill-optimizer。 | 維護負擔 | `optimizer.ts` | 全檔 | 架構瑕疵 |

---

## 審查維度摘要

- **實作偏移**: 4 個 finding（P1: 讀取工具 mock 策略、EVAL_MIN_SCORE/MAX_P0 未使用、Exit code 缺 P0 檢查、Judge prompt 缺完整 trace）
- **冗余代碼**: 2 個 finding（P2: scorer.ts re-export、isolation.ts 6 個未使用 exports）
- **架構瑕疵**: 3 個 finding（P2: messages 型別繞過、env as JudgeEnv 轉型 ×5、loadQuestions 命名混淆）+ 2 個 P3
- **性能隱患**: 2 個 finding（P3: reporter string[] includes、scanForDone 同步 I/O）
- **實作遺漏**: 1 個 finding（P1: EVAL_MIN_SCORE/MAX_P0 與 P0 計數閘門未實作，與實作偏移合併計算）
- **幻覺代碼**: 無新發現

---

## Review History

> **2026-05-29 (Round 1)**: 首次審查 — 發現 25 個問題（2 P0 + 13 P1 + 9 P2 + 1 P3），涵蓋 6 個審查維度。核心缺陷為 isolation.ts 未整合至 executor pipeline、軌跡引用未達 JSONL 行號精度。Verdict: Needs Work。
>
> **2026-05-29 (Round 2 — 本次)**: 修復後再審查（commit `91863d7` 修復了 Round 1 全部 25 個問題）。確認核心 tool-use loop、JSONL 行號、getProjectRoot 共用、磁碟檢查、執行鎖、非同步 I/O 等修復已正確實作。發現 4 個 P1 殘留問題（讀取工具 mock 策略偏移、CI 門檻不可配置、Exit code 缺 P0 檢查、Judge prompt 缺完整 trace）及 7 個 P2/P3 項目。Verdict: Needs Work。
