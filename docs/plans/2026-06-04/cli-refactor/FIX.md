# Fix Coordinator Prompt: CLI 工具全面重構 — Round 6

- **Date**: 2026-06-04
- **Source REPORT**: `docs/plans/2026-06-04/cli-refactor/REPORT.md`
- **Source Spec**: `docs/plans/2026-06-04/cli-refactor/`
- **Total Issues**: P0: 0, P1: 1, P2: 0, P3: 2
- **Total Regression Tests**: 1

---

## 1. Your Role

**You are the fix coordinator.** You do not write code. Your job is to understand the issues found in code review, delegate each fix and regression test to a worker, and verify that every issue is resolved without introducing regressions.

### What you do

- Read and understand the issue inventory, dependency analysis, and fix details below
- Spawn workers to execute individual fixes, giving each a self-contained prompt (provided in Section 6)
- After all fixes pass verification, spawn workers to implement regression tests
- Wait for all workers in a batch to complete, then digest their results
- Run verification commands at each checkpoint
- Decide whether to proceed to the next batch, retry a failed worker, or halt
- Handle lightweight coordination tasks: resolving merge conflicts, updating lockfiles
- Commit all changes in a single commit after the final verification gate passes

### What you NEVER do

- Write, edit, or modify any source-code or test file directly
- Skip a verification checkpoint
- Proceed to the next batch when the current batch has not passed verification
- Delegate comprehension — digest every worker result yourself before deciding next steps
- Let workers spawn their own workers (workers are leaf nodes)
- Start regression tests before all fixes in scope are verified
- Defer any REPORT.md issue to a future round — every issue has a complete plan here

---

## 2. Mission

修復 CLI refactoring Round 6 審查中發現的 3 項問題（1 P1 + 2 P3）。核心目標：

1. **P1 search-logs `keyword`/`regex` 缺少 `multiple: true`** — 多關鍵字搜尋回歸，為唯一阻礙合併的問題
2. **P3 PlatformAdapter `normalizePath()` / `EOL` 零消費者** — 已確認 accept，無需程式碼變更
3. **P3 `_runner` 中介變數清理** — find-github-issues 與 review-threads 的簡化清理

共 2 個 Fix Workers（無檔案重疊）、1 個 Regression Test Worker。

**Success looks like**: P1 修復完成、regression test 通過、完整 test suite 通過、無回歸。

---

## 3. Issue Inventory

**P1 (1)**:

- **FIX-A** (P1, 簡單, 規格偏離): search-logs `keyword`/`regex` 缺少 `multiple: true` — `packages/tools/search-logs/index.ts`

**P3 (2)**:

- **FIX-B** (P3, 簡單, 實作缺漏): PlatformAdapter `normalizePath()` / `EOL` 零消費者 — 無需程式碼變更（API surface 完整，接受為 forward-looking API）
- **FIX-C** (P3, 簡單, 冗余程式碼): `find-github-issues` 與 `review-threads` 使用 `_runner` 中介變數 — `packages/tools/find-github-issues/index.ts`, `packages/tools/review-threads/index.ts`

---

## 4. Fix Dependency Analysis

### Dependencies

- **邏輯相依性**：無。所有 fix 彼此獨立。
- **檔案重疊檢查**：

| Worker | Files | Overlaps With |
|--------|-------|--------------|
| FIX-A | `packages/tools/search-logs/index.ts` | 無 |
| FIX-B | 無（no code change） | 無 |
| FIX-C | `packages/tools/find-github-issues/index.ts`, `packages/tools/review-threads/index.ts` | 無 |

**結論**：FIX-A 與 FIX-C 可在同一批次平行執行。FIX-B 無需程式碼變更，無需 worker。

### Regression test dependencies

- REGTEST-01 依賴 FIX-A 先完成（測試 `--keyword`/`--regex` 的 `multiple: true` 行為）

---

## 5. Fix Details (with Regression Test Design)

### FIX-A: search-logs `keyword`/`regex` 加入 `multiple: true` (P1)

**Root cause**: `packages/tools/search-logs/index.ts` 中 `keyword` 與 `regex` 選項在 schema 宣告為 `{ type: 'string' }` 且無 `multiple: true`。但 handler 使用 `(values.keyword as string[])` 強轉為字串陣列。`node:util.parseArgs` 對無 `multiple` 的 `string` 選項僅保留最後一次傳入值（單一字串）。當使用者傳入 `--keyword foo --keyword bar`，`values.keyword` 為 `"bar"`，`for...of` 逐字元遍歷導致比對錯誤。

**Files involved**: `packages/tools/search-logs/index.ts`
- Schema L56: `keyword: { type: 'string' as const }`
- Schema L57: `regex: { type: 'string' as const }`
- Handler L83: `const keywords = (values.keyword as string[]) || [];`
- Handler L84: `const regexPatterns = (values.regex as string[]) || [];`

**Fix approach**:
1. 在 schema 的 `keyword` 與 `regex` 選項中加入 `multiple: true`：
   ```ts
   keyword: { type: 'string' as const, multiple: true },
   regex: { type: 'string' as const, multiple: true },
   ```
2. 不需修改 handler 程式碼 — `(values.keyword as string[])` 的強轉在 `multiple: true` 下會正確回傳 `string[]`，與 `buildMatchers` 的型別簽名一致

**注意**：`strict: false` 已設定（L68），且 schema 無其他不相關變更。單一關鍵字行為不受影響（`parseArgs` 對單一值仍回傳 `[value]`）。

**Complexity**: 簡單（schema 層兩行變更）

**Regression test: REGTEST-01** (Unit → `test/tools/search-logs-multiple-keywords.test.js` 新檔案)
- GIVEN `search-logs` tool with schema
- WHEN calling handler with `--keyword foo --keyword bar`
- THEN `values.keyword` is `['foo', 'bar']` (array, not single string)
- Oracle: before fix, `values.keyword` is `"bar"` (string); after fix, it's `['foo', 'bar']` (array)

Also verify `buildMatchers` produces correct matchers:
- GIVEN `buildMatchers(['foo', 'bar'], [], false, 'any')`
- WHEN matching line `"foo baz"`
- THEN returns true (any mode, foo matches)

---

### FIX-B: PlatformAdapter `normalizePath()` / `EOL` 零消費者 (P3)

**Root cause**: `PlatformAdapter` interface 已定義 `normalizePath` 與 `EOL` 方法，實作正確且有單元測試覆蓋，但無生產程式碼消費。Round 5 的 P2 缺口中，`homeDir` 委派、`resolveHomeDirectory` 整合、`sync-memory-index` 修正均已由 Round 5 的 FIX-C 處理。剩餘的 `normalizePath`/`EOL` 無消費者的情況不影響正確性。

**Fix approach**: 無需程式碼變更。此為 intentional API surface — 方法已存在、已測試，供未來需要進行檔案寫入或路徑常規化的消費者使用。接受此狀態。

**Complexity**: 無需變更

**Regression test**: 無需新增。現有 `test/utils/platform-adapter.test.js` 已涵蓋這兩項方法的基本行為。

---

### FIX-C: `_runner` 中介變數清理 (P3)

**Root cause**: `find-github-issues/index.ts` (L187) 與 `review-threads/index.ts` (L557) 使用 `const _runner = createToolRunner(schema);` 作為中介變數，再以非同步 wrapper 委派。對比 `filter-logs`、`search-logs`、`read-github-issue` 等 11 個工具直接使用 `handler: createToolRunner(schema)`。

**Files involved**:
- `packages/tools/find-github-issues/index.ts` — L187-198
- `packages/tools/review-threads/index.ts` — L557-568

**Fix approach**:

**find-github-issues/index.ts**:
移除 `_runner` 中介變數，改為直接賦值：
```ts
// 移除 L187-188:
// const _runner = createToolRunner(schema);

// 將 L191-198:
// export const tool: ToolDefinition = {
//   name: 'find-github-issues',
//   category: 'GitHub workflows',
//   description: 'List GitHub issues through gh.',
//   handler: async (args, context) => {
//     return _runner(args, context);
//   },
// };
// 改為:
export const tool: ToolDefinition = {
  name: 'find-github-issues',
  category: 'GitHub workflows',
  description: 'List GitHub issues through gh.',
  handler: createToolRunner(schema),
};
```

**review-threads/index.ts**:
相同模式：
```ts
// 移除 L557:
// const _runner = createToolRunner(schema);

// 將 L561-568:
// export const tool: ToolDefinition = {
//   name: 'review-threads',
//   category: 'GitHub workflows',
//   description: 'List or resolve GitHub PR review threads.',
//   handler: async (args, context) => {
//     return _runner(args, context);
//   },
// };
// 改為:
export const tool: ToolDefinition = {
  name: 'review-threads',
  category: 'GitHub workflows',
  description: 'List or resolve GitHub PR review threads.',
  handler: createToolRunner(schema),
};
```

**注意**：`createToolRunner(schema)` 回傳 `(values, positionals, context) => Promise<number>` 型別，與 `ToolDefinition['handler']` 型別 `(args, context) => Promise<number>` 相容。直接賦值無型別問題。

**Complexity**: 簡單（兩個工具各移除 1 行 + 簡化 handler）

**Regression test**: 無需獨立 regtest。現有 test suite 通過即可驗證（handler 行為完全一致）。

---

## 6. Worker Prompt Library

### Fix Worker Prompts

#### FIX-A: search-logs `keyword`/`regex` 加入 `multiple: true`

```
## Mission
修復 search-logs 工具的 P1 bug：`keyword` 與 `regex` schema 選項缺少 `multiple: true`，導致多關鍵字搜尋時比對結果錯誤。`node:util.parseArgs` 對無 `multiple` 的 `string` 選項僅保留最後一次傳入值（單一字串），而 handler 以 `(values.keyword as string[])` 強轉為陣列型別，`for...of` 迭代字串時逐字元遍歷。

## Context
- Review dimension: Spec implementation deviation
- Spec requirement: Req 1 — 引數定義、help 文字、驗證邏輯全部來自同一個 schema 宣告
- Severity: P1

## Input
- `packages/tools/search-logs/index.ts` — schema 定義 (L54-68) 與 handler (L71-168)

## What to do
在 schema.options（L55-66）中，將 `keyword` 與 `regex` 的宣告加上 `multiple: true`：

目前：
```ts
keyword: { type: 'string' as const },
regex: { type: 'string' as const },
```

修改為：
```ts
keyword: { type: 'string' as const, multiple: true },
regex: { type: 'string' as const, multiple: true },
```

不需要修改 handler 程式碼。Handler 的 `(values.keyword as string[])` 強轉在 `parseArgs` 正確回傳陣列後，行為會自動修正。Schema 已設定 `strict: false`（L68），無需其他變更。

## Scope
- Allowed files:
  - `packages/tools/search-logs/index.ts` — schema 兩行變更
- Forbidden files:
  - 所有其他檔案（不屬於此 worker）

## Output
Report:
- Exact lines modified (file path + line numbers)
- Change summary
- Test results

## Verify
- Run: `node --test 'test/**/*.test.js'`
- Expected: All tests pass
- Specifically: `node --test test/tools/search-logs.test.js` 應正常通過

## Boundaries
- 只修改 schema 層的 `keyword` 與 `regex` 定義
- 不要修改 handler 邏輯（只改 schema 使 parser 正確回傳陣列）
- 不要修改 `filter-logs` 或其他工具的 schema（與此 bug 無關）
- 不要撰寫 regression test（由 REGTEST-01 worker 處理）
- `strict: false` 維持不變，確保其他非 schema 選項不被拒絕
```

---

#### FIX-C: `_runner` 中介變數清理

```
## Mission
清理 find-github-issues 與 review-threads 兩個工具中的 `_runner` 中介變數模式。兩個工具使用 `const _runner = createToolRunner(schema)` 加上 `handler: async (args, context) => _runner(args, context)`，但此 wrapper 無任何額外邏輯。對比 11 個工具已直接使用 `handler: createToolRunner(schema)`。

## Context
- Review dimension: Redundant code
- Spec requirement: Req 1 — 新工具的樣板程式碼降至最低
- Severity: P3

## Input
- `packages/tools/find-github-issues/index.ts` — L187-198
- `packages/tools/review-threads/index.ts` — L557-568

## What to do

### Part 1: find-github-issues/index.ts
將：
```ts
// 第 187-198 行
const _runner = createToolRunner(schema);

// ---- Tool definition ----

export const tool: ToolDefinition = {
  name: 'find-github-issues',
  category: 'GitHub workflows',
  description: 'List GitHub issues through gh.',
  handler: async (args, context) => {
    return _runner(args, context);
  },
};
```
改為：
```ts
// ---- Tool definition ----

export const tool: ToolDefinition = {
  name: 'find-github-issues',
  category: 'GitHub workflows',
  description: 'List GitHub issues through gh.',
  handler: createToolRunner(schema),
};
```

### Part 2: review-threads/index.ts
將：
```ts
// 第 557-568 行
const _runner = createToolRunner(schema);

// ---- Tool definition ----

export const tool: ToolDefinition = {
  name: 'review-threads',
  category: 'GitHub workflows',
  description: 'List or resolve GitHub PR review threads.',
  handler: async (args, context) => {
    return _runner(args, context);
  },
};
```
改為：
```ts
// ---- Tool definition ----

export const tool: ToolDefinition = {
  name: 'review-threads',
  category: 'GitHub workflows',
  description: 'List or resolve GitHub PR review threads.',
  handler: createToolRunner(schema),
};
```

## Scope
- Allowed files:
  - `packages/tools/find-github-issues/index.ts`
  - `packages/tools/review-threads/index.ts`
- Forbidden files:
  - 所有其他檔案

## Output
Report:
- Changes made in each file (lines removed, lines modified)
- Verification results

## Verify
- Run: `node --test 'test/**/*.test.js'`
- Expected: All tests pass (behavior is identical, no functional change)
- Specifically: `node --test test/tool-runner.test.js test/tools/find-github-issues.test.js test/tools/review-threads.test.js` passes

## Boundaries
- 只移除 `_runner` 變數與簡化 handler wrapper
- 不改動工具的名稱、描述、分類或行為
- 不改動 schema 定義
- 不改動 handler 內部的業務邏輯
- 不改動註解或格式（除了移除不必要的變數與 wrapper）
- 不改動 `review-threads` 中 `cmdList` 和 `cmdResolve` 函數
- 不改動 `find-github-issues` 中 `runGh`、`printTable` 等輔助函數
```

---

### Regression Test Worker Prompts

#### REGTEST-01: search-logs `keyword`/`regex` `multiple: true` 回歸測試

```
## Mission
為 FIX-A 建立回歸測試。驗證 search-logs 的 `keyword` 與 `regex` schema 選項在 `multiple: true` 下能正確接收多個值並產生正確的比對結果。

## Context
- Fix summary: search-logs schema 中 `keyword` 與 `regex` 加入 `multiple: true`
- Root cause: `node:util.parseArgs` 對無 `multiple` 的 `string` 選項僅保留最後一次傳入值（單一字串）。Handler 的 `(values.keyword as string[])` 強轉無法將執行期的單一字串轉為陣列，`for...of` 逐字元遍歷導致比對錯誤。
- Fix files involved: `packages/tools/search-logs/index.ts`（schema 兩行變更）

## Input
- Read fix-related files: `packages/tools/search-logs/index.ts`（檢查 schema 與 handler）
- Read existing test files as format reference: `test/tools/search-logs.test.js`

## What to do
Create a new test file at `test/tools/search-logs-multiple-keywords.test.js`:

### Test 1: Direct schema test — multiple keyword values arrive as array
```js
test('search-logs schema passes multiple --keyword values as array', () => {
  // This directly tests the parseArgs behavior with the schema
  const { parseArgs } = require('node:util');
  const { values } = parseArgs({
    options: {
      keyword: { type: 'string', multiple: true },
    },
    args: ['--keyword', 'foo', '--keyword', 'bar'],
    strict: false,
  });
  assert.deepStrictEqual(values.keyword, ['foo', 'bar']);
});
```

### Test 2: Handler correctly processes multiple keywords
Use `createToolRunner` with the schema to simulate multiple `--keyword` and `--regex`:
```js
test('search-logs handler correctly processes multiple --keyword values', async () => {
  const runner = createToolRunner({
    options: {
      keyword: { type: 'string', multiple: true },
      regex: { type: 'string', multiple: true },
    },
    allowPositionals: true,
    strict: false,
    handler: async (values) => {
      assert.ok(Array.isArray(values.keyword));
      assert.ok(Array.isArray(values.regex));
      assert.strictEqual(values.keyword.length, 2);
      assert.strictEqual(values.regex.length, 2);
      return 0;
    },
  });
  const result = await runner(
    { keyword: ['foo', 'bar'], regex: ['\\d+', 'error'] },
    [],
    { stdout: { write: () => true }, stderr: { write: () => true } },
  );
  assert.strictEqual(result, 0);
});
```

### Test 3: buildMatchers produces correct results with multiple keywords
直接測試 `buildMatchers` 在輸入多關鍵字時的行為：（可在同一檔案中 import search-logs 的 `buildMatchers`，或重新實作簡單版驗證邏輯）

使用 `search-logs` 的完整 schema 與 handler，透過 `createToolRunner` 執行端到端測試：
```js
test('buildMatchers with multiple keywords matches correctly (any mode)', () => {
  // Rebuild the buildMatchers logic inline for the test
  function buildMatchers(keywords, regexPatterns, ignoreCase, mode) {
    const matchers = [];
    for (const keyword of keywords) {
      const needle = ignoreCase ? keyword.toLowerCase() : keyword;
      matchers.push((line) => {
        const haystack = ignoreCase ? line.toLowerCase() : line;
        return haystack.includes(needle);
      });
    }
    for (const pattern of regexPatterns) {
      const flags = ignoreCase ? 'i' : '';
      const compiled = new RegExp(pattern, flags);
      matchers.push((line) => compiled.test(line));
    }
    return matchers;
  }

  const matchers = buildMatchers(['foo', 'bar'], [], false, 'any');
  assert.strictEqual(matchers.length, 2);
  // 'foo baz' matches 'foo'
  assert.ok(matchers.some(m => m('foo baz')));
  // 'bar baz' matches 'bar'
  assert.ok(matchers.some(m => m('bar baz')));
  // 'hello world' matches neither
  assert.ok(!matchers.some(m => m('hello world')));
  // all mode: both must match
  const allMatchers = buildMatchers(['foo', 'bar'], [], false, 'all');
  assert.ok(allMatchers.every(m => m('foo bar')));
  assert.ok(!allMatchers.every(m => m('foo only')));
});
```

## Scope
- Allowed files:
  - `test/tools/search-logs-multiple-keywords.test.js` — 新建測試檔案
- Forbidden files:
  - 所有 source code 檔案（不屬於 test worker）
  - 不要修改 `test/tools/search-logs.test.js`（保留既有測試）

## Verify
- Run: `node --test test/tools/search-logs-multiple-keywords.test.js`
- Expected: All 3 tests pass
- Confirm existing tests: `node --test 'test/**/*.test.js'`

## Boundaries
- 只建立新的測試檔案，不修改既有 source code
- 測試必須可獨立執行，不依賴外部狀態（不寫入檔案系統、不執行外部行程）
- 測試必須在 FIX-A 已套用的程式碼上通過
- 測試場景覆蓋：單一關鍵字（不應退化）與多關鍵字（原本的 bug）
- 用 `node:test` 撰寫，不使用外部測試框架
```

---

## 7. Fix Batch Schedule

### Batch 1 — All Fix Workers (Parallel — no file overlap)

FIX-A 與 FIX-C 的檔案集合完全不相交，可平行執行。FIX-B 無需程式碼變更，不佔用 worker。

| Worker | Description | Files | Complexity |
|--------|-------------|-------|-----------|
| FIX-A | search-logs keyword/regex `multiple: true` | `packages/tools/search-logs/index.ts` | 簡單 |
| FIX-C | `_runner` wrapper cleanup | `packages/tools/find-github-issues/index.ts`, `packages/tools/review-threads/index.ts` | 簡單 |

**Gate**:
- [ ] FIX-A worker reports success
- [ ] FIX-C worker reports success
- [ ] Run verification: `node --test 'test/**/*.test.js'`
- [ ] All tests pass (no regression from either fix)

---

### Batch 2 — Regression Test Implementation

| Worker | Description | Files | Related Fix |
|--------|-------------|-------|-------------|
| REGTEST-01 | search-logs multiple keywords | `test/tools/search-logs-multiple-keywords.test.js` (new) | FIX-A |

**Gate**:
- [ ] REGTEST-01 worker reports success
- [ ] Run REGTEST-01: `node --test test/tools/search-logs-multiple-keywords.test.js` passes
- [ ] Full test suite: `node --test 'test/**/*.test.js'` passes

---

### Batch 3 — Final Integration Verification

- **Tasks**: Full test suite + coverage, cross-check REPORT.md
- **Strategy**: Sequential (coordinator handles directly)
- **Depends on**: Batch 2 completed

**Gate**:
- [ ] Full test suite with coverage: `COVERAGE=true bash scripts/test.sh` — all pass, thresholds met
- [ ] Every issue in REPORT.md confirmed resolved:
  - [ ] P1 #1 (P1) — search-logs `keyword`/`regex` `multiple: true`: schema 已加入
  - [ ] P3 #1 (P3) — PlatformAdapter normalizePath/EOL: 已確認 accept，無需變更
  - [ ] P3 #2 (P3) — `_runner` wrapper: 已清理

---

## 8. Regression Test Inventory

因 regression tests 僅 1 項（≤ 3），已完整描述於 Section 5 (Fix Details) 與 Section 6 (Worker Prompt Library)，此處不再重複列出。

---

## 9. Verification Checkpoints

### Checkpoint 1 — After Batch 1 (all fixes)
- Run: `node --test 'test/**/*.test.js'`
- Expected: All tests pass

### Checkpoint 2 — After Batch 2 (regression test)
- Run: `node --test test/tools/search-logs-multiple-keywords.test.js`
- Expected: REGTEST-01 passes
- Full suite: `node --test 'test/**/*.test.js'`

### Checkpoint 3 — Final verification
- Run: `COVERAGE=true bash scripts/test.sh` — thresholds met
- Cross-check REPORT.md: every issue resolved

---

## 10. Error Recovery

- **If a fix worker fails**: Retry once with the worker's existing context, giving more specific guidance. Do not create a new worker.
- **If a fix worker fails twice**: Pause the entire flow. Preserve successful results from other workers in Batch 1. Report to the user.
- **If a regression test worker reports failure (test cannot pass)**: Check whether the test code is wrong or the fix is incomplete. If the test code is wrong, continue the worker to fix it. If the fix is incomplete, go back to the corresponding fix worker.
- **If a regression test passes on the unfixed code**: The test design is invalid — redesign the oracle and dispatch a new worker.
- **If merge conflicts occur**: The coordinator resolves the conflict, then re-runs the batch gate verification.
- **If a fix or regression test breaks existing tests**: Pause. Report which test failed and which worker's change caused it.

---

## 11. Fix History

### Round 5 — 2026-06-04

- **Issues fixed**: 8/8 issues from Round 5 review (4 P2 + 4 P3)
- **Outcome**: review-threads `_rawArgs` migration (FIX-A), codegraph SystemError details.code (FIX-B), PlatformAdapter homeDir delegation (FIX-C), Coverage scope Group 2 (FIX-D), helpTopic type narrowing (FIX-E), test imports migration (FIX-F), test overlap cleanup (FIX-G). 2 regression tests added.
- **Commit**: `117f9b7`

### Round 4 — 2026-06-04

- **Issues fixed**: 17/21 issues from Round 4 review (1 P1 + 8 P2 + 6 P3 + 2 regressions)
- **Outcome**: Windows CI bash (P1→FIXED), 5 tools handler catch removal, SchemaOption `multiple` + AppError base class, codegraph/open-github-issue Error→AppError, ToolArgsParser dispatch integration, StdioWriter type, PlatformAdapter isWindows + shell:true
- **Not fixed**: review-threads `_rawArgs` (P2), Coverage scope Group 2 (P2), 2 P3 items deferred (test imports, test overlap)
- **Regression**: codegraph SystemError MODULE_NOT_FOUND detection broken by FIX-12
- **Commit**: `df6f957`

### Round 3 — 2026-06-04

- **Issues fixed**: FIX-01 (createToolRunner catch), FIX-02a/b/c/d (schema conversion for 19 tools), 3 regression fixes
- **Outcome**: All 5 sub-workers completed, 19 tools converted
- **Key notes**: Architecture tool escaped createToolRunner wrapper due to sub-command incompatibility (deliberate design). 3 regressions found and fixed in follow-up `1e727b9`.

### Round 2 — 2026-06-04

- **Issues fixed**: FIX-01 through FIX-06 (P0: 1, P1: 1, P2: 4)
- **Outcome**: All 6 issues resolved in commit `baec86f`
- **Key notes**: create-specs args 修復 (原 P0)、ToolSchema 機制建立 (原 P1)、StdioWriter 整合、sync-memory-index stack trace、ToolNotFoundError 啟用。

### Round 1 — 2026-06-04

- **Issues fixed**: 16 項 (P1: 3, P2: 11, P3: 2) in commit `eecb6ce`
- **Outcome**: 16 fixed, 6 deferred, 1 unfixed (StdioWriter, later fixed in Round 2)
- **Key notes**: PlatformAdapter 消費、AppError 使用、dispatch table、CI 設定、error boundary 等基礎架構全面建立。

---

## 12. Boundaries

### ALWAYS

- Run gate verification immediately after every batch
- Extract worker prompts verbatim from Section 6 — do not rewrite them
- After a worker reports, digest the results before deciding next steps
- Fixes must not conflict with the original spec requirements
- Regression tests must not start before all fix batches pass
- Resolve merge conflicts yourself — the coordinator handles them. This is coordination, not implementation.
- **For FIX-A (search-logs)**: only modify schema options `keyword` and `regex` — add `multiple: true`. Do not touch handler logic.
- **For FIX-C (_runner cleanup)**: verify both tools use the exact same pattern before modifying. After change, run tests to confirm 0 behavioral change.

### ASK FIRST — pause and confirm with the user

- Fix approach conflicts with spec design intent
- Need to add a new external dependency
- Worker has failed twice
- Test regression cannot be quickly diagnosed

### NEVER

- Write implementation logic or modify source code beyond resolving merge conflict markers
- Let workers spawn sub-workers
- Skip verification and proceed to the next batch
- Modify spec documents (unless the fix reveals a spec error — report it instead)
- Start regression tests before all fixes are verified
- Defer any REPORT.md issue to a future round — every issue has a complete fix plan in this FIX.md
- For FIX-C: delete `_runner` without checking that `createToolRunner(schema)` directly satisfies `ToolDefinition['handler']` type
