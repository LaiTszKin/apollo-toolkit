# Code Review Report

- **Spec**: atlas-cli-optimization (第五輪 QA)
- **Date**: 2026-05-27
- **Reviewer**: Claude Opus 4.7 (6-agent parallel QA)
- **Verdict**: Needs Attention

---

## 判決說明

**Verdict**: Needs Attention

四份子 spec（cli-status-and-dry-run、cli-scan-and-validate、evidence-and-mode-detection、dependency-upgrade）的核心功能需求 **50 項全部通過**（Spec A: 10/10, Spec B: 13/13, Spec C: 16/16, Spec D: 3/3）。

發現 **3 項 P1**（皆屬 spec 偏差或行為缺陷）、**8 項 P2**、**9 項 P3**。無 P0 阻斷性問題。

P1 主要集中在：(1) 枚舉值驗證錯誤未按 spec task 要求產生 fix command；(2) 損壞的 YAML 索引檔案導致非 spec 預期的 exit code；(3) `--evidence` flag 在特定 dataflow 情境被靜默丟棄。

---

## 發現的問題

### P1 — 重要問題

| # | 問題描述 | 影響 | 檔案 | 行數 |
|---|--------|------|------|------|
| 1 | 枚舉值錯誤 (side/scope/kind) 未產生 fix command — spec tasks.md T2.3 要求產生 `apltk architecture <entity> set ...` 格式命令，但實作中全部使用 `noFix()` 回傳 null | 使用者遇到枚舉值錯誤時無法獲得自動修復建議，需手動查找合法值 | `schema.js` | L112-114, L123-125, L139-141, L238-240 |
| 2 | 損壞的主索引 YAML (`atlas.index.yaml`) 導致 `status` 回傳 exit code 1 而非 spec 要求的 0 — `readYaml()` 中 `yaml.load()` 拋出例外未被 `load()` 捕捉，向上傳播到 `dispatch()` 的 try/catch | `status --json` 的 consumer (AI agent) 收到 exit code 1 + stderr 錯誤，而非 exit code 0 + JSON validation errors，違反 spec 行為合約 | `state.js`, `cli.js` | state.js L33-38, cli.js L1188-1191 |
| 3 | `--evidence` flag 在純字串 dataflow step 上被靜默丟棄 — `buildDataflowItem` 中當 step 無 fn/reads/writes 時直接回傳純字串，`--evidence` 被忽略且不寫入 YAML | 使用者提供 `--evidence` 但 dataflow step 無其他標註時，evidence 資料靜默遺失，違反 spec R1.4「所有 mutation verb 均支援 --evidence」 | `cli.js` | L482-494 |

### P2 — 一般問題

| # | 問題描述 | 影響 | 檔案 | 行數 |
|---|--------|------|------|------|
| 1 | `diffPages` 對每個 feature/submodule 做 `JSON.stringify` 比較 — 每個 feature 調用 1 次、每個 submodule 調用 1 次、macro 再 1 次 | 大型 atlas (50+ feature) 的 diff/render/merge 延遲線性增長 | `state.js` | L336, L344, L361-363 |
| 2 | `computeDiff` 邊緣比較為 O(n\*m\*k) — 巢狀 `some()` + 每次內部 `JSON.stringify`，對 200 條邊產生 40,000 次序列化調用 | `--dry-run` 在大型 atlas 上延遲顯著，與其「快速預覽」定位矛盾 | `state.js` | L456-468 |
| 3 | `--evidence` 值不含 `:` 時整段應視為 source path 但被當作 level 驗證而報錯 — 例如 `--evidence src/app/handler.ts` 拋出 "Invalid evidence level" 而非推斷為 `inferred` | spec Edge Case 定義的行為未實作 | `schema.js` | L64-74 |
| 4 | SKILL.md design 模式缺少 atlas 目錄已存在（非空）時的 guard 提示 — agent 被指示以 design 模式初始化但目錄已存在時不會提示確認 | spec Edge Case 定義的 guard instruction 缺失 | `SKILL.md` | L31-45 |
| 5 | `cli.js` 對 `./cli-help` 模組重複 require — 一次解構、一次完整導入，為多餘呼叫 | 程式碼雜訊，無功能影響（Node.js 有模組快取） | `cli.js` | L47-48 |
| 6 | `verbDiff` 對 changes 陣列重複遍歷三次（`.filter()` ×3）計算 modified/added/removed 計數 | 不必要的 O(3n) 遍歷；相同計數在 diff-viewer.js 中也重複計算 | `cli.js`, `diff-viewer.js` | cli.js L776-777, diff-viewer.js L25-27 |
| 7 | `--dry-run` 輸出的 diff 物件包含 spec 未定義的額外欄位 (`metaChanged`, `addedActors`, `removedActors`, `addedEdges`, `removedEdges`) | 向後相容（JSON consumer 可忽略未知欄位），但與 spec 嚴格定義的 `{ addedFeatures, modifiedFeatures, removedFeatures }` 不一致 | `state.js`, `cli.js` | state.js L471, cli.js L234 |
| 8 | `_readUndoSnapshot` 和 `_clearUndoSnapshot` 以底線前綴命名但被匯出 — 暗示私有但出現在公開 API 中，僅供測試使用 | 混淆模組的公開 API 合約 | `state.js` | L580-581 |

### P3 — 建議改善

| # | 問題描述 | 影響 | 檔案 | 行數 |
|---|--------|------|------|------|
| 1 | `--evidence` flag 無值時（命令列末尾）產生誤導性錯誤訊息：`Invalid evidence level: "true"` — 應提示 `--evidence requires a value` | 使用者難以理解錯誤原因 | `schema.js` | L64-74 |
| 2 | `scan` suggestion 對純特殊字元目錄名產生無效 kebab-case — regex 鏈清空後降級回傳原始名稱（仍含特殊字元） | 極端邊界案例，實務上不影響正常目錄 | `cli.js` | L706-712 |
| 3 | SKILL.md Mode Detection 缺少四種模式對應的獨立工作流程小節 — spec R3.2 要求每個模式指向對應段落，但目前只有通用步驟 | agent 在特定模式下缺少詳細的步驟指引 | `SKILL.md` | L30-78 |
| 4 | `scan` 使用 pretty-printed JSON (`null, 2`) 而 `status --json` 使用 compact JSON — 兩個 JSON 輸出格式不一致 | 程式碼品質，無功能影響 | `cli.js` | L645, L722 |
| 5 | `toViewerRel` 函數被匯出但僅在 diff-viewer.js 內部使用 — 無外部呼叫者 | 公開 API 污染 | `diff-viewer.js` | L176 |
| 6 | `buildHelpPage` 函數被匯出但僅在 cli-help.js 內部使用 — 無外部呼叫者 | 公開 API 污染 | `cli-help.js` | L1005 |
| 7 | `cli.js` module.exports 中的 `USAGE` getter 未被任何外部程式碼使用 — 唯一生產消費者 (`architecture.ts`) 僅呼叫 `dispatch()` | 無用的間接層 | `cli.js` | L1195 |
| 8 | `SUB_WIDTH` 和 `SUB_HEIGHT` 被匯出但僅在 layout.js 內部作為備用值使用 | 公開 API 污染 | `layout.js` | L478-479 |
| 9 | `performMutation` dry-run 分支中對 `(io \|\| process)` 的防禦性備用 — `io` 參數始終由呼叫者提供 | 與其他位置直接使用 `io` 的風格不一致 | `cli.js` | L234, L236 |

---

## 審查維度摘要

- **幻覺代碼**: 4 個 finding（P2 × 1: evidence 靜默丟棄; P3 × 3: 誤導性錯誤訊息、scan suggestion 降級缺陷、SKILL.md 缺工作流程段落）
- **冗余代碼**: 10 個 finding（P1 × 2: 重複 require/遍歷; P2 × 5: 未使用匯出 ×3、重複邏輯 ×2; P3 × 3: 內部常數匯出、防禦性備用、膨脹的 module.exports）
- **實作偏移**: 4 個 finding（P1 × 1: 枚舉值無 fix command; P2 × 2: dry-run 額外欄位、損壞 YAML exit code; P3 × 1: JSON 格式不一致）
- **實作遺漏**: 2 個 finding（P2 × 2: --evidence source path 推斷、SKILL.md design guard）
- **架構瑕疵**: 無新的 P0-P1 問題（已知的模組職責劃分在前四輪已討論並接受當前狀態）
- **性能隱患**: 2 個 finding（P2 × 2: diffPages/computeDiff 的 JSON.stringify 模式）

---

## 解決方案

### P1 修復

#### P1-1: 枚舉值錯誤未產生 fix command

- **涉及檔案**：`init-project-html/lib/atlas/schema.js` > `validateFunction` (L108-118)、`validateVariable` (L120-129)、`validateSubmodule` (L137-213)、`validateEdge` (L234-246)
- **根因**：這些驗證函數不接收 `featureSlug` / `submoduleSlug` / `formatFix` 參數，因此無法產生有意義的修復命令，一律使用 `noFix()`。
- **修復方案**：
  1. 為 `validateFunction`、`validateVariable`、`validateSubmodule`、`validateEdge` 加入 `featureSlug`、`subSlug`、`formatFix` 參數
  2. 將枚舉值錯誤的 `noFix(...)` 替換為 `{ message, fixCommand: formatFix({ type: '<verb>', action: 'set', feature: featureSlug, submodule: subSlug, name: ..., <field>: <firstValidEnum> }) }`
  3. 更新 `validateSubmodule` 中對這些函數的呼叫點，傳入 `featureSlug` 和 `sub.slug`
- **驗證方式**：`apltk architecture validate` 在 side/scope/kind 枚舉錯誤時輸出 `→ fix:` 行；現有測試保持通過

#### P1-2: 損壞的主索引 YAML 導致 status exit code 1

- **涉及檔案**：`init-project-html/lib/atlas/state.js` > `load()` (L50-80)、`init-project-html/lib/atlas/cli.js` > `verbStatus` (L628-672)
- **根因**：`load()` 中 `readYaml(indexFile)` 的 `yaml.load()` 可能拋出例外，未在函數內捕捉，導致向上傳播到 `dispatch()` 的 catch block 回傳 exit code 1。
- **修復方案**：在 `load()` 中對 `readYaml(indexFile)` 加入 try/catch，返回 emptyState 並附加 `_loadError` 欄位供 validation 報告：
  ```js
  let index;
  try { index = readYaml(indexFile); } catch (e) {
    const state = emptyState();
    state._loadError = `Corrupted atlas index: ${e.message}`;
    return state;
  }
  ```
  或在 `verbStatus` 中單獨捕捉 load 例外。
- **驗證方式**：手動建立損壞的 `atlas.index.yaml`，確認 `apltk architecture status --json` 回傳 exit code 0 且 validation.errors 包含損壞錯誤

#### P1-3: --evidence flag 在純字串 dataflow step 上被靜默丟棄

- **涉及檔案**：`init-project-html/lib/atlas/cli.js` > `verbDataflow` (L437-495)，特別是 `buildDataflowItem` (L482-494)
- **根因**：`buildDataflowItem` 僅在 `fn`、`reads` 或 `writes` 有值時才產生物件格式的 dataflow item，純 step 字串直接回傳，忽略 `--evidence` 旗標。
- **修復方案**：將 `annotated` 的判斷條件加入 `flags.evidence !== undefined`：
  ```js
  const annotated = (fn && fn.length > 0) || (reads && reads.length > 0)
    || (writes && writes.length > 0) || flags.evidence !== undefined;
  ```
- **驗證方式**：`apltk architecture dataflow add --feature X --submodule Y --step "test" --evidence observed` 後檢查 YAML 中 dataflow step 是否包含 evidence 物件

### P2 修復

#### P2-1: diffPages JSON.stringify 性能

- **涉及檔案**：`init-project-html/lib/atlas/state.js` > `diffPages()` (L316-374)
- **根因**：使用 `JSON.stringify` 作為深層比較機制，對每個 feature/submodule/macro 產生大型臨時字串。
- **修復方案**：實作針對 atlas schema 已知結構的 `deepEqual` 遞迴比較函數，在欄位不同時提前短路。優先替換 submodule 比較（L344，觸發次數最多）。
- **驗證方式**：現有 diff 相關測試保持通過；對 50-feature atlas 測量 `apltk architecture diff` 執行時間

#### P2-2: computeDiff O(n\*m\*k) 邊緣比較

- **涉及檔案**：`init-project-html/lib/atlas/state.js` > `computeDiff()` (L452-468)
- **根因**：對 before/after 的每條邊做巢狀 `some()` + `JSON.stringify` 比較。
- **修復方案**：預先建立 edge id（或標準化 key）對應的 Map，用 O(n+m) 的 set difference 取代巢狀查找。
- **驗證方式**：`--dry-run` 在有多條 cross-feature edge 的 atlas 上輸出正確 diff

#### P2-3: --evidence 值不含 `:` 時應視為 source path

- **涉及檔案**：`init-project-html/lib/atlas/schema.js` > `parseEvidence()` (L64-74)
- **根因**：`parseEvidence` 在無冒號時將整段字串作為 level 驗證，而非推斷為 source path。
- **修復方案**：
  ```js
  if (colon === -1) {
    // 無冒號: 整段視為 source path, 預設 level 為 inferred
    return { level: 'inferred', source: str };
  }
  ```
- **驗證方式**：`--evidence src/app/handler.ts` 成功解析為 `{ level: 'inferred', source: 'src/app/handler.ts' }`

#### P2-4: SKILL.md design 模式缺少 guard

- **涉及檔案**：`init-project-html/SKILL.md` > Mode Detection (L31-45)
- **根因**：未包含「agent 預期進入 design 模式但 atlas 目錄已存在且非空」的處理指引。
- **修復方案**：在 Mode Detection 末尾新增 guard instruction。
- **驗證方式**：文件審查確認

#### P2-5: cli.js 對 cli-help 重複 require

- **涉及檔案**：`init-project-html/lib/atlas/cli.js` (L47-48)
- **根因**：同一模組被 require 兩次。
- **修復方案**：合併為 `const cliHelp = require('./cli-help'); const { buildArchitectureHelpPage } = cliHelp;`
- **驗證方式**：`npm test` 全部通過

#### P2-6: verbDiff 對 changes 陣列重複遍歷

- **涉及檔案**：`init-project-html/lib/atlas/cli.js` (L776-777)
- **根因**：`.filter()` 被呼叫三次分別計算 modified/added/removed 數量。
- **修復方案**：改用單次 `reduce` 計算三個計數。
- **驗證方式**：`apltk architecture diff` 輸出一致

#### P2-7: dry-run diff 輸出額外欄位

- **涉及檔案**：`init-project-html/lib/atlas/cli.js` > `performMutation` (L232-234)
- **根因**：`computeDiff()` 回傳了 spec 未定義的額外欄位。
- **修復方案**：在 dry-run 輸出時僅選取 spec 定義的三個欄位，或更新 spec 明確列出所有欄位。
- **驗證方式**：`--dry-run` JSON 輸出欄位確認

#### P2-8: _readUndoSnapshot 和 _clearUndoSnapshot 匯出

- **涉及檔案**：`init-project-html/lib/atlas/state.js` (L580-581)
- **根因**：底線前綴暗示私有但被匯出，僅在測試中使用。
- **修復方案**：從 module.exports 移除，或改為條件匯出（僅 `NODE_ENV === 'test'`）。
- **驗證方式**：無外部程式碼引用這些符號

### P3 改善

#### P3-1: --evidence 無值時的誤導性錯誤訊息

- **涉及檔案**：`init-project-html/lib/atlas/schema.js` > `parseEvidence()` (L64-74)
- **修復方案**：在函數開頭檢查 `typeof value !== 'string'`，拋出 `'--evidence requires a string value (observed, inferred, or assumed)'`

#### P3-2: scan suggestion 對特殊字元目錄名的降級

- **涉及檔案**：`init-project-html/lib/atlas/cli.js` > `verbScan` (L706-712)
- **修復方案**：在 `||` 降級前再加一層 sanitize（`.replace(/[^a-z0-9-]/g, '')`），確保輸出永遠為有效 slug

#### P3-3: SKILL.md 模式工作流程段落

- **涉及檔案**：`init-project-html/SKILL.md` (L47-78)
- **修復方案**：在工作流程段落新增 4.1 design / 4.2 record / 4.3 update / 4.4 review 小節

#### P3-4: scan 與 status --json JSON 格式不一致

- **涉及檔案**：`init-project-html/lib/atlas/cli.js` (L645, L722)
- **修復方案**：統一使用 compact JSON（`JSON.stringify(output)`）

#### P3-5-9: 未使用的匯出清理

- **涉及檔案**：`diff-viewer.js` (L176: `toViewerRel`)、`cli-help.js` (L1005: `buildHelpPage`)、`cli.js` (L1195: `USAGE` getter)、`layout.js` (L478-479: `SUB_WIDTH`/`SUB_HEIGHT`)、`cli.js` (L234: `(io || process)`)
- **修復方案**：從 module.exports 移除僅內部使用的匯出；將 `(io || process)` 替換為直接使用 `io`

---

## 正向確認

以下 spec 需求經六維度審查確認完整正確實作，無發現問題：

- Spec A: `status` (文字/JSON)、`--dry-run` (預覽/不寫入/不渲染)、`--dry-run --spec` merged state
- Spec B: `scan --src <dir>` (過濾/fallback)、suggestion kebab-case、validate fix command 格式、`schema.validate()` 新回傳格式
- Spec C: `--evidence` flag (所有 mutation verb)、evidence 徽章渲染 (CSS/摘要/向後相容)、模式偵測路由、update-project-html SKILL.md
- Spec D: `@types/node ^25.9.1`、`engines.node >=20.19.0`
- 邊界案例: scan 目錄不存在報錯、scan 空目錄輸出 `[]`、status 損壞 feature YAML 不 crash、`--dry-run` remove 不存在 entity 回報空 diff、`--evidence` 不合法值報錯、review 模式無 diff 時 fallback update
