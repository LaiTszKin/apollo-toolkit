# Fix Worker Prompt: FIX-04-remove-shameful-hoist

- **Related issue**: P2-001

---

## 1. Mission & Rules

### Mission

Remove project-wide `shamefully-hoist` configuration so pnpm strict dependency isolation remains meaningful.

### Context

The review found `shamefullyHoist: true` in `pnpm-workspace.yaml` and `shamefully-hoist=true` in `.npmrc`. This conflicts with the pnpm migration goal of strict dependency resolution and affects pnpm-migration Req 2.

### Rules

- Only modify files listed as Allowed in Section 5.
- Do not add alternative hoisting settings unless a verification command proves strict install cannot work without them.
- If removing hoisting causes install/build/test failure due to undeclared dependencies, report the exact missing dependency to the coordinator instead of re-enabling broad hoisting.
- Workers are leaf nodes; do not spawn sub-workers.

---

## 2. Context

### Input Files

- `pnpm-workspace.yaml` — workspace package patterns and incorrect `shamefullyHoist` entry.
- `.npmrc` — pnpm-specific hoist setting.
- `package.json` and package manifests — dependency declarations to validate under strict pnpm.
- `docs/plans/2026-06-17/quality-gate-upgrade/REPORT.md` — P2-001 issue details.

### Root Cause

The migration introduced broad hoisting configuration, which can hide phantom dependencies and undermines the strict dependency behavior that justified the migration.

---

## 3. Tasks

### `pnpm-workspace.yaml` — remove unsupported broad hoisting

1. Open `pnpm-workspace.yaml`.
2. Delete line 4:
   ```yaml
   shamefullyHoist: true
   ```
3. Leave only:
   ```yaml
   packages:
     - 'packages/*'
     - 'packages/tools/*'
   ```

### `.npmrc` — remove pnpm hoist setting

1. Open `.npmrc`.
2. Delete:
   ```ini
   shamefully-hoist=true
   ```
3. If the file becomes empty, remove `.npmrc`.

### Output

When done, report back to the coordinator:

- **Files modified**: `pnpm-workspace.yaml`, optionally `.npmrc` deletion
- **Change summary**: removed broad hoisting
- **Test results**: command outcomes from Section 4
- **Risks or concerns**: include exact missing dependency failures if any

---

## 4. Verification

1. Run: `npx --yes pnpm@11.6.0 install --frozen-lockfile`
   - Expected: install succeeds without missing dependency warnings or errors.
2. Run: `npx --yes pnpm@11.6.0 build`
   - Expected: TypeScript build succeeds.
3. Run after all other fixes: `npx --yes pnpm@11.6.0 test`
   - Expected: full test suite passes.

---

## 5. Scope & References

### Allowed Files

- `pnpm-workspace.yaml` — remove `shamefullyHoist`.
- `.npmrc` — remove or delete broad hoist setting.

### Forbidden Files

- Package manifests — do not add dependencies unless the coordinator authorizes a follow-up from a proven install/build failure.
- Source files and tests — not needed for this config issue.

### Related Documents

- `docs/plans/2026-06-17/quality-gate-upgrade/REPORT.md`
- `docs/plans/2026-06-17/quality-gate-upgrade/pnpm-migration/SPEC.md`
