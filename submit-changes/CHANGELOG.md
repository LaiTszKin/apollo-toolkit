# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog.

## [0.3.0] - 2026-02-22

### Changed

- Added a default `commit+push only` workflow when users do not explicitly request versioning.
- Restricted version bump recommendations to explicit user requests instead of proactive suggestions.
- Updated workflow docs to make release-specific steps conditional on explicit version/tag/release intent.

## [0.2.0] - 2026-02-15

### Changed

- Added an explicit dependency contract requiring `edge-case-test-fixer` then `code-simplifier` for code-affecting releases.
- Added a docs-only classification path so documentation-only changes can skip both dependency skills.
- Reordered the submit workflow to run dependency checks before version/changelog/readme/agent document updates.

## [0.1.3] - 2026-02-10

### Changed

- Added explicit guidance to infer and share a preferred semver bump before user confirmation.
- Required submit prompts to include a recommended target version with a brief rationale.
- Updated README workflow description to reflect recommendation-first version selection.

## [0.1.2] - 2026-02-07

### Changed

- Unified submit behavior into a single workflow without a mode-selection step.
- Standardized release scope analysis to always use the last version tag to `HEAD`.
- Moved `AGENTS.md` synchronization to run before commit and push, aligned with README sync timing.
- Updated commit staging guidance to include optional `AGENTS.md` changes when applicable.

## [0.1.1] - 2026-02-07

### Changed

- Added a brief introduction section to improve skill onboarding guidance.
- Clarified submit workflow rules so commit messages are derived from staged diff intent.
- Prohibited version-only commit subjects such as `feat: vX.Y.Z`.
- Added release-only commit message guidance and examples in commit message references.

[0.1.1]: https://github.com/LaiTszKin/submit-changes/compare/v0.1.0...v0.1.1
[0.1.2]: https://github.com/LaiTszKin/submit-changes/compare/v0.1.1...v0.1.2
[0.1.3]: https://github.com/LaiTszKin/submit-changes/compare/v0.1.2...v0.1.3
[0.2.0]: https://github.com/LaiTszKin/submit-changes/compare/v0.1.3...v0.2.0
[0.3.0]: https://github.com/LaiTszKin/submit-changes/compare/v0.2.0...v0.3.0
