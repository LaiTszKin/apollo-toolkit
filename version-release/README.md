# version-release

A Codex skill for explicit release workflows: code/documentation alignment, version bump, changelog update, tagging, GitHub release publication, and push.

## What this skill does

`version-release` helps agents perform release work in a repeatable flow:

1. Inspect the current repository state and the curated `CHANGELOG.md` `Unreleased` content.
2. Run `review-change-set` as a blocking gate whenever the release includes code changes.
3. Run additional quality gates for code-affecting changes when their coverage is needed.
4. Run `archive-specs` before finalizing the release to convert completed spec sets and archive them, or when existing project docs need normalization.
5. Align project code and categorized project docs.
6. Resolve version and tag details by reading the current version and existing tag/release state first.
7. Update version files and cut the release directly from `CHANGELOG.md` `Unreleased`.
8. Commit release metadata.
9. Create and push the release tag.
10. Publish the matching GitHub release and verify any release-triggered automation.

## Scope

Use this skill only when the user explicitly asks for:

- release preparation
- version bumping
- tag creation/publishing
- GitHub release publication

If the repository contains a completed spec set, convert it into the categorized `archive-specs` project-doc structure before finalizing the release and archive the consumed plan files. Treat `spec.md`, `tasks.md`, and `checklist.md` semantically: unchecked task or decision checkboxes do not automatically mean the work is unfinished when the docs clearly show they were not selected, replaced, deferred, or marked `N/A`.

Do not rebuild release notes from `git diff`. Publish from the already curated root `CHANGELOG.md` `Unreleased` content by moving it into the target version entry and clearing `Unreleased` afterward.

When the release includes code changes, `review-change-set` is still a conditional dependency, but that condition is considered met and becomes blocking before any version bump, tag, or release publication.

Apply the same rule to every other conditional gate: if its scenario is met during release classification, it becomes blocking before version bumping, tagging, or release publication.

Do not report release completion after only bumping versions or pushing a commit: the matching tag and GitHub release are part of done criteria unless the user explicitly says to skip publication.

If the user only wants commit + push, use `commit`.
