# Review Report — Round 8

- **Spec**: CLI 工具全面重構 (cli-refactor)
- **Date**: 2026-06-04
- **Reviewer**: Claude Code (agent-review)
- **Verdict**: Needs Attention

---

## Verdict

**Needs Attention** — 20/23 Round 7 issues resolved (1 P1, 9 P2, 7 P3 fixed; 3 P2 partially addressed: architecture still bypasses createToolRunner, CommandParser\<any\> type erasure remains, if-else dispatch chain remains). 8 new P2 findings and 13 P3 findings identified. Key new issue: `PlatformAdapter` singleton broke cross-platform testability; 6 error sites in architecture tool still use `stderr.write + return 1` instead of typed errors; test files duplicate production logic without importing.

---

## Requirement Status Summary

| Requirement | Status | Evidence Location | Open Findings |
|---|---|---|---|
| Req 1 — Tool boilerplate reduction | ⚠️ Partial | 17/19 in-scope tools use `createToolRunner`; `architecture` tool bypasses with manual flag parsing + dead schema removed; `generate-storyboard-images` `multiple: true` fixed | 2 P2, 2 P3 |
| Req 2 — Cross-platform abstraction | ✅ Complete | `PlatformAdapter` singleton, `isSafeSkillName` Windows-only backslash fix; adapter consumed; no `process.platform` in production code | 2 P2, 3 P3 |
| Req 3 — Unified error handling | ⚠️ Partial | All 13 `Error` → `UserInputError` in architecture tool done; `normalizeParseError` handles ambiguous; `ToolNotFoundError` JSDoc fixed; but 6 error sites still `stderr.write + return 1`; duplicate error boundaries | 3 P2, 3 P3 |
| Req 4 — Coverage >=80% + CI matrix | ✅ Complete | 93.33% lines; CI matrix ubuntu+windows; coverage exclude pattern documented; new test files cover interactive paths, error types, updater branches | 2 P2, 4 P3 |
| Req 5 — Dispatch isolation | ⚠️ Partial | `assertCommand` type guard added; `ToolArgsParser` shared instance; `helpTopic: 'tools-help'` fixed; but `CommandParser\<any\>` type erasure + tools path missing `assertCommand` | 2 P2, 2 P3 |

---

## Cross-requirement Interaction Summary

**Requirement Groups:**

| Group | Requirements | Interaction Type | Summary |
|---|---|---|---|
| A | Req 1, Req 3, Req 5 | Shared modules, functional coupling, file overlap | All three affect the CLI dispatch/tool execution pipeline. Architecture tool bypass across Req 1 and Req 3 is the main interaction concern: manual error handling + non-standard catch blocks creates 3 parallel error handling paths. `assertCommand`'s generic `Error` bypasses Req 3's AppError differentiation. Duplicate error boundaries in `schema.ts` and `cli/index.ts` will drift independently. |
| B | Req 2 | Isolated | Cross-platform abstraction consumed independently. Singleton broke testability but no code-level interaction. |
| C | Req 4 | Isolated | CI and coverage are test infrastructure, no code-level interaction with other requirements. |

---

## Findings

### P2 — Requirement Risk

| # | Description | Impact | File | Line | Dimension | Requirement |
|---|---|---|---|---|---|---|
| 1 | **Architecture tool bypasses `createToolRunner` with non-standard error handling**: Tool does not use `createToolRunner`; `handleApply`/`handleTemplate` handle errors locally via 6 `stderr.write + return 1` paths (missing YAML arg, YAML parse failure, invalid YAML object, `resolveProjectRoot` failure, spec-dir not found, file write error). Plus manual flag parsing loops (L163-170, L492-498). Creates three distinct error paths in the codebase. Dead schema removed but tool still un-governed by framework | Tool behaves correctly but error formatting varies: UserInputError thrown inside try block gets clean message, early exits get ad-hoc messages, system errors (file write) lose stack traces. Inconsistent with SPEC Req 3's unified error model | `packages/tools/architecture/index.ts` | L156-159, L180-186, L219-220, L527-535, L565-566 | Architecture defect, Spec implementation deviation | Req 1, Req 3 |
| 2 | **Duplicate error boundaries between `createToolRunner` and `cli/index.ts`**: schema.ts L98-109 and cli/index.ts L493-504 implement structurally identical `instanceof` check chains (UserInputError → SystemError → AppError → generic Error). For schema-based tools, the inner boundary catches all errors, making the outer boundary dead code. Non-`createToolRunner` tools (architecture) skip both | Two paths will drift independently if error subclasses change. Schema-based and non-schema tools get different formatting for same error types | `packages/tool-utils/schema.ts`, `packages/cli/index.ts` | L98-109, L493-504 | Architecture defect | Req 3 |
| 3 | **`assertCommand` type guard uses generic `Error` not `AppError`**: Function throws `new Error(...)` which lands in the generic catch-all (`Error: Internal error: ...`) rather than the `SystemError` path. A dispatch table misconfiguration is a developer-time system error, not user input | Degrades error classification. If the error boundary is later tightened to throw on unrecognized types, this becomes a failure | `packages/cli/index.ts` | L85-89 | Spec implementation deviation | Req 3, Req 5 |
| 4 | **`CommandParser<any>` type erasure + tools dispatch path missing `assertCommand`**: `Map<string, CommandParser<any>>` (L99) erases parser return types requiring unsafe `as` casts. The install/uninstall paths (L110, L128) use `assertCommand` but the tools/tools-help path (L145-173) does not, so a misconfigured parser there produces property-access errors instead of clear failure messages | Type system cannot catch dispatch table misconfiguration. Tools path has weaker runtime safety than install/uninstall | `packages/cli/index.ts` | L99, L145-173 | Architecture defect | Req 5 |
| 5 | **Test duplicates production logic instead of importing**: `is-safe-skill-name.test.js` re-implements `isSafeSkillName` as a test-local copy using `process.platform === 'win32'` (not `createPlatformAdapter().isWindows()`). `rewrite-imports.test.js` re-implements `resolvePackage`/`relativePath` as test-local copies. Neither provides regression safety — production changes won't cause them to fail | Zero regression protection for the very behaviors the tests were written to guard. `is-safe-skill-name` tests a different platform detection mechanism than production | `test/cli/is-safe-skill-name.test.js`, `test/rewrite-imports.test.js` | L5-15, L47-57 | Spec implementation omission | Req 2, Req 4 |
| 6 | **`PlatformAdapter` factory testability regressed**: Singleton pattern (L103-109) removed `withPlatform` helper and 3 platform-specific tests. No reset/clear function. Factory routing (`process.platform === 'win32' ? WindowsAdapter : PosixAdapter`) is now untestable on any OS other than the current one | Cross-platform routing decision cannot be verified. Regression from previous test coverage | `packages/tool-utils/platform-adapter.ts` | L103-109 | Spec implementation omission | Req 2 |
| 7 | **Uncovered branches in `updater.ts`**: `checkForPackageUpdate` `!latestVersion` early return (L151) and `execCommand` error event handler (L92) remain untested. The error handler (`child.on('error', reject)`) could cause unhandled rejections if `spawn` fails | Silent unhandled rejections on spawn failure. Untested branch reduces confidence in edge-case behavior | `packages/cli/updater.ts` | L92, L151 | Spec implementation omission | Req 4 |
| 8 | **Coverage exclude pattern masks 21 tool packages**: `--test-coverage-exclude=packages/tools/**` removes all 21 tools from coverage measurement. Comment explains rationale but breadth conflicts with SPEC's stated intent to "cover individual tools". Test files in `test/tools/` run without coverage threshold protection | Tool handler regressions not covered by coverage gate. 13,000+ lines excluded from measurement | `scripts/test.sh` | L15 | Spec implementation omission | Req 4 |

### P3 — Suggestion

| # | Description | Impact | File | Line | Dimension | Requirement |
|---|---|---|---|---|---|---|
| 1 | **Architecture tool manual flag parsing redundant with framework**: `handleApply` (L163-170) and `handleTemplate` (L492-498) use ad-hoc `for` loops implementing `--no-render`, `--spec`, `--project`, `--output` parsing. These duplicate the `createToolRunner` + `node:util.parseArgs` pattern | Works correctly but fragile; `--spec` without consuming next arg would silently misparse | `packages/tools/architecture/index.ts` | L163-170, L492-498 | Redundant code | Req 1 |
| 2 | **`parseEndpoint` throws generic `Error` not `UserInputError`**: L349-350 calls `parseEndpoint` inside inner try; L351-353 wraps its generic `Error` into `UserInputError`. If called outside this wrapper, error would be misclassified as "Batch aborted:" | Fragile dependency chain — all callers must remember to wrap. Works today but type system doesn't enforce it | `packages/tools/architecture/index.ts` | L79-81, L351-353 | Spec implementation deviation | Req 1, Req 3 |
| 3 | **Manual dispatch if-else offsets Map abstraction**: `commandParsers` Map only handles parser lookup; actual dispatch uses three explicit if-else branches (L108, L126, L144) plus two fallthroughs (L177, L194). Adding a new command type requires modifying both Map and if-else chain | Correct but SPEC's "independent add/remove" only partially realized. Acceptable tradeoff for `ParsedArguments` uniformity | `packages/cli/index.ts` | L108-173 | Architecture defect | Req 5 |
| 4 | **`helpTopic` dispatch decoupled from type union**: `ParsedArguments.helpTopic` is a closed union but its dispatch (`run()` L349-354) silently falls through to default `buildHelpText()` for unrecognized values | Adding a new value passes type checking but hits wrong help text. Brittle for future extension | `packages/cli/index.ts` | L349-354 | Architecture defect | Req 5 |
| 5 | **Architecture catch block doesn't differentiate `AppError` subclasses**: Catch block (L433-440) has only `UserInputError` vs generic `else` branch. If `SystemError` is introduced inside the try block, it loses stack trace | Future error type additions to the try block won't get appropriate formatting | `packages/tools/architecture/index.ts` | L433-440 | Spec implementation omission | Req 3 |
| 6 | **No test for "Batch aborted:" error path**: Architecture tests only cover `UserInputError` paths. The generic error path (L436-437) has zero test coverage | Regressions in generic error handling silently pass CI | `test/tools/architecture-error-types.test.js` | 遍佈 | Spec implementation omission | Req 3 |
| 7 | **Unused `SystemError` import in `generate-storyboard-images/index.ts`**: `SystemError` imported from `@laitszkin/tool-utils` but never referenced in the file | Dead import, no functional impact | `packages/tools/generate-storyboard-images/index.ts` | L7 | Redundant code | Req 1 |
| 8 | **No singleton reset mechanism for `PlatformAdapter` tests**: Module-level `_adapter` (L103) has no reset/clear export. Tests that need factory routing verification must construct `WindowsAdapter`/`PosixAdapter` directly | Bypassing factory in tests reduces coverage of routing logic | `packages/tool-utils/platform-adapter.ts` | L103 | Spec implementation omission | Req 2 |
| 9 | **Short-circuit ordering in `isSafeSkillName`**: `createPlatformAdapter().isWindows() && skillName.includes('\\')` evaluates adapter before checking backslash. Inverting to `skillName.includes('\\') && createPlatformAdapter().isWindows()` would short-circuit for the common case | Negligible runtime cost but straightforward micro-optimization | `packages/cli/installer.ts` | L124 | Performance concern | Req 2 |
| 10 | **Test uses `process.platform` instead of `createPlatformAdapter()`**: `is-safe-skill-name.test.js` uses `process.platform === 'win32'` which is exactly the pattern the spec says to avoid | Test local copy can silently diverge from production detection mechanism | `test/cli/is-safe-skill-name.test.js` | L6 | Spec implementation deviation | Req 2 |
| 11 | **`generate-storyboard-images` prompt test tests `node:util.parseArgs` stdlib, not production handler**: Validates Node.js standard library behavior with `multiple: true`, not the tool's actual schema or business logic | Minimal regression value | `test/tools/generate-storyboard-images-prompt-multiple.test.js` | 遍佈 | Performance concern | Req 4 |
| 12 | **`rewrite-imports.test.js` soft-test pattern at L148-182**: Uses early `return` to skip when target regex doesn't match, silently passing without asserting | Silent passes mask missing test execution | `test/rewrite-imports.test.js` | L148-182 | Performance concern | Req 4 |
| 13 | **`interactive-paths.test.js` lacks `try/finally` temp dir cleanup**: Unlike `architecture-error-types.test.js`, creates temp dirs without cleanup on assertion failure | Temp dirs accumulate on test failure | `test/cli/interactive-paths.test.js` | 遍佈 | Performance concern | Req 4 |

---

## Dimension Summary

| Dimension | Count |
|---|---|
| Architecture defect | 5 |
| Spec implementation omission | 7 |
| Spec implementation deviation | 4 |
| Redundant code | 2 |
| Performance concern | 4 |

---

## Review History

### Round 8 — 2026-06-04

**Verdict**: Needs Attention — 20/23 Round 7 issues resolved. 8 new P2 and 13 P3 findings. Key issue cluster: architecture tool still bypasses `createToolRunner` with 6 non-AppError error sites (P2-1); `PlatformAdapter` singleton broke cross-platform testability (P2-6); test files duplicate production logic instead of importing (P2-5). Good resolution of previous P1 (`generate-storyboard-images` `multiple: true`), P2-9 (`helpTopic: 'tools-help'`), P2-7 (`normalizeParseError` ambiguous), P2-5 (singleton), and multiple coverage coverage gaps.

**Resolved from Round 7**:
- P1-1: `generate-storyboard-images` `multiple: true` — ✅ Fixed
- P2-1: Architecture dead schema — ✅ Fixed (schema removed)
- P2-2: Architecture `throw Error` → `UserInputError` — ✅ Fixed (13 sites)
- P2-5: PlatformAdapter multiple instances — ✅ Fixed (singleton)
- P2-7: `normalizeParseError` ambiguous — ✅ Fixed
- P2-9: `helpTopic: 'overview'` — ✅ Fixed (`'tools-help'`)
- P2-11: Coverage exclude documentation — ✅ Fixed (comment added)
- P2-12: Updater branch coverage — ✅ Fixed (new tests)
- P3-1: `isSafeSkillName` backslash — ✅ Fixed (Windows-only)
- P3-3: ToolNotFoundError stale comment — ✅ Fixed
- P3-9: Two ToolArgsParser instances — ✅ Fixed (shared)
- Plus 9 other P2/P3 fixes

**Partially addressed (remaining)**:
- P2-3 (codegraph out of scope) — no change
- P2-8: `CommandParser<any>` type erasure — assertCommand added but Map still types-unsafe
- P3-4: Architecture manual flag parsing — dead schema removed but loops remain
- P3-10: If-else dispatch — no change (design tradeoff)

### Round 7 — 2026-06-04

**Verdict**: Needs Work — 1 P1 (`generate-storyboard-images` `prompt` missing `multiple: true`, runtime crash), 11 P2, 7 P3. Key issue cluster: architecture tool bypasses createToolRunner with dead schema; type-safety gaps in dispatch table; PlatformAdapter multiple instances; normalizeParseError missing ambiguous argument.

**Outcome**: 23/23 fixed in `d8ecb99` (20 fully resolved, 3 partially addressed).

### Round 6 — 2026-06-04

**Verdict**: Needs Work — 1 P1 (search-logs `keyword`/`regex` missing `multiple: true`), 2 P3. All Round 5 issues resolved.

**Outcome**: 3/3 fixed in `2ba7d79`.

### Round 5 — 2026-06-04

**Verdict**: Needs Attention — 17/21 Round 4 issues resolved; 4 P2 remaining.

**Key findings (8 total):** P2 × 4 (review-threads `_rawArgs`, codegraph SystemError regression, PlatformAdapter consumption gaps, Coverage scope), P3 × 4.

**Outcome**: 8/8 fixed in `117f9b7`.

### Round 4 — 2026-06-04

**Verdict**: Needs Work — 1 P1 (Windows CI bash), 11 P2, 9 P3.

**Outcome**: 17/21 fixed in `df6f957`.

### Rounds 1-3 — 2026-06-04

Rounds 1-3: P0 (create-specs args missing), P1 × 5, P2 × 26, P3 × 15. Progressive resolution across `eecb6ce`, `baec86f`, and later commits.
