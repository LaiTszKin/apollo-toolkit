# Review Report — Round 9

- **Spec**: CLI 工具全面重構 (cli-refactor)
- **Date**: 2026-06-04
- **Reviewer**: Claude Code (agent-review)
- **Verdict**: Needs Attention

---

## Verdict

**Needs Attention** — 5 P2 findings identified. All 21 Round 8 issues (8 P2 + 13 P3) resolved in `a2e8877`. Key new issues: three in-scope tools still bypass the AppError error boundary (`open-github-issue` with duplicate error output, `validate-skill-frontmatter`/`validate-openai-agent-config` with `stderr.write+return1`, `generate-storyboard-images` with `stderr.write+continue`); missing `@laitszkin/tool-utils` dependency declaration in `cli` and `tui` packages; coverage exclude pattern still masks 21 tools from measurement. No P0 or P1 findings. Framework foundations (PlatformAdapter, dispatch parsers, HelpTextBuilder, AppError boundary) are stable and correct.

---

## Requirement Status Summary

| Requirement | Status | Evidence Location | Open Findings |
|---|---|---|---|
| Req 1 — Tool boilerplate reduction | ✅ Complete | 17/19 in-scope tools use `createToolRunner`; `InstallArgsParser`/`UninstallArgsParser`/`ToolArgsParser` in `parsers/`; `HelpTextBuilder` unifies 4 help functions | 3 P2, 3 P3 |
| Req 2 — Cross-platform abstraction | ⚠️ Partial | `PlatformAdapter` singleton (WindowsAdapter/PosixAdapter) in `packages/tool-utils/platform-adapter.ts`; zero `process.platform` in production code; consumed by `installer.ts`, `updater.ts`, `terminal.ts` | 1 P2, 0 P3 |
| Req 3 — Unified error handling | ⚠️ Partial | `AppError`/`UserInputError`/`ToolNotFoundError`/`SystemError` in `app-error.ts`; CLI boundary (L493-504) correctly differentiates all 4 types; `assertCommand` uses `SystemError` | 3 P2, 3 P3 |
| Req 4 — Coverage >=80% + CI matrix | ⚠️ Partial | 93.70% line coverage (Group 1); CI matrix ubuntu+windows with `fail-fast: false`; version 5.0.0; coverage thresholds self-enforcing via `--test-coverage-lines=80` | 1 P2, 1 P3 |
| Req 5 — Dispatch isolation | ✅ Complete | `CommandParser<T>` interface in `parsers/types.ts`; 3 independent parser classes; `assertCommand` runtime guard; `HelpTextBuilder` exported; 56 tests across 6 test files | 0 P2, 1 P3 |

---

## Cross-requirement Interaction Summary

**Requirement Groups:**

| Group | Requirements | Interaction Type | Summary |
|---|---|---|---|
| A | Req 1, Req 3, Req 5 | Shared modules, functional coupling, file overlap | All three affect the tool execution pipeline. Three in-scope tools (`open-github-issue`, `validate-skill-frontmatter`, `validate-openai-agent-config`) share the same anti-pattern bypassing both Req 1's schema framework and Req 3's typed error boundary. P2-4 (missing dependency) affects Req 2 isolation. |
| B | Req 2 | Isolated | Cross-platform abstraction consumed independently; no code-level interaction with other requirements. |
| C | Req 4 | Isolated | CI and coverage are test infrastructure, no code-level interaction with other requirements. |

---

## Findings

### P2 — Requirement Risk

| # | Description | Impact | File | Line | Dimension | Requirement |
|---|---|---|---|---|---|---|
| 1 | **open-github-issue resolveRepo writes stderr AND throws generic Error → duplicate output**: `resolveRepo` writes a clear user-facing message to stderr (`'Unable to resolve origin remote...'`), then throws `new Error('--repo resolution failed')`. `createToolRunner`'s catch-all catches the generic Error and writes a second `'Error: --repo resolution failed'` to stderr. User sees duplicate error output: one without prefix, one with "Error:" prefix. The correct pattern is `throw new UserInputError('...')` directly and let the framework format it once | Duplicate error output degrades UX; the second message is noise | `packages/tools/open-github-issue/index.ts` | L682-696 | Spec implementation deviation | Req 1, Req 3 |
| 2 | **validate-skill-frontmatter and validate-openai-agent-config aggregate validation errors as strings and write via stderr.write+return1**: Both tools collect validation failures into `string[]` arrays, dump them to stderr via `stderr.write` loops, then `return 1`. No AppError type classification. Same pattern previously flagged for architecture tool in Round 8. Error formatting is ad-hoc (`"- "` prefix) rather than centralized. Framework cannot intervene (e.g., `--json` structured output misses these) | Two additional tools use the non-framework error path; creates 3 parallel error handling patterns in the codebase (typed throws, stderr.write+return1, stderr.write+continue) | `packages/tools/validate-skill-frontmatter/index.ts`, `packages/tools/validate-openai-agent-config/index.ts` | L105-119, L199-213 | Spec implementation deviation | Req 1, Req 3 |
| 3 | **generate-storyboard-images uses stderr.write+continue (spec anti-pattern)**: Inside the image generation loop, on missing image data or payload, the tool writes `stderr.write(...)` and `continue`s the loop. This is the exact pattern Spec Requirement 3 forbids ("handler should never just console.error() and continue"). Handler may return exit code 0 (success) even when individual prompts failed silently | Violates the core error handling discipline; partial failures are invisible to the caller via exit code | `packages/tools/generate-storyboard-images/index.ts` | L314-316, L327-328 | Spec implementation deviation | Req 3 |
| 4 | **Missing `@laitszkin/tool-utils` dependency in cli/package.json and tui/package.json**: Both packages import `createPlatformAdapter` from `@laitszkin/tool-utils` (`installer.ts:5`, `updater.ts:4`, `terminal.ts:2`) but neither declares it as a dependency. Other `@laitszkin/*` dependencies ARE declared (e.g., `@laitszkin/tui`, `@laitszkin/tool-registry`). Works at runtime due to workspace hoisting but breaks if packages are consumed independently | Package resolution fails outside monorepo context; inconsistent with project dependency hygiene | `packages/cli/package.json`, `packages/tui/package.json` | dependencies | Architecture defect | Req 2 |
| 5 | **Coverage exclude pattern `packages/tools/**` masks 21 tool packages from measurement**: `--test-coverage-exclude=packages/tools/**` removes all 21 tools from coverage calculation. Test files in `test/tools/` run but against un-instrumented source. Tools contribute 0% to coverage denominator while their test logic inflates the numerator. Script comment documents rationale but SPEC.md states "补足目前测试覆盖不足的模块（特别是个别工具）" | Tool handler regressions not covered by line coverage gate. 13,000+ lines excluded | `scripts/test.sh` | L15 | Spec implementation omission | Req 4 |

### P3 — Suggestion

| # | Description | Impact | File | Line | Dimension | Requirement |
|---|---|---|---|---|---|---|
| 1 | **SchemaOption type has no `description` field → auto-generated help text is minimal**: `SchemaOption` only supports `type`, `default`, `short`, `multiple`. No `description?: string`. `buildHelpText` generates lines like `--keyword, -k` with no explanation. For tools with 10+ options (search-logs), the auto-generated help is a bare option name list | Auto-generated help is less informative than hand-written help; half of the "single source of truth" goal | `packages/tool-utils/schema.ts` | L7-10, L43-59 | Spec implementation omission | Req 1 |
| 2 | **buildHelpText does not distinguish string vs boolean options**: String options (require value) and boolean flags rendered identically as `--key`. No `--key <value>` convention for strings. No `[--key ...]` indication for `multiple: true` options | Generated help less informative; standard CLI conventions not followed | `packages/tool-utils/schema.ts` | L52-57 | Spec implementation omission | Req 1 |
| 3 | **filter-logs and search-logs use `strict: false`, silently ignoring unknown flags**: Both tools explicitly opt out of strict mode. User who types `--sttart` instead of `--start` sees command run (with no time filter applied) rather than getting an error about unknown option | Silent typos during production use; no user feedback for misspelled flags | `packages/tools/filter-logs/index.ts`, `packages/tools/search-logs/index.ts` | L22, L68 | Performance concern | Req 1 |
| 4 | **enforce-video-aspect-ratio: 8 generic `throw new Error()` in helper functions**: `parseSize`, `parseRatio`, `resolveTargetSize`, `probeVideoSize` all throw `new Error(...)` instead of typed `UserInputError`/`SystemError`. Tool already imports both types at line 5 but doesn't use them in helpers | Typed error hierarchy not used where it's most applicable; 6 input validation errors get "Error:" prefix unnecessarily; 2 system errors (ffprobe failures) lose stack traces | `packages/tools/enforce-video-aspect-ratio/index.ts` | L9-102 | Spec implementation deviation | Req 3 |
| 5 | **review-threads: 10 generic `throw new Error()` across error paths**: All error paths use `throw new Error(...)` including input validation (`repo must be owner/name format`) and operational failures (`gh command failed`). Tool uses `createToolRunner` so errors surface with "Error:" prefix | Consistent with existing style but generic Error classification loses type information | `packages/tools/review-threads/index.ts` | L98, 103, 111, 131, 150, 188, 321, 326, 378, 382 | Spec implementation deviation | Req 3 |
| 6 | **codegraph/lib helper functions bypass DI stream for stderr**: `cmd-status.ts`, `cmd-search.ts`, `cmd-sync.ts`, `cmd-verify.ts`, `cmd-survey.ts` use `process.stderr.write` directly instead of accepting stderr via dependency injection. Main handler extracts `context.stderr || process.stderr` but never passes it to lib functions | DI effectively broken for helpers in programmatic capture scenarios | `packages/tools/codegraph/lib/cmd-*.ts` | various | Architecture defect | Req 3 |
| 7 | **parser-utils.test.js imports from dist/ instead of `@laitszkin/cli`**: Test imports `normalizeParseError` from `'../../packages/cli/dist/parsers/parser-utils.js'`. All other CLI tests import from `@laitszkin/cli`. Function is not re-exported from CLI index, so test bypasses public API | Fragile: depends on dist/ layout matching source; tests a private API | `test/cli/parser-utils.test.js` | L3 | Performance concern | Req 4 |
| 8 | **npm `test:coverage` script name misleading**: `"test:coverage": "npm test"` in package.json does not pass `COVERAGE=true`. Running `npm run test:coverage` locally executes tests without coverage flags, producing identical output to `npm test` | Developer confusion: script name implies coverage, actual run doesn't | `package.json` | L31 | Performance concern | Req 4 |

---

## Dimension Summary

| Dimension | Count |
|---|---|
| Spec implementation deviation | 4 |
| Spec implementation omission | 3 |
| Architecture defect | 2 |
| Performance concern | 3 |

---

## Review History

### Round 9 — 2026-06-04

**Verdict**: Needs Attention — 5 P2 and 8 P3 findings identified after Round 8 resolution. Key new issue cluster: three in-scope tools bypass the AppError error boundary with `stderr.write+continue` or `stderr.write+return1` patterns (P2-1, P2-2, P2-3) spanning both Req 1 and Req 3; missing `@laitszkin/tool-utils` dependency declaration in cli and tui packages (P2-4) weakens package hygiene; coverage exclude pattern for tools (P2-5) remains open from Round 8. All Round 8 findings verified resolved.

**Resolved from Round 8**:
- P2-1 (architecture error paths): ✅ Fixed — parseEndpoint throws UserInputError, catch block differentiates SystemError, handleTemplate wrapped in try/catch
- P2-2 (duplicate error boundaries): Accepted tradeoff — both boundaries share identical code and serve different scopes
- P2-3 (assertCommand generic Error): ✅ Fixed — now throws SystemError
- P2-4 (CommandParser<any> type erasure): ✅ Mitigated — tools path now has assertCommand; Map type erasure is accepted TS limitation
- P2-5 (test duplicates production logic): ✅ Fixed — isSafeSkillName and rewrite-imports tests now import from production
- P2-6 (PlatformAdapter singleton testability): ✅ Fixed — resetPlatformAdapter() exported
- P2-7 (uncovered updater branches): ✅ Fixed — latestVersion + spawn error tests added
- P2-8 (coverage exclude): ⚠️ Not addressed — remains open as P2-5 in this round

### Round 8 — 2026-06-04

**Verdict**: Needs Attention — 20/23 Round 7 issues resolved. 8 P2, 13 P3. Key issues: architecture bypasses createToolRunner, PlatformAdapter singleton broke testability, test files duplicated production logic.

### Round 7 — 2026-06-04

**Verdict**: Needs Work — 1 P1 (generate-storyboard-images multiple:true), 11 P2, 7 P3. Key issue cluster: architecture bypasses createToolRunner, type-safety gaps in dispatch table.

### Round 6 — 2026-06-04

**Verdict**: Needs Work — 1 P1 (search-logs multiple:true), 2 P3. All Round 5 issues resolved.

### Round 5 — 2026-06-04

**Verdict**: Needs Attention — 4 P2, 4 P3. Key issues: review-threads _rawArgs, codegraph SystemError regression, PlatformAdapter consumption gaps, Coverage scope.

### Round 4 — 2026-06-04

**Verdict**: Needs Work — 1 P1 (Windows CI bash), 11 P2, 9 P3. 17/21 fixed.

### Rounds 1-3 — 2026-06-04

Rounds 1-3: P0 (create-specs args missing), P1 × 5, P2 × 26, P3 × 15. Progressive resolution.
