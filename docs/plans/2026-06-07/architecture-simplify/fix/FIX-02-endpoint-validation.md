# Fix Worker Prompt: FIX-02-endpoint-validation

- **Related issue**: FIX-02 / REPORT P1-2 and P1-3

---

## 1. Mission & Rules

### Mission

Make unified `add` reject missing endpoint targets before writing edges.

### Context

REPORT Round 6 found that `--implements` and `--data-flow-to` validate only feature slugs, not submodules, and `--deployed-on` can write invalid endpoint targets.

### Rules

- Modify only the files in Section 5.
- Do not change the YAML shape beyond existing endpoint objects unless the coordinator approves.
- Preserve valid feature-only and feature/submodule endpoint behavior.
- Do not add dependencies.

---

## 2. Context

### Input Files

- `skills/init-project-html/lib/atlas/cli.js` — `parseEndpoint()`, `processAddEntity()`, relation target validation.
- `skills/init-project-html/lib/atlas/schema.js` — referential integrity expectations.
- `docs/plans/2026-06-07/architecture-simplify/REPORT.md` — P1-2 and P1-3.

### Root Cause

The current checks use `parseEndpoint(target).feature` and only verify that feature exists. If the endpoint includes a submodule, the submodule is not checked. `--deployed-on` is also parsed as a normal endpoint, so non-existent infrastructure names are written as invalid feature targets.

---

## 3. Tasks

### `skills/init-project-html/lib/atlas/cli.js` — add endpoint validation helper

1. Open `cli.js`.
2. Near `parseEndpoint()` lines 348-354, add a helper such as `assertEndpointExists(state, endpointValue, contextLabel)`.
3. The helper must:
   - Parse `feature` or `feature/submodule`.
   - Confirm the feature exists.
   - If a submodule is present, confirm it exists under that feature.
   - Throw a clear error naming the missing target and listing available features or submodules.

### `skills/init-project-html/lib/atlas/cli.js` — use helper for unified add targets

1. In module `--implements` validation near lines 797-803, replace feature-only validation with the helper.
2. In module `--data-flow-to` validation near lines 873-879, replace feature-only validation with the helper.
3. In relation target validation near lines 968-973, replace feature-only validation with the helper.
4. In module and relation `--deployed-on` paths, validate the target with the same helper before writing.
5. Ensure validation occurs before any edge write.

### Output

Report:
- Files modified.
- New helper name and behavior.
- Commands run.
- Any remaining ambiguity around deployment target modeling.

---

## 4. Verification

1. Run: `node --test test/atlas-cli.test.js --test-name-pattern "REGTEST-32|relation --implements|module --deployed-on"`
   - Expected: current and related tests pass after updating expectations through regression workers later.
2. Manual probe:
   - Existing feature `b`, no `b/svc`.
   - Run `add relation a/svc --implements b/svc`.
   - Expected: non-zero exit, no edge written.

---

## 5. Scope & References

### Allowed Files

- `skills/init-project-html/lib/atlas/cli.js`

### Forbidden Files

- `skills/init-project-html/lib/atlas/schema.js` — FIX-01 owns schema vocabulary.
- `test/atlas-cli.test.js` — regression-test workers own test edits.

### Related Documents

- `docs/plans/2026-06-07/architecture-simplify/SPEC.md`
- `docs/plans/2026-06-07/architecture-simplify/REPORT.md`
