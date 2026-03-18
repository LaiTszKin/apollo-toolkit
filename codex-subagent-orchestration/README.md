# codex-subagent-orchestration

Use Codex subagents on nearly every non-trivial task.

This skill inspects existing custom agents under `~/.codex/agents`, reuses them when they fit, creates new focused custom agents in the official Codex TOML format when they do not, and coordinates parallel subagent work for exploration, review, verification, and unrelated module edits.

The workflow is grounded in OpenAI's Codex subagent docs and then adds a few house conventions: noun-phrase snake_case names, a fixed `developer_instructions` template, and persistence of reusable personal agents under `~/.codex/agents`.

## Highlights

- Defaults to using subagents for most non-trivial work
- Reuses existing custom agents before creating new ones
- Persists new reusable agents to `~/.codex/agents`
- Enforces narrow responsibilities and a fixed `developer_instructions` template
- Restricts reusable subagent models to `gpt-5.4` and `gpt-5.3-codex`
- Distinguishes official Codex requirements from this repository's house rules
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
    ├── openai-codex-subagents.md
    ├── custom-agent-template.toml
    └── routing-rubric.md
```

## Requirements

- Codex app or CLI with subagent support
- Write access to `~/.codex/agents`
- Current OpenAI Codex custom-agent format support

## License

MIT. See `LICENSE` for details.
