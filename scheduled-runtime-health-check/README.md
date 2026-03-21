# Scheduled Runtime Health Check

An agent skill for running user-requested commands in a background terminal, optionally inside a bounded time window with post-run log analysis.

This skill helps agents use a background terminal to run a requested command immediately or in a chosen time window, and optionally summarize evidence-backed findings from the resulting logs via `analyse-app-logs`.

## What this skill provides

- A workflow for one-off or recurring background-terminal runtime checks.
- An optional code-update step before execution.
- Clear separation between scheduling, runtime observation, shutdown, and diagnosis.
- A bounded log window so startup, steady-state, and shutdown evidence stay correlated.
- Optional module-level health classification: `healthy`, `degraded`, `failed`, or `unknown`.
- Escalation to `improve-observability` when existing telemetry is insufficient.

## Repository structure

- `SKILL.md`: Main skill definition, workflow, and output format.
- `agents/openai.yaml`: Agent interface metadata and default prompt.
- Dependency skill: `analyse-app-logs` for evidence-backed post-run diagnosis.

## Installation

1. Clone this repository.
2. Copy this folder to your Codex skills directory:

```bash
mkdir -p "$CODEX_HOME/skills"
cp -R scheduled-runtime-health-check "$CODEX_HOME/skills/scheduled-runtime-health-check"
```

## Usage

Invoke the skill in your prompt:

```text
Use $scheduled-runtime-health-check to use a background terminal to run `docker compose up app worker`.

Run it in this specific time window: 2026-03-18 22:00 to 2026-03-19 04:00 Asia/Hong_Kong.

After the run completes, explain your findings from the logs.
```

Best results come from including:

- workspace path
- execution command
- stop command or acceptable shutdown method
- schedule/time window and timezone
- duration when bounded
- readiness signal
- relevant log files
- modules or subsystems to assess when findings are requested
- whether the repository should be updated first, only if you want that behavior

If no trustworthy start command is documented, the agent should derive it from the repository or ask only for that missing command.
If the user requests a future start time and no reliable scheduler is available, the agent should report that limitation instead of starting the run early.
If an optional update step was requested but the repository cannot be updated safely because the worktree is dirty or no upstream is configured, the agent should stop and report that exact blocker instead of forcing an update.

## Example

### Input prompt

```text
Use $scheduled-runtime-health-check for this repository.

Workspace: /workspace/my-app
Execution command: docker compose up app worker
Stop command: docker compose down
Schedule: 2026-03-18 22:00 Asia/Hong_Kong
Duration: 6 hours
Readiness signal: GET http://127.0.0.1:3000/health returns 200
Logs: docker compose logs, logs/app.log, logs/worker.log
Modules to assess: api, worker, scheduler
After completion: explain findings from the logs
```

### Expected response shape

```text
1) Run summary
- Started at 2026-03-18 22:00 HKT and stopped at 2026-03-19 04:00 HKT after a 6-hour bounded run.

2) Execution result
- The background terminal completed the requested run workflow and kept the services up for the full window.

3) Module health
- api: healthy, served readiness checks and no error bursts were observed.
- worker: degraded, repeated timeout warnings increased after 01:20 HKT.
- scheduler: unknown, no positive execution signal was emitted during the window.

4) Confirmed issues
- Reuse evidence-backed findings from $analyse-app-logs.

5) Potential issues and validation needed
- Scheduler may not be firing jobs; add a per-job execution log or metric to confirm.

6) Observability gaps
- Missing correlation IDs between api requests and worker jobs.

7) Automation or scheduler status
- One bounded scheduled run completed and no further cleanup is required.
```

## License

MIT. See `LICENSE`.
