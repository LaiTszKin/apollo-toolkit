# OpenAI Codex subagents notes

Verified on 2026-03-18 from the official OpenAI Codex docs:

- [Subagents](https://developers.openai.com/codex/subagents)
- [Subagents concepts](https://developers.openai.com/codex/concepts/subagents)

## Official Codex facts this skill depends on

- Codex only spawns subagents when explicitly asked to do so.
- Custom agents can live in `~/.codex/agents/` for personal reuse or `.codex/agents/` for project-scoped reuse.
- Each custom agent file must define `name`, `description`, and `developer_instructions`.
- The `name` field is the source of truth; matching the filename to the name is only the simplest convention.
- Optional fields such as `nickname_candidates`, `model`, `model_reasoning_effort`, `sandbox_mode`, `mcp_servers`, and `skills.config` can be set per custom agent.
- Custom agents inherit the parent session's runtime behavior unless the custom agent configuration narrows it further.
- Global orchestration settings live under `[agents]`, including `agents.max_threads`, `agents.max_depth`, and `agents.job_max_runtime_seconds`.
- OpenAI recommends parallel subagents especially for read-heavy work such as exploration, triage, tests, and summarization, and warns to be more careful with parallel write-heavy workflows.
- OpenAI's current model catalog says to start with `gpt-5.4` when you are not sure which model to choose.
- The current `gpt-5.4` model page says `reasoning.effort` supports `none`, `low`, `medium`, `high`, and `xhigh`.
- The current `gpt-5.3-codex` model page says it is optimized for agentic coding tasks and supports `low`, `medium`, `high`, and `xhigh` reasoning effort.
- The best custom agents are narrow and opinionated, with a clear job and clear boundaries.

## House conventions added by this skill

These rules are not required by OpenAI, but this skill standardizes them for better reuse:

- use short English noun phrases normalized to snake_case for every custom-agent `name`
- keep the filename equal to the `name` unless there is a strong reason not to
- use the fixed `developer_instructions` section order from `references/custom-agent-template.toml`
- restrict reusable subagent model choices in this repository to `gpt-5.4` and `gpt-5.3-codex`
- choose `model_reasoning_effort` from task complexity instead of pinning one static effort everywhere
- treat the main agent as the owner of planning, merge decisions, and final synthesis
- persist reusable personal agents to `~/.codex/agents` so similar future tasks can reuse them

## What OpenAI does not currently mandate

- noun-phrase grammar for custom-agent names
- one universal `developer_instructions` section layout
- a policy that every task should use subagents

This skill chooses those conventions as opinionated defaults for non-trivial work.
