---
name: align-project-documents
description: Read and understand a software project, then generate or align project documentation with the current codebase. Use when a user asks for project docs (usage, technical architecture, debugging flow, setup, operations) or asks to verify and sync existing documentation with real implementation.
---

# Align Project Documents

## Standards

- Evidence: Treat source code, configuration, scripts, and tests as the source of truth.
- Execution: Discover project facts before choosing generate mode or align mode.
- Quality: Keep every non-trivial claim traceable, choose document categories based on actual content, and remove stale documentation instead of appending around it.
- Output: Write newcomer-friendly docs with descriptive headings, runnable commands, and clear reader guidance.

## Goal

Produce accurate, code-grounded project documentation that remains readable for people who do not yet understand the project, its domain, or the development workflow. Prefer evidence from source code, configs, scripts, and tests over assumptions.

## Workflow

### 1) Discover project facts first

- Read key files before writing: `README*`, `package.json`/`pyproject.toml`/`go.mod`, lock files, CI configs, entrypoints, and test setup.
- Inspect main runtime paths (API/server, worker, frontend, CLI, jobs) and dependency boundaries.
- Build a factual map: startup commands, environment variables, request/data flow, major modules, external integrations, and observability points.
- Record concrete evidence with file paths for every important claim.
- Identify likely readers and their knowledge gaps: new developer, operator, support teammate, product stakeholder, or mixed audience.
- Identify the actual reader tasks: understand the project, run locally, configure credentials, operate a workflow, debug failures, or change code safely.

### 2) Classify documentation by content, not by fixed headings

- Start from the repository's real content and the readers' jobs to be done.
- Choose only the categories that are supported by evidence and useful to the target audience.
- Use open source documentation conventions as the classification baseline instead of inventing project-local categories first.
- Prefer the Diataxis content families for content classification: tutorial, how-to, reference, and explanation.
- Map those content families onto common open source document types when appropriate: `README`, `CONTRIBUTING`, `SECURITY`, `CODE_OF_CONDUCT`, troubleshooting guides, glossary, and release/change documents.
- Prefer descriptive, task-led headings such as `本地啟動 API 服務`, `設定 GitHub OAuth 憑證`, or `匯入任務卡住時如何排查`.
- Do not force a fixed chapter list when the project does not need it.
- Use `references/templates/category-based-project-docs-template.md` as the primary selection guide.

Useful content categories include:

- README or docs index for orientation
- tutorial or getting-started guide for first success
- how-to or runbook guides for real tasks
- reference docs for configuration, commands, endpoints, and limits
- explanation docs for architecture, concepts, and tradeoffs
- CONTRIBUTING for contribution workflow
- SECURITY for vulnerability reporting and support policy
- CODE_OF_CONDUCT for community expectations
- glossary, FAQ, decisions, or release notes when repository evidence shows they are needed

### 3) Decide documentation mode

- **Generate mode**: no usable docs exist, or user asks to create docs from scratch.
- **Align mode**: existing docs exist and must be checked against implementation.

### 4) Generate mode output

Create or update a minimal document set chosen from the content categories above. Do not require every project to have the same headings or files.

At minimum, ensure the final output answers the questions that matter for the repository's real readers:

1. What is this project for?
2. Who usually needs this document?
3. How do I complete the most common task safely?
4. What must I prepare before I start?
5. What result should I expect if things are working?
6. What usually goes wrong and how do I verify it?
7. Where in the repository is the source of truth?

Recommended output pattern:

- A short root `README.md` or equivalent entry document for orientation.
- One or more focused documents grouped by standard documentation type.
- Optional runbooks for task-heavy or failure-heavy workflows.
- Optional glossary/FAQ material only when the project actually contains domain complexity or repeated team confusion.
- Separate contributor or community-governance docs only when the repository exposes those collaboration workflows.

Writing rules:

- Write what is true now, not what should be true.
- Use concrete commands and paths from the repository.
- Keep examples executable when possible.
- Call out unknowns explicitly instead of guessing.
- Explain why a file, service, command, or environment matters before telling the reader to use it.
- Assume the reader may not understand local jargon, deployment assumptions, or the project's business terms.
- Prefer task-oriented section titles over generic labels.
- Keep different documentation intents separate: tutorials teach, how-to guides solve tasks, reference catalogs facts, and explanation pages provide understanding.

### 5) Align mode output

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
6. Rewrite headings that are too generic or template-like so they reflect the real task or concept being documented.

Alignment checklist:

- Startup/install commands still work.
- Directory/module names match current tree.
- API/routes/events/messages match implementation.
- Config keys and env vars match code usage.
- Debug instructions reference real logs, metrics, and breakpoints.
- Test commands and expected outputs are current.
- Headings match actual content categories instead of forcing one universal structure.
- Newcomers can infer what each document is for before reading the full content.
- Document placement follows recognizable open source conventions whenever the repository scope justifies them.

### 6) Newcomer-readability rules

- Start each document by making the reader's situation explicit: who this is for, what they are trying to do, and when they should use this document.
- When describing a task, include prerequisites, exact steps, expected signals, and common failure recovery.
- When describing architecture, explain responsibilities and boundaries in plain language before diving into paths or modules.
- When describing configuration or credentials, explain why each key or service exists and what breaks if it is missing.
- When describing debugging, structure content around observable symptoms and verification paths, not abstract subsystem names.
- If the repository contains specialist domain language, add a glossary or inline definitions instead of assuming prior knowledge.

## Quality Gate (must pass before finishing)

- Ensure every non-trivial statement is traceable to repository evidence.
- Ensure usage and debug steps are reproducible from current code.
- Ensure architecture description reflects actual module boundaries.
- Ensure outdated statements are removed, not only appended.
- Ensure document categories and headings are chosen because they fit the content, not because the template listed them.
- Ensure a newcomer can identify the correct next step from the document without already knowing the codebase.
- Ensure the chosen document types align with common open source practice so contributors can find information where they expect it.

## Output Style

- Write concise but high-context documentation for humans, not placeholder-driven template output.
- Use headings, short bullets, tables, and runnable command snippets when they improve scanning.
- Prefer direct language and avoid speculative wording.
- Make headings descriptive enough that a reader can skim the table of contents and know which page or section to open.

## Reference Template

- `references/templates/category-based-project-docs-template.md`: category-based template and reusable section blocks for newcomer-friendly project documentation.

## External Documentation Basis

- Diataxis: use the tutorial / how-to / reference / explanation model as the primary content classification.
- The Good Docs Project: use common open source template types such as README, quickstart, tutorial, how-to, troubleshooting, glossary, and style-oriented guidance as practical packaging patterns.
- GitHub open source guidance: treat `README`, `CONTRIBUTING`, license, code of conduct, and security policy as common repository-level documents when the project has contributor-facing community workflows.
