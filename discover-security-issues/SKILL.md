---
name: discover-security-issues
description: >-
  Discovery-only adversarial audit: map trust boundaries, run module catalogs (`agent-system`, `financial-program`, `software-system`, `combined`), reproduce exploitable behavior with payloads/commands and `path:line` evidence; prioritize impact × exploitability—**no code edits, no PRs, no auto-remediation**.
  Use for security review, vuln hunting, SQLi/XSS/auth/IDOR checks, agent prompt-injection/tool abuse, money-path races **STOP** when user wants patches shipped—hand off findings… BAD single vague “looks fine”… GOOD two-pass repro, hypothesis vs confirmed…
---

# Discover Security Issues

## Dependencies

- Required: none.
- Conditional: none.
- Optional: none.
- Fallback: not applicable.

## Non-negotiables

- **Discovery-only**: **MUST NOT** edit code, apply patches, open PRs, or run “fix workflows.”
- **MUST** keep only **reproducible** issues with exploit evidence; separate **hypotheses** from **confirmed** findings.
- **MUST** reproduce each confirmed exploit **at least twice** on the same path; use nearby payload variants for high-risk sinks.
- **MUST** discard authorship bias—treat all code as untrusted until evidence proves behavior.

## Standards (summary)

- **Evidence**: Payload/precondition, observable failure, `path:line`, commands or requests that reproduce.
- **Execution**: Pick modules → boundaries → scenarios from references → validate → prioritize → report only.
- **Quality**: Rank by impact, exploitability, reach; unknowns listed under residual risk.
- **Output**: Findings (severity-ordered), attack evidence, risk notes, hardening **advice** (not patches), residual risk.

## Workflow

**Chain-of-thought:** After each step, satisfy **`Pause →`** before continuing; halt on missing scope or contradictory module choice.

### 1) Scope and modules

- Choose one or more of: `agent-system`, `financial-program`, `software-system`, `combined` (cross-boundary chains).
- List untrusted inputs, privileged actions, and protected assets; state invariants that must hold.
   - **Pause →** Which module catalogs did I **open** (file names)—not guessed from memory?

### 2) Execute scenarios from references

- **Agent**: `references/agent-attack-catalog.md`; optional `references/security-test-patterns-agent.md` (prompt injection, tool abuse, memory/exfil paths).
- **Financial**: `references/red-team-extreme-scenarios.md`, `references/risk-checklist.md`; optional `references/security-test-patterns-finance.md` (authz, replay/race, idempotency, precision, lifecycle).
- **Software**: `references/common-software-attack-catalog.md` (SQL/NoSQL/command injection, XSS, CSRF, SSRF, traversal, upload, session/JWT, IDOR/BOLA, deserialization, misconfig).
- **Combined**: relevant subsets **plus** chains (e.g. injection → privileged API).
   - **Pause →** Did I record **payload + preconditions + observed behavior** for each candidate—not just “maybe vulnerable”?

### 3) Validate reproducibility

- Re-run each confirmed path twice; add encoding/casing/delimiter variants on hot sinks.
   - **Pause →** Is anything still “likely” without a second repro—downgrade to hypothesis?

### 4) Prioritize

- Order Critical/High → Medium → Low using impact, exploitability, blast radius (multi-tenant / cross-tenant called out).

### 5) Report only

Deliver (see **Output shape** below): findings, attack evidence, prioritization, hardening guidance (advisory), residual risk.

## Minimum coverage (apply per selected module)

- **Core**: trust boundaries, authn/authz, input → dangerous sink paths, secrets/sensitive data handling.
- **Agent**: prompt/indirect injection, unauthorized tools/actions, exfil, memory poisoning resistance.
- **Financial**: object-level authz, replay/race/idempotency, precision, oracle/side-effect safety, failure consistency.
- **Software**: injection families, XSS/CSRF/SSRF, traversal/upload, session/JWT, brute-force/rate limits, debug/CORS/secrets exposure.
- **Combined**: module checks + realistic cross-boundary chains.

## Output shape

1. **Findings** (high → low): title, severity, evidence (`path:line`), reproduction steps/payload, impacted invariant/asset.
2. **Attack evidence**: preconditions, commands/requests, observed insecure behavior, variant results.
3. **Risk prioritization**: impact, exploitability, reach; why it matters in **this** system.
4. **Hardening guidance** (advice only): fix direction, validation focus post-remediation.
5. **Residual risk**: hypotheses, assumptions, follow-up probes.

## Sample hints

- **Module**: Web API + Claude tool-use → `combined` (software + agent); deposits/withdrawals → include `financial-program`.
- **Evidence**: “SQLi possible” without two runs + exact parameter → stays **hypothesis** until repro’d.
- **Stop line**: User says “patch it now” → finish report; hand off to implementation skills—**do not** self-patch here.

## References

- `references/agent-attack-catalog.md`, `references/security-test-patterns-agent.md`
- `references/red-team-extreme-scenarios.md`, `references/risk-checklist.md`, `references/security-test-patterns-finance.md`
- `references/common-software-attack-catalog.md`, `references/test-snippets.md` (optional snippets)
