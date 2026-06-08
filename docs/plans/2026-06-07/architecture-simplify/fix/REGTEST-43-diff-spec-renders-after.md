# Regression Test Worker Prompt: REGTEST-43-diff-spec-renders-after

- **Related fix**: FIX-07 — diff --spec renders after pages

---

## 1. Mission & Rules

### Mission

Add a regression test proving `diff --spec` references existing after-side HTML even when overlay was created with `--no-render`.

### Context

Round 6 code can produce a viewer whose after path points to a missing file.

### Rules

- Only modify `test/atlas-cli.test.js`.
- The test must fail on Round 6 code and pass after FIX-07.

---

## 2. Context

### Input Files

- `test/atlas-cli.test.js`
- `docs/plans/2026-06-07/architecture-simplify/fix/FIX-07-diff-spec-render.md`

### Test Design

- **Test ID**: REGTEST-43
- **Type**: Integration
- **Location**: `test/atlas-cli.test.js`
- **Scenario**: GIVEN `add --spec --no-render` created overlay state WHEN running `diff --spec` THEN every non-null after path embedded in the viewer exists on disk.
- **Oracle**: Round 6 code references missing after HTML; fixed code renders it.

---

## 3. Tasks

1. Add test `REGTEST-43: diff spec renders missing after pages`.
2. Create base feature with `--no-render`.
3. Create existing spec dir.
4. Run `add feature new-feature --spec <dir> --no-render`.
5. Run `diff --spec <dir> --out <out> --no-open`.
6. Parse or inspect the viewer HTML for after paths, or use known expected paths such as `<spec>/architecture_diff/features/new-feature/index.html`.
7. Assert each expected after file exists.

---

## 4. Verification

1. Before FIX-07: `node --test test/atlas-cli.test.js --test-name-pattern "REGTEST-43"` fails.
2. After FIX-07: same command passes.
3. Run: `node --test test/atlas-cli.test.js --test-name-pattern "diff --spec|REGTEST-43"`.

---

## 5. Scope & References

### Allowed Files

- `test/atlas-cli.test.js`

### Forbidden Files

- All source code files.

### Related Documents

- `docs/plans/2026-06-07/architecture-simplify/fix/FIX-07-diff-spec-render.md`
