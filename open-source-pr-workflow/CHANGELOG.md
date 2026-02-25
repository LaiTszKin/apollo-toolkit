# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project follows Semantic Versioning.

## [0.1.3] - 2026-02-22

### Changed
- Switch the PR workflow default to open PRs directly without waiting for draft confirmation.
- Show PR drafts only when the user explicitly asks to review before PR creation.
- Align SKILL.md, README highlights, and agent default prompt with the new draft-handling behavior.

## [0.1.2] - 2026-02-20

### Changed
- Update branch naming convention from `codex/feature/{feature_name}` to `codex/{change_type}/{changes}` across skill docs and agent prompt.
- Remove the required "Dependent Skill Updates" PR-body section so PR content stays focused on the change itself.
- Clarify that internal skill/tool workflow details should not appear in PR title/body content.
- Align README highlights and agent default prompt with the PR-content-only rule.

## [0.1.1] - 2026-02-20

### Changed
- Require running `edge-case-test-fixer` and `code-simplifier` in sequence before opening a PR when code-affecting changes exist.
- Add a required "Dependent Skill Updates" section to PR bodies to capture outputs from both dependency skills.
- Align agent default prompt and README highlights with the dependency-skill workflow.

## [0.1.0] - 2026-02-20

### Added
- Initial open-source PR workflow skill with branch naming, fork targeting defaults, and required PR content sections.
