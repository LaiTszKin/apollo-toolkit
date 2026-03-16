# Architecture

## 1. High-Level Structure

- Entry points: [CLI/server/app/worker]
- Major modules: [module names and responsibilities]
- Data flow summary: [request/event/job flow]
- Integration boundaries: [DB/API/queue/filesystem]

## 2. Directory Guide

| Path | Responsibility |
| --- | --- |
| `[path]` | [What lives here] |
| `[path]` | [What lives here] |

## 3. Key Flows

### [Flow Name]
- Trigger: [route/command/job]
- Main steps: [step summary]
- Dependencies: [internal/external]
- Failure boundaries: [where failures surface]

## 4. Operational Notes

- State/storage model: [DB/files/cache/queue]
- Concurrency or ordering concerns: [if any]
- Observability entrypoints: [logs/metrics/traces/dashboards]
