# Output Format

Use this structure in responses:

1. Run summary
   - Workspace, command, schedule if any, actual start/end timestamps, bounded execute duration, total wall-clock duration, readiness result, shutdown result if applicable, canonical run folder or artifact root, and log locations.
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
