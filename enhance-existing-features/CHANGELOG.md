# Changelog

All notable changes to this project are documented in this file.

## [v0.2.0] - 2026-02-25

### Changed
- Replaced planning flow with conditional specs workflow (`spec.md` / `tasks.md` / `checklist.md`).
- Clarified specs trigger scope: high complexity, critical module, or cross-module changes.
- Added explicit rule that test coverage is required even when specs are not used.

### Added
- Added `scripts/create-specs` for generating specs into `docs/plans/{YYYY-MM-DD}_{change_name}/`.
- Added reusable templates under `references/templates/`.

## [v0.1.2] - 2026-02-12

### Changed
- Tightened multi-module planning workflow to require explicit user approval before implementation.
- Updated usage docs and agent metadata for approval gating clarity.

## [v0.1.1] - 2026-02-12

### Added
- Added built-in planning script and planning template for cross-module feature changes.

### Changed
- Updated the skill workflow to require planning before implementation when a request spans multiple modules.
- Updated skill metadata and usage docs to reflect planning-first behavior for multi-module work.
- Refreshed repository introduction wording for clearer agent-skill positioning.

## [v0.1.0] - 2026-02-07

### Added
- Initial release of the `enhance-existing-features` skill for dependency mapping, authoritative doc verification, focused implementation, and test updates in brownfield codebases.
