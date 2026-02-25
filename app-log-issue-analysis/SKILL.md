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

## Evidence requirements

For each reported issue, include:

- Log evidence: concrete lines, timestamps, IDs, and frequency.
- Code evidence: `path:line` mapping to the probable failing logic.
- Impact statement: affected functionality, users, or data integrity risk.
- Confidence level: high / medium / low, with reason.

If evidence is insufficient, report as **hypothesis** and specify exactly what additional logs/metrics are needed.

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

## Resources

- `references/investigation-checklist.md`: Step-by-step checklist for evidence-driven log investigations.
- `references/log-signal-patterns.md`: Common log signatures, likely causes, validation hints, and false-positive guards.
