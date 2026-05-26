# Code Review Report

- **Spec**: atlas-cli-optimization (D → B → A → C)
- **Date**: 2026-05-26
- **Reviewer**: QA Agent (6-dimension parallel review)
- **Verdict**: Needs Work

---

## 判決說明

**Verdict**: Needs Work

有 1 個 P0 功能缺陷（`summarize()` edge 計數完全錯誤）必須先修復。另有 5 個 P1 問題（JSON 格式不一致、evidence 資料遺失、重複程式碼、模組歸屬錯誤、多餘深拷貝）建議在合併前處理。

---

## 發現的問題

### P0 — 嚴重缺陷

| # | 問題描述 | 影響 | 檔案 | 行數 |
|---|--------|------|------|------|
| 1 | `summarize()` edge 計數邏輯錯誤：檢查不存在的 `e.scope` 欄位（edge 物件從未被設定 `scope`），導致 `crossFeatureEdges` 永遠為 0、`intraFeatureEdges` 實際顯示的是跨功能邊緣數；`feature.edges` 中的真正 intra-feature edges 完全未計入 | `apltk architecture status`（文字及 JSON）輸出的 edge 計數完全錯誤，誤導使用者與 AI agent | `init-project-html/lib/atlas/state.js` | L388-392 |

### P1 — 重要問題

| # | 問題描述 | 影響 | 檔案 | 行數 |
|---|--------|------|------|------|
| 1 | `status --json` 的 `validation.errors` 輸出物件陣列 `[{message, fixCommand}]` 而非 spec 定義的 `string[]` | JSON consumer 預期 `string[]` 會收到不相容的格式 | `init-project-html/lib/atlas/cli.js` | L1669 |
| 2 | `normalizeFeature()` 和 `normalizeSubmodule()` 在載入 YAML 時未保留 `evidence` 欄位，導致 feature/submodule 層級的 evidence 寫入後在下次載入時被丟棄 | `apltk architecture feature add --evidence "observed:src/"` 的 evidence 無法持久化 | `init-project-html/lib/atlas/state.js` | L76-97 |
| 3 | `htmlEscape` 在 cli.js 和 render.js 中重複定義；cli.js 已匯入 renderLib，應直接使用 `renderLib.htmlEscape` | cli.js 版本的 null 處理較弱（`String(null)` → `"null"`），可能導致 diff viewer 渲染異常 | `init-project-html/lib/atlas/cli.js` | L2130-2137 |
| 4 | `parseEvidence()` 應歸屬於 schema.js（與其他 enum vocabulary 一致）；`computeDiff()` 應歸屬於 state.js（與 `diffPages()` 一致） | 模組職責模糊，外部消費者無法在不依賴 CLI 模組的情況下使用這些函數 | `cli.js` | L1087-1097, L1217-1240 |
| 5 | dry-run 路徑中對同一 `merged` 物件連續做兩次 `JSON.parse(JSON.stringify())`；`mergeOverlay` 已回傳全新物件，多餘深拷貝浪費 CPU 與記憶體 | 100+ feature atlas 下每次 dry-run 產生 ~10-30 MB 臨時字串 | `init-project-html/lib/atlas/cli.js` | L1246-1247 |

### P2 — 一般問題

| # | 問題描述 | 影響 | 檔案 | 行數 |
|---|--------|------|------|------|
| 1 | `verbScan` 在 `src/` 不存在時直接報錯退出，未依 spec R1.3 降級掃描專案根目錄 | 無 `src/` 目錄的專案無法使用預設 scan | `init-project-html/lib/atlas/cli.js` | L1699-1707 |
| 2 | 新增函數（`summarize`、`parseEvidence`、`computeDiff`、`renderEvidenceBadge`）及 `--dry-run`、`verbStatus`、`verbScan` 完全無測試覆蓋 | P0 bug 若有單元測試應被捕獲；未來重構風險高 | `test/` | — |
| 3 | 證據等級字串 `observed|inferred|assumed` 在 cli.js regex、render.js EVI_LABEL、render.js 硬編碼字串中重複定義三次 | 新增證據等級需三處同步修改 | `cli.js:1093`, `render.js:28,473` |
| 4 | `save()` 每次寫入前無條件深拷貝整個 state，只為了設定 `meta.updatedAt` | 100+ feature 下每次 mutation 多一次不必要的記憶體翻倍 | `init-project-html/lib/atlas/state.js` | L104 |
| 5 | `verbStatus` 載入完整 state（含所有 feature YAML 的 N 次 `readFileSync`）只為產生摘要計數 | 100+ feature atlas 下 status 命令執行不必要的 O(N) I/O | `init-project-html/lib/atlas/cli.js` | L1657-1659 |
| 6 | `fixCommand` 字串將 schema.js 與 CLI flag 語法耦合；若 CLI flag 改名，fixCommand 會靜默過時 | 維護風險 | `init-project-html/lib/atlas/schema.js` | L88,104,125,172,191 |
| 7 | `verbScan`、`verbStatus`、`computeDiff` 被 module.exports 匯出但無外部消費者 | 不必要的 API 表面積膨脹 | `init-project-html/lib/atlas/cli.js` | L2401-2403 |

### P3 — 建議改善

| # | 問題描述 | 影響 | 檔案 | 行數 |
|---|--------|------|------|------|
| 1 | 枚舉值錯誤（side/scope/kind）的 `message` 含有 `(no automatic fix)` 標記但實際上有 `fixCommand` | 錯誤訊息誤導使用者 | `init-project-html/lib/atlas/schema.js` | L84-91,100-107,122-127 |
| 2 | `Object.keys(state.actors \|\| {}).length` 用於陣列長度計算，語意錯誤 | 若 `actors` 型別日後變更會產生難以除錯的錯誤 | `init-project-html/lib/atlas/state.js` | L401 |
| 3 | `parseEvidence` 呼叫模式在 5 個 verb handler 中重複（`if (flags.evidence !== undefined) target.evidence = parseEvidence(flags.evidence)`） | 輕微維護負擔 | `init-project-html/lib/atlas/cli.js` | L1373,1395,1426,1450,1540 |
| 4 | `renderSubmodulePage` 中 evidence 資料被遍歷 2-3 次（收集陣列、計數、`.some()` 檢查） | 單一 submodule < 30 元件影響極輕微 | `init-project-html/lib/atlas/render.js` | L459-472,313 |
| 5 | cli.js 已達 ~2400 行，建議拆分 help page 和 diff viewer 至獨立模組 | 長期維護性 | `init-project-html/lib/atlas/cli.js` | — |

---

## 審查維度摘要

- **幻覺代碼**: 無新增幻覺代碼；確認所有跨模組引用（stateLib.summarize、schema.validate 等）正確存在；CSS class 與 render.js 一致；dry-run deep clone 邏輯正確
- **冗余代碼**: 3 個 finding — `htmlEscape` 重複 (P1)、證據等級三處定義 (P2)、`parseEvidence` 重複模式 (P3)
- **實作偏移**: 3 個 finding — edge 計數 (P0)、JSON errors 格式 (P1)、scan 無降級 (P2)
- **實作遺漏**: 2 個 finding — edge 計數 (P0)、normalizeFeature/normalizeSubmodule 丟棄 evidence (P1)、scan 無降級 (P2)；其餘 4 份 spec 的所有需求均已實作
- **架構瑕疵**: 5 個 finding — edge 計數 (P0)、模組歸屬 (P1)、`htmlEscape` 重複 (P1)、`fixCommand` 耦合 (P2)、cli.js 單體 (P3)；無循環依賴、向後相容性良好
- **性能隱患**: 3 個 finding — dry-run 三重深拷貝 (P1)、save() 無條件深拷貝 (P2)、status 全量載入 (P2)；所有新函數同步設計合理

---

## 解決方案

### P0 修復

#### P0-1: `summarize()` edge 計數邏輯錯誤

- **涉及檔案**：`init-project-html/lib/atlas/state.js` > `summarize()`（L388-392）
- **根因**：程式碼檢查 edge 物件的 `e.scope` 欄位來區分 cross-feature 與 intra-feature，但沒有任何 mutation verb 在 edge 物件上設定過 `scope` 欄位。此外 `feature.edges` 中的 intra-feature edges 完全未被遍歷。
- **修復方案**：根據 edge 的儲存位置區分（`state.edges` = cross-feature，`feature.edges` = intra-feature）：

```js
const crossFeatureEdges = (state.edges || []).length;
let intraFeatureEdges = 0;
for (const f of features) {
  intraFeatureEdges += (f.edges || []).length;
}
```

- **驗證方式**：新增測試 — 建立含 2 個 cross-feature edge 和 1 個 intra-feature edge 的 state，斷言 `summarize().counts.crossFeatureEdges === 2` 且 `summarize().counts.intraFeatureEdges === 1`

### P1 修復

#### P1-1: `status --json` 的 `validation.errors` 格式

- **涉及檔案**：`init-project-html/lib/atlas/cli.js` > `verbStatus()`（L1669）
- **根因**：直接傳遞 `validation.errors`（物件陣列），未依 spec 提取 `message` 字串
- **修復方案**：

```js
errors: validation.errors.map((e) => e.message),
```

- **驗證方式**：`apltk architecture status --json` 在有錯誤的 atlas 上，確認 `validation.errors` 為字串陣列

#### P1-2: `normalizeFeature`/`normalizeSubmodule` 遺失 `evidence` 欄位

- **涉及檔案**：`init-project-html/lib/atlas/state.js` > `normalizeFeature()`（L76-85）、`normalizeSubmodule()`（L87-97）
- **根因**：這兩個正規化函數只挑選已知欄位回傳，未包含 `evidence`
- **修復方案**：在回傳物件中加入 `...(raw.evidence ? { evidence: raw.evidence } : {})`
- **驗證方式**：`feature add --evidence "observed:src/"` 後重新載入 state，確認 `evidence` 欄位保留

#### P1-3: `htmlEscape` 重複定義

- **涉及檔案**：`init-project-html/lib/atlas/cli.js`（L2130-2137）
- **根因**：cli.js 已匯入 renderLib 但重複定義了 `htmlEscape`
- **修復方案**：刪除 cli.js 中的 `htmlEscape` 定義，改用 `renderLib.htmlEscape`
- **驗證方式**：diff viewer 仍正常渲染 HTML

#### P1-4: `parseEvidence` / `computeDiff` 模組歸屬

- **涉及檔案**：`init-project-html/lib/atlas/cli.js`（L1087-1097, L1217-1240）
- **根因**：`parseEvidence` 是純驗證邏輯（無 I/O），應在 schema.js；`computeDiff` 是 state 差異比較，應在 state.js
- **修復方案**：將 `parseEvidence` 移至 schema.js 並匯出；將 `computeDiff` 移至 state.js；cli.js 改為匯入使用
- **驗證方式**：`npm test` 全部通過

#### P1-5: dry-run 多餘深拷貝

- **涉及檔案**：`init-project-html/lib/atlas/cli.js` > `performMutation()`（L1246-1247）
- **根因**：`mergeOverlay` 已回傳全新物件，不需再做兩次深拷貝
- **修復方案**：`before = merged`（合併結果已是獨立副本），僅保留 `dryRunState = JSON.parse(JSON.stringify(merged))` 作為 mutation 的可變目標
- **驗證方式**：`--dry-run` 行為不變，dry-run 後確認 YAML 未被寫入

### P2 修復

#### P2-1: `verbScan` 無降級

- **涉及檔案**：`init-project-html/lib/atlas/cli.js` > `verbScan()`（L1699-1707）
- **根因**：預設 `src/` 不存在時直接報錯，未嘗試專案根目錄
- **修復方案**：在 catch block 中，若 `flags.src` 未指定（使用預設值），改以 `projectRoot` 重新嘗試 `readdirSync`
- **驗證方式**：在無 `src/` 目錄的專案執行 `apltk architecture scan`，確認掃描專案根目錄

#### P2-2: 測試覆蓋

- **涉及檔案**：`test/atlas-state.test.js` 及新建測試
- **根因**：新函數均無測試
- **修復方案**：新增測試案例 —
  - `summarize()`：edge 計數正確性
  - `parseEvidence()`：有效/無效輸入
  - `computeDiff()`：added/modified/removed
  - `renderEvidenceBadge()`：HTML 輸出驗證
  - `--dry-run`：stdout 輸出 + YAML 未修改
- **驗證方式**：`npm test` 全部通過，覆蓋新函數

### P3 改善

#### P3-1: 枚舉錯誤訊息標記不一致

- **涉及檔案**：`init-project-html/lib/atlas/schema.js`（L84-91, 100-107, 122-127）
- **根因**：有 fixCommand 的錯誤訊息仍標記 `(no automatic fix)`
- **修復方案**：從這三處的 `message` 中移除 `(no automatic fix)` 字串

#### P3-2: `Object.keys()` 用於陣列

- **涉及檔案**：`init-project-html/lib/atlas/state.js`（L401）
- **根因**：`actors` 實際上是陣列，應直接取 `.length`
- **修復方案**：改為 `actors: (state.actors || []).length`
