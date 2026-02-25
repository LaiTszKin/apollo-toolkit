# Video Production Skill

A Codex skill for long-form video production (more than 10 minutes) that follows user instructions and invokes only the needed dependency skills.

## Capabilities

- Adapts the workflow to user-provided assets instead of forcing a fixed pipeline.
- Uses a long-form chaptered workflow as the default text-to-video path.
- Abstracts a complete long-form story arc and chapter map before generation (unless user locks a structure).
- Enforces final output at `16:9` (default `1920x1080`).
- Ensures `<project_dir>/roles/roles.json` exists first (create if missing), then reuses existing recurring-role prompts and only defines missing roles.
- Regenerates required storyboard images per run (no reuse of previously generated storyboard pictures).
- Calls voice/subtitle generation only when audio or SRT is missing.
- Uses Remotion best practices to compose and render final output.
- Requires timeline animation for long videos to improve audience retention.
- Asks interactive clarifying questions when key information is missing (for example subtitle style, target duration, chapter pacing, and animation style).
- Creates `<project_dir>/docs/long-video-plans/<YYYY-MM-DD>-<content_name>.md` from `references/plan-template.md` before generation and waits for user confirmation.
- Uses a compact plan template with only four sections: meta data, reference text, images needed, and animation plan.
- Defaults to one long-form video unless the user explicitly requests multi-episode output.
- Preserves the Remotion project by default for later edits.
- Maintains Remotion `.gitignore` (including `node_modules/` and build/cache outputs) to keep git projects clean.

## Dependency Skills

- `openai-text-to-image-storyboard`
- `docs-to-voice`
- `remotion-best-practices`

## Typical Inputs

- `project_dir`
- source text (or existing assets)
- `content_name`
- existing role prompt source (optional `prompts.json` or role definitions)
- reference text sources (path/URL + scope notes; no full text embedding in plan)
- target duration (10+ minutes for long-form requests)
- chapter pacing preference
- subtitle style preferences
- animation style preference

## Output Contract

Return absolute paths for:

- plan markdown file (`<project_dir>/docs/long-video-plans/<YYYY-MM-DD>-<content_name>.md`)
- roles.json file (`<project_dir>/roles/roles.json`, used for role reuse/initialization)
- prompts.json file (if used)
- storyboard directory (if used)
- narration audio file (if used)
- subtitle SRT file (if used)
- final rendered long-form MP4 (`16:9`, with planned animations)
- Remotion workspace directory
- Remotion `.gitignore` file path

## Files

- `SKILL.md` - workflow and execution rules
- `agents/openai.yaml` - display metadata and default prompt
- `references/plan-template.md` - pre-generation plan markdown template
- `references/roles-json.md` - recurring-role schema for `roles.json`

## Quick Start

In Codex, call the skill directly:

```text
Use $video-production to generate a long-form video based on my instructions.
```
