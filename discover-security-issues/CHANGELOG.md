# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project follows Semantic Versioning.

## [v0.0.3] - 2026-05-06

### Changed
- Rename skill directory and identifier from `harden-app-security` to `discover-security-issues`; refresh `SKILL.md`, `README.md`, and agent display metadata to match discovery-only semantics.

## [v0.0.2] - 2026-03-11

### Changed
- Reworked the skill into a single discovery-only workflow and removed interaction/auto mode selection.
- Removed proactive remediation behavior from the core workflow (no direct patching or PR delivery).
- Expanded module scope from agent/finance only to include a new `software-system` domain for common software and web vulnerabilities.
- Updated skill metadata and README to reflect adversarial finding/reporting-only behavior.

### Added
- Added `references/common-software-attack-catalog.md` covering SQL injection, XSS, CSRF, SSRF, path traversal, IDOR/BOLA, command injection, session/token risks, unsafe upload, and misconfiguration checks.

## [v0.0.1] - 2026-02-17

### Added
- Documented explicit interaction and auto execution modes in the security hardening workflow.
- Clarified handoff behavior for interaction mode and delivery expectations for auto mode.

### Changed
- Removed mandatory `$submit-changes` dependency from auto-mode PR delivery.
- Switched auto-mode delivery guidance to standard git push plus PR creation workflow (prefer `gh pr create`).
- Updated agent interface metadata to reflect interaction-first execution behavior.
