# Production Sim Debug

An agent skill for investigating production or local simulation runs when the observed behavior diverges from the intended market scenario or expected liquidation/remediation outcomes.

This skill helps agents reproduce a bounded simulation run, inspect the real preset and runtime artifacts, separate product bugs from local harness drift, and apply the smallest realistic fix before rerunning the same scenario.

## What this skill provides

- A workflow for bounded production/local simulation diagnosis.
- A decision tree for separating runtime logic bugs from harness, stub, preset, and persistence issues.
- A repeatable way to audit the active run directory, logs, and event database before drawing conclusions.
- Guidance for turning recurring ad hoc scenarios into named presets and documented test cases.
- Emphasis on rerunning the same scenario after a fix instead of relying only on unit tests.

## Repository structure

- `SKILL.md`: Main skill definition, workflow, and output contract.
- `agents/openai.yaml`: Agent interface metadata and default prompt.

## Installation

1. Clone this repository.
2. Copy this folder to your Codex skills directory:

```bash
mkdir -p "$CODEX_HOME/skills"
cp -R production-sim-debug "$CODEX_HOME/skills/production-sim-debug"
```

## Usage

Invoke the skill in your prompt:

```text
Use $production-sim-debug to run this repository's production local simulation with the named preset for 5 minutes, explain why remediations or liquidations did not land, and fix any harness or runtime-alignment issues you confirm.
```

Best results come from including:

- workspace path
- canonical simulation entrypoint
- preset or scenario name
- run duration
- expected market shape or success criteria
- the run directory to inspect, if it already exists
- whether toolchain fixes are in scope or the task is read-only

If the repository already has a named preset system, prefer using it instead of describing the scenario only in prose.

## Example

### Input prompt

```text
Use $production-sim-debug for this repository.

Workspace: /workspace/pangu
Entrypoint: ./scripts/run-production-local-sim.sh stress-test-1
Duration: 5 minutes
Expectations:
- Jupiter free tier
- mostly oracle-blocked positions that can be unlocked by remediation
- some directly executable opportunities
- evidence-backed explanation for why liquidations did or did not land
```

### Expected response shape

```text
1) Scenario contract
- Named preset, duration, and run directory used.

2) Observed outcomes
- Event-table counts, dominant skip reasons, and runtime stage reached.

3) Root cause
- Whether the main blocker was product logic, quote budget, preset design, or harness/stub drift.

4) Fixes applied
- Toolchain or runtime fixes with file paths.

5) Validation
- Rerun or targeted tests proving the intended stage now executes.

6) Remaining gaps
- Any realism differences still left between local simulation and chain behavior.
```

## License

MIT. See `LICENSE`.
