# text-to-short-video

把文章、腳本、章節、筆記轉成 30–60 秒短影片的 Codex Skill（API-only 版本）。

此 Skill 會：

- 從文字抽出一段短影片提示詞（或直接使用使用者鎖定 prompt）
- 使用 `roles.json` 維持角色一致性（既有角色只改 `description`）
- 直接呼叫 OpenAI 相容的影片生成 API
- 輪詢任務直到完成並下載 MP4
- 必要時執行比例/尺寸後處理

## 依賴 Skills

無強制依賴。

> 此 skill 不使用 `openai-text-to-image-storyboard` 與 `remotion-best-practices`。

## 角色一致性（roles.json）

- 角色檔固定使用：`<project_dir>/pictures/<content_name>/roles.json`
- JSON 格式固定為 `characters` 陣列，角色欄位包含：
  - `id`
  - `name`
  - `appearance`
  - `outfit`
  - `description`
- 為了保持一致性：既有角色只能更新 `description`，不得改寫 `id/name/appearance/outfit`

## 環境設定

1. 複製環境範本：

```bash
cp /Users/tszkinlai/.codex/skills/text-to-short-video/.env.example \
   /Users/tszkinlai/.codex/skills/text-to-short-video/.env
```

2. 至少填入：

- `OPENAI_API_URL`
- `OPENAI_API_KEY`

3. 可選設定：

- `OPENAI_VIDEO_MODEL`
- `OPENAI_VIDEO_DURATION_SECONDS`
- `OPENAI_VIDEO_ASPECT_RATIO`
- `OPENAI_VIDEO_SIZE`
- `OPENAI_VIDEO_POLL_SECONDS`
- `TEXT_TO_SHORT_VIDEO_WIDTH`
- `TEXT_TO_SHORT_VIDEO_HEIGHT`

## 比例修正（後處理，可選）

當 API 生成影片比例或尺寸與目標不一致時，執行：

```bash
python /Users/tszkinlai/.codex/skills/text-to-short-video/scripts/enforce_video_aspect_ratio.py \
  --input-video "<downloaded_video_path>" \
  --output-video "<final_output_video_path>" \
  --env-file /Users/tszkinlai/.codex/skills/text-to-short-video/.env \
  --force
```

## 檔案結構

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

本專案採用 [MIT License](./LICENSE)。
