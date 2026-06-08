# Fix Worker Prompt: FIX-07-diff-spec-render

- **Related issue**: FIX-07 / REPORT P1-11

---

## 1. Mission & Rules

### Mission

Ensure `diff --spec` produces a complete before/after viewer even when the spec overlay was created with `--no-render`.

### Context

Req 5 says `diff --spec` must read overlays produced by `add --spec` and produce before/after comparison HTML. Round 6 found that after-side files can be missing.

### Rules

- Modify only `cli.js`.
- Do not mutate base atlas YAML.
- Do not launch browsers in tests; preserve `--no-open`.

---

## 2. Context

### Input Files

- `skills/init-project-html/lib/atlas/cli.js` — `verbDiff()`, `collectDiffChanges()`, `collectSingleSpecChanges()`, `diffToChanges()`.
- `skills/init-project-html/lib/atlas/render.js` — render API, read only.
- `docs/plans/2026-06-07/architecture-simplify/REPORT.md` — P1-11.

### Root Cause

`collectSingleSpecChanges()` loads overlay state and computes after paths under `<spec>/architecture_diff`, but it does not render missing after HTML when the overlay was written with `--no-render`.

---

## 3. Tasks

### `skills/init-project-html/lib/atlas/cli.js` — render state overlay before diff changes

1. Pass `outDir` or an appropriate render root into single-spec collection if needed.
2. In `collectSingleSpecChanges()`, when overlay state exists:
   - load base and overlay,
   - merge state,
   - compute `diffPages`,
   - render the merged state into the spec `architecture_diff/` directory or a diff-owned render directory before `diffToChanges()`.
3. Use scoped render behavior so only relevant pages are emitted.
4. Ensure non-null `afterPath` files exist before they are referenced.
5. Keep removed pages as `afterPath: null`.

### Output

Report:
- Modified functions.
- Where after pages are rendered.
- Commands run.

---

## 4. Verification

1. Run: `node --test test/atlas-cli.test.js --test-name-pattern "diff --spec|unified add --spec"`
   - Expected: matching tests pass.
2. Manual probe:
   - `add feature new --spec <dir> --no-render`
   - `diff --spec <dir> --out <out> --no-open`
   - Expected: viewer references only existing non-null after files.

---

## 5. Scope & References

### Allowed Files

- `skills/init-project-html/lib/atlas/cli.js`

### Forbidden Files

- `test/atlas-cli.test.js` — regression-test workers own test edits.
- `skills/init-project-html/lib/atlas/render.js` — read only unless coordinator approves.

### Related Documents

- `docs/plans/2026-06-07/architecture-simplify/SPEC.md`
- `docs/plans/2026-06-07/architecture-simplify/REPORT.md`
