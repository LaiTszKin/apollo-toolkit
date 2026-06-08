# Regression Test Worker Prompt: REGTEST-34-submodule-target-validation

- **Related fix**: FIX-02 — endpoint validation

---

## 1. Mission & Rules

### Mission

Add regression coverage that missing submodule endpoint targets are rejected without writing edges.

### Context

Round 6 code accepts targets like `b/svc` when feature `b` exists but submodule `svc` does not.

### Rules

- Only modify `test/atlas-cli.test.js`.
- The test must fail on Round 6 code and pass after FIX-02.

---

## 2. Context

### Input Files

- `test/atlas-cli.test.js` — write test here.
- `docs/plans/2026-06-07/architecture-simplify/fix/FIX-02-endpoint-validation.md`

### Test Design

- **Test ID**: REGTEST-34
- **Type**: Integration
- **Location**: `test/atlas-cli.test.js`
- **Scenario**: GIVEN feature `b` exists without submodule `svc` WHEN adding `--implements b/svc` or `--data-flow-to b/svc` THEN command fails and no edge is written.
- **Oracle**: Round 6 code succeeds and writes edge; fixed code fails before write.

---

## 3. Tasks

1. Add test `REGTEST-34: missing submodule relation targets are rejected`.
2. Build an atlas with features `a`, `b`, and module `a/src`; do not create `b/svc`.
3. Attempt:
   - `add relation a/src --implements b/svc`
   - `add module other --part-of a --data-flow-to b/svc`
4. Assert non-zero exit codes.
5. Load state and assert no edge references `b/svc`.

---

## 4. Verification

1. Before FIX-02: run `node --test test/atlas-cli.test.js --test-name-pattern "REGTEST-34"`
   - Expected: fails.
2. After FIX-02: same command
   - Expected: passes.

---

## 5. Scope & References

### Allowed Files

- `test/atlas-cli.test.js`

### Forbidden Files

- All source code files.

### Related Documents

- `docs/plans/2026-06-07/architecture-simplify/fix/FIX-02-endpoint-validation.md`
