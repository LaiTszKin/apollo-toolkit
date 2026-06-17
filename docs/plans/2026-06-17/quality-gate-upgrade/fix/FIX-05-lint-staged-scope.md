# Fix Worker Prompt: FIX-05-lint-staged-scope

- **Related issue**: P2-002

---

## 1. Mission & Rules

### Mission

Align lint-staged file patterns with the staged-file scope specified in quality-gate-setup Req 4.

### Context

The review found `.lintstagedrc.json` includes `"*.md": ["prettier --write"]`, but the spec only requires staged `*.ts`, `*.mjs`, `*.js`, `*.json`, and `*.yaml` files. This is hallucinated hook behavior outside the requested scope.

### Rules

- Only modify files listed as Allowed in Section 5.
- Keep ESLint + Prettier for staged TypeScript/JavaScript files.
- Keep Prettier for staged JSON and YAML/YML files.
- Do not add new lint-staged tools or dependencies.
- Workers are leaf nodes; do not spawn sub-workers.

---

## 2. Context

### Input Files

- `.lintstagedrc.json` — lint-staged config with out-of-scope Markdown pattern.
- `docs/plans/2026-06-17/quality-gate-upgrade/quality-gate-setup/SPEC.md` — Req 4 staged-file scope.
- `docs/plans/2026-06-17/quality-gate-upgrade/REPORT.md` — P2-002 issue details.

### Root Cause

The lint-staged config added Markdown formatting beyond the files named in the requirement, creating extra commit-time side effects.

---

## 3. Tasks

### `.lintstagedrc.json` — remove Markdown hook

1. Open `.lintstagedrc.json`.
2. Delete the Markdown entry:
   ```json
   "*.md": ["prettier --write"]
   ```
3. Ensure the remaining JSON stays valid:
   ```json
   {
     "*.{ts,mjs,js,cjs}": ["eslint --fix", "prettier --write"],
     "*.json": ["prettier --write"],
     "*.{yaml,yml}": ["prettier --write"]
   }
   ```
4. Do not change the command order for TypeScript/JavaScript files.

### Output

When done, report back to the coordinator:

- **Files modified**: `.lintstagedrc.json`
- **Change summary**: removed Markdown staged formatting
- **Test results**: command outcomes from Section 4
- **Risks or concerns**: or `None`

---

## 4. Verification

1. Run: `node -e "JSON.parse(require('node:fs').readFileSync('.lintstagedrc.json','utf8')); console.log('valid')"`
   - Expected: prints `valid`.
2. Run: `npx --yes pnpm@11.6.0 format:check`
   - Expected: Prettier reports all matched files use Prettier style.

---

## 5. Scope & References

### Allowed Files

- `.lintstagedrc.json` — remove out-of-scope Markdown pattern.

### Forbidden Files

- `.husky/pre-commit` — hook command is in scope and not part of this finding.
- `package.json` — scripts and dependencies are not part of this finding.

### Related Documents

- `docs/plans/2026-06-17/quality-gate-upgrade/REPORT.md`
- `docs/plans/2026-06-17/quality-gate-upgrade/quality-gate-setup/SPEC.md`
