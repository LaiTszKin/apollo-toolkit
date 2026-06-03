# Fix Coordinator Prompt: CLI 工具全面重構 — Round 3

- **Date**: 2026-06-04
- **Source REPORT**: `docs/plans/2026-06-04/cli-refactor/REPORT.md`
- **Source Spec**: `docs/plans/2026-06-04/cli-refactor/`
- **Total Issues**: P0: 0, P1: 0, P2: 2, P3: 0
- **Total Regression Tests**: 3

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

修復 CLI refactoring Round 3 審查中發現的 2 項 P2 問題：(1) `createToolRunner` catch block 使 typed error 格式化失效，需讓 catch block 依錯誤類型分派正確的格式化； (2) 21/22 工具仍未採用單一 schema 宣告機制，需批次轉換既有工具以使用 `ToolSchema` + `createToolRunner`。共 3 個 Fix Worker（含批次），3 個 Regression Test Worker。

**Success looks like**: 所有 2 項 REPORT.md issue 已修復，3 個 regression tests 通過，完整 test suite 通過，無回歸。

---

## 3. Issue Inventory

- FIX-01 (P2, 簡單, 規格偏差): `createToolRunner` catch block 以泛型 `Error: ${message}` 統一格式化，遺失 typed error (`UserInputError`/`SystemError`) 的類型特定格式 — `packages/tool-utils/schema.ts`
- FIX-02 (P2, 複雜, 實作遺漏): 21/22 工具仍未採用單一 schema 宣告機制 — `packages/tools/*/index.ts` (多檔案批次轉換)

---

## 4. Fix Dependency Analysis

### Dependencies

- FIX-01 與 FIX-02 無邏輯相依（FIX-01 修改 schema.ts，FIX-02 修改各工具檔案）
- FIX-02 內部的子轉換彼此無邏輯相依（各工具獨立運作）
- 所有 REGTEST 依賴對應的 FIX 先完成

### File overlaps

| Worker | Files | Overlaps With |
|--------|-------|--------------|
| FIX-01 | `packages/tool-utils/schema.ts` | 無 |
| FIX-02a (簡單工具) | `packages/tools/search-logs/index.ts`, `packages/tools/validate-skill-frontmatter/index.ts`, `packages/tools/validate-openai-agent-config/index.ts`, `packages/tools/extract-pdf-text/index.ts`, `packages/tools/enforce-video-aspect-ratio/index.ts`, `packages/tools/create-review-report/index.ts`, `packages/tools/generate-storyboard-images/index.ts` | 無（各工具獨立的 index.ts） |
| FIX-02b (GitHub typed-wrapper 工具) | `packages/tools/find-github-issues/index.ts`, `packages/tools/read-github-issue/index.ts`, `packages/tools/review-threads/index.ts`, `packages/tools/open-github-issue/index.ts` | 無（各工具獨立的 index.ts） |
| FIX-02c (其餘工具) | `packages/tools/sync-memory-index/index.ts`, `packages/tools/docs-to-voice/index.ts`, `packages/tools/create-specs/index.ts`, `packages/tools/extract-conversations/index.ts` | 無（各工具獨立的 index.ts） |
| FIX-02d (複雜工具) | `packages/tools/architecture/index.ts`, `packages/tools/render-error-book/index.ts`, `packages/tools/render-katex/index.ts` | 無（各工具獨立的 index.ts） |

**所有 Fix Worker 的檔案集完全無重疊** → Fix-01 與 Fix-02 四批次全部可平行執行。

---

## 5. Fix Details (with Regression Test Design)

### FIX-01: createToolRunner catch block typed error 格式化偏移 (P2)

**Root cause**: `schema.ts` 的 `createToolRunner` (L78-100) 包裝了使用者的 schema handler。當 handler 擲出錯誤時，內部的 catch 區塊 (L96-98) 以 `Error: ${message}` 統一格式化所有錯誤，完全忽略錯誤類型。對照 SPEC Req 3 的錯誤格式化規範：
- `UserInputError` → 應只輸出 message（無前綴），exit code 1
- `SystemError` → 應輸出 `message + '\n' + stack`，exit code 1
- 其他 `Error` → 應輸出 `Error: ${message}`，exit code 1

**Files involved**: `packages/tool-utils/schema.ts` > `createToolRunner()` (L78-L100)

**Fix approach**: 將 L96-L98 的泛型 catch block 改為與 CLI boundary (`cli/index.ts:480-491`) 一致的錯誤類型分派：

```ts
    } catch (err) {
      if (err instanceof UserInputError) {
        stderr.write(`${err.message}\n`);
      } else if (err instanceof SystemError) {
        stderr.write(`${err.message}\n${err.stack}\n`);
      } else {
        stderr.write(`Error: ${(err as Error).message}\n`);
      }
      return 1;
    }
```

需在檔案頂部 import `UserInputError` 與 `SystemError` 從 `@laitszkin/tool-utils`。

**Complexity**: 簡單

**Regression test: REGTEST-01** (Unit → `test/utils/create-tool-runner-error.test.js`)
- GIVEN `createToolRunner` with a handler that throws `UserInputError`
  WHEN calling the runner
  THEN stderr output is exactly `message\n` (no "Error:" prefix), exit code 1
- GIVEN `createToolRunner` with a handler that throws `SystemError`
  WHEN calling the runner
  THEN stderr output includes `message\n` followed by a stack trace (`.includes('at ')`), exit code 1
- GIVEN `createToolRunner` with a handler that throws generic `Error`
  WHEN calling the runner
  THEN stderr output starts with `Error: ` prefix, exit code 1
- Oracle: All three scenarios must fail on the unfixed code (before FIX-01, all three produce identical `Error: message` output)

---

### FIX-02: 21/22 工具仍未採用單一 schema 宣告機制 (P2)

**Root cause**: 第一輪實作建立了 `ToolSchema` 介面與 `createToolRunner` 工廠 (schema.ts)，但僅 filter-logs 採用了新機制。其餘工具仍沿用重構前的手寫 `parseArgs` + 自訂 help 文字 + 事後 if 驗證的三段式樣板。來源於 SPEC Req 1 的全面消除樣板目標尚未達成。

**Files involved**: `packages/tools/*/index.ts`（21 個工具遍佈）

**Fix approach**: 
將所有工具分批轉換為 `ToolSchema` + `createToolRunner` 模式。每一批工具採用共同的轉換規則：

1. 提取現有 `parseArgs` 的 options 定義 → 轉換為 `ToolSchema.options` 格式
2. 將手寫 help 字串區塊 → 由 schema 的 `usage` / `description` 欄位取代
3. 將 handler 的主體包裝為 `schema.handler(values, positionals, context)` 簽名
4. 確保 handler 內 `throw new UserInputError(...)` / `SystemError(...)` 仍然保留（由 createToolRunner 的 catch block 統一格式化）
5. 將 `parseArgs` 呼叫替換為 schema-based `createToolRunner(schema)` 包裝
6. 移除 handler 內部的 catch block（因為 createToolRunner 已提供）

**重要：轉換後的行為必須與轉換前完全一致。** 特別注意：
- `strict` 模式的設定（某些工具使用 `strict: false` - 如 filter-logs）
- `multiple` flags（如 `--keyword`、`--regex`、`--instruction-line` 等重複旗標）
- 型別轉換（`string` → `number` 如 `--before-context`、`--after-context`）
- Handler 內部的 catch block 使用 `stderr.write` 而非 `throw`（這些需保留為 handler 內部的業務邏輯 catch，不影響外層）
- Type-only import 的正確保留（`type { ToolDefinition, ToolContext }`）

**Complexity**: 複雜 — 跨 21 個檔案的大規模轉換，但每個檔案的轉換模式高度一致。

**Regression test: REGTEST-02** (Integration → `test/tools/schema-conversion-smoke.test.js`)
- GIVEN 所有支援 schema 的工具
  WHEN 使用 `--help` 參數執行每個工具
  THEN 每個工具輸出非空的 help 文字且 exit code 0
- GIVEN 每個轉換後的工具
  WHEN 執行既有測試
  THEN 既有測試全部通過（驗證無行為變更）
- Oracle: 轉換後的行為必須與既有測試的斷言完全一致

**Regression test: REGTEST-03** (Integration → `test/tools/schema-arg-validation.test.js`)
- GIVEN 每個使用 `strict: true`（預設）的工具
  WHEN 傳入無效 flag
  THEN exit code 1，stderr 包含 "Error: " 前綴
- Oracle: 統一的 strict 模式驗證在所有轉換後的 tool 上行為一致

---

## 6. Worker Prompt Library

### Fix Worker Prompts

#### FIX-01: Fix createToolRunner catch block typed error formatting

```
## Mission
修復 `createToolRunner` 的 catch block，使其依錯誤類型（UserInputError / SystemError / generic Error）分派正確的格式化輸出，而非統一以 `Error: ${message}` 格式化。

## Context
- Review dimension: Spec implementation deviation
- Spec requirement: Req 3 — 所有錯誤路徑採用統一的錯誤類別與處理紀律

## Input
Read the following files:
- `packages/tool-utils/schema.ts` — 目標檔案，createToolRunner 函數 (L68-L101)
- `packages/cli/index.ts` — L480-L491（CLI boundary 的錯誤類型分派模式，作為格式參考）
- `packages/tool-utils/app-error.ts` — UserInputError / SystemError 類別定義

## What to do
1. 在 schema.ts 頂部加入 import：
   ```
   import { UserInputError, SystemError } from '@laitszkin/tool-utils';
   ```
2. 將 `createToolRunner` 函數內部的 catch block (目前 L96-L98) 改為：
   ```ts
       } catch (err) {
         if (err instanceof UserInputError) {
           stderr.write(`${err.message}\n`);
         } else if (err instanceof SystemError) {
           stderr.write(`${err.message}\n${err.stack}\n`);
         } else {
           stderr.write(`Error: ${(err as Error).message}\n`);
         }
         return 1;
       }
   ```
3. 確認退出碼統一為 `return 1`（已在目前程式碼中）

## Scope
- Allowed files:
  - `packages/tool-utils/schema.ts` — 唯一的修改目標
- Forbidden files:
  - 所有其他檔案

## Output
On completion, report:
- Which file was modified (absolute path)
- The old vs new catch block code
- Test results (pass/fail) — 執行 `node --test test/utils/` 中與 schema/createToolRunner 相關的測試

## Verify
- 執行 `node --test 'test/**/*.test.js'` 確認所有既有測試通過（但可能因 c8 涵蓋率門檻而部份失敗，忽略 coverage 相關失敗）
- 手動確認 filter-logs 的 `--help` 仍正常運作

## Boundaries
- 不要修改任何其他檔案
- 不要修改 `createToolRunner` 的 API 簽名或 `ToolSchema` 介面
- 不要修改 handler 內部的業務邏輯 catch block（那些屬於 handler 自有的錯誤處理）
```

#### FIX-02a: Convert simple tools to ToolSchema pattern

```
## Mission
將 7 個具有簡單 parseArgs 模式的工具轉換為 `ToolSchema` + `createToolRunner` 模式：
1. search-logs (與 filter-logs 高度相似)
2. validate-skill-frontmatter
3. validate-openai-agent-config
4. extract-pdf-text
5. enforce-video-aspect-ratio
6. create-review-report
7. generate-storyboard-images

## Context
- Review dimension: Spec implementation omission
- Spec requirement: Req 1 — tool 引數定義、help 文字、驗證邏輯全部來自同一個 schema 宣告

## Input
Read the following files for pattern reference:
- `packages/tools/filter-logs/index.ts` — 已轉換的範例，展示 ToolSchema + createToolRunner 的使用方式
- `packages/tool-utils/schema.ts` — ToolSchema 介面與 createToolRunner 實作

Read each tool's current implementation:
- `packages/tools/search-logs/index.ts`
- `packages/tools/validate-skill-frontmatter/index.ts`
- `packages/tools/validate-openai-agent-config/index.ts`
- `packages/tools/extract-pdf-text/index.ts`
- `packages/tools/enforce-video-aspect-ratio/index.ts`
- `packages/tools/create-review-report/index.ts`
- `packages/tools/generate-storyboard-images/index.ts`

## What to do
For each of the 7 tools, perform the following conversion:

1. **提取 schema options**：將現有 `parseArgs({ options: {...} })` 的 options 對映為 `ToolSchema.options`。型別對應：`{ type: 'string' }` → `{ type: 'string' }`，`{ type: 'boolean' }` → `{ type: 'boolean' }`。保留 `default` 與 `short`。

2. **新增 usage/description**：從現有 handler 內部的 help 文字或程式碼註解中提取 usage 與 description。若無現成 help 文字，使用工具原本的 `description`（ToolDefinition 中的描述）。

3. **重構 handler 簽名**：將 `async function handlerName(argv: string[], context: ToolContext): Promise<number>` 改為 `async (values: Record<string, unknown>, positionals: string[], context: ToolContext): Promise<number>`。函數體從 `try { parseArgs(...) }` 改為直接使用 `values` 與 `positionals`。

4. **移除 handler 內部的 parseArgs 與 catch block**：
   - 移除 `const { values, positionals } = parseArgs({...})` — 由 createToolRunner 處理
   - 保留 handler 內部的 try/catch 但僅保留業務邏輯的 catch（處理非預期 I/O 錯誤等）。移除僅用於統一格式化的 catch block，因為 createToolRunner 已提供錯誤格式化。
   - 注意：若 handler 的 catch block 使用了 `stderr.write` 而非 `throw` **且** 是業務邏輯層的錯誤處理（如處理檔案讀取失敗），則應保留 catch 並改為 `throw new SystemError(...)`。

5. **匯出使用 createToolRunner**：將最後的 `handler: handlerFunction` 改為 `handler: createToolRunner(schema)`。

6. **保留所有 type imports**：確保 `type { ToolDefinition, ToolContext }` 等 type-only imports 不受影響。import `createToolRunner` from `@laitszkin/tool-utils`。

7. **保留 handler 內部的 throw**：所有 `throw new UserInputError(...)` 和 `throw new SystemError(...)` 保留不變，由 createToolRunner 的 catch block 統一格式化。

## 重要注意事項

- **strict 模式**：search-logs 使用 `strict: false`（`mode` 參數需事後驗證）。請在 schema 中設定 `strict: false`，並保留 handler 內部的 mode 驗證 `throw new UserInputError(...)`。
- **multiple flags**：search-logs 有 `keyword` 和 `regex` 的 `multiple: true`。SchemaOption type 不支援 multiple，所以 parseArgs 的 multiple 設定交由 createToolRunner 處理。注意 multiple string 在 values 中的型別為 `string[]`。
- **型別轉換**：search-logs 的 `--before-context` 和 `--after-context` 是 string 型別但在 handler 內被 parseInt。這在 schema 轉換後保持不變 — 它們仍是 `{ type: 'string' }`，handler 內繼續 parseInt。
- **validate-skill-frontmatter**：此工具有一個 `dir` positional argument。確保 schema 中 `allowPositionals: true`，handler 使用 `positionals[0]` 取得。
- **generate-storyboard-images**：此工具可能有多個 string options。仔細比對現有程式碼的選項。
- **extract-pdf-text**：簡單工具，通常只有 positional arguments。
- **create-review-report** 與 **enforce-video-aspect-ratio**：檢查現有程式碼的 parseArgs 選項。
- **不要刪除任何功能碼**：轉換是純重構，不改變任何業務邏輯。

## Scope
- Allowed files:
  - `packages/tools/search-logs/index.ts`
  - `packages/tools/validate-skill-frontmatter/index.ts`
  - `packages/tools/validate-openai-agent-config/index.ts`
  - `packages/tools/extract-pdf-text/index.ts`
  - `packages/tools/enforce-video-aspect-ratio/index.ts`
  - `packages/tools/create-review-report/index.ts`
  - `packages/tools/generate-storyboard-images/index.ts`
- Forbidden files:
  - 所有其他非上述 list 中的檔案

## Output
On completion, report:
- List of modified files
- For each file: conversion summary (what changed, any non-standard modifications needed)
- Any edge cases or blockers encountered
- Test results

## Verify
- 執行 `node --test 'test/**/*.test.js'` 確認所有既有測試通過
- 特別確認轉換後的工具測試：`test/tools/filter-logs.test.js`, `test/cli-parsing.test.js`, `test/tool-runner.test.js`
- 對每個轉換的工具執行 `node --test` 測試

## Boundaries
- 不修改任何非 listed 的檔案
- 轉換必須是純粹的重構 — 不改變任何行為或輸出
- 保留所有既有測試的語義（測試應該繼續通過不需要修改）
- 若遇到某個工具的轉換不清晰（如選項在程式碼中被動態建構），維持原狀並報告該工具為 skipped
```

#### FIX-02b: Convert GitHub typed-wrapper tools to ToolSchema pattern

```
## Mission
將 4 個具有 typed parseArgs wrapper 的 GitHub 工具轉換為 `ToolSchema` + `createToolRunner` 模式：
1. find-github-issues (有 `parseArgsFn` typed wrapper)
2. read-github-issue (有 `parseArgsFn` typed wrapper)
3. review-threads (有 `parseArgsFn` typed wrapper)
4. open-github-issue (有 `parseArgsFn` typed wrapper)

## Context
- Review dimension: Spec implementation omission
- Spec requirement: Req 1 — tool 引數定義、help 文字、驗證邏輯全部來自同一個 schema 宣告

## Input
Read the following files for pattern reference:
- `packages/tools/filter-logs/index.ts` — 已轉換的範例
- `packages/tool-utils/schema.ts` — ToolSchema 介面與 createToolRunner 實作

Read each tool's current implementation:
- `packages/tools/find-github-issues/index.ts`
- `packages/tools/read-github-issue/index.ts`
- `packages/tools/review-threads/index.ts`
- `packages/tools/open-github-issue/index.ts`

## What to do
These 4 tools have a common pattern: they define a typed `parseArgsFn(argv: string[]): TypedArgs` wrapper around `parseArgs()`, then use the typed interface. The conversion approach differs slightly from simple tools:

1. **轉換現有 `parseArgsFn` 為 ToolSchema**：將 `parseArgsFn` 內部的 options definitions 提取為 `ToolSchema.options`。保留所有 option 的 `type`、`default`、`short`。

2. **保留 typed interface 但簡化**：原本的 typed wrapper (`parseArgsFn`) 可以簡化。建立一個新的 `schema` 物件，其 handler 簽名直接使用 `Record<string, unknown>` 和 `positionals`。在 handler 的第一行做 type assertion 到原本的 typed interface（如果有的話）。

3. **重構 handler**：原本的 handler 是 `async function handlerName(argv, context)`，內部先調用 `parseArgsFn(argv)` 再展開 typed fields。轉換後為：
   ```ts
   const schema = {
     options: { ... },
     allowPositionals: true,
     usage: '...',
     description: '...',
     handler: async (values: Record<string, unknown>, positionals: string[], context: ToolContext) => {
       // Type assertion only — no parseArgs call needed
       const typedValues = values as TypedArgs;
       // ... existing logic using typedValues
     },
   };
   ```

4. **移除 top-level `parseArgsFn` 函數**：轉換後不再需要獨立的 parseArgsFn。

5. **保留 handler 內部的 throw 與 error 處理**：確保所有 `throw new UserInputError(...)` / `SystemError(...)` 保持不變。

6. **特別注意 open-github-issue**：此工具的 `parseArgsFn` 最複雜，有較多的自訂處理（labels, milestones 等）。仔細對照每個 option 的型別與預設值。

## Scope
- Allowed files:
  - `packages/tools/find-github-issues/index.ts`
  - `packages/tools/read-github-issue/index.ts`
  - `packages/tools/review-threads/index.ts`
  - `packages/tools/open-github-issue/index.ts`
- Forbidden files:
  - 所有其他非上述 list 中的檔案

## Output
On completion, report:
- List of modified files
- For each file: conversion summary, any non-standard modifications
- Any issues encountered (e.g., options that don't map well to SchemaOption type)

## Verify
- 執行 `node --test 'test/**/*.test.js'` 確認所有測試通過
- 特別注意確認 GitHub issue 相關測試正常運作
- 若 FIX-02a 已在同一批次中完成，其變更檔案的測試也應通過

## Boundaries
- 不修改任何非 listed 的檔案
- typed wrapper 可以簡化為 type assertion，但 handler 內部的型別安全必須保留
- 若某個工具的 `parseArgsFn` 包含無法以 `ToolSchema` 表達的邏輯（如動態 options），報告並保留該工具原狀
```

#### FIX-02c: Convert remaining medium-complexity tools to ToolSchema pattern

```
## Mission
將 4 個中等複雜度的工具轉換為 `ToolSchema` + `createToolRunner` 模式：
1. sync-memory-index (已有完整 AppError 使用)
2. docs-to-voice (已有 AppError 使用)
3. create-specs (已有 AppError 使用，已完成 args 修復)
4. extract-conversations

## Context
- Review dimension: Spec implementation omission
- Spec requirement: Req 1 — tool 引數定義、help 文字、驗證邏輯全部來自同一個 schema 宣告

## Input
Read the following files for pattern reference:
- `packages/tools/filter-logs/index.ts` — 已轉換的範例
- `packages/tool-utils/schema.ts` — ToolSchema 介面與 createToolRunner 實作

Read each tool's current implementation:
- `packages/tools/sync-memory-index/index.ts`
- `packages/tools/docs-to-voice/index.ts`
- `packages/tools/create-specs/index.ts`
- `packages/tools/extract-conversations/index.ts`

## What to do
For each tool, perform the same conversion pattern as FIX-02a, with additional attention to:

1. **sync-memory-index**：此工具有 `--instruction-line` 的 `multiple: true` 設定。在 schema 中，multiple 的 parseArgs option 需轉換為 `{ type: 'string' }`（無 multiple 欄位，因為 SchemaOption 不支援 multiple）。createToolRunner 會將 multiple string 的 values 保持為 `string[]`。原本 handler 內部的 `values['instruction-line'] as string[] | undefined` 可保留。

2. **create-specs**：此工具已有 `--help` 的條件式輸出 (L56-L76)。轉換為 schema 後，`--help` 由 createToolRunner 自動處理。將 L56-L76 的 help 輸出改為 schema 的 `usage` + `description` 欄位。handler 內如果不再需要 help 檢查，可移除。

3. **docs-to-voice** 與 **extract-conversations**：檢查是否有特殊的 options（如 enum 值、數值轉換等），保留原有的 handler 內部驗證邏輯。

4. **保留 handler 內部的雙層 catch**：某些 handler 內部有兩層 try/catch（如 sync-memory-index 與 create-specs）。內層 catch block 用於業務邏輯錯誤處理並 throw UserInputError/SystemError，外層 catch 用於統一格式化。轉換後：
   - 移除**外層**的格式化 catch block（由 createToolRunner 取代）
   - 保留**內層**的業務邏輯 catch block（throw 具型別錯誤），讓 createToolRunner 統一格式化

## Scope
- Allowed files:
  - `packages/tools/sync-memory-index/index.ts`
  - `packages/tools/docs-to-voice/index.ts`
  - `packages/tools/create-specs/index.ts`
  - `packages/tools/extract-conversations/index.ts`
- Forbidden files:
  - 所有其他非上述 list 中的檔案

## Output
On completion, report:
- List of modified files
- For each file: conversion summary
- Any blockers or risks encountered

## Verify
- 執行 `node --test 'test/**/*.test.js'` 確認所有測試通過
- 特別注意 sync-memory-index 的錯誤處理測試 (`test/tools/sync-memory-index-error.test.js`)
- 特別注意 create-specs 的測試

## Boundaries
- 不修改任何非 listed 的檔案
- 雙層 catch 結構的 handler，只移除外層的格式化 catch，保留內層的業務邏輯 catch（throw UserInputError/SystemError）
- create-specs 的 `--help` 區塊必須正確轉換為 schema 的 usage/description，不可遺失 help 內容
```

#### FIX-02d: Convert complex tools with careful handling

```
## Mission
將 3 個較複雜的工具轉換為 `ToolSchema` + `createToolRunner` 模式。這些工具需要更謹慎的處理：
1. architecture (未使用 AppError，使用自訂 YAML/JSON 處理)
2. render-error-book (高度複雜的 PDF 生成邏輯)
3. render-katex (複雜的 KaTeX 渲染邏輯)

## Context
- Review dimension: Spec implementation omission
- Spec requirement: Req 1 — tool 引數定義、help 文字、驗證邏輯全部來自同一個 schema 宣告

## Input
Read the following files for pattern reference:
- `packages/tools/filter-logs/index.ts` — 已轉換的範例
- `packages/tool-utils/schema.ts` — ToolSchema 介面與 createToolRunner 實作

Read each tool's current implementation:
- `packages/tools/architecture/index.ts`
- `packages/tools/render-error-book/index.ts`
- `packages/tools/render-katex/index.ts`

## What to do
For each tool, adapt the standard conversion pattern:

1. **architecture tool**：此工具目前不 import 任何 AppError 子類別，錯誤處理採用 `stderr.write + return 1`。轉換步驟：
   - 提取 tool 主 handler（尋找真正的工具邏輯入口 — architecture 工具使用子命令結構）
   - 對於子命令的 parseArgs，轉換為 schema 格式
   - 由於 architecture 工具內部有複雜的條件分支（diff/merge/apply/template），重構 parseArgs 即可，不需要完全重建 handler 架構
   - 對於原有的 `stderr.write + return 1` 錯誤模式，保留原狀 — 因為這些錯誤是業務邏輯層的處理，而非格式化的統一

   **注意**: TODO list of sub-commands (diff/merge/apply/template) 各有自己的 parseArgs。轉換**工具層級**的 parseArgs（最外層的引數解析），而非每個子命令的內部解析。如果沒有統一的外層 parseArgs，則標記此工具為 partial conversion。

2. **render-error-book** 與 **render-katex**：這兩個工具有較複雜的引數組合。轉換步驟：
   - 只轉換**工具層級**的 parseArgs（handler 內部第一層的 parseArgs）
   - 保留所有的自訂驗證邏輯（enum 值、路徑解析、檔案存取等）
   - 確保 add `createToolRunner` import 與 `UserInputError`/`SystemError` import（如果尚未有）

## Scope
- Allowed files:
  - `packages/tools/architecture/index.ts` — 部分轉換（main handler 層級）
  - `packages/tools/render-error-book/index.ts` — 工具層級 parseArgs 轉換
  - `packages/tools/render-katex/index.ts` — 工具層級 parseArgs 轉換
- Forbidden files:
  - 所有其他非上述 list 中的檔案

## Output
On completion, report:
- List of modified files
- For each file: conversion summary, noting any partial conversions or exceptions
- Clear explanation of any tools that could not be fully converted

## Verify
- 執行 `node --test 'test/**/*.test.js'` 確認所有測試通過
- 若 architecture 有相關測試，確認其通過

## Boundaries
- 不修改任何非 listed 的檔案
- 複雜工具的轉換目標是 **工具層級** 的 parseArgs，不強求子命令層級的轉換
- 若某個工具的架構不適合 schema 轉換（如所有邏輯寫在 handler 內），僅轉換 parseArgs 部分
- 對於無法轉換的工具，詳細記錄原因
```

---

### Regression Test Worker Prompts

#### REGTEST-01: createToolRunner error formatting regression test (related to FIX-01)

```
## Mission
建立 FIX-01 的回歸測試。驗證 `createToolRunner` 的 catch block 能正確依錯誤類型格式化輸出。

## Context
- Fix summary: createToolRunner catch block 現在能辨識 UserInputError、SystemError、generic Error 並採用不同的格式化方式
- Root cause: catch block 原先使用 `stderr.write('Error: ${message}')` 統一格式化所有錯誤，違反 SPEC Req 3
- Fix files involved: `packages/tool-utils/schema.ts`

## Input
- Read fix-related files: `packages/tool-utils/schema.ts`
- Read existing test files as format reference: `test/utils/app-error.test.js`, `test/tools/filter-logs.test.js`, `test/tools/sync-memory-index-error.test.js`

## What to do
Create a regression test at `test/utils/create-tool-runner-error.test.js`:

Test 1: UserInputError formatting
- GIVEN a schema whose handler throws `new UserInputError('invalid input')`
- WHEN calling `createToolRunner(schema)` with args
- THEN exit code is 1
- AND stderr is exactly `'invalid input\n'` (NO "Error:" prefix)
- Oracle: Before FIX-01, the output was `'Error: invalid input\n'`

Test 2: SystemError formatting
- GIVEN a schema whose handler throws `new SystemError('disk failure')`
- WHEN calling `createToolRunner(schema)` with args
- THEN exit code is 1
- AND stderr includes `'disk failure\n'`
- AND stderr includes `'at '` (stack trace present)
- Oracle: Before FIX-01, the output was `'Error: disk failure\n'` (no stack trace)

Test 3: Generic Error formatting
- GIVEN a schema whose handler throws `new Error('generic error')`
- WHEN calling `createToolRunner(schema)` with args
- THEN exit code is 1
- AND stderr is `'Error: generic error\n'`
- Oracle: Should be same before and after FIX-01 (generic Error formatting unchanged)

Test 4: Successful execution (no error)
- GIVEN a schema whose handler returns 0
- WHEN calling `createToolRunner(schema)` with args
- THEN exit code is 0, no stderr output
- Oracle: Unchanged — confirms the catch block doesn't interfere with success path

Use the same `createMemoryStream()` pattern from existing tests:
```js
function createMemoryStream() {
  let data = '';
  return { write(chunk) { data += chunk; return true; }, toString() { return data; } };
}
```

## Scope
- Allowed files:
  - `test/utils/create-tool-runner-error.test.js` — create new test file
- Forbidden files:
  - All source code files
  - All other test files

## Output
On completion, report:
- The test file and all test function names
- Test execution result (must pass)
- Confirmation that the tests validate the fix

## Verify
- Run: `node --test test/utils/create-tool-runner-error.test.js`
- Expected: All 4 tests pass
- Also confirm existing tests still pass: `node --test 'test/**/*.test.js'`

## Boundaries
- Do not modify any source code files
- Use the same test patterns as the existing test suite (node:test, assert/strict, createMemoryStream)
- The test must be independently executable with no external dependencies
```

#### REGTEST-02: Schema conversion smoke test (related to FIX-02)

```
## Mission
建立 FIX-02 的冒煙測試，驗證所有轉換為 ToolSchema 的工具在基礎操作上行為一致。

## Context
- Fix summary: 大量工具從手動 parseArgs 轉換為 ToolSchema + createToolRunner
- Root cause: 工具使用三段式樣板（手寫 parseArgs、help 字串、事後驗證）而非統一 schema
- Fix files involved: 多個 `packages/tools/*/index.ts`

## Input
- Read fix-related files (after FIX-02 conversion):
  - `packages/tools/filter-logs/index.ts` (conversion reference)
  - A sample converted tool to understand the resulting structure
- Read existing test files as format reference: `test/tools/filter-logs.test.js`

## What to do
Create a regression test at `test/tools/schema-conversion-smoke.test.js` that dynamically discovers all tools and verifies they export a working tool definition:

Test 1: All converted tools export a handler
- GIVEN all tool packages (excluding out-of-scope: eval, codegraph)
- WHEN importing each tool module
- THEN each tool exports a `ToolDefinition` with a `handler` function
- AND the handler is callable (doesn't throw on `handler([], {})`)

Test 2: --help flag works for all tools
- GIVEN each tool
- WHEN calling the handler with `['--help']`
- THEN exit code is 0
- AND some help text is written to stdout (non-empty)

Note: Some tools may not natively support `--help` through schema (those that weren't converted or use complex sub-command structures). For those, the test should skip gracefully (expect no help output and ignore).

Use dynamic import to discover tools:
```js
const TOOL_NAMES = [
  'filter-logs', 'search-logs', 'validate-skill-frontmatter',
  'validate-openai-agent-config', 'extract-pdf-text',
  // ... add all tool names that were converted
];
```

The test should be self-maintaining — if a new tool is added later, it should be added to this list.

## Scope
- Allowed files:
  - `test/tools/schema-conversion-smoke.test.js` — create new test file
- Forbidden files:
  - All source code files

## Output
On completion, report:
- The test file and all test function names
- Test execution result (must pass)
- List of any tools that were skipped or produced unexpected results

## Verify
- Run: `node --test test/tools/schema-conversion-smoke.test.js`
- Expected: All tests pass (tools with handlers, tools with --help support)
- Confirm existing tests still pass: `node --test 'test/**/*.test.js'`

## Boundaries
- Do not modify any source code files
- Do not test out-of-scope tools (eval, codegraph)
- For tools not converted to schema (architecture, render-error-book, render-katex), gracefully skip --help verification
- Each test case must be independent and not rely on tool order
```

#### REGTEST-03: Schema arg validation regression test (related to FIX-02)

```
## Mission
建立 FIX-02 的引數驗證回歸測試，確認使用 strict mode 的工具對無效 flag 有統一的拒絕行為。

## Context
- Fix summary: 工具轉換為 ToolSchema，預設使用 `strict: true`（除非特別設定）
- Root cause: 轉換前各工具有各自不同的錯誤處理，轉換後統一由 createToolRunner 的 strict mode 處理
- Fix files involved: 多個 `packages/tools/*/index.ts`

## Input
- Read the following files for reference:
  - `packages/tool-utils/schema.ts` — createToolRunner strict mode 行為
  - `packages/tools/filter-logs/index.ts` — 已轉換的 strict: false 範例

## What to do
Create a regression test at `test/tools/schema-arg-validation.test.js`:

Test 1: strict mode tool rejects unknown flags
- GIVEN a tool with `strict: true` (or default)
- WHEN calling handler with `['--nonexistent-flag', 'value']`
- THEN exit code is 1
- AND stderr includes "Error: " prefix

Test 2: strict:false tool accepts unknown flags (for tools like filter-logs, search-logs)
- GIVEN a tool with `strict: false`
- WHEN calling handler with `['--nonexistent-flag', 'value']`
- THEN exit code is 0 (or the tool's normal behavior for unexpected args, not a strict-mode error)
- AND stderr does NOT contain "Unknown option" or parse error

Test 3: All converted tools reject --nonexistent uniformly (if strict=true)
- GIVEN all converted tools
- WHEN calling handler with an invalid flag
- THEN the error response is consistently formatted

Use dynamic discovery of tools, similar to REGTEST-02 pattern. For each tool, determine its strict mode by checking the schema definition (or calling with unknown flag and observing behavior).

Handle the following exceptions:
- Tools with `strict: false` (filter-logs, search-logs): expect no strict-mode error
- Non-converted tools (architecture): skip

## Scope
- Allowed files:
  - `test/tools/schema-arg-validation.test.js` — create new test file
- Forbidden files:
  - All source code files

## Output
On completion, report:
- The test file and all test function names
- Test execution result (must pass)
- Any tools that produced unexpected error behavior

## Verify
- Run: `node --test test/tools/schema-arg-validation.test.js`
- Expected: All tests pass
- Confirm existing tests still pass: `node --test 'test/**/*.test.js'`

## Boundaries
- Do not modify any source code files
- Be careful with tools that have side effects (file operations, API calls) — use minimal args
- Test should be safe to run — no actual file or network operations
```

---

## 7. Fix Batch Schedule

### Batch 1 — 所有 Fix 平行執行

- **Issues**: FIX-01 + FIX-02a + FIX-02b + FIX-02c + FIX-02d
- **Strategy**: 所有 5 個 fix worker 平行執行（檔案集完全無重疊）
- **Depends on**: 無
- **說明**：FIX-01 修改 `schema.ts`（一個獨立工具函數），FIX-02 各子批次修改各自獨立的工具檔案。無任何檔案重疊，全部可平行執行。
- **注意**：FIX-02a/b/c/d 的 worker 可能會讀到尚未被其他 worker 修改的檔案（因為每個 worker 修改不同的工具），這不會造成衝突。FIX-01 的工作無論如何不影響工具檔案。

**Gate**:
- [ ] FIX-01 worker 報告成功
- [ ] FIX-02a worker 報告成功
- [ ] FIX-02b worker 報告成功
- [ ] FIX-02c worker 報告成功
- [ ] FIX-02d worker 報告成功
- [ ] 執行驗證：`node --test 'test/**/*.test.js'`（預期所有既有測試通過，忽略 coverage 相關失敗）

---

### Batch 2 — Regression Test 平行執行

- **Tasks**: REGTEST-01, REGTEST-02, REGTEST-03
- **Strategy**: 平行執行（檔案集完全無重疊：REGTEST-01 在 `test/utils/`、REGTEST-02 和 REGTEST-03 在 `test/tools/`）
- **Depends on**: Batch 1 全部完成並通過驗證

**Gate**:
- [ ] REGTEST-01 worker 報告成功（所有 4 個 test cases 通過）
- [ ] REGTEST-02 worker 報告成功
- [ ] REGTEST-03 worker 報告成功
- [ ] 所有新 regression tests 通過：`node --test test/utils/create-tool-runner-error.test.js test/tools/schema-conversion-smoke.test.js test/tools/schema-arg-validation.test.js`
- [ ] 既有測試套件通過（確認無回歸）：`node --test 'test/**/*.test.js'`

---

### Batch 3 — 最終整合驗證

- **Tasks**: 完整測試套件、coverage 確認、REPORT.md 比對
- **Strategy**: 順序執行（coordinator 直接處理）
- **Depends on**: Batch 2 完成

**Gate**:
- [ ] 完整測試套件通過：`COVERAGE=true node --test 'test/**/*.test.js'`
- [ ] Coverage thresholds 通過：line >= 80%, branch >= 60%, func >= 75%
- [ ] 逐項確認 REPORT.md 中的每個 issue 已解決
  - [ ] Finding #1 (createToolRunner 錯誤格式化) — 確認 createToolRunner error test 覆蓋
  - [ ] Finding #2 (工具 schema 採用) — 確認所有 FIX-02 批次轉換的工具已通過冒煙測試

---

## 8. Regression Test Inventory

因 regression tests 僅 3 項（≤ 3），不另列表，請直接參照 Section 5 (Fix Details) 中各 fix 的 regression test 設計與 Section 6 的 worker prompts。

---

## 9. Verification Checkpoints

### Checkpoint 1 — After Batch 1 (fix batches complete)
- Run: `node --test 'test/**/*.test.js'`
- Expected: All existing tests pass (ignore any coverage failures from c8 thresholds — those are checked at CI time, not in-line)
- Confirm all 5 FIX workers reported success with no unexpected blockers

### Checkpoint 2 — After Batch 2 (regression tests implemented)
- Run: `node --test test/utils/create-tool-runner-error.test.js test/tools/schema-conversion-smoke.test.js test/tools/schema-arg-validation.test.js`
- Expected: All 3 new regression test files pass
- Logical check: Each REGTEST oracle must be "fails on unfixed code, passes after fix"
  - REGTEST-01 Test 1 (UserInputError without "Error:" prefix): Confirm that running the same test against the OLD code (before FIX-01) would have produced `Error: invalid input` — this is a logical validation, not an execution step
  - REGTEST-02: All converted tools export working handlers
  - REGTEST-03: Strict-mode tools consistently reject unknown flags

### Checkpoint 3 — Final verification
- Run: `node --test 'test/**/*.test.js'`
- Expected: All tests pass (86+ tests)
- Cross-check REPORT.md: every issue confirmed resolved
  - Finding #1: `createToolRunner` catch block now shows UserInputError without prefix, SystemError with stack trace
  - Finding #2: The majority of tools (at least those in FIX-02a/b/c) now use `ToolSchema` + `createToolRunner`

---

## 10. Error Recovery

- **If a fix worker fails**: Retry with the worker's existing context (do not create a new one), giving more specific guidance. At most one retry.
- **If a fix worker fails twice**: Pause the entire flow. Preserve successful results from other workers in the same batch. Report to the user.
- **If a regression test worker reports failure (test cannot pass)**: Check whether the test code is wrong or the fix is incomplete. If the test code is wrong, continue the worker to fix it. If the fix is incomplete, go back to the corresponding fix worker.
- **If a regression test passes on the unfixed code**: The test design is invalid — redesign the oracle and dispatch a new worker.
- **If merge conflicts occur**: The coordinator resolves the conflict, then re-runs the batch gate verification.
- **If a fix or regression test breaks existing tests**: Pause. Report which test failed and which worker's change caused it.
- **For FIX-02 workers that report partial conversions** (some tools skipped): Accept the partial result and document which tools remain unconverted. Do not retry unless the failure is technical (conflict, parse error) rather than complexity-related.

---

## 11. Fix History

### Round 2 — 2026-06-04
- **Issues fixed**: FIX-01 through FIX-06 (P0: 1, P1: 1, P2: 4)
- **Outcome**: All 6 issues resolved in commit `baec86f`
- **Key notes**: create-specs args 修復 (原 P0)、ToolSchema 機制建立 (原 P1)、StdioWriter 整合、sync-memory-index stack trace、ToolNotFoundError 啟用。6 項 deferred 項目經評估維持現狀。

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
- **For the FIX-02 workers (marked as Complex)**: ensure the worker reads the complete tool source file and the reference implementation (filter-logs) before applying conversions. Do not let the worker guess the conversion pattern — they must understand both the old and new structures.
- **FIX-02 workers must report each tool's conversion result individually** — not as a batch aggregate — so the coordinator can verify per-tool coverage.

### ASK FIRST — pause and confirm with the user

- Fix approach conflicts with spec design intent
- Need to add a new external dependency
- Worker has failed twice
- Test regression cannot be quickly diagnosed
- **A FIX-02 worker reports more than 30% of its assigned tools as "skipped" due to complexity** — the conversion approach may need adjustment

### NEVER

- Write implementation logic or modify source code beyond resolving merge conflict markers
- Let workers spawn sub-workers
- Skip verification and proceed to the next batch
- Modify spec documents (unless the fix reveals a spec error — report it instead)
- Start regression tests before all fixes are verified
- **Defer any REPORT.md issue to a future round** — every issue has a complete fix plan in this FIX.md
- **Remove any functionality during schema conversion** — the conversion is a pure refactoring that must produce identical observable behavior
