# Quality Gate Upgrade fix plan

- `docs/plans/2026-06-17/quality-gate-upgrade` — Context
- `docs/plans/2026-06-17/quality-gate-upgrade/CHECKLIST.md` — Verification checklist
- `docs/plans/2026-06-17/quality-gate-upgrade/REPORT.md` — Review report

## ROLE

You are the fix coordinator for the Quality Gate Upgrade review. Your mission is to resolve all five findings from `REPORT.md`: one P0 lint blocker, two P1 requirement defects, and two P2 requirement risks. You coordinate leaf workers, verify their outputs, and enforce the batch gates. You do not make unrelated refactors, weaken tests, or broaden the feature scope beyond the review findings.

## RULES

- Read `REPORT.md`, the three SPEC files, `DESIGN.md`, and `CHECKLIST.md` before dispatching workers.
- Dispatch workers using only the prompt files under `fix/`; workers must not infer hidden context.
- Respect file-overlap constraints. Workers that modify the same file must run sequentially.
- Fix workers run before their paired regression test workers.
- Regression workers may write tests only. If a regression worker needs source changes, stop and report the mismatch.
- Batch gates are mandatory. If any command in a gate fails, stop the next batch and inspect the failure before continuing.
- Do not use `git reset`, `git checkout --`, or destructive cleanup. Preserve user changes.
- Use pinned pnpm through `npx --yes pnpm@11.6.0 ...` if `pnpm` is not available directly.
- If removing `shamefully-hoist` exposes undeclared dependency failures, do not re-enable broad hoisting automatically; record the exact missing dependency and pause for coordinator judgment.

## WORKING STEPS

### 1. PREPARATION

Read these files first:

- `docs/plans/2026-06-17/quality-gate-upgrade/REPORT.md` — issue inventory and severity.
- `docs/plans/2026-06-17/quality-gate-upgrade/pnpm-migration/SPEC.md` — pnpm strict dependency and CI requirements.
- `docs/plans/2026-06-17/quality-gate-upgrade/quality-gate-setup/SPEC.md` — ESLint, Prettier, hooks, and CI gate requirements.
- `docs/plans/2026-06-17/quality-gate-upgrade/codebase-refactoring/SPEC.md` — zero lint/type/test regression requirement.
- `docs/plans/2026-06-17/quality-gate-upgrade/DESIGN.md` — intended architecture and toolchain choices.
- `docs/plans/2026-06-17/quality-gate-upgrade/CHECKLIST.md` — final verification gates.
- `packages/tools/eval/scorer.ts` — P0 lint source.
- `packages/tools/codegraph/lib/cg-instance.ts` and `packages/tools/codegraph/lib/cg-instance.test.ts` — P1 test failure source.
- `.github/workflows/publish-npm.yml` — P1 missing publish gates.
- `pnpm-workspace.yaml`, `.npmrc`, `.lintstagedrc.json` — P2 config findings.
- All worker prompts in `docs/plans/2026-06-17/quality-gate-upgrade/fix/`.

### 2. COORDINATION

Batch 1: independent source/config fixes. Run these workers in parallel because their allowed file sets do not overlap:

- `fix/FIX-01-eval-scorer-lint.md`
- `fix/FIX-02-codegraph-async-rejection.md`
- `fix/FIX-03-publish-workflow-gates.md`
- `fix/FIX-04-remove-shameful-hoist.md`
- `fix/FIX-05-lint-staged-scope.md`

Batch 1 gate:

- `npx --yes pnpm@11.6.0 install --frozen-lockfile`
- `npx --yes pnpm@11.6.0 build`
- `npx --yes pnpm@11.6.0 lint`
- `npx --yes pnpm@11.6.0 format:check`
- `node --test packages/tools/codegraph/dist/lib/cg-instance.test.js`

Batch 2: regression/config tests. Run in this order because three prompts share `test/quality-gate-workflows.test.js`:

1. `fix/REGTEST-01-eval-scorer-lint.md`
2. `fix/REGTEST-02-codegraph-async-rejection.md`
3. `fix/REGTEST-03-publish-workflow-gates.md`
4. `fix/REGTEST-04-remove-shameful-hoist.md`
5. `fix/REGTEST-05-lint-staged-scope.md`

Batch 2 gate:

- `npx --yes pnpm@11.6.0 build`
- `node --test packages/tools/eval/test/scorer.test.js`
- `node --test packages/tools/codegraph/dist/lib/cg-instance.test.js`
- `node --test test/quality-gate-workflows.test.js`
- `npx --yes pnpm@11.6.0 lint`

Batch 3: final integration check. Run after all fixes and regression tests are in place:

- `npx --yes pnpm@11.6.0 test`
- `npx --yes pnpm@11.6.0 format:check`

### 3. FINAL VERIFICATION

Confirm every review finding is closed:

- P0-001: `npx --yes pnpm@11.6.0 lint` exits 0 and no `eslint-disable` comments were added for the scorer issue.
- P1-002: `npx --yes pnpm@11.6.0 test` exits 0 and the CodeGraph initialized-project test passes.
- P1-003: `.github/workflows/publish-npm.yml` contains `pnpm lint --cache` and `pnpm format:check` before `pnpm publish --access public`.
- P2-001: `pnpm-workspace.yaml` and `.npmrc` do not contain `shamefullyHoist` or `shamefully-hoist`; strict install/build/test still pass.
- P2-002: `.lintstagedrc.json` has only TS/JS, JSON, and YAML/YML staged patterns.

Run the checklist-derived gates:

- `npx --yes pnpm@11.6.0 install --frozen-lockfile`
- `npx --yes pnpm@11.6.0 build`
- `node dist/bin/apollo-toolkit.js --version`
- `npx --yes pnpm@11.6.0 lint`
- `npx --yes pnpm@11.6.0 format:check`
- `npx --yes pnpm@11.6.0 test`
- `grep -r "eslint-disable" --include="*.ts" --include="*.mjs" packages/ bin/ test/`

If all gates pass, report the files changed, tests run, and any residual CI-only verification that still requires GitHub Actions.
