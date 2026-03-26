# Changelog

All notable changes to this repository are documented in this file.

## [Unreleased]

## [v2.11.4] - 2026-03-27

### Added
- Add `production-sim-debug` for investigating production or local simulation runs, separating harness realism gaps from runtime bugs, and validating fixes by rerunning the same bounded scenario.
- Add `ship-github-issue-fix` for taking a remote GitHub issue through implementation and direct push to a requested branch without opening a PR or performing release work.

### Changed
- Update `read-github-issue` to prefer bundled issue scripts while falling back to raw `gh issue list` and `gh issue view` commands when repository-specific helpers are missing or fail.
- Strengthen `commit-and-push` and `version-release` so sequential git mutations must verify the remote branch tip and release tag before reporting success or publishing a release.
- Refresh repository capability docs and skill inventory to include direct issue-shipping and production simulation debugging workflows.

## [v2.11.3] - 2026-03-24

### Added
- Add bundled `analyse-app-logs` scripts for filtering logs by bounded time windows and searching by keyword or regex, with focused tests for both helpers.
- Add `read-github-issue` as a dedicated GitHub issue discovery skill with bundled scripts for finding issue candidates and reading a specific issue with comments.

### Changed
- Expand `open-github-issue` to support structured `performance`, `security`, `docs`, and `observability` issue categories in addition to `problem` and `feature`.
- Refocus the former `fix-github-issues` workflow into read-only GitHub issue discovery and inspection guidance instead of a hardcoded fixing workflow.
- Update repository capability docs and agent prompts to reflect the new GitHub issue-reading and log-search workflows.

## [v2.11.2] - 2026-03-23

### Changed
- Update `develop-new-features` and `enhance-existing-features` so small localized work such as bug fixes, pure frontend polish, and simple adjustments can skip spec generation, while non-trivial feature work still uses approval-backed specs.
- Strengthen `generate-spec` so spec creation must verify relevant official documentation for external dependencies before writing requirements or scope.
- Refine spec templates so `spec.md` uses dedicated `In Scope` and `Out of Scope` sections, checklist completion uses structured completion records, and E2E versus integration decisions support multiple per-flow records without encouraging false checkbox completion.

## [v2.11.1] - 2026-03-23

### Changed
- Add a dedicated GitHub Actions validation job for `SKILL.md` description length checks.
- Enforce a maximum `description` length of 1024 characters in `scripts/validate_skill_frontmatter.py`.
- Shorten `enhance-existing-features` metadata so its `description` stays within the loader limit without changing intent.

## [v2.11.0] - 2026-03-23

### Added
- Add `exam-pdf-workflow` for turning lecture slides, past papers, and answer books into mock exams, worked solutions, study notes, or graded PDFs with KaTeX-rendered math when needed.

### Changed
- Update `develop-new-features` and `enhance-existing-features` so approved spec-backed work must continue through all in-scope tasks, applicable checklist items, testing, and backfill before yielding unless scope changes or an external blocker prevents safe completion.
- Update `generate-spec` to require creating a distinct plan directory when adjacent work is not actually covered by an existing plan set.
- Update `archive-specs`, `commit-and-push`, and `version-release` to better distinguish completed planning scope from still-active follow-up work before archiving or conversion.
- Refresh repository skill inventory and project capability docs to include `exam-pdf-workflow` and its `pdf` dependency.

## [v2.10.0] - 2026-03-21

### Added
- Add `document-vision-reader` for screenshot-based inspection of rendered documents when visible layout matters more than raw extracted text.
- Add `katex` for rendering and embedding math formulas with official KaTeX guidance and reusable render scripts.

### Changed
- Rework `learning-error-book` to generate separate multiple-choice and long-answer reference JSON files plus polished PDFs rendered directly from structured data.
- Update the repository skill inventory and project capability docs to include the new document-vision and KaTeX workflows.


## [v2.9.0] - 2026-03-21

### Changed
- Update `scheduled-runtime-health-check` to run requested commands in a background terminal immediately or within a requested time window, with optional pre-run safe updates and optional post-run log findings.
- Update `open-github-issue` to require explicit BDD-style expected behavior, current behavior, and behavior-gap content for problem issues, and enforce that contract in the bundled publisher script and docs.

## [v2.8.0] - 2026-03-21

### Changed
- Change the npm installer and local install scripts to copy managed skill directories into selected targets instead of creating symlinks.
- Replace legacy Apollo Toolkit symlink installs with real copied skill directories during reinstall, while still removing stale skills that no longer ship in the current version.
- Normalize every repository `LICENSE` file to the MIT template owned by `LaiTszKin`.

## [v2.7.0] - 2026-03-20

### Added
- Add `openclaw-configuration` for explaining, editing, validating, and troubleshooting OpenClaw configuration from the current official docs, including `~/.openclaw/openclaw.json`, skills config, secrets, and CLI workflows.
- Add bundled OpenClaw configuration references covering the official doc map, config option guide, and operational best practices.

### Changed
- Update `fix-github-issues` to require temporary worktree and local branch cleanup as part of direct-push or PR completion, with explicit cleanup verification before finishing.
- Update `learn-skill-from-conversations` to treat post-completion cleanup or finalization follow-ups as evidence that the owning workflow's done criteria need tightening.
- Update the repository skill inventory and project capability docs to include OpenClaw configuration support.

## [v2.6.0] - 2026-03-20

### Added
- Add `jupiter-development` for building Jupiter-based Solana integrations from current official docs, including swap, token, price, lend, trigger, recurring, and portfolio surfaces.
- Add `marginfi-development` for building or reviewing marginfi integrations with official SDK, CLI, protocol, and The Arena references.
- Add `solana-development` for native Solana Rust programs and Rust client workflows grounded in official Solana documentation.

### Changed
- Update `learn-skill-from-conversations` to prefer inventorying the current skill catalog, weighting user corrections and error-driven lessons more heavily, and tightening when to update an existing skill versus creating a new one.
- Update `codex-memory-manager` so memory reports include already-stored relevant preferences when users ask what memory exists or why a known preference was omitted.
- Refresh new protocol reference snapshots against current official Jupiter, marginfi, and Solana docs before release.

## [v2.5.0] - 2026-03-19

### Changed
- Rename `specs-to-project-docs` to `archive-specs` and refocus the skill on converting completed specs into project docs while archiving the consumed planning files.
- Update `develop-new-features` and `enhance-existing-features` so completed work must backfill requirement completion status in `spec.md` alongside `tasks.md` and `checklist.md`.
- Update `commit-and-push` and `version-release` to treat planning-file checkboxes semantically during conversion, and to invoke `archive-specs` when completed spec sets should become project documentation.
- Update the npm installer to remove stale linked skills that no longer exist in the latest packaged skill list during managed installs.

### Removed
- Remove the `codex-subagent-orchestration` skill and clean related multi-agent guidance from affected skill documents.

## [v2.4.3] - 2026-03-19

### Changed
- Clarify `codex-subagent-orchestration` guidance so delegated custom-agent creation steps include the required context for agent-creation tooling.

## [v2.4.2] - 2026-03-19

### Changed
- Relax `codex-subagent-orchestration` so reusable custom agents no longer require repeated historical use before creation or persistence.
- Require agents to abstract task-specific delegation into the most general reusable role that still preserves clear ownership boundaries, such as `code_reviewer` before narrower one-off task agents.
- Clarify when domain-specific specialization such as `rust_reviewer` is warranted and when a generic reusable reviewer should be preferred.

## [v2.4.1] - 2026-03-19

### Changed
- Tighten `codex-subagent-orchestration` so non-trivial tasks must use actual subagent tool calls when delegation is allowed, instead of stopping at prose-only delegation guidance.
- Require `codex-subagent-orchestration` to default to a parallel subagents workflow whenever two or more independent workstreams can run safely in parallel.
- Clarify runtime handoff and orchestration boundaries for delegated agents, including tool-rule, sandbox, write-scope, and isolated-review expectations.

## [v2.4.0] - 2026-03-19

### Added
- Add `codex-memory-manager` for reviewing the last 24 hours of Codex chats, storing durable preference memory, and syncing a managed memory index into `~/.codex/AGENTS.md`.
- Add extractor and index-sync helper scripts plus focused tests for the new Codex memory workflow.

### Changed
- Update `codex-subagent-orchestration` guidance, prompts, and routing notes to require explicit subagent spawning language for non-trivial tasks.

### Removed
- Remove the standalone OpenAI Codex subagent summary reference from `codex-subagent-orchestration` now that the skill documentation carries the needed guidance directly.

## [v2.3.0] - 2026-03-18

### Added
- Add `codex-subagent-orchestration` for default subagent routing on most non-trivial Codex tasks, including reusable custom-agent catalog inspection, creation, and persistence guidance.
- Add OpenAI-backed subagent references, a reusable custom-agent TOML template, and a routing rubric for splitting exploration, review, verification, and isolated implementation work.

### Changed
- Restrict `codex-subagent-orchestration` starter model guidance to `gpt-5.4` and `gpt-5.3-codex`.
- Require reusable subagents to set `model_reasoning_effort` by delegated task complexity instead of using a single fixed effort.

## [v2.2.0] - 2026-03-18

### Added
- Add a branded Apollo Toolkit installer welcome screen with staged terminal reveal content before target selection.

### Changed
- Update the interactive installer banner and selection screen to present clearer Apollo Toolkit branding and setup guidance.
- Require `version-release` to create and publish a matching GitHub release after pushing the release tag, and document release-triggered publish workflow verification.

## [v2.1.1] - 2026-03-18

### Added
- Allow `fix-github-issues` to hand off validated issue fixes either to `open-source-pr-workflow` for PR submission or to `commit-and-push` for explicit direct-push delivery.

### Changed
- Align `fix-github-issues` metadata and agent prompt wording with the new direct-push delivery path.
- Strengthen `weekly-financial-event-report` PDF handoff requirements for long-text table layout, reusable renderers, and visual QA checks.

## [v2.1.0] - 2026-03-18

### Added
- Add `scheduled-runtime-health-check` for bounded project runtime scheduling, automatic shutdown, and delegated log-based module health analysis.

### Changed
- Align `commit-and-push` and `version-release` workflow guidance, prompts, and supporting docs with the current review and documentation-sync requirements.
- Tighten release and commit planning-artifact detection to exclude template/reference specs, and require `scheduled-runtime-health-check` to fail closed when future scheduling is unavailable.

## [v2.0.2] - 2026-03-17

### Changed
- Update the npm Trusted Publishing workflow to use newer GitHub Actions and Node 24, and simplify publish invocation to `npm publish --access public`.

## [v2.0.1] - 2026-03-17

### Fixed
- Align `specs-to-project-docs`, `commit-and-push`, and `version-release` references with the current `docs/*` documentation layout.

## [v2.0.0] - 2026-03-17

### Added
- Add the `@laitszkin/apollo-toolkit` npm package with an `apollo-toolkit` CLI entrypoint.
- Add an interactive terminal installer with Apollo Toolkit branding, multi-target selection, and managed installs under `~/.apollo-toolkit`.
- Add Node-based installer tests and a release-triggered npm Trusted Publishing workflow.

### Changed
- Change managed installer defaults from `~/.apollo-toolkit-repo` to `~/.apollo-toolkit` for curl / iwr installs.
- Refresh installer documentation around npm, npx, and global CLI usage.

## [v1.1.0] - 2026-03-13

### Added
- Add `deep-research-topics` for evidence-based research deliverables.
- Add `review-codebases` for repository-wide code review and issue publication workflows.
- Add `agents/openai.yaml` metadata across top-level skills.
- Add skill metadata validation scripts and a GitHub Actions workflow for `SKILL.md` frontmatter and `agents/openai.yaml`.
- Add `harden-app-security/references/common-software-attack-catalog.md` for broader security audit coverage.

### Changed
- Expand `harden-app-security` into a discovery-only adversarial audit workflow with broader common software attack coverage.
- Strengthen `develop-new-features`, `enhance-existing-features`, `discover-edge-cases`, and related references with clearer testing and evidence requirements.
- Refresh root and skill-level documentation to reflect the new skills, metadata requirements, and review workflow guidance.

### Fixed
- Restore skill metadata loading behavior after the OpenAI agent metadata rollout.

## [v1.0.0] - 2026-03-09

### Added
- Add `align-project-documents` for codebase-driven project documentation alignment.
- Add `answering-questions-with-research` for evidence-based answers that combine repo discovery with web research.
- Add `learning-error-book` for mistake summaries with Markdown-to-PDF error book generation.
- Add `maintain-project-constraints` to keep `AGENTS.md` aligned with the repository.
- Add `open-github-issue` for deterministic GitHub issue publishing with auth fallback and README-based language detection.
- Add `resolve-review-comments` for PR review thread triage, adoption decisions, and resolution workflows.
- Add cross-platform installers in `scripts/install_skills.sh` and `scripts/install_skills.ps1`.

### Changed
- Rename multiple skills for clearer naming, including `project-doc-aligner` -> `align-project-documents`, `agents-md-maintainer` -> `maintain-project-constraints`, `edge-case-test-fixer` -> `fix-edge-cases`, `github-issue-fix-pr-workflow` -> `fix-github-issues`, `gh-pr-review-comment-workflow` -> `resolve-review-comments`, `security-expert-hardening` -> `harden-app-security`, and `app-log-issue-analysis` -> `analyse-app-logs`.
- Split GitHub issue publication out of `analyse-app-logs` and make it depend on `open-github-issue`.
- Expand `open-github-issue` with target repository resolution, README-based language selection, and deterministic draft fallback behavior.
- Strengthen `develop-new-features`, `enhance-existing-features`, and related skills with clearer property-based testing requirements and refreshed templates.
- Move installer entrypoints into `scripts/`, add Trae install support, and improve curl/pipe repo detection.
- Refresh root and skill-level docs to reflect the renamed skills, installer flow, and dependency guidance.

### Fixed
- Correct current documentation references to `maintain-project-constraints`.

## [v0.6.0] - 2026-02-27

### Added
- Add default worktree guidance to `github-issue-fix-pr-workflow` debug dependencies.

### Changed
- Quote a multiline skill description in `systematic-debug` to keep YAML metadata valid.
- Refine `systematic-debug` auto-invoke criteria and examples for mismatched behavior debugging.
- Clarify `version-release` workflow requirements for release range review and code/documentation alignment.

## [v0.5.0] - 2026-02-26

### Added
- Add `commit-and-push` skill for commit+push-only submission workflows.
- Add `version-release` skill for explicit version/tag/changelog release workflows.
- Add new skill documents and references for the split submit/release workflows.

### Changed
- Replace legacy `submit-changes` with two dedicated skills: `commit-and-push` and `version-release`.
- Translate project documentation, templates, and testing/reference guides to English across skills.
- Update multiple skill definitions to English wording for consistent skill documentation language.
- Clarify spec-first requirements in feature-planning skills, including mandatory re-approval after clarification updates.

## [v0.4.0] - 2026-02-26

### Added
- Add `github-issue-fix-pr-workflow` skill with issue listing, local fix flow, and PR submission guidance.
- Add `github-issue-fix-pr-workflow/scripts/list_issues.py` and related tests for deterministic issue discovery.

### Changed
- Update `install_skills.sh` to support interactive multi-option selection, multi-mode CLI input, and `all` installation.
- Add Trae IDE support in `install_skills.sh`, with a default install target at `~/.trae/skills`.
- Update root `README.md` installer examples to include `trae` and `all` usage.
- Highlight BDD keywords in `develop-new-features` and `enhance-existing-features` spec templates using Markdown bold formatting.

## [v0.3.0] - 2026-02-25

### Added
- Enhance `app-log-issue-analysis` with deterministic GitHub issue publishing support.
- Add `app-log-issue-analysis/scripts/publish_log_issue.py` for issue publishing with auth fallback (`gh` login -> `GITHUB_TOKEN`/`GH_TOKEN` -> draft).
- Add remote README-based issue language selection (Chinese README -> Chinese issue body, otherwise English).

### Changed
- Update app-log issue analysis docs, checklist, and default prompt to document the new issue publishing workflow.
