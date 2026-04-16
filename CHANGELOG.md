# Changelog

All notable changes to this repository are documented in this file.

## [Unreleased]

### Changed
- None yet.

## [v2.14.22] - 2026-04-17

### Changed
- Strengthen `systematic-debug` so failing-test investigations must classify each symptom as stale test contract, test-harness interference, or real product bug, and must treat isolated-only passes as evidence to inspect shared-state and parallel-test interference before changing product code.

## [v2.14.21] - 2026-04-16

### Changed
- Tighten `implement-specs-with-worktree` so branch/worktree setup uses direct `git` ref checks and requires an explicit re-check of repo state before retrying after ambiguous creation failures.

## [v2.14.20] - 2026-04-15

### Changed
- Tighten `version-release` so same-version prerelease retarget flows fall back to a GitHub-accepted `target_commitish` such as the release branch name when raw commit SHA updates are rejected.

## [v2.14.19] - 2026-04-14

### Changed
- Update `version-release` so same-version prerelease hotfixes retarget the existing prerelease tag and GitHub release instead of forcing an extra semver bump.

## [v2.14.18] - 2026-04-13

### Changed
- Update `review-codebases` so issue-publishing runs must search for overlapping open or recent issues first and skip publishing duplicates when the root cause already has a tracker.
- Tighten `implement-specs-with-worktree` so archived or already-landed spec requests must verify whether the work is already present before creating a fresh worktree, and report a no-op with evidence when appropriate.

## [v2.14.17] - 2026-04-12

### Changed
- Tighten `version-release` so explicit semver wording such as `patch update`, `minor update`, or `major update` counts as release intent and still requires publishing the matching GitHub release.
- Tighten `enhance-existing-features` so it must not report an enabling intermediate milestone as complete when the user asked for the final scoped behavior.

## [v2.14.16] - 2026-04-11

### Changed
- Strengthen `generate-spec` so batch planning now requires spec sets to be truly parallel-implementable, not merely independently scoped.
- Update `generate-spec` templates and prompts so `coordination.md` captures parallel-readiness gates, collision-resolution records, and pre-agreed ownership rules before concurrent implementation starts.

## [v2.14.15] - 2026-04-11

### Changed
- Update `merge-changes-from-local-branches` so merge scope is determined from explicit branch names or spec-name mappings, instead of verifying child-branch ancestry from git history.
- Update `implement-specs-with-worktree` so new worktree branches inherit from the same parent branch as the worktree base, and use the spec-set name as the canonical branch/worktree identifier.

## [v2.14.14] - 2026-04-11

### Changed
- Tighten `commit-and-push` so it must distinguish staged versus unstaged work before choosing commit scope, preserve intentionally separated commit boundaries, and only broaden scope after an explicit user request.
- Update `learn-skill-from-conversations` so repeated follow-ups that correct commit scope or local-versus-remote submission boundaries are treated as evidence to harden the owning submit workflow.

## [v2.14.13] - 2026-04-10

### Added
- Add `implement-specs` for executing approved spec sets directly in the current checkout without creating a branch or git worktree.

## [v2.14.12] - 2026-04-10

### Changed
- Tighten `implement-specs-with-worktree` so detached or temporary worktrees must recover the exact requested `docs/plans/...` spec set from the authoritative branch or main working tree before coding, instead of substituting nearby plans.
- Require `implement-specs-with-worktree` to sync only the in-scope spec directory plus its governing batch `coordination.md`, avoiding accidental sibling-spec imports into the worktree.

## [v2.14.11] - 2026-04-09

### Changed
- Re-scope `merge-changes-from-local-branches` so it merges only verified child branches that forked from the current branch, and lands the result back onto that same current branch instead of sweeping all local branches into `main`.
- Require `merge-changes-from-local-branches` to run `archive-specs` after merge verification so completed plan sets are archived and durable project docs are synchronized before `commit-and-push` creates the final current-branch submission.

## [v2.14.10] - 2026-04-09

### Changed
- Strengthen `generate-spec` coordination guidance and template so parallel worktree batches must record file ownership guardrails, shared API or schema freeze rules, compatibility-shim retention rules, and post-merge integration checkpoints that reduce functional merge conflicts.
- Update `implement-specs-with-worktree` so engineers executing batch specs must treat those `coordination.md` guardrails as blocking constraints during implementation instead of optional notes.

## [v2.14.9] - 2026-04-08

### Changed
- Update `merge-changes-from-local-branches` so it must inspect active batch-spec `coordination.md` files under `docs/plans/` and follow their documented merge order when one is explicitly provided.
- Clarify that merge-order guidance from active batch specs is authoritative unless the plan is stale, conflicting, or cannot be mapped safely to the current branches.

## [v2.14.8] - 2026-04-08

### Changed
- Tighten `generate-spec` so multi-spec batch planning must slice work into independently completable specs that can each be approved, implemented, tested, and merged without depending on another spec in the same batch landing first.
- Update `generate-spec` coordination guidance and templates so batch-level merge order may be a convenience only, never a functional prerequisite between specs.
## [v2.14.7] - 2026-04-08

### Changed
- Update `merge-changes-from-local-branches` so it removes successfully merged source branches and any detached worktrees only after the merge commit and verification both succeed, while refusing forced deletion for branches that are not actually merged.

## [v2.14.6] - 2026-04-08

### Added
- Add batch-level `coordination.md` support to `generate-spec` so one planning request can create multiple parallel spec workstreams under `docs/plans/{YYYY-MM-DD}/{batch_name}/`, while keeping shared field preparation, ownership boundaries, merge order, and legacy-replacement direction in one canonical coordination file.

### Changed
- Update `develop-new-features`, `enhance-existing-features`, and `implement-specs-with-worktree` so multi-spec worktree execution reads and maintains shared `coordination.md` state instead of duplicating cross-spec rules inside each `design.md`.
- Update `archive-specs` and `recover-missing-plan` so the newer nested `docs/plans/{YYYY-MM-DD}/...` layout and batch-level `coordination.md` files are recognized during archival, reconciliation, and recovery workflows.

## [v2.14.5] - 2026-04-08

### Changed
- Clarify `learn-skill-from-conversations`, `codex-memory-manager`, and `weekly-financial-event-report` so Codex automation runs must treat an explicit `Automation memory:` path in the prompt as authoritative and not rely on `$CODEX_HOME` shell expansion being available.

## [v2.14.4] - 2026-04-07

### Changed
- Clarify `maintain-project-constraints` so `Core project purpose` must describe the repository's macro goal or problem-to-solve, instead of restating its implemented feature list.

## [v2.14.3] - 2026-04-07

### Changed
- Strengthen `systematic-debug` so runtime-pipeline investigations must anchor on one canonical run or artifact root, map failures to concrete stages, and separate toolchain/platform faults from application-logic faults before fixing.
- Strengthen `scheduled-runtime-health-check` so bounded runs must record the canonical run folder as soon as it materializes and use structured artifacts from that same run when analyzing health.

## [v2.14.2] - 2026-04-06

### Changed
- Rewire `merge-changes-from-local-branches` so its final local-branch submission stage is handed to `commit-and-push`, which now owns the shared changelog/readiness/archival flow after merges.
- Rework `archive-specs` so documentation alignment is delegated to `align-project-documents` and `maintain-project-constraints` before completed plan sets are archived.
- Clarify that `commit-and-push` and `version-release` depend directly on `archive-specs` for completed plan conversion and project-doc alignment, instead of duplicating downstream documentation-sync steps.

## [v2.14.1] - 2026-04-06

### Changed
- Tighten `merge-changes-from-local-branches` so it inspects branch divergence before merging, resolves conflicts by composing verified behavior instead of relying on blanket `-X ours/theirs` or timestamp heuristics, and requires targeted verification after conflictful merges.

### Fixed
- Add missing `agents/openai.yaml` metadata for `merge-changes-from-local-branches` and `implement-specs-with-worktree` so repository agent-config validation passes and both skills expose UI metadata consistently.

## [v2.14.0] - 2026-04-05

### Added
- Add `agents` install mode to CLI and installer, aligning npm-based CLI with shell script capabilities.
- Add `implement-specs-with-worktree` skill for implementing specs in isolated git worktrees.
- Add `merge-changes-from-local-branches` skill for consolidating local branch changes into main.

## [v2.13.4] - 2026-04-05

### Changed
- Update `learn-skill-from-conversations` so it must inventory the current repository's existing skills first, weigh repeated user corrections and error-driven lessons more heavily, extract duplicated workflow fragments into shared skills when warranted, wrap repeatedly customized external skills, and keep project-specific tooling patterns in the owning project's `~/.codex/skills/`.

### Fixed
- Synchronize `package-lock.json` metadata with the current package version and CLI bin aliases before release publication.

## [v2.13.3] - 2026-04-05

### Removed
- Remove `production-sim-debug` skill as it is no longer actively maintained or needed.

## [v2.13.2] - 2026-04-05

### Changed
- Update `codex-memory-manager` to require reusable, preference-first memory files built around a normalized `Scope / Preferences / Maintenance / Evidence notes` template instead of project- or incident-specific memory logs.
- Add a bundled memory-file template reference plus focused template-structure tests so future updates keep the new memory format and de-projectification rules aligned.

## [v2.13.1] - 2026-04-05

### Fixed
- Fix the npm / `apltk` installer so selecting `codex` now copies agent-specific skills from the repository `codex/` subdirectory into the managed toolkit home and the final Codex skills target.
- Fix the npm / `apltk` interactive installer and help output so `claude-code` appears as a supported target and can be installed through the same CLI flow as the other modes.

### Changed
- Refresh installer banner and README wording so Claude Code support is described consistently in the npm-based installation flow.

## [v2.13.0] - 2026-04-05

### Added
- Add `recover-missing-plan` for restoring or reconstructing missing `docs/plans/...` plan sets from repository evidence, git history, and authoritative issue context before implementation continues.
- Expand `generate-spec` with standardized `contract.md` and `design.md` templates plus generator support so plan sets can capture external dependency contracts and architecture deltas alongside `spec.md`, `tasks.md`, and `checklist.md`.

### Changed
- Update `develop-new-features`, `enhance-existing-features`, `archive-specs`, and related agent prompts to treat `contract.md` and `design.md` as first-class planning artifacts wherever `generate-spec` is used.
- Update `ship-github-issue-fix` to require `recover-missing-plan` when a referenced `docs/plans/...` path is missing or archived unexpectedly.
- Expand repository capability docs and skill inventory to include `recover-missing-plan` and the broader five-file planning workflow.
- Strengthen `weekly-financial-event-report` so it checks for an existing report covering the same research window before regenerating output, and requires exact calendar dates for exchange/session timing when reporting market-sensitive follow-up.

## [v2.12.7] - 2026-04-02

### Added
- Add `claude-code` install mode for copying skills into `~/.claude/skills`, with `CLAUDE_CODE_SKILLS_DIR` environment override support.

### Changed
- Move `codex-memory-manager` and `learn-skill-from-conversations` into `codex/` subdirectory to clarify agent-specific skill boundaries.
- Update codex install mode to include skills from both root directory and the `codex/` subdirectory.

## [v2.12.6] - 2026-04-02

### Added
- Add the global `apltk` CLI alias so the Apollo Toolkit installer can be launched with a shorter command after npm installation.

### Changed
- Update `develop-new-features` and `enhance-existing-features` so any spec-backed change affecting more than three modules must be split into independent, non-conflicting, non-dependent spec sets.
- Expand `commit-and-push` with stricter worktree replay and cleanup rules so temporary worktree delivery verifies the authoritative target branch before removing the worktree.
- Strengthen `production-sim-debug` so protocol-sensitive simulation claims must be checked against official docs or upstream source, and infeasible local-simulation designs must be collapsed quickly instead of left as pending implementation.
- Update the Apollo Toolkit CLI so interactive global runs can start from `apltk`, check npm for newer published packages, and offer an in-place global update before continuing.

### Fixed
- Fix updater version comparison so prerelease builds such as `2.12.5-beta.1` no longer suppress available stable-release upgrade prompts.

## [v2.12.5] - 2026-04-01

### Changed
- Update `maintain-project-constraints` so generated `AGENTS.md` templates must include a factual `Common Commands` section grounded in repository-owned command entry points such as CLIs, package scripts, and task runners.
- Refresh the Apollo Toolkit root `AGENTS.md` guidance with repository-specific common commands for the local CLI, validation scripts, tests, and install flows.

## [v2.12.4] - 2026-04-01

### Added
- Add a bundled macOS `PDFKit` extraction helper for `weekly-financial-event-report` so marked-event PDFs can still be parsed locally when the usual PDF tooling is unavailable.

### Changed
- Expand `weekly-financial-event-report` to prefer the `pdf` skill for extraction, fall back to the local PDFKit helper on macOS, and call `document-vision-reader` when visual highlights are not recoverable from extracted text alone.
- Rework `align-project-documents` around category-based, newcomer-friendly documentation selection with a reusable template grounded in Diataxis and common open source doc types.
- Tighten `commit-and-push` and `version-release` so clean-worktree submit/release requests must inspect existing local and remote state instead of fabricating a new submission result.
- Strengthen `production-sim-debug` to record the active artifact root immediately and check startup admission signals before concluding a run had no opportunities.

## [v2.12.3] - 2026-03-30

### Changed
- Strengthen `commit-and-push`, `submission-readiness-check`, and `version-release` so submit flows must actually update root `CHANGELOG.md` `Unreleased` before continuing when the pending code-affecting or user-visible change is missing there.
- Strengthen `commit-and-push` and `version-release` so `review-change-set` remains conditional, but becomes a blocking requirement whenever the change set includes code changes.
- Strengthen `version-release` prompts and workflow docs to require reading the current version and existing tag/release state first, and to treat the release as incomplete until the matching commit, tag, and GitHub release all exist.
- Clarify across submit and release workflows that every conditional gate becomes blocking as soon as its triggering scenario is present, including spec archival and other readiness work.
- Clarify that `discover-edge-cases` and `harden-app-security` are important risk-driven code review gates that also become blocking whenever the change or release surface says they apply.

## [v2.12.2] - 2026-03-29

### Changed
- Update the npm installer and local install scripts to expand `~/` path overrides consistently for managed toolkit homes and target skill directories.
- Refresh skill docs and agent prompts to replace user-specific absolute home paths with portable `~/`-based examples.
- Strengthen `production-sim-debug` and `scheduled-runtime-health-check` so bounded runs must verify the actual stop mechanism and treat overruns as contract/tooling bugs to diagnose.

## [v2.12.1] - 2026-03-28

### Changed
- Update `commit-and-push` so it must keep root `CHANGELOG.md` `Unreleased` aligned with the actual pending change set, preserving unrelated bullets while removing stale conflicting entries.
- Update `version-release` so releases publish directly from curated root `CHANGELOG.md` `Unreleased` content instead of reconstructing release notes from `git diff`.

## [v2.12.0] - 2026-03-28

### Added
- Add `agents` mode to install scripts for copying skills into `~/.agents/skills` directory, supporting agent-skill-compatible software.

### Changed
- Strengthen `production-sim-debug` so simulation investigations must verify protocol-sensitive blame against official docs or upstream source, distinguish liquidation pipeline stages precisely, and explain quote-budget counts as attempts versus unique opportunities.

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
