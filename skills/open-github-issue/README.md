# Open GitHub Issue

Structured GitHub issue publishing across multiple issue categories with deterministic authentication fallback and repository-language-aware issue bodies.

This skill helps agents publish confirmed findings, accepted proposals, documentation gaps, security risks, observability gaps, and performance issues as GitHub issues without embedding repository resolution, auth handling, and language detection logic into every other workflow.

## What this skill provides

- Target repository resolution from `--repo` or current git `origin`.
- Strict auth fallback order: `gh` login -> `GITHUB_TOKEN`/`GH_TOKEN` -> draft only.
- Issue body language detection based on the target repository README.
- Consistent structured issue bodies for `problem`, `feature`, `performance`, `security`, `docs`, and `observability` issues.
- Machine-readable JSON output so parent skills can report publication status consistently.

## Repository structure

- `SKILL.md`: Main skill definition and workflow.
- `agents/openai.yaml`: Agent interface metadata and default prompt.
- `scripts/open_github_issue.py`: Deterministic issue publisher, exposed as `apltk open-github-issue`.

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
Use $open-github-issue to publish this confirmed finding or accepted proposal to GitHub.
```

The bundled CLI can also be called directly:

```bash
cat > /tmp/open-github-issue-payload.json <<'JSON'
{
  "issue_type": "problem",
  "title": "[Log] Payment timeout spike",
  "problem_description": "Expected Behavior (BDD)\nGiven the payment service sees transient upstream latency\nWhen the retry path runs\nThen requests should recover without user-visible failures and keep `request_id` evidence intact\n\nCurrent Behavior (BDD)\nGiven the payment service sees transient upstream latency\nWhen the retry path runs\nThen repeated timeout warnings still escalate into request failures\n\nBehavior Gap\n- Expected: retries absorb transient upstream slowness.\n- Actual: retries still end in request failures.\n- Difference/Impact: customers receive failed payment attempts during the incident window.\n\nEvidence\n- symptom: repeated timeout warnings escalated into request failures.\n- impact: payment attempts failed for end users.\n- key evidence: logs from the incident window show retries without successful recovery.",
  "suspected_cause": "payment-api/handler.py:84 retries immediately against a slow upstream with no jitter; confidence high.",
  "reproduction": "Not yet reliably reproducible; more runtime evidence is required."
}
JSON

apltk open-github-issue --payload-file /tmp/open-github-issue-payload.json --repo owner/repo
```

```bash
cat > /tmp/open-github-issue-payload.json <<'JSON'
{
  "issue_type": "feature",
  "title": "[Feature] Add incident timeline export",
  "proposal": "Allow users to export incident timelines as Markdown and CSV from the incident detail page.",
  "reason": "Support handoff to on-call engineers and postmortem writing without copy-paste.",
  "suggested_architecture": "Add an export action in the incident UI, reuse timeline query service, and centralize renderers in a shared export module."
}
JSON

apltk open-github-issue --payload-file /tmp/open-github-issue-payload.json --repo owner/repo
```

```bash
apltk open-github-issue --repo owner/repo \
  --issue-type security \
  --title "[Security] Missing authorization check on admin export" \
  --problem-description @/tmp/security-risk.md \
  --severity high \
  --affected-scope "/admin/export endpoint and exported customer data" \
  --impact @/tmp/security-impact.md \
  --evidence @/tmp/security-evidence.md \
  --suggested-action @/tmp/security-action.md
```

Use `--payload-file` or `@file` for Markdown-rich fields. Inline shell arguments can corrupt backticks, `$()`, quotes, and other shell metacharacters before the Python script receives them.

## Publication behavior

For each issue:

1. If `gh auth status` succeeds, publish with GitHub CLI.
2. Otherwise, if `GITHUB_TOKEN` or `GH_TOKEN` exists, publish via GitHub REST API.
3. Otherwise, return draft issue content without blocking the caller.

`problem` issues always include exactly three sections:

- `Problem Description`
- `Suspected Cause`
- `Reproduction Conditions (if available)`

Within `Problem Description`, include:

- `Expected Behavior (BDD)`
- `Current Behavior (BDD)`
- `Behavior Gap`

For Chinese-language repositories, use translated section titles with the same meaning.

`feature` issues always include:

- `Feature Proposal`
- `Why This Is Needed`
- `Suggested Architecture`

For Chinese-language repositories, use translated section titles with the same meaning.

`performance` issues include:

- `Performance Problem`
- `Impact`
- `Evidence`
- `Suggested Action`

`security` issues include:

- `Security Risk`
- `Severity`
- `Affected Scope`
- `Impact`
- `Evidence`
- `Suggested Mitigation`

`docs` issues include:

- `Documentation Gap`
- `Evidence`
- `Suggested Update`

`observability` issues include:

- `Observability Gap`
- `Impact`
- `Evidence`
- `Suggested Instrumentation`

## Output

The script prints JSON including:

- publication mode,
- issue type,
- created issue URL when available,
- rendered issue body,
- and publish error details when fallback occurs.

## License

MIT. See `LICENSE`.
