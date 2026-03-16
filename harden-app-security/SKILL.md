---
name: harden-app-security
description: "Evidence-first adversarial security audit workflow focused on vulnerability discovery only. Use when users ask to find exploitable flaws, reproduce them with concrete evidence, and report prioritized risks across agent systems, financial programs, and common software/web apps (including SQL injection and related attacks)."
---

# Harden App Security

## Dependencies

- Required: none.
- Conditional: none.
- Optional: none.
- Fallback: not applicable.

## Standards

- Evidence: Keep only reproducible vulnerabilities with exploit payloads, exact commands or requests, and concrete code evidence.
- Execution: Stay discovery-only, choose the relevant module catalog, execute deterministic attack scenarios, and validate each exploit at least twice.
- Quality: Prioritize findings by impact, exploitability, and reach, and keep hypotheses clearly separated from confirmed risks.
- Output: Return prioritized findings, attack evidence, risk prioritization, hardening guidance, and residual risk without changing code.

## Overview

Use this skill to run adversarial security audits focused only on finding and proving vulnerabilities.

## Non-negotiable Boundaries

- This skill is discovery-only: do not edit code, do not apply patches, do not open PRs.
- Do not run "fix workflow" or "auto remediation" behavior.
- Keep only reproducible vulnerabilities with clear exploit evidence.
- Mark unverified ideas as hypotheses and separate them from confirmed findings.

## Modules

### 1) `agent-system`

- Open `references/agent-attack-catalog.md`.
- Optionally consult `references/security-test-patterns-agent.md` when you need deterministic exploit reproduction ideas.
- Focus on prompt injection, tool abuse, memory poisoning, and data exfiltration risks.

### 2) `financial-program`

- Open `references/red-team-extreme-scenarios.md` and `references/risk-checklist.md`.
- Optionally consult `references/security-test-patterns-finance.md` when you need deterministic exploit reproduction ideas.
- Focus on money-critical vulnerabilities such as broken authorization, replay/race/idempotency issues, precision loss, and lifecycle inconsistencies.

### 3) `software-system`

- Open `references/common-software-attack-catalog.md`.
- Focus on common software/web vulnerabilities such as SQL/NoSQL injection, command injection, XSS, CSRF, SSRF, path traversal, broken authentication/authorization, insecure session/JWT handling, unsafe file upload, and sensitive data exposure.

### 4) `combined`

- Run any relevant combination of modules and test cross-boundary exploit chains (for example: prompt injection triggering privileged APIs, or SQL injection used to pivot into financial transfer endpoints).

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
- Include exploit preconditions and blast radius for each confirmed issue.

### 4) Validate exploit reproducibility

- Reproduce each confirmed exploit at least twice using the same payload path.
- Add nearby payload variants (encoding, casing, delimiter tricks, parameter smuggling) for high-risk paths.
- Capture exact commands/requests and observable security failure.

### 5) Report findings only

- Deliver prioritized findings with exploit steps and evidence.
- Provide hardening recommendations as guidance only (no code changes).
- Clearly list residual risk, unknowns, and follow-up validation ideas.

## Minimum Coverage

Apply all relevant checks for selected modules:

- Core: trust-boundary enforcement, authentication/authorization checks, unsafe input-to-control-flow paths, and sensitive data handling.
- Agent system: prompt injection defense, indirect injection defense, unauthorized tool/action blocking, secret/data exfiltration blocking, memory poisoning resistance.
- Financial program: authorization/object access checks, replay/race/idempotency protection, precision and value-conservation checks, external dependency/oracle safety, lifecycle consistency under failure.
- Software system: SQL/NoSQL/command/template injection, XSS/CSRF/SSRF, path traversal and unsafe file upload, IDOR/BOLA, session/JWT weakness, insecure deserialization, weak rate limiting/brute-force resistance, security misconfiguration (CORS/debug endpoints/secrets exposure).
- Combined: include all selected module checks plus cross-boundary exploit chains.

## Output Format

1. Findings (high to low severity)
   - Title and severity
   - Evidence (`path:line`)
   - Reproduction payload and steps
   - Impacted asset/invariant
2. Attack evidence
   - Preconditions and trigger path
   - Commands/requests and observed insecure behavior
   - Reproducibility notes (including variant payload results)
3. Risk prioritization
   - Impact, exploitability, and reach
   - Why this matters in the target system context
4. Hardening guidance (advice only)
   - Recommended fix direction
   - Suggested validation focus after remediation
5. Residual risk
   - Hypotheses, assumptions, and follow-up hardening tasks

## Resources

- Agent module
  - `references/agent-attack-catalog.md`: AI agent attack surface checklist and scenario catalog.
  - `references/security-test-patterns-agent.md`: Optional exploit reproduction pattern reference.
- Financial module
  - `references/red-team-extreme-scenarios.md`: Extreme attacker scenarios for money-critical systems.
  - `references/risk-checklist.md`: Finance risk checklist and evidence standard.
  - `references/security-test-patterns-finance.md`: Optional exploit reproduction pattern reference.
- Software module
  - `references/common-software-attack-catalog.md`: Adversarial scenarios for common software/web systems.
