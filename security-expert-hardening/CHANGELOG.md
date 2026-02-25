# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project follows Semantic Versioning.

## [v0.0.1] - 2026-02-17

### Added
- Documented explicit interaction and auto execution modes in the security hardening workflow.
- Clarified handoff behavior for interaction mode and delivery expectations for auto mode.

### Changed
- Removed mandatory `$submit-changes` dependency from auto-mode PR delivery.
- Switched auto-mode delivery guidance to standard git push plus PR creation workflow (prefer `gh pr create`).
- Updated agent interface metadata to reflect interaction-first execution behavior.
