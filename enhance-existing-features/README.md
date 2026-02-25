# enhance-existing-features

An agent skill for safely extending features in brownfield codebases.

This repository packages a reusable workflow for AI agents to understand
existing dependencies first, verify official docs, implement focused changes,
and update tests with minimal risk.

## What this skill does

This skill guides an agent to:

1. Explore the existing codebase and map dependencies before editing.
2. Verify current behavior against authoritative, up-to-date documentation.
3. Write a PRD first when the change crosses multiple modules.
4. Obtain explicit user approval on the PRD before implementation.
5. Implement minimal, focused feature changes by reusing existing patterns.
6. Add or update tests that match the change scope.

## Skill files

- `SKILL.md`: Core workflow and operating rules.
- `agents/openai.yaml`: Agent interface metadata and default prompt.
- `scripts/create_prd.py`: PRD file generator for multi-module changes.
- `references/prd-template.md`: PRD template used by the script.
- `references/unit-tests.md`: Unit testing guidance.
- `references/property-based-tests.md`: Property-based testing guidance.
- `references/integration-tests.md`: Integration testing guidance.
- `references/e2e-tests.md`: End-to-end testing guidance.

## Workflow summary

1. Map entry points, data flow, dependencies, and integration boundaries.
2. Confirm APIs/framework behavior with official documentation.
3. Generate a PRD for multi-module changes.
4. Obtain explicit user approval on the PRD.
5. Implement only the required change in existing conventions.
6. Select and update the right test level (unit/property/integration/e2e).

## Usage

Use this skill when working on existing projects where safety, compatibility,
and test coverage are critical.

Basic prompt:

```text
Use $enhance-existing-features to add the new behavior, create a PRD if multiple modules are involved, wait for explicit PRD approval, verify docs, and update tests.
```

## Example

Practical brownfield request example:

```text
Use $enhance-existing-features to add pagination + date filtering to /api/orders,
keep backward compatibility with existing query params, and add integration tests
for repository + service + API handler flow.
```

Expected execution style:

- Map API handler/service/repository dependencies before edits.
- Write a PRD first because this request spans multiple modules.
- Wait for explicit user approval on the PRD before implementation.
- Confirm framework parsing and validation behavior from official docs.
- Keep implementation minimal and compatible with existing response contracts.
- Add or update tests at the integration level for changed behavior.

## Version

Current release tag: `v0.1.2`

## License

MIT (see `LICENSE`)
