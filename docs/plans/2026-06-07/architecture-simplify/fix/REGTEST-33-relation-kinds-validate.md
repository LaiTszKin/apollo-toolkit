# Regression Test Worker Prompt: REGTEST-33-relation-kinds-validate

- **Related fix**: FIX-01 — relation edge schema/render support

---

## 1. Mission & Rules

### Mission

Add a regression test proving unified relation edge kinds validate successfully.

### Context

FIX-01 expands schema/render support for `dependency`, `implements`, and `deployed-on`.

### Rules

- Only modify test files.
- The test must fail on Round 6 code and pass after FIX-01.
- Follow `test/atlas-cli.test.js` style.

---

## 2. Context

### Input Files

- `test/atlas-cli.test.js` — add the test here.
- `skills/init-project-html/lib/atlas/schema.js` — read expected edge kinds.
- `docs/plans/2026-06-07/architecture-simplify/fix/FIX-01-relation-edge-schema.md`

### Test Design

- **Test ID**: REGTEST-33
- **Type**: Integration
- **Location**: `test/atlas-cli.test.js`
- **Scenario**: GIVEN valid features/modules WHEN unified add creates dependency, implements, and deployed-on edges THEN `validate` succeeds.
- **Oracle**: Round 6 code fails validation because schema rejects the new kinds; fixed code passes.

---

## 3. Tasks

1. Add a `node:test` block named `REGTEST-33: unified relation edge kinds validate`.
2. Use existing helpers such as `mkProject()` and `makeIo()`.
3. Create features/modules needed for valid endpoints.
4. Run unified `add` commands that create:
   - a `dependency` edge,
   - an `implements` edge,
   - a `deployed-on` edge to an existing endpoint.
5. Run `validate`.
6. Assert exit code `0`.

### Output

Report test file, test name, oracle confirmation, and command output.

---

## 4. Verification

1. Before FIX-01: `node --test test/atlas-cli.test.js --test-name-pattern "REGTEST-33"`
   - Expected: fails.
2. After FIX-01: same command
   - Expected: passes.
3. Run: `node --test test/atlas-cli.test.js`
   - Expected: all tests pass.

---

## 5. Scope & References

### Allowed Files

- `test/atlas-cli.test.js`

### Forbidden Files

- All source code files.

### Related Documents

- `docs/plans/2026-06-07/architecture-simplify/fix/FIX-01-relation-edge-schema.md`
- `docs/plans/2026-06-07/architecture-simplify/SPEC.md`
