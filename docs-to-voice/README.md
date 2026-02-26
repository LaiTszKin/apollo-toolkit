# docs-to-voice

Convert text into voice files and always write outputs to:

`project_dir/audio/{project_name}/`

Each run also generates subtitle timeline files in the same folder:

- `{audio_name_without_extension}.timeline.json`: sentence-level subtitle start/end timestamps (seconds and milliseconds)
- `{audio_name_without_extension}.srt`: ready-to-use subtitle track file

Two modes are supported:

- `say`: built-in macOS `say`
- `api`: Alibaba Cloud Model Studio TTS API (for example `qwen3-tts`)

## Features

- Supports both `--text` and `--input-file`
- Supports `--mode say|api`
- Supports `.env` for API key/model/voice settings
- Supports `--output-name` for deterministic output filename
- `say` mode enables punctuation prosody enhancement by default (disable with `--no-auto-prosody`)
- `api` mode sends sentence-level TTS requests and merges output into one audio file
- `api` mode auto-detects model max input length and segments over-limit sentences
- `--max-chars` (or `.env`) can override segment length limit manually
- `--speech-rate` (or `.env`) can apply post-processing speech-rate adjustment (requires `ffmpeg`)
- API timeline prefers real per-sentence audio duration for higher subtitle precision
- Automatically outputs sentence-level timeline files (`.timeline.json` + `.srt`)

## Requirements

- `say` mode: macOS + `say` + `python3`
- `api` mode: `python3` + Model Studio API key
- Long-text merge workflow: `ffmpeg` recommended (especially for AIFF output)

## Quick start

### 1) say mode

```bash
python3 scripts/docs_to_voice.py \
  --project-dir "/path/to/project" \
  --mode say \
  --text "Hello, this is a voice synthesis test."
```

### 2) api mode (Model Studio)

```bash
python3 scripts/docs_to_voice.py \
  --project-dir "/path/to/project" \
  --mode api \
  --text "Hello, this is a qwen3-tts test."
```

> Compatibility note: `scripts/docs_to_voice.sh` still works and internally delegates to the Python script.

## `.env` settings

1. Copy template

```bash
cp .env.example .env
```

2. Configure mode and API parameters (example)

```env
DOCS_TO_VOICE_MODE="api"
DASHSCOPE_API_KEY="sk-xxx"
DOCS_TO_VOICE_API_ENDPOINT="https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation"
DOCS_TO_VOICE_API_MODEL="qwen3-tts"
DOCS_TO_VOICE_API_VOICE="Cherry"
DOCS_TO_VOICE_MAX_CHARS=""
DOCS_TO_VOICE_SPEECH_RATE=""
```

> CLI args `--mode`, `--api-model`, `--api-voice`, `--api-endpoint`, and `--speech-rate` override `.env`. If omitted, values are loaded from `.env` first, then fallback to same-name shell environment variables.

## Parameters

```text
--project-dir DIR         required, project root path
--text TEXT               choose one of --text / --input-file
--input-file FILE         choose one of --text / --input-file
--project-name NAME       optional, defaults to project_dir folder name
--output-name NAME        optional, defaults to voice-YYYYmmdd-HHMMSS + mode extension
--env-file FILE           optional, default: skill-folder/.env
--mode MODE               optional, say or api
--voice NAME              optional for say mode
--rate N                  optional for say mode
--speech-rate N           optional, speech-rate multiplier (>0; 1.2=faster, 0.8=slower; requires ffmpeg)
--api-endpoint URL        optional for api mode (Model Studio endpoint)
--api-model NAME          optional for api mode
--api-voice NAME          optional for api mode
--max-chars N             optional, manual segment limit (api mode auto-detects if omitted; 0 means no segmentation)
--no-auto-prosody         optional for say mode, disable punctuation prosody enhancement
--force                   optional, overwrite existing files
```

## Long-text notes

- API mode uses sentence-level TTS by default and only segments when a sentence exceeds model limits.
- If you already know a suitable limit, set `--max-chars` (or `DOCS_TO_VOICE_MAX_CHARS` in `.env`).
- For many `qwen3-tts` models, CJK chars typically count as 2 units and other chars as 1 unit; this script segments using that convention.

## Endpoint note

If you need direct Model Studio `qwen3-tts` integration, use:

`https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation`

`https://dashscope-intl.aliyuncs.com/compatible-mode/v1` is the OpenAI-compatible base URL (typically for chat/completions), not the default direct Model Studio TTS endpoint used by this script.

## License

MIT License (see `LICENSE`).
