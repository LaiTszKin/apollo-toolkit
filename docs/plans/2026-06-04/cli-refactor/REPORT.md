# Review Report — Round 16

- **Spec**: CLI 工具全面重構 (cli-refactor)
- **Date**: 2026-06-06
- **Reviewer**: Claude Code (agent-review)
- **Verdict**: Needs Work

---

## Verdict

**Needs Work** — 5 P1 and 12 P2 findings identified. All 640+ tests pass with no failures. The Round 15 P0 (unhandled rejections in carryover tools) is resolved via `return await` at `cli/index.ts:351` and `.catch()` at `bin/apollo-toolkit.ts:11-15`. However, **2 of the 17 Round 15 fix items were not applied**: FIX-10 (renderSection default `= '\n'` not removed) and FIX-13 (storyboard "Error:" prefix not removed). New P1 findings include 3 carryover tools silently ignoring `--help`, missing Windows symlink EPERM fallback, the persistent 65% vs 80% coverage gap, a misleading zombie test, and generate-storyboard-images silently swallowing API data corruption.

**Progress since Round 15**: P0 resolved (carryover unhandled rejections). 15 of 17 Round 15 fix items verified applied. Coverage threshold gap persists across 7 rounds (Round 10 through Round 16). Two P3 fixes from Round 15 were documented as resolved but not actually applied.

---

## Requirement Status Summary

| Requirement | Status | Evidence Location | Open Findings |
|---|---|---|---|
| Req 1 — Tool boilerplate reduction | ⚠️ Partial — 5 carryover tools, 3 ignoring `--help` | 15/21 tools use `createToolRunner`. 5 documented carryover (architecture, codegraph, find-github-issues, open-github-issue, review-threads). 3 of 5 ignore `--help` | 2 P1, 3 P2, 6 P3 |
| Req 2 — Cross-platform abstraction | ⚠️ Partial — EPERM fallback missing, `\n` in file writes | `PlatformAdapter` interface + implementations solid. EPERM fallback in `replaceWithSymlink` unimplemented. Hardcoded `\n` in installer.ts JSON writes (L149-152, L230-233) and schema.ts help builder (L62) | 1 P1, 5 P2, 3 P3 |
| Req 3 — Unified error handling | ⚠️ Partial — storyboard swallows failures | `formatAppError` catch block at CLI boundary correct. FIX-01 verified (`return await` + entry point `.catch()`). generate-storyboard-images continues on API data corruption, returns 0. registry.ts stderr.write+return1 path bypasses formatAppError | 2 P1, 3 P2, 3 P3 |
| Req 4 — Coverage >= 80% + CI matrix | ❌ Requirement Defect — 65% threshold vs SPEC 80% | `scripts/test.sh` enforces 65/60/65. SPEC requires 80%. DESIGN.md stale (still references 80%). Group 3 excluded from coverage. Combined coverage unenforced | 1 P1, 4 P2, 3 P3 |
| Req 5 — Dispatch isolation | ⚠️ Partial — zombie test, dispatch bypass, if-else coupling | Command parsers independently testable. HelpTextBuilder unified. But dispatch table has bypass path for direct tool names (L157-173); if-else chain contradicts "independently add/remove table entries" claim. Zombie test at L341 claims SystemError path but tests success | 1 P1, 3 P2, 2 P3 |

---

## Cross-requirement Interaction Summary

**Requirement Groups:**

| Group | Requirements | Interaction Type | Summary |
|---|---|---|---|
| A | Req 1, Req 2, Req 3, Req 5 | Shared modules, functional coupling, same-file modifications | Req 5 dispatch routes to Req 1 tools, which consume Req 2 PlatformAdapter and Req 3 AppError. Two error patterns coexist (createToolRunner catch+return1 vs carryover throw), creating structural fragility with no interface enforcement. `formatAppError` is the single funnel for all error output — every AppError subclass change cascades across all tools. Carryover tools are structurally incompatible with createToolRunner migration (subcommand dispatch, complex flag patterns). **5 P1/P2 interaction findings** |
| B | Req 4 | Isolated | Coverage + CI config self-contained. Side effect: 65% threshold is too low to catch coverage regressions in Req 1-3/5 code |

---

## Findings

### P0 — Requirement Blocked

*(No P0 findings in this round — the Round 15 P0 (unhandled rejections) was resolved by FIX-01.)*

### P1 — Requirement Defect

| # | Description | Impact | File | Line | Dimension | Requirement |
|---|---|---|---|---|---|---|
| 1 | **3 carryover tools silently ignore `--help`/`-h`** — `parseArgs()` in these tools has no clause for `--help` or `-h`. The flag falls through to `default: break` (find-github-issues) or is silently absorbed. Running `apltk find-github-issues --help`, `apltk open-github-issue --help`, or `apltk review-threads --help` produces no help output; the tool attempts execution with default argument values instead. `architecture` and `codegraph` (the other 2 carryover tools) DO handle `--help` via their own mechanisms | Users typing `--help` on these 3 tools get no help text and potentially unexpected execution | `packages/tools/find-github-issues/index.ts` | L16-64 | Spec implementation omission | Req 1 |
| 2 | **`replaceWithSymlink` missing EPERM fallback on Windows** — `fsp.symlink()` at L361 has no try/catch. The SPEC Error/Edge Cases section explicitly requires: "Windows `--symlink` install but user not running as admin → degrade to copy mode and output warning." The DESIGN.md trade-off section also documents this. When `fs.symlink` throws EPERM (Windows without admin), the error propagates unhandled — no graceful degrade, no warning | SPEC-required behavior not implemented. On Windows without admin, `--symlink` install crashes instead of falling back to copy | `packages/cli/installer.ts` | L359-363 | Spec implementation omission | Req 2 |
| 3 | **Coverage threshold 65% does not meet SPEC 80% — 15pp gap across 7 rounds** — `scripts/test.sh` enforces `--test-coverage-lines=65`. SPEC Req 4 mandates `>= 80%`. Group 1 = ~77.90%, Group 2 = ~69.29% — both individually below 80%. Combined estimate of ~80% is informal with no aggregation tooling. This gap has persisted since Round 10 (7 consecutive rounds). DESIGN.md still references 80% at L21, L75, L133, L175, L192 — stale across 3 documents | SPEC coverage requirement unmet by 15pp. CI passes while both groups are well below 80%. Combined estimate is unenforced and unverifiable | `scripts/test.sh` | L8-9, L28 | Spec implementation omission | Req 4 |
| 4 | **Zombie test: "dispatch table errors produce stderr output (SystemError path)" tests success path instead** — Test at L341 has a misleading name claiming to test the `SystemError` error path. The body runs `run(['uninstall', '--help'])` and asserts exit code 0 — a success path already tested at L204-211. The comment inside was corrected by FIX-16, but the name and redundant body remain | Misleading test name reduces confidence in error-path test coverage. Creates false sense that dispatch error handling is tested | `test/cli/dispatch-table.test.js` | L341 | Hallucinated code | Req 5 |
| 5 | **`generate-storyboard-images`: API data corruption silently swallowed** — When the image API returns no data (L316) or missing b64_json/url (L329), the handler writes `"Error: ..."` to stderr, increments `failures`, and **continues**. At L367 it returns 0 regardless of failures. API response corruption or silent service degradation produces exit code 0 with incomplete output | Callers cannot distinguish successful image generation from partial failure. A user piping output downstream receives incomplete results with no error signal | `packages/tools/generate-storyboard-images/index.ts` | L316-318, L329-331, L367 | Spec implementation deviation | Req 3 |

### P2 — Requirement Risk

| # | Description | Impact | File | Line | Dimension | Requirement |
|---|---|---|---|---|---|---|
| 6 | **5 carryover tools do not use createToolRunner** — architecture, codegraph, find-github-issues, open-github-issue, review-threads still use hand-rolled argument parsers and error formatting. Their JSDoc documents valid reasons (subcommand dispatch, complex flag patterns, mixed TS/JS), but the DESIGN.md target state "All tools use `node:util.parseArgs` with schema declaration" is not achieved for 24% of tools | 5/21 tools bypass schema-based arg parsing. Errors propagate through CLI boundary (not createToolRunner catch), creating two parallel error patterns. Subcommand tools structurally incompatible with migration | Multiple tool files | — | Spec implementation deviation | Req 1, Req 3 |
| 7 | **Hardcoded `\n` in JSON manifest file writes** — `writeManifest()` (L149-152) and `stageToolkitContents()` (L230-233) write `.apollo-toolkit-manifest.json` and `.apollo-toolkit-install.json` using `` `${JSON.stringify(manifest, null, 2)}\n` `` instead of `adapter.EOL`. SPEC Req 2 commentary explicitly says EOL must be unified for file writes | On Windows, manifest files use `\n` line endings. While JSON.parse handles both, it violates the cross-platform file write abstraction | `packages/cli/installer.ts` | L149-152, L230-233 | Architecture defect | Req 2 |
| 8 | **Hardcoded `\n` in schema.ts help text builder** — `buildHelpText()` at L62 uses `lines.join('\n')` in the package that OWNS the `PlatformAdapter` abstraction. Architecturally inconsistent — `tool-utils` provides PlatformAdapter but does not consume it for its own internal string joins | Architectural inconsistency in the abstraction owner. Help text on Windows stdout typically auto-translates `\n`, but the principle is violated at the point where it should be strongest | `packages/tool-utils/schema.ts` | L62 | Architecture defect | Req 2 |
| 9 | **registry.ts:40-41 stderr.write + return 1 bypasses formatAppError** — The "Tool not fully configured" error path writes directly to stderr and returns 1 instead of throwing `SystemError`. This error path exists at the dispatch layer, which should participate in the throw-at-boundary pattern | One error path in the dispatch layer deviates from the error convention. Error messages bypass `formatAppError` formatting | `packages/tool-registry/registry.ts` | L40-41 | Spec implementation deviation | Req 3 |
| 10 | **Two error patterns coexist with no structural enforcement** — Pattern A (createToolRunner): handler throws → caught internally → `formatAppError` + return 1. Pattern B (carryover): handler throws → propagates through `runTool` → CLI boundary catch → `formatAppError` + return 1. Both converge on same formatting, but there's no interface ensuring a given tool uses one pattern or the other. A createToolRunner tool accidentally re-throwing after stderr output produces double-printed errors; a carryover tool silently catching and returning 1 without throwing suppresses all error output | Silent contract between two patterns. Future edits could accidentally break error output without test detection | `packages/tool-utils/schema.ts`, `packages/cli/index.ts`, `packages/tool-registry/registry.ts` | L83-106, L349-353, L477-480, L36-38 | Architecture defect | Req 1, Req 3 |
| 11 | **codegraphHandler internal catch shadows AppError before re-throw** — Catch block at L135-138 catches all errors, re-throws AppError subtypes, converts others to SystemError. The `throw error` for AppError instances is dead code (catches and immediately re-throws the same object), creating a maintenance trap if future edits add error-recovery logic in this block | Dead code path. If future edit adds logging/recovery before re-throw, it affects all error types uniformly, potentially corrupting legitimate AppError propagation | `packages/tools/codegraph/index.ts` | L135-138 | Architecture defect | Req 3 |
| 12 | **review-threads cmdResolve writes error details to stdout** — L511-523 writes partial-failure details to stdout (not stderr) while returning exit code 1. Violates DESIGN.md invariant: "Error is always on stderr, exit code 1. Errors never go to stdout." While programmatic consumers benefit from JSON output, the invariant is violated | Architecture invariant violation. DESIGN.md's declared contract is broken by an intentional design choice | `packages/tools/review-threads/index.ts` | L511-523 | Spec implementation deviation | Req 3 |
| 13 | **Group 3 (mock.module) tests excluded from coverage tracking** — Three codegraph test files run with `--experimental-test-module-mocks` but without `--experimental-test-coverage` (incompatible flags). Code exercised by these tests is invisible to coverage reporting | Reported coverage overstated. Regression in mock-dependent code undetected | `scripts/test.sh` | L17-20, L60-64 | Spec implementation omission | Req 4 |
| 14 | **Combined coverage estimate is unenforced** — `scripts/test.sh` L85-91 extracts per-group line percentages and prints them but performs no weighted aggregation and enforces no combined threshold. The comment acknowledges "not directly measured" | No mechanism validates combined coverage >= 80% per SPEC. Informal estimate is not actionable in CI | `scripts/test.sh` | L13-14, L85-91 | Spec implementation omission | Req 4 |
| 15 | **Dispatch table bypass for direct tool names** — `parseArguments` L157-173 has a bypass path: when `argv[0]` is a known tool name (checked via `isKnownToolName()`), routing goes directly to `toolParser.parse(argv)` without consulting the `commandParsers` Map. Two parallel routing paths contradict the dispatch-table-as-sole-routing-mechanism goal | Dispatch table is not the sole routing path. New tools auto-registered in TOOL_NAMES get this bypass — no table entry needed | `packages/cli/index.ts` | L157-173 | Architecture defect | Req 5 |
| 16 | **if-else chain couples dispatcher to parser outputs** — 65-line if-else chain (L91-155) manually reshapes each parser's typed output. FIX-16 comment (L78-89) acknowledges: "Adding a new command requires 3 locations" — contradicts "independently add/remove table entries" | Adding a new command type requires modifying the dispatcher function, not just a table entry | `packages/cli/index.ts` | L91-155 | Spec implementation deviation | Req 5 |
| 17 | **Redundant parseArguments tests across two files** — Three tests in `test/tool-runner.test.js` (L9-14, L16-21, L23-28) directly duplicate tests in `test/cli/dispatch-table.test.js` (L88-93, L130-135, L33) | Duplicate tests add maintenance burden without coverage value. Changes to parseArguments must update both files | `test/tool-runner.test.js`, `test/cli/dispatch-table.test.js` | L9-28, L33-135 | Redundant code | Req 5 |

### P3 — Suggestion

| # | Description | Impact | File | Line | Dimension | Requirement |
|---|---|---|---|---|---|---|
| 18 | **FIX-10 not applied: renderSection() default `eol='\n'` not removed** — Round 15 FIX-10 specified removing the dead default, but it remains at L40. The sole caller always passes `adapter.EOL` explicitly | Documentation claim ("All 17 issues resolved") is wrong. Dead default has no functional impact | `packages/tools/sync-memory-index/index.ts` | L40 | Redundant code | Req 2 |
| 19 | **FIX-13 not applied: storyboard "Error:" prefix not removed** — Round 15 FIX-13 specified removing "Error:" from two per-item batch failure messages, but both L316 and L329 still have the prefix | Documentation claim ("All 17 issues resolved") is wrong. These are non-fatal warnings; "Error:" prefix misleadingly implies command failure | `packages/tools/generate-storyboard-images/index.ts` | L316, L329 | Spec implementation deviation | Req 3 |
| 20 | **extract-conversations reads `process.env.CODEX_HOME` directly** — bypasses `PlatformAdapter.homeDir()` for the initial env var check. Creates a split pattern where env resolution is ad-hoc and fallback is abstracted | If PlatformAdapter is enhanced for env-aware home resolution, this code has a separate path that doesn't benefit | `packages/tools/extract-conversations/index.ts` | L7 | Architecture defect | Req 2 |
| 21 | **Hardcoded `\n` in app-error.ts and updater.ts stderr/stdout writes** — `formatAppError` (app-error.ts L82-88) and `updater.ts` output writes (L158-168) use hardcoded `\n`. Lower concern since stream writes typically auto-translate, but architecturally inconsistent | Presentational inconsistency with the cross-platform EOL abstraction | `packages/tool-utils/app-error.ts`, `packages/cli/updater.ts` | L82-88, L158-168 | Architecture defect | Req 2 |
| 22 | **Error re-wrapping discards original cause** — Both createToolRunner tools and carryover tools re-throw `UserInputError`/`SystemError` with only the message string, discarding the original error's cause chain. `filter-logs` L34-38 wraps `buildTimezone` errors; `open-github-issue` L231 wraps `exc` detail | Original error cause lost. Debugging quality reduced for wrapped errors | Multiple tool files | — | Architecture defect | Req 3 |
| 23 | **ToolNotFoundError lacks dedicated formatAppError branch** — Falls through to generic `AppError` branch with `"Error: "` prefix, while `UserInputError` (same class of user error) has a dedicated branch with bare message | Inconsistent error presentation for similar error classes | `packages/tool-utils/app-error.ts` | L77-90 | Architecture defect | Req 3 |
| 24 | **3 tools declare explicit `help: { type: 'boolean', short: 'h' }` in createToolRunner schemas** — `createToolRunner` automatically adds this (schema.ts L81). Redundant in read-github-issue (L160), validate-skill-frontmatter (L125), validate-openai-agent-config (L219) | Harmless duplication. Redundant code adds maintenance surface | `packages/tools/read-github-issue/index.ts`, `packages/tools/validate-skill-frontmatter/index.ts`, `packages/tools/validate-openai-agent-config/index.ts` | L160, L125, L219 | Redundant code | Req 1 |
| 25 | **Stale function names in test descriptions** — 4 tests reference now-removed standalone functions (`buildToolsHelp`, `buildHelpText`) that were replaced by `HelpTextBuilder` during the refactor | Tests call correct new APIs but describe non-existent code | `test/tool-runner.test.js`, `test/architecture-script.test.js`, `test/tools/schema-conversion-smoke.test.js` | L30, L36, L79, L75 | Hallucinated code | Req 1, Req 5 |
| 26 | **Unused `stderr` bindings in architecture, find-github-issues, review-threads** — 5 instances where `stderr` is destructured/declared but never used in the function body | Dead variable bindings increase noise | `packages/tools/architecture/index.ts` L149, L482; `packages/tools/find-github-issues/index.ts` L195; `packages/tools/review-threads/index.ts` L463, L496 | — | Redundant code | Req 1 |
| 27 | **DESIGN.md references stale 80% thresholds** — Sections 1.1 (L21), 4.2 (L133), Appendix (L192), and trade-offs (L175) all still reference `--test-coverage-lines=80`. Only `test.yml` L23 and `CHECKLIST.md` CL-08 were updated | Architecture decision record diverges from implementation | `docs/plans/2026-06-04/cli-refactor/DESIGN.md` | L21, L75, L133, L175, L192 | Spec implementation omission | Req 4 |
| 28 | **Windows glob risk in `--test-coverage-exclude`** — `packages/tools/eval/**` uses forward slashes; may not match Windows backslash paths. Documented at L21 | If glob silently fails on Windows, eval files included in coverage, potentially causing drops | `scripts/test.sh` | L21, L28 | Architecture defect | Req 4 |
| 29 | **Contradictory carryover tool classifications across test files** — `schema-conversion-smoke.test.js` HELP_SKIP, `schema-arg-validation.test.js` COMMENT_ONLY, and REPORT.md all list different carryover tool sets. find-github-issues not in HELP_SKIP; codegraph in neither list | --help smoke test may run on tools that don't support it (find-github-issues) or skip tools that should be excluded (codegraph) | `test/tools/schema-conversion-smoke.test.js`, `test/tools/schema-arg-validation.test.js` | L40-46, L142 | Spec implementation deviation | Req 1 |

---

## Dimension Summary

| Dimension | Count |
|---|---|
| Spec implementation omission | 5 |
| Spec implementation deviation | 5 |
| Architecture defect | 9 |
| Redundant code | 4 |
| Hallucinated code | 2 |

---

## Review History

### Round 16 — 2026-06-06

**Verdict**: Needs Work — 5 P1, 12 P2, 11 P3 findings.

**Resolved from Round 15 (15 of 17 fix items verified):**

- **P0-1** (carryover tool errors → unhandled rejections): ✅ **Resolved** — `return await` added at `cli/index.ts:351`, `.catch()` handler at `bin/apollo-toolkit.ts:11-15`. REGTEST-01 verifies carryover tool error caught by CLI boundary.
- **P1-2** (coverage gap documentation): ✅ **Resolved** — `scripts/test.sh` header comments document split-process limitation, 65% threshold rationale, Group 3 blind spot, Windows glob risk.
- **P1-3** (CHECKLIST stale 80%): ✅ **Resolved** — CL-08 Result updated to `65/60/65 enforced`. No 80% threshold references remain in CHECKLIST.md.
- **P2-2** (architecture `\n` → EOL): ✅ **Resolved** — `adapter.EOL` used at L551 and L577.
- **P2-3** (extract-pdf-text SystemError): ✅ **Resolved** — `reject(new SystemError(...))` at L66.
- **P2-4** (open-github-issue SystemError): ✅ **Resolved** — `throw new SystemError(...)` at L897.
- **P2-5** (combined coverage documentation): ✅ **Resolved** — Documented in `scripts/test.sh`.
- **P2-6** (Group 3 documentation): ✅ **Resolved** — Documented in `scripts/test.sh`.
- **P3-1** (EOL comments): ✅ **Resolved** — platform-adapter.ts comments updated.
- **P3-2** (renderSection default): ❌ **Not applied** — `= '\n'` still present at L40.
- **P3-3** (titleFromMemoryFile split): ✅ **Resolved** — Comment added at L17.
- **P3-4** (syncAgentsFile mixed line endings): ✅ **Resolved** — Comment added at L85-87.
- **P3-5** (storyboard Error: prefix): ❌ **Not applied** — Both L316 and L329 still have "Error:" prefix.
- **P3-6** (validate tools return 1): ✅ **Resolved** — Comments added in both validate tools.
- **P3-7** (Windows glob): ✅ **Resolved** — Documented in scripts/test.sh.
- **P3-8** (stale assertCommand comment): ✅ **Resolved** — dispatch-table.test.js comment updated.
- **P3-9** (CHECKLIST unfilled boxes): ✅ **Resolved** — Checkboxes marked.

**New P1 findings in Round 16:**

- 🟥 **3 carryover tools silently ignore --help** (find-github-issues, open-github-issue, review-threads)
- 🟥 **replaceWithSymlink missing EPERM fallback** — Windows non-admin --symlink install crashes
- 🔴 **Coverage threshold 65% vs SPEC 80%** — 15pp gap, 7 rounds, DESIGN.md still stale
- 🔴 **Zombie test claims SystemError path, tests success** — dispatch-table.test.js L341
- 🟡 **generate-storyboard-images swallows API failures** — returns 0 despite per-item failures

**Notable persistent issues:**
- Coverage threshold at 65% vs SPEC's 80% — 15pp gap, no change in 7 rounds (Round 10–16)
- 5 carryover tools bypass createToolRunner (stable since Round 14, down from 7)
- 2 Round 15 fix items documented as applied but not actually applied (FIX-10, FIX-13)

### Round 15 — 2026-06-06

**Verdict**: Needs Work — 1 P0, 2 P1, 5 P2, 9 P3 findings. Key issues: carryover tool errors caused unhandled rejections (P0, resolved via `return await`); coverage threshold gap 65% vs 80% (15pp); architecture `\n` hardcoded; stale EOL comments.

### Round 14 — 2026-06-05

**Verdict**: Needs Work — 3 P1, 5 P2, 4 P3. Key issues: read-github-issue incomplete createToolRunner migration; coverage threshold gap; sync-memory-index redundant catch; review-threads stderr.write+return1.

### Round 13 — 2026-06-05

**Verdict**: Needs Work — 4 P1, 10 P2, 8 P3.

### Round 12 — 2026-06-05

**Verdict**: Needs Work — 7 P1, 16 P2, 11 P3.

### Round 11 — 2026-06-05

**Verdict**: Needs Work — 3 P1, 12 P2, 10 P3.

### Round 10 — 2026-06-05

**Verdict**: Needs Work — 2 P1, 6 P2, 8 P3.

### Round 9 — 2026-06-04

**Verdict**: Needs Attention — 5 P2, 8 P3.

### Earlier rounds

Rounds 1-8: progressive resolution of 1 P0 (create-specs args missing), multiple P1/P2/P3 findings.
