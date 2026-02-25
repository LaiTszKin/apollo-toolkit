# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [v0.1.0] - 2026-02-17

### Added
- Added edge-case tests for extractor limit handling and latest-session selection.

### Changed
- Changed extractor default behavior to return all sessions in the last hour when `--limit` is omitted.
- Updated documentation and skill instructions to remove the fixed `--limit 10` usage.
- Kept `--limit` as an optional override for explicitly bounded extraction.
