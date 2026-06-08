# Regression Test Worker Prompt: REGTEST-42-docs-hide-fine-grained

- **Related fix**: FIX-06 — hide fine-grained docs

---

## 1. Mission & Rules

### Mission

Add a docs regression guard so active agent docs do not teach hidden architecture commands.

### Context

Round 6 docs still contain examples such as `apltk architecture function add`.

### Rules

- Only modify test files.
- The test must fail on Round 6 docs and pass after FIX-06.

---

## 2. Context

### Input Files

- `test/architecture-script.test.js` — preferred location.
- `skills/design/references/architecture.md` — scanned doc.
- `skills/update-project-html/SKILL.md` — scanned doc.
- `docs/plans/2026-06-07/architecture-simplify/fix/FIX-06-hide-fine-grained-help-docs.md`

### Test Design

- **Test ID**: REGTEST-42
- **Type**: Unit / docs scan
- **Location**: `test/architecture-script.test.js`
- **Scenario**: GIVEN active docs WHEN scanning for hidden command examples THEN no hidden `feature|submodule|function|variable|dataflow|error|edge|meta|actor` command examples are present.
- **Oracle**: Round 6 docs match forbidden pattern; fixed docs do not.

---

## 3. Tasks

1. Add test `REGTEST-42: active docs do not expose fine-grained architecture verbs`.
2. Read the two docs.
3. Assert they do not match:
   - `apltk architecture (feature|submodule|function|variable|dataflow|error|edge|meta|actor) (add|set|remove|reorder)`
4. Allow public commands like `apltk architecture add` and `apltk architecture remove`.

---

## 4. Verification

1. Before FIX-06: `node --test test/architecture-script.test.js --test-name-pattern "REGTEST-42"` fails.
2. After FIX-06: same command passes.

---

## 5. Scope & References

### Allowed Files

- `test/architecture-script.test.js`

### Forbidden Files

- All source and docs files.

### Related Documents

- `docs/plans/2026-06-07/architecture-simplify/fix/FIX-06-hide-fine-grained-help-docs.md`
