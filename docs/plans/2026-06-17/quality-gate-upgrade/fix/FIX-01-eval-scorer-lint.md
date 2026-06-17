# Fix Worker Prompt: FIX-01-eval-scorer-lint

- **Related issue**: P0-001

---

## 1. Mission & Rules

### Mission

Remove the remaining strict ESLint errors in `buildJudgePrompt` without changing judge prompt behavior.

### Context

The review found that `pnpm lint` fails with two `@typescript-eslint/no-unnecessary-condition` errors at `packages/tools/eval/scorer.ts:196` and `packages/tools/eval/scorer.ts:200`. This blocks quality-gate-setup Req 2 and codebase-refactoring Req 2.

### Rules

- Only modify files listed as Allowed in Section 5.
- Preserve existing prompt output semantics for missing `thinking`, `response`, and `end` events.
- Do not add eslint disable comments.
- Do not add dependencies.
- Workers are leaf nodes; do not spawn sub-workers.

---

## 2. Context

### Input Files

- `packages/tools/eval/scorer.ts` — `buildJudgePrompt` implementation and the lint failure lines.
- `packages/tools/eval/test/scorer.test.js` — existing scorer test style and build-output import pattern.
- `docs/plans/2026-06-17/quality-gate-upgrade/REPORT.md` — P0-001 issue details.

### Root Cause

`TraceEvent.data` is a required object, so optional chaining on `thinkingEvent?.data?.[...]` and `responseEvent?.data?.[...]` is unnecessary after the first optional hop. ESLint flags the extra `?.` while the code still needs to handle missing events.

---

## 3. Tasks

### `packages/tools/eval/scorer.ts` — simplify optional chains

1. Open `packages/tools/eval/scorer.ts`.
2. Locate `buildJudgePrompt`, lines 195-204.
3. Modify only the data access expressions:
   - Current user prompt access:
     ```ts
     thinkingEvent?.data?.['userPrompt'];
     ```
   - Replace with:
     ```ts
     thinkingEvent?.data['userPrompt'];
     ```
   - Current assistant response access:
     ```ts
     (
       responseEvent?.data?.['message'] as Record<string, unknown> | undefined
     )?.['content'];
     ```
   - Replace with an equivalent expression that has only the event-level optional chain:
     ```ts
     (responseEvent?.data['message'] as Record<string, unknown> | undefined)?.[
       'content'
     ];
     ```
4. Do not rewrite surrounding scoring or prompt-building logic.

### Output

When done, report back to the coordinator:

- **Files modified**: `packages/tools/eval/scorer.ts`
- **Change summary**: strict lint cleanup in `buildJudgePrompt`
- **Test results**: command outcomes from Section 4
- **Risks or concerns**: or `None`

---

## 4. Verification

1. Run: `npx --yes pnpm@11.6.0 lint`
   - Expected: zero lint errors.
2. Run: `npx --yes pnpm@11.6.0 build`
   - Expected: build completes and `scripts/rewrite-imports.mjs` succeeds.

---

## 5. Scope & References

### Allowed Files

- `packages/tools/eval/scorer.ts` — source of the lint failure.

### Forbidden Files

- `packages/tools/eval/test/scorer.test.js` — owned by REGTEST-01.
- All workflow, pnpm, and lint-staged config files — owned by other fix workers.

### Related Documents

- `docs/plans/2026-06-17/quality-gate-upgrade/REPORT.md`
- `docs/plans/2026-06-17/quality-gate-upgrade/quality-gate-setup/SPEC.md`
- `docs/plans/2026-06-17/quality-gate-upgrade/codebase-refactoring/SPEC.md`
