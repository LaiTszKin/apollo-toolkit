# Review Report — Round 10

- **Spec**: CLI 工具全面重構 (cli-refactor)
- **Date**: 2026-06-05
- **Reviewer**: Claude Code (agent-review)
- **Verdict**: Needs Work

---

## Verdict

**Needs Work** — 2 P1 findings identified. All 13 Round 9 issues (5 P2 + 8 P3) resolved in `17f7e49`. Key new issues: coverage threshold at 65% (not 80% as SPEC requires); `generate-storyboard-images` 8 input-parsing throw sites still use generic `Error` instead of `UserInputError`. Two architecture-adjacent tools (architecture, codegraph) continue to bypass `createToolRunner` as known carryovers. `test/tools/enforce-video-aspect-ratio/index.test.ts` is a .ts file never compiled or executed, rendering its two regression tests dead code.

---

## Requirement Status Summary

| Requirement | Status | Evidence Location | Open Findings |
|---|---|---|---|
| Req 1 — Tool boilerplate reduction | ✅ Complete | 18/19 in-scope tools use `createToolRunner`; `SchemaOption.description` + `buildHelpText` type rendering verified; all tools `strict:true` | 2 P2, 3 P3 |
| Req 2 — Cross-platform abstraction | ✅ Complete | `PlatformAdapter` singleton (`WindowsAdapter`/`PosixAdapter`) in `platform-adapter.ts`; zero `process.platform` in production code; `@laitszkin/tool-utils` deps declared in both `cli/` and `tui/` package.json | 0 P2, 3 P3 |
| Req 3 — Unified error handling | ⚠️ Partial | `AppError` hierarchy in `app-error.ts`; CLI boundary (L496-507) + `createToolRunner` catch block (schema.ts L101-113) correctly differentiate all 4 types. Multiple tools still have generic `throw new Error()` in helper functions | 1 P1, 4 P2, 1 P3 |
| Req 4 — Coverage >= 80% + CI matrix | ⚠️ Partial | CI matrix ubuntu+windows with `fail-fast: false`; coverage thresholds: 65% lines (not 80% per SPEC); actual line coverage ~72%; REGTEST-05 is dead code (.ts never compiled) | 1 P1, 1 P2 |
| Req 5 — Dispatch isolation | ✅ Complete | `CommandParser<T>` interface; 3 independent parser classes; dispatch table; `assertCommand` runtime guard; `HelpTextBuilder` unified; 56 tests across 6 test files | 2 P2, 3 P3 |

---

## Cross-requirement Interaction Summary

**Requirement Groups:**

| Group | Requirements | Interaction Type | Summary |
|---|---|---|---|
| A | Req 1, Req 3, Req 4 | Shared modules, functional coupling, file overlap | All interact via the tool execution pipeline. Architecture bypasses both Req 1's schema framework and Req 3's typed error boundary (P2-3). Multiple tools (generate-storyboard-images, open-github-issue, validate-skill-frontmatter, validate-openai-agent-config) share the pattern of generic Error throws in helper functions. REGTEST-05 (Req 4) tests enforce-video-aspect-ratio's Req 3 error handling but is dead code. |
| B | Req 2 | Isolated | Cross-platform abstraction consumed independently; no code-level interaction with other requirements. |
| C | Req 5 | Isolated | Dispatch table and parser classes self-contained in `packages/cli/parsers/`. |

---

## Findings

### P1 — Requirement Defect

| # | Description | Impact | File | Line | Dimension | Requirement |
|---|---|---|---|---|---|---|
| 1 | **Coverage threshold at 65% instead of SPEC's 80%**: After FIX-05 narrowed the exclude pattern from `packages/tools/**` to `packages/tools/eval/**`, the line coverage threshold was lowered from 80 to 65 to accommodate newly-included low-coverage tool packages. The threshold is 15 percentage points below the SPEC requirement. Actual line coverage is ~72% (Group 1) and ~69% (Group 2) — above the threshold but below the SPEC | Any CI run with line coverage between 65% and 79.99% passes despite violating the spec. A regression dropping 7 points of coverage would not be caught. The FIX.md recommended 75% lines; actual implementation is 65% — also below the recommendation | `scripts/test.sh` | L14 | Spec implementation omission | Req 4 |
| 2 | **generate-storyboard-images input parsing: 8 generic `throw new Error()` should be `UserInputError`**: `parsePromptEntries` and `parsePromptsFile` use `throw new Error(...)` for all input validation errors (empty prompts, invalid item types, missing scenes, malformed JSON). These are user input errors that `createToolRunner`'s catch block formats with the generic `"Error:"` prefix instead of the clean `UserInputError` format. The handler calls these functions during execution, so the errors propagate through `createToolRunner` — they are caught and reported, but with wrong formatting | 8 input validation paths produce generic error output instead of the spec-required typed formatting. Partial failures per spec Requirement 3 | `packages/tools/generate-storyboard-images/index.ts` | L94, L100, L103, L106, L120, L144, L149, L181 | Spec implementation deviation | Req 3 |

### P2 — Requirement Risk

| # | Description | Impact | File | Line | Dimension | Requirement |
|---|---|---|---|---|---|---|
| 3 | **architecture tool bypasses createToolRunner entirely**: Exports raw `architectureHandler` function, manually implements argument parsing (`handleApply` L163-170, `handleTemplate` L498-502), error handling with `stderr.write + return 1` patterns (L156-159, 180-182, 185-187, 219-221, 432-441, 505-507, 641-644, plus handleTemplate catch L596-605), and hand-written help strings | Tool duplicates framework capabilities. Error handling bypasses unified AppError boundary. Known carryover from Round 8 without fix plan | `packages/tools/architecture/index.ts` | L156-605, L610-653 | Spec implementation deviation | Req 1, Req 3 |
| 4 | **open-github-issue L525, L554 generic `throw new Error()`**: `createIssueWithGh` (L525) throws generic Error for `gh` CLI failures instead of `SystemError`. `createIssueWithToken` (L554) throws generic Error for unexpected API response format instead of `SystemError`. Round 9 FIX-01 converted `resolveRepoAsync` but missed these two gh/API error paths | External command and API errors lose `SystemError` formatting (stack trace in non-production). Generic Error prefix applied instead | `packages/tools/open-github-issue/index.ts` | L525, L554 | Spec implementation deviation | Req 3 |
| 5 | **validate-skill-frontmatter / validate-openai-agent-config: `extractFrontmatter` helper throws generic `Error`**: Both tools share `extractFrontmatter` which validates YAML frontmatter structure. Throws `new Error(...)` for missing opening `---`, missing closing `---`, or non-YAML-mapping content (5 throw sites total across both files). Round 9 FIX-02 converted handler-level errors to `UserInputError` but these helper-level throws remain generic | Input validation errors in shared helpers produce generic error output instead of clean `UserInputError` format | `packages/tools/validate-skill-frontmatter/index.ts`, `packages/tools/validate-openai-agent-config/index.ts` | L19, L26, L24, L31, L36 | Spec implementation omission | Req 3 |
| 6 | **REGTEST-05 regression test is dead code (TypeScript never compiled)**: `test/tools/enforce-video-aspect-ratio/index.test.ts` is a `.ts` file but the test runner glob (`test/**/*.test.js`) only matches `.js` files. No `tsconfig.json` includes `test/` for compilation. No `dist/test/` directory exists. The two regression tests for FIX-08 (generic Error → typed in helper functions) are never executed | Regression in enforce-video-aspect-ratio typed error handling (parseSize, probeVideoSize) would not be caught by CI | `test/tools/enforce-video-aspect-ratio/index.test.ts` | entire file | Architecture defect | Req 4 |
| 7 | **Direct tool name fallback bypasses ToolArgsParser**: When `firstArg` is a known tool name (e.g., `apltk filter-logs app.log`), `parseArguments` constructs the result manually instead of routing through `ToolArgsParser`. Creates a second, parallel dispatch path outside the dispatch table | `ToolArgsParser` modifications must also update the fallback path. Dispatch table is not the single source of truth | `packages/cli/index.ts` | L178-193 | Architecture defect | Req 5 |
| 8 | **Cascading if-else chains duplicate dispatch-table routing logic**: After selecting the correct parser from the `Map`, parseArguments still uses string comparisons (`firstArg === 'uninstall'`, `firstArg === 'install'`) to determine per-command processing. Adding a new command type requires both a Map entry AND a new if-else branch | The if-else chain acts as a second dispatch table. New command types must touch two separate areas | `packages/cli/index.ts` | L107-176 | Architecture defect | Req 5 |

### P3 — Suggestion

| # | Description | Impact | File | Line | Dimension | Requirement |
|---|---|---|---|---|---|---|
| 9 | **open-github-issue: dead code — FLAG_MAP and buildArgsFromYargs (~30 lines)**: `FLAG_MAP` (Record mapping camelCase keys to CLI flags) and `buildArgsFromYargs` (converting yargs-style argv to CLI arg strings) are defined but never called. Remnants from pre-createToolRunner era | Dead code creates maintenance burden and confusion | `packages/tools/open-github-issue/index.ts` | L867-897 | Redundant code | Req 1 |
| 10 | **review-threads L150, L321: 2 remaining generic `throw new Error()` missed by FIX-09**: `resolvePrNumber` (L150) and input JSON validation (L321) still use generic Error instead of `UserInputError`. 8/10 throw sites were converted in FIX-09; these two remain | Minor inconsistency in otherwise-converted file; errors still caught and reported correctly | `packages/tools/review-threads/index.ts` | L150, L321 | Spec implementation deviation | Req 1, Req 3 |
| 11 | **test/installer.test.js uses raw `process.platform` instead of `adapter.symlinkType()`**: L334 uses `process.platform === 'win32' ? 'junction' : 'dir'` bypassing the PlatformAdapter abstraction | Test bypasses abstraction; if adapter symlink logic changes, test won't reflect it | `test/installer.test.js` | L334 | Spec implementation deviation | Req 2 |
| 12 | **extract-conversations uses `process.env.HOME` directly instead of `adapter.homeDir()`**: L7 uses `process.env.HOME || ''` for resolving `.codex` directory. On Windows where `HOME` may be unset, falls back to empty string producing a relative path | Cross-platform path resolution at risk on Windows; adapter's `homeDir()` correctly falls back through `USERPROFILE` → `HOME` → `os.homedir()` | `packages/tools/extract-conversations/index.ts` | L7 | Spec implementation omission | Req 2 |
| 13 | **PlatformAdapter singleton lacks mock injection**: `createPlatformAdapter()` always returns current platform's adapter. `resetPlatformAdapter()` clears cache but doesn't accept override. Code calling `createPlatformAdapter()` at module scope always uses real adapter | Testing Windows paths on macOS requires mocking at higher level (process.platform) or testing adapter classes directly. Known design tradeoff | `packages/tool-utils/platform-adapter.ts` | L103-115 | Architecture defect | Req 2 |
| 14 | **Redundant `assertCommand` calls after type-narrowing if-else chain**: Each `assertCommand` call (L110, 128, 147, 162) is already inside a string-comparison branch that guarantees the command type. The guard can never fail at these call sites | Belt-and-suspenders check; no functional impact but redundant | `packages/cli/index.ts` | L110, 128, 147, 162 | Redundant code | Req 5 |
| 15 | **Documentation drift: SPEC/PROMPT reference 18–19 tool names, actual `TOOL_MODULE_NAMES` has 21**: SPEC says "19 tool packages" (L118), PROMPT says "18 individual tool packages" (L75), but tool-registration.ts has 21 entries + 3 aliases = 24 known names | Documentation accuracy concern; does not affect correct resolution | `packages/cli/tool-registration.ts`, `SPEC.md`, `PROMPT.md` | various | Spec implementation omission | Req 5 |
| 16 | **Four help-text one-liner wrapper functions add unnecessary indirection**: `buildHelpText`, `buildToolsHelp`, `buildInstallHelpText`, `buildUninstallHelpText` (L61-76) each instantiate `HelpTextBuilder` and call a single method. Call sites already import `HelpTextBuilder` directly | Trivial indirection; backward compatibility wrappers | `packages/cli/index.ts` | L61-76 | Redundant code | Req 5 |

---

## Dimension Summary

| Dimension | Count |
|---|---|
| Spec implementation deviation | 6 |
| Spec implementation omission | 4 |
| Architecture defect | 3 |
| Redundant code | 3 |

---

## Review History

### Round 10 — 2026-06-05

**Verdict**: Needs Work — 2 P1 and 6 P2 and 8 P3 findings identified after Round 9 resolution. Key new issue: coverage threshold lowered to 65% when tools were brought into scope, creating a gap from the SPEC's 80% requirement (P1-1); `generate-storyboard-images` 8 input-parsing throw sites still use generic `Error` instead of `UserInputError` (P1-2). `architecture` bypass of `createToolRunner` continues as a known carryover (P2-3). REGTEST-05 is dead TypeScript code never executed (P2-6). All 13 Round 9 issues verified resolved.

**Resolved from Round 9**:
- P2-1 (open-github-issue resolveRepo error duplication): ✅ Fixed — throws `UserInputError` directly (L682-683)
- P2-2 (validate tools stderr.write+return1): ✅ Fixed — both now throw `UserInputError` with aggregated errors
- P2-3 (generate-storyboard-images silent failure): ✅ Fixed — failure counter tracked (L296), summary warning at end (L364-366)
- P2-4 (missing `@laitszkin/tool-utils` dependency): ✅ Fixed — declared in `cli/package.json:22` and `tui/package.json:21`
- P2-5 (coverage exclude masks tools): ⚠️ **Partially fixed** — tools now in scope but threshold lowered to 65% (new P1-1 in this round)
- P3-1 (SchemaOption missing description): ✅ Fixed — `description?: string` in type (L8-9)
- P3-2 (buildHelpText no type distinction): ✅ Fixed — renders `<value>` for strings, `[...]` for multiple
- P3-3 (filter-logs/search-logs strict:false): ✅ Fixed — both use `strict: true`
- P3-4 (enforce-video-aspect-ratio generic Error): ✅ Fixed — all 8 throw sites use `UserInputError`/`SystemError`
- P3-5 (review-threads generic Error): ⚠️ **Partially fixed** — 8/10 converted (P3-10 covers remaining 2)
- P3-6 (codegraph stderr DI): Accepted tradeoff (documented)
- P3-7 (parser-utils.test.js dist/ import): ✅ Fixed — imports from `@laitszkin/cli`
- P3-8 (test:coverage script): ✅ Fixed — passes `COVERAGE=true`

### Round 9 — 2026-06-04

**Verdict**: Needs Attention — 5 P2, 8 P3. Key issues: three tools bypass AppError error boundary, missing dependency declarations, coverage exclusion masks tools.

### Round 8 — 2026-06-04

**Verdict**: Needs Attention — 20/23 Round 7 issues resolved. 8 P2, 13 P3. Architecture bypasses createToolRunner, PlatformAdapter singleton broke testability.

### Round 7 — 2026-06-04

**Verdict**: Needs Work — 1 P1 (generate-storyboard-images multiple:true), 11 P2, 7 P3. Architecture bypasses createToolRunner, type-safety gaps in dispatch table.

### Round 6 — 2026-06-04

**Verdict**: Needs Work — 1 P1 (search-logs multiple:true), 2 P3. All Round 5 issues resolved.

### Round 5 — 2026-06-04

**Verdict**: Needs Attention — 4 P2, 4 P3. Review-threads _rawArgs, codegraph SystemError regression, PlatformAdapter consumption gaps, Coverage scope.

### Round 4 — 2026-06-04

**Verdict**: Needs Work — 1 P1 (Windows CI bash), 11 P2, 9 P3. 17/21 fixed.

### Rounds 1-3 — 2026-06-04

Rounds 1-3: P0 (create-specs args missing), P1 × 5, P2 × 26, P3 × 15. Progressive resolution.
