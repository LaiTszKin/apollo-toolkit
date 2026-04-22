---
name: version-release
description: "Guide the agent to prepare and publish a versioned release (version bump, changelog, tag, GitHub release, and push). Use only when users explicitly request version/tag/release work, including direct semver wording such as patch/minor/major updates. Depend directly on `archive-specs` when completed plan sets should become durable docs or when project docs need alignment, and let that skill own the downstream documentation synchronization work."
---

# Version Release

## Dependencies

- Required: `submission-readiness-check` before version metadata edits, tagging, or release publication.
- Conditional: `archive-specs` when completed plan sets should be converted or repository docs need alignment; `review-change-set` is required for code-affecting releases before metadata edits and the final commit; `discover-edge-cases` and `harden-app-security` are important review gates that remain conditional, but become required whenever the reviewed scope or risk profile warrants them.
- Optional: none.
- Fallback: If a required release dependency is unavailable, stop and report the missing dependency.

## Standards

- Evidence: Inspect the active change set, current version files, existing tag format, existing remote tags/releases, and root `CHANGELOG.md` `Unreleased` content before touching version files, tags, or release metadata.
- Execution: Use this workflow only for explicit release intent, run the required quality gates when applicable, and treat every conditional gate whose scenario is met as blocking before versioning or publication; hand the repository to `submission-readiness-check` before versioning work, invoke `archive-specs` directly whenever completed plan sets should be converted or project docs need alignment, and if the worktree is already clean inspect the current version, local/remote tag state, and existing GitHub release state before deciding whether the request is already satisfied; when the user explicitly wants the same prerelease version to point at newer fixes, retarget the existing prerelease tag and GitHub release instead of inventing an extra version bump; when editing an existing GitHub prerelease during that retarget flow, use a GitHub-accepted release target such as the intended branch name if the tool or API rejects a raw commit SHA for `target_commitish`; otherwise cut the release directly from `CHANGELOG.md` `Unreleased`, update versions and docs, commit, tag, push, and publish the GitHub release with actual release tooling rather than PR-surrogate directives; run git mutations sequentially and verify both the branch tip and release tag exist remotely before publishing the GitHub release, and never treat UI git directives such as `::git-stage`, `::git-commit`, or `::git-push` as evidence that the release commit or tag already exists.
- Quality: Never guess versions, align user-facing docs with actual code, do not bypass readiness blockers from `submission-readiness-check`, do not reconstruct release notes from `git diff` when curated changelog content already exists, and do not report release success until the commit, tag, and GitHub release all exist for the same version.
- Output: Produce a versioned release commit and tag, publish a matching GitHub release, and keep changelog plus relevant repository documentation synchronized.

## Overview

Run a standardized release workflow for versioned delivery:

- resolve release scope
- align project code and standardized categorized project documentation
- bump version files
- cut the release from `CHANGELOG.md` `Unreleased` and update relevant docs
- commit, tag, push, and publish the GitHub release

## References

Load only when needed:

- `references/semantic-versioning.md`
- `references/commit-messages.md`
- `references/branch-naming.md`
- `references/changelog-writing.md`
- `references/readme-writing.md`

## Workflow

1. Inspect current changes
   - Run `git status -sb`, `git diff --stat`, and `git diff --cached --stat`.
   - Check staged files with `git diff --cached --name-only`.
   - Inventory repository planning artifacts and project docs, not only staged files, to detect repo specs and non-standard documentation layouts.
2. Confirm release intent
   - Use this skill only when the user explicitly requests version/tag/release work.
   - Treat explicit semver-delivery wording such as `patch update`, `minor update`, `major update`, `patch release`, `bump the version`, or requests to trigger release-published automation as release intent even when the user does not separately say `make a release`.
   - If no release intent is present, use `commit-and-push` instead.
3. Classify changes and run dependencies when required
   - `code-affecting`: runtime code, tests, build scripts, CI logic, or behavior-changing config.
   - `docs-only`: documentation/content updates only.
   - `repo-specs-present`: the repository contains live project planning artifacts such as `spec.md`, `tasks.md`, `checklist.md`, or plan directories; exclude reference examples, templates, and archived samples.
   - `repo-specs-ready-for-conversion`: the relevant `spec.md`, `tasks.md`, and `checklist.md` reflect the actual delivered outcome, and any unchecked task/decision checkbox that is clearly not selected, replaced, deferred, or `N/A` (for example, E2E intentionally not created) does not by itself mean the spec set is unfinished.
   - `project-doc-structure-mismatch`: existing `README.md` and project docs do not match the categorized structure required by `archive-specs`.
   - For code-affecting changes, run `review-change-set` for the same release scope before continuing; treat unresolved review findings as blocking.
   - Run `discover-edge-cases` and `harden-app-security` for the same release scope when the reviewed risk profile or repository context says their coverage is needed; treat them as blocking review gates, not optional polish, whenever that condition is met.
   - Any conditional gate whose trigger is confirmed by this classification becomes mandatory before version bumping, tagging, or release publication, including review, spec archival, docs synchronization, and changelog readiness.
   - Consolidate all confirmed findings before continuing.
   - Resolve all confirmed findings before changing version files, tags, or release metadata.
4. Run shared submission readiness
   - Execute `$submission-readiness-check` before version file edits, tags, or release publication.
   - Let it decide whether completed plan sets should be converted, whether project docs need alignment through `archive-specs`, and whether `CHANGELOG.md` `Unreleased` is ready to be cut into a versioned release entry.
   - Do not continue while `submission-readiness-check` reports unresolved blockers.
   - When readiness indicates completed-spec conversion or project-doc drift, run `archive-specs` before version edits instead of reproducing documentation alignment inside the release workflow.
5. Decide version and tag format
   - Read existing version files (for example `project.toml`, `package.json`, or repo-specific version files).
   - Infer existing tag format (`vX.Y.Z` or `X.Y.Z`) from repository tags.
   - Inspect existing local and remote tags plus any existing GitHub Release for the target version before creating new release metadata, so duplicate or conflicting releases are caught early.
   - If the user explicitly asks to keep the same prerelease version or to `repoint`, `retarget`, or `move` an existing prerelease after follow-up fixes, treat that as a retarget flow: keep the version unchanged, confirm the existing prerelease tag/release name, and plan to move that tag/release to the new commit instead of bumping semver.
   - If the requested version tag and matching published GitHub release already exist and point at the intended commit, report that the release is already complete instead of creating duplicate metadata.
   - If the user provides the target version, use it directly.
   - If it is missing, ask the user for the target version or semver bump type.
   - Provide recommendations only when explicitly requested.
   - Do not continue until you can state the current version, the intended next version, and the exact tag name that will be created.
   - For retarget flows, explicitly state that the intended next version stays unchanged and that the existing tag name will be moved to the new commit.
6. Update version files
   - Update every detected version file consistently.
   - Preserve file formatting; change only version values.
7. Update release docs
   - Treat root `CHANGELOG.md` `Unreleased` as the canonical pending release content.
   - If `Unreleased` is empty, stop and report that there are no curated release notes to publish yet.
   - Create the new version entry by moving the current `Unreleased` sections under the selected version heading and release date.
   - Reset `Unreleased` to an empty placeholder after the version entry is created.
   - Remove duplicate section headers or bullets only when the move would otherwise create repeated content.
   - Update `README.md` only when behavior or usage changed.
   - Update `AGENTS.md` only when agent workflow/rules changed.
8. Commit and tag
   - Create a release-oriented commit message (for example `chore(release): publish 2.12.1`) when applicable.
   - For new-version flows, create the version tag locally after commit.
   - For prerelease retarget flows, move the existing tag locally only after the new fix commit exists, and verify the target commit hash before rewriting the tag.
   - Re-read the version files after editing and before tagging to confirm they all match the intended release version.
   - Use actual git mutations for staging, commit creation, and tag creation; do not substitute UI git directives for these steps.
9. Push
   - Push commit(s) and the release tag to the current branch before publishing the GitHub release when the hosting platform requires the tag to exist remotely.
   - For prerelease retarget flows, push the rewritten tag explicitly (for example `--force-with-lease` for the single tag only), then verify the remote tag hash matches local `HEAD` before touching the GitHub release.
   - Do not overlap `git commit`, `git tag`, `git push`, or release-publish steps; wait for each mutation to finish before starting the next one.
   - After pushing, verify the remote branch tip matches local `HEAD`, and verify the release tag exists remotely via `git ls-remote --tags <remote> <tag>`.
   - If any git step finishes ambiguously or the remote hashes do not match local state, rerun the missing step sequentially and re-check before publishing the GitHub release.
10. Publish the GitHub release
   - Create a non-draft GitHub release that matches the pushed version tag.
   - For prerelease retarget flows, update the existing GitHub prerelease so it points at the rewritten tag/commit and refresh its notes when the new fix changes the shipped behavior.
   - If the release tool rejects a raw commit SHA while updating `target_commitish`, retry with the authoritative branch name or another GitHub-accepted target identifier, then verify the published release now resolves to the rewritten tag.
   - Use the release notes from the new `CHANGELOG.md` entry unless the repository has a stronger established release-note source.
   - If the repository has publish automation triggered by `release.published`, ensure the GitHub release is actually published rather than left as a draft.
   - Prefer `gh release create <tag>` or the repository's existing release tool when available.
   - Do not use PR-opening tools, PR directives, or placeholder URLs as a substitute for actual release publication.
   - Confirm the GitHub release URL and any triggered publish workflow status in the final report.
   - Never stop after the release commit or tag alone; creating the matching GitHub release is part of done criteria unless the user explicitly says to skip release publication.

## Notes

- Never guess versions; always read from files and user intent.
- Treat every scenario-matched gate as blocking before versioning or release publication, not as an optional reminder to maybe do later.
- Never skip `review-change-set` for code-affecting releases, and do not continue to versioning work while confirmed review findings remain unresolved.
- Never downgrade `discover-edge-cases` or `harden-app-security` to optional follow-up when the release risk says they apply.
- Never claim a release is complete without checking the actual release version, creating the matching tag, and publishing the matching GitHub release.
- Never treat a PR creation step, release-page URL guess, or tag-only push as evidence that the GitHub release exists.
- Never treat `::git-stage`, `::git-commit`, `::git-push`, or similar UI helpers as proof that the release commit, pushed tag, or remote branch update actually happened.
- If tests are required by repository conventions, run them before commit.
- If a new branch is required, follow `references/branch-naming.md`.
