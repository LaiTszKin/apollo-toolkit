---
name: codex-subagent-orchestration
description: Use for almost every non-trivial Codex task. Inspect existing custom agents under `~/.codex/agents`, reuse them when they already fit, create a new focused custom agent in the official Codex TOML format when needed, and coordinate parallel subagents for exploration, review, verification, or unrelated module work while keeping tightly coupled serial work in the main agent.
---

# Codex Subagent Orchestration

## Dependencies

- Required: none.
- Conditional: task-specific skills only when the delegated agent's job clearly benefits from them.
- Optional: none.
- Fallback: If subagent delegation is unavailable, continue in a single thread and report that orchestration was skipped. If `~/.codex/agents` does not exist, create it before persisting personal custom agents.

## Standards

- Evidence: Inspect the current task shape and the existing custom-agent catalog before creating or updating any agent.
- Execution: Use this skill for nearly every non-trivial task. When current tool rules allow delegation, the agent must actually launch one or more subagents instead of only describing delegation in prose. Treat a parallel subagents workflow as the default whenever two or more independent workstreams can run safely in parallel, use a single helper agent only when there is exactly one bounded sidecar job, and keep shared planning, conflict resolution, and final synthesis in the main agent.
- Quality: Keep each custom agent narrow, opinionated, and non-overlapping; prefer read-only sandboxes for explorers and reviewers; keep review contexts isolated from the implementation thread; avoid parallel write conflicts.
- Output: State which agents were reused or created, what each owned, whether they waited in parallel or were staged, and what remained with the main agent.

## Overview

This skill adds a repeatable orchestration layer on top of Codex subagents.

Use this custom-agent format:

- personal custom agents live in `~/.codex/agents/`
- project-scoped custom agents live in `.codex/agents/`
- each custom agent is one standalone TOML file
- required fields are `name`, `description`, and `developer_instructions`

This skill adds these house rules:

- use short English noun phrases normalized to snake_case for `name`
- use the fixed `developer_instructions` structure from `references/custom-agent-template.toml`
- restrict reusable subagent model choices in this repository to `gpt-5.4` and `gpt-5.3-codex`

## Model policy

Use only these reusable subagent models:

- `gpt-5.3-codex` for most coding-focused explorers, reviewers, verifiers, and bounded implementers
- `gpt-5.4` for the hardest tasks that need broader judgment, ambiguity handling, or heavier cross-cutting synthesis

Set `model_reasoning_effort` by task complexity:

- `low`: straightforward bounded lookups, narrow evidence gathering, or simple mechanical checks
- `medium`: ordinary non-trivial exploration, review, test triage, and isolated edits
- `high`: ambiguous debugging, multi-step review, or higher-risk implementation work
- `xhigh`: only for the hardest investigations or synthesis-heavy subagents where latency is justified

Prefer `gpt-5.3-codex` first for agentic coding roles. Escalate to `gpt-5.4` when the delegated job is less mechanical and more judgment-heavy.

## When To Use

Use this skill by default unless the task is genuinely trivial or current tool rules disallow delegation, such as:

- a one-shot factual answer with no decomposition value
- a single obvious command or one-line edit
- a tiny serial fix where spawning another agent would add more coordination than value

Subagents are most valuable for:

- codebase exploration and architecture mapping
- evidence gathering and independent review
- live-doc or API verification
- browser reproduction and debugging
- parallel edits across unrelated files or modules

Keep the main agent in charge when the work is highly continuous, tightly coupled, or depends on a single evolving mental model. In those cases, let subagents provide bounded context, not final ownership, and do not force parallel writers.

This skill is not satisfied by merely writing that Codex should delegate later. When parallelizable sidecar work exists and delegation is allowed, the default compliant shape is a parallel subagents workflow.

## Workflow

### 1) Triage the task first

- Decide whether the task is trivial, serial-but-complex, or parallelizable.
- If the task is non-trivial and delegation is allowed, you must delegate at least one bounded subtask to a subagent.
- If the task has two or more independent read/review/exploration tracks, you must use a parallel subagents workflow rather than a single helper agent or a staged suggestion-only plan.
- Use subagents for most non-trivial tasks, but do not force them into tiny or tightly coupled work.
- Prefer one writer plus supporting read-only agents when ownership would otherwise overlap.
- If tool rules require explicit user intent before delegation, confirm that gate first; once satisfied, launch the chosen subagents and do not stay in suggestion-only mode.

### 2) Inspect the current agent catalog

- Read `~/.codex/agents/*.toml` first.
- Read `.codex/agents/*.toml` next when the current repository has project-scoped agents.
- Build a quick catalog of each agent's:
  - `name`
  - `description`
  - tool or MCP surface
  - sandbox mode
  - effective responsibility
- Reuse an existing agent when its responsibility already fits the task without stretching into adjacent work.

### 3) Decide reuse vs create

Reuse an existing custom agent when all of the following are true:

- its `description` matches the delegated job
- its `developer_instructions` already enforce the right boundaries
- its tools, sandbox, and model profile are suitable
- using it will not create role overlap with another active agent

Create a new custom agent whenever the current task exposes a stable reusable role and:

- no existing agent owns the job cleanly
- the responsibility can be described independently from the current one-off prompt
- the role can be named, bounded, and reused on future tasks even if this is its first appearance

Do not require repeated historical use before creating a reusable custom agent. Treat "reusable" as a property of role clarity and stable boundaries, not as proof that the exact same task has already repeated many times.

When a delegated job is task-specific in content but role-stable in shape, abstract it to the most general reusable agent that still preserves clear ownership boundaries.

Prefer extracting a general role such as `code_reviewer` or `docs_researcher` before creating a narrowly phrased task agent such as `review_rust_pr_123`.

If domain knowledge materially changes the workflow, create a specialized reusable agent such as `rust_reviewer`; otherwise keep the agent generic and reusable across languages or repositories.

Do not create near-duplicates. Tighten or extend an existing agent when the gap is small and the responsibility remains coherent.

### 4) Create the custom agent in the official format when needed

- Persist reusable personal agents to `~/.codex/agents/<name>.toml`.
- Use the file template in `references/custom-agent-template.toml`.
- Match the filename to the `name` field unless there is a strong reason not to.
- Keep `description` human-facing and routing-oriented: it should explain when Codex should use the agent.
- Keep `developer_instructions` stable and role-specific; do not leak current task noise into reusable instructions.
- Persist a custom agent as soon as its responsibility, inputs, workflow, and boundaries can be described independently from the current task details; do not wait for multiple repeats before persisting it.
- Set `model` to either `gpt-5.3-codex` or `gpt-5.4`.
- Set `model_reasoning_effort` from actual task complexity, not from agent prestige or habit.

Naming rule for this skill:

- choose a short English noun phrase
- normalize it to snake_case
- examples: `code_mapper`, `code_reviewer`, `docs_researcher`, `rust_reviewer`, `browser_debugger`

### 5) Use the fixed instruction format

Every reusable custom agent created by this skill must keep the same section order inside `developer_instructions`:

1. `# Role`
2. `## Use when`
3. `## Do not use when`
4. `## Inputs`
5. `## Workflow`
6. `## Output`
7. `## Boundaries`

The `Use when` and `Do not use when` lists are the applicability contract. Keep them concrete.

### 5.5) Use a fixed runtime handoff format

Whenever you prompt a subagent, include:

- the exact job split
- whether Codex should wait for all agents before continuing
- the expected summary or output format
- the file or module ownership boundary
- the stop condition if the agent hits uncertainty or overlap
- the instruction to stay within current tool-rule limits for delegation, sandbox, and write scope

### 6) Decompose ownership before spawning

Give each subagent one exclusive job. Good ownership boundaries include:

- `code_mapper`: map files, entry points, and dependencies
- `docs_researcher`: verify external docs or APIs
- `security_reviewer`: look for concrete exploit or hardening risks
- `test_reviewer`: find missing coverage and brittle assumptions
- `browser_debugger`: reproduce UI behavior and capture evidence
- `ui_fixer` or `api_fixer`: implement a bounded change after the problem is understood

Avoid combining exploration, review, and editing into one reusable agent when those responsibilities can stay separate.

### 7) Orchestrate the run

- Use actual subagent tool calls when delegation is allowed; do not stop at writing that Codex should spawn agents later.
- State exactly how to split the work before each launch.
- Say whether to wait for all agents before continuing or to stage them in sequence.
- Ask for concise returned summaries, not raw logs.
- Treat single-subagent delegation as the exception path, not the default orchestration pattern.

Preferred patterns:

- Parallel read-only agents for exploration, review, tests, logs, or docs.
- Explorer first, implementer second, reviewer third when the work is serial but benefits from bounded context.
- Multiple write-capable agents only when their modules and edited files do not overlap.

Practical default:

- spawn 2-4 agents for a complex task
- spawn at least 2 agents when the task clearly contains parallelizable investigation or review tracks
- keep within the current `agents.max_threads`
- keep nesting shallow; many Codex setups leave `agents.max_depth` at 1 unless configured otherwise

### 8) Keep the main agent responsible for continuity

The main agent must:

- own the todo list and the overall plan
- decide task boundaries
- merge results from parallel threads
- resolve conflicting findings or overlapping edits
- perform final validation and final user-facing synthesis

If the task turns into one tightly coupled stream of work, stop delegating new edits and bring execution back to the main agent.

### 9) Maintain the agent catalog after the task

- Persist any new reusable custom agent to `~/.codex/agents/`.
- If the current task revealed a cleaner reusable abstraction than the one you first considered, persist the more general role unless domain-specific workflow differences are materially important.
- If a newly created agent proved too broad, narrow its description and instructions before finishing.
- If two agents overlap heavily, keep one and tighten the other instead of letting both drift.
- Do not persist throwaway agents that are really just one-off prompts.

## References

Load only when needed:

- `references/custom-agent-template.toml`
- `references/routing-rubric.md`
