# Scheduled Runtime Health Check

An agent skill for scheduled, bounded project runs with post-run health analysis.

This skill helps agents start a project at a chosen time, keep it alive for a fixed observation window, stop it automatically, collect the relevant logs, and summarize module health with evidence-backed findings from `analyse-app-logs`.

## What this skill provides

- A workflow for one-off or recurring runtime health checks.
- Clear separation between scheduling, runtime observation, shutdown, and diagnosis.
- A bounded log window so startup, steady-state, and shutdown evidence stay correlated.
- Module-level health classification: `healthy`, `degraded`, `failed`, or `unknown`.
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
Use $scheduled-runtime-health-check to start this project at 22:00, keep it running for 6 hours, stop it automatically, and analyze whether the API, worker, and scheduler modules stayed healthy.
```

Best results come from including:

- workspace path
- start command
- stop command or acceptable shutdown method
- schedule and timezone
- duration
- readiness signal
- relevant log files
- modules or subsystems to assess

If no trustworthy start command is documented, the agent should derive it from the repository or ask only for that missing command.
If the user requests a future start time and no reliable scheduler is available, the agent should report that limitation instead of starting the run early.

## Example

### Input prompt

```text
Use $scheduled-runtime-health-check for this repository.

Workspace: /workspace/my-app
Start command: docker compose up app worker
Stop command: docker compose down
Schedule: 2026-03-18 22:00 Asia/Hong_Kong
Duration: 6 hours
Readiness signal: GET http://127.0.0.1:3000/health returns 200
Logs: docker compose logs, logs/app.log, logs/worker.log
Modules to assess: api, worker, scheduler
```

### Expected response shape

```text
1) Run summary
- Started at 2026-03-18 22:00 HKT and stopped at 2026-03-19 04:00 HKT after a 6-hour bounded run.

2) Module health
- api: healthy, served readiness checks and no error bursts were observed.
- worker: degraded, repeated timeout warnings increased after 01:20 HKT.
- scheduler: unknown, no positive execution signal was emitted during the window.

3) Confirmed issues
- Reuse evidence-backed findings from $analyse-app-logs.

4) Potential issues and validation needed
- Scheduler may not be firing jobs; add a per-job execution log or metric to confirm.

5) Observability gaps
- Missing correlation IDs between api requests and worker jobs.

6) Automation or scheduler status
- One bounded scheduled run completed and no further cleanup is required.
```

## License

MIT. See `LICENSE`.
