---
name: app-log-issue-analysis
description: Comprehensive application log investigation workflow that reads logs end-to-end, correlates signals with code paths and runtime context, and identifies evidence-backed issues with impact and remediation steps. Use when users ask to analyze logs, investigate incidents, find root causes from log records, explain recurring warnings/errors, or check whether logs reveal hidden system problems.
---

# App Log Issue Analysis

## Overview

Use this skill to analyze application logs systematically with the codebase and runtime context, then report confirmed issues with clear evidence, confidence, and next actions.

## Core principles

- Prioritize evidence over assumptions; avoid speculative conclusions.
- Correlate log symptoms with code paths, configuration, and external dependencies.
- Distinguish clearly between confirmed issues and hypotheses.
- Keep findings actionable: impact, urgency, and fix direction.

## Workflow

1. Define investigation scope
   - Confirm service/component, environment, and incident time window.
   - Identify relevant identifiers (trace ID, request ID, user ID, job ID, tx hash).
2. Build a timeline from logs
   - Extract key events in chronological order: deploys, config changes, warnings, errors, retries, and recoveries.
   - Group repeated symptoms by signature (error type, message prefix, stack frame, endpoint).
3. Correlate across context
   - Link related log lines using identifiers and timestamps.
   - Map stack traces and log messages to exact code locations.
   - Cross-check with runtime context (feature flags, env vars, dependency health, upstream/downstream services).
4. Validate candidate issues
   - Use `references/investigation-checklist.md` to verify each candidate issue before reporting.
   - Use `references/log-signal-patterns.md` to classify common failure patterns and avoid false positives.
5. Prioritize and propose actions
   - Rank by severity and user/business impact.
   - Recommend the smallest safe fixes first.
   - Suggest additional instrumentation only when current logs cannot confirm root cause.
6. Publish confirmed issues to GitHub
   - Resolve target repository from `--repo owner/name` or current git `origin`.
   - Detect issue language from the target repository remote README.
   - If README is Chinese, use Chinese issue sections; otherwise use English sections.
   - Auth order is strict: `gh auth status` success -> use `gh issue create`; otherwise use `GITHUB_TOKEN`/`GH_TOKEN` via GitHub REST API.
   - If both auth paths are unavailable, keep draft issue content in the response and do not block analysis.

## Evidence requirements

For each reported issue, include:

- Log evidence: concrete lines, timestamps, IDs, and frequency.
- Code evidence: `path:line` mapping to the probable failing logic.
- Impact statement: affected functionality, users, or data integrity risk.
- Confidence level: high / medium / low, with reason.

If evidence is insufficient, report as **hypothesis** and specify exactly what additional logs/metrics are needed.

## GitHub issue publishing rules

For each confirmed issue, publish exactly one GitHub issue.

Use deterministic publishing script:

```bash
python scripts/publish_log_issue.py \
  --title "[Log] <short symptom>" \
  --problem-description "<symptom + impact + key log evidence>" \
  --suspected-cause "<path:line + causal chain + confidence>" \
  --reproduction "<steps/conditions or leave empty>" \
  --repo <owner/repo>
```

Issue body sections must always include these three parts:

- Chinese-language repositories: use localized equivalents of
  `Problem Description`, `Suspected Cause`, and `Reproduction Conditions (if available)`.
- Non-Chinese repositories: use
  `Problem Description`, `Suspected Cause`, and `Reproduction Conditions (if available)`.

If reproduction is unknown, explicitly state it is not yet reliably reproducible and more runtime evidence is required.

## Output format

Use this structure in responses:

1. Incident summary
   - Scope, timeframe, and overall health status.
2. Confirmed issues (ordered by severity)
   - Symptom
   - Log evidence
   - Code correlation (`path:line`)
   - Root cause analysis
   - Impact
   - Recommended remediation
3. Hypotheses and required validation
   - What is suspected
   - Why confidence is limited
   - Required data to confirm/deny
4. Monitoring and prevention improvements
   - Missing alerts/log fields
   - Suggested guardrails or dashboards
5. GitHub issue publication status
   - Publication mode (`gh-cli` / `github-token` / `draft-only`)
   - Created issue URLs or draft bodies with fallback reason

## Resources

- `references/investigation-checklist.md`: Step-by-step checklist for evidence-driven log investigations.
- `references/log-signal-patterns.md`: Common log signatures, likely causes, validation hints, and false-positive guards.
- `scripts/publish_log_issue.py`: Deterministic issue publishing helper with auth fallback and README language detection.
