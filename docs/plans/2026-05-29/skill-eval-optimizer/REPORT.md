# Review Report

- **Spec**: skill-eval-optimizer (eval-core + optimize-and-integrate)
- **Date**: 2026-05-29
- **Reviewer**: Claude Code Review Agent
- **Verdict**: Needs Work

---

## 判決說明

**Verdict**: Needs Work

有 2 個 P0 嚴重缺陷（isolation.ts 未整合至 executor pipeline、軌跡引用未達 JSONL 行號精度），以及多項 P1 功能遺漏與架構問題。核心評測流程（出題 → 執行 → 評分 → 報告）可運作，但 R4 上下文隔離與工具模擬需求實質上未實作，ALLOWED_FILES 白名單定義但未被強制，多項 spec 定義的錯誤案例覆蓋不完整。

---

## 發現的問題

### P0 — 嚴重缺陷

| # | 問題描述 | 影響 | 檔案 | 行數 | 審查維度 |
|---|--------|------|------|------|---------|
| 1 | **isolation.ts 工具模擬層完全未被整合至 executor pipeline**：`isolation.ts` 定義了 `ToolDispatcher`、`createToolDispatcher`、`createFreshContext`、`validateIsolation` 等完整的工具攔截與上下文隔離機制，但 executor.ts 的 `runSingleTest()` 僅做純文字對話呼叫（`callExecModel` 傳入 system+user messages），無 tool-use loop，且無任何檔案 import isolation.ts。這導致 optimize-and-integrate SPEC 的 R4.1（工具模擬透明化）和 R4.2（mock 回傳值含正確性資訊）完全未滿足。 | 被評測模型在評測過程中無法使用工具，評測無法反映真實技能執行路徑；R4 需求實質上未實作 | `executor.ts` | L169-224 | 實作偏移、實作遺漏 |
| 2 | **報告中的軌跡引用未精確到 JSONL 行號**：SPEC R3.3 明確要求「報告中的軌跡引用精確到 JSONL 行號」。`TraceEvent` 型別不含行號欄位，`readTrace()` 僅在 parse_error 事件記錄行號，普通事件不帶行號；`buildJudgePrompt()` 未指示評分模型在 issue 中引用行號；reporter.ts `generateReport()` 的 issue 摘要不包含任何 JSONL 行號參考。 | 評分報告中的問題無法精確定位到軌跡中的具體事件，降低報告可追溯性和 debug 效率 | `scorer.ts` | L129-164, L181-282 | 實作遺漏 |

### P1 — 重要問題

| # | 問題描述 | 影響 | 檔案 | 行數 | 審查維度 |
|---|--------|------|------|------|---------|
| 1 | **`getProjectRoot()` 重複實作 4 次 + index.ts 路徑層數錯誤**：相同邏輯在 `scorer.ts`、`reporter.ts`、`executor.ts`、`index.ts` 中各自實作。index.ts 的 `resolveProjectRoot()` 使用 source=4 層 `..`、dist=5 層 `..`，而其他三模組正確使用 source=3、dist=4。index.ts 的錯誤層數導致 `assets/spec/` 檢查必定失敗，每次都只能靠 fallback 從 `cwd` 向上爬行。 | 非專案根目錄執行 CLI 時可能找錯路徑；重複邏輯增加維護負擔（修改需同步四處） | `index.ts`, `scorer.ts`, `reporter.ts`, `executor.ts` | index.ts:54-84, scorer.ts:70-98, reporter.ts:314-342, executor.ts:63-85 | 冗余代碼、幻覺代碼 |
| 2 | **`isolation.ts` 整個模組未被任何檔案匯入或使用**：`ToolDispatcher`、`createToolDispatcher`、`createFreshContext`、`validateIsolation` 等全部匯出符號在 packages/ 目錄下零引用。221 行代碼完全孤立。 | 死代碼佔用維護成本；若為未來功能應標註，否則應刪除 | `isolation.ts` | L1-221 | 冗余代碼 |
| 3 | **`executor.ts` 的 `ToolCallRecord` 型別未被使用**：定義匯出但無其他模組引用。且與 `isolation.ts` 中的同名型別定義不同（前者無 timestamp，後者有），造成命名衝突隱患。 | 死代碼 + 命名衝突風險 | `executor.ts` | L40-44 | 冗余代碼 |
| 4 | **`scorer.ts` scoreAllTests 對每個測試重複讀取 test-questions.json**：`scoreAllTests` 不傳入 `questionMap`，導致 N 個測試重複讀取解析同一 JSON 檔案 N 次。`watchMode` 路徑已正確實作預載入（scorer.ts:517-528），但 `scoreAllTests` 路徑遺漏。 | N 題評分時重複 I/O N 次，標準模式 8-12 題影響顯著 | `scorer.ts` | L322-323, cf. L517-528 | 性能隱患 |
| 5 | **`optimizer.ts` refineDedupWithJudge 存在 O(n²) pairwise API 呼叫**：同一 category 內所有 deduped issues 兩兩成對比較，形成 n*(n-1)/2 個 pair，每個 pair 呼叫 judge API。30 個同類 issue 即產生 435 次 API 呼叫。雖有 Jaccard 預過濾，但 keyword extraction 和 Jaccard 計算本身仍需對每一對執行。 | 大量 issue 時 API 成本急劇增長，評測時間線性膨脹 | `optimizer.ts` | L350-368 | 性能隱患 |
| 6 | **磁碟空間檢查未實作**：SPEC eval-core 錯誤案例明列「磁碟空間不足無法寫入軌跡：提前檢查可用空間，不足時中止並報錯」，但整個 eval 程式碼庫中無任何磁碟空間檢查邏輯。 | 磁碟滿時 trace 寫入失敗，可能產生不完整 JSONL 而未被正確處理 | N/A | N/A | 實作遺漏 |
| 7 | **JSONL 軌跡損壞時報告缺少「無法評分」標記**：`readTrace()` 對損壞行記錄 parse_error 後繼續處理，但 reporter.ts 的 `generateReport()` 無「無法評分」標記概念。損壞軌跡若最終產出 score.json（可能是部分評分），報告不會區分「已評分」與「無法評分」。 | 損壞的評分結果與正常結果在報告中無法區分 | `scorer.ts`, `reporter.ts` | scorer.ts:127-134, reporter.ts:1-371 | 實作遺漏 |
| 8 | **CI 分數門檻不可配置**：SPEC R3.2 要求「分數門檻和 P0 問題數量閾值可配置」，但 `eval.yml` 中無任何 threshold 設定，且 `continue-on-error: true` 使評測永遠不阻塞 PR。 | CI 閘門形同虛設——無論評測結果如何 PR 都會通過 | `.github/workflows/eval.yml` | L41 | 實作遺漏 |
| 9 | **ALLOWED_FILES 白名單定義但未被強制**：`optimizer.ts` L113-118 定義了 `ALLOWED_FILES` 常數（限制修改 skills/<name>/SKILL.md、scripts/、references/、assets/），但此常數在整個程式碼中零引用。`optimizeSkillMd()` 僅操作 SKILL.md（de facto 不修改其他目錄），但無白名單檢查機制防止未來的變更繞過限制。 | 系統不變量「優化 diff 不修改技能目錄外的檔案」無程式碼強制保障 | `optimizer.ts` | L113-118 | 實作遺漏、架構瑕疵 |
| 10 | **優化後僅驗證 YAML frontmatter 不驗證 Markdown 結構**：SPEC R1.4 要求「優化後的技能檔案語法保持正確（Markdown 結構完整、YAML frontmatter 有效）」。`optimizeSkillMd()` 僅執行 `frontmatter validate`，不檢查 Markdown 章節標題完整性、內容結構。 | 優化 diff 可能破壞 SKILL.md 的章節結構未被偵測 | `optimizer.ts` | L1100-1117 | 實作遺漏 |
| 11 | **執行階段無並發鎖防止多進程同時評測**：`scorer.ts` 的 `scoreSingleTest` 有 mkdir-based `.scoring-lock`，但 `executor.ts` 的 `runSingleTest` 無任何鎖機制。兩個 eval 進程可同時執行並覆蓋彼此的 trace 檔案。 | 並發衝突可能導致 trace 資料損壞 | `executor.ts` | L169-224 | 實作遺漏、架構瑕疵 |
| 12 | **優化 diff 衝突無「保留雙方版本」機制**：SPEC 錯誤案例要求「合併失敗時保留雙方版本，由人解決」。`applySkillChanges()` 在 FIND pattern 不匹配時靜默回傳原始內容，無衝突標記或雙方版本保留。 | FIND/REPLACE 匹配失敗時靜默無視，使用者無法得知哪些變更未套用 | `optimizer.ts` | L857-903 | 實作遺漏 |
| 13 | **scorer.ts 大量同步 I/O 阻斷 event loop**：`readTrace()` 使用 `readFileSync` + `.split('\n')` 一次載入完整 trace；`scoreSingleTest()` 使用 `writeFileSync`、`mkdirSync`、`rmSync`。這些在 `promisePool` 並發 worker 中被呼叫，阻斷其他並發 API 請求的處理。 | 並發評分時實際吞吐量低於預期，event loop 被頻繁阻斷 | `scorer.ts` | L117, L370, L383-388 | 性能隱患、架構瑕疵 |

### P2 — 一般問題

| # | 問題描述 | 影響 | 檔案 | 行數 | 審查維度 |
|---|--------|------|------|------|---------|
| 1 | **help 文字範例使用 `--optimise`（英式拼寫）但程式只辨識 `--optimize`**：使用者複製 help 範例中的 `--optimise` 會發現 flag 無效。 | 使用者困惑 | `index.ts` | L197 | 幻覺代碼 |
| 2 | **optimizer.ts 警告訊息引用已廢棄的 .mjs 腳本**：`"Run run-evals.mjs and score.mjs first."` 引用了 TypeScript 遷移後已不存在的舊腳本名稱。 | 使用者無法按訊息指引操作 | `optimizer.ts` | L205 | 幻覺代碼 |
| 3 | **question-loader.ts 錯誤訊息建議不存在的 `--questions` CLI flag**：訊息建議使用 `--questions` 旗標指定題目檔案，但 `index.ts` 的 `parseArgs()` 從未解析此旗標，SPEC/DESIGN 亦未定義。 | 使用者嘗試無效旗標增加困惑 | `question-loader.ts` | L60 | 幻覺代碼 |
| 4 | **`env-utils.ts` selfTest 路徑錯誤**：`.env.example` 路徑指向 `packages/tools/eval/.env.example`（從 lib/ 往上一層），但實際 `.env.example` 位於專案根目錄。不影響生產路徑。 | 自我測試失敗 | `lib/env-utils.ts` | L225 | 幻覺代碼 |
| 5 | **`question-loader.ts` 匯入未使用的 `ScoringCriteria` 型別** | 編譯無影響，僅整潔度 | `question-loader.ts` | L19 | 冗余代碼 |
| 6 | **`optimizer.ts` 私有函式有多個未使用的 `_` 前綴參數**：`applySkillChanges` 的 `_hasFrontmatter`、`_frontmatterEnd`；`generateSkillTemplateChanges` 的 `_currentContent`。私有函式無外部 API 相容性需求。 | 代碼整潔度 | `optimizer.ts` | L857-862, L915-917 | 冗余代碼 |
| 7 | **`env-utils.ts` 和 `question-utils.ts` 的 selfTest 直接執行模式重複**：相同模式（檢查 `process.argv[1]` 匹配自身檔名觸發 selfTest）出現兩次。 | 輕微維護負擔 | `lib/env-utils.ts`, `lib/question-utils.ts` | env-utils.ts:248-256, question-utils.ts:484-492 | 冗余代碼 |
| 8 | **reporter.ts `generateReport` 存在 O(n³) 巢狀遍歷**：對每個 sortedIssue 執行 `scores.filter(s => s.issues.some(...))`。巢狀結構為 issues × scores × issues_per_score。 | 大量評分結果時報告生成變慢 | `reporter.ts` | L269-274 | 性能隱患 |
| 9 | **optimizer.ts `loadAllScores` 使用同步 I/O**：`readdirSync` + 迴圈內 `readFileSync` 逐一讀取 score.json。 | 大量評分結果時阻斷 event loop | `optimizer.ts` | L199-234 | 性能隱患 |
| 10 | **optimizer.ts deduplicateIssues phase 2 重複計算 keyword set**：`refineDedupWithJudge` 對每個 pair 重新呼叫 `extractKeywords()`，但 phase 1 已計算過相同 keyword set。 | 多餘 CPU 計算 | `optimizer.ts` | L361-368 | 性能隱患 |
| 11 | **scorer.ts `readTrace` 使用 readFileSync 一次載入完整 trace**：大型 trace 檔案在記憶體中同時存在原始字串 + 行陣列 + 解析物件三份副本。 | 大型 trace 時記憶體壓力 | `scorer.ts` | L117 | 性能隱患 |
| 12 | **CI 缺少 .env 時無顯式警告**：`continue-on-error: true` 使缺少 secrets 時靜默繼續，無警告訊息。 | CI 日誌中不易發現配置缺失 | `.github/workflows/eval.yml` | L41 | 實作遺漏 |
| 13 | **未檢查 EXEC_MODEL 與 JUDGE_MODEL 是否指向相同模型**：SPEC 錯誤案例要求顯示警告。 | 使用者不知上下文隔離可能失效 | N/A | N/A | 實作遺漏 |
| 14 | **exit code 未反映評分結果**：`index.ts` L370 僅檢查執行 exception（`failed > 0 ? 1 : 0`），不檢查低分。全部測試無 exception 但總分極低時 exit code 仍為 0。 | CI 無法透過 exit code 判斷評測品質 | `index.ts` | L370 | 實作偏移 |

### P3 — 建議改善

| # | 問題描述 | 影響 | 檔案 | 行數 | 審查維度 |
|---|--------|------|------|------|---------|
| 1 | **executor.ts 與 isolation.ts 存在同名但結構不同的 ToolCallRecord 型別**：建議統一定義於共用模組 | 未來整合時的型別衝突風險 | `executor.ts`, `isolation.ts` | executor.ts:40-44, isolation.ts:25-30 | 冗余代碼 |

---

## 審查維度摘要

- **幻覺代碼**: 4 個 finding（P1: index.ts 路徑層數錯誤; P2: help 拼寫不一致、廢棄腳本引用、無效 flag 建議）
- **冗余代碼**: 5 個 finding（P1: getProjectRoot 重複×4、isolation.ts 死代碼、ToolCallRecord 未使用; P2: 未使用 import、未使用參數×3）
- **實作偏移**: 2 個 finding（P0: isolation.ts 未整合; P2: exit code 未反映評分結果）
- **實作遺漏**: 11 個 finding（P0: JSONL 行號引用未實作; P1: 磁碟檢查、無法評分標記、CI 門檻、ALLOWED_FILES、Markdown 驗證、執行鎖、衝突保留; P2: CI 警告、相同模型檢查）
- **架構瑕疵**: 3 個 finding（P1: ALLOWED_FILES 未強制、執行階段無鎖、同步 I/O 阻斷 event loop）
- **性能隱患**: 5 個 finding（P1: 重複讀取 question JSON、O(n²) pairwise API; P2: O(n³) reporter、同步 I/O、重複 keyword 計算）

---

## Review History

> 首次審查，無歷史記錄。
