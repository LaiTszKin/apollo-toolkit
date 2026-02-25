---
name: openai-text-to-image-storyboard
description: Generate storyboard images by using agent-decided prompts and calling an OpenAI-compatible image generation API. Use when users want chapters, novels, articles, or scripts converted into image sets under pictures/{content_name}, with API URL and API key loaded from this skill folder's .env by default.
---

# OpenAI Text to Image Storyboard

## Overview

Let the agent decide which images are needed from the text, then call only `/images/generations` to render them.
Always save outputs in `pictures/<content_name>/` (example: `pictures/1_小說章節名稱/`).

## Workflow

1. Read user text and decide the target scenes in the agent.
2. Convert scene prompts into a JSON prompt file (`prompts.json`).
3. As soon as article/chapter content is available, directly run the script (do not stop at suggestion-only mode).
4. Use this skill folder's `.env` first, then call `/images/generations` to render images.
5. Save files in narrative order and write `storyboard.json`.

## Agent Execution Requirement

- After receiving article/chapter/script content, immediately enter generation flow.
- Convert content into scene prompts and execute the Python script in the same turn whenever possible.
- Only ask follow-up questions when mandatory inputs are missing (for example: no output project path or no content name).
- Always provide prompts through `--prompts-file` with valid JSON.
- Do not define `roles.json` schema in this skill; role schema details belong to `video-production` or `novel-to-short-video`.

## Environment Configuration

Create `.env` in this skill folder (default path used by script):

- `/Users/tszkinlai/.codex/skills/openai-text-to-image-storyboard/.env`

You can still override via `--env-file` when needed.
All CLI parameters take priority over environment variables.

- `OPENAI_API_URL` (required)
- `OPENAI_API_KEY` (required)
- `OPENAI_IMAGE_MODEL` (optional, default `gpt-image-1`)
- `OPENAI_IMAGE_RATIO` (optional, e.g. `16:9` / `4:3`; recommended)
- `OPENAI_IMAGE_ASPECT_RATIO` (optional fallback alias)
- `OPENAI_IMAGE_SIZE` (optional, e.g. `1024x768`, for providers that expect `size`)
- `OPENAI_IMAGE_QUALITY` (optional)
- `OPENAI_IMAGE_STYLE` (optional)

A template is provided at:
- `/Users/tszkinlai/.codex/skills/openai-text-to-image-storyboard/.env.example`

## Command

Use JSON prompt file:

```bash
python /Users/tszkinlai/.codex/skills/openai-text-to-image-storyboard/scripts/generate_storyboard_images.py \
  --project-dir /path/to/project \
  --env-file /Users/tszkinlai/.codex/skills/openai-text-to-image-storyboard/.env \
  --content-name "1_小說章節名稱" \
  --prompts-file /path/to/prompts.json
```

`prompts.json` format:

```json
[
  {
    "title": "雨夜追逐",
    "prompt": "cinematic rain-soaked alley, tense running pose, blue neon reflections, dramatic rim light"
  },
  {
    "title": "地下書庫",
    "prompt": "ancient underground library, floating dust in warm volumetric light, mysterious atmosphere"
  }
]
```

Notes:

- `prompts.json` must be valid JSON.
- For role-related schema (`roles.json` and recurring-role definitions), follow `video-production` or `novel-to-short-video`.
- If the provider ignores `aspect_ratio`, pass `--image-size 1024x768` or set `OPENAI_IMAGE_SIZE=1024x768`.
- You can pass `--api-url` and `--api-key` to override `OPENAI_API_URL` and `OPENAI_API_KEY`.
- When an aspect ratio is set, the script applies center-crop post-processing so outputs still match the target ratio.

## Output Convention

Generated files:

- `pictures/1_小說章節名稱/01_雨夜追逐.png`
- `pictures/1_小說章節名稱/02_地下書庫.png`
- `pictures/1_小說章節名稱/storyboard.json`

If a filename already exists, the script appends `_2`, `_3`, etc. to avoid overwriting.
