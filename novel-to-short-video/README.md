# novel-to-short-video

A Codex skill that converts novel content into a 50-60 second loopable short video.

This skill will:

- Select exactly one highest-impact, high-tension core segment from the novel
- Ensure the selected segment forms a complete mini-story that works standalone
- Keep one meaningful unresolved hook at the end to sustain curiosity
- Create a pre-production plan first using `references/plan-template.md` (`docs/plans/<date>-<chapter>.md`)
- Start image/voice/render steps only after explicit user approval of the plan
- Generate a loop-closure narration script (opening and ending call back to each other)
- Ensure `<project_dir>/roles/roles.json` exists before prompt generation; reuse existing roles and append only missing roles (schema in `references/roles-json.md`)
- Generate scene images via text-to-image
- Generate narration audio and subtitles
- Enforce narration pacing to 3-4 CJK chars per second
- Assemble and render with Remotion, apply beat-level focus effects, and keep the Remotion project for further edits

## Dependency skills

- `openai-text-to-image-storyboard`
- `docs-to-voice`
- `remotion-best-practices`

## Repository layout

```text
novel-to-short-video/
├── SKILL.md
├── agents/
│   └── openai.yaml
├── references/
│   ├── plan-template.md
│   └── roles-json.md
├── README.md
└── LICENSE
```

## Usage

1. Place this folder under your Codex skills directory.
2. Trigger it in chat with `$novel-to-short-video`.
3. Provide `project_dir`, `content_name`, and novel content.
4. The skill first generates a plan markdown under `docs/plans/` and waits for your approval.
5. After approval, it generates images, narration, subtitles, and the final short video.

## Output guarantees

- Each short video stays within **50-60 seconds**
- Narration pacing remains **3-4 chars/sec** (validated by char count ÷ audio duration)
- Exactly **one** highest-impact core segment is selected
- One segment maps to one full video (segment-to-video 1:1)
- Story is standalone (clear setup/conflict/turn/outcome) with one unresolved ending question
- Plan file is created first: `<project_dir>/docs/plans/<YYYY-MM-DD>-<chapter_slug>.md`
- Plan uses `references/plan-template.md`, and all placeholders are removed after filling
- Role registry file: `<project_dir>/roles/roles.json` (shared between short-form and long-form workflows, reuses existing roles, appends only missing roles; schema in `references/roles-json.md`)
- Ending line and final visuals tie back to the opening for loop closure
- Beat-level effects are applied (`hook / escalation / climax / loop-closure`) with controlled intensity to avoid harming subtitle readability
- Remotion project is preserved by default for manual refinement

## License

This project is licensed under the [MIT License](./LICENSE).
