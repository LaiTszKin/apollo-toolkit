# Changelog

All notable changes to this repository are documented in this file.

## [v0.3.0] - 2026-02-25

### Added
- Enhance `app-log-issue-analysis` with deterministic GitHub issue publishing support.
- Add `app-log-issue-analysis/scripts/publish_log_issue.py` for issue publishing with auth fallback (`gh` login -> `GITHUB_TOKEN`/`GH_TOKEN` -> draft).
- Add remote README-based issue language selection (Chinese README -> Chinese issue body, otherwise English).

### Changed
- Update app-log issue analysis docs, checklist, and default prompt to document the new issue publishing workflow.
