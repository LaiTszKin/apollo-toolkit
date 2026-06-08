# Regression Test Worker Prompt: REGTEST-39-batch-flag-scoping

- **Related fix**: FIX-04 — batch flag scoping

---

## 1. Mission & Rules

### Mission

Add regression coverage that relation flags do not leak into later batch entities.

### Context

Round 6 code copies globally parsed relation flags into every entity block that lacks them.

### Rules

- Only modify `test/atlas-cli.test.js`.
- The test must fail on Round 6 code and pass after FIX-04.

---

## 2. Context

### Input Files

- `test/atlas-cli.test.js`
- `docs/plans/2026-06-07/architecture-simplify/fix/FIX-04-batch-flag-scoping.md`

### Test Design

- **Test ID**: REGTEST-39
- **Type**: Integration
- **Location**: `test/atlas-cli.test.js`
- **Scenario**: GIVEN target feature exists WHEN batch command includes `--depends-on target` before first entity and then adds two features THEN later entity does not silently inherit the dependency.
- **Oracle**: Round 6 code gives both entities the dependency; fixed code does not.

---

## 3. Tasks

1. Add test `REGTEST-39: batch relation flags do not leak to later entities`.
2. Create feature `target`.
3. Run `add --depends-on target feature a feature b`.
4. Load state.
5. Assert `b.dependsOn` does not include `target`. Define expected behavior for `a` based on the final parser semantics from FIX-04.

---

## 4. Verification

1. Before FIX-04: `node --test test/atlas-cli.test.js --test-name-pattern "REGTEST-39"` fails.
2. After FIX-04: same command passes.

---

## 5. Scope & References

### Allowed Files

- `test/atlas-cli.test.js`

### Forbidden Files

- All source code files.

### Related Documents

- `docs/plans/2026-06-07/architecture-simplify/fix/FIX-04-batch-flag-scoping.md`
