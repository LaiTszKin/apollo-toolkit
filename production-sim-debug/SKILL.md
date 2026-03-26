---
name: production-sim-debug
description: Investigate production or local simulation runs for runtime-toolchain drift, harness bugs, preset mistakes, unrealistic local stubs, or mismatches between expected and observed liquidation outcomes. Use when users ask to run bounded production simulations, explain why simulated liquidations or remediations did not happen, calibrate presets, or fix local simulation tooling so it better matches real on-chain behavior.
---

# Production Sim Debug

## Dependencies

- Required: `systematic-debug` for evidence-first root-cause analysis when a simulation shows failing or missing expected behavior.
- Conditional: `scheduled-runtime-health-check` when the user wants a bounded production/local simulation run executed and observed; `read-github-issue` when the requested simulation work is driven by a remote issue; `open-github-issue` when confirmed toolchain gaps should be published.
- Optional: none.
- Fallback: If the relevant simulation entrypoint, preset, logs, or run artifacts cannot be found, stop and report the missing evidence instead of inferring behavior from stale docs or memory.

## Standards

- Evidence: Base conclusions on the actual preset, runtime command, logs, SQLite event store, local stub responses, and the code paths that generated them.
- Execution: Reproduce with the exact scenario first, separate product logic failures from simulation-toolchain failures, make the smallest realistic toolchain fix, and rerun the same bounded scenario to validate.
- Quality: Prefer harness or stub fixes that improve realism over one-off scenario hacks, avoid duplicating existing workflow skills, and record reusable presets when a scenario becomes part of the regular test suite.
- Output: Return the scenario contract, observed outcomes, root-cause chain, fixes applied, validation evidence, and any remaining realism gaps.

## Goal

Use this skill to debug simulation workflows where the repository exposes a production-like local run path, but the observed outcomes are distorted by presets, harness logic, local stubs, event persistence, or runtime scheduling constraints.

## Workflow

### 1) Lock the simulation contract before touching code

- Identify the exact entrypoint, preset, duration, runtime mode, and rate-limit tier the user expects.
- Read the preset or scenario definition from the repository before assuming what the test means.
- Capture the intended success criteria explicitly, such as:
  - successful liquidation count
  - remediation count
  - oracle-block registration
  - profit ranking behavior
  - quote budget behavior
- If the scenario is ad hoc but likely to recur, prefer turning it into a named preset instead of leaving it as an undocumented shell invocation.

### 2) Reproduce with the real bounded run path

- Use the same production/local simulation script the repository already treats as canonical.
- Prefer a bounded run window with a stable run name and output directory.
- Save and inspect the exact artifacts produced by that run:
  - main runtime log
  - actor or stub logs
  - generated env/config files
  - SQLite or other persistence outputs
  - scenario manifest or preset-resolved settings
- Do not trust older run directories when the user asks about a new execution.

### 3) Audit the artifact chain before diagnosing product logic

- Confirm that you are reading the correct database and log files for the active run.
- Verify that the event tables you expect are actually the ones written by the runtime.
- Check whether missing results come from:
  - no candidate selection
  - no worker completion
  - planner failure
  - event persistence mismatch
  - reading the wrong file
- Treat this artifact audit as mandatory; repeated failures in the recent chats came from toolchain alignment errors before they came from liquidation logic.

### 4) Separate product failures from toolchain realism failures

- Classify each blocker into one of these buckets:
  - preset design mismatch
  - runtime scheduling or budget behavior
  - stub or mock response unrealism
  - local validator or cloned-state setup drift
  - account ordering / remaining-account mismatch
  - event-generation or persistence bug
  - genuine product logic bug
- If the symptom is caused by the local harness, fix the harness instead of masking it in runtime logic.
- If a local stub inflates or distorts profitability, preserve the runtime behavior and calibrate the stub.
- If a scenario intentionally stresses one dimension, make sure the harness is not accidentally stressing unrelated dimensions.

### 5) Trace the full decision tree for missed liquidations or remediations

- Follow the candidate from discovery through:
  - local profitability estimate
  - health precheck
  - oracle-block classification
  - remediation registration and rearm
  - quote admission
  - quote calibration
  - pre-submit verification
  - final execution or skip reason
- When the runtime reports a generic or overloaded failure label, reopen the logs and derive a finer-grained breakdown before proposing fixes.
- Distinguish fail-closed behavior from broken behavior; not all skipped liquidations are bugs.

### 6) Fix the narrowest realistic cause

- Prefer minimal fixes that improve realism or observability at the root cause:
  - add preset support to shell tooling instead of hardcoding another branch
  - make oracle-blocked paths avoid external quote I/O when a local estimate is sufficient
  - make stubs preserve run-specific metadata instead of falling back to unrealistic defaults
  - keep continuous oracle updates realistic without breaking the runtime's own core feeds
- Add or update regression tests when the bug is in the harness, runtime decision tree, or event persistence path.
- If the scenario becomes a durable benchmark, add or update the named preset and the developer docs in the same change.

### 7) Re-run the same scenario and compare outcomes

- After the fix, rerun the same scenario or the shortest bounded version that still exercises the bug.
- Compare:
  - event-table counts before and after
  - dominant skip reasons before and after
  - whether the runtime reaches the intended decision stage
  - whether the harness still resembles the user’s requested market conditions
- Do not claim success based only on unit tests when the original issue was a simulation-toolchain integration problem.

## Common failure patterns

- **Wrong artifact source**: the analyst inspects an older SQLite file or the wrong event database and concludes that runtime behavior is missing.
- **Preset says one thing, harness does another**: scenario names sound right, but the actual matrix or oracle mode does not match the user’s intent.
- **Stub realism drift**: local quote, swap, or oracle stubs distort pricing, accounts, or program IDs enough to create false failures or false profits.
- **Overloaded “unknown” failures**: logs contain structured reasons, but the first-pass analysis never decomposes them.
- **Continuous-mode self-sabotage**: a stress regime intended to stale pull oracles instead makes the runtime’s own primary feeds unusable.
- **Quote budget starvation**: local filtering improves behavior but still lets low-value cross-mint candidates consume scarce quote capacity before higher-value paths can finish.

## Output checklist

- Name the exact scenario, preset, duration, and run directory.
- State whether the root cause was product logic, toolchain realism, or both.
- Cite the artifact types used: preset, logs, SQLite tables, and code paths.
- Summarize the narrow fix and the regression test or rerun evidence.
- If the final scenario should be reused, state where the preset or docs were added.

## Example invocation

`Use $production-sim-debug to run the repository's production local simulation for 5 minutes with the named preset, explain why liquidations did not land, and fix any local harness or runtime-alignment issues that make the simulation unrealistic.`
