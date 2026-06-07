# Fix Worker Prompt: FIX-02-docs-cleanup

- **Related issues**: P2-10, P2-13, P3-19, P3-20 (help text fixes + code cleanup)
- **Source REPORT**: `docs/plans/2026-06-07/architecture-simplify/REPORT.md`

---

## 1. Mission & Rules

### Mission

Fix 4 issues: correct misleading help text for module `--depends-on` flag, restore operational verbs to top-level help, clarify mutual exclusivity of relation flags, and remove duplicated helper functions from `index.ts`.

### Rules

- Follow the Scope in Section 5 — only modify files listed as Allowed
- Preserve existing test semantics — do not weaken, skip, or remove existing tests
- Workers are leaf nodes — do not spawn sub-workers

---

## 2. Context

### Input Files

- `skills/init-project-html/lib/atlas/cli-help.js` — Help page builders
- `packages/tools/architecture/index.ts` — TS handler with duplicated helpers

### Root Cause Summary

**P2-10: Help page claims `--depends-on <feature>` works for modules** — `cli-help.js` L1001 lists `[--depends-on <feature>]` in the module usage line, but the current implementation doesn't support module-level `--depends-on`. After FIX-01 applies, `--depends-on` will work for modules (creating dependency edges), so this becomes a documentation accuracy fix.

**P2-13: Operational verbs hidden from top-level help** — `cli-help.js` L728-778 whitelists only `add`, `remove`, `diff`, `merge`, `render`, `open` in usage lines. `validate`, `status`, `scan`, `undo` are functional but absent from the main help overview. They are discoverable only via `apltk architecture <verb> --help`.

**P3-19: Help text relation flags not marked as mutually exclusive** — `--data-flow-to`, `--implements`, `--deployed-on` appear as independent flags in the `add` help page (L1012-1022), but they are alternatives.

**P3-20: Pre-existing duplicated helper functions** — `ensureFeature()`, `ensureSubmodule()`, `removeFeature()`, `removeSubmodule()`, `endpointReferences()`, `parseEndpoint()`, `isIntraFeatureEdge()`, `endpointEquals()` exist in both `index.ts` (L11-105) and `cli.js` (L285-345). These are no longer needed in `index.ts` since `handleApply()`/`handleTemplate()` are no longer CLI-reachable but are retained as internal utilities.

---

## 3. Tasks

### Task 1: Fix module `--depends-on` help text (P2-10)

**File**: `cli-help.js`

**Problem**: The `add` help page (L1000-1004) shows:
```
'apltk architecture add module <slug> --part-of <feature> [--depends-on <feature>]',
```

**Fix**: Keep `[--depends-on <feature>]` in the usage line (since FIX-01 adds support for it), but add a note clarifying that `--depends-on` creates a dependency edge, not a field on the module.

In the notes section of the add help page, add:
```javascript
notes: [
  '`--depends-on` for modules creates a dependency relationship edge (like `add relation`).',
  '`--implements` and `--deployed-on` are available for the `relation` entity type.',
  'Use the `feature` entity type to set feature-level dependency metadata.',
],
```

### Task 2: Restore operational verbs to top-level help (P2-13)

**File**: `cli-help.js`

**Problem**: `buildArchitectureHelpPage()` with no verb (L728-778) omits `validate`, `status`, `scan`, `undo` from usage lines, notes, and examples.

**Fix**: Add `validate`, `status`, `scan`, `undo` to the top-level help. They were hidden as a side-effect of whitelisting only the 6 public verbs.

In the `usageLines` array (around L735-739), after the existing lines, add:
```javascript
'apltk architecture validate         # run schema and referential integrity checks',
'apltk architecture status           # print atlas state summary',
'apltk architecture scan             # scan directory for feature candidates',
'apltk architecture undo             # roll back recent mutations',
```

In the `useWhen` section, add:
```javascript
'You need to validate atlas integrity, scan for candidate features, inspect status, or undo recent changes.',
```

### Task 3: Clarify mutual exclusivity of relation flags (P3-19)

**File**: `cli-help.js`

**Problem**: In the add help page optional flags section (L1012-1022), `--data-flow-to`, `--implements`, and `--deployed-on` appear as independent flags without indicating they are alternatives.

**Fix**: Change the flag descriptions to note mutual exclusivity. Modify the relevant lines:

```javascript
'`--data-flow-to <endpoint>` — for relations: data flows from source to target.',
'`--implements <endpoint>` — for relations: implements an interface (alternative to --data-flow-to).',
'`--deployed-on <endpoint>` — for relations: deployment target (alternative to --data-flow-to).',
```

### Task 4: Remove duplicated helper functions from index.ts (P3-20)

**File**: `packages/tools/architecture/index.ts`

**Problem**: Helper functions at L11-105 (`findFeature`, `findSubmodule`, `ensureFeature`, `removeFeature`, `endpointReferences`, `ensureSubmodule`, `removeSubmodule`, `parseEndpoint`, `isIntraFeatureEdge`, `endpointEquals`, `toSlug`, `parseSpecMetadata`, `yamlStr`) are duplicated from `cli.js`. Their only callers are `handleApply()` and `handleTemplate()` which are no longer CLI-reachable.

**Note**: Although `handleApply()` and `handleTemplate()` are no longer routeable from the CLI, they are retained as internal utilities (per DESIGN.md). The helper functions they call must remain to keep those handlers functional (even though unreachable). 

**Alternative fix**: Since the duplicated helpers are only used by the now-unreachable `handleApply()`/`handleTemplate()` functions, and those functions also call `cli.js` and `state.js` modules, the cleanest resolution is to:

1. Remove both `handleApply()` and `handleTemplate()` functions from `index.ts` (L147-583)
2. Remove all their helper functions (L11-105)
3. Remove the `createRequire` import for `@colbymchenry/codegraph` (L3, L558)
4. Remove the `yaml` import (L6) if no longer used by the handler

This is safe because `architectureHandler()` (L600-633) now fully delegates to `cli.js` — none of these functions are reachable.

**Do this instead**: Remove retired code.

```javascript
// Delete: L11-105 (all helper functions)
// Delete: L145-146 (comment) through L583 (end of handleTemplate)
// Remove unnecessary imports: createRequire (L3), yaml (L6)
```

Keep the `architectureHandler()` function (L600-633) and the `tool` export (L626-632) — these are the active entry points.

### Output

When done, report back to the coordinator:
- **Files modified**: `cli-help.js`, `index.ts`
- **Change summary**: Which tasks completed
- **Test results**: `node --test test/architecture-script.test.js` — help text tests pass
- **Risks or concerns**: [or "None"]

---

## 4. Verification

1. Run: `node --test test/atlas-cli.test.js`
   - Expected: All tests pass, especially the help text tests

2. Run: `node --test packages/tools/architecture/index.test.ts`
   - Expected: All handler tests pass (verify handler still delegates to cli.js correctly)

3. Run: `node --test test/tools/architecture-error-types.test.js`
   - Expected: All error path tests pass

4. Run: `node --test test/architecture-script.test.js`
   - Expected: Help text and tool registration tests pass

---

## 5. Scope & References

### Allowed Files

- `skills/init-project-html/lib/atlas/cli-help.js` — Help text fixes
- `packages/tools/architecture/index.ts` — Remove retired duplicated code

### Forbidden Files

- `skills/init-project-html/lib/atlas/cli.js` — handled by FIX-01 worker
- All test files — handled by REGTEST workers
- All documents under `docs/plans/` — not to be modified

### Related Documents

- `docs/plans/2026-06-07/architecture-simplify/REPORT.md` — Review findings (P2-10, P2-13, P3-19, P3-20)
- `docs/plans/2026-06-07/architecture-simplify/SPEC.md` — Business requirements
