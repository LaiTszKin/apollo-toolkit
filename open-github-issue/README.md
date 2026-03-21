# Open GitHub Issue

Structured GitHub issue and feature-proposal publishing with deterministic authentication fallback and repository-language-aware issue bodies.

This skill helps agents publish confirmed findings or accepted feature proposals as GitHub issues without embedding repository resolution, auth handling, and language detection logic into every other workflow.

## What this skill provides

- Target repository resolution from `--repo` or current git `origin`.
- Strict auth fallback order: `gh` login -> `GITHUB_TOKEN`/`GH_TOKEN` -> draft only.
- Issue body language detection based on the target repository README.
- Consistent structured issue bodies for both problem issues and feature proposal issues.
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
Use $open-github-issue to publish this confirmed finding or accepted feature proposal to GitHub.
```

The bundled script can also be called directly:

```bash
python scripts/open_github_issue.py \
  --issue-type problem \
  --title "[Log] Payment timeout spike" \
  --problem-description $'Expected Behavior (BDD)\nGiven the payment service sees transient upstream latency\nWhen the retry path runs\nThen requests should recover without user-visible failures\n\nCurrent Behavior (BDD)\nGiven the payment service sees transient upstream latency\nWhen the retry path runs\nThen repeated timeout warnings still escalate into request failures\n\nBehavior Gap\n- Expected: retries absorb transient upstream slowness.\n- Actual: retries still end in request failures.\n- Difference/Impact: customers receive failed payment attempts during the incident window.\n\nEvidence\n- symptom: repeated timeout warnings escalated into request failures.\n- impact: payment attempts failed for end users.\n- key evidence: logs from the incident window show retries without successful recovery.' \
  --suspected-cause "payment-api/handler.py:84 retries immediately against a slow upstream with no jitter; confidence high." \
  --reproduction "Not yet reliably reproducible; more runtime evidence is required." \
  --repo owner/repo
```

```bash
python scripts/open_github_issue.py \
  --issue-type feature \
  --title "[Feature] Add incident timeline export" \
  --proposal "Allow users to export incident timelines as Markdown and CSV from the incident detail page." \
  --reason "Support handoff to on-call engineers and postmortem writing without copy-paste." \
  --suggested-architecture "Add an export action in the incident UI, reuse timeline query service, and centralize renderers in a shared export module." \
  --repo owner/repo
```

## Publication behavior

For each issue:

1. If `gh auth status` succeeds, publish with GitHub CLI.
2. Otherwise, if `GITHUB_TOKEN` or `GH_TOKEN` exists, publish via GitHub REST API.
3. Otherwise, return draft issue content without blocking the caller.

Problem issues always include exactly three sections:

- `Problem Description`
- `Suspected Cause`
- `Reproduction Conditions (if available)`

Within `Problem Description`, include:

- `Expected Behavior (BDD)`
- `Current Behavior (BDD)`
- `Behavior Gap`

For Chinese-language repositories, use translated section titles with the same meaning.

Feature proposal issues always include:

- `Feature Proposal`
- `Why This Is Needed`
- `Suggested Architecture`

For Chinese-language repositories, use translated section titles with the same meaning.

## Output

The script prints JSON including:

- publication mode,
- issue type,
- created issue URL when available,
- rendered issue body,
- and publish error details when fallback occurs.

## License

MIT. See `LICENSE`.
