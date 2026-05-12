---
name: version-release
description: >-
  End-to-end semver delivery: prerequisites mirror **`commit-and-push`** gates (**`submission-readiness-check`**, reviews, changelog hygiene, optional `archive-specs`), derive next version/tag from tracked files plus explicit user semver words, relocate `CHANGELOG.md` Unreleased into dated release bump package/project metadata evenly commit tag push **`gh release create`** honoring prerelease/retarget rules verify remote refs **NEVER STOP at tag omitting GitHub release unless user waived publication**.
  Keywords patch minor major release tag GH publish semver… misroute plain “push” absent release vocabulary **use commit-and-push**… BAD guessing version… GOOD inspect package.json+Cargo.toml… retarget prerelease relocate tag `--force-with-lease`… Unreleased emptiness ⇒ halt curated notes…
---

# Version Release

## Dependencies

- Required: **`commit-and-push`** (shared inspect/classify/readiness/commit/push mechanics); **`submission-readiness-check`** **before** version files, tags, or publication mutate.
- Conditional: **`archive-specs`** when specs/docs need alignment; **`review-change-set`** on **code-affecting** release scope **before** version churn—blocking while findings open.
- Optional: none.
- Fallback: Missing required skill ⇒ stop and report.

## Non-negotiables

- **ONLY** enter this workflow when release intent is **explicit** (semver bump wording, tag/release request, CI “publish release”—not a bare “push”). Else **`commit-and-push`** only.
- **MUST NOT** guess versions—read workspace version files + user-stated bump; state **current → next** + exact **tag string** before editing.
- **MUST NOT** publish if root **`CHANGELOG.md` `Unreleased`** is empty/has nothing to ship—stop or curate notes first.
- **MUST** align all version-bearing files consistently; formatting-only deltas elsewhere.
- **Tag format** (`v1.2.3` vs `1.2.3`) inferred from repo history—not invented per release ad hoc unless user dictates.
- **GitHub Release**: prefer `gh release create` / repo tooling; **MUST NOT** substitute “opened PR URL” as release completion. Draft vs prerelease vs **latest** follows **explicit** user/repo convention—not tag shape alone.
- **Prerelease retarget**: same version, **move** tag/release to new SHA when user asks; use force-with-lease **for tag only** as needed; if API rejects SHA for `target_commitish`, use branch identifier per GitHub rules.
- **MUST** verify **remote** has commit + tag before calling release **done**; **MUST NOT** trust UI git shortcuts.
- **Done** = version files + changelog section + **pushed** commit + **remote** tag + **published** GitHub release (unless user explicitly skips publication—then say so).

**Repository regression checks:** Before creating release metadata, inspect existing local and remote tags plus any existing GitHub Release for the target version so duplicates are caught early. Do not continue until you can state the current version, the intended next version, and the exact tag name that will be created. **`review-change-set` is required for code-affecting releases**—run `review-change-set` for the same release scope before continuing; treat unresolved review findings as blocking. Any conditional gate whose trigger is confirmed by this classification becomes mandatory before version bumping, tagging, or release publication. Treat every scenario-matched gate as blocking before versioning or release publication. Never stop after the release commit or tag alone; creating the matching GitHub release is part of done criteria unless the user explicitly says to skip release publication.

## Standards (summary)

- **Evidence**: Version files, tags local/remote, `Unreleased`, existing GH releases.
- **Execution**: Intent → gates (`commit-and-push` pattern) → semver → files → changelog move → commit/tag → push → GH release.
- **Quality**: No duplicate releases; notes from curated changelog, not raw diff guesswork.
- **Output**: Announced version, tag URL, release URL, automation status if any.

## References

- `references/semantic-versioning.md`
- `references/commit-messages.md`
- `references/branch-naming.md`
- `references/changelog-writing.md`
- `references/readme-writing.md`

## Workflow

**Chain-of-thought:** Reuse **`commit-and-push`** for git inspection, classification, conditional reviews, **`submission-readiness-check`**, commit discipline, push verification—**do not duplicate** those rules here; **`Pause →`** applies to release-only decisions.

### 1) Inspect git state

- Follow **`commit-and-push`** step 1 (status/diff/clean semantics).

### 2) Confirm release intent

- Explicit semver/release language—or stop and use **`commit-and-push`**.
   - **Pause →** Did the user only ask “commit”? If yes, **exit** this skill.

### 3) Gates before version churn

- Classify scope; code-affecting ⇒ `review-change-set`; **`submission-readiness-check`** (+ **`archive-specs`** when indicated). All blocking items closed.
   - **Pause →** Am I versioning while `Unreleased`/readiness still wrong?

### 4) Decide version & tag

- Read files; inspect local/remote tags + existing GH release for collision; prerelease vs stable per user/doc; retarget flow leaves version unchanged.
   - **Pause →** If tag+release already correct on intended SHA—report satisfied, duplicate nothing.

### 5) Bump files

- Every locator of version bumped consistently.

### 6) Release docs

- Move **`Unreleased`** → new dated heading; reset `Unreleased` scaffold; **`README`** / **`AGENTS.md`**/`CLAUDE.md` only if behavior/agent workflow changed materially.

### 7) Commit & tag

- Message e.g. `chore(release): publish X.Y.Z` per repo habit; tag after commit; retarget ⇒ move existing tag deliberately with hash discipline.

### 8) Push

- Push branch **and** tag; verify remote refs; retarget ⇒ `--force-with-lease` for tag only where appropriate, then verify.

### 9) Publish GitHub Release

- Create/update matching release body from changelog section; prerelease flag per explicit instruction; confirm non-draft unless automation needs draft—but user asked “publish” ⇒ actually publish.
   - **Pause →** Can I paste **release URL** + prove tag points at **`HEAD`**?

## Sample hints

- **`Unreleased` empty** ⇒ cannot ship “2.5.0” with honest notes—curate first.
- **Duplicate**: Tag `v2.5.0` exists on GH → **inspect SHA** before re-creating.
- **Retarget**: User “move prerelease to latest fix”—**no** semver bump; rewrite tag carefully.
