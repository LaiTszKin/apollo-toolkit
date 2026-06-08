# Fix Worker Prompt: FIX-03-add-atomicity

- **Related issue**: FIX-03 / REPORT P1-4, P1-6, P1-7

---

## 1. Mission & Rules

### Mission

Make unified `add` avoid partial writes and fix successful spec-batch completion.

### Context

REPORT Round 6 found three related defects: failed single `add` can persist the entity, successful `add --spec` batch can fail with `overlayDir is not defined`, and failed batches can leave undo/history side effects.

### Rules

- Modify only `cli.js`.
- Preserve base vs spec overlay separation.
- Do not weaken existing rollback behavior.
- Do not add dependencies.

---

## 2. Context

### Input Files

- `skills/init-project-html/lib/atlas/cli.js` — `verbAdd()`, `processAddEntity()`, batch paths.
- `skills/init-project-html/lib/atlas/state.js` — undo/history behavior, read only.
- `docs/plans/2026-06-07/architecture-simplify/REPORT.md` — P1-4, P1-6, P1-7.

### Root Cause

Feature/module creation happens before related target validation. Batch spec paths store `overlayDir` in block scope, then use it later. Batch entities set `skipUndo`, but delegated feature/module calls rebuild flags and drop that field.

---

## 3. Tasks

### `skills/init-project-html/lib/atlas/cli.js` — prevalidate before writes

1. In `processAddEntity()` feature branch, validate `--depends-on` targets before calling `verbFeature('add')`.
2. In module and relation branches, keep all endpoint validation before any delegated mutation or edge write.
3. Ensure failed validation leaves base state and spec overlay unchanged.

### `skills/init-project-html/lib/atlas/cli.js` — forward skipUndo

1. In feature delegate flags near lines 739-747, add `skipUndo: entityFlags.skipUndo`.
2. In module delegate flags near lines 781-790, add `skipUndo: entityFlags.skipUndo`.
3. Check any other delegated mutation from `processAddEntity()` that should carry `skipUndo`.

### `skills/init-project-html/lib/atlas/cli.js` — fix spec-batch overlayDir scope

1. In the interleaved batch path around lines 1104-1136, declare `let overlayDir` outside the `if (flags.spec)` block and assign it from `specOverlayDir()`.
2. Use the same pattern in the simple pair batch path around lines 1174-1222.
3. Ensure batch-level undo/history writes use the correct `overlayDir`.

### Output

Report:
- Exact modified sections.
- Whether single add, base batch, and spec batch were manually probed.
- Commands run.

---

## 4. Verification

1. Run: `node --test test/atlas-cli.test.js --test-name-pattern "batch add rolls back|REGTEST-29|REGTEST-28"`
   - Expected: matching tests pass.
2. Manual probes:
   - `add feature bad --depends-on missing` exits non-zero and leaves no `bad` feature.
   - `add feature a feature b --spec <existing-spec> --no-render` exits 0 and writes overlay.
   - failed batch leaves `atlas.history.log` and `atlas.history.undo.stack.json` unchanged.

---

## 5. Scope & References

### Allowed Files

- `skills/init-project-html/lib/atlas/cli.js`

### Forbidden Files

- `skills/init-project-html/lib/atlas/state.js` — read only unless coordinator approves.
- `test/atlas-cli.test.js` — regression-test workers own test edits.

### Related Documents

- `docs/plans/2026-06-07/architecture-simplify/SPEC.md`
- `docs/plans/2026-06-07/architecture-simplify/REPORT.md`
