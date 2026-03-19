# version-release

A Codex skill for explicit release workflows: code/documentation alignment, version bump, changelog update, tagging, GitHub release publication, and push.

## What this skill does

`version-release` helps agents perform release work in a repeatable flow:

1. Inspect the release scope from git history.
2. Run quality gates for code-affecting changes when their coverage is needed.
3. Run `archive-specs` before finalizing the release to convert completed spec sets and archive them, or when existing project docs need normalization.
4. Align project code and categorized project docs.
5. Resolve version and tag details.
6. Update version files and changelog.
7. Commit release metadata.
8. Create and push the release tag.
9. Publish the matching GitHub release and verify any release-triggered automation.

## Scope

Use this skill only when the user explicitly asks for:

- release preparation
- version bumping
- tag creation/publishing
- GitHub release publication

If the repository contains a completed spec set, convert it into the categorized `archive-specs` project-doc structure before finalizing the release and archive the consumed plan files. Treat `spec.md`, `tasks.md`, and `checklist.md` semantically: unchecked task or decision checkboxes do not automatically mean the work is unfinished when the docs clearly show they were not selected, replaced, deferred, or marked `N/A`.

If the user only wants commit + push, use `commit-and-push`.
