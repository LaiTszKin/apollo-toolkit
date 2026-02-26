# text-to-short-video

A Codex skill that converts articles, scripts, chapters, or notes into 30-60 second short videos (API-only workflow).

This skill will:

- Extract a short-video prompt from input text (or use a user-locked prompt directly)
- Use `roles.json` to keep character consistency (existing roles only update `description`)
- Call an OpenAI-compatible video generation API directly
- Poll job status until completion and download MP4 output
- Apply optional aspect-ratio/size post-processing when needed

## Dependency skills

No mandatory dependencies.

> This skill does not use `openai-text-to-image-storyboard` or `remotion-best-practices`.

## Character consistency (`roles.json`)

- Role file path is fixed: `<project_dir>/pictures/<content_name>/roles.json`
- JSON schema uses a `characters` array with fields:
  - `id`
  - `name`
  - `appearance`
  - `outfit`
  - `description`
- To preserve consistency: existing roles may only update `description`; do not rewrite `id/name/appearance/outfit`

## Environment setup

1. Copy env template:

```bash
cp /Users/tszkinlai/.codex/skills/text-to-short-video/.env.example \
   /Users/tszkinlai/.codex/skills/text-to-short-video/.env
```

2. Required values:

- `OPENAI_API_URL`
- `OPENAI_API_KEY`

3. Optional values:

- `OPENAI_VIDEO_MODEL`
- `OPENAI_VIDEO_DURATION_SECONDS`
- `OPENAI_VIDEO_ASPECT_RATIO`
- `OPENAI_VIDEO_SIZE`
- `OPENAI_VIDEO_POLL_SECONDS`
- `TEXT_TO_SHORT_VIDEO_WIDTH`
- `TEXT_TO_SHORT_VIDEO_HEIGHT`

## Aspect-ratio correction (optional post-processing)

If API-generated video ratio/size does not match the target, run:

```bash
python /Users/tszkinlai/.codex/skills/text-to-short-video/scripts/enforce_video_aspect_ratio.py \
  --input-video "<downloaded_video_path>" \
  --output-video "<final_output_video_path>" \
  --env-file /Users/tszkinlai/.codex/skills/text-to-short-video/.env \
  --force
```

## Repository layout

```text
text-to-short-video/
├── SKILL.md
├── README.md
├── LICENSE
├── .env.example
├── agents/
│   └── openai.yaml
└── scripts/
    └── enforce_video_aspect_ratio.py
```

## License

This project is licensed under [MIT License](./LICENSE).
