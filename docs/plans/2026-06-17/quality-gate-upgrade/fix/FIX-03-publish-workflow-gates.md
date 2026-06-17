# Fix Worker Prompt: FIX-03-publish-workflow-gates

- **Related issue**: P1-003

---

## 1. Mission & Rules

### Mission

Add the required lint and format-check gates to the npm publish workflow before publishing.

### Context

The review found `.github/workflows/publish-npm.yml` installs, builds, tests, and publishes, but does not run `pnpm lint` or `pnpm format:check`. quality-gate-setup Req 5 requires these checks in the publish workflow.

### Rules

- Only modify files listed as Allowed in Section 5.
- Keep pnpm install/build/test/publish behavior intact.
- Place checks before the `Publish package` step.
- Do not change release triggers, permissions, registry settings, or package manager setup.
- Workers are leaf nodes; do not spawn sub-workers.

---

## 2. Context

### Input Files

- `.github/workflows/publish-npm.yml` — publish workflow missing lint and format steps.
- `.github/workflows/test.yml` — reference naming and command style for lint/format checks.
- `docs/plans/2026-06-17/quality-gate-upgrade/REPORT.md` — P1-003 issue details.

### Root Cause

The publish workflow was migrated to pnpm but did not receive the same quality-gate steps added to the main test workflow, leaving a path where publish can proceed without lint and formatting enforcement.

---

## 3. Tasks

### `.github/workflows/publish-npm.yml` — insert quality gates

1. Open `.github/workflows/publish-npm.yml`.
2. Locate lines 34-40:

   ```yaml
   - name: Build TypeScript
     run: pnpm run build

   - name: Run tests
     run: pnpm test

   - name: Publish package
     run: pnpm publish --access public
   ```

3. Insert these two steps after build and before tests or publish:

   ```yaml
   - name: Lint check
     run: pnpm lint --cache

   - name: Format check
     run: pnpm format:check
   ```

4. Preferred order: install, build, lint, format-check, test, publish. This keeps publish blocked by all quality gates.

### Output

When done, report back to the coordinator:

- **Files modified**: `.github/workflows/publish-npm.yml`
- **Change summary**: publish workflow now enforces lint and format checks
- **Test results**: command outcomes from Section 4
- **Risks or concerns**: or `None`

---

## 4. Verification

1. Run: `npx --yes pnpm@11.6.0 lint`
   - Expected: zero lint errors after FIX-01 is applied.
2. Run: `npx --yes pnpm@11.6.0 format:check`
   - Expected: Prettier reports all matched files use Prettier style.
3. Inspect `.github/workflows/publish-npm.yml`
   - Expected: `pnpm lint --cache` and `pnpm format:check` appear before `pnpm publish --access public`.

---

## 5. Scope & References

### Allowed Files

- `.github/workflows/publish-npm.yml` — add missing quality gates.

### Forbidden Files

- Other GitHub workflow files — they already include lint/format checks or are outside this issue.
- `package.json` — scripts already exist.

### Related Documents

- `docs/plans/2026-06-17/quality-gate-upgrade/REPORT.md`
- `docs/plans/2026-06-17/quality-gate-upgrade/quality-gate-setup/SPEC.md`
