# Fix Worker Prompt: FIX-01-relation-edge-schema

- **Related issue**: FIX-01 / REPORT P1-1

---

## 1. Mission & Rules

### Mission

Make unified `add` relation edge kinds valid across schema validation and rendering.

### Context

REPORT Round 6 found that `cli.js` writes `dependency`, `implements`, and `deployed-on` edge kinds, but `schema.js` rejects them. This blocks Req 1 because CLI success can leave invalid atlas YAML.

### Rules

- Follow the Scope in Section 5.
- Preserve existing `call`, `return`, `data-row`, and `failure` behavior.
- Do not re-encode these relationships into labels or unrelated kinds.
- Do not add dependencies.
- Workers are leaf nodes; do not spawn sub-workers.

---

## 2. Context

### Input Files

- `skills/init-project-html/lib/atlas/schema.js` — `EDGE_KINDS` and `validateEdge()`.
- `skills/init-project-html/lib/atlas/render.js` — macro SVG marker list and legend.
- `skills/init-project-html/lib/atlas/cli.js` — current edge kinds emitted by unified `add`.
- `skills/init-project-html/references/architecture.css` — edge/legend styling if new kind classes need explicit styling.
- `docs/plans/2026-06-07/architecture-simplify/REPORT.md` — P1-1.

### Root Cause

`processAddEntity()` emits `dependency`, `implements`, and `deployed-on` edge kinds. `EDGE_KINDS` only accepts `call`, `return`, `data-row`, and `failure`, and `render.js` only creates SVG markers/legend entries for those four kinds.

---

## 3. Tasks

### `skills/init-project-html/lib/atlas/schema.js` — accept unified relation kinds

1. Open `schema.js`.
2. Locate `EDGE_KINDS` near lines 45-50.
3. Add `dependency`, `implements`, and `deployed-on` to the frozen array.
4. Keep `validateEdge()` behavior unchanged except that the error message now naturally includes the expanded vocabulary.

### `skills/init-project-html/lib/atlas/render.js` — render new edge kinds

1. Open `render.js`.
2. Locate marker generation in `renderMacroSvg()` near lines 97-99.
3. Replace the hard-coded marker kind list with a shared local list that includes `call`, `return`, `data-row`, `failure`, `dependency`, `implements`, and `deployed-on`.
4. Locate the legend near lines 234-239.
5. Add legend entries for the three new kinds, using the same class naming pattern.

### `skills/init-project-html/references/architecture.css` — style new kinds if needed

1. Search for `.m-edge--call`, `.legend-swatch--call`, or kind-specific selectors.
2. Add explicit styles for `dependency`, `implements`, and `deployed-on` only if the current CSS would otherwise render them without markers or readable styling.

### Output

Report:
- Files modified.
- Whether CSS changes were needed.
- Verification commands and results.
- Risks or concerns.

---

## 4. Verification

1. Run: `node --test test/atlas-cli.test.js --test-name-pattern "relation --implements|module --depends-on|module --deployed-on"`
   - Expected: matching tests pass.
2. Run a manual validation probe:
   - Create a temp atlas.
   - Add features/modules.
   - Add `--depends-on`, `--implements`, and `--deployed-on` relations.
   - Run `validate`.
   - Expected: validation returns code 0 for valid existing endpoints.

---

## 5. Scope & References

### Allowed Files

- `skills/init-project-html/lib/atlas/schema.js`
- `skills/init-project-html/lib/atlas/render.js`
- `skills/init-project-html/references/architecture.css`

### Forbidden Files

- `test/atlas-cli.test.js` — regression-test workers own test edits.
- `skills/init-project-html/lib/atlas/cli.js` — other fix workers own CLI behavior unless a tiny kind-list reference is strictly necessary.

### Related Documents

- `docs/plans/2026-06-07/architecture-simplify/SPEC.md`
- `docs/plans/2026-06-07/architecture-simplify/DESIGN.md`
- `docs/plans/2026-06-07/architecture-simplify/REPORT.md`
