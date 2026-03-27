---
name: version-release
description: "Guide the agent to prepare and publish a versioned release (version bump, changelog, tag, GitHub release, and push). Use only when users explicitly request version/tag/release work. Before finalizing the release, run `archive-specs` to convert completed spec sets into project documentation and archive the consumed plans, and also use it when existing project docs do not match the standardized project-doc structure."
---

# Version Release

## Dependencies

- Required: none.
- Conditional: `review-change-set`, `discover-edge-cases`, and `harden-app-security` for code-affecting releases before metadata edits and the final commit; `archive-specs` before release finalization when completed spec sets should be converted into project docs and archived, or when existing project docs need normalization into the standard categorized structure.
- Optional: none.
- Fallback: If a required release dependency is unavailable for a code-affecting scope, or if `archive-specs` is required for spec conversion but unavailable, stop and report the missing dependency.

## Standards

- Evidence: Inspect the active change set, current version files, and root `CHANGELOG.md` `Unreleased` content before touching version files, tags, or release metadata.
- Execution: Use this workflow only for explicit release intent, run the required quality gates when applicable, convert completed spec sets into categorized project docs before release finalization, normalize non-standard project docs when needed, then cut the release directly from `CHANGELOG.md` `Unreleased`, update versions and docs, commit, tag, push, and publish the GitHub release; run git mutations sequentially and verify both the branch tip and release tag exist remotely before publishing the GitHub release.
- Quality: Never guess versions, align user-facing docs with actual code, convert completed planning docs into standardized categorized project docs before the release is published, treat the `archive-specs` structure as the release-ready documentation format, and do not reconstruct release notes from `git diff` when curated changelog content already exists.
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
   - If no release intent is present, use `commit-and-push` instead.
3. Classify changes and run dependencies when required
   - `code-affecting`: runtime code, tests, build scripts, CI logic, or behavior-changing config.
   - `docs-only`: documentation/content updates only.
   - `repo-specs-present`: the repository contains live project planning artifacts such as `spec.md`, `tasks.md`, `checklist.md`, or plan directories; exclude reference examples, templates, and archived samples.
   - `repo-specs-ready-for-conversion`: the relevant `spec.md`, `tasks.md`, and `checklist.md` reflect the actual delivered outcome, and any unchecked task/decision checkbox that is clearly not selected, replaced, deferred, or `N/A` (for example, E2E intentionally not created) does not by itself mean the spec set is unfinished.
   - `project-doc-structure-mismatch`: existing `README.md` and project docs do not match the categorized structure required by `archive-specs`.
   - For code-affecting changes, run `review-change-set`, `discover-edge-cases`, and `harden-app-security` for the same release scope when their coverage is needed.
   - Consolidate all confirmed findings before continuing.
   - Resolve all confirmed findings before changing version files, tags, or release metadata.
4. Standardize project docs when specs or doc normalization is needed
   - Before finalizing the release, execute `archive-specs` when `repo-specs-ready-for-conversion` is true or when `project-doc-structure-mismatch` is true.
   - Let `archive-specs` convert the relevant specs into categorized project docs such as `docs/README.md`, `docs/getting-started.md`, `docs/configuration.md`, `docs/architecture.md`, `docs/features.md`, and `docs/developer-guide.md`.
   - Let the skill normalize any existing project docs to the same structure and archive superseded source spec files.
   - Do not treat unchecked task or decision checkboxes alone as blocking unfinished work; read the surrounding notes and requirement status semantically.
   - If the docs still show unresolved implementation scope that is neither completed, intentionally deferred, nor explicitly `N/A`, do not convert them yet; report that the spec files remain active and should not be deleted.
5. Align code and project docs
   - Compare the pending release intent plus current repository behavior with user-facing docs and operational docs to ensure they match actual code behavior.
   - Required alignment targets include project docs such as `README.md`, usage/setup docs, API docs, deployment/runbook docs, and release notes sources when present.
   - After `archive-specs` runs, treat the categorized outputs as the canonical project-doc structure.
   - If existing project docs are present but still use a mixed or non-standard layout, normalize them into the same categorized structure before version bumping or tagging.
   - If mismatches are found, update the relevant project docs before version bumping/tagging.
6. Decide version and tag format
   - Read existing version files (for example `project.toml`, `package.json`, or repo-specific version files).
   - Infer existing tag format (`vX.Y.Z` or `X.Y.Z`) from repository tags.
   - If the user provides the target version, use it directly.
   - If it is missing, ask the user for the target version or semver bump type.
   - Provide recommendations only when explicitly requested.
7. Update version files
   - Update every detected version file consistently.
   - Preserve file formatting; change only version values.
8. Update release docs
   - Treat root `CHANGELOG.md` `Unreleased` as the canonical pending release content.
   - If `Unreleased` is empty, stop and report that there are no curated release notes to publish yet.
   - Create the new version entry by moving the current `Unreleased` sections under the selected version heading and release date.
   - Reset `Unreleased` to an empty placeholder after the version entry is created.
   - Remove duplicate section headers or bullets only when the move would otherwise create repeated content.
   - Update `README.md` only when behavior or usage changed.
   - Update `AGENTS.md` only when agent workflow/rules changed.
9. Commit and tag
   - Create a release-oriented commit message (for example `chore(release): publish 2.12.1`) when applicable.
   - Create the version tag locally after commit.
10. Push
   - Push commit(s) and the release tag to the current branch before publishing the GitHub release when the hosting platform requires the tag to exist remotely.
   - Do not overlap `git commit`, `git tag`, `git push`, or release-publish steps; wait for each mutation to finish before starting the next one.
   - After pushing, verify the remote branch tip matches local `HEAD`, and verify the release tag exists remotely via `git ls-remote --tags <remote> <tag>`.
   - If any git step finishes ambiguously or the remote hashes do not match local state, rerun the missing step sequentially and re-check before publishing the GitHub release.
11. Publish the GitHub release
   - Create a non-draft GitHub release that matches the pushed version tag.
   - Use the release notes from the new `CHANGELOG.md` entry unless the repository has a stronger established release-note source.
   - If the repository has publish automation triggered by `release.published`, ensure the GitHub release is actually published rather than left as a draft.
   - Prefer `gh release create <tag>` or the repository's existing release tool when available.
   - Confirm the GitHub release URL and any triggered publish workflow status in the final report.

## Notes

- Never guess versions; always read from files and user intent.
- If tests are required by repository conventions, run them before commit.
- If a new branch is required, follow `references/branch-naming.md`.
