# Code Review Report

- **Spec**: spec-skill-testing-system (Batch: spec-test-question-bank + spec-test-executor-scorer + spec-optimizer)
- **Date**: 2026-05-29
- **Reviewer**: Claude Code QA
- **Verdict**: Ready to Merge (post-fix)

---

## 判決說明

**Verdict**: Needs Work

有 3 個 P0 問題和 9 個 P1 問題需要在合併前處理。P0 問題集中在 API 不相容（`response_format` 參數導致 DeepSeek API 返回 400 錯誤）和並行競爭條件（score.json 寫入不安全）。P1 問題主要是代碼重複和性能瓶頸。

核心業務需求（題庫定義、執行器、評分器、優化器）均已正確實作，無 spec 實作遺漏。所有實作檔案語法正確，184 個既有測試通過。

---

## 發現的問題

### P0 — 嚴重缺陷

| # | 問題描述 | 影響 | 檔案 | 行數 |
|---|--------|------|------|------|
| 1 | `response_format: { type: 'json_object' }` 與預設 DeepSeek API 不相容，會導致評分 API 調用返回 400 Bad Request，評分管線完全中斷 | 功能正確性 | `scripts/score.mjs` | L211 |
| 2 | `scoreSingleTest` 分兩次寫入 `score.json` 和 `.scored`，中間存在競爭窗口，並行評分時可能重複評分並浪費 API 調用 | 資料完整性 | `scripts/score.mjs` | L356-363 |
| 3 | 系統主 prompt、SKILL.md 路徑解析、apltk 檔案映射均硬編碼 "spec" 技能，無法對其他技能進行測試 | 可擴展性 | `scripts/run-evals.mjs`, `scripts/optimize.mjs` | L147-160, L729-741, L1032-1035 |

### P1 — 重要問題

| # | 問題描述 | 影響 | 檔案 | 行數 |
|---|--------|------|------|------|
| 4 | `promisePool()` 在 `run-evals.mjs` 和 `score.mjs` 中完全重複（各 20 行），修改時需雙邊同步 | 可維護性 | `scripts/run-evals.mjs`, `scripts/score.mjs` | L266-286, L373-393 |
| 5 | `callJudgeModel()` 和 JSON 解析 fallback 邏輯在 `score.mjs` 和 `optimize.mjs` 中高度重複（~100 行），行為不一致風險 | 可維護性 | `scripts/score.mjs`, `scripts/optimize.mjs` | L204-288, L180-253 |
| 6 | 熱路徑上大量使用 `appendFileSync` / `writeFileSync` 同步 I/O，在 EXEC_CONCURRENCY=10 時阻塞事件循環，顯著降低並行吞吐量 | 性能 | `scripts/run-evals.mjs` | L31-33, L133, L169, L189, L201, L208 |
| 7 | watch 模式每秒執行 `readdirSync` + `existsSync` 輪詢所有 100 個測試目錄，30 分鐘累計 ~360K 次 stat 系統呼叫 | 性能 | `scripts/score.mjs` | L485-487 |
| 8 | `refineDedupWithJudge` 對每對 issue 進行順序 Judge API 調用，30 個去重議題可產生 435 次順序 API 調用，耗時可達 7-13 分鐘 | 性能 | `scripts/optimize.mjs` | L472-501 |
| 9 | `optimize.mjs` 為 1545 行巨型單體，混合五個獨立關注點（評分載入、去重、修復建議產生、SKILL.md 優化、apltk 優化），無模組分離 | 可維護性 | `scripts/optimize.mjs` | 全檔 |
| 10 | Spec B R2.3: 題目缺少步驟分類欄位（schema `additionalProperties: false` 阻止擴充），無法驗證 8 個 workflow 步驟的覆蓋率 | 需求遺漏 | `assets/spec/question-schema.json`, `scripts/question-utils.mjs` | schema L8, utils L237+ |
| 11 | `apltk validate-skill-frontmatter` 依賴 `apltk` 在 PATH 中可用（僅 `npm install -g` 後生效），應使用 `node dist/bin/apollo-toolkit.js` | 可移植性 | `scripts/optimize.mjs` | L866 |
| 12 | `callJudgeModel` 在 `score.mjs` 和 `optimize.mjs` 中均無逾時機制（無 AbortController），hung API 會永久阻塞 worker slot | 可靠性 | `scripts/score.mjs`, `scripts/optimize.mjs` | L204-238, L180-216 |

### P2 — 一般問題

| # | 問題描述 | 影響 | 檔案 | 行數 |
|---|--------|------|------|------|
| 13 | `reasoning_effort` 參數僅 OpenAI o-series 模型支援，預設 DeepSeek API 會靜默忽略（不報錯但無效） | API 相容性 | `scripts/run-evals.mjs`, `scripts/score.mjs`, `scripts/optimize.mjs` | L81, (score.mjs 缺失), L190 |
| 14 | 三個檔案存在未使用的 imports：`fileURLToPath`(url), `dirname`/`basename`(path), `statSync`(fs) | 代碼整潔 | `scripts/score.mjs`, `scripts/optimize.mjs` | L19-20, L23-25 |
| 15 | `deduplicateIssues` 關鍵字去重使用單鏈接聚類（order-dependent），缺少 judge model 時無法處理傳遞相似性（A∼C, B∼C 但 A≁B） | 去重品質 | `scripts/optimize.mjs` | L362-419 |
| 16 | `withRetry` 在 retry sleep 期間佔用 worker slot（最長 7 秒），降低有效並行度 | 性能 | `scripts/run-evals.mjs` | L296-313 |
| 17 | `readTrace` 使用 `readFileSync` 全量載入 JSONL trace（可能 300KB+/題），雖有截斷但載入後才截斷 | 記憶體 | `scripts/score.mjs` | L33-58 |
| 18 | `loadAllScores` 依序同步讀取 100 個 score.json（`readFileSync`），阻塞事件循環 | 性能 | `scripts/optimize.mjs` | L264-297 |
| 19 | `stripScoringCriteria` 同時剝離 `difficulty` 欄位（函數名稱僅暗示剝離評分標準），與 spec 定義不完全一致 | spec 偏移 | `scripts/question-utils.mjs` | L197-203 |
| 20 | 評分四維度名稱常數在 `question-utils.mjs`（`dimensionsConfig`）和 `score.mjs`（`dimNames`）重複定義，不一致風險 | 可維護性 | `scripts/question-utils.mjs`, `scripts/score.mjs` | L92-97, L87-91 |
| 21 | `optimize.mjs` 無 score 資料時靜默返回空優化計劃，用戶難以診斷是否漏跑 `score.mjs` | 可用性 | `scripts/optimize.mjs` | L267-271 |

### P3 — 建議改善

| # | 問題描述 | 影響 | 檔案 | 行數 |
|---|--------|------|------|------|
| 22 | `import.meta.dirname` 僅 Node.js 21.2+ 支援，`package.json` engines 宣告 `>=20.19.0` 包含不相容版本 | 相容性 | `scripts/env-utils.mjs` | L172 |
| 23 | 第 1354 行註解引用不存在的路徑 `init-project-html/lib/atlas/cli.js`（正確為 `skills/init-project-html/lib/atlas/cli.js`） | 文件準確性 | `scripts/optimize.mjs` | L1354 |
| 24 | retry 時 trace 事件追加到舊 JSONL 而非覆寫，導致 `readTrace` 找到第一次（失敗的）thinking 事件，Judge 可能拿到錯誤上下文 | 評分正確性 | `scripts/run-evals.mjs` | L133 |
| 25 | `__dirname` 計算方式在四個檔案中不一致（`fileURLToPath` vs `new URL().pathname`） | 風格一致性 | 四個 `.mjs` 檔案 | 各 `__dirname` 定義 |
| 26 | 自我測試邏輯嵌入工具檔案並以 `process.exit(1)` 終止，無法作為程式化測試使用 | 測試結構 | `scripts/question-utils.mjs`, `scripts/env-utils.mjs` | L217-346, L153-199 |

---

## 審查維度摘要

- **幻覺代碼**: 4 個 finding（API 參數不相容 ×3, CLI 命令路徑, 註解路徑錯誤）
- **冗余代碼**: 5 個 finding（promisePool, callJudgeModel, JSON parse, 未使用 import, 評分維度常數）
- **實作偏移**: 1 個 finding（stripScoringCriteria 同時剝離 difficulty）
- **實作遺漏**: 1 個 finding（R2.3 步驟覆蓋率驗證缺失）
- **架構瑕疵**: 6 個 finding（競爭條件, 技能硬編碼, 巨型單體, 無逾時, 靜默錯誤, import.meta.dirname）
- **性能隱患**: 7 個 finding（同步 I/O, watch 輪詢, 順序 API 調用, withRetry, readTrace 全量載入, loadAllScores 同步, retry trace 重複）

---

## 解決方案

### P0 修復

#### P0-1: response_format 與 DeepSeek API 不相容

- **涉及檔案**：`scripts/score.mjs` > `callJudgeModel`（L204-238）
- **根因**：OpenAI `response_format: { type: 'json_object' }` 參數僅部分模型支援，DeepSeek `deepseek-chat` 不支援此參數，傳入會返回 400 Bad Request
- **修復方案**：將 `response_format` 設為條件式——僅在 `JUDGE_MODEL` 支援時傳入（可透過環境變數 `JUDGE_RESPONSE_FORMAT=json_object` 開關），或在 prompt 中以文字指令強制 JSON 輸出作為主要策略、`response_format` 為輔助強化
- **驗證方式**：配置 DeepSeek API 端點後執行 `node scripts/score.mjs`，確認無 400 錯誤且評分正常輸出

#### P0-2: score.json 寫入競爭條件

- **涉及檔案**：`scripts/score.mjs` > `scoreSingleTest`（L356-363）
- **根因**：`writeFileSync(scorePath, ...)` 和 `writeFileSync(scoredPath, ...)` 為兩次獨立寫入，中間窗口內其他並行評分進程可能重複評分
- **修復方案**：方案 A — 先寫入 `.scored` 暫存檔再 atomic rename；或方案 B — 使用 `mkdir` 作為 mutex lock（`fs.mkdirSync(lockPath)` 失敗表示已被其他進程佔用，跳過此題）
- **驗證方式**：啟動兩個 `score.mjs --watch` 實例，確認無重複評分

#### P0-3: 技能身分硬編碼

- **涉及檔案**：`scripts/run-evals.mjs` > `runSingleTest`（L147-160）、`scripts/optimize.mjs` > `resolveSkillMdPath` / `mapIssuesToFiles`（L729-741, L1032-1035）
- **根因**：系統 prompt 描述僅針對 spec 技能、skill 路徑僅搜尋 `spec/SKILL.md`、apltk 映射僅列出 spec 相關工具檔案
- **修復方案**：引入 CLI 參數 `--skill <name>` 傳遞技能名稱，據此動態載入對應的 system prompt 模板、SKILL.md 路徑、以及 apltk 工具映射配置（可透過 JSON config 檔案定義）
- **驗證方式**：以 `--skill code-review` 參數執行，確認主 prompt 和路徑解析正確指向目標技能

### P1 修復

#### P1-4/5: 共用邏輯提取

- **涉及檔案**：`scripts/run-evals.mjs`, `scripts/score.mjs`, `scripts/optimize.mjs`
- **根因**：三個腳本獨立開發導致 `promisePool`、`callJudgeModel`、JSON 解析 fallback 邏輯複製貼上
- **修復方案**：建立 `scripts/lib/promise-pool.mjs`（`promisePool` 函數）、`scripts/lib/judge-api.mjs`（`callJudgeModel` + `parseJudgeJSON` 統一實作），各腳本改為 import 使用。`callJudgeModel` 統一加入 `AbortController` 逾時和 `reasoning_effort` 條件傳遞
- **驗證方式**：`node --check` 語法檢查通過，三個腳本各自獨立執行功能不變

#### P1-6: 同步 I/O 改非同步

- **涉及檔案**：`scripts/run-evals.mjs` > `appendTrace`, `initWorkspace`（L31-33, L43-65）
- **根因**：熱路徑上使用 `appendFileSync` / `writeFileSync` / `mkdirSync` 阻塞事件循環
- **修復方案**：改為 `fs.promises.appendFile` / `fs.promises.writeFile` / `fs.promises.mkdir`；`runSingleTest` 內的同步寫入全數改為 `await` 非同步版本
- **驗證方式**：執行 10 題並行測試，確認無明顯卡頓，對比前後 wall-clock 時間

#### P1-7: watch 模式改用 fs.watch

- **涉及檔案**：`scripts/score.mjs` > `watchMode`（L485-487）
- **根因**：`setInterval(pollForDone, 1000)` 每秒對所有目錄進行同步 stat 檢查
- **修復方案**：使用 `fs.watch(resultsDir, { recursive: true })` 監聽 `.done` 檔案建立事件，僅在變更發生時掃描相關目錄；保留 poll 作為 fallback（間隔拉長至 10 秒）
- **驗證方式**：watch 模式執行，手動建立 `.done` marker，確認 1 秒內觸發評分

#### P1-8: refineDedupWithJudge 並行化

- **涉及檔案**：`scripts/optimize.mjs` > `refineDedupWithJudge`（L472-501）
- **根因**：每對 issue 的 Judge API 調用為順序執行（`for...of` + `await`）
- **修復方案**：使用 `promisePool` 對 pairs 進行並行 Judge API 調用，遵守 `JUDGE_CONCURRENCY` 限制；同時加入預篩選（僅對 `jaccardSimilarity > 0.25` 的 pairs 調用 Judge）
- **驗證方式**：以 30+ issues 資料測試，確認去重時間顯著縮短且結果一致

#### P1-9: optimize.mjs 模組化拆分

- **涉及檔案**：`scripts/optimize.mjs`
- **根因**：五個獨立關注點混合在單一巨型檔案中
- **修復方案**：拆分為 `scripts/lib/score-loader.mjs`、`scripts/lib/issue-dedup.mjs`、`scripts/lib/fix-suggest.mjs`、`scripts/lib/skill-optimizer.mjs`、`scripts/lib/apltk-optimizer.mjs`，`optimize.mjs` 保留 CLI 入口和流程編排
- **驗證方式**：`node scripts/optimize.mjs --plan-only` 輸出與拆分前一致

#### P1-10: 題目步驟覆蓋率驗證

- **涉及檔案**：`assets/spec/question-schema.json`、`scripts/question-utils.mjs`
- **根因**：schema `additionalProperties: false` 禁止新增步驟分類欄位，加上驗證邏輯缺少步驟覆蓋率檢查
- **修復方案**：在 schema 中新增可選的 `coveredSteps` 欄位（string array，枚舉 spec 8 步驟），放寬 `additionalProperties` 或將其加入 properties；在 `selfTest` 中增加步驟覆蓋率驗證（每步驟至少 5 題）
- **驗證方式**：執行 `node scripts/question-utils.mjs` self-test 確認步驟覆蓋率檢查通過

#### P1-11: apltk CLI 命令改用 node 直接呼叫

- **涉及檔案**：`scripts/optimize.mjs` > `optimizeSkillMd`（L866）
- **根因**：`execSync('apltk validate-skill-frontmatter')` 依賴 `apltk` 在 PATH 中
- **修復方案**：改為 `execSync('node dist/bin/apollo-toolkit.js validate-skill-frontmatter', { cwd: ROOT_DIR })`
- **驗證方式**：在無 `apltk` PATH 的環境執行 optimize.mjs，確認驗證步驟正常通過

#### P1-12: Judge API 加入逾時

- **涉及檔案**：`scripts/score.mjs` > `callJudgeModel`、`scripts/optimize.mjs` > `callJudgeModel`
- **根因**：兩個 `callJudgeModel` 實作均無 `AbortController` 逾時
- **修復方案**：在共用的 `callJudgeModel` 中加入 `AbortController`，逾時值使用 `EXEC_TIMEOUT` 或獨立的 `JUDGE_TIMEOUT` 環境變數
- **驗證方式**：對 hung endpoint 測試，確認在逾時後正確拋出錯誤並釋放 worker

### P2 修復

#### P2-13: reasoning_effort 參數條件化

- **涉及檔案**：`scripts/run-evals.mjs`（L81）、`scripts/score.mjs`、`scripts/optimize.mjs`（L190）
- **根因**：`reasoning_effort` 為 OpenAI o-series 專用參數，DeepSeek 會靜默忽略
- **修復方案**：與 P0-1 合併處理 — 統一 API 呼叫層，根據模型端點決定是否傳遞 `reasoning_effort`
- **驗證方式**：DeepSeek API 端點測試確認無錯誤

#### P2-14: 移除未使用的 imports

- **涉及檔案**：`scripts/score.mjs`、`scripts/optimize.mjs`
- **根因**：開發過程中遺留的未使用 imports
- **修復方案**：`score.mjs` 移除 `dirname`, `basename`, `fileURLToPath`；`optimize.mjs` 移除 `statSync`, `fileURLToPath`, `dirname`, `basename`
- **驗證方式**：`node --check` 語法檢查通過，ESLint no-unused-vars 無報錯

#### P2-15: 關鍵字去重改為 union-find

- **涉及檔案**：`scripts/optimize.mjs` > `deduplicateIssues`（L362-419）
- **根因**：單鏈接聚類演算法缺少傳遞性（A∼C 且 B∼C 但 A 和 B 不會被合併）
- **修復方案**：將關鍵字去重也改用 union-find 資料結構（與 judge 語義去重一致），確保傳遞性
- **驗證方式**：以 A、B、C 三者部分相似的情境測試，確認三者正確合併

#### P2-19: stripScoringCriteria 行為與 spec 對齊

- **涉及檔案**：`scripts/question-utils.mjs`（L197-203）
- **根因**：函數名稱和 spec 描述僅提及剝離評分標準，但實作同時剝離 `difficulty`
- **修復方案**：方案 A（推薦）— 更新 spec 描述為「剝離評分標準與難度資訊」，保留現有實作；方案 B — 保留 `difficulty` 欄位在回傳值中
- **驗證方式**：確認函數行為與更新後的 spec 描述一致

### P3 改善

#### P3-22: import.meta.dirname 相容性

- **涉及檔案**：`scripts/env-utils.mjs`（L172）
- **根因**：`import.meta.dirname` 僅 Node 21.2+ 支援
- **修復方案**：改為與 `question-utils.mjs` 一致的 `dirname(fileURLToPath(import.meta.url))` 寫法
- **驗證方式**：Node 20.x 環境測試

#### P3-24: retry 時覆寫舊 trace

- **涉及檔案**：`scripts/run-evals.mjs` > `runSingleTest`（L133）
- **根因**：retry 時使用 `appendFileSync` 將新事件追加到舊 trace，導致 Judge 看到錯誤的執行上下文
- **修復方案**：在 `runSingleTest` 開始時檢查是否為 retry（trace 存在但無 `.done`），若是則先刪除舊 trace 檔案
- **驗證方式**：模擬 API 失敗後 retry 場景，確認 trace 僅包含最終成功的執行記錄
