# Regression Test Worker Prompt: REGTEST-01-eval-scorer-lint

- **Related fix**: FIX-01 — eval scorer strict lint cleanup

---

## 1. Mission & Rules

### Mission

Add a focused regression test proving `buildJudgePrompt` still handles missing trace events after the lint cleanup.

### Context

FIX-01 removes unnecessary optional chains in `packages/tools/eval/scorer.ts`. The behavior risk is that missing `thinking` or `response` events could stop using fallback strings.

### Rules

- Only create or modify test files.
- The test must fail if the source code loses fallback behavior for missing events.
- Follow existing `node:test` and `assert/strict` style.
- Do not modify source code.
- Workers are leaf nodes; do not spawn sub-workers.

---

## 2. Context

### Input Files

- `packages/tools/eval/scorer.ts` — fixed code to understand expected fallback behavior.
- `packages/tools/eval/test/scorer.test.js` — existing scorer test file and import style.
- `docs/plans/2026-06-17/quality-gate-upgrade/fix/FIX-01-eval-scorer-lint.md` — fix context.

### Test Design

- **Test ID**: REGTEST-01
- **Type**: Unit
- **Location**: `packages/tools/eval/test/scorer.test.js`
- **Scenario**: GIVEN a trace with only an `end` event WHEN `buildJudgePrompt` runs THEN the prompt includes the user fallback `(未記錄)` and response fallback `(無回應)`.
- **Oracle**: This fails if the optional-chain cleanup turns a missing event into a throw or drops the fallback text.

---

## 3. Tasks

1. Open `packages/tools/eval/test/scorer.test.js`.
2. Add a new `describe` block near the other `buildJudgePrompt` tests, or create one if none exists.
3. Add a test named `REGTEST-01: buildJudgePrompt uses fallback text when thinking and response events are absent`.
4. Build a minimal scoring criteria object matching the structure produced by `makeQuestions`.
5. Call `buildJudgePrompt([{ type: 'end', timestamp: '2024-01-01T00:00:00.000Z', data: { duration_ms: 1, status: 'completed' } }], criteria, 'Q001')`.
6. Assert the returned prompt includes `(未記錄)` and `(無回應)`.

### Output

When done, report back to the coordinator:

- **Test file**: `packages/tools/eval/test/scorer.test.js`
- **Test name**: `REGTEST-01: buildJudgePrompt uses fallback text when thinking and response events are absent`
- **Oracle confirmed**: whether it fails before a behavior-breaking change and passes after FIX-01
- **Risks or concerns**: or `None`

---

## 4. Verification

1. Run: `npx --yes pnpm@11.6.0 build`
   - Expected: build succeeds so `../dist/scorer.js` exists for package tests.
2. Run: `node --test packages/tools/eval/test/scorer.test.js`
   - Expected: scorer tests pass.
3. Run: `npx --yes pnpm@11.6.0 lint`
   - Expected: zero lint errors.

---

## 5. Scope & References

### Allowed Files

- `packages/tools/eval/test/scorer.test.js` — add the regression test here.

### Forbidden Files

- All source code files — test worker must not modify source.

### Related Documents

- `docs/plans/2026-06-17/quality-gate-upgrade/fix/FIX-01-eval-scorer-lint.md`
- `docs/plans/2026-06-17/quality-gate-upgrade/codebase-refactoring/SPEC.md`
