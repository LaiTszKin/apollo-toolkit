# maintain-skill-catalog

Maintain a repository of installable skills by auditing skill definitions, dependency declarations, shared conventions, and catalog validation.

## Core capabilities

- Scans top-level skills before adding or splitting new ones to avoid duplicate scope.
- Audits standardized `## Dependencies` sections and separates vendored, local-only, external, and alias dependencies.
- Syncs catalog docs such as `README.md` and `AGENTS.md/CLAUDE.md` with actual skill capabilities.
- Catches catalog-wide validation issues like missing `agents/openai.yaml` files or stale prompt references.
- Encodes user corrections into durable catalog rules so the same classification mistakes do not repeat.

## Typical triggers

- Standardize all skills to one dependency format.
- Check which skills rely on external skills and document how to install them.
- Split repeated workflow steps into a new shared skill.
- Fix skill-catalog CI failures caused by missing metadata or agent config files.
