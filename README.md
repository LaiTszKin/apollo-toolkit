# Apollo Toolkit Skills

A curated copy of selected OpenClaw/Codex skill folders from `~/.codex/skills`.

## Included skills

- align-project-documents
- analyse-app-logs
- answering-questions-with-research
- commit-and-push
- develop-new-features
- generate-spec
- docs-to-voice
- discover-edge-cases
- enhance-existing-features
- feature-propose
- financial-research
- fix-github-issues
- review-change-set
- resolve-review-comments
- review-codebases
- learning-error-book
- learn-skill-from-conversations
- maintain-skill-catalog
- maintain-project-constraints
- novel-to-short-video
- open-github-issue
- open-source-pr-workflow
- openai-text-to-image-storyboard
- record-spending
- harden-app-security
- improve-observability
- weekly-financial-event-report
- systematic-debug
- specs-to-project-docs
- deep-research-topics
- text-to-short-video
- version-release
- video-production

## External dependency skills

I scanned the standardized `## Dependencies` section across the tracked Apollo Toolkit skills and listed the dependencies that are not vendored in this repository. I also confirmed the local Codex skill names from `~/.codex/skills`; the correct names are `doc`, `spreadsheet`, and `slides` (note: `spreadsheet` is singular).

The install commands below were checked with the Skills CLI unless otherwise noted.

| Skill name | Used by | Author / producer | Install command / note |
| --- | --- | --- | --- |
| `pdf` | `deep-research-topics`, `financial-research`, `learning-error-book`, `weekly-financial-event-report` | OpenAI (`openai/skills`) | `npx skills add openai/skills@pdf -g -y` |
| `doc` | `deep-research-topics` (optional Word output) | OpenAI (`openai/skills`) | `npx skills add openai/skills@doc -g -y` |
| `slides` | `deep-research-topics` (optional slide output) | OpenAI (`openai/skills`) | `npx skills add openai/skills@slides -g -y` |
| `spreadsheet` | `record-spending` | OpenAI (`openai/skills`) | `npx skills add openai/skills@spreadsheet -g -y` |
| `skill-creator` | `learn-skill-from-conversations` | OpenAI (`openai/skills`) | `npx skills add openai/skills@skill-creator -g -y` |
| `remotion-best-practices` | `novel-to-short-video`, `video-production` | Remotion (`remotion-dev/skills`) | `npx skills add remotion-dev/skills@remotion-best-practices -g -y` |
| `code-simplifier` | `open-source-pr-workflow` | Sentry (`getsentry/skills`) | `npx skills add getsentry/skills@code-simplifier -g -y` |

Compatibility note:

- `generate-spec` is a new local skill used by `develop-new-features` and `enhance-existing-features`; it is intentionally not listed as an external dependency.
- `maintain-skill-catalog` can conditionally use `find-skills`, but its install source is not verified in this repository, so it is intentionally omitted from the install table instead of guessing a package name.
- `fix-github-issues` accepts `open-source-pr-workflow` or an environment alias named `open-pr-workflow`. Apollo Toolkit already vendors `open-source-pr-workflow`, so `open-pr-workflow` is not a required external dependency here.

## One-click installer

Installers now live in `scripts/`:

- macOS/Linux: `scripts/install_skills.sh`
- Windows (PowerShell): `scripts/install_skills.ps1`

### Local usage

```bash
# Select install options interactively (supports multiple choices)
./scripts/install_skills.sh

# Install into ~/.codex/skills
./scripts/install_skills.sh codex

# Install into ~/.openclaw/workspace*/skills
./scripts/install_skills.sh openclaw

# Install into ~/.trae/skills
./scripts/install_skills.sh trae

# Install all targets
./scripts/install_skills.sh all
```

```powershell
# Select install options interactively (supports multiple choices)
./scripts/install_skills.ps1

# Install into ~/.codex/skills
./scripts/install_skills.ps1 codex

# Install all targets
./scripts/install_skills.ps1 all
```

### Curl / iwr one-liner usage

```bash
# macOS/Linux interactive install (stdin is piped, prompt still works)
curl -fsSL https://raw.githubusercontent.com/LaiTszKin/apollo-toolkit/main/scripts/install_skills.sh | bash

# macOS/Linux non-interactive install
curl -fsSL https://raw.githubusercontent.com/LaiTszKin/apollo-toolkit/main/scripts/install_skills.sh | bash -s -- codex
```

In curl/pipe mode (bash) and iwr/irm mode (PowerShell), the script auto-clones this repository into `~/.apollo-toolkit-repo` (override via `APOLLO_TOOLKIT_REPO_DIR`).

```powershell
# Windows PowerShell interactive install
irm https://raw.githubusercontent.com/LaiTszKin/apollo-toolkit/main/scripts/install_skills.ps1 | iex

# Windows PowerShell non-interactive install
$script = Join-Path $env:TEMP "install_skills.ps1"
iwr https://raw.githubusercontent.com/LaiTszKin/apollo-toolkit/main/scripts/install_skills.ps1 -OutFile $script
& $script codex
```

The installer replaces existing files/directories at target paths and keeps only symlinks (PowerShell falls back to junction links when symlinks are restricted).

## Notes

- This repository is intended for personal toolkit curation and experimentation.
- Skill folders were copied as regular files (not git submodules).
