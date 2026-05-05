# discover-security-issues

Evidence-first, **discovery-only** adversarial security workflow across agent, financial, and general software surfaces.

## What this skill provides

- Reproduce exploitable behavior with payloads, requests, and `path:line` proof—**no patches or PRs**.
- Modules: `agent-system`, `financial-program`, `software-system`, and `combined` (cross-boundary chains).
- Catalog-driven scenarios (SQLi, XSS, CSRF, SSRF, IDOR, prompt injection, money-path races, …).
- Prioritized reporting plus advisory hardening notes and residual risk.

## Layout

- `SKILL.md` — workflow, modules, output shape.
- `agents/openai.yaml` — metadata and default prompt.
- `references/*` — attack catalogs and optional test-pattern snippets.

## Typical use

1. Pick module(s) and trust boundaries.
2. Walk selected reference catalogs; record only **double-reproduced** issues.
3. Prioritize and report; stop before implementation—hand off confirmed findings if fixes are needed.

## Example

```text
Use $discover-security-issues in discovery-only mode.
Module: combined (agent-system + software-system).
Focus: prompt injection to privileged tools, SQL injection, IDOR.
Deliver severity-ordered findings with exploit steps and path:line evidence.
```

## License

MIT. See [LICENSE](LICENSE).
