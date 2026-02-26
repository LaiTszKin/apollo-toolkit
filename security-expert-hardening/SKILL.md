---
name: security-expert-hardening
description: "Modular security expert workflow for evidence-first red-team audits with two execution modes: default interaction mode and user-requested auto mode. Use when users ask to find exploitable vulnerabilities, prove exploitability with reproducible evidence, implement minimal safe fixes, and add failing-then-passing security regression tests. Includes modules for agent systems and financial programs."
---

# Security Expert Hardening

## Overview

Use this skill to run evidence-first security audits for software systems. Always follow the core workflow, then activate one or both domain modules: `agent-system` and `financial-program`.

## Execution Modes

### 1) `interaction` (default)

- Use this mode unless the user explicitly requests `auto`.
- Run the full audit workflow and provide evidence-backed findings, remediation plan, tests, and validation.
- Do not auto-create worktrees or PRs unless the user asks for `auto` mode.

### 2) `auto` (explicit user opt-in)

- Activate only when the user explicitly requests `auto` mode.
- If confirmed issues exist, continue automatically through remediation and PR delivery.
- If no confirmed issues exist, report results and skip worktree/PR creation.

### Mode selection rules

- If mode is not specified or is ambiguous, use `interaction`.
- Only switch to `auto` on explicit requests (for example: "auto mode", "directly fix and open PR", "fix automatically and open PR").

## Modules

### 1) `agent-system`

- Open `references/agent-attack-catalog.md` and `references/security-test-patterns-agent.md`.
- Focus on prompt injection, tool abuse, memory poisoning, and data exfiltration risks.

### 2) `financial-program`

- Open `references/red-team-extreme-scenarios.md`, `references/risk-checklist.md`, and `references/security-test-patterns-finance.md`.
- Focus on money-critical vulnerabilities such as broken authorization, replay/race/idempotency issues, precision loss, and lifecycle inconsistencies.

### 3) `combined`

- Run both modules and test cross-boundary exploit chains (for example: injected prompts triggering money-moving actions).

## Core Workflow

### 1) Scope and define trust boundaries

- List untrusted inputs, privileged actions, and protected assets before testing.
- Define module-specific invariants that must never break.

### 2) Execute attack scenarios and capture evidence

- Run deterministic exploit scenarios from the selected module references.
- Record payload, preconditions, observed behavior, and exact code evidence (`path:line`).
- Keep only reproducible findings; mark anything else as hypothesis.

### 3) Prioritize confirmed risks

- Score each finding by impact and exploitability (add system reach for multi-tenant or high-blast-radius risks).
- Prioritize Critical/High first, then Medium, then Low.
- Define the security test plan for each confirmed risk before implementation.

### 4) Write failing exploit-path tests first

- Add at least one failing security test per confirmed risk.
- Use `references/test-snippets.md` as the starting template where applicable.
- Include nearby payload variants and boundary/extreme cases for critical paths.

### 5) Apply minimal safe fixes

- Patch root causes with the smallest viable change set.
- Add controls at the trust boundary where unsafe input first affects control flow.
- Avoid unrelated refactors while remediating security issues.

### 6) Validate and report

- Run targeted security tests first, then relevant broader suites.
- Confirm each previously failing exploit-path test now passes.
- Report residual risk, assumptions, and deferred hardening work.

### 7) Interaction-mode handoff (`interaction` only)

- Stop after presenting findings, remediation, tests, and validation results.
- Wait for user direction before any branch submission/PR actions.

### 8) Auto-mode remediation delivery (`auto` only)

- Create an isolated git worktree and dedicated branch before remediation work.
- Apply minimal safe fixes and security regression tests in that worktree.
- Re-run required validation in the worktree.
- For remote branch submission and PR creation, use the repository's standard git workflow (push branch, then open PR).
- Prefer `gh pr create` when GitHub CLI is available and authenticated.
- Return worktree path, branch name, and PR link in the final report.

## Minimum Coverage

Apply all relevant checks for selected modules:

- Core: trust-boundary enforcement, authorization checks, unsafe input-to-control-flow paths, and sensitive data handling.
- Agent system: prompt injection defense, indirect injection defense, unauthorized tool/action blocking, secret/data exfiltration blocking, memory poisoning resistance.
- Financial program: authorization/object access checks, replay/race/idempotency protection, precision and value-conservation checks, external dependency/oracle safety, lifecycle consistency under failure.
- Combined: include all agent and financial checks plus cross-boundary exploit chains.

## Output Format

1. Findings (high to low severity)
   - Title and severity
   - Evidence (`path:line`)
   - Reproduction payload and steps
   - Impacted asset/invariant
2. Remediation
   - Minimal patch summary
   - Why the fix blocks exploitation
3. Tests
   - Added/updated test names and paths
   - Attack path each test proves
4. Validation
   - Commands executed
   - Pass/fail summary
5. Residual risk
   - Hypotheses, assumptions, and follow-up hardening tasks
6. Delivery (`auto` mode only)
   - Worktree path and branch name
   - Branch push and PR creation command/results
   - Remote branch and PR link

## Resources

- Agent module
  - `references/agent-attack-catalog.md`: AI agent attack surface checklist and scenario catalog.
  - `references/security-test-patterns-agent.md`: Deterministic exploit-path tests for agent security controls.
- Financial module
  - `references/red-team-extreme-scenarios.md`: Extreme attacker scenarios for money-critical systems.
  - `references/risk-checklist.md`: Finance risk checklist and evidence standard.
  - `references/security-test-patterns-finance.md`: Attack-driven test patterns for finance applications.
- Shared
  - `references/test-snippets.md`: Adaptable Python/TypeScript security test templates.
