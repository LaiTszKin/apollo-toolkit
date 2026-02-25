# Changelog

All notable changes to this project will be documented in this file.

## [0.3.1] - 2026-02-18

### Changed
- Require narration pacing target of 3-4 CJK chars/second in the short-video workflow and planning documents.
- Add post-generation pacing validation loop for voice assets using timeline duration and character count.
- Update README and default agent prompt so voice generation explicitly enforces short-video speech rhythm.

## [0.3.0] - 2026-02-17

### Changed
- Move shared role registry path to `<project_dir>/roles/roles.json` and align workflow docs/prompt references.
- Require pre-production plans to include beat-level audience-focus special-effect cues and intensity guardrails.
- Expand Remotion composition workflow to load animation/light-leak guidance and apply controlled effects across hook, escalation, climax, and loop-closure beats.
- Update README, output contract, and default agent prompt to explicitly include attention-retention special effects in final video production.
- Update plan template with per-beat `focus effect` fields and an `Audience Focus Effects` section.

## [0.2.2] - 2026-02-17

### Changed
- Add required workflow step to create `<project_dir>/pictures/<content_name>/roles.json` before image generation.
- Require `roles.json` to store recurring character prompt skeletons with the `openai-text-to-image-storyboard` schema.
- Require role prompt reuse: read existing `roles.json` first and reuse matched roles.
- Only append new role prompts when required roles are missing, instead of recreating all role entries.
- Update README, output contract, quality checklist, and default agent prompt to include roles file handling.

## [0.2.1] - 2026-02-16

### Changed
- Strengthen selection criteria to require a standalone mini-story arc plus lingering-question potential.
- Update plan template with standalone-story basis, lingering question, and story satisfaction checks.
- Update README and default agent prompt to explicitly enforce "完整但意猶未盡" narrative outcomes.

## [0.2.0] - 2026-02-16

### Changed
- Replace 3-scene extraction with single highlight-segment extraction for stronger short-video focus.
- Update planning template to a single-segment structure with beat-level timing and asset planning.
- Align skill workflow, quality gate checklist, README, and agent default prompt with the 50-60 second single-segment pipeline.

## [0.1.0] - 2026-02-16

### Added
- Require a pre-production plan markdown before generation, including scenes, per-scene scripts, and image lists.
- Add `references/plan-template.md` as the canonical plan template with bracketed placeholders.
- Add workflow gate requiring explicit user approval of the plan before image, voice, and render steps.

### Changed
- Update skill workflow numbering and quality checks to enforce plan-first execution.
- Update README and default agent prompt to match the new plan approval flow.
