# Apollo Toolkit Skills

A curated copy of selected OpenClaw/Codex skill folders from `~/.codex/skills`.

## Included skills

- app-log-issue-analysis
- commit-and-push
- develop-new-features
- docs-to-voice
- edge-case-test-fixer
- enhance-existing-features
- feature-propose
- github-issue-fix-pr-workflow
- learn-skill-from-conversations
- novel-to-short-video
- open-source-pr-workflow
- openai-text-to-image-storyboard
- security-expert-hardening
- systematic-debug
- text-to-short-video
- version-release
- video-production

## One-click installer

Use `install_skills.sh` to install all skills as symlinks.

```bash
# Select install options interactively (supports multiple choices)
./install_skills.sh

# Install into ~/.codex/skills
./install_skills.sh codex

# Install into ~/.openclaw/workspace*/skills
./install_skills.sh openclaw

# Install into ~/.trae/skills
./install_skills.sh trae

# Install all targets
./install_skills.sh all
```

The installer replaces existing files/directories at target paths and keeps only symlinks.

## Notes

- This repository is intended for personal toolkit curation and experimentation.
- Skill folders were copied as regular files (not git submodules).
