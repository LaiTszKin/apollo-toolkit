# Review Report

- **Spec**: skill-eval-optimizer (eval-core + optimize-and-integrate)
- **Date**: 2026-05-30
- **Reviewer**: Claude Code Review Agent (6 parallel agents)
- **Verdict**: Needs Work

---

## 判決說明

**Verdict**: Needs Work

Round 7 修復（commit `c086626`）成功解決了上一輪全部 20 個問題 — SIGINT lock 洩漏、exec/scoring 陳舊鎖偵測、trace 'round' event、死碼移除、optimizer async I/O 遷移等核心修復已確認到位。幻覺代碼審查連續第四輪零發現，Spec 28 個需求 + 14 個錯誤案例維持 100% 覆蓋率。

本輪發現 2 個 P1 問題：**executor.ts SIGINT handler 殘留 `process.exit(1)`**（Round 7 修復的殘留 — executor 的 sigintCleanup 仍呼叫 process.exit(1)，阻止 index.ts 的 finally 區塊執行優雅關閉）；以及**去重架構本質上為關鍵字優先而非語意優先**（Phase 1 Jaccard 關鍵字相似度為主要機制、O(n²) 效能、Phase 2 LLM 語意精煉為條件性補充）。此外有 8 個 P2 和 10 個 P3 問題，涵蓋程式碼重複、dry-run 內容品質、安全、效能等層面。

---

## 發現的問題

### P1 — 重要問題

| # | 問題描述 | 影響 | 檔案 | 行數 | 審查維度 |
|---|--------|------|------|------|---------|
| 1 | **executor.ts SIGINT handler 殘留 `process.exit(1)` 阻止優雅關閉**：Round 7 修復將 index.ts sigintHandler 中的 `process.exit(1)` 移至 finally 區塊，但 executor.ts:557-561 的 `sigintCleanup` 仍直接呼叫 `process.exit(1)`。當 SIGINT 在測試執行期間送達，executor 的 handler（透過 `process.once` 註冊）呼叫 `process.exit(1)` 同步終止程序，使 index.ts 的 finally 區塊（清理 handler、列印摘要、條件式 exit）永遠不會執行。雖然 executor 的 `rmSync(lockPath)` 確保了鎖定目錄被清理，但 index.ts 的優雅關閉邏輯被完全繞過。 | 每次 Ctrl+C 中斷後，已完成結果無法被妥善保留／摘要；優雅關閉語意被破壞 | `executor.ts` | 557-561 | 架構瑕疵 |
| 2 | **去重架構本質上為關鍵字優先，非 Spec 要求的語意優先**：Spec R1.1 要求「語意相似度判斷（非僅關鍵字匹配）」。實作中 Phase 1 使用 Jaccard 關鍵字相似度作為主要去重機制（O(n²) 成對比較，MAX_PHASE1_PAIRS=10000 截斷），Phase 2 LLM 語意精煉是條件性的 — dry-run 模式或 judge 不可用時完全跳過、且 Phase 2 有 `jaccardSimilarity >= 0.25` 關鍵字預過濾器，語意相似但用詞不同的重複問題在 Phase 1 即被排除，永遠無法到達語意比較步驟。同時 O(n²) 成對比較在大量 issues 場景下長時間阻塞事件迴圈，Phase 2 LLM 洪水（每類別最多 100 對 × 30s timeout）可產生數分鐘延遲。 | 語意相似但詞彙不同的重複問題無法被合併；大量評分資料下效能瓶頸 | `optimizer.ts` | 420-782 | 實作偏移、性能隱患 |

### P2 — 一般問題

| # | 問題描述 | 影響 | 檔案 | 行數 | 審查維度 |
|---|--------|------|------|------|---------|
| 3 | **Dry-run diff 內容為模板佔位符而非實際變更預覽**：Spec R1.3 要求 dry-run「產出 diff 預覽」。Dry-run 模式跳過 judge API 呼叫，`suggestedFix` 為空字串，`buildDiffPatch()` 產出的 FIND 區塊為 `(Section related to: {description})`、REPLACE 區塊為 `(Review and adjust based on identified issues)`。開發者無法從預覽中判斷實際會發生的變更內容。 | Dry-run 輸出無法作為有效決策依據 | `index.ts`, `optimizer.ts` | index:319-345, opt:1147-1231 | 實作偏移 |
| 4 | **LLM 題目變體生成（Spec R1.3）未接入主流程**：`supplyQuestions` 函式存在但從未被 `index.ts` 呼叫。`generateVariants` 機制已實作但評測 pipeline 永遠使用題庫原始題目，從不觸發變體生成。Spec R1.3 要求「對於需要變體的題目，由 LLM 生成語意等價但表述不同的變體」。 | 評測永遠使用相同題目表述，缺少題目多樣性 | `question-loader.ts`, `index.ts` | loader:152-168, index:262-267 | 實作遺漏、冗余代碼 |
| 5 | **`executeGrep` 與 `executeGlob` 各自重複實作相同的遞迴目錄遍歷**：兩個函式（isolation.ts:210-249 與 315-337）各自獨立實作 `walkDir` 遞迴邏輯，包含完全相同的 `readdir` 呼叫、`skippedCount` 錯誤處理、`.git`/`node_modules` 跳過、遞迴邏輯。僅檔案層級的處理邏輯不同（grep 逐行比對 vs glob 檔名正則比對）。 | 重複程式碼增加維護成本與不一致風險 | `isolation.ts` | 210-249, 315-337 | 冗余代碼 |
| 6 | **executor 與 scorer 重複實作相同的 mkdir 鎖定模式**：`executor.ts:526-554` 與 `scorer.ts:367-393` 各自實作完全相同的陳舊鎖偵測邏輯（5 分鐘過期閾值、`statSync` 取得 mtime、`rmSync` 清理後 `mkdir` 重建、EEXIST 錯誤處理）。僅鎖定目錄名稱和失敗處理方式（throw vs return）不同。 | 重複邏輯增加維護成本；未來修改需同步兩處 | `executor.ts`, `scorer.ts` | exec:526-554, scorer:367-393 | 冗余代碼、架構瑕疵 |
| 7 | **`buildDiffPatch` 與 `buildTemplatePatch` 重複的檔案寫入邏輯**：兩個函式（optimizer.ts:1147-1196 與 1199-1231）包含完全相同的 4 行代碼：`getProjectRoot` + `resolve` + `mkdir` + `writeFile`，寫入同一個檔案路徑 `skill-optimization-patch.md`。 | 重複的檔案 I/O 邏輯 | `optimizer.ts` | 1147-1231 | 冗余代碼 |
| 8 | **`reporter.ts` issueToTestMap 鍵值碰撞風險**：反向索引使用 `issue.description.substring(0, 80)` 作為 Map 鍵值（第 135 行）。兩個不同 issue 若前 80 個字元相同（但完整描述不同），會被錯誤合併到同一個鍵值下，導致受影響測試的統計不準確。 | 報告中 issue 與測試的關聯可能不正確 | `reporter.ts` | 135 | 架構瑕疵 |
| 9 | **`optimizer.ts` applySkillChanges 使用 `replace` 而非 `replaceAll`**：FIND/REPLACE 模式比對使用 `string.replace()`（第 1007-1015 行），僅取代首次匹配。若 SKILL.md 中相同文字出現多次（如重複的 section header），後續匹配不會被替換。 | FIND/REPLACE 在重複文字場景下不完整 | `optimizer.ts` | 971-1023 | 架構瑕疵 |
| 10 | **API 錯誤回應內容可能包含敏感資訊**：`judge-api.ts:78` 和 `judge-api.ts:211` 將完整的 API 回應 body 內容直接拼接進 Error 訊息（`${errorText}`）。某些 API 在錯誤回應中可能回顯請求的一部分，若回應包含敏感標頭資訊則有洩漏風險。 | API 錯誤訊息可能意外洩漏敏感資訊到日誌 | `judge-api.ts` | 78, 211 | 架構瑕疵 |

### P3 — 建議改善

| # | 問題描述 | 影響 | 檔案 | 行數 | 審查維度 |
|---|--------|------|------|------|---------|
| 11 | **`buildJudgePrompt` 對同一 trace 陣列連續三次 `.find()`**：分別搜尋 thinking、response、end 事件（scorer.ts:162-164），每次 O(n) 完整遍歷。可改用單次 `reduce` 一次收集所有需要的事件類型。 | 不必要的重複陣列遍歷 | `scorer.ts` | 162-164 | 性能隱患 |
| 12 | **`sampleQuestions` 四次 `.filter()` 完整陣列遍歷**：依難度分類三次（basic/advanced/edge）加上排除已選題目一次（question-loader.ts:87-89, 112），每次建立新陣列。可合併為單次 `reduce` 一次性分類。 | 大型題庫下不必要的記憶體分配 | `question-loader.ts` | 87-89, 112 | 性能隱患 |
| 13 | **多個符號不必要地 export**：`scanForDoneAsync`（scorer.ts:624）、`ToolDispatcher` 介面（isolation.ts:32）、`RawIssue`（optimizer.ts:28）、`OptimizationPlan`（optimizer.ts:46）、`extractKeywords`（optimizer.ts:297）、`jaccardSimilarity`（optimizer.ts:329）、`Question` re-export（question-loader.ts:23）均僅在定義模組內部使用或無外部消費者。 | 不必要的 export 增加公開 API 表面積 | `scorer.ts`, `isolation.ts`, `optimizer.ts`, `question-loader.ts` | 如上 | 冗余代碼 |
| 14 | **`question-loader.ts` 中存在僅被死碼使用的 import**：`generateVariants`（第 17 行）和 `EnvConfig` type（第 19 行）僅被 `supplyQuestions` 死函式使用。 | 死碼相關的 import 雜訊 | `question-loader.ts` | 17, 19 | 冗余代碼 |
| 15 | **Frontmatter 驗證僅用正則表達式，非 YAML 語法解析**：Spec R1.4 要求優化後的 YAML frontmatter 有效。實作僅檢查 `---` 分隔符存在（optimizer.ts:1289-1306），不驗證 YAML 語法（縮排錯誤、未跳脫字元、無效資料類型等）。雖有備份還原安全網，但不符合 Spec 對 YAML 有效性的要求。 | YAML 語法錯誤可能通過驗證 | `optimizer.ts` | 1289-1306 | 實作遺漏 |
| 16 | **報告中 evidence 截斷至 80 字元、description 截斷至 60 字元**：Spec R3.3 要求軌跡引用精確到 JSONL 行號。截斷可能導致部分證據上下文遺失，影響可追溯性。 | 長證據／描述的上下文遺失 | `reporter.ts` | 268-269 | 實作偏移 |
| 17 | **`env-utils.ts` 首行包含 `#!/usr/bin/env node` shebang**：該檔案為庫模組（被其他模組 import），非 CLI 入口點。shebang 對庫檔案無作用，可能造成混淆。 | 輕微檔案格式問題 | `lib/env-utils.ts` | 1 | 架構瑕疵 |
| 18 | **`promise-pool.ts` 共享可變 index 變數的脆弱性**：多個 worker 協程共享 `index` 變數，依賴 JavaScript 單執行緒特性保證安全。程式碼註解也明確警告「do NOT add await between index++ and the fn() call」。任何未來重構都可能引入難以除錯的競態條件。 | 未來重構時可能引入並發錯誤 | `lib/promise-pool.ts` | 22-31 | 架構瑕疵 |
| 19 | **`isolation.ts` 路徑防護中的 `rel === fullPath` 為死條件**：在 macOS/Linux 上，`path.relative` 對同一檔案系統的路徑永遠回傳相對路徑，不會等於 `fullPath`（絕對路徑）。此條件可能僅對 Windows 不同磁碟機代號有意義。 | 死程式碼 | `isolation.ts` | 145 | 架構瑕疵 |
| 20 | **`scorer.ts` JUDGE_DIMENSIONS 使用 3 維度權重，但題目評分標準為 4 維度**：`JUDGE_DIMENSIONS` 硬編碼 3 個維度（指令遵循 0.33 / 工具調用 0.33 / 結果質量 0.34），但 `question-utils.ts` 的 `ScoringCriteria` 定義了 4 個維度（outcome/process/style/efficiency）。評分提示詞將原始評分標準作為參考傳入（scorer.ts:264），但最終評分只按 3 個維度進行，缺少從 4 維度到 3 維度的顯式映射邏輯。 | 評分維度與題目評分標準不完全對應 | `scorer.ts` | 117-118 | 架構瑕疵 |

---

## 審查維度摘要

- **幻覺代碼**: 無發現 — 12 個檔案共 30+ imports、35+ 函式呼叫、14 個 env var 引用全部交叉驗證通過；零 `any` 型別使用（連續第四輪零發現）
- **冗余代碼**: 6 個 finding（P2: supplyQuestions 死碼 + walkDir 重複 + lock 模式重複 + patch 寫入重複；P3: 不必要 exports + 死碼 import）
- **實作偏移**: 3 個 finding（P1: 關鍵字優先去重 + P2: dry-run 模板佔位 + P3: reporter 截斷）
- **實作遺漏**: 2 個 finding（P2: 變體生成未接入主流程 + P3: YAML 驗證非解析）
- **架構瑕疵**: 10 個 finding（P1: executor SIGINT 殘留 + P2: issueToTestMap 碰撞 + replace 非 replaceAll + API 敏感資訊 + P3: shebang + promise-pool 脆弱 + dead code + 維度不匹配 + 不必要 exports）
- **性能隱患**: 3 個 finding（P1: O(n²) 去重 + LLM 洪水 合併至上列 P1#2 + P3: triple .find() + 四次 .filter()）

---

## Review History

> **2026-05-29 (Round 1)**: 首次審查 — 發現 25 個問題（2 P0 + 13 P1 + 9 P2 + 1 P3）。核心缺陷為 isolation.ts 未整合至 executor pipeline、軌跡引用未達 JSONL 行號精度。Verdict: Needs Work。
>
> **2026-05-29 (Round 2)**: 修復後再審查（commit `91863d7`）。確認 Round 1 全部 25 個問題已修復。發現 12 個殘留問題（4 P1 + 8 P2/P3）。Verdict: Needs Work。
>
> **2026-05-29 (Round 3)**: 修復後再審查（commit `5f2061b`）。發現 commit message 與實作不一致、死碼模組等 18 個問題（1 P0 + 7 P1 + 6 P2 + 4 P3）。Verdict: Needs Work。
>
> **2026-05-29 (Round 4)**: 修復後再審查（commits `a5f6db3` + `569335b`）。確認 Round 3 全部 18 個問題已修復。新發現 26 個問題（6 P1 + 11 P2 + 9 P3），最關鍵者為 LLM 變體生成缺失、`[simulated]` 標記洩漏。Verdict: Needs Work。
>
> **2026-05-29 (Round 5)**: 修復後再審查（commits `a5f6db3` + `569335b`）。確認 Round 4 全部 26 個問題已正確修復。幻覺代碼零發現。Spec 實作遺漏審查確認全部 20 個需求與 14 個錯誤案例已完成實作（首次達到 100% 覆蓋率）。新發現 32 個問題（0 P0 + 6 P1 + 14 P2 + 12 P3）。Verdict: Needs Work。
>
> **2026-05-29 (Round 6)**: 修復後再審查（commit `372484f`）。確認 Round 5 全部 32 個問題已正確修復。幻覺代碼零發現，實作遺漏零發現（100% 覆蓋率）。新發現 20 個問題（0 P0 + 3 P1 + 5 P2 + 12 P3），最關鍵者為 dry-run 不產出 diff、Bash `find -exec` 繞過白名單、Bash 安全命令缺少 workspace 路徑防護。Verdict: Needs Work。
>
> **2026-05-29 (Round 7)**: 修復後再審查（commit `5d92280`）。確認 Round 6 全部 20 個問題已正確修復。幻覺代碼零發現，實作遺漏零發現（100% 覆蓋率）。新發現 20 個問題（1 P0 + 3 P1 + 8 P2 + 8 P3），最關鍵者為 SIGINT handler 註冊順序衝突導致 exec-lock 永久洩漏（P0 — 每次 Ctrl+C 後需手動刪除 `.exec-lock`）。Verdict: Needs Work。
>
> **2026-05-30 (Round 8 — 本次)**: 修復後再審查（commit `c086626`）。確認 Round 7 全部 20 個問題已正確修復。幻覺代碼連續第四輪零發現，Spec 28 需求 + 14 錯誤案例維持 100% 覆蓋率。新發現 **20 個問題（2 P1 + 8 P2 + 10 P3）**，最關鍵者為 **executor.ts SIGINT handler 殘留 `process.exit(1)`**（Round 7 修復的殘留 — executor 的 sigintCleanup 仍呼叫 process.exit(1)，阻止 index.ts 的 finally 區塊執行優雅關閉），以及 **去重架構本質上為關鍵字優先而非 Spec 要求的語意優先**（Phase 1 Jaccard 關鍵字相似度為主要機制、O(n²) 效能、Phase 2 LLM 語意精煉為條件性補充且有關鍵字預過濾器）。Verdict: Needs Work。
