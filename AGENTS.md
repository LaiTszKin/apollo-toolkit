# AGENTS Guide

## Project Architecture

- This repository is a skill catalog: each top-level skill lives in its own directory and is installable when that directory contains `SKILL.md`.
- Typical skill layout is lightweight and consistent: `SKILL.md`, `README.md`, `LICENSE`, plus optional `agents/`, `references/`, and `scripts/`.
- The npm package exposes an `apollo-toolkit` CLI that stages a managed copy under `~/.apollo-toolkit` and copies each skill folder into selected target directories.
- `scripts/install_skills.sh` and `scripts/install_skills.ps1` remain available for local/curl installs and mirror the managed-home copy behavior.

## Core Business Flow

This repository enables users to install and run a curated set of reusable agent skills for software delivery, research, repository maintenance, and media-generation workflows.

- Users can align project documentation with the current codebase.
- Users can consolidate completed project specs into a standardized README and categorized project documentation set, then archive the consumed planning files.
- Users can investigate application logs and produce evidence-backed root-cause findings.
- Users can answer repository-backed questions with additional web research when needed.
- Users can commit and push local changes without performing version or release work.
- Users can manage Codex user-preference memory by reviewing the last 24 hours of chats, storing categorized memory documents under `~/.codex/memory`, and syncing a memory index into `~/.codex/AGENTS.md`.
- Users can research a topic deeply and produce evidence-based deliverables.
- Users can research the latest completed market week and produce a PDF watchlist of tradeable instruments for the coming week.
- Users can turn a marked weekly finance PDF into a concise evidence-based financial event report.
- Users can install Apollo Toolkit through npm or npx and interactively choose one or more target skill directories to populate with copied skills.
- Users can design and implement new features through a spec-first workflow.
- Users can generate shared feature spec, task, and checklist planning artifacts for approval-gated workflows.
- Users can convert text or documents into audio files with subtitle timelines.
- Users can extend existing features in a brownfield codebase with required tests and approvals.
- Users can propose product features from an existing codebase and publish accepted proposals.
- Users can discover reproducible edge-case risks and report prioritized hardening gaps.
- Users can fix remote GitHub issues locally and submit the resulting pull requests.
- Users can run evidence-first application security audits focused on confirmed vulnerabilities.
- Users can learn new or improved skills from recent Codex conversation history.
- Users can audit and maintain the skill catalog itself, including dependency classification and shared-skill extraction decisions.
- Users can summarize mistakes into separate multiple-choice and long-answer error books backed by structured reference files and rendered PDFs.
- Users can build or review marginfi protocol integrations using official SDK, CLI, protocol, and The Arena documentation.
- Users can create or maintain `AGENTS.md` so project constraints stay aligned with the repository.
- Users can turn novel content into a loopable short-form video with generated assets.
- Users can publish structured GitHub issues or feature proposals with auth fallbacks.
- Users can prepare and open open-source pull requests from existing changes.
- Users can generate storyboard image sets from chapters, novels, articles, or scripts.
- Users can configure OpenClaw from official documentation, including `~/.openclaw/openclaw.json`, skills loading, SecretRefs, CLI edits, and validation or repair workflows.
- Users can record multi-account spending and balance changes in monthly Excel ledgers with summary analytics and charts.
- Users can review the current git change set from an unbiased reviewer perspective to find abstraction opportunities and simplification candidates.
- Users can process GitHub pull request review comments and resolve addressed threads.
- Users can perform repository-wide code reviews and publish confirmed findings as GitHub issues.
- Users can schedule a bounded project runtime window, stop it automatically, and analyze module health from captured logs.
- Users can investigate gated or shadow LLM APIs by capturing real client request shapes, replaying verified traffic patterns, and attributing the likely underlying model through black-box fingerprinting.
- Users can build and maintain Solana programs and Rust clients using official Solana development workflows.
- Users can add focused observability to opaque workflows through targeted logs, metrics, traces, and tests.
- Users can build against Jupiter's official Solana swap, token, price, lending, trigger, recurring, and portfolio APIs with an evidence-based development guide.
- Users can render and embed math formulas with KaTeX using official documentation-backed guidance and reusable rendering scripts.
- Users can debug software systematically by reproducing causes, validating fixes, and testing outcomes.
- Users can generate 30-60 second short videos directly from text prompts.
- Users can prepare and publish versioned releases with changelog and tag workflows.
- Users can generate long-form videos by orchestrating storyboard, voice, and Remotion-based production steps.

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
