# Routing Rubric

Use this rubric before spawning or creating a custom agent.

## 1. Delegate by default for non-trivial work

Subagents are usually worth it when the task benefits from:

- parallel read-heavy exploration
- independent review or verification
- bounded evidence gathering
- unrelated module edits that can proceed without conflicts

Keep the task in the main agent when it is:

- tiny and obvious
- one continuous chain of reasoning with no clean split
- likely to create overlapping edits across the same files
- blocked by an environment rule that disallows live delegation

## 2. Reuse before creating

Reuse an existing custom agent when:

- the `description` matches the delegated job
- the `developer_instructions` already define the correct boundaries
- the tool surface and sandbox mode are appropriate

Create a new one only when the job is both reusable and clearly distinct.

## 3. Keep roles independent

Good reusable roles:

- `code_mapper`
- `docs_researcher`
- `security_reviewer`
- `test_reviewer`
- `browser_debugger`
- `ui_fixer`
- `api_fixer`

Bad reusable roles:

- agents that both explore and fix
- agents that both review and implement
- agents whose name depends on one temporary bug ticket

## 4. Prefer read-only support agents

Default to read-only for:

- exploration
- review
- docs verification
- browser reproduction without app edits

Use write-capable agents only when they own a bounded implementation scope.

## 5. Control parallel writes

Parallel writes are acceptable only when:

- file ownership does not overlap
- module boundaries are clear
- the main agent can merge results cheaply

Otherwise use one writer and several read-only helpers.

## 6. Use a fixed handoff prompt

Every subagent handoff should include:

- `Objective`
- `Inputs and scope`
- `File or module ownership`
- `Constraints and stop conditions`
- `Expected output shape`
- `Blocking or non-blocking status`

Use direct spawning language, for example: "spawn 2 subagents", "spawn a code-mapping subagent and a review subagent", or "do not spawn subagents because this task is trivial".

## 7. Pick model and reasoning by complexity

Allowed reusable subagent models for this skill:

- `gpt-5.3-codex`
- `gpt-5.4`

Default selection:

- use `gpt-5.3-codex` for most code-centered delegated work
- use `gpt-5.4` when the delegated task needs broader synthesis, harder judgment, or more cross-domain reasoning

Reasoning effort guide:

- `low` for simple, bounded, low-risk delegated tasks
- `medium` for standard non-trivial delegated tasks
- `high` for complex or ambiguous delegated tasks
- `xhigh` only when the extra latency is justified by especially difficult synthesis or investigation
