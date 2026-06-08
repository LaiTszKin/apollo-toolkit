# Regression Test Worker Prompt: REGTEST-40-remove-module-root-edges

- **Related fix**: FIX-05 — remove module cascade

---

## 1. Mission & Rules

### Mission

Add regression coverage that removing a module removes root-level edges referencing it.

### Context

Round 6 code leaves dangling root edges after `remove module`.

### Rules

- Only modify `test/atlas-cli.test.js`.
- The test must fail on Round 6 code and pass after FIX-05.

---

## 2. Context

### Input Files

- `test/atlas-cli.test.js`
- `docs/plans/2026-06-07/architecture-simplify/fix/FIX-05-remove-module-cascade.md`

### Test Design

- **Test ID**: REGTEST-40
- **Type**: Integration
- **Location**: `test/atlas-cli.test.js`
- **Scenario**: GIVEN root edge `a/svc -> b/api` WHEN removing module `svc --part-of a` THEN no root edge references `a/svc`.
- **Oracle**: Round 6 code leaves the edge; fixed code removes it.

---

## 3. Tasks

1. Add test `REGTEST-40: remove module cascades root edges`.
2. Create features/modules `a/svc` and `b/api`.
3. Add relation `a/svc --data-flow-to b/api`.
4. Remove module `svc --part-of a`.
5. Load state and assert `state.edges` has no endpoint referencing `a/svc`.

---

## 4. Verification

1. Before FIX-05: `node --test test/atlas-cli.test.js --test-name-pattern "REGTEST-40"` fails.
2. After FIX-05: same command passes.

---

## 5. Scope & References

### Allowed Files

- `test/atlas-cli.test.js`

### Forbidden Files

- All source code files.

### Related Documents

- `docs/plans/2026-06-07/architecture-simplify/fix/FIX-05-remove-module-cascade.md`
