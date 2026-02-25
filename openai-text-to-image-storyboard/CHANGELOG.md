# Changelog

All notable changes to this project will be documented in this file.

## [0.3.0] - 2026-02-15

### Added
- Added structured `--prompts-file` object mode with top-level `characters` and `scenes` for recurring character consistency.
- Added per-scene character description overrides (`character_descriptions`) that only replace the `description` field while keeping a stable character skeleton.
- Added support for multi-character scene composition by injecting multiple character skeletons in one generated scene prompt.

### Changed
- Updated skill docs, README, and default agent prompt to require character JSON skeleton workflow for recurring novel characters.
- CLI values now take precedence over environment variables, including `--api-url` and `--api-key` overrides for API credentials.

## [0.2.0] - 2026-02-14

### Added
- Added aspect-ratio center-crop post-processing so outputs match the configured ratio even when providers ignore ratio parameters.
- Added `source_width` and `source_height` metadata in `storyboard.json` when post-processing changes image dimensions.

### Changed
- Updated docs to clarify ratio-based post-processing behavior and size guidance.

## [0.1.1] - 2026-02-14

### Added
- Added `--image-size`/`--size` CLI options and `OPENAI_IMAGE_SIZE` env support for providers that require explicit pixel size.
- Added generated image dimension metadata (`width`, `height`) and optional `image_size` to `storyboard.json`.

### Changed
- Updated README, SKILL docs, and `.env.example` with size-based guidance when aspect-ratio controls are ignored by a provider.

### Fixed
- Added post-generation aspect-ratio mismatch detection and warning to highlight when providers ignore `aspect_ratio`.

## [0.1.0] - 2026-02-14

### Added
- Initial release of the OpenAI text-to-image storyboard skill and generation script.
- Support for generating ordered storyboard images and `storyboard.json` from direct prompts or a JSON prompts file.
- OpenAI-compatible image generation support via `/images/generations` with configurable model, ratio, quality, and style.

### Changed
- Clarified skill workflow so the agent starts image generation immediately after receiving article or chapter content.
- Updated usage docs and agent default prompt to reflect the expected execution flow.

### Fixed
- Default `.env` loading now points to this skill folder instead of the target project directory.
