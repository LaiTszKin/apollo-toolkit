---
name: scheduled-runtime-health-check
description: Use a background terminal to run a user-specified command immediately or in a requested time window, and optionally explain findings from the captured logs after the run. Use when users want timed project execution, bounded runtime checks, or post-run log-based findings.
---

# Scheduled Runtime Health Check

## Dependencies

- Required: `analyse-app-logs` when the user asks for post-run log findings or when the observed run needs evidence-backed diagnosis.
- Conditional: `improve-observability` when current logs cannot prove module health or root cause.
- Optional: `open-github-issue` indirectly through `analyse-app-logs` when confirmed issues should be published.
- Fallback: If no scheduler or automation capability is available for the requested future start time, stop and report that scheduling could not be created; only run immediately when the user explicitly allows an immediate bounded observation instead of a timed start.

## Standards

- Evidence: Anchor every conclusion to the requested command, execution window, startup/shutdown timestamps, one canonical run folder or artifact root, captured logs, and concrete runtime signals.
- Execution: Collect the run contract, verify the real stop mechanism before launch, choose the highest-fidelity execution mode that matches the user's intent, use a background terminal, optionally update the code only when the user asks, execute the requested command immediately or in the requested window, record the canonical run folder once the process materializes it, capture logs, stop cleanly when bounded, then delegate log review to `analyse-app-logs` only when findings are requested or needed.
- Quality: Keep scheduling, execution, and shutdown deterministic; separate confirmed findings from hypotheses; and mark each assessed module healthy/degraded/failed/unknown with reasons.
- Output: Return the run configuration, execution status, log locations, optional code-update result, optional module health by area, confirmed issues, potential issues, observability gaps, and scheduler status when applicable.

## Overview

Use this skill when the user wants an agent to do work in this shape:

- use a background terminal for the whole run
- execute a specific command such as `npm run dev`, `docker compose up`, or another repo-defined entrypoint
- optionally update the project before execution when the user explicitly asks
- optionally run it inside a specific time window
- optionally wait for the run to finish and then explain findings from the logs

Canonical task shape:

`Use $scheduled-runtime-health-check to use a background terminal to run <command>.`

Optional suffixes:

- `Before running, update this project to the latest safe code state.`
- `Run it in this specific time window: <window>.`
- `After the run completes, explain your findings from the logs.`

This skill is an orchestration layer. It owns the background terminal session, optional code-update step, optional scheduling, bounded runtime, log capture, and optional module-level health summary. It delegates deep log diagnosis to `analyse-app-logs` only when the user asks for findings or the run clearly needs evidence-backed analysis.

## Core principles

- Prefer one bounded observation window over open-ended monitoring.
- Use one dedicated background terminal session per requested run so execution and logs stay correlated.
- Record the canonical run directory, artifact root, or other generated output location as soon as it exists, and use that as the source of truth for later analysis.
- When a repository exposes both synthetic harnesses and production-like runtime entrypoints, prefer the production-like path for claims about real runtime, market, or operator behavior; use the lower-fidelity harness only when the user explicitly asked for it or when it is the only safe reproduction surface.
- Treat code update as optional and only perform it when the user explicitly requests it.
- Treat startup, steady-state, and shutdown as part of the same investigation.
- Do not call a module healthy unless there is at least one positive signal for it.
- Separate scheduler failures, boot failures, runtime failures, and shutdown failures.
- For complex pipelines, identify the last successful stage before attributing the failure to application logic.
- When the user asks to compare a bounded run with a previous run, compare only runs with the same command or preset, duration, runtime mode, and complete structured artifacts. If the previous run lacks canonical reports, databases, or startup artifacts, mark the runs incomparable and explain the artifact completeness gap instead of inventing performance deltas.
- If logs cannot support a health judgment, mark the module as `unknown` instead of guessing.

## Required workflow

1. Define the run contract
   - Confirm or derive the workspace, execution command, optional code-update step, optional schedule, optional duration, readiness signal, log locations, and whether post-run findings are required.
   - Derive commands from trustworthy sources first: `package.json`, `Makefile`, `docker-compose.yml`, `Procfile`, scripts, or project docs.
   - If multiple commands exist for the same workflow, rank them by fidelity and state explicitly which mode you are choosing: production-like runtime, bounded integration harness, or synthetic scenario replay.
   - If no trustworthy execution command or stop method can be found, stop and ask only for the missing command rather than guessing.
2. Prepare the background terminal run
   - Use a dedicated background terminal session for the whole workflow.
   - Create a dedicated run folder and record timezone, cwd, requested command, terminal session identifier, and any requested start/end boundaries.
   - Capture stdout and stderr from the beginning of the session so the full run stays auditable.
   - Identify and record the exact bounded-stop mechanism before launch: signal path, wrapper script, env var names, CLI flags, PID capture, and any project-specific shutdown helper.
   - Decide in advance what the canonical evidence root will be if the command generates its own run directory, artifact bundle, database, or report file, so later diagnosis does not drift across multiple runs.
3. Optionally update to the latest safe code state
   - Only do this step when the user explicitly asked to update the project before execution.
   - Prefer the repository's normal safe update path, such as `git pull --ff-only`, or the project's documented sync command if one exists.
   - Record the commit before and after the update.
   - If the worktree is dirty, the branch has no upstream, or the update cannot be done safely, stop and report the exact blocker instead of guessing or forcing a merge.
4. Choose the execution timing
   - If the user gave a specific time window, schedule or delay the same background-terminal run to start in that window.
   - If no time window was requested, run immediately after setup, or after the optional update step if one was requested.
   - If the user requested a future start time and no reliable scheduler is available, fail closed and report the scheduling limitation instead of starting early.
5. Run and capture readiness
   - Execute the requested command in the same background terminal.
   - As soon as the command emits or creates its canonical run directory, artifact root, or equivalent output location, record that path and reuse it for every later check.
   - Report the exact runtime mode used in the evidence record so later analysis does not accidentally treat synthetic-harness results as proof about production behavior.
   - Wait for a concrete readiness signal when the command is expected to stay up, such as a health endpoint, listening-port log, worker boot line, or queue-consumer ready message.
   - If readiness never arrives, stop the run, preserve logs, and treat it as a failed startup window.
6. Observe and stop when bounded
   - If a bounded window or explicit stop time was requested, keep the process running only for that agreed window and then stop it cleanly.
   - Do not rely only on the child command to self-terminate on time; track the wall-clock deadline yourself and enforce the stop sequence when the deadline is reached.
   - Track crashes, restarts, retry storms, timeout bursts, stuck jobs, resource pressure, and repeated warnings during the run.
   - Use the project's normal shutdown path first; if graceful stop fails, escalate deterministically and record the exact stop sequence and timestamps.
   - If the process overruns the agreed window, stop it immediately, mark the run as an overrun, and report whether the cause was a bad wrapper contract, a missing stop hook, or a failed shutdown.
7. Explain findings from logs when requested
   - If the user asked for findings after completion, wait for the run to finish before analyzing the captured logs.
   - Invoke `analyse-app-logs` on only the captured runtime window.
   - Pass the service or module names, environment, timezone, canonical run folder, relevant log files, and the exact start/end boundaries.
   - When the command produced reports, databases, or other structured artifacts, compare them against the same run's logs before making a health judgment.
   - For follow-up questions about why most business events did not happen, build a stage-by-stage funnel from the canonical artifacts before reading isolated logs: candidate counts, admission/precheck decisions, queue or governor outcomes, skipped/blocked reasons, executed counts, retry/remediation outcomes, and persistence records.
   - For follow-up questions about runtime speed, report latency from structured timestamps when available, separating startup/readiness, queue wait, precheck/final-prepare, submission, confirmation, and end-to-end timings rather than collapsing them into one vague duration.
   - Reuse its confirmed issues, hypotheses, and monitoring improvements instead of rewriting a separate incident workflow.
8. Produce the final report
   - Always summarize the actual command executed, actual start/end timestamps, execution status, and log locations.
   - Include the code-update result only when an update step was requested.
   - When findings were requested, classify each relevant module as `healthy`, `degraded`, `failed`, or `unknown` with concrete evidence and separate observed issues from risks that still need validation.

## Scheduling rules

- Use the user's locale timezone when configuring scheduled tasks.
- Name scheduled jobs clearly so the user can recognize start, stop, and analysis ownership.
- Prefer recurring schedules only when the user explicitly wants repeated checks; otherwise create a one-off bounded run.
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
   - Workspace, command, schedule if any, actual start/end timestamps, duration if bounded, readiness result, shutdown result if applicable, canonical run folder or artifact root, and log locations.
2. Execution result
   - Whether the command completed, stayed up for the requested window, or failed early.
3. Code update result
   - Include only when an update step was requested. Record the update command, before/after commit, or the exact blocker.
4. Module health
   - Include only when findings were requested or health assessment was part of the task. One entry per module with status (`healthy` / `degraded` / `failed` / `unknown`) and evidence.
5. Confirmed issues
   - Include only when log analysis was requested. Reuse evidence-backed findings from `analyse-app-logs`.
6. Potential issues and validation needed
   - Include only when log analysis was requested. Risks that appeared in the run but need more evidence.
7. Observability gaps
   - Include only when log analysis was requested. Missing logs, metrics, probes, or correlation IDs that blocked diagnosis.
8. Automation or scheduler status
   - Include only when a future window or scheduler was involved. Record task identifiers, execution status, and whether future cleanup is needed.

## Guardrails

- Do not let the project continue running past the agreed window unless the user explicitly asks.
- Do not assume the documented bound is real until the wrapper or script implementation confirms it.
- Do not perform a code-update step unless the user explicitly asked for it.
- Do not claim steady-state health from startup-only evidence.
- Keep the run folder and scheduler metadata so the investigation can be reproduced.
- If current logs are too weak to judge module health, recommend `improve-observability` instead of stretching the evidence.
