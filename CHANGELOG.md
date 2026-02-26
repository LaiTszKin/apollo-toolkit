# Changelog

All notable changes to this repository are documented in this file.

## [v0.5.0] - 2026-02-26

### Added
- Add `commit-and-push` skill for commit+push-only submission workflows.
- Add `version-release` skill for explicit version/tag/changelog release workflows.
- Add new skill documents and references for the split submit/release workflows.

### Changed
- Replace legacy `submit-changes` with two dedicated skills: `commit-and-push` and `version-release`.
- Translate project documentation, templates, and testing/reference guides to English across skills.
- Update multiple skill definitions to English wording for consistent skill documentation language.
- Clarify spec-first requirements in feature-planning skills, including mandatory re-approval after clarification updates.

## [v0.4.0] - 2026-02-26

### Added
- Add `github-issue-fix-pr-workflow` skill with issue listing, local fix flow, and PR submission guidance.
- Add `github-issue-fix-pr-workflow/scripts/list_issues.py` and related tests for deterministic issue discovery.

### Changed
- Update `install_skills.sh` to support interactive multi-option selection, multi-mode CLI input, and `all` installation.
- Add Trae IDE support in `install_skills.sh`, with a default install target at `~/.trae/skills`.
- Update root `README.md` installer examples to include `trae` and `all` usage.
- Highlight BDD keywords in `develop-new-features` and `enhance-existing-features` spec templates using Markdown bold formatting.

## [v0.3.0] - 2026-02-25

### Added
- Enhance `app-log-issue-analysis` with deterministic GitHub issue publishing support.
- Add `app-log-issue-analysis/scripts/publish_log_issue.py` for issue publishing with auth fallback (`gh` login -> `GITHUB_TOKEN`/`GH_TOKEN` -> draft).
- Add remote README-based issue language selection (Chinese README -> Chinese issue body, otherwise English).

### Changed
- Update app-log issue analysis docs, checklist, and default prompt to document the new issue publishing workflow.
