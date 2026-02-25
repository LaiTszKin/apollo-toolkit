# feature-propose

`feature-propose` is a Codex skill for product-oriented feature planning in existing codebases.
It guides the agent to:

1. Understand the product from real code evidence.
2. Classify user-facing functions into MVP / Important / Enhancement / Performance.
3. Propose numbered feature recommendations with clear implementation direction.
4. Record accepted feature proposals in `AGENTS.md`.
5. Remove implemented proposals from `AGENTS.md` after delivery.

## Repository layout

- `SKILL.md`: skill metadata and workflow instructions.
- `agents/openai.yaml`: agent-facing registration metadata.
- `references/`: feature classification references used during proposal generation.

## Usage

Use this skill when a user asks to analyze an existing application and propose prioritized features from a PM perspective.
