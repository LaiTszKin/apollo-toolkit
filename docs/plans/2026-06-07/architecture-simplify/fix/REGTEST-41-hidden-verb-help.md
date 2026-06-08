# Regression Test Worker Prompt: REGTEST-41-hidden-verb-help

- **Related fix**: FIX-06 — hide fine-grained help

---

## 1. Mission & Rules

### Mission

Update/add regression coverage so action-level hidden verb help no longer exposes fine-grained syntax.

### Context

Round 6 code exposes `apltk architecture edge add --help` and similar pages.

### Rules

- Only modify test files.
- The test must fail on Round 6 code and pass after FIX-06.

---

## 2. Context

### Input Files

- `test/architecture-script.test.js` — update existing nested help test.
- `test/atlas-cli.test.js` — optional broader table-driven coverage.
- `docs/plans/2026-06-07/architecture-simplify/fix/FIX-06-hide-fine-grained-help-docs.md`

### Test Design

- **Test ID**: REGTEST-41
- **Type**: Unit
- **Location**: `test/architecture-script.test.js`
- **Scenario**: GIVEN hidden verb/action help requests WHEN dispatching them THEN output does not include hidden command syntax and does include public unified help.
- **Oracle**: Round 6 code includes `apltk architecture edge add`; fixed code does not.

---

## 3. Tasks

1. Replace or update the existing test named `atlas CLI returns action-specific help for nested verbs`.
2. Use at least `edge add --help`; prefer a table with `feature add`, `submodule add`, `edge add`, `meta set`, and `actor add`.
3. Assert:
   - exit code `0`,
   - stdout does not include `apltk architecture <hidden> <action>`,
   - stdout includes `apltk architecture add` or public architecture usage.

---

## 4. Verification

1. Before FIX-06: `node --test test/architecture-script.test.js --test-name-pattern "hidden|nested|help"` fails.
2. After FIX-06: same command passes.
3. Run full `node --test test/architecture-script.test.js`.

---

## 5. Scope & References

### Allowed Files

- `test/architecture-script.test.js`
- `test/atlas-cli.test.js` only if broader coverage is necessary.

### Forbidden Files

- All source code files.

### Related Documents

- `docs/plans/2026-06-07/architecture-simplify/fix/FIX-06-hide-fine-grained-help-docs.md`
