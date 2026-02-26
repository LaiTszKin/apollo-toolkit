# version-release

A Codex skill for explicit release workflows: version bump, changelog update, tagging, and push.

## What this skill does

`version-release` helps agents perform release work in a repeatable flow:

1. Inspect release scope from git history.
2. Resolve version and tag details.
3. Update version files and changelog.
4. Commit release metadata.
5. Create and push the release tag.

## Scope

Use this skill only when the user explicitly asks for:

- release preparation
- version bumping
- tag creation/publishing

If the user only wants commit + push, use `commit-and-push`.
