# codex-subagent-orchestration

Use Codex subagents on nearly every non-trivial task.

This skill inspects existing custom agents under `~/.codex/agents`, reuses them when they fit, creates new focused custom agents in the official Codex TOML format when they do not, and coordinates parallel subagent work for exploration, review, verification, and unrelated module edits.

## Highlights

- Defaults to using subagents for most non-trivial work
- Explicitly instructs Codex to spawn subagents for non-trivial work
- Reuses existing custom agents before creating new ones
- Persists new reusable agents to `~/.codex/agents`
- Enforces narrow responsibilities and a fixed `developer_instructions` template
- Restricts reusable subagent models to `gpt-5.4` and `gpt-5.3-codex`
- Keeps tightly coupled serial work in the main agent

## Project Structure

```text
.
├── SKILL.md
├── LICENSE
├── README.md
├── agents/
│   └── openai.yaml
└── references/
    ├── custom-agent-template.toml
    └── routing-rubric.md
```

## Requirements

- Codex app or CLI with subagent support
- Write access to `~/.codex/agents`
- Custom agent TOML format support

## License

MIT. See `LICENSE` for details.
