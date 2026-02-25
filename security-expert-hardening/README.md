# security-expert-hardening

Modular Codex skill for evidence-first security hardening across software systems.

## What this skill provides

- A reusable security workflow that can be applied across domains.
- Two execution modes: default `interaction` mode and user-requested `auto` mode.
- Two built-in modules: `agent-system` and `financial-program`.
- Evidence-first triage with reproducible exploit paths and `path:line` proof.
- Failing-then-passing security regression testing guidance.
- Minimal-fix remediation approach to block exploit paths without over-refactoring.
- In `auto` mode, confirmed issues are fixed in an isolated worktree, pushed to a remote branch, and opened as PRs.

## Repository layout

- `SKILL.md`: Primary workflow, modules, and reporting format.
- `agents/openai.yaml`: Skill display metadata and default prompt.
- `references/agent-attack-catalog.md`: Agent attack scenarios.
- `references/security-test-patterns-agent.md`: Agent security test patterns.
- `references/test-snippets.md`: Python/TypeScript security test snippets.
- `references/red-team-extreme-scenarios.md`: Finance extreme attack scenarios.
- `references/risk-checklist.md`: Finance risk checklist and evidence standard.
- `references/security-test-patterns-finance.md`: Finance security test patterns.

## Typical workflow

1. Select execution mode (`interaction` by default, `auto` only when explicitly requested).
2. Select module scope (`agent-system`, `financial-program`, or `combined`).
3. Map trust boundaries and protected invariants.
4. Execute exploit scenarios and keep only reproducible findings.
5. Write failing exploit-path tests first.
6. Apply minimal safe fixes and re-run security tests.
7. In `auto` mode with confirmed findings, create worktree, push branch, and open a PR using the repository's standard workflow (prefer `gh pr create`).

## Example invocation

```text
Use $security-expert-hardening to audit this system.
Module: combined.
Focus on prompt injection that could trigger money-moving tools, replay/race conditions,
and secret exfiltration. Provide evidence with file:line and failing tests first.
```

## License

MIT. See [LICENSE](LICENSE).
