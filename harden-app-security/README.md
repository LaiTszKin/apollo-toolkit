# harden-app-security

Modular Codex skill for evidence-first adversarial security auditing across software systems.

## What this skill provides

- A reusable adversarial workflow focused on vulnerability discovery only.
- A single execution model (no interaction/auto mode split).
- Three built-in modules: `agent-system`, `financial-program`, and `software-system`.
- Expanded coverage for common software/web vulnerabilities (for example SQL injection, XSS, CSRF, SSRF, path traversal, IDOR/BOLA).
- Evidence-first triage with reproducible exploit paths and `path:line` proof.
- Reporting-first output: prioritized findings and hardening guidance without direct code remediation.

## Repository layout

- `SKILL.md`: Primary workflow, modules, and reporting format.
- `agents/openai.yaml`: Skill display metadata and default prompt.
- `references/agent-attack-catalog.md`: Agent attack scenarios.
- `references/security-test-patterns-agent.md`: Agent security test patterns.
- `references/red-team-extreme-scenarios.md`: Finance extreme attack scenarios.
- `references/risk-checklist.md`: Finance risk checklist and evidence standard.
- `references/security-test-patterns-finance.md`: Finance security test patterns.
- `references/common-software-attack-catalog.md`: Common software/web attack scenarios.
- `references/test-snippets.md`: Optional Python/TypeScript security test snippets.

## Typical workflow

1. Select module scope (`agent-system`, `financial-program`, `software-system`, or `combined`).
2. Map trust boundaries and protected invariants.
3. Execute exploit scenarios and keep only reproducible findings.
4. Re-run each exploit path and nearby payload variants to verify determinism.
5. Prioritize risks and produce a report with evidence, impact, and hardening guidance.
6. Stop at reporting; do not apply patches or open PRs.

## Example invocation

```text
Use $harden-app-security to audit this system in discovery-only mode.
Module: combined (agent-system + software-system).
Focus on prompt injection, SQL injection, IDOR, and secret exfiltration.
Provide reproducible exploit evidence with file:line and severity prioritization.
```

## License

MIT. See [LICENSE](LICENSE).
