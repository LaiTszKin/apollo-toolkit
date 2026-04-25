# AGENTS Guide

## Project Architecture

- This repository is a skill catalog: each top-level skill lives in its own directory and is installable when that directory contains `SKILL.md`.
- Typical skill layout is lightweight and consistent: `SKILL.md`, `README.md`, `LICENSE`, plus optional `agents/`, `references/`, and `scripts/`.
- The npm package exposes an `apollo-toolkit` CLI that stages a managed copy under `~/.apollo-toolkit` and copies or symlinks each skill folder into selected target directories.
- The installer writes a `.apollo-toolkit-manifest.json` per target directory to track installed skills, historical skill names, and install mode for future uninstall and deduplication.
- `scripts/install_skills.sh` and `scripts/install_skills.ps1` remain available for local/curl installs and mirror the managed-home install behavior with symlink/copy choice and uninstall support.

## Core Business Flow

This repository enables users to install and run a curated set of reusable agent skills for software delivery, research, repository maintenance, and media-generation workflows.

- Users can align project documentation with the current codebase.
- Users can consolidate completed project specs and batch-level coordination plans into a standardized README and categorized project documentation set, then archive only the truly consumed planning files.
- Users can investigate application logs, slice them to precise time windows, search by keyword or regex, and produce evidence-backed root-cause findings.
- Users can answer repository-backed questions with additional web research when needed.
- Users can commit and push local changes without performing version or release work.
- Users can manage Codex user-preference memory by reviewing the last 24 hours of chats, storing reusable preference-first memory documents under `~/.codex/memory`, and syncing a memory index into `~/.codex/AGENTS.md`.
- Users can research a topic deeply and produce evidence-based deliverables.
- Users can research the latest completed market week and produce a PDF watchlist of tradeable instruments for the coming week.
- Users can turn a marked weekly finance PDF into a concise evidence-based financial event report.
- Users can install Apollo Toolkit through npm or npx and interactively choose one or more target skill directories to populate with copied or symlinked skills, with the option to include codex-exclusive skills in non-codex targets.
- Users can uninstall all Apollo Toolkit-installed skills from all targets or specific targets via `apltk uninstall`.
- Users can choose between symlink mode (auto-update via git pull) and copy mode (stable snapshot) with `--symlink` / `--copy` flags.
- Users can run bundled helper tools through `apltk tools` and direct `apltk <tool>` commands for selected packaged skill scripts.
- Users can design and implement new features through a spec-first workflow.
- Users can generate shared feature planning artifacts for approval-gated workflows, including parallel multi-spec batches coordinated through one batch-level `coordination.md`.
- Users can convert text or documents into audio files with subtitle timelines.
- Users can turn lecture slides, past papers, and answer books into mock exams, worked solutions, study notes, or graded PDFs with KaTeX-rendered math.
- Users can extend existing features in a brownfield codebase with required tests and approvals.
- Users can propose product features from an existing codebase and publish accepted proposals.
- Users can discover reproducible edge-case risks and report prioritized hardening gaps.
- Users can read, filter, and inspect remote GitHub issues before planning follow-up work.
- Users can resolve a GitHub issue end-to-end and push the fix directly to a requested branch without opening a PR.
- Users can run evidence-first application security audits focused on confirmed vulnerabilities.
- Users can run a shared submission-readiness pass that synchronizes changelog, project docs, `AGENTS.md`, and completed plan archives before commit, push, PR creation, or release.
- Users can learn new or improved skills from recent Codex conversation history.
- Users can audit and maintain the skill catalog itself, including dependency classification and shared-skill extraction decisions.
- Users can implement approved spec planning sets directly in the current checkout and commit them to the active branch.
- Users can summarize mistakes into separate multiple-choice and long-answer error books backed by structured reference files and rendered PDFs.
- Users can build or review marginfi protocol integrations using official SDK, CLI, protocol, and The Arena documentation.
- Users can create or maintain `AGENTS.md` so project constraints stay aligned with the repository.
- Users can turn novel content into a loopable short-form video with generated assets.
- Users can publish structured GitHub issues or feature proposals with auth fallbacks.
- Users can prepare and open open-source pull requests from existing changes.
- Users can generate storyboard image sets from chapters, novels, articles, or scripts.
- Users can configure OpenClaw from official documentation, including `~/.openclaw/openclaw.json`, skills loading, SecretRefs, CLI edits, and validation or repair workflows.
- Users can record multi-account spending and balance changes in monthly Excel ledgers with summary analytics and charts.
- Users can recover missing or archived `docs/plans/...` spec sets from issue context, git history, and repository evidence before continuing feature work.
- Users can review the current git change set from an unbiased reviewer perspective to find abstraction opportunities and simplification candidates.
- Users can process GitHub pull request review comments and resolve addressed threads.
- Users can perform repository-wide code reviews and publish confirmed findings as GitHub issues.
- Users can schedule a bounded project runtime window, stop it automatically, and analyze module health from captured logs.
- Users can investigate gated or shadow LLM APIs by capturing real client request shapes, replaying verified traffic patterns, and attributing the likely underlying model through black-box fingerprinting.
- Users can build and maintain Solana programs and Rust clients using official Solana development workflows.
- Users can add focused observability to opaque workflows through targeted logs, metrics, traces, and tests.
- Users can iteratively improve repository code quality through behavior-neutral naming, simplification, module-boundary, logging, and test-coverage passes.
- Users can iteratively improve repository performance through evidence-backed module scans, safe hot-path optimization, benchmark guardrails, batching, caching, allocation, concurrency, and repeated full-codebase stage gates.
- Users can build against Jupiter's official Solana swap, token, price, lending, trigger, recurring, and portfolio APIs with an evidence-based development guide.
- Users can render and embed math formulas with KaTeX using official documentation-backed guidance and reusable rendering scripts.
- Users can debug software systematically by reproducing causes, validating fixes, and testing outcomes.
- Users can generate 30-60 second short videos directly from text prompts.
- Users can prepare and publish versioned releases with changelog and tag workflows.
- Users can generate long-form videos by orchestrating storyboard, voice, and Remotion-based production steps.

## Common Commands

- `npm test` - 執行 Node 測試套件。
- `node bin/apollo-toolkit.js` - 直接從倉庫啟動 Apollo Toolkit CLI。
- `node bin/apollo-toolkit.js codex openclaw trae` - 以非互動方式將技能安裝到指定目標。
- `node bin/apollo-toolkit.js tools` - 列出 Apollo Toolkit 內建 CLI 工具。
- `node bin/apollo-toolkit.js filter-logs app.log --start 2026-03-24T10:00:00Z` - 透過內建工具包裝器執行技能腳本。
- `python3 scripts/validate_skill_frontmatter.py` - 驗證所有頂層技能 `SKILL.md` 的 frontmatter。
- `python3 scripts/validate_openai_agent_config.py` - 驗證所有技能 `agents/openai.yaml` 設定。
- `./scripts/install_skills.sh codex` - 用本地安裝腳本把技能安裝到 Codex 目錄。
- `./scripts/install_skills.sh codex --symlink` - 以 symlink 模式安裝（推薦）。
- `./scripts/install_skills.sh all --copy` - 以複製模式安裝到所有支援目標。
- `./scripts/install_skills.sh uninstall` - 從所有目標移除已安裝的技能。
- `./scripts/install_skills.sh uninstall codex` - 只從 codex 目標移除。
- `node bin/apollo-toolkit.js uninstall` - 透過 CLI 移除所有已安裝技能。

## Core Project Purpose

- Provide a curated set of reusable agent skills that can be installed into Codex/OpenClaw/Trae skill directories.
- Keep skills focused, composable, and easy to reuse across workflows.
- Prefer splitting shared capabilities into dedicated skills when multiple workflows can depend on them.

## Code Style And Conventions

- Follow existing skill naming: kebab-case folder names and matching `name` values in `SKILL.md` frontmatter.
- Keep documentation concise, operational, and evidence-based; avoid speculative guidance.
- Reuse existing patterns from neighboring skills before introducing new structures.
- Use a standardized `## Dependencies` section in every `SKILL.md` with `Required`, `Conditional`, `Optional`, and `Fallback` bullets whenever skill-to-skill orchestration matters.
- Use a standardized `## Standards` section in every `SKILL.md` with `Evidence`, `Execution`, `Quality`, and `Output` bullets to summarize skill-specific constraints.
- Keep helper scripts small and deterministic, and update repository docs when adding or moving a top-level skill.
