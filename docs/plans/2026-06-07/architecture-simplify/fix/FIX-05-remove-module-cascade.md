# Fix Worker Prompt: FIX-05-remove-module-cascade

- **Related issue**: FIX-05 / REPORT P1-8

---

## 1. Mission & Rules

### Mission

Cascade `remove module` to root-level cross-feature edges that reference the removed module.

### Context

Requirement 3 requires removal of dependent child relations. Current module removal only drops local feature edges and leaves root `state.edges` dangling.

### Rules

- Modify only `cli.js`.
- Preserve existing feature removal cleanup.
- Preserve existing relation removal behavior.

---

## 2. Context

### Input Files

- `skills/init-project-html/lib/atlas/cli.js` — `removeSubmodule()` and `verbSubmodule('remove')`.
- `docs/plans/2026-06-07/architecture-simplify/REPORT.md` — P1-8.

### Root Cause

`removeSubmodule(feature, slug)` has access only to the feature object and filters `feature.edges`; it cannot remove root-level `state.edges` that reference `{ feature, submodule }`.

---

## 3. Tasks

### `skills/init-project-html/lib/atlas/cli.js` — remove root edges for deleted submodule

1. Open `cli.js`.
2. Locate `removeSubmodule(feature, slug)` near lines 336-345.
3. Either:
   - change its signature to accept `state` and `featureSlug`, or
   - perform root-edge filtering in the `verbSubmodule('remove')` mutation after `removeSubmodule()`.
4. Remove any root edge where `from` or `to` is an endpoint object with matching feature slug and submodule slug.
5. Keep string intra-feature endpoint behavior unchanged.

### Output

Report:
- Modified function signatures or call sites.
- Commands run.
- Any edge cases not covered.

---

## 4. Verification

1. Run: `node --test test/atlas-cli.test.js --test-name-pattern "submodule remove|remove module|remove relation"`
   - Expected: matching tests pass.
2. Manual probe:
   - Create `a/svc -> b/api` root edge.
   - Remove `svc --part-of a`.
   - Expected: no root edge references `a/svc`.

---

## 5. Scope & References

### Allowed Files

- `skills/init-project-html/lib/atlas/cli.js`

### Forbidden Files

- `test/atlas-cli.test.js` — regression-test workers own test edits.

### Related Documents

- `docs/plans/2026-06-07/architecture-simplify/SPEC.md`
- `docs/plans/2026-06-07/architecture-simplify/REPORT.md`
