# OpenAI Text to Image Storyboard

Generate storyboard images in batch via an OpenAI-compatible Image Generation API.

Workflow: the agent first decides which prompts are needed, then this tool sends prompts to `/images/generations` and writes outputs to `pictures/<content_name>/`.

## Agent execution rules

- As soon as article/chapter content is available, split scenes and run the script immediately.
- Do not stop in suggestion-only mode unless mandatory inputs are missing (for example output project path or content name).
- Always provide prompts via `--prompts-file` in JSON format.
- Define `roles.json` schemas in `video-production` or `novel-to-short-video`; do not duplicate role-schema docs in this skill.

## Features

- Reads `.env` from the skill folder by default (override with `--env-file`)
- CLI parameters always override environment variables (including `--api-url`, `--api-key`)
- Loads JSON prompts in one pass via `--prompts-file`
- Outputs images in order: `01_*.png`, `02_*.png`, ...
- Generates `storyboard.json` as input/output record
- Auto-appends `_2`, `_3`, ... when filename collisions exist

## Requirements

- Python 3.9+
- Access to an OpenAI-compatible API endpoint

## Quick start

1. Copy env template in the skill folder

```bash
cp .env.example .env
```

2. Edit `.env`

```dotenv
OPENAI_API_URL=https://api.openai.com/v1
OPENAI_API_KEY=your_api_key_here
OPENAI_IMAGE_MODEL=gpt-image-1
# Optional
# OPENAI_IMAGE_RATIO=16:9
# OPENAI_IMAGE_ASPECT_RATIO=16:9
# OPENAI_IMAGE_SIZE=1024x768
# OPENAI_IMAGE_QUALITY=medium
# OPENAI_IMAGE_STYLE=vivid
```

> Both `OPENAI_IMAGE_RATIO` and `OPENAI_IMAGE_ASPECT_RATIO` are supported; `OPENAI_IMAGE_RATIO` is preferred.  
> If a ratio is provided, the script performs center-crop post-processing to match it.  
> If provider ignores `aspect_ratio`, use `OPENAI_IMAGE_SIZE` (for example `1024x768`).  
> By default, the script reads `/Users/tszkinlai/.codex/skills/openai-text-to-image-storyboard/.env`.

3. Run with JSON prompt file

```bash
python scripts/generate_storyboard_images.py \
  --project-dir /path/to/project \
  --env-file /Users/tszkinlai/.codex/skills/openai-text-to-image-storyboard/.env \
  --content-name "1_chapter_title" \
  --prompts-file /path/to/prompts.json
```

Example `prompts.json`:

```json
[
  {
    "title": "Rain Chase",
    "prompt": "cinematic rain-soaked alley, tense running pose, blue neon reflections, dramatic rim light"
  },
  {
    "title": "Underground Archive",
    "prompt": "ancient underground library, floating dust in warm volumetric light, mysterious atmosphere"
  }
]
```

If you need multi-character continuity with `roles.json` and structured JSON role specs, refer to `video-production` or `novel-to-short-video`.

## Important parameters

- `--aspect-ratio`: overrides ratio in `.env` (for example `16:9`, `4:3`) and applies center-crop before output
- `--image-size` / `--size`: explicit pixel size (for example `1024x768`); useful for providers that only support `size`
- `--api-url` / `--api-key`: directly override `OPENAI_API_URL` / `OPENAI_API_KEY`
- If no ratio is provided, model/provider default size is used

## Output

Output paths:

- `pictures/<content_name>/01_<title>.png`
- `pictures/<content_name>/02_<title>.png`
- `pictures/<content_name>/storyboard.json`

## License

MIT, see [LICENSE](LICENSE).
