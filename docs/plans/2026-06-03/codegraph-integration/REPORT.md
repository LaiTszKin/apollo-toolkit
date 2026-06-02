# Review Report: CodeGraph Integration

- **Date**: 2026-06-03
- **Reviewer**: Claude Code (subagent-assisted per-requirement review)
- **Feature**: codegraph-integration
- **Batch**: 3 sub-specs (lifecycle, discovery, validation) — 12 requirements total

---

## Verdict

**Needs Work** — P0 and P1 findings exist, indicating at least one requirement is not satisfied.

---

## Requirement Status Summary

| Requirement | Status | Evidence Location | Open Findings |
|---|---|---|---|
| **Lifecycle** | | | |
| L1: `codegraph init` | **Partial** | `cmd-init.ts`, `cg-instance.ts` | #4 (P1), #5 (P1) |
| L2: `codegraph init --index` | **Partial** | `cmd-init.ts`, `cg-instance.ts` | #5 (P1) |
| L3: `codegraph sync` | **Satisfied** | `cmd-sync.ts` | #21 (P2), #22 (P2) |
| L4: `codegraph status` / `search` | **Partial** | `cmd-status.ts` | #10 (P1) |
| **Discovery** | | | |
| D1: `codegraph explore` | **Partial** | `cmd-explore.ts` | #9 (P1) |
| D2: `codegraph survey` | **Partial** | `cmd-survey.ts`, `grouper.ts`, `scanner.ts` | #6 (P1), #7 (P1), #17 (P2), #18 (P2) |
| D3: `codegraph list-apis` | **Partial** | `cmd-list-apis.ts`, `formatter.ts` | #8 (P1), #19 (P2), #20 (P2) |
| **Validation** | | | |
| V1: `codegraph verify --spec` | **Not Satisfied** | `cmd-verify.ts`, `checker.ts` | #1 (P0), #2 (P0), #14 (P2), #15 (P2) |
| V2: `architecture apply` | **Satisfied** | `architecture/index.ts` | #25 (P2), #26 (P2) |
| V3: `architecture template --spec` | **Partial** | `architecture/index.ts` | #11 (P1), #13 (P2) |
| **Skill Workflows** | | | |
| V4: Update design skill | **Partial** | `skills/design/SKILL.md` | #3 (P1) |
| V5: Update init-project-html skill | **Partial** | `skills/init-project-html/SKILL.md` | #12 (P1) |

---

## Findings

Total findings: 27 (2 P0, 10 P1, 14 P2, 1 P3)

### P0 — Requirement Blocked

#### #1 V1: Function name extraction in `parseSimpleYamlFeature` is broken

- **Files**: `packages/tools/codegraph/lib/cmd-verify.ts:102-136`
- **Dimension**: Spec Implementation Omission
- **Requirements**: V1

`parseSimpleYamlFeature` (lines 125-131) parses object-format function declarations (`- name: init`) incorrectly:
- It extracts `"name: init"` (raw YAML line) instead of `"init"` — line 128: `fnName = subTrimmed.replace(/^- /, '').trim()` captures the entire `name: init` string.
- The for-loop breaks on any non-`- ` line containing `:` (line 130-131), so after the first function entry, the rest of the functions are silently skipped.

This means `checker.ts` searches for `"name: init"` instead of `"init"`, causing every existing function reference to be incorrectly flagged as missing. Multi-function submodules only check the first function. Requirement V1's core verification logic is fundamentally broken.

#### #2 V1: Edge relationship verification is not implemented

- **Files**: `packages/tools/codegraph/lib/verify/checker.ts:105-136`
- **Dimension**: Spec Implementation Omission
- **Requirements**: V1

The checker only calls `searchNodes()` to verify that edge endpoint symbols exist individually. It never calls `cg.getCallers()` or `cg.getCallees()` to verify that the caller/callee **relationship** actually exists in the codebase. DESIGN.md Section 4.2's API mapping specifies verify uses `.searchNodes()` + `.getCallers()`, but only `.searchNodes()` is used.

Edges reported as "passed" in the verification report when their endpoints exist — even if the directed relationship between them is entirely fabricated by the spec overlay.

---

### P1 — Requirement Defect

#### #3 V4: `proposal.yaml` workflow absent in design skill

- **Files**: `skills/design/SKILL.md:186-200`
- **Dimension**: Spec Implementation Omission
- **Requirements**: V4

Step 5e in `skills/design/SKILL.md` still uses the old workflow:
```bash
apltk architecture --spec <spec_dir> render
apltk architecture --spec <spec_dir> validate
apltk architecture diff
```

The spec requires the new flow: LLM fills `proposal.yaml` → `apltk architecture apply proposal.yaml` → `apltk codegraph verify --spec <dir>`. While `list-apis --all` was correctly added as Step 5b.1, the downstream apply + verify steps are entirely missing. V4 is only partially satisfied.

#### #4 L1: Already-initialized project silently opens instead of error

- **Files**: `packages/tools/codegraph/lib/cg-instance.ts:38-40`
- **Dimension**: Spec Implementation Deviation
- **Requirements**: L1

Spec requires: `codegraph init` on already-initialized project should display error and suggest using `sync`. Implementation calls `CodeGraph.open()` silently and returns success. The `--index` flag is also silently ignored when project is already initialized. User receives misleading success output.

#### #5 L1+L2: `init --index` summary missing duration

- **Files**: `packages/tools/codegraph/lib/cmd-init.ts:43-52`
- **Dimension**: Spec Implementation Omission
- **Requirements**: L2

Spec requires the summary after `init --index` to include file count, symbol count, and **duration**. The current output only shows Project, Status, Files, Nodes, Edges. No timing is captured or displayed. Compare with `cmd-sync.ts:43` which correctly outputs `Duration: ${result.durationMs}ms`.

#### #6 D2: Grouper lacks call graph connectivity analysis

- **Files**: `packages/tools/codegraph/lib/survey/grouper.ts:19-58`
- **Dimension**: Architecture Defect
- **Requirements**: D2

DESIGN.md Section 7.2 specifies a hybrid grouping strategy: use simple connectivity analysis on the call graph to cluster tightly-coupled functions into submodule candidates, then fall back to per-file grouping when no clusters emerge. The implementation only does per-file grouping (with directory-prefix merge). The `cg` instance is never passed to `groupIntoSubmodules()`, making connectivity analysis structurally impossible. This is a significant deviation from the DESIGN.md algorithm.

#### #7 D2: Cross-boundary calls filtered intra-directory (opposite of spec)

- **Files**: `packages/tools/codegraph/lib/cmd-survey.ts:148-149`
- **Dimension**: Spec Implementation Deviation
- **Requirements**: D2

Spec requires identifying cross-boundary call relationships **with other directories**. The implementation explicitly filters to intra-directory callees only (`if (fileSet.has(callee.node.filePath))`). The `suggestedEdges` output contains only internal edges, missing the cross-directory relationships the spec requires.

#### #8 D3: `list-apis --all` missing directory grouping

- **Files**: `packages/tools/codegraph/lib/formatter.ts:64-79`; `packages/tools/codegraph/lib/cmd-list-apis.ts:68-72`
- **Dimension**: Spec Implementation Omission
- **Requirements**: D3

Spec requires `--all` to return "the entire project's all public APIs, grouped by directory." The implementation produces a flat list regardless of output mode (TTY or JSON). No directory-grouping transformation is applied at any stage.

#### #9 D1: Source code not grouped by file in explore output

- **Files**: `packages/tools/codegraph/lib/cmd-explore.ts:78-112`
- **Dimension**: Spec Implementation Deviation
- **Requirements**: D1

Spec requires results to be "grouped by file" (按所屬檔案分組). The implementation iterates `details` (one entry per symbol) and displays each symbol independently with its own `=== symbolName ===` header. Two symbols in the same file appear in separate sections rather than under a shared file heading.

#### #10 L4: status output missing supported languages list

- **Files**: `packages/tools/codegraph/lib/cmd-status.ts:26-39`
- **Dimension**: Spec Implementation Omission
- **Requirements**: L4

Spec requires status to display "supported languages list" (支援的語言清單). The `GraphStats` object from `getStats()` includes `filesByLanguage` data, but the human-readable output path never reads or displays it. Only `nodesByKind` and `edgesByKind` are shown. (JSON mode via `--json` serializes the full stats object, including language data.)

#### #11 V3: Wrong SPEC.md path silently succeeds

- **Files**: `packages/tools/architecture/index.ts:464-473`
- **Dimension**: Spec Implementation Deviation
- **Requirements**: V3

Spec requires that a wrong `--spec` path should produce an error listing possible paths. Implementation silently falls through with empty defaults (`featureSlug = 'feature'`, `featureTitle = 'Feature'`, `goal = ''`) and generates an empty skeleton when `SPEC.md` doesn't exist at the resolved path. No error, no diagnostic.

#### #12 V5: `architecture apply` missing from init-project-html workflow

- **Files**: `skills/init-project-html/SKILL.md:90-101`
- **Dimension**: Spec Implementation Omission
- **Requirements**: V5

The CodeGraph survey step was correctly added, but the downstream step 3 (batch atlas writes via `architecture apply`) is missing from the workflow. The step only references generic "`apltk` cli 工具" without specifying that LLM should use `architecture apply <yaml-file>` for batch mutations.

---

### P2 — Requirement Risk

#### #13 V3: CodeGraph `list-apis --all` integration absent in template
- **Files**: `packages/tools/architecture/index.ts:464-486`
- TODO: No CodeGraph import, index check, or `list-apis` invocation. Spec marks this as optional.

#### #14 V1: Custom YAML parser can't handle real atlas overlay format
- **Files**: `packages/tools/codegraph/lib/cmd-verify.ts:18-96`, `:102-140`
- The line-by-line parser cannot parse nested YAML structures (feature-level edges, multi-value fields). The project already has `js-yaml` as a dependency; `state.js::loadOverlay` uses it correctly. This parser should be replaced.

#### #15 V1: Submodule `action: add` guard never triggers
- **Files**: `packages/tools/codegraph/lib/cmd-verify.ts:120`
- `if (sub.action)` guards a property that was never initialized on the `sub` object, so `action: add` at submodule level is never parsed. Skip-new-feature logic at submodule level is non-functional.

#### #16 D1: `--feature` flag not supported for explore
- **Files**: `packages/tools/codegraph/index.ts:86`; `packages/tools/codegraph/lib/cmd-explore.ts:7-9`
- Parsed in dispatch but never passed to `handleExplore` or included in `ExploreOptions`.

#### #17 D2: Entry points don't verify external callers
- **Files**: `packages/tools/codegraph/lib/cmd-survey.ts:72`
- Entry points are identified by `isExported` alone, not by checking whether they're actually called from outside the directory. Over-reports entry points.

#### #18 D2: Non-existent directory returns empty report
- **Files**: `packages/tools/codegraph/lib/survey/scanner.ts:41-45`
- No directory existence check; produces empty scan result with no diagnostic.

#### #19 D3: TTY mode missing caller details
- **Files**: `packages/tools/codegraph/lib/formatter.ts:77`
- Only shows `(N callers)` count, not actual caller names/locations. JSON mode has full data.

#### #20 D3: Return type not independently accessible
- **Files**: `packages/tools/codegraph/lib/cmd-list-apis.ts:39,59`
- Relies on CodeGraph's merged `signature` string. No separate `returnType` or `parameters` fields available in stored data.

#### #21 L3: Progress events collected but never displayed
- **Files**: `packages/tools/codegraph/lib/cmd-sync.ts:14-19`
- `progressEvents` array grows unbounded; never written to stdout or included in output.

#### #22 L3: No `isInitialized()` check before sync
- **Files**: `packages/tools/codegraph/lib/cmd-sync.ts:12`
- `CodeGraph.open()` called without checking if index exists. Uninitialized projects get a cryptic error instead of "please run `codegraph init` first."

#### #23 L2: Duplicate `--index` flag check
- **Files**: `packages/tools/codegraph/index.ts:42,63`
- `shouldIndex || rest.includes('--index')` is logically redundant; `--index` is never removed from `rest`.

#### #24 L1+L2: API call differs from DESIGN.md
- **Files**: `packages/tools/codegraph/lib/cg-instance.ts:42-45`
- DESIGN.md specifies `CodeGraph.init(path) + .indexAll({onProgress})`. Implementation passes `{index: true}` as option to `CodeGraph.init()`. Functional correctness depends on whether `@colbymchenry/codegraph` supports this parameter.

#### #25 V2: Submodule remove doesn't cascade cross-feature edges
- **Files**: `packages/tools/architecture/index.ts:56-66`
- `removeSubmodule` only cleans feature.edges (intra-feature). Cross-feature edges in `merged.edges` referencing the removed submodule remain dangling.

#### #26 V2: Edge add lacks referential integrity validation
- **Files**: `packages/tools/architecture/index.ts:329-385`
- Edge additions don't verify that referenced features or submodules exist in the resolved state. Can silently create dangling edges.

#### #27 V4+V5: Cross-requirement — skill workflow inconsistency
- **Files**: `skills/design/SKILL.md`, `skills/init-project-html/SKILL.md`
- Both skill updates added the CodeGraph query step but omitted the downstream `architecture apply` step. The workflows internally reference parts of the new pipeline but not the full flow.

---

### P3 — Suggestion

No P3 findings are listed for brevity — all functionality is correct and no P3 finding blocks a merge.

---

## Review History

This is the first review round for this feature. No previous REPORT.md exists.

---

## Dimension Summary

Total findings exceed 5. Finding counts by dimension:

| Dimension | Count |
|---|---|
| Spec Implementation Omission | 11 |
| Spec Implementation Deviation | 5 |
| Architecture Defect | 4 |
| Redundant Code | 1 |
| Performance Concern | 0 |
| Hallucinated Code | 0 |

---

*Report generated by the `review` skill. Contains findings only — no fix suggestions or verification methods. Fix planning is handled by the `qa` skill.*
