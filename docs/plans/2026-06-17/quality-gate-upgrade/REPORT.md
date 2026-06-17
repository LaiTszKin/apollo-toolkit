# Review Report

- **Spec**: Quality Gate Upgrade
- **Date**: 2026-06-17
- **Reviewer**: Codex
- **Verdict**: Needs Work

---

## Verdict

Needs Work

---

## Requirement Status Summary

| Requirement                | Status   | Evidence Location                                                               | Open Findings |
| -------------------------- | -------- | ------------------------------------------------------------------------------- | ------------- |
| pnpm-migration Req 1       | Complete | `pnpm-workspace.yaml:1`, `pnpm-lock.yaml`, removed `package-lock.json`          | 0             |
| pnpm-migration Req 2       | Partial  | `.npmrc:1`, `pnpm-workspace.yaml:4`, package manifests                          | P2-001        |
| pnpm-migration Req 3       | Partial  | `package.json:23`, `scripts/rewrite-imports.mjs`, local `pnpm build` run        | P1-002        |
| pnpm-migration Req 4       | Partial  | `.github/workflows/test.yml:15`, `.github/workflows/publish-npm.yml:20`         | P1-003        |
| quality-gate-setup Req 1   | Complete | `tsconfig.json:10`, package-level `tsconfig.json` files, local `pnpm build` run | 0             |
| quality-gate-setup Req 2   | Missing  | `eslint.config.mjs:10`, `package.json:30`, local `pnpm lint` run                | P0-001        |
| quality-gate-setup Req 3   | Complete | `.prettierrc:1`, `package.json:32`, local `pnpm format:check` run               | 0             |
| quality-gate-setup Req 4   | Partial  | `.husky/pre-commit:1`, `.lintstagedrc.json:1`                                   | P2-002        |
| quality-gate-setup Req 5   | Missing  | `.github/workflows/publish-npm.yml:31`                                          | P1-003        |
| codebase-refactoring Req 1 | Partial  | `package.json:31`, `package.json:32`, local gate runs                           | P0-001        |
| codebase-refactoring Req 2 | Missing  | `packages/tools/eval/scorer.ts:196`, local `pnpm lint` run                      | P0-001        |
| codebase-refactoring Req 3 | Missing  | `packages/tools/codegraph/lib/cg-instance.test.ts:27`, local `pnpm test` run    | P1-002        |

---

## Findings

### P0 — Requirement Blocked

| #      | Description                                                                                                                                                     | Impact                                                                                                                                          | File                            | Line       | Dimension                    | Requirement                                          |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ---------- | ---------------------------- | ---------------------------------------------------- |
| P0-001 | The committed quality gate does not reach zero lint errors. `pnpm lint` reports two `@typescript-eslint/no-unnecessary-condition` errors in `buildJudgePrompt`. | The ESLint strict-type-checked gate is installed but not passing, so quality-gate-setup Req 2 and codebase-refactoring Req 2 are not satisfied. | `packages/tools/eval/scorer.ts` | L196, L200 | Spec implementation omission | quality-gate-setup Req 2; codebase-refactoring Req 2 |

### P1 — Requirement Defect

| #      | Description                                                                                                                                                        | Impact                                                                                                                                                                       | File                                               | Line    | Dimension                     | Requirement                                      |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ------- | ----------------------------- | ------------------------------------------------ |
| P1-002 | The full test suite does not pass under pnpm. `pnpm test` fails in the package test group at `createOrOpenIndex should throw when project is already initialized`. | The refactoring requirement requires `pnpm test` to pass after the migration; one package test currently fails.                                                              | `packages/tools/codegraph/lib/cg-instance.test.ts` | L27     | Spec implementation deviation | pnpm-migration Req 3; codebase-refactoring Req 3 |
| P1-003 | The publish workflow does not include the required lint and format-check steps. It installs, builds, tests, then publishes.                                        | quality-gate-setup Req 5 explicitly requires the same lint and format checks in `.github/workflows/publish-npm.yml`; publish-time violations can pass through this workflow. | `.github/workflows/publish-npm.yml`                | L31-L41 | Spec implementation omission  | quality-gate-setup Req 5; pnpm-migration Req 4   |

### P2 — Requirement Risk

| #      | Description                                                                                                                                                | Impact                                                                                                                                                                                                                              | File                            | Line   | Dimension           | Requirement              |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ------ | ------------------- | ------------------------ |
| P2-001 | pnpm is configured with `shamefully-hoist` in both workspace config and `.npmrc`.                                                                          | The migration goal calls out strict dependency resolution as a primary benefit; project-wide hoisting can mask undeclared dependency access and reduces confidence that pnpm compatibility has been proven under strict resolution. | `pnpm-workspace.yaml`; `.npmrc` | L4; L1 | Architecture defect | pnpm-migration Req 2     |
| P2-002 | The lint-staged config formats Markdown files, although the requirement scopes staged formatting to `*.ts`, `*.mjs`, `*.js`, `*.json`, and `*.yaml` files. | This adds hook behavior outside the specified staged-file contract and can cause unrelated documentation changes during commits.                                                                                                    | `.lintstagedrc.json`            | L5     | Hallucinated code   | quality-gate-setup Req 4 |

---

## Review History

None.

---

## References

- **Project context files**: `CLAUDE.md`, `AGENTS.md`, `resources/project-architecture/**`
- **Related documents**: `docs/plans/2026-06-17/quality-gate-upgrade/pnpm-migration/SPEC.md`, `docs/plans/2026-06-17/quality-gate-upgrade/quality-gate-setup/SPEC.md`, `docs/plans/2026-06-17/quality-gate-upgrade/codebase-refactoring/SPEC.md`, `docs/plans/2026-06-17/quality-gate-upgrade/DESIGN.md`, `docs/plans/2026-06-17/quality-gate-upgrade/CHECKLIST.md`
