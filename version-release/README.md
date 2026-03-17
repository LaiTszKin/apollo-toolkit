# version-release

A Codex skill for explicit release workflows: code/documentation alignment, version bump, changelog update, tagging, GitHub release publication, and push.

## What this skill does

`version-release` helps agents perform release work in a repeatable flow:

1. Inspect the release scope from git history.
2. Run quality gates for code-affecting changes through isolated parallel review subagents when available.
3. Run `specs-to-project-docs` when the repository contains active planning artifacts or existing project docs need normalization.
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

If the repository contains active planning artifacts, or if existing project docs still use a mixed or non-standard layout, normalize them into the categorized `specs-to-project-docs` structure first and let that skill remove or archive superseded spec files when appropriate.

If the user only wants commit + push, use `commit-and-push`.
