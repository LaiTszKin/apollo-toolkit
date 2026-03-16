# Deep Research Topics

`deep-research-topics` is a reusable research skill for producing evidence-based topic deliverables.

It helps an agent:

1. Understand and scope a research request.
2. Break the topic into concrete research questions.
3. Perform deep research with authoritative sources.
4. Read workspace files to match the existing writing style.
5. Produce a final file in PDF by default, or Word/slides output when requested.

## Dependency skills

- `pdf`: default output format
- `doc`: optional Word output when requested
- `slides`: optional slide output when requested

## Language behavior

- Default output language: Chinese
- If the user requests another language, follow the user request.
- If the workspace already has a dominant language and the user does not override it, follow the workspace language.
- Use characters and formatting that are safe for Chinese or mixed CJK output.

## Repository layout

- `SKILL.md`: trigger rules, workflow, and dependency contract
- `agents/openai.yaml`: agent-facing metadata

## Typical use cases

Use this skill for:

- topic briefings
- background research memos
- literature scans
- competitive or landscape research
- decision-support reports

## License

MIT. See `LICENSE`.
