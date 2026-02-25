# Apollo Toolkit Skills

A curated copy of selected OpenClaw/Codex skill folders from `~/.codex/skills`.

## Included skills

- app-log-issue-analysis
- develop-new-features
- docs-to-voice
- edge-case-test-fixer
- enhance-existing-features
- feature-propose
- learn-skill-from-conversations
- novel-to-short-video
- open-source-pr-workflow
- openai-text-to-image-storyboard
- security-expert-hardening
- submit-changes
- systematic-debug
- text-to-short-video
- video-production

## One-click installer

Use `install_skills.sh` to install all skills as symlinks.

```bash
# Select mode interactively
./install_skills.sh

# Install into ~/.codex/skills
./install_skills.sh codex

# Install into ~/.openclaw/workspace*/skills
./install_skills.sh openclaw
```

The installer replaces existing files/directories at target paths and keeps only symlinks.

## Notes

- This repository is intended for personal toolkit curation and experimentation.
- Skill folders were copied as regular files (not git submodules).
