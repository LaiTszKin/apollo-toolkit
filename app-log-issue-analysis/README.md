# App Log Issue Analysis

An agent skill for evidence-driven application log investigations.

This skill helps agents analyze logs end-to-end, correlate runtime signals with code paths, and produce actionable incident findings with confidence levels and remediation steps.

## What this skill provides

- A structured workflow for incident investigation from scoping to remediation.
- A strict evidence standard (log lines + code correlation + impact + confidence).
- A checklist to avoid false conclusions.
- A pattern catalog for common operational failures (timeouts, retry storms, auth errors, resource pressure, schema mismatch, race conditions, and dependency outages).
- Optional GitHub Issue publishing for confirmed findings, with auth fallback order: `gh` login -> `GITHUB_TOKEN`/`GH_TOKEN` -> draft only.
- Issue language selection based on target repository remote README: Chinese README -> Chinese issue body, otherwise English issue body.

## Repository structure

- `SKILL.md`: Main skill definition, principles, and output format.
- `agents/openai.yaml`: Agent interface metadata and default prompt.
- `references/investigation-checklist.md`: Investigation validation checklist.
- `references/log-signal-patterns.md`: Log signal pattern reference.
- `scripts/publish_log_issue.py`: Deterministic issue publisher.

## Installation

1. Clone this repository.
2. Copy this folder to your Codex skills directory:

```bash
mkdir -p "$CODEX_HOME/skills"
cp -R app-log-issue-analysis "$CODEX_HOME/skills/app-log-issue-analysis"
```

## Usage

Invoke the skill in your prompt:

```text
Use $app-log-issue-analysis to inspect these logs and identify root causes.
```

Issue publication behavior for each confirmed finding:

1. If `gh auth status` succeeds, publish with GitHub CLI.
2. Otherwise, if `GITHUB_TOKEN` or `GH_TOKEN` exists, publish via GitHub REST API.
3. Otherwise, return draft issue content without blocking the analysis.

Each issue body always includes exactly three sections:

- Chinese: `問題描述`, `推測原因`, `重現條件（如有）`
- English: `Problem Description`, `Suspected Cause`, `Reproduction Conditions (if available)`

Best results come from including:

- Service/component name
- Environment (prod/staging/dev)
- Incident time window (with timezone)
- Correlation IDs (trace/request/job/user/tx)
- Relevant log excerpts and recent deploy/config context

## Example

### Input prompt

```text
Use $app-log-issue-analysis to investigate this production incident.

Service: payment-api
Environment: prod
Time window: 2026-02-05 09:10 UTC to 2026-02-05 09:25 UTC

Logs:
2026-02-05T09:11:03Z WARN request_id=ab12 retry=1 upstream request timed out endpoint=/charge
2026-02-05T09:11:05Z WARN request_id=ab12 retry=2 upstream request timed out endpoint=/charge
2026-02-05T09:11:07Z ERROR request_id=ab12 deadline exceeded endpoint=/charge
```

### Expected response shape

```text
1) Incident summary
- payment-api in prod shows repeated timeout escalation between 09:11:03 and 09:11:07 UTC.

2) Confirmed issues
- Symptom: escalating retries followed by deadline exceeded on /charge.
- Log evidence: request_id=ab12 has two timeout warnings then one terminal error in 4 seconds.
- Code correlation: correlate timeout path in request handler and upstream client call site.
- Root cause analysis: likely dependency latency spike with insufficient retry backoff.
- Impact: charge attempts fail for affected requests during the window.
- Recommended remediation: add bounded exponential backoff with jitter and tighten timeout budgets.

3) Hypotheses and required validation
- Check upstream latency metrics and connection pool saturation for the same window.

4) Monitoring and prevention improvements
- Add alert on timeout-rate spike and include upstream host + timeout budget fields in logs.

5) GitHub issue publication status
- Mode: gh-cli
- Created: https://github.com/<owner>/<repo>/issues/123
```

## Output expectations

The skill is designed to return:

1. Incident summary (scope, timeframe, overall status)
2. Confirmed issues ordered by severity
3. Hypotheses (when evidence is incomplete) with required validation data
4. Monitoring and prevention improvements
5. GitHub issue publication status (mode, created URLs, or drafts + reason)

## Development notes

This repository is intentionally lightweight and focused on reusable investigation guidance.

## License

MIT. See `LICENSE`.
