---
name: commit-and-push
description: >-
  Commit and push only (no semver): inspect staged vs unstaged, classify scopes, run the mandated `review-change-set` for code-affecting scope, then **`submission-readiness-check`** BEFORE the final commit honoring `CHANGELOG.md` Unreleased + `archive-specs` redirections, preserve intentional staging splits, forbid UI git stubs, VERIFY remote hashes post-push. **`version-release` elsewhere**.
  Use for “please commit”, “submit”, “push branch” lacking explicit semver/tag language **STOP** tagging here… BAD skip readiness red… GOOD staged subset untouched unrelated dirty files changelog mirrors diff… hashes `git rev-parse HEAD` versus upstream… archive specs before commit flagged…
---

# Commit and Push

## Dependencies

- Required: **`submission-readiness-check`** immediately before the **final** commit.
- Conditional: **`archive-specs`** when readiness (or completed specs) requires doc conversion or categorized `docs/` alignment; **`review-change-set`** for every **code-affecting** scope.
- Optional: none.
- Fallback: Any **required** dependency unavailable ⇒ **MUST** stop and report—**MUST NOT** “light” commit.

## Non-negotiables

- **MUST** use real `git` mutations (`git add`, `git commit`, `git push`, `git stash`, etc.); **MUST NOT** treat UI tokens (`::git-commit`, IDE buttons) as proof of history.
- **MUST** run **`submission-readiness-check`** before final commit; unresolved readiness (e.g. stale/missing `CHANGELOG.md` **Unreleased**, doc drift) **blocks** commit.
- Code-affecting: **`review-change-set` MANDATORY**; unresolved confirmed findings **block**.
- **`archive-specs`**: when readiness says convert/archive or `docs/` mismatch—**MUST** run **before** final commit, not as a vague follow-up.
- **MUST** reconcile **staged vs unstaged** with user intent—**MUST NOT** broaden scope by auto-staging unrelated files when user staged a subset.
- **`CHANGELOG.md` `Unreleased`**: for code-affecting or user-visible docs, **MUST** reflect this change before commit; reopen diff after edits to match commit scope.
- **MUST** resolve **target branch** per user (or current if explicit) before rewriting history; protect unrelated dirty work (`stash` etc.); **no** force-push unless user explicitly requests.
- After **push**, **MUST** verify remote tip matches local `HEAD` (`git rev-parse` / `@{u}` / `ls-remote`) before claiming success.
- **MUST NOT** run version bump, tag, or GitHub release (**use `version-release`**).
- Clean worktree requests: **MUST** inspect `HEAD`, upstream, last commit—**MUST NOT** fabricate “pushed” when already satisfied or impossible.

**Repository regression checks (verbatim requirements):** Treat root `CHANGELOG.md` `Unreleased` coverage as mandatory for code-affecting or user-visible changes. Re-open the final `CHANGELOG.md` diff after readiness updates. **`review-change-set` is required for code-affecting changes**; Run `review-change-set` for every code-affecting change before continuing; treat unresolved review findings as blocking. Any conditional gate whose trigger is confirmed by this classification becomes mandatory before commit. Treat every scenario-matched gate as blocking before commit.

## Standards (summary)

- **Evidence**: `git status`/`diff`; classification drives gates; changelog diff matches commit.
- **Execution**: Inspect → classify → (deps) → readiness → commit → push verify.
- **Quality**: No gate bypass; sequential git ops; preserve intentional commit boundaries.
- **Output**: Conventional commit message + confirmed remote **when push ran** + note stash/scope if any.

## References

- `references/commit-messages.md`
- `references/branch-naming.md`

## Workflow

**Chain-of-thought:** **`Pause →`** guards skipping a gate or mis-sizing scope.

1. **Inspect** — `git status -sb`; `git diff --stat`; `git diff --cached --stat`; `git diff --cached --name-only`. If clean: `git log -1 --stat`, upstream tracking, whether work already pushed.
   - **Pause →** Is the user’s intended commit **exactly** the staged set, or full worktree—I must not mix them silently?

2. **Classify** — Tag mentally: `code-affecting` | `docs-only` | `repo-specs-present` | `repo-specs-ready-for-conversion` | `project-doc-structure-mismatch` (per `archive-specs` needs). Active specs with unfinished same-change work stay active.
   - **Pause →** Which conditional skills just became **mandatory**—did I list them explicitly?

3. **Branch target** — Honor user branch; if switch needed, protect unrelated changes; cherry-pick/replay off wrong branch safely; worktree cases: identify authoritative target **before** replay.
   - **Pause →** Am I about to merge noise because diff > issue scope—should I stop and narrow first?

4. **Code-affecting gates** — `review-change-set` always; fix or document blockers; re-test material logic.

5. **Readiness** — Run **`submission-readiness-check`**; if it routes to **`archive-specs`**, run that **now**; fix `Unreleased` bullets; recheck changelog vs staged intent.
   - **Pause →** Could I commit while readiness still red—**why not**?

6. **Commit** — Respect staging; separate commits if user asked; Conventional message per `references/commit-messages.md`.

7. **Push** — **Only** when the user requested remote update (`push`, `publish`, PR branch sync, explicit upstream publish, or equivalent). If the user asked **only** for a **local** commit with **no** remote publish in this thread, finish after step 6, state local `HEAD`, and **do not** push.
   - **Pause →** Did the user **explicitly** ask to update a remote, or only to record commits locally?
   - **Pause →** What two hashes prove remote == local when push **did** run?

## Sample hints

- **Scope**: Staged `foo.ts` only; unstaged `bar.ts` unrelated → commit **must not** pick up `bar.ts` without user scope change.
- **Changelog**: Code change with no `Unreleased` bullet → **blocking** until added.
- **Push proof**: “Pushed” means e.g. local `abc123` equals `origin/feature` `abc123`, not “command sent.”
