# Apollo Toolkit Skills

A curated skill catalog for Codex, OpenClaw, and Trae with a managed installer that keeps the toolkit in `~/.apollo-toolkit` and copies each skill into the targets you choose.

## Included skills

- align-project-documents
- analyse-app-logs
- archive-specs
- answering-questions-with-research
- commit-and-push
- codex-memory-manager
- deep-research-topics
- develop-new-features
- discover-edge-cases
- docs-to-voice
- exam-pdf-workflow
- document-vision-reader
- enhance-existing-features
- feature-propose
- financial-research
- read-github-issue
- generate-spec
- harden-app-security
- improve-observability
- jupiter-development
- katex
- learn-skill-from-conversations
- learning-error-book
- marginfi-development
- maintain-project-constraints
- maintain-skill-catalog
- novel-to-short-video
- open-github-issue
- open-source-pr-workflow
- openai-text-to-image-storyboard
- openclaw-configuration
- production-sim-debug
- recover-missing-plan
- record-spending
- resolve-review-comments
- review-change-set
- review-codebases
- scheduled-runtime-health-check
- shadow-api-model-research
- solana-development
- submission-readiness-check
- systematic-debug
- text-to-short-video
- version-release
- video-production
- weekly-financial-event-report

## Install with npm or npx

### Recommended

```bash
npx @laitszkin/apollo-toolkit
```

The interactive installer:
- shows a branded `Apollo Toolkit` terminal welcome screen with a short staged reveal
- installs a managed copy into `~/.apollo-toolkit`
- lets you multi-select `codex`, `openclaw`, `trae`, or `all`
- copies `~/.apollo-toolkit/<skill>` into each selected target
- removes stale previously installed skill directories that existed in the previous installed version but no longer exist in the current package skill list
- replaces legacy symlink-based installs created by older Apollo Toolkit installers with real copied directories

### Global install

```bash
npm i -g @laitszkin/apollo-toolkit
apltk
apollo-toolkit
```

Global install 後，`apltk` 與 `apollo-toolkit` 都會啟動同一個 Apollo Toolkit CLI。直接執行 `apltk` 會打開互動安裝頁，並在互動模式下先檢查 npm registry 是否有新版可用；若有，CLI 會先詢問，再自動執行全域更新。

### Non-interactive install

```bash
npx @laitszkin/apollo-toolkit codex
npx @laitszkin/apollo-toolkit codex openclaw
npx @laitszkin/apollo-toolkit all
```

### Optional overrides

```bash
APOLLO_TOOLKIT_HOME=~/custom-toolkit npx @laitszkin/apollo-toolkit codex
CODEX_SKILLS_DIR=~/custom-codex-skills npx @laitszkin/apollo-toolkit codex
OPENCLAW_HOME=~/.openclaw npx @laitszkin/apollo-toolkit openclaw
TRAE_SKILLS_DIR=~/.trae/skills npx @laitszkin/apollo-toolkit trae
```

## Local installer scripts

Installers still live in `scripts/` for local repository usage and curl / iwr installation:

- macOS/Linux: `scripts/install_skills.sh`
- Windows (PowerShell): `scripts/install_skills.ps1`

### Local usage

```bash
./scripts/install_skills.sh
./scripts/install_skills.sh codex
./scripts/install_skills.sh openclaw
./scripts/install_skills.sh trae
./scripts/install_skills.sh all
```

```powershell
./scripts/install_skills.ps1
./scripts/install_skills.ps1 codex
./scripts/install_skills.ps1 all
```

### Curl / iwr one-liners

```bash
curl -fsSL https://raw.githubusercontent.com/LaiTszKin/apollo-toolkit/main/scripts/install_skills.sh | bash
curl -fsSL https://raw.githubusercontent.com/LaiTszKin/apollo-toolkit/main/scripts/install_skills.sh | bash -s -- codex
```

```powershell
irm https://raw.githubusercontent.com/LaiTszKin/apollo-toolkit/main/scripts/install_skills.ps1 | iex
```

In curl / iwr mode, the scripts clone or update the managed toolkit copy under `~/.apollo-toolkit` by default. Override with `APOLLO_TOOLKIT_HOME` if you need a different location.

## External dependency skills

The install commands below were checked with the Skills CLI unless otherwise noted.

| Skill name | Used by | Author / producer | Install command / note |
| --- | --- | --- | --- |
| `pdf` | `deep-research-topics`, `exam-pdf-workflow`, `financial-research`, `learning-error-book`, `weekly-financial-event-report` | OpenAI (`openai/skills`) | `npx skills add openai/skills@pdf -g -y` |
| `doc` | `deep-research-topics` (optional Word output) | OpenAI (`openai/skills`) | `npx skills add openai/skills@doc -g -y` |
| `slides` | `deep-research-topics` (optional slide output) | OpenAI (`openai/skills`) | `npx skills add openai/skills@slides -g -y` |
| `spreadsheet` | `record-spending` | OpenAI (`openai/skills`) | `npx skills add openai/skills@spreadsheet -g -y` |
| `skill-creator` | `learn-skill-from-conversations` | OpenAI (`openai/skills`) | `npx skills add openai/skills@skill-creator -g -y` |
| `remotion-best-practices` | `novel-to-short-video`, `video-production` | Remotion (`remotion-dev/skills`) | `npx skills add remotion-dev/skills@remotion-best-practices -g -y` |
| `code-simplifier` | `open-source-pr-workflow` | Sentry (`getsentry/skills`) | `npx skills add getsentry/skills@code-simplifier -g -y` |

Compatibility note:

- `generate-spec` is a local skill used by `develop-new-features` and `enhance-existing-features`.
- `recover-missing-plan` is a local skill used by `enhance-existing-features` and `ship-github-issue-fix` when a referenced `docs/plans/...` spec set is missing or archived.
- `maintain-skill-catalog` can conditionally use `find-skills`, but its install source is not verified in this repository, so it is intentionally omitted from the table.
- `read-github-issue` uses GitHub CLI (`gh`) directly for remote issue discovery and inspection, so it does not add any extra skill dependency.

## Release publishing

GitHub Releases can publish the npm package automatically through npm Trusted Publishing.

Before the workflow can succeed, configure the npm package to trust this GitHub repository and the publish workflow. After that, creating a GitHub Release will trigger `.github/workflows/publish-npm.yml` and run `npm publish --provenance --access public`.

## Notes

- This repository is intended for personal toolkit curation and experimentation.
- Skill folders are stored as regular files, not git submodules.
