# version-release

A Codex skill for explicit release workflows: code/documentation alignment, version bump, changelog update, tagging, and push.

## What this skill does

`version-release` helps agents perform release work in a repeatable flow:

1. Inspect release scope from git history.
2. Align project code and project docs (excluding development planning docs).
3. Resolve version and tag details.
4. Update version files and changelog.
5. Commit release metadata.
6. Create and push the release tag.

## Scope

Use this skill only when the user explicitly asks for:

- release preparation
- version bumping
- tag creation/publishing

If the user only wants commit + push, use `commit-and-push`.
