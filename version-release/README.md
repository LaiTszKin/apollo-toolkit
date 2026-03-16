# version-release

A Codex skill for explicit release workflows: code/documentation alignment, version bump, changelog update, tagging, and push.

## What this skill does

`version-release` helps agents perform release work in a repeatable flow:

1. Inspect the release scope from git history.
2. Run quality gates for code-affecting changes.
3. Run `specs-to-project-docs` when the release scope contains new completed spec files.
4. Align project code and standardized project docs.
5. Resolve version and tag details.
6. Update version files and changelog.
7. Commit release metadata.
8. Create and push the release tag.

## Scope

Use this skill only when the user explicitly asks for:

- release preparation
- version bumping
- tag creation/publishing

If the release includes new completed specs, convert them into standardized project docs first and let `specs-to-project-docs` remove or archive the superseded spec files.

If the user only wants commit + push, use `commit-and-push`.
