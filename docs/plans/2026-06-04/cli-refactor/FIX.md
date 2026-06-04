# Fix Coordinator Prompt: CLI 工具全面重構 — Round 10

- **Date**: 2026-06-05
- **Source REPORT**: `docs/plans/2026-06-04/cli-refactor/REPORT.md` (Round 10)
- **Source Spec**: `docs/plans/2026-06-04/cli-refactor/`
- **Total Issues**: P1: 2, P2: 6, P3: 8
- **Total Regression Tests**: 5

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

修復 CLI refactoring Round 10 審查中發現的 16 項問題（2 P1 + 6 P2 + 8 P3）。核心目標依優先級：

1. **P1 涵蓋率門檻低於 SPEC** — `scripts/test.sh` 的 line coverage threshold 設為 65% 而非 SPEC 要求的 80%，且低於 FIX.md 建議的 75%。需調整至 75% 並補足工具測試讓 CI 通過
2. **P1 generate-storyboard-images 8 個泛型 Error** — `parsePromptEntries` 及 `parsePromptsFile` 中的輸入驗證應拋出 `UserInputError` 而非 `new Error(...)`
3. **P2 architecture 工具繞過 createToolRunner** — 手動實作引數解析、錯誤處理、說明文字
4. **P2 多項工具仍有泛型 Error** — open-github-issue、validate-skill-frontmatter、validate-openai-agent-config、review-threads 的輔助函式仍拋出 `new Error(...)`
5. **P2 REGTEST-05 死碼** — `.ts` 測試檔未被編譯或執行
6. **P2 CLI 派發架構瑕疵** — 直接工具名稱降階路徑繞過 ToolArgsParser；if-else 鏈重複派發表邏輯
7. **P3 各項** — 死碼移除、adapter 改用、文件同步

共 8 個 Fix Workers（含合併的同檔案變更） + 5 個 Regression Test Workers。

**Success looks like**: All issues resolved, all regression tests pass, full test suite passes, no regressions.

---

## 3. Issue Inventory

- FIX-01 (P1, 簡單, 實作遺漏): 涵蓋率門檻 65% 低於 SPEC 80% 要求 — `scripts/test.sh`
- FIX-02 (P1, 簡單, 規格偏離): generate-storyboard-images 輸入解析 8 處 throw new Error() 應為 UserInputError — `packages/tools/generate-storyboard-images/index.ts`
- FIX-03 (P2, 複雜, 規格偏離): architecture 工具完全繞過 createToolRunner — `packages/tools/architecture/index.ts`
- FIX-04 (P2, 簡單, 規格偏離): open-github-issue L525/L554 泛型 Error 應為 SystemError — `packages/tools/open-github-issue/index.ts`
- FIX-05 (P2, 簡單, 規格遺漏): validate-skill-frontmatter + validate-openai-agent-config extractFrontmatter 泛型 Error — 2 個檔案
- FIX-06 (P2, 簡單, 架構瑕疵): REGTEST-05 (.ts) 未編譯/執行，需轉換為 .js — `test/tools/enforce-video-aspect-ratio/index.test.ts`
- FIX-07 (P2, 簡單, 架構瑕疵): 直接工具名稱降階路徑繞過 ToolArgsParser — `packages/cli/index.ts`
- FIX-08 (P3, 簡單, 規格偏離): review-threads L150/L321 泛型 Error 應為 UserInputError — `packages/tools/review-threads/index.ts`
- FIX-09 (P3, 簡單, 冗餘程式碼): open-github-issue FLAG_MAP + buildArgsFromYargs 死碼 — `packages/tools/open-github-issue/index.ts`
- FIX-10 (P3, 簡單, 規格偏離): test/installer.test.js 使用 raw process.platform 而非 adapter — `test/installer.test.js`
- FIX-11 (P3, 簡單, 規格遺漏): extract-conversations 使用 process.env.HOME 而非 adapter.homeDir() — `packages/tools/extract-conversations/index.ts`
- FIX-12 (P3, 簡單, 架構瑕疵): PlatformAdapter singleton 缺少 mock injection 機制 — `packages/tool-utils/platform-adapter.ts`
- FIX-13 (P3, 簡單, 冗餘程式碼): 4 個 help-text wrapper 函式多餘間接層 — `packages/cli/index.ts`
- FIX-14 (P3, 簡單, 冗餘程式碼): assertCommand 呼叫在型別收窄後為冗餘 — `packages/cli/index.ts`
- FIX-15 (P3, 簡單, 規格遺漏): SPEC/PROMPT 工具數量與實際不符 (18/19 vs 21) — `SPEC.md`, `PROMPT.md`
- FIX-16 (P3, 簡單, 架構瑕疵): if-else 鏈重複派發表路由邏輯 — `packages/cli/index.ts`

---

## 4. Fix Dependency Analysis

### Dependencies

- FIX-01 (coverage threshold) depends on FIX-03 (architecture coverage improvement) for CI to pass with higher threshold — **logical dependency**
- FIX-04 (open-github-issue generic Error) and FIX-09 (open-github-issue dead code) share the same file → merged into one worker
- FIX-07, FIX-13, FIX-14, FIX-16 all modify `packages/cli/index.ts` → merged into one worker
- FIX-15 (documentation drift) is docs-only, no code dependency
- All REGTESTs depend on their corresponding FIX completing first

### File overlaps

- FIX-04 + FIX-09: both modify `packages/tools/open-github-issue/index.ts` → merged into **Worker 3**
- FIX-07 + FIX-13 + FIX-14 + FIX-16: all modify `packages/cli/index.ts` → merged into **Worker 5**
- FIX-01 modifies `scripts/test.sh`; no overlap with any other fix
- All other fixes modify unique files → can run in parallel within their batch

### Parallelism strategy

| Batch | Workers | File overlap | Strategy |
|---|---|---|---|
| Batch 1 | FIX-01, FIX-02 | No overlap | **Parallel** |
| Batch 2 | FIX-03, Worker-3, FIX-05, FIX-06, FIX-08, FIX-10, FIX-11, FIX-12 | No overlap | **Parallel** |
| Batch 3 | Worker-5 (cli/index.ts) | Self-contained file | **Single worker, sequential** |
| Batch 4 | FIX-15 (docs) | No overlap with code | **Sequential** (docs only) |
| Batch 5 | REGTEST-01~05 | Test files may overlap | **Parallel** (no source overlap) |

---

## 5. Fix Details (with Regression Test Design)

### FIX-01: Coverage threshold 65% → 75% (P1-1)

**Root cause**: When FIX-05 (Round 9) narrowed the coverage exclude from `packages/tools/**` to `packages/tools/eval/**`, the threshold was simultaneously lowered from `80` to `65` to avoid CI failures from newly-included low-coverage tool packages. The FIX.md recommended `75` but the fix implemented `65`.

**Files involved**: `scripts/test.sh` > L14

**Fix approach**:
1. Raise `--test-coverage-lines` from `65` to `75`
2. Raise `--test-coverage-functions` from `65` to `70`
3. This will cause CI to fail if actual coverage drops below 75% lines or 70% functions
4. Verify architecture tool coverage increases enough from the FIX-03 changes (wrapping handler in createToolRunner exposes error paths to coverage)

If the build still fails after FIX-03's coverage improvements, keep the current 65% threshold and instead update SPEC.md to document the adjusted threshold as a conscious tradeoff. This is an ASK FIRST decision.

**Complexity**: Simple — 1 file, 2 values changed

**Regression test**: Manual/CI verification only
- Command: `COVERAGE=true bash scripts/test.sh`
- Expected: Exit code 0 (coverage meets thresholds)
- No automated regression test possible for CI config changes

---

### FIX-02: generate-storyboard-images input parsing 8x throw Error → UserInputError (P1-2)

**Root cause**: `parsePromptEntries()` (L88-108) and `parsePromptsFile()` (L110-182) handle user-provided input validation (empty prompts, invalid JSON, missing scenes) but throw `new Error(...)` instead of `UserInputError`. These propagate through `createToolRunner`'s catch block which formats them with the generic "Error:" prefix.

**Files involved**: `packages/tools/generate-storyboard-images/index.ts` > L94, L100, L103, L106, L120, L144, L149, L181

**Fix approach**: Replace all 8 `throw new Error(...)` sites with `throw new UserInputError(...)`:
- L94: `throw new UserInputError(\`Empty prompt at index ${i}\`);`
- L100: `throw new UserInputError(\`Empty prompt in object at index ${i}\`);`
- L103: `throw new UserInputError(\`Invalid item type at index ${i}: expected string or object\`);`
- L106: `throw new UserInputError('No prompts found.');`
- L120: `throw new UserInputError('Object mode requires a top-level "scenes" array.');`
- L144: `throw new UserInputError(\`Invalid scene at index ${si}: expected object.\`);`
- L149: `throw new UserInputError(\`Scene ${si}: 'description' is required.\`);`
- L181: `throw new UserInputError('Top-level JSON must be an array or an object.');`

The tool already imports `UserInputError` at line 5:
```ts
import { UserInputError, SystemError, createToolRunner } from '@laitszkin/tool-utils';
```

**Complexity**: Simple — 1 file, 8 find-and-replace lines

**Regression test**: REGTEST-01 (Unit → `test/tools/generate-storyboard-images-prompt-multiple.test.js`)
- GIVEN an empty prompt value WHEN `parsePromptEntries` processes it THEN throws `UserInputError` (not generic Error)
- Oracle: `assert.throws(() => ..., UserInputError)` passes after fix, fails before fix (throws Error)

---

### FIX-03: architecture tool → use createToolRunner (P2-3)

**Root cause**: `architectureHandler` is a raw async function assigned directly to `tool.handler` (L648-654). It does not use `createToolRunner`, so all argument parsing (L163-170, L498-502), error handling (L156-159, L178-187, L218-221, L433-442, L505-507, L596-605, L641-644), and help text (L157, L505) are manually implemented.

**Files involved**: `packages/tools/architecture/index.ts` > entire file

**Fix approach**:

This is complex because architecture has nested subcommands (`apply`, `template`, and a fallback to the legacy JS CLI). `createToolRunner` wraps a single `schema.handler` with `parseArgs`, which doesn't support nested subcommands naturally. Approach:

1. **Wrap the existing `architectureHandler` inside a `createToolRunner` schema** with minimal options (just `--help`). The existing manual subcommand parsing for `apply`/`template` stays as-is within the handler:
   ```
   schema = {
     options: { help: { type: 'boolean', short: 'h' } },
     allowPositionals: true,
     usage: 'apltk architecture <apply|template> [options]',
     handler: architectureHandler,
   };
   ```
2. **Remove the duplicate error boundary** from `handleTemplate`'s outer catch (L596-605) and `architectureHandler`'s catch (L640-644) — let errors propagate to `createToolRunner`'s catch block
3. **Convert early-exit error paths** (`stderr.write + return 1`) to typed `throw`:
   - L156-159: Missing YAML arg → `throw new UserInputError(...)` instead of `stderr.write + return 1`
   - L178-182: YAML parse failure → `throw new UserInputError(...)` instead of `stderr.write + return 1`
   - L184-187: YAML not object → `throw new UserInputError(...)` instead of `stderr.write + return 1`
   - L218-221: resolveProjectRoot failure — already caught; keep as-is since it redirects to error boundary
   - L505-507: Missing template args → `throw new UserInputError(...)` instead of `stderr.write + return 1`
4. **Remove duplicate catch block** in `handleTemplate` (L596-605) and `architectureHandler` (L640-644) — they duplicate `createToolRunner`'s catch logic
5. **Keep `handleApply`'s mutations catch block** (L433-442) because it's inside a transaction-like batch that needs local error handling for partial failures

**Complexity**: Complex — requires understanding architecture's dual dispatch (in-process apply/template + legacy JS CLI)

**Regression test**: REGTEST-02 (Integration → existing `test/tools/architecture-error-types.test.js`)
- GIVEN architecture handler with invalid arguments WHEN called THEN verify it throws typed AppError (not stderr.write+return1)
- Oracle: Test that previously asserted stderr.write behavior must be updated to assert on exit code 1 + specific error messages

---

### FIX-04 + FIX-09: open-github-issue generic errors + dead code (P2-4 + P3-1)

**Root cause (generic errors)**: `createIssueWithGh` (L525) throws `new Error(...)` for gh CLI failures instead of `SystemError`. `createIssueWithToken` (L554) throws `new Error(...)` for API response format errors instead of `SystemError`.

**Root cause (dead code)**: `FLAG_MAP` (L867-884) and `buildArgsFromYargs` (L886-897) were used pre-createToolRunner conversion. `createToolRunner` receives already-parsed `values` from `node:util.parseArgs`, so these are never called.

**Files involved**: `packages/tools/open-github-issue/index.ts` > L525, L554, L867-897

**Fix approach**:
1. L525: Change `throw new Error(...)` to `throw new SystemError(...)`:
   ```ts
   throw new SystemError(result.stderr.trim() || 'gh issue create failed');
   ```
2. L554: Change `throw new Error(...)` to `throw new SystemError(...)`:
   ```ts
   throw new SystemError('Issue created but response did not include html_url');
   ```
3. Remove L867-897: Delete `FLAG_MAP` constant and `buildArgsFromYargs` function entirely

The tool already imports `SystemError` at line 7 (verified). No import changes needed.

**Complexity**: Simple — 1 file, 2 type replacements + remove ~30 lines dead code

**Regression test**: REGTEST-03 (Unit → `test/tools/handler-error-propagation.test.js`)
- GIVEN a mocked gh command that fails WHEN `createIssueWithGh` is called THEN verify `SystemError` is thrown
- Oracle: `assert.throws(() => ..., SystemError)` passes after fix, fails before fix (throws Error)

---

### FIX-05: validate tools extractFrontmatter generic Error (P2-5)

**Root cause**: Both `validate-skill-frontmatter/index.ts` (L19, L26) and `validate-openai-agent-config/index.ts` (L24, L31, L36) have an `extractFrontmatter` helper function that validates YAML frontmatter structure. It throws `new Error(...)` for structural validation failures instead of `UserInputError`.

**Files involved**:
- `packages/tools/validate-skill-frontmatter/index.ts` > L19, L26
- `packages/tools/validate-openai-agent-config/index.ts` > L24, L31, L36

**Fix approach**: In BOTH files, replace generic `throw new Error(...)` with `throw new UserInputError(...)`:

For `validate-skill-frontmatter/index.ts`:
- L19: `throw new UserInputError("SKILL.md must start with YAML frontmatter delimiter '---'.");`
- L26: `throw new UserInputError("SKILL.md frontmatter is missing the closing '---' delimiter.");`

For `validate-openai-agent-config/index.ts`:
- L24: `throw new UserInputError("SKILL.md must start with YAML frontmatter delimiter '---'.");`
- L31: `throw new UserInputError('SKILL.md frontmatter must be a YAML mapping.');`
- L36: `throw new UserInputError("SKILL.md frontmatter is missing the closing '---' delimiter.");`

Both files need `UserInputError` added to their imports:
```ts
import { UserInputError, createToolRunner } from '@laitszkin/tool-utils';
```

**Complexity**: Simple — 2 files, 5 find-and-replace lines + import addition

**Regression test**: REGTEST-04 (Unit → existing `test/tools/validation-error-handling.test.js`)
- GIVEN a SKILL.md without proper YAML frontmatter WHEN `extractFrontmatter` processes it THEN throws `UserInputError`
- Oracle: `assert.throws(() => ..., UserInputError)` passes after fix, fails before fix

---

### FIX-06: REGTEST-05 .ts → .js conversion (P2-6)

**Root cause**: `test/tools/enforce-video-aspect-ratio/index.test.ts` is a TypeScript file but the test runner glob (`test/**/*.test.js`) only matches `.js` files. No compilation step exists for `test/` directory. The 2 regression tests for FIX-08 (typed error verification) are never executed.

**Files involved**: `test/tools/enforce-video-aspect-ratio/index.test.ts`

**Fix approach**: Rename the file from `.test.ts` to `.test.js` so the test runner picks it up. The file contents are plain JavaScript (no TypeScript type annotations — verified) so the extension change is sufficient.

```bash
git mv test/tools/enforce-video-aspect-ratio/index.test.ts test/tools/enforce-video-aspect-ratio/index.test.js
```

**Note**: The file already uses CommonJS patterns (`import test from 'node:test'`), which is the project standard. No content changes needed.

**Complexity**: Simple — rename only

**Regression test**: The file IS the regression test. After renaming, it will be picked up by the test runner and executed automatically. No additional test needed.

---

### FIX-07: Direct tool name fallback bypasses ToolArgsParser (P2-7)

**Root cause**: In `packages/cli/index.ts` L178-193, `parseArguments()` has a fallback path: when `firstArg` is not a dispatch-table key but `isKnownToolName(firstArg)` returns true, the code manually constructs a result object instead of routing through `ToolArgsParser`. This creates a second parallel implementation of tool dispatch logic.

**Files involved**: `packages/cli/index.ts` > L178-193

**Fix approach**: Route the direct tool name path through `ToolArgsParser`:
1. Before the fallback check at L178, parse args through `toolParser` when the first arg is a known tool name:
```ts
if (firstArg && isKnownToolName(firstArg)) {
  const cmd = toolParser.parse(argv);
  assertCommand<ToolCommand>(cmd, 'tool');
  return {
    command: 'tool' as const,
    modes: [],
    toolName: cmd.toolName,
    toolArgs: cmd.toolArgs,
    showHelp: false,
    showToolsHelp: false,
    toolkitHome: undefined,
    assumeYes: false,
    linkMode: undefined,
    explicitInstallCommand: undefined,
    helpTopic: 'overview' as const,
    installSpecificMode: undefined,
  };
}
```
2. Verify `ToolArgsParser` correctly handles the bare tool name (e.g., `['filter-logs', 'app.log']` — the parser should set `toolName: 'filter-logs'` and `toolArgs: ['app.log']`)

**Complexity**: Simple — 1 function within 1 file

---

### FIX-08: review-threads L150, L321 generic Error (P3-2)

**Root cause**: After FIX-09 (Round 9), 8/10 generic `throw new Error()` sites in review-threads were converted to typed errors. Two sites remain: L150 (`resolvePrNumber` — gh CLI failure not on PR branch context) and L321 (input JSON validation — missing required fields in thread data).

**Files involved**: `packages/tools/review-threads/index.ts` > L150, L321

**Fix approach**:
1. L150: Change to `UserInputError` (unable to infer PR from branch — user context error):
   ```ts
   throw new UserInputError('Unable to infer PR number from current branch context');
   ```
2. L321: Change to `UserInputError` (input validation):
   ```ts
   throw new UserInputError('JSON must include thread_ids, adopted_thread_ids, or threads');
   ```

Both types are already imported at line 4-5:
```ts
import { UserInputError, SystemError, createToolRunner } from '@laitszkin/tool-utils';
```

**Complexity**: Simple — 1 file, 2 lines changed

**Regression test**: REGTEST-05 (Unit → existing `test/tools/handler-error-propagation.test.js`)
- GIVEN a mocked gh command that fails (non-zero exit) WHEN `resolvePrNumber` is called THEN throws `UserInputError`
- Oracle: `assert.throws(() => ..., UserInputError)` passes after fix, fails before fix (throws Error)

---

### FIX-10: test/installer.test.js raw process.platform → adapter (P3-3)

**Root cause**: `test/installer.test.js` L334 uses `process.platform === 'win32' ? 'junction' : 'dir'` to determine symlink type for `fs.symlink()`. This bypasses the PlatformAdapter abstraction defined in Req 2.

**Files involved**: `test/installer.test.js` > L334

**Fix approach**: Replace with `createPlatformAdapter().symlinkType()`:
```ts
import { createPlatformAdapter } from '@laitszkin/tool-utils';
// ...
const adapter = createPlatformAdapter();
await fs.symlink(sourceSkill, targetSkill, adapter.symlinkType());
```

The import already exists (installer.ts imports from `@laitszkin/tool-utils`), but the test file may need its own import. Check existing imports.

**Complexity**: Simple — 1 file, 1 line + import addition

---

### FIX-11: extract-conversations HOME → adapter.homeDir() (P3-4)

**Root cause**: `packages/tools/extract-conversations/index.ts` L7 uses `process.env.HOME || ''` for resolving the `.codex` directory path. On Windows where `HOME` may be unset, this produces a relative path (`/.codex`). The PlatformAdapter's `homeDir()` correctly falls back through `USERPROFILE` → `HOME` → `os.homedir()`.

**Files involved**: `packages/tools/extract-conversations/index.ts` > L6-8

**Fix approach**: Replace `getCodexHome()` with adapter-based resolution:
```ts
import { createPlatformAdapter } from '@laitszkin/tool-utils';

function getCodexHome(): string {
  if (process.env.CODEX_HOME) return process.env.CODEX_HOME;
  const adapter = createPlatformAdapter();
  return path.join(adapter.homeDir(), '.codex');
}
```

The adapter's homeDir() handles the platform-specific env var fallback chain correctly.

**Complexity**: Simple — 1 file, ~3 lines changed

---

### FIX-12: PlatformAdapter singleton mock injection (P3-5)

**Root cause**: `createPlatformAdapter()` always returns the current platform's adapter deterministically. `resetPlatformAdapter()` clears the singleton but doesn't accept an override value. Code that calls `createPlatformAdapter()` at module scope in production code always executes with the real platform adapter.

**Files involved**: `packages/tool-utils/platform-adapter.ts` > L103-115

**Fix approach**: Add optional override parameter to `resetPlatformAdapter()`:
```ts
export function resetPlatformAdapter(adapter?: PlatformAdapter): void {
  _adapter = adapter;
}
```

When called without arguments, it clears the cache (current behavior). When called with an adapter instance, it sets the singleton to that instance. This allows test injection:

```ts
resetPlatformAdapter(new PosixAdapter()); // Force POSIX behavior for Windows tests
// ... run test ...
resetPlatformAdapter(); // Clear for next test
```

**Complexity**: Simple — 1 function signature change

---

### FIX-13 + FIX-14 + FIX-16: CLI index.ts cleanups (P3-6, P3-7, P3-8)

**Root cause (FIX-13)**: Four one-liner wrapper functions (`buildHelpText`, `buildToolsHelp`, `buildInstallHelpText`, `buildUninstallHelpText` at L61-76) each instantiate `HelpTextBuilder` and call a single method. Call sites import `HelpTextBuilder` directly, making these wrappers unnecessary indirection.

**Root cause (FIX-14)**: `assertCommand` calls (L110, L128, L147, L162) are made inside type-narrowed branches (e.g., `if (firstArg === 'uninstall')` then `assertCommand<UninstallCommand>(...)`), where the type is already guaranteed by the branch condition.

**Root cause (FIX-16)**: After selecting the parser from the dispatch table (L106), `parseArguments` still uses `if (firstArg === 'uninstall')`, `if (firstArg === 'install')` string comparisons to determine per-command processing (L108-176). Adding a new command requires both a Map entry AND an if-else branch.

**Files involved**: `packages/cli/index.ts` > L61-76, L107-176, L328-334

**Fix approach (all three in one worker since same file)**:

1. **FIX-13**: Remove 4 wrapper functions; update the export at L334 to export `HelpTextBuilder` directly instead:
   - Delete L61-76 (four wrapper functions)
   - Update L334: remove `buildHelpText, buildInstallHelpText, buildUninstallHelpText, buildToolsHelp` from exports
   - Update call sites in `index.ts` that use these wrappers (check L352-365 in `run()`) to call `new HelpTextBuilder(...)` directly

2. **FIX-14**: Remove all 4 `assertCommand` calls (L110, L128, L147, L162). The type narrowing from the if-else chain already guarantees the command type. If `assertCommand` is still used elsewhere, keep it; if only used in these 4 locations, consider removing the function too.

3. **FIX-16**: Simplify the if-else chain by using a structured result builder map (optional — see Boundaries section for "clarify if approach conflicts with spec design intent"):
   - Keep the existing structure but document that the if-else chain is intentional (each command type has different return shape)
   - Or refactor to a dispatch handler map. This is more involved and may exceed the "simple" classification.

**Complexity**: Simple for FIX-13 (remove wrappers) and FIX-14 (remove redundant assertions). FIX-16 (if-else refactor) is moderately complex but can be done as a targeted refactor.

---

### FIX-15: Documentation drift — tool name count (P3-6)

**Root cause**: SPEC.md L118 says "19 tool packages" and PROMPT.md L75 says "18 individual tool packages (eval excluded)", but tool-registration.ts has 21 entries. The scope has shifted during refactoring rounds without updating documentation counts.

**Files involved**: `docs/plans/2026-06-04/cli-refactor/SPEC.md`, `docs/plans/2026-06-04/cli-refactor/PROMPT.md`

**Fix approach**:
1. SPEC.md L118: Update "19 tool packages" to "21 tool packages"
2. PROMPT.md L75: Update "18 individual tool packages (eval excluded)" to "21 individual tool packages (eval excluded)" — or count based on what's actually in scope
3. Check if any other references need updating

**Complexity**: Simple — docs only, no code changes

---

## 6. Worker Prompt Library

### Fix Worker Prompts

#### Worker 1 (FIX-01): Coverage threshold adjustment

```
## Mission
Raise the test coverage threshold in scripts/test.sh from 65% lines / 65% functions to 75% lines / 70% functions. This closes the gap between the SPEC requirement (80%) and the current enforcement threshold.

## Context
- Review dimension: Spec implementation omission
- Spec requirement: Req 4 (Coverage >= 80% + CI matrix)
- The threshold was lowered when tools were brought into coverage scope, creating a 15-point gap from SPEC

## Input
- Read `scripts/test.sh` — the GROUP1_FLAGS line at approximately L14

## What to do
1. Change `--test-coverage-lines=65` to `--test-coverage-lines=75`
2. Change `--test-coverage-functions=65` to `--test-coverage-functions=70`
3. Keep `--test-coverage-branches=60` unchanged

If running `COVERAGE=true bash scripts/test.sh` fails with the new thresholds (architecture tool coverage may be too low), report the failure and the specific threshold that was breached rather than lowering the threshold.

## Scope
- Allowed: `scripts/test.sh` only
- Forbidden: Any source code or test files

## Output
- The before/after threshold values
- Whether CI passes with the new thresholds
- If CI fails, which metric(s) failed and by how much

## Verify
- Run: `COVERAGE=true bash scripts/test.sh`
- Expected: All test groups pass, coverage meets all three thresholds

## Boundaries
- Do not modify any file other than scripts/test.sh
- If CI fails, report the exact failure — do not lower thresholds
```

#### Worker 2 (FIX-02): generate-storyboard-images generic Error → UserInputError

```
## Mission
Replace 8 generic `throw new Error(...)` calls with `throw new UserInputError(...)` in generate-storyboard-images input-parsing helper functions. These are input validation errors that deserve the UserInputError format (no "Error:" prefix, clean message).

## Context
- Review dimension: Spec implementation deviation
- Spec requirement: Req 3 (Unified error handling)
- UserInputError is already imported at line 5

## Input
- Read `packages/tools/generate-storyboard-images/index.ts` L88-182 (parsePromptEntries and parsePromptsFile functions)

## What to do
Replace each `throw new Error(...)` with `throw new UserInputError(...)` at these 8 lines:

1. L94: `throw new UserInputError(\`Empty prompt at index ${i}\`);`
2. L100: `throw new UserInputError(\`Empty prompt in object at index ${i}\`);`
3. L103: `throw new UserInputError(\`Invalid item type at index ${i}: expected string or object\`);`
4. L106: `throw new UserInputError('No prompts found.');`
5. L120: `throw new UserInputError('Object mode requires a top-level "scenes" array.');`
6. L144: `throw new UserInputError(\`Invalid scene at index ${si}: expected object.\`);`
7. L149: `throw new UserInputError(\`Scene ${si}: 'description' is required.\`);`
8. L181: `throw new UserInputError('Top-level JSON must be an array or an object.');`

The UserInputError import already exists at line 5.

## Scope
- Allowed: `packages/tools/generate-storyboard-images/index.ts` only
- Forbidden: Any other file

## Output
- Which lines were changed
- Verification that `UserInputError` is still properly imported
- Test results

## Verify
- Build: `npm run build` must succeed
- Tests: `node --test test/tools/generate-storyboard-images-prompt-multiple.test.js` must pass

## Boundaries
- Change ONLY the Error type — preserve all error messages and logic
- Do not modify any other function or behavior in the file
```

#### Worker 3 (FIX-04 + FIX-09): open-github-issue generic errors + dead code removal

```
## Mission
Two fixes in one file: (1) Replace 2 generic `throw new Error(...)` calls with `throw new SystemError(...)` in open-github-issue for gh/API failures; (2) Remove ~30 lines of dead code (FLAG_MAP constant and buildArgsFromYargs function).

## Context
- Review dimension: Spec implementation deviation + Redundant code
- Spec requirement: Req 3 (Unified error handling) + Req 1 (Tool boilerplate)
- SystemError and UserInputError are already imported at line 7

## Input
- Read `packages/tools/open-github-issue/index.ts` L520-557 (createIssueWithGh and createIssueWithToken functions)
- Read L865-897 (FLAG_MAP and buildArgsFromYargs)

## What to do
1. L525: Change `throw new Error(result.stderr.trim() || 'gh issue create failed');` to `throw new SystemError(result.stderr.trim() || 'gh issue create failed');`
2. L554: Change `throw new Error('Issue created but response did not include html_url');` to `throw new SystemError('Issue created but response did not include html_url');`
3. Delete L867-897 entirely — remove FLAG_MAP constant and buildArgsFromYargs function
4. Verify there are no other references to FLAG_MAP or buildArgsFromYargs in the file (there should be none, but check)

## Scope
- Allowed: `packages/tools/open-github-issue/index.ts` only
- Forbidden: Any other file

## Output
- Which lines were changed
- Confirmation that SystemError is properly imported
- Confirmation that FLAG_MAP/buildArgsFromYargs have no remaining references

## Verify
- Build: `npm run build` must succeed
- Tests: `node --test test/tools/handler-error-propagation.test.js` must pass

## Boundaries
- Change ONLY the Error type and remove dead code — preserve all other logic
- Do not introduce any functional changes
```

#### Worker 4 (FIX-05): validate tools extractFrontmatter generic Error → UserInputError

```
## Mission
Replace 5 generic `throw new Error(...)` calls with `throw new UserInputError(...)` across two validate tools' extractFrontmatter helper functions. Both tools have the same helper function pattern.

## Context
- Review dimension: Spec implementation omission
- Spec requirement: Req 3 (Unified error handling)
- Both tools need UserInputError added to their imports

## Input
- Read `packages/tools/validate-skill-frontmatter/index.ts` L1-30 (imports and extractFrontmatter function)
- Read `packages/tools/validate-openai-agent-config/index.ts` L1-40 (imports and extractFrontmatter function)

## What to do
For `packages/tools/validate-skill-frontmatter/index.ts`:
1. Add `UserInputError` to the import from `@laitszkin/tool-utils` at line 3-4
2. L19: Replace `throw new Error(...)` with `throw new UserInputError(...)`
3. L26: Replace `throw new Error(...)` with `throw new UserInputError(...)`

For `packages/tools/validate-openai-agent-config/index.ts`:
1. Add `UserInputError` to the import from `@laitszkin/tool-utils` at line 3-4
2. L24: Replace `throw new Error(...)` with `throw new UserInputError(...)`
3. L31: Replace `throw new Error(...)` with `throw new UserInputError(...)`
4. L36: Replace `throw new Error(...)` with `throw new UserInputError(...)`

## Scope
- Allowed: Both validate tool files
- Forbidden: Any other file

## Output
- Which lines were changed in each file
- Verification that UserInputError is properly imported

## Verify
- Build: `npm run build` must succeed
- Tests: `node --test test/tools/validation-error-handling.test.js` must pass

## Boundaries
- Change ONLY the Error type and add imports — preserve all error messages and logic
- Do not modify the tools' handlers (already throw UserInputError from Round 9 FIX-02)
```

#### Worker 5 (FIX-07 + FIX-13 + FIX-14 + FIX-16): CLI index.ts dispatch + cleanup

```
## Mission
Four fixes in packages/cli/index.ts: (1) Route direct tool name fallback through ToolArgsParser; (2) Remove redundant help-text wrapper functions; (3) Remove redundant assertCommand calls; (4) Simplify if-else chain coupling.

## Context
- Review dimension: Architecture defect + Redundant code
- Spec requirement: Req 5 (Dispatch isolation) + Req 1 (Tool boilerplate)

## Input
- Read `packages/cli/index.ts` L61-210 (help wrappers, assertCommand, parseArguments function)
- Read L328-334 (exports)

## What to do
### FIX-07: Route direct tool name fallback through ToolArgsParser
In parseArguments(), replace the direct tool name path at L178-193:

Change from manual construction to using toolParser:
```ts
// L178-193 — replace with:
if (firstArg && isKnownToolName(firstArg)) {
  const cmd = toolParser.parse(argv);
  assertCommand<ToolCommand>(cmd, 'tool');
  return {
    command: 'tool' as const,
    modes: [],
    toolName: cmd.toolName,
    toolArgs: cmd.toolArgs,
    showHelp: false,
    showToolsHelp: false,
    toolkitHome: undefined,
    assumeYes: false,
    linkMode: undefined,
    explicitInstallCommand: undefined,
    helpTopic: 'overview' as const,
    installSpecificMode: undefined,
  };
}
```

### FIX-13: Remove 4 help-text wrapper functions
Remove L61-76 (four wrapper functions: buildHelpText, buildToolsHelp, buildInstallHelpText, buildUninstallHelpText). Check L352-365 in run() to see if any call these wrappers — if so, replace with direct HelpTextBuilder usage at the call site.

Update the export at L334 to remove the deleted function names. HelpTextBuilder class is already exported separately.

### FIX-14: Remove redundant assertCommand calls
Remove all 4 assertCommand calls at L110, L128, L147, L162. The if-else chain guarantees the command type before each call. Keep the assertCommand function definition at L85-89 for future use.

### FIX-16: Simplify if-else chain 
The if-else chain at L107-176 is a structural coupling issue. The cleanest approach for now: each branch already returns early, so the coupling is moderate. Document with comments that each branch exists because different command types have different ParsedArguments shapes. Do NOT attempt a full refactor to a handler map — it would change too much surface area for a P3 issue.

## Scope
- Allowed: `packages/cli/index.ts` only
- Forbidden: Any other file

## Output
- Brief summary of each change
- Verification of build and tests

## Verify
- Build: `npm run build` must succeed
- Tests: `node --test 'test/cli/**/*.test.js' 'test/tool-runner.test.js'` must pass

## Boundaries
- Do not change the runtime behavior of parseArguments()
- Do not change the shape of ParsedArguments returns
- Preserve all existing export signatures for backward compatibility
```

#### Worker 6 (FIX-06): REGTEST-05 .ts → .js rename

```
## Mission
Rename `test/tools/enforce-video-aspect-ratio/index.test.ts` to `.test.js` so the test runner glob (`test/**/*.test.js`) picks it up. The file content is plain JavaScript with no TypeScript annotations.

## Context
- Review dimension: Architecture defect
- Spec requirement: Req 4 (Coverage + CI matrix)
- The file was accidentally created as `.ts` during Round 9 but never compiled

## Input
- Read `test/tools/enforce-video-aspect-ratio/index.test.ts` to confirm no TypeScript-only syntax

## What to do
1. Verify the file has no TypeScript type annotations, interfaces, or type imports (it's plain JS with node:test)
2. Rename using git: `git mv test/tools/enforce-video-aspect-ratio/index.test.ts test/tools/enforce-video-aspect-ratio/index.test.js`
3. Run the test to confirm it executes

## Scope
- Allowed: Only this test file
- Forbidden: Any source code

## Output
- Confirmation the file was renamed
- Test execution result

## Verify
- Run: `node --test test/tools/enforce-video-aspect-ratio/index.test.js`
- Expected: Test passes (no actual test assertions should fail; they test typed error behavior that was verified working in FIX-08)

## Boundaries
- Do not modify file content — rename only
```

#### Worker 7 (FIX-08): review-threads generic Error → UserInputError

```
## Mission
Replace 2 remaining generic `throw new Error(...)` calls with `throw new UserInputError(...)` in review-threads/index.ts. These were missed by Round 9 FIX-09.

## Context
- Review dimension: Spec implementation deviation
- Spec requirement: Req 3 (Unified error handling)
- UserInputError and SystemError are already imported

## Input
- Read `packages/tools/review-threads/index.ts` L136-155 (resolvePrNumber function) and L310-327 (thread ID parsing)

## What to do
1. L150: Change `throw new Error(...)` to `throw new UserInputError(...)`:
   ```ts
   throw new UserInputError('Unable to infer PR number from current branch context');
   ```

2. L321: Change `throw new Error(...)` to `throw new UserInputError(...)`:
   ```ts
   throw new UserInputError('JSON must include thread_ids, adopted_thread_ids, or threads');
   ```

## Scope
- Allowed: `packages/tools/review-threads/index.ts` only
- Forbidden: Any other file

## Output
- Which lines were changed
- Verification that typed errors are properly imported

## Verify
- Build: `npm run build` must succeed
- Tests: Run tests to confirm no regression

## Boundaries
- Change ONLY the Error type — preserve all error messages and logic
```

#### Worker 8 (FIX-10 + FIX-11 + FIX-12 + FIX-15): Cross-platform + docs fixes

```
## Mission
Four independent fixes: (1) Replace raw process.platform in installer test; (2) Adapt extract-conversations to use adapter.homeDir(); (3) Add mock injection to PlatformAdapter singleton; (4) Update tool name counts in docs.

## Context
- Review dimension: Spec implementation deviation, Spec implementation omission, Architecture defect
- Spec requirement: Req 2 (Cross-platform), Req 4 (Coverage)

## Input
- Read `test/installer.test.js` L330-340
- Read `packages/tools/extract-conversations/index.ts` L1-10 (getCodexHome function)
- Read `packages/tool-utils/platform-adapter.ts` L103-115 (singleton factory)
- Read `docs/plans/2026-06-04/cli-refactor/SPEC.md` L118
- Read `docs/plans/2026-06-04/cli-refactor/PROMPT.md` L75

## What to do
### FIX-10: installer test process.platform → adapter.symlinkType()
In `test/installer.test.js` L334, replace:
```ts
await fs.symlink(sourceSkill, targetSkill, process.platform === 'win32' ? 'junction' : 'dir');
```
with:
```ts
const { createPlatformAdapter } = await import('@laitszkin/tool-utils');
const adapter = createPlatformAdapter();
await fs.symlink(sourceSkill, targetSkill, adapter.symlinkType());
```
Add the import at the top of the file (or use dynamic import as shown).

### FIX-11: extract-conversations HOME → adapter.homeDir()
In `packages/tools/extract-conversations/index.ts`, modify getCodexHome():
```ts
import { createPlatformAdapter } from '@laitszkin/tool-utils';

function getCodexHome(): string {
  if (process.env.CODEX_HOME) return process.env.CODEX_HOME;
  const adapter = createPlatformAdapter();
  return path.join(adapter.homeDir(), '.codex');
}
```

### FIX-12: PlatformAdapter mock injection
In `packages/tool-utils/platform-adapter.ts`, change resetPlatformAdapter():
```ts
export function resetPlatformAdapter(adapter?: PlatformAdapter): void {
  _adapter = adapter;
}
```
When called with an adapter instance, it sets the singleton for injection. When called with undefined (no arg), it clears the cache (preserving existing behavior).

### FIX-15: Documentation drift
In `SPEC.md` L118: Update "19 tool packages" to "21 tool packages"
In `PROMPT.md` L75: Update "18 individual tool packages (eval excluded)" to "21 individual tool packages (eval excluded)"
Check for any other count references that need updating.

## Scope
- Allowed: All files listed above
- Forbidden: Any other source or test files

## Output
- Summary of each change made
- Verification results

## Verify
- Build: `npm run build` must succeed
- Tests for FIX-10: `node --test test/installer.test.js` passes
- Tests for FIX-11: verify extract-conversations tool still resolves correctly
- Tests for FIX-12: `node --test test/utils/platform-adapter.test.js` passes
- No test changes needed for FIX-15 (docs only)

## Boundaries
- FIX-12 preserves existing resetPlatformAdapter() behavior when called without args
- FIX-11 does not change the CODEC_HOME env var priority (still checked first)
- Do not modify any files not in the allowed list
```

### Regression Test Worker Prompts

#### REGTEST-01: generate-storyboard-images parse errors (FIX-02)

```
## Mission
Create a regression test for FIX-02 (generate-storyboard-images input parsing throws UserInputError instead of generic Error). This test ensures the 8 input validation paths have proper typed error handling.

## Context
- Fix summary: 8 generic `throw new Error(...)` replaced with `throw new UserInputError(...)` in parsePromptEntries and parsePromptsFile
- Root cause: Input validation in helper functions used generic Error instead of UserInputError
- Fix files involved: `packages/tools/generate-storyboard-images/index.ts`

## Input
- Read fix-related file: `packages/tools/generate-storyboard-images/index.ts` L88-108, L110-182
- Read existing test as format reference: `test/tools/generate-storyboard-images-prompt-multiple.test.js`

## What to do
Add tests to `test/tools/generate-storyboard-images-prompt-multiple.test.js`:

Test 1 — empty prompt throws UserInputError:
- Call handler (or create mock schema handler) with `--prompt ''`
- Verify it throws `UserInputError` (not `Error`)

Test 2 — no prompts provided:
- Call with no `--prompt` and no `--prompts-file`
- Verify it throws `UserInputError` with message containing "required"

Oracle for both: `assert.throws(() => ..., UserInputError)` passes after fix, fails before fix (throws generic Error)

## Scope
- Allowed: `test/tools/generate-storyboard-images-prompt-multiple.test.js`
- Forbidden: Any source code files

## Output
- Test file path and test function names
- Test execution result (must pass)

## Verify
- Run: `node --test test/tools/generate-storyboard-images-prompt-multiple.test.js`
- Expected: REGTEST-01 tests pass

## Boundaries
- Do not modify any source code files
- The test must be independently executable
- Follow existing test file's formatting conventions (node:test + assert.strict)
```

#### REGTEST-02: architecture typed error boundary (FIX-03)

```
## Mission
Create regression tests for FIX-03 (architecture tool wrapped in createToolRunner). Verify that error paths in the architecture handler produce typed AppError behavior.

## Context
- Fix summary: architectureHandler wrapped in createToolRunner; error paths converted from stderr.write+return1 to typed throws
- Root cause: Architecture tool completely bypassed createToolRunner
- Fix files involved: `packages/tools/architecture/index.ts`

## Input
- Read fix-related file: `packages/tools/architecture/index.ts` (handler, apply, template sections)
- Read existing test as format reference: `test/tools/architecture-error-types.test.js`

## What to do
Add tests to `test/tools/architecture-error-types.test.js`:

Test 1 — missing YAML arg returns exit code 1:
- Call architecture handler with `['apply']` (no YAML file)
- Verify exit code is 1

Test 2 — invalid YAML returns exit code 1:
- Call architecture handler with `['apply', '/nonexistent/file.yaml']`
- Verify exit code is 1

Test 3 — unknown flag behavior:
- Call architecture handler with `['--unknown-flag']`
- Verify consistent error behavior (exit code 1 via createToolRunner's strict:true mode)

Note: These tests verify the error boundary works, not specific error messages. The exact behavior depends on how the handler was wrapped.

## Scope
- Allowed: `test/tools/architecture-error-types.test.js`
- Forbidden: Any source code files

## Output
- Test file path and test function names
- Test execution result (must pass)

## Verify
- Run: `node --test test/tools/architecture-error-types.test.js`
- Expected: All regression tests pass

## Boundaries
- Do not modify any source code files
- Do not test internal implementation details — test observable behavior (exit codes, error output)
```

#### REGTEST-03: open-github-issue SystemError throw (FIX-04)

```
## Mission
Create a regression test for FIX-04 (open-github-issue gh/API failures throw SystemError instead of generic Error).

## Context
- Fix summary: createIssueWithGh and createIssueWithToken now throw SystemError instead of new Error()
- Root cause: External command and API failures used generic Error, losing typed error formatting
- Fix files involved: `packages/tools/open-github-issue/index.ts`

## Input
- Read fix-related file: `packages/tools/open-github-issue/index.ts` L520-557
- Read existing test as format reference: `test/tools/handler-error-propagation.test.js`

## What to do
Add a test to `test/tools/handler-error-propagation.test.js`:

Test — handler catches SystemError with proper exit code:
- Call the handler (or create a test harness invoking createIssueWithGh or createIssueWithToken) with a broken API URL or gh command
- Verify exit code is 1 (createToolRunner catches SystemError and returns 1)
- Verify stderr contains the error message

Since these functions require network/gh CLI, a unit test may mock the underlying call:
- Use dynamic import to test directly: import the module and invoke createIssueWithToken with a bad token
- Or verify via handler: call handler with --dry-run and invalid --repo

Oracle: Error is caught by SystemError path (stderr without "Error:" prefix + stack trace in non-prod)

## Scope
- Allowed: `test/tools/handler-error-propagation.test.js`
- Forbidden: Any source code files

## Output
- Test file path and test function names
- Test execution result (must pass)

## Verify
- Run: `node --test test/tools/handler-error-propagation.test.js`
- Expected: All tests pass

## Boundaries
- Do not modify any source code files
- Avoid network/gh calls in tests — use mockable approaches
```

#### REGTEST-04: validate tools extractFrontmatter UserInputError (FIX-05)

```
## Mission
Create a regression test for FIX-05 (validate-skill-frontmatter and validate-openai-agent-config extractFrontmatter throws UserInputError instead of generic Error).

## Context
- Fix summary: 5 generic throw new Error() calls replaced with throw new UserInputError() in extractFrontmatter across both tools
- Root cause: Helper function for YAML frontmatter validation used generic Error instead of UserInputError
- Fix files involved: Both validate tools

## Input
- Read fix-related files: Both validate tools (importer sections only)
- Read existing test as format reference: `test/tools/validation-error-handling.test.js`

## What to do
Add tests to `test/tools/validation-error-handling.test.js`:

Test 1 — frontmatter missing opening delimiter:
- Create a test SKILL.md without YAML frontmatter (or test extractFrontmatter directly)
- Import extractFrontmatter or invoke the tool's handler
- Verify UserInputError is thrown with message containing "delimiter"

Test 2 — frontmatter missing closing delimiter:
- Create a test SKILL.md with only opening `---` but no closing `---`
- Invoke the relevant function
- Verify UserInputError is thrown with message containing "closing"

Oracle: `assert.throws(() => ..., UserInputError)` passes after fix, fails before fix

## Scope
- Allowed: `test/tools/validation-error-handling.test.js`
- Forbidden: Any source code files

## Output
- Test file path and test function names
- Test execution result (must pass)

## Verify
- Run: `node --test test/tools/validation-error-handling.test.js`
- Expected: All tests pass

## Boundaries
- Do not modify any source code files
- Tests should test the handler level (end-to-end), not internal functions
```

#### REGTEST-05: review-threads resolvePrNumber UserInputError (FIX-08)

```
## Mission
Create a regression test for FIX-08 (review-threads resolvePrNumber throws UserInputError instead of generic Error on gh CLI failure).

## Context
- Fix summary: 2 remaining generic Error throws in review-threads converted to UserInputError
- Root cause: L150 resolvePrNumber and L321 JSON validation were missed by Round 9 FIX-09
- Fix files involved: `packages/tools/review-threads/index.ts`

## Input
- Read fix-related file: `packages/tools/review-threads/index.ts` L136-155
- Read existing test as format reference: `test/tools/handler-error-propagation.test.js`

## What to do
Add a test to `test/tools/handler-error-propagation.test.js`:

Test — handler catches valid repo with GH error:
- Call handler with a valid `--repo` but with a gh command that would fail
- Or test via the tool's handler with `--pr` targeting a nonexistent PR
- Verify exit code is 1
- Verify UserInputError is thrown (caught by createToolRunner)

If direct gh invocation is impractical, test indirectly:
- The handler wrapper in createToolRunner catches all typed errors
- Focus on asserting that the handler returns exit code 1 for invalid input

Oracle: Exit code is 1, stderr contains the error message (no "Error:" prefix for UserInputError)

## Scope
- Allowed: `test/tools/handler-error-propagation.test.js`
- Forbidden: Any source code files

## Output
- Test file path and test function names
- Test execution result (must pass)

## Verify
- Run: `node --test test/tools/handler-error-propagation.test.js`
- Expected: All tests pass

## Boundaries
- Do not modify any source code files
- Avoid network/gh calls in tests
```

---

## 7. Fix Batch Schedule

### Batch 1 — P1 Fixes (Parallel)

- **Issues**: FIX-01, FIX-02
- **Workers**: Worker 1 (coverage threshold), Worker 2 (generate-storyboard-images)
- **Strategy**: Parallel — no file overlap
- **Depends on**: Nothing
- **Gate**:
  - [ ] Worker 1 reports success
  - [ ] Worker 2 reports success
  - [ ] Run verification: `npm run build && node --test test/tools/generate-storyboard-images-prompt-multiple.test.js`

---

### Batch 2 — P2/P3 Tool Fixes (Parallel)

- **Issues**: FIX-03, FIX-04+FIX-09, FIX-05, FIX-06, FIX-08, FIX-10+FIX-11+FIX-12+FIX-15
- **Workers**: Worker 3, Worker 4, Worker 6, Worker 7, Worker 8
- **Strategy**: Parallel — no file overlap between any workers
- **Depends on**: Batch 1
- **Gate**:
  - [ ] Worker 3 (architecture) reports success
  - [ ] Worker 4 (open-github-issue) reports success
  - [ ] Worker 6 (validate tools) reports success
  - [ ] Worker 7 (REGTEST-05 rename) reports success
  - [ ] Worker 8 (review-threads) reports success
  - [ ] Worker 9 (cross-platform + docs) reports success
  - [ ] Run verification: `npm run build`

---

### Batch 3 — CLI Dispatch Fix (Sequential — Single Worker)

- **Issues**: FIX-07, FIX-13, FIX-14, FIX-16
- **Worker**: Worker 5 (all changes to `packages/cli/index.ts`)
- **Strategy**: Sequential — single file, single worker handles all 4 changes
- **Depends on**: Batch 2
- **Gate**:
  - [ ] Worker 5 reports success
  - [ ] Run verification: `npm run build && node --test 'test/cli/**/*.test.js' 'test/tool-runner.test.js'`

---

### Batch 4 — Regression Test Implementation (Parallel)

- **Tasks**: REGTEST-01, REGTEST-02, REGTEST-03, REGTEST-04, REGTEST-05
- **Strategy**: Parallel — test files are independent
- **Depends on**: All fix batches completed
- **Gate**:
  - [ ] REGTEST-01 worker reports success
  - [ ] REGTEST-02 worker reports success
  - [ ] REGTEST-03 worker reports success
  - [ ] REGTEST-04 worker reports success
  - [ ] REGTEST-05 worker reports success
  - [ ] All new regression tests pass
  - [ ] Existing test suite passes (confirm no regression)

---

### Batch 5 — Final Verification (Sequential)

- **Tasks**: Full test suite, coverage check
- **Strategy**: Sequential (coordinator handles directly or dispatches a single worker)
- **Depends on**: All preceding batches
- **Gate**:
  - [ ] Full test suite passes: `COVERAGE=true bash scripts/test.sh`
  - [ ] Every issue in REPORT.md confirmed resolved (cross-check findings list)

---

## 8. Regression Test Inventory

- REGTEST-01 → FIX-02: [Unit] `test/tools/generate-storyboard-images-prompt-multiple.test.js` — GIVEN empty prompt WHEN parsePromptEntries processes it THEN throws UserInputError
- REGTEST-02 → FIX-03: [Integration] `test/tools/architecture-error-types.test.js` — GIVEN invalid args WHEN architecture handler called THEN exit code 1 via typed error boundary
- REGTEST-03 → FIX-04: [Unit] `test/tools/handler-error-propagation.test.js` — GIVEN gh failure WHEN createIssueWithGh called THEN throws SystemError
- REGTEST-04 → FIX-05: [Unit] `test/tools/validation-error-handling.test.js` — GIVEN broken frontmatter WHEN extractFrontmatter processes THEN throws UserInputError
- REGTEST-05 → FIX-08: [Unit] `test/tools/handler-error-propagation.test.js` — GIVEN gh failure WHEN resolvePrNumber called THEN throws UserInputError

---

## 9. Verification Checkpoints

### Checkpoint 1 — After fix batches complete (before regression tests)
- Run: `npm run build`
- Expected: All existing tests pass, all fixes confirmed
- Logical check: Each fix worker's verify step must pass

### Checkpoint 2 — After regression tests are implemented
- Run: `node --test test/tools/generate-storyboard-images-prompt-multiple.test.js test/tools/handler-error-propagation.test.js test/tools/validation-error-handling.test.js test/tools/architecture-error-types.test.js`
- Expected: All new regression tests pass, confirming each fix is effective
- Logical check: Each REGTEST oracle verifies "fails on unfixed code, passes after fix"

### Checkpoint 3 — Final verification
- Run full test suite: `COVERAGE=true bash scripts/test.sh`
- Confirm lint passes (if applicable)
- Cross-check REPORT.md: every issue resolved

---

## 10. Error Recovery

- **If a fix worker fails**: Retry with the worker's existing context (do not create a new one), giving more specific guidance. At most one retry.
- **If a fix worker fails twice**: Pause the entire flow. Preserve successful results from other workers in the same batch. Report to the user.
- **If a regression test worker reports failure (test cannot pass)**: Check whether the test code is wrong or the fix is incomplete. If the test code is wrong, continue the worker to fix it. If the fix is incomplete, go back to the corresponding fix worker.
- **If a regression test passes on the unfixed code**: The test design is invalid — redesign the oracle and dispatch a new worker.
- **If merge conflicts occur**: The coordinator resolves the conflict, then re-runs the batch gate verification.
- **If a fix or regression test breaks existing tests**: Pause. Report which test failed and which worker's change caused it.

---

## 11. Fix History

### Round 10 — 2026-06-05
- **Issues fixed**: FIX-01 through FIX-16 (P1:2, P2:6, P3:8)
- **Outcome**: TBD
- **Key notes**: FIX-01 (coverage threshold) may fail CI if architecture tool coverage hasn't improved enough from FIX-03. If CI fails, ASK FIRST about accepting the tradeoff vs adding more architecture tests.

### Round 9 — 2026-06-04
- **Issues fixed**: FIX-01 through FIX-13 (P2:5, P3:8)
- **Outcome**: All resolved in commit `17f7e49`
- **Key notes**: Coverage exclude narrowed from `packages/tools/**` to `packages/tools/eval/**`, thresholds adjusted from 80→65 (creating Round 10 FIX-01)

### Round 8 — 2026-06-04
- **Issues fixed**: FIX-01 through FIX-21 (P2:8, P3:13)
- **Outcome**: All resolved in commit `a2e8877`

### Round 7 — 2026-06-04
- **Issues fixed**: FIX-01 through FIX-23 (P1:1, P2:12, P3:10)
- **Outcome**: All resolved in commit `d8ecb99`

### Round 6 — 2026-06-04
- **Issues fixed**: FIX-01 through FIX-03 (P1:1, P3:2)
- **Outcome**: All resolved

### Rounds 1-5 — 2026-06-04
- **Issues fixed**: All Round 1-5 issues
- **Outcome**: Progressive resolution across rounds

---

## 12. Boundaries

### ALWAYS

- Run gate verification immediately after every batch
- Extract worker prompts verbatim from Section 6 — do not rewrite them
- After a worker reports, digest the results before deciding next steps
- Fixes must not conflict with the original spec requirements
- Regression tests must not start before all fix batches pass
- Resolve merge conflicts yourself — the coordinator handles them. This is coordination, not implementation.
- **For FIX-03 (architecture)**: ensure the worker performs systematic debugging (reading related code, tracing execution paths) before applying the fix. Do not let the worker guess the fix.

### ASK FIRST — pause and confirm with the user

- Fix approach conflicts with spec design intent
- Need to add a new external dependency
- Worker has failed twice
- Test regression cannot be quickly diagnosed
- **FIX-01 coverage threshold causes CI failure** — raising to 75% may fail if architecture coverage hasn't improved enough. If so, present options: (a) keep 65% and update SPEC, (b) add architecture tests and raise to 75%, (c) raise to compromise value (70%)

### NEVER

- Write implementation logic or modify source code beyond resolving merge conflict markers
- Let workers spawn sub-workers
- Skip verification and proceed to the next batch
- Modify spec documents (unless the fix reveals a spec error — report it instead)
- Start regression tests before all fixes are verified
- **Defer any REPORT.md issue to a future round** — every issue has a complete fix plan in this FIX.md
