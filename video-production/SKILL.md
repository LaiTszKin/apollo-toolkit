---
name: video-production
description: Generate long-form videos (more than 10 minutes) by following user instructions and invoking related skills only when needed (`openai-text-to-image-storyboard`, `docs-to-voice`, `remotion-best-practices`). For text inputs, extract a complete long-form story arc, generate fresh storyboard images (no reuse of previously generated pictures), and render a 16:9 animated long-form video.
---

# Video Production

## Core Rules

1. Follow user instructions first. Use the required execution sequence below unless the user explicitly overrides it.
2. For text-driven requests, use a long-form pipeline by default and target final output longer than 10 minutes.
3. Before generation, turn source text into a coherent long-form structure (hook, chapter progression, and closing).
4. The final output aspect ratio must be `16:9` (default resolution: `1920x1080`).
5. Role prompt policy for prompt generation:
   - always ensure `<project_dir>/roles/roles.json` exists before any prompt generation
   - if a recurring role already has a defined prompt skeleton, reuse it without rewriting identity fields
   - if a recurring role appears but is not defined, generate new role entries using the supported `prompts.json` schema
6. Call only relevant dependency skills:
   - `openai-text-to-image-storyboard`: generate storyboard images when user did not provide usable visuals
   - `docs-to-voice`: generate narration/timeline/SRT when user did not provide audio or subtitles
   - `remotion-best-practices`: compose and render the final long-form output
7. Do not reuse previously generated storyboard pictures. Generate fresh images for each run unless the user provides external assets to use.
8. Long-form videos must include timeline animation to maintain audience focus (for example pan/zoom, parallax, controlled camera moves, and chapter transitions).
9. Before any asset generation or rendering, create a plan markdown in `<project_dir>/docs/long-video-plans/` and wait for explicit user confirmation.
10. Never ask the user whether to output a single video or multiple episodes.
   - If the user explicitly asks for episodes/parts, produce multi-episode output.
   - Otherwise default to one full long video.
11. Keep Remotion project files unless the user explicitly asks for cleanup.
12. Keep git repositories clean by ensuring Remotion dependency/build/cache artifacts are ignored.

## Required Execution Sequence

When this skill is triggered, run the production stages in this order:

1. Generate the production plan markdown and wait for explicit user confirmation before any generation.
2. Check whether images are needed; generate missing images with `openai-text-to-image-storyboard` (fresh generation only, no reuse of previously generated pictures).
3. Generate the narration/audio track with `docs-to-voice` when usable audio is not already provided.
4. Use `remotion-best-practices` to combine prepared assets (images, audio/subtitles, and planned animations) into the final `16:9` long-form video.

## Interactive Clarification (Required)

Before running generation commands, check whether details are sufficient. If not, ask concise targeted questions and wait for user replies.
Do not guess preference-sensitive options.

Prioritize asking these missing items:

- target total duration (default recommendation: 10-15 minutes when user says long video)
- chapter pacing (chapter count or average chapter duration)
- subtitle style (font, size, color, stroke/background, position, max lines)
- narration language/voice tone (if narration must be generated)
- visual style keywords (if storyboard images must be generated)
- animation style preference (subtle/cinematic/dynamic, transition density, motion intensity)
- existing role prompt source (user-provided prompt file or existing `<project_dir>/pictures/<content_name>/prompts.json`) when recurring roles are expected
- output location / filename rules when not obvious

Ask only the minimum set required to unblock progress.

## Inputs to Collect

Collect only what is needed for the requested job (not everything by default):

- `project_dir`
- `content_name`
- source script/text (unless the user provides complete audio + subtitles)
- extracted long-form story arc with chapter breakdown (unless user provides an exact chapter structure)
- source reference set (file paths/URLs and scope notes; do not inline full long text in plan)
- final transcript text used for narration/subtitles
- existing prompt assets (`prompts.json`, character roster, or user-defined role prompts)
- user-provided assets (images, audio, subtitles, branding)
- animation direction for chapter segments
- output requirements from user instructions

## Workflow

### 1) Read user intent and choose skill calls

Create a concise execution checklist:

- what the user already provided
- what still needs generation
- whether to run the long-form text path or fallback asset path
- which dependency skills will be called
- where animation beats are required in the timeline
- what will be skipped

### 2) Abstract long-form story arc and chapter timing (text-first path)

When the request includes source text and the user did not lock a specific structure:

- extract one self-contained long-form narrative arc suitable for a 10+ minute video
- split content into chapters with clear transitions and duration targets
- preserve original wording for key hooks and turning points whenever possible
- ensure narrative continuity (setup -> development -> escalation -> payoff/closing)
- define chapter-level animation intent to avoid long static visual stretches

If the user already provides an exact chapter structure, reuse it directly and skip abstraction for those parts.

### 3) Resolve role prompt reuse and ensure `roles.json` exists before prompt generation

Before generating or updating `prompts.json`:

1. detect recurring roles across all chapters
2. set target role file path:
   - `<project_dir>/roles/roles.json`
3. if `roles.json` exists, read it first and reuse matching roles
4. if `roles.json` does not exist, create it first using `references/roles-json.md`
   - include detected recurring roles when available
   - if no recurring roles are detected, initialize with `{"characters": []}`
5. load reusable prompt sources in this order:
   - user-provided prompt file or role definitions
   - existing `<project_dir>/pictures/<content_name>/prompts.json` (if present)
6. apply role policy:
   - defined role: reuse existing role skeleton following `references/roles-json.md`
   - undefined role: add a new role entry following `references/roles-json.md`
7. choose schema:
   - use structured format with `characters` + `scenes` when recurring roles exist
   - use simple list format only when no recurring roles need continuity

### 4) Create production plan markdown and wait for confirmation

Before generating images/audio/subtitles/video:

- create directory `<project_dir>/docs/long-video-plans/` if missing
- create a plan file named `<YYYY-MM-DD>-<content_name>.md`
- load the reference template at `references/plan-template.md`
- copy the template into the plan file first, then fill it
- use local date for `YYYY-MM-DD`; sanitize `content_name` for filename safety
- keep this long-video plan location separate from short-video plans (`<project_dir>/docs/plans/`)
- include only these sections:
  - `## Meta Data`
  - `## Reference Text`
  - `## Images Needed To Be Generated`
  - `## Animation Plan For Audience Retention`
- in `Meta Data`, include compact runtime/layout/output metadata and keep aspect ratio at `16:9`
- in `Reference Text`, include only source references (file paths/URLs + range/scope + purpose), not full long text
- in `Images Needed To Be Generated`, list every image required for this run and mark all as fresh generation (no generated-image reuse)
- in `Animation Plan For Audience Retention`, include chapter-level animation type, transition, and focus goal
- replace all square-bracket placeholders with concrete content
- remove all square-bracket placeholder/instruction text before sharing the plan for confirmation
- return the absolute plan file path to the user and ask for explicit confirmation
- do not run generation/render commands until user confirms the plan document

### 5) Generate and integrate the long-form video in required order (default path)

After plan confirmation:

- run `openai-text-to-image-storyboard` for all approved storyboard assets that need generation in the current run
- generate narration/subtitles chapter-by-chapter with `docs-to-voice` when needed
- compose one continuous Remotion timeline with `remotion-best-practices`
  - maintain `16:9` output
  - apply planned animation beats across opening, middle, and closing chapters
  - avoid long static holds by using motion or transition treatment
- verify total rendered runtime is longer than 10 minutes unless the user explicitly requested shorter
- verify animation is present in the final render and aligns with the approved plan

### 6) Keep reusable project artifacts

Default workspace:

- `<project_dir>/video/<content_name>/remotion/`

Keep Remotion sources by default unless the user explicitly requests cleanup.

Git hygiene (required):

- create or update `<project_dir>/video/<content_name>/remotion/.gitignore`
- do not remove user-defined ignore rules already in that file
- ensure it includes at least these entries:
  - `node_modules/`
  - `.cache/`
  - `dist/`
  - `build/`
  - `out/`
  - `.DS_Store`
  - `*.log`

## Output Contract

Return absolute paths for produced artifacts:

- plan markdown file (`<project_dir>/docs/long-video-plans/<YYYY-MM-DD>-<content_name>.md`)
- `roles.json` file used for role reuse/initialization (`<project_dir>/roles/roles.json`)
- `prompts.json` file used for generation
- storyboard directory (if generated or used; generated storyboard images must be fresh for this run)
- narration audio file (if generated or used)
- subtitle SRT file (if generated or used)
- final long-form MP4 in `16:9` with planned animations
- Remotion workspace directory
- Remotion `.gitignore` file path

Also report:

- extracted long-form structure summary (and whether it was user-locked or agent-abstracted)
- chapter duration summary and total runtime
- animation plan summary (planned vs actual)
- role prompt reuse summary (reused vs newly defined roles)
- what assumptions were clarified through interactive questions
- subtitle sync verification (first/middle/last cue spot check)
- generated-image policy verification (fresh generation confirmed, no generated-image reuse)
