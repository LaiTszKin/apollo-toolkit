# feature-propose

`feature-propose` is a Codex skill for product-oriented feature planning in existing codebases.
It guides the agent to:

1. Understand the product from real code evidence.
2. Classify user-facing functions into MVP / Important / Enhancement / Performance.
3. Propose numbered feature recommendations with clear implementation direction.
4. Publish accepted proposals through `open-github-issue` with reason and suggested architecture.
5. Record accepted feature proposals in `AGENTS.md`.
6. Remove implemented proposals from `AGENTS.md` after delivery.

## Repository layout

- `SKILL.md`: skill metadata and workflow instructions.
- `agents/openai.yaml`: agent-facing registration metadata.
- `references/`: feature classification references used during proposal generation.

## Usage

Use this skill when a user asks to analyze an existing application and propose prioritized features from a PM perspective.

Accepted proposals should be ready for GitHub tracking: each one includes a clear reason to prioritize and a suggested architecture that can be handed to `open-github-issue`.
