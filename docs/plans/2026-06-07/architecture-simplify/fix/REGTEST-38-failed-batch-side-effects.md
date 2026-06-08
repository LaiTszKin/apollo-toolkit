# Regression Test Worker Prompt: REGTEST-38-failed-batch-side-effects

- **Related fix**: FIX-03 — failed-batch side effects

---

## 1. Mission & Rules

### Mission

Add a regression test proving failed batch rollback leaves no extra history or undo side effects.

### Context

Round 6 code can restore YAML while leaking `atlas.history.log` or `atlas.history.undo.stack.json` entries.

### Rules

- Only modify `test/atlas-cli.test.js`.
- The test must fail on Round 6 code and pass after FIX-03.

---

## 2. Context

### Input Files

- `test/atlas-cli.test.js`
- `skills/init-project-html/lib/atlas/state.js` — file names for history/undo, read only.
- `docs/plans/2026-06-07/architecture-simplify/fix/FIX-03-add-atomicity.md`

### Test Design

- **Test ID**: REGTEST-38
- **Type**: Integration
- **Location**: `test/atlas-cli.test.js`
- **Scenario**: GIVEN initial history/undo counts WHEN a batch mutates one entity then later fails during processing THEN YAML, history, and undo stack are unchanged.
- **Oracle**: Round 6 code leaks history/undo entries; fixed code does not.

---

## 3. Tasks

1. Add test `REGTEST-38: failed batch leaves no history or undo side effects`.
2. Create a batch where pre-validation passes for the first entity and a later entity fails during processing, not only pre-validation.
3. Capture before contents/counts of:
   - `resources/project-architecture/atlas/atlas.history.log`
   - `resources/project-architecture/atlas/atlas.history.undo.stack.json`
4. Run the failing batch.
5. Assert state and both side-effect files match before.

---

## 4. Verification

1. Before FIX-03: `node --test test/atlas-cli.test.js --test-name-pattern "REGTEST-38"` fails.
2. After FIX-03: same command passes.

---

## 5. Scope & References

### Allowed Files

- `test/atlas-cli.test.js`

### Forbidden Files

- All source code files.

### Related Documents

- `docs/plans/2026-06-07/architecture-simplify/fix/FIX-03-add-atomicity.md`
