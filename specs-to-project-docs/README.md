# specs-to-project-docs

A documentation skill that consolidates scattered spec files into standardized project docs. It produces a concise `README.md` and a fuller handbook grounded in real repository evidence.

## Core capabilities

- Scans `spec.md`, `tasks.md`, and `checklist.md` collections as documentation input.
- Reconciles spec claims against code, config, scripts, and deployment files.
- Standardizes both new and existing project docs around installation, deployment, configuration, external services, architecture, features, and developer onboarding context.
- Provides dedicated reference templates for both `README.md` and the full project handbook.
- Deletes superseded spec source files after a successful conversion, unless they still need to stay active or be archived explicitly.
- Keeps unknown or unverifiable details explicit instead of guessing.

## Repository layout

```text
.
├── SKILL.md
├── README.md
├── LICENSE
├── agents/
│   └── openai.yaml
└── references/
    └── templates/
        ├── readme.md
        └── project-handbook.md
```

## Default outputs

- `README.md`
- `docs/project/project-handbook.md`

## Required doc coverage

- Installation and deployment
- Configuration and environment variables
- External services and API key acquisition/setup steps when applicable
- Project architecture
- Project feature introductions
- Information developers should understand before changing the project

## Notes

- Prefer code, config, and deployment files over stale spec text when they disagree.
- If the repository already has docs, rewrite them into the same standardized structure instead of leaving mixed documentation formats.
- Keep `README.md` short and treat the handbook as the detailed operational/developer reference.
