---
name: project-doc-aligner
description: Read and understand a software project, then generate or align project documentation with the current codebase. Use when a user asks for project docs (usage, technical architecture, debugging flow, setup, operations) or asks to verify and sync existing documentation with real implementation.
---

# Project Doc Aligner

## Goal

Produce accurate, code-grounded project documentation. Prefer evidence from source code, configs, scripts, and tests over assumptions.

## Workflow

### 1) Discover project facts first

- Read key files before writing: `README*`, `package.json`/`pyproject.toml`/`go.mod`, lock files, CI configs, entrypoints, and test setup.
- Inspect main runtime paths (API/server, worker, frontend, CLI, jobs) and dependency boundaries.
- Build a factual map: startup commands, environment variables, request/data flow, major modules, external integrations, and observability points.
- Record concrete evidence with file paths for every important claim.

### 2) Decide documentation mode

- **Generate mode**: no usable docs exist, or user asks to create docs from scratch.
- **Align mode**: existing docs exist and must be checked against implementation.

### 3) Generate mode output

Create or update documentation with at least these sections:

1. Project Overview
2. Quick Start / Local Run
3. Usage Guide (common workflows and commands)
4. Technical Architecture (components, boundaries, data flow)
5. Configuration and Environment Variables
6. Debugging Playbook (symptom -> checks -> likely root cause -> fix path)
7. Testing and Validation
8. Deployment or Runtime Notes (if applicable)

Writing rules:

- Write what is true now, not what should be true.
- Use concrete commands and paths from the repository.
- Keep examples executable when possible.
- Call out unknowns explicitly instead of guessing.

### 4) Align mode output

When docs already exist:

1. Enumerate existing docs and their scope.
2. Compare each claim against current code and scripts.
3. Classify findings:
   - **Accurate**
   - **Outdated**
   - **Missing**
   - **Ambiguous**
4. Update docs to match real behavior.
5. Add a short "Documentation Delta" summary listing major corrections.

Alignment checklist:

- Startup/install commands still work.
- Directory/module names match current tree.
- API/routes/events/messages match implementation.
- Config keys and env vars match code usage.
- Debug instructions reference real logs, metrics, and breakpoints.
- Test commands and expected outputs are current.

## Quality Gate (must pass before finishing)

- Ensure every non-trivial statement is traceable to repository evidence.
- Ensure usage and debug steps are reproducible from current code.
- Ensure architecture description reflects actual module boundaries.
- Ensure outdated statements are removed, not only appended.

## Output Style

- Write concise, operator-friendly documentation.
- Use headings, short bullets, and runnable command snippets.
- Prefer direct language and avoid speculative wording.
