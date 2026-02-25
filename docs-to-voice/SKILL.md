---
name: docs-to-voice
description: Convert text and document content into audio files and sentence-level subtitle timelines under project_dir/audio/{project_name}/. Supports both macOS say and Alibaba Cloud Model Studio API modes.
---

# Docs to Voice

## Overview

Use `scripts/docs_to_voice.py` to convert raw text or text files into audio and always save under:

`project_dir/audio/{project_name}/`

Alongside each audio file, the script also writes:

- `{audio_name_without_extension}.timeline.json`
- `{audio_name_without_extension}.srt`

Modes:

- `say`: local macOS `say`
- `api`: Alibaba Cloud Model Studio TTS API (for example `qwen3-tts`)

## Workflow

1. Collect inputs.
   - Require `project_dir`.
   - Accept either raw text or one input text file.
   - Set `project_name`; default to basename of `project_dir`.

2. Select mode.
   - `--mode say` for local generation.
   - `--mode api` for Model Studio API generation.
   - If omitted, load `DOCS_TO_VOICE_MODE` from `.env`, then shell environment variables; fallback `say`.

3. Prepare output path.
   - Build `project_dir/audio/{project_name}/`.
   - Create directory if it does not exist.

4. Generate audio.
   - `say` mode supports `--voice`, `--rate`, and punctuation-pause enhancement.
   - `api` mode supports `--api-endpoint`, `--api-model`, `--api-voice`, and reads `DASHSCOPE_API_KEY`.
   - `api` mode sends one request per sentence and concatenates all sentence audio into one final file.
   - `api` mode auto discovers model max input length; only oversized sentences are split by that limit.
   - `--max-chars` (or `DOCS_TO_VOICE_MAX_CHARS`) can override the sentence split limit; `0` disables chunking.
   - `--speech-rate` (or `DOCS_TO_VOICE_SPEECH_RATE`) applies optional post-process speed adjustment and requires `ffmpeg` when value is not `1`.
   - API splitting uses model counting rules (for `qwen3-tts`, CJK chars count as 2 units).

5. Generate sentence-level timeline files.
   - Write JSON timeline and SRT subtitle files next to audio output.
   - In `api` mode, timeline start/end uses per-sentence audio durations whenever available.

6. Return completion details.
   - Report absolute output audio path.

## Script Reference

`scripts/docs_to_voice.py` flags:

- `--project-dir` (required)
- `--project-name` (optional)
- `--text` or `--input-file` (exactly one required)
- `--env-file` (optional, default: `skill_dir/.env`)
- `--mode` (`say|api`, optional)
- `--voice` (optional, say mode)
- `--rate` (optional, say mode)
- `--speech-rate` (optional, post-process speed multiplier)
- `--api-endpoint` (optional, api mode)
- `--api-model` (optional, api mode)
- `--api-voice` (optional, api mode)
- `--max-chars` (optional, auto chunking threshold for long text)
- `--output-name` (optional)
- `--no-auto-prosody` (optional, say mode)
- `--force` (optional)

Environment variables:

- `DOCS_TO_VOICE_MODE`
- `DOCS_TO_VOICE_VOICE`
- `DOCS_TO_VOICE_API_ENDPOINT`
- `DOCS_TO_VOICE_API_MODEL`
- `DOCS_TO_VOICE_API_VOICE`
- `DOCS_TO_VOICE_MAX_CHARS`
- `DOCS_TO_VOICE_SPEECH_RATE`
- `DASHSCOPE_API_KEY`

## Troubleshooting

- `say` mode: confirm `command -v say` and `command -v python3`.
- `api` mode: confirm `command -v python3` and valid `DASHSCOPE_API_KEY`.
- Long-text chunk merge (especially AIFF output): recommend `command -v ffmpeg`.
- If output exists, use `--force` or a new `--output-name`.
- `scripts/docs_to_voice.sh` is kept as a compatibility wrapper for existing workflows.
