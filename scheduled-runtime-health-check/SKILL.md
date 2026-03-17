---
name: scheduled-runtime-health-check
description: Coordinate a scheduled, bounded project run that starts automatically, stays up for a fixed observation window, stops cleanly, and delegates log-based health analysis to analyse-app-logs. Use when users want timed project startups, post-run health checks across modules, and a report of confirmed issues and potential risks.
---

# Scheduled Runtime Health Check

## Dependencies

- Required: `analyse-app-logs` for bounded post-run log analysis.
- Conditional: `improve-observability` when current logs cannot prove module health or root cause.
- Optional: `open-github-issue` indirectly through `analyse-app-logs` when confirmed issues should be published.
- Fallback: If no scheduler or automation capability is available for the requested future start time, stop and report that scheduling could not be created; only run immediately when the user explicitly allows an immediate bounded observation instead of a timed start.

## Standards

- Evidence: Anchor every conclusion to the scheduled window, startup/shutdown timestamps, captured logs, and concrete module signals.
- Execution: Collect the run contract, choose a scheduling mechanism, capture logs, run for a bounded window, stop cleanly, then delegate the review to `analyse-app-logs`.
- Quality: Keep scheduling and shutdown deterministic, separate confirmed findings from hypotheses, and mark each module healthy/degraded/failed/unknown with reasons.
- Output: Return the run configuration, module health by area, confirmed issues, potential issues, observability gaps, and automation or scheduler status.

## Overview

Use this skill when the user wants an agent to:

- start a project at a specific time
- keep it running for a fixed window such as 6 hours
- stop it automatically at the end of that window
- collect logs from startup through shutdown
- assess whether key modules behaved normally
- identify confirmed problems and potential risks from the observed run

This skill is an orchestration layer. It owns the schedule, bounded runtime, log capture, and module-level health summary. It delegates deep log diagnosis to `analyse-app-logs`.

## Core principles

- Prefer one bounded observation window over open-ended monitoring.
- Treat startup, steady-state, and shutdown as part of the same investigation.
- Do not call a module healthy unless there is at least one positive signal for it.
- Separate scheduler failures, boot failures, runtime failures, and shutdown failures.
- If logs cannot support a health judgment, mark the module as `unknown` instead of guessing.

## Required workflow

1. Define the run contract
   - Confirm or derive the workspace, start command, stop method, schedule, duration, readiness signal, log locations, and modules to assess.
   - Derive commands from trustworthy sources first: `package.json`, `Makefile`, `docker-compose.yml`, `Procfile`, scripts, or project docs.
   - If no trustworthy start command or stop method can be found, stop and ask only for the missing command rather than guessing.
2. Choose the scheduling mechanism
   - Prefer the host's native automation or scheduled-task system when available.
   - Prefer a single scheduled execution that performs start -> observe -> stop -> analyze so the log window is exact.
   - If the platform cannot hold a long-running scheduled task, use paired start/stop jobs and record both task identifiers.
   - If the user requested a future start time and no reliable scheduler is available, fail closed and report the scheduling limitation instead of starting early.
3. Prepare bounded log capture
   - Create a dedicated run folder for the window and record absolute start time, intended end time, timezone, cwd, command, and PID or job identifier.
   - Capture stdout and stderr for the started process, plus any existing app log files that matter for diagnosis.
   - Keep startup, runtime, and shutdown evidence in the same run record.
4. Start and verify readiness
   - Launch the project at the scheduled time.
   - Wait for a concrete readiness signal such as a health endpoint, listening-port log, worker boot line, or queue-consumer ready message.
   - If readiness never arrives, stop the run, preserve logs, and analyze the failed startup window.
5. Observe during the bounded window
   - Track crashes, restarts, retry storms, timeout bursts, stuck jobs, resource pressure, and repeated warnings.
   - For each requested module or subsystem, gather at least one positive signal and any degradation signal in the same window.
   - If the user did not list modules explicitly, infer the major runtime modules from the repository structure and runtime processes.
6. Stop cleanly at the end of the window
   - Use the project's normal shutdown path first.
   - If graceful stop fails, escalate deterministically and record the exact stop sequence and timestamps.
   - Treat abnormal shutdown behavior as a health signal, not just an operational detail.
7. Delegate bounded log analysis
   - Invoke `analyse-app-logs` on only the captured runtime window.
   - Pass the service or module names, environment, timezone, run folder, relevant log files, and the exact start/end boundaries.
   - Reuse its confirmed issues, hypotheses, and monitoring improvements instead of rewriting a separate incident workflow.
8. Produce the runtime health report
   - Summarize the schedule that was executed, whether readiness succeeded, how long the project stayed healthy, and how shutdown behaved.
   - Classify each module as `healthy`, `degraded`, `failed`, or `unknown` with concrete evidence.
   - Separate already observed issues from potential risks that need more telemetry or a longer run to confirm.

## Scheduling rules

- Use the user's locale timezone when configuring scheduled tasks.
- Name scheduled jobs clearly so the user can recognize start, stop, and analysis ownership.
- Prefer recurring schedules only when the user explicitly wants repeated health checks; otherwise create a one-off bounded run.
- If the host provides agent automations, use them before inventing project-local scheduling files.
- If native automation is unavailable, prefer the smallest reliable OS-level scheduling method already present on the machine.
- If the request depends on a future start time and no reliable scheduling method exists, do not silently convert the request into an immediate run.

## Health classification rubric

- `healthy`: positive startup signal, expected runtime behavior, and no material degradation in the chosen window.
- `degraded`: module stays up but shows retries, warnings, latency spikes, partial failures, or other recurring stress signals.
- `failed`: boot failure, repeated crash, readiness failure, fatal error loop, or inability to perform its core responsibility.
- `unknown`: logs or probes do not provide enough evidence to justify a health call.

Absence of errors alone is not enough for `healthy`.

## Output format

Use this structure in responses:

1. Run summary
   - Workspace, schedule, actual start/end timestamps, duration, readiness result, shutdown result, and log locations.
2. Module health
   - One entry per module with status (`healthy` / `degraded` / `failed` / `unknown`) and evidence.
3. Confirmed issues
   - Reuse evidence-backed findings from `analyse-app-logs`.
4. Potential issues and validation needed
   - Risks that appeared in the run but need more evidence.
5. Observability gaps
   - Missing logs, metrics, probes, or correlation IDs that blocked diagnosis.
6. Automation or scheduler status
   - Created task identifiers, execution status, and whether future cleanup is needed.

## Guardrails

- Do not let the project continue running past the agreed window unless the user explicitly asks.
- Do not claim steady-state health from startup-only evidence.
- Keep the run folder and scheduler metadata so the investigation can be reproduced.
- If current logs are too weak to judge module health, recommend `improve-observability` instead of stretching the evidence.
