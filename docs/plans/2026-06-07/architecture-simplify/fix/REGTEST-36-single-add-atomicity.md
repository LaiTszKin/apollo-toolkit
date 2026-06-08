# Regression Test Worker Prompt: REGTEST-36-single-add-atomicity

- **Related fix**: FIX-03 — add atomicity

---

## 1. Mission & Rules

### Mission

Add a regression test proving failed single-entity `add` leaves no partial entity.

### Context

Round 6 code writes a feature before later dependency validation fails.

### Rules

- Only modify `test/atlas-cli.test.js`.
- The test must fail on Round 6 code and pass after FIX-03.

---

## 2. Context

### Input Files

- `test/atlas-cli.test.js`
- `docs/plans/2026-06-07/architecture-simplify/fix/FIX-03-add-atomicity.md`

### Test Design

- **Test ID**: REGTEST-36
- **Type**: Integration
- **Location**: `test/atlas-cli.test.js`
- **Scenario**: GIVEN feature `base` exists WHEN `add feature bad --depends-on missing` fails THEN `bad` is absent from base state.
- **Oracle**: Round 6 code leaves `bad`; fixed code does not.

---

## 3. Tasks

1. Add test `REGTEST-36: failed single add leaves no partial feature`.
2. Create feature `base`.
3. Run `add feature bad --depends-on missing`.
4. Assert non-zero exit.
5. Load state and assert only `base` exists.

---

## 4. Verification

1. Before FIX-03: `node --test test/atlas-cli.test.js --test-name-pattern "REGTEST-36"` fails.
2. After FIX-03: same command passes.

---

## 5. Scope & References

### Allowed Files

- `test/atlas-cli.test.js`

### Forbidden Files

- All source code files.

### Related Documents

- `docs/plans/2026-06-07/architecture-simplify/fix/FIX-03-add-atomicity.md`
