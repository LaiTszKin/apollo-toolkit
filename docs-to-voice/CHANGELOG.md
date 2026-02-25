# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog.

## [Unreleased]

## [0.5.0] - 2026-02-18

### Added
- Added `--speech-rate` (and `DOCS_TO_VOICE_SPEECH_RATE`) for optional ffmpeg-based post-process speed adjustment.
- Added speech-rate unit tests for input validation, filter-chain generation, and timeline duration scaling.

### Fixed
- Rejected non-finite `--speech-rate` values (for example `nan`/`inf`) to avoid invalid ffmpeg filter generation.

## [0.4.0] - 2026-02-15

### Changed
- API mode now sends TTS requests sentence-by-sentence and still merges all generated audio into one final output file.
- API sentence timelines now prefer measured per-sentence audio durations to produce more precise subtitle timestamps.

### Added
- Added `split_text_into_api_sentence_requests` to keep sentence boundaries in API synthesis while still splitting only oversized sentences by `--max-chars`.
- Added timeline tests covering sentence-based API request splitting and sentence-duration timestamp output.

## [0.3.0] - 2026-02-15

### Added
- Added API-mode max-length discovery that first checks model catalog metadata and then probes API length validation when metadata is unavailable.

### Changed
- API mode now auto-splits long text by discovered max input length when `--max-chars` (or `DOCS_TO_VOICE_MAX_CHARS`) is not provided.
- API chunking now applies weighted input-unit counting for CJK text to match qwen3-tts length rules.

### Fixed
- Added explicit `0` handling for `--max-chars` / `DOCS_TO_VOICE_MAX_CHARS` so users can still disable chunking.
- Wrapped transient HTTP disconnect exceptions as user-facing CLI errors instead of raw tracebacks.

## [0.2.1] - 2026-02-15

### Added
- Added unit tests for `resolve_setting` to lock configuration precedence and fallback behavior.

### Fixed
- Fixed configuration precedence so omitted CLI mode/options now prefer `.env` values before shell environment variables.
- Prevented blank CLI values from incorrectly overriding `.env` settings.

## [0.2.0] - 2026-02-14

### Added
- Added `scripts/docs_to_voice.py` as the primary CLI implementation for both `say` and `api` modes.
- Added built-in Python API handling for Model Studio requests/responses (URL and base64 audio paths) to simplify API mode operations.
- Added long-text chunking via `--max-chars` and `DOCS_TO_VOICE_MAX_CHARS`, with automatic per-chunk synthesis and final audio concatenation.

### Changed
- Replaced `scripts/docs_to_voice.sh` logic with a lightweight compatibility wrapper that delegates to the Python CLI.
- Updated README, SKILL, `.env.example`, and agent prompt guidance to use the Python script as the default entrypoint and document chunked generation for long text.

## [0.1.0] - 2026-02-14

### Added
- Added `api` mode for Alibaba Cloud Model Studio TTS, including endpoint/model/voice configuration and API key support.
- Added sentence-level timeline outputs for each generated audio file: `.timeline.json` and `.srt`.
- Added timeline metadata with per-sentence start/end offsets (seconds and milliseconds) to support subtitle alignment.

### Changed
- Updated `.env.example` with full mode selection, endpoint guidance, and API voice/model defaults.
- Updated skill and README documentation to describe dual-mode generation and subtitle timeline artifacts.
- Updated agent default prompt to include timeline generation behavior.
