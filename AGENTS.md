# AGENTS Guide

## Project Architecture

- This repository is a skill catalog: each top-level skill lives in its own directory and is installable when that directory contains `SKILL.md`.
- Typical skill layout is lightweight and consistent: `SKILL.md`, `README.md`, `LICENSE`, plus optional `agents/`, `references/`, and `scripts/`.
- `scripts/install_skills.sh` and `scripts/install_skills.ps1` discover top-level skill directories dynamically and install them by linking each folder into the target skills directory.

## Core Business Flow

- Add or update a skill inside a top-level folder.
- Keep the skill workflow in `SKILL.md` as the source of truth, then align `README.md` and any agent metadata under `agents/`.
- Put reusable automation in `scripts/` and longer supporting guidance in `references/` instead of overloading `SKILL.md`.
- Validate that installation still works by preserving the top-level skill-folder structure expected by the install scripts.

## Core Project Purpose

- Provide a curated set of reusable agent skills that can be installed into Codex/OpenClaw/Trae skill directories.
- Keep skills focused, composable, and easy to reuse across workflows.
- Prefer splitting shared capabilities into dedicated skills when multiple workflows can depend on them.

## Code Style And Conventions

- Follow existing skill naming: kebab-case folder names and matching `name` values in `SKILL.md` frontmatter.
- Keep documentation concise, operational, and evidence-based; avoid speculative guidance.
- Reuse existing patterns from neighboring skills before introducing new structures.
- For skill dependencies, document the dependency contract explicitly in `SKILL.md` rather than duplicating the same workflow in multiple skills.
- Keep helper scripts small and deterministic, and update repository docs when adding or moving a top-level skill.
