# Changelog

All notable changes to this project will be documented in this file.

## [v0.2.1] - 2026-02-17

### Changed
- Remove `submit-changes` skill dependency from no-diff release flow while keeping the PR workflow.
- Update skill and README guidance to use direct git commit/push before opening a PR.

## [v0.2.0] - 2026-02-17

### Added
- Add no-diff workflow guidance to scan the whole codebase for actionable edge cases.
- Add release-flow guidance for no-diff fixes: create worktree, use `submit-changes`, and open a PR.

### Changed
- Clarify scope selection logic: `git diff` path uses changed files only; no-diff path uses full-codebase scan.
- Expand README examples to include a no-diff prompt and expected execution path.
