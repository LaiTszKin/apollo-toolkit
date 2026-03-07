# Open GitHub Issue

Structured GitHub issue publishing with deterministic authentication fallback and repository-language-aware issue bodies.

This skill helps agents publish confirmed findings as GitHub issues without embedding repository resolution, auth handling, and language detection logic into every other workflow.

## What this skill provides

- Target repository resolution from `--repo` or current git `origin`.
- Strict auth fallback order: `gh` login -> `GITHUB_TOKEN`/`GH_TOKEN` -> draft only.
- Issue body language detection based on the target repository README.
- Consistent three-section issue bodies for problem, suspected cause, and reproduction conditions.
- Machine-readable JSON output so parent skills can report publication status consistently.

## Repository structure

- `SKILL.md`: Main skill definition and workflow.
- `agents/openai.yaml`: Agent interface metadata and default prompt.
- `scripts/open_github_issue.py`: Deterministic issue publisher.

## Installation

1. Clone this repository.
2. Copy this folder to your Codex skills directory:

```bash
mkdir -p "$CODEX_HOME/skills"
cp -R open-github-issue "$CODEX_HOME/skills/open-github-issue"
```

## Usage

Invoke the skill in your prompt:

```text
Use $open-github-issue to publish this confirmed finding to GitHub.
```

The bundled script can also be called directly:

```bash
python scripts/open_github_issue.py \
  --title "[Log] Payment timeout spike" \
  --problem-description "Repeated timeout warnings escalated into request failures during the incident window." \
  --suspected-cause "payment-api/handler.py:84 retries immediately against a slow upstream with no jitter; confidence high." \
  --reproduction "Not yet reliably reproducible; more runtime evidence is required." \
  --repo owner/repo
```

## Publication behavior

For each issue:

1. If `gh auth status` succeeds, publish with GitHub CLI.
2. Otherwise, if `GITHUB_TOKEN` or `GH_TOKEN` exists, publish via GitHub REST API.
3. Otherwise, return draft issue content without blocking the caller.

Each issue body always includes exactly three sections:

- `Problem Description`
- `Suspected Cause`
- `Reproduction Conditions (if available)`

For Chinese-language repositories, use translated section titles with the same meaning.

## Output

The script prints JSON including:

- publication mode,
- created issue URL when available,
- rendered issue body,
- and publish error details when fallback occurs.

## License

MIT. See `LICENSE`.
