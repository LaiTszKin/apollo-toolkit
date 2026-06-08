# Regression Test Worker Prompt: REGTEST-35-deployed-on-target-validation

- **Related fix**: FIX-02 — endpoint validation

---

## 1. Mission & Rules

### Mission

Add regression coverage that `--deployed-on` rejects missing endpoint targets before writing.

### Context

Round 6 code can write `--deployed-on eks-cluster` as an invalid atlas endpoint.

### Rules

- Only modify `test/atlas-cli.test.js`.
- The test must fail on Round 6 code and pass after FIX-02.

---

## 2. Context

### Input Files

- `test/atlas-cli.test.js`
- `docs/plans/2026-06-07/architecture-simplify/fix/FIX-02-endpoint-validation.md`

### Test Design

- **Test ID**: REGTEST-35
- **Type**: Integration
- **Location**: `test/atlas-cli.test.js`
- **Scenario**: GIVEN no `eks-cluster` endpoint exists WHEN adding `--deployed-on eks-cluster` THEN command fails and no edge is written.
- **Oracle**: Round 6 code succeeds/writes invalid edge; fixed code fails before write.

---

## 3. Tasks

1. Add test `REGTEST-35: deployed-on requires existing endpoint`.
2. Create feature `payment` and module `payment/api`.
3. Run `add module worker --part-of payment --deployed-on eks-cluster`.
4. Assert non-zero exit and stderr mentions target not found.
5. Load state and assert no `deployed-on` edge exists.

---

## 4. Verification

1. Before FIX-02: `node --test test/atlas-cli.test.js --test-name-pattern "REGTEST-35"` fails.
2. After FIX-02: same command passes.

---

## 5. Scope & References

### Allowed Files

- `test/atlas-cli.test.js`

### Forbidden Files

- All source code files.

### Related Documents

- `docs/plans/2026-06-07/architecture-simplify/fix/FIX-02-endpoint-validation.md`
