# Regression Test Worker Prompt: REGTEST-37-spec-batch-success

- **Related fix**: FIX-03 — spec-batch completion

---

## 1. Mission & Rules

### Mission

Add a regression test proving successful `add --spec` batch exits 0 and writes overlay state.

### Context

Round 6 code can write overlay state and then fail with `overlayDir is not defined`.

### Rules

- Only modify `test/atlas-cli.test.js`.
- The test must fail on Round 6 code and pass after FIX-03.

---

## 2. Context

### Input Files

- `test/atlas-cli.test.js`
- `docs/plans/2026-06-07/architecture-simplify/fix/FIX-03-add-atomicity.md`

### Test Design

- **Test ID**: REGTEST-37
- **Type**: Integration
- **Location**: `test/atlas-cli.test.js`
- **Scenario**: GIVEN an existing spec dir WHEN `add feature spec-a feature spec-b --spec <dir>` runs THEN exit code is 0 and overlay contains both features.
- **Oracle**: Round 6 code exits 1; fixed code exits 0.

---

## 3. Tasks

1. Add test `REGTEST-37: spec batch add exits zero and writes overlay`.
2. Create a temp project and existing `docs/plans/spec-batch` dir.
3. Run simple pair batch with `--spec`.
4. Assert exit code `0`.
5. Load overlay and assert `spec-a` and `spec-b` are present.

---

## 4. Verification

1. Before FIX-03: `node --test test/atlas-cli.test.js --test-name-pattern "REGTEST-37"` fails.
2. After FIX-03: same command passes.

---

## 5. Scope & References

### Allowed Files

- `test/atlas-cli.test.js`

### Forbidden Files

- All source code files.

### Related Documents

- `docs/plans/2026-06-07/architecture-simplify/fix/FIX-03-add-atomicity.md`
