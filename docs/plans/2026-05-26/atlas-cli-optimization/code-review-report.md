# Code Review Report

- **Spec**: atlas-cli-optimization (D → B → A → C)
- **Date**: 2026-05-27
- **Reviewer**: QA Agent (6-dimension parallel review, round 4)
- **Verdict**: Needs Work

---

## 判決說明

**Verdict**: Needs Work

本次為第四輪獨立審查。6 個維度的平行審查發現 **3 個 P1 問題、8 個 P2 問題、12 個 P3 建議**。無 P0 功能性崩潰。主要問題集中在：`schema.validate()` 的 return type 不一致（邊界條件下可能 crash）、`performMutation` 的 mutate-then-snapshot 順序缺陷、render 路徑缺乏檔案操作錯誤處理、intra-feature edge 遺失 `--evidence`、`computeDiff()` 僅追蹤 feature 層級變更導致 dry-run 對 meta/actor/edge 輸出空 diff。

前輪修復（formatFix callback、--evidence mutation verb 支援、booleanFlags 提取、CSS cleanup 等）已確認正確實作且無回歸。

---

## 發現的問題

### P1 — 重要問題

| # | 問題描述 | 影響 | 檔案 | 行數 |
|---|--------|------|------|------|
| 1 | `schema.validate()` 在 state 非物件時執行 `return [noFix('state: must be an object')]`，回傳 plain array 而非 `{ valid: boolean, errors: [...] }`。呼叫方 `verbValidate` 和 `verbStatus` 存取 `result.valid` 得 `undefined`（falsy），接著 `for (const err of result.errors)` 因 `result.errors` 為 `undefined` 拋出 `TypeError` | 邊界條件下 crash；違反 Spec B R4.1 的函式契約 | `init-project-html/lib/atlas/schema.js` | L290 |
| 2 | `performMutation` 先呼叫 `mutate()` 修改記憶體中的 state，之後才寫入 undo snapshot（`writeUndoSnapshot`，L250/257）。若 undo 寫入因磁碟滿或權限不足失敗，記憶體狀態已被修改，無法回滾 | undo snapshot 寫入失敗時記憶體狀態已污染；雖然 CLI 為短生命週期（下次呼叫從磁碟重載），仍構成 state consistency gap | `init-project-html/lib/atlas/cli.js` | L248-260 |
| 3 | `renderAll` 及其內部 `copyAssets`、HTML 寫入迴圈中所有 `fs.writeFileSync`、`fs.copyFileSync`、`fs.rmSync` 均無 try-catch。任一檔案操作失敗（EACCES、ENOSPC）導致整個渲染流程 crash，已寫入的部分頁面無法 rollback | 渲染中斷時留下部分更新的 HTML，架構圖處於不一致狀態（新舊頁面混合） | `init-project-html/lib/atlas/render.js` | L534-612 |

### P2 — 一般問題

| # | 問題描述 | 影響 | 檔案 | 行數 |
|---|--------|------|------|------|
| 4 | 新增 intra-feature edge 時，`--evidence` flag 的值在 L537 被解析並寫入 `edge` 物件，但 intra-feature 路徑（L545-551）建構新物件時未包含 `evidence` 欄位，只寫入 `{ id, from, to, kind, label }`。跨 feature edge（L556）直接使用 `edge` 物件，正常保留 evidence | intra-feature edge 的 evidence 資訊永久遺失；違反 Spec C R1.4「所有 mutation verb 均支援 --evidence」 | `init-project-html/lib/atlas/cli.js` | L545-551 |
| 5 | `computeDiff()` 僅比對 `state.features` 陣列的增刪改，完全忽略 `state.meta`、`state.actors`、`state.edges`（跨 feature edge）的變更。執行 `apltk architecture meta set --title "X" --dry-run` 或 `actor add --dry-run` 或跨 feature `edge add --dry-run` 時，輸出空 diff `{addedFeatures:[], modifiedFeatures:[], removedFeatures:[]}` | dry-run 對 meta/actor/edge mutation 輸出誤導性空 diff；違反 Spec A R4.1 | `init-project-html/lib/atlas/state.js` | L414-437 |
| 6 | `validateFunction(fn, errors, where, featureSlug, subSlug, formatFix)` 和 `validateVariable(v, errors, where, featureSlug, subSlug, formatFix)` 接受 `featureSlug`、`subSlug`、`formatFix` 三個參數但函數體內從未讀取。所有錯誤皆透過 `noFix()` / `requireField()` 產生 | 幻覺參數：誤導呼叫者以為這些參數會影響驗證行為或產生 fix command | `init-project-html/lib/atlas/schema.js` | L108, L120 |
| 7 | 所有 mutation verb callback 在 `performMutation` 中被呼叫後，回傳值 `{ touchedFeatures: new Set([...]) }` 從未被讀取或使用。每個 mutation 都計算並回傳此物件，但完全被忽略 | 死回傳值：暗示存在增量 render scope 功能但從未兌現 | `init-project-html/lib/atlas/cli.js` | L284-617 |
| 8 | `multiVerbs` Set（L1140）的內容與 dispatch switch case（L1167-1186）完全重複。新增 mutation verb 時必須兩處同步更新，否則 `subverb` 解析與 dispatch 脫節 | DRY 違反：同一份 verb 清單在兩處獨立維護，容易因不同步導致 bug | `init-project-html/lib/atlas/cli.js` | L1140, L1167-1186 |
| 9 | `const USAGE = buildArchitectureHelpPage()` 在模組載入時立即執行（eager evaluation），建構全部 ~20 個子頁面的 help text，即使 CLI 僅執行 mutation/render/validate | 每次 CLI 啟動都支付全部 help page 建構成本，浪費 CPU 與記憶體 | `init-project-html/lib/atlas/cli-help.js` | L1004 |
| 10 | `render.js`（呈現層）從 `state.js`（持久化層）匯入 `REMOVED_TXT` 常數，僅為取得一個檔案名稱字串。呈現層對持久化層產生了不必要的編譯期依賴 | 若 `REMOVED_TXT` 定義位置變更，呈現層需重新評估；此常數應歸屬於 `schema.js` 或共享 constants 模組 | `init-project-html/lib/atlas/render.js` | L18 |
| 11 | `architecture.ts` 以字串硬編碼路徑 `path.join(sourceRoot, 'init-project-html', 'lib', 'atlas', 'cli.js')` 直接 require `cli.js`，將 tool 排程層耦合到 skill 的內部檔案佈局 | 若 `cli.js` 改名、移動或被重構為 ESM，執行期才失敗 | `lib/tools/architecture.ts` | L8-11 |

### P3 — 建議改善

| # | 問題描述 | 影響 | 檔案 | 行數 |
|---|--------|------|------|------|
| 12 | `SUBMODULE_KINDS`、`SIDE_EFFECTS`、`VARIABLE_SCOPES`、`EDGE_KINDS`、`SLUG_PATTERN`、`isNonEmptyString`、`isSlug` 被 schema.js 匯出但無任何外部檔案匯入（僅內部使用） | 過度匯出：不必要的公開 API 表面 | `init-project-html/lib/atlas/schema.js` | L374-382 |
| 13 | `HISTORY_FILE`、`UNDO_FILE`、`UNDO_STACK_FILE` 被 state.js 匯出但無任何外部檔案匯入（僅內部使用） | 同上：內部常數不應汙染公開 API | `init-project-html/lib/atlas/state.js` | L529-531 |
| 14 | `toViewerRel` 從 `diff-viewer.js` 匯入 cli.js（L46）後再匯出（L1219），但在 cli.js 內部從未被呼叫 | 不必要的匯入與重匯出 | `init-project-html/lib/atlas/cli.js` | L46, L1219 |
| 15 | `sub-io`、`sub-vars`、`sub-dataflow`、`sub-errors` 四個 HTML section class 在 render.js 中生成，但 `architecture.css` 中無對應 CSS 規則 | HTML 攜帶無效 class，增加體積 | `init-project-html/lib/atlas/render.js` | L493-520 |
| 16 | `const booleanFlags = BOOLEAN_FLAGS` 不必要的中間變數，與模組級 `BOOLEAN_FLAGS` 完全相同 | 多餘的區域變數宣告 | `init-project-html/lib/atlas/cli.js` | L109 |
| 17 | `JSON.parse(JSON.stringify(...))` deep-clone 模式在 6 處重複出現（cli.js L226/248/255/884/1059/1082） | 可提取為共用 `deepClone` 工具函數，方便遷移至 `structuredClone` | `init-project-html/lib/atlas/cli.js` | 多處 |
| 18 | `scan` 的 `skipDirs` Set 包含 spec 未要求的 `__test__`（spec 僅要求 `__tests__`），且 L711 額外過濾所有以 `.` 開頭的目錄（spec 僅要求 `.git`） | 防禦性過濾超出 spec 範圍，可能過濾合法隱藏目錄 | `init-project-html/lib/atlas/cli.js` | L705, L711 |
| 19 | `verbUndo` 先後兩次呼叫 `specOverlayDir(projectRoot, flags.spec)`，該函數內部執行 `findBatchRoot` 檔案系統走訪，重複相同 I/O | 多餘的檔案系統走訪 | `init-project-html/lib/atlas/cli.js` | L736, L749 |
| 20 | `verbDiff` 對 `changes` 陣列進行三次獨立 `.filter()` 分別計數 modified/added/removed 頁面 | 陣列通常小（<100），影響輕微 | `init-project-html/lib/atlas/cli.js` | L784 |
| 21 | `copyAssets()` 每次 render 無條件複製 CSS/JS 檔案，即使目標已存在且內容未變 | 不必要的 fs 寫入 | `init-project-html/lib/atlas/render.js` | L539-540 |
| 22 | `layoutMacro()` 每次呼叫建立新的 `ELK()` 實例，elkjs 初始化包含內部狀態配置 | 頻繁 render 場景累積初始化開銷 | `init-project-html/lib/atlas/layout.js` | L460-462 |
| 23 | `diff-viewer.js` 在 140 行 template literal 中內嵌完整 HTML、inline CSS（~40 行）和 inline JavaScript（~60 行），CSS/JS 無法獨立維護、lint 或測試 | template literal 內語法錯誤僅在執行期發現 | `init-project-html/lib/atlas/diff-viewer.js` | L32-173 |

---

## 審查維度摘要

- **幻覺代碼**: 3 個 finding — validateFunction/validateVariable 幻覺參數（P2-6）、mutation callback 死回傳值（P2-7）、toViewerRel 未使用重匯出（P3-14）、HTML section class 無 CSS 規則（P3-15）、過度匯出（P3-12, P3-13）
- **冗余代碼**: 2 個 finding — multiVerbs 與 switch case 重複（P2-8）、booleanFlags 中間變數（P3-16）、6 處重複 deep-clone 模式（P3-17）
- **實作偏移**: 3 個 finding — validate() return type 不一致（P1-1）、intra-feature edge 遺失 evidence（P2-4）、scan skipDirs 超出 spec 範圍（P3-18）
- **實作遺漏**: 1 個 finding — computeDiff() 忽略 meta/actors/edges（P2-5）。已確認前輪修復全部存在且正確
- **架構瑕疵**: 4 個 finding — mutate-then-snapshot 順序缺陷（P1-2）、render 缺乏錯誤處理（P1-3）、REMOVED_TXT 跨層依賴（P2-10）、architecture.ts 硬編碼路徑（P2-11）、help page eager build（P2-9）、diff-viewer monolithic template（P3-23）
- **性能隱患**: 3 個 finding — help page eager build（P2-9）、verbUndo 重複 I/O（P3-19）、copyAssets 無條件覆寫（P3-21）、ELK 重複初始化（P3-22）、verbDiff 重複 filter（P3-20）

---

## 解決方案

### P1 修復

#### P1-1: `schema.validate()` return type 不一致

- **涉及檔案**：`init-project-html/lib/atlas/schema.js`（L290）
- **根因**：`validate()` 早期 return 使用 `return [noFix(...)]`（陣列），正規路徑 `return { valid, errors }`（物件）
- **修復方案**：將 L290 改為 `return { valid: false, errors: [noFix('state: must be an object')] };`
- **驗證方式**：`npm test`

#### P1-2: `performMutation` mutate-then-snapshot 順序缺陷

- **涉及檔案**：`init-project-html/lib/atlas/cli.js`（L248-260）
- **根因**：`mutate()` 先修改記憶體 state，之後才寫入 undo snapshot；寫入失敗時無法回滾
- **修復方案**：將 `writeUndoSnapshot` 呼叫移至 `mutate()` 之前（或 snapshot 寫入失敗時不執行 mutate）。實際上 CLI 為短生命週期，修復優先級可降至 P2，但仍建議調整順序
- **驗證方式**：`npm test`

#### P1-3: `renderAll` 缺乏檔案操作錯誤處理

- **涉及檔案**：`init-project-html/lib/atlas/render.js`（L534-612）
- **根因**：所有 `fs.writeFileSync`、`fs.copyFileSync`、`fs.rmSync` 無 try-catch
- **修復方案**：在 render 迴圈外包一層 try-catch，失敗時輸出 stderr 警告但不 crash；或在寫入前先寫入暫存檔、全部成功後再原子替換
- **驗證方式**：`npm test`

### P2 修復

#### P2-4: intra-feature edge 遺失 `--evidence`

- **涉及檔案**：`init-project-html/lib/atlas/cli.js`（L545-551）
- **修復方案**：在 intra-feature edge 的 push 物件中加入 `...(edge.evidence ? { evidence: edge.evidence } : {})`

```js
feature.edges.push({
  id: edge.id,
  from: from.submodule,
  to: to.submodule,
  kind: edge.kind,
  label: edge.label,
  ...(edge.evidence ? { evidence: edge.evidence } : {}),
});
```

- **驗證方式**：`npm test`；`apltk architecture edge add --feature X --from Y --to Z --evidence "observed:src/x.ts:1"` 確認 intra-feature edge YAML 寫入 evidence

#### P2-5: `computeDiff()` 忽略 meta/actors/edges

- **涉及檔案**：`init-project-html/lib/atlas/state.js`（L414-437）
- **修復方案**：擴充 `computeDiff()` 回傳值，新增 `metaChanged: boolean`、`addedActors`、`removedActors`、`addedEdges`、`removedEdges` 欄位；或至少加入 `nonFeatureChanges: boolean` 標記
- **驗證方式**：`npm test`；`apltk architecture meta set --title "X" --dry-run` 確認 diff 輸出不為空

#### P2-6: `validateFunction` / `validateVariable` 幻覺參數

- **涉及檔案**：`init-project-html/lib/atlas/schema.js`（L108, L120）
- **修復方案**：兩方案擇一 — (a) 移除 `featureSlug`、`subSlug`、`formatFix` 參數（若當前無可自動修復的錯誤）；(b) 為 type/shape 錯誤加入 `formatFix` 呼叫（如 invalid kind 可建議正確值）
- **建議**：採用 (a)，因為這些欄位的錯誤本質上無法自動修復（無法猜測正確值），保留參數僅是誤導。呼叫方 `validateSubmodule` L150/L157 也需同步調整
- **驗證方式**：`npm test`

#### P2-7: mutation callback 回傳值被靜默丟棄

- **涉及檔案**：`init-project-html/lib/atlas/cli.js`（L284-617, L222-265）
- **修復方案**：兩方案擇一 — (a) 若未來有增量 render scope 計畫，在 `performMutation` 中收集所有 `touchedFeatures` 傳給 `runRender`；否則 (b) 移除回傳值，將 callback 改為 void
- **建議**：採用 (b)，簡化 callback 簽名

#### P2-8: `multiVerbs` 與 dispatch switch 重複

- **涉及檔案**：`init-project-html/lib/atlas/cli.js`（L1140, L1167-1186）
- **修復方案**：提取 verb-action 對照表為模組級常數（如 `VERB_ACTIONS` Map），`multiVerbs` Set 和 switch case 皆由此單一來源生成

#### P2-9: Help page eager build

- **涉及檔案**：`init-project-html/lib/atlas/cli-help.js`（L1004）
- **修復方案**：將 `const USAGE = buildArchitectureHelpPage()` 改為 lazy getter 函數 `getUsage()`，僅在 `--help` 被觸發時才呼叫

#### P2-10: `REMOVED_TXT` 跨層依賴

- **涉及檔案**：`init-project-html/lib/atlas/render.js`（L18）、`lib/atlas/state.js`
- **修復方案**：將 `REMOVED_TXT` 移至 `schema.js` 或建立 `constants.js`，由 state.js 和 render.js 共同匯入

#### P2-11: `architecture.ts` 硬編碼路徑

- **涉及檔案**：`lib/tools/architecture.ts`（L8-11）
- **修復方案**：由 `cli.js` 匯出一個公開的 dispatch 函數（如 `module.exports = { dispatch, ... }`），`architecture.ts` 直接 require 此模組而非硬編碼內部路徑

---

## 已確認修復（前三輪）

以下前三輪 QA 報告標記的問題已確認正確實修且無回歸：

- P1-1 (round 3): `formatFix` callback chain — schema.js 6 處正確實作
- P1-2 (round 3): `--evidence` 缺少 4 個 mutation verb — 全部補齊
- P2-3/4 (round 3): `--evidence` / `--dry-run` CLI help — mutationFlags 已更新
- P2-5 (round 3): `force` 幽靈 flag — 已移除
- P2-6 (round 3): spec mode `runRender` 重複 I/O — `preloadedBase` 已傳遞
- P3-8: `BOOLEAN_FLAGS` 常數提取 — 已正確實作
- P3-9: Kind modifier CSS class cleanup — 已移除無作用 class
- P3-10: 條件式 elkjs layout — 僅在 macro scope 時執行
- P3-11: save() 深拷貝優化 — shallow mutation
- P3-12: undo stack 上限 — 限制 50
- P3-13: 不必要匯出 cleanup — render.js / layout.js 已清理
- P0-1 (round 2): `verbScan` const→let — 已確認
- P1-2 (round 2): `htmlEscape` 重複 — 已確認
- P2-4 (round 2): `splitList`/`parseNameList` 合併 — 已確認
- P2-5 (round 2): `renderDiffViewer` 遷移 — 已確認
- P2-6 (round 2): state.js API 表面收窄 — 已確認
- P2-7 (round 2): `(no automatic fix)` 後綴 — 已確認
- P2-8 (round 2): 損壞 YAML graceful handling — 已確認
- P2-9 (round 2): cli.js 模組拆分 — 已確認
- P3-10 (round 2): KIND_LABEL 統一來源 — 已確認
- P3-11 (round 2): REMOVED_TXT 共享 — 已確認
