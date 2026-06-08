# Fix Worker Prompt: FIX-04-batch-flag-scoping

- **Related issue**: FIX-04 / REPORT P1-5

---

## 1. Mission & Rules

### Mission

Stop relation flags from leaking across entities in unified `add` batch mode.

### Context

Requirement 2 says each batch entity block independently defines its type, name, and relation flags. Current parsing copies globally parsed relation flags into later entities.

### Rules

- Modify only `cli.js`.
- Preserve true global flags: `project`, `spec`, `no-render`, `dry-run`, and `evidence`.
- Do not change single-entity parsing.

---

## 2. Context

### Input Files

- `skills/init-project-html/lib/atlas/cli.js` — interleaved batch parser, especially lines 1058-1070.
- `docs/plans/2026-06-07/architecture-simplify/REPORT.md` — P1-5.

### Root Cause

After parsing an entity block, the code copies `depends-on`, `part-of`, `data-flow-to`, `implements`, `deployed-on`, and `to` from global `flags` into `entityFlags` when absent. Those are entity-specific flags and should not be inherited silently.

---

## 3. Tasks

### `skills/init-project-html/lib/atlas/cli.js` — restrict global flag copying

1. Open `cli.js`.
2. Locate the interleaved batch parser block that starts copying global flags near line 1058.
3. Keep copying only:
   - `project`
   - `spec`
   - `no-render`
   - `dry-run`
   - `evidence`
4. Remove copying for:
   - `depends-on`
   - `part-of`
   - `data-flow-to`
   - `implements`
   - `deployed-on`
   - `to`
5. Ensure explicit per-entity flags inside the raw batch still work.

### Output

Report:
- Files modified.
- The exact flags still copied globally.
- Verification commands and results.

---

## 4. Verification

1. Run: `node --test test/atlas-cli.test.js --test-name-pattern "batch mode|depends-on before first entity|REGTEST-F08"`
   - Expected: adjust only behavior covered by new Round 6 tests; existing tests should not fail unless they encoded the defective leakage.
2. Manual probe:
   - Add target feature.
   - Run `add --depends-on target feature a feature b`.
   - Expected: no silent dependency copied to `b`.

---

## 5. Scope & References

### Allowed Files

- `skills/init-project-html/lib/atlas/cli.js`

### Forbidden Files

- `test/atlas-cli.test.js` — regression-test workers own test edits.

### Related Documents

- `docs/plans/2026-06-07/architecture-simplify/SPEC.md`
- `docs/plans/2026-06-07/architecture-simplify/REPORT.md`
