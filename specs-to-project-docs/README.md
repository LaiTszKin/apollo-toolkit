# specs-to-project-docs

A documentation skill that consolidates scattered spec files into standardized project docs. It produces a concise `README.md` plus a categorized document set grounded in real repository evidence.

## Core capabilities

- Scans `spec.md`, `tasks.md`, and `checklist.md` collections as documentation input.
- Reconciles spec claims against code, config, scripts, and deployment files.
- Standardizes both new and existing project docs into topic-based files for setup, configuration, architecture, features, and developer onboarding.
- Provides dedicated reference templates for the top-level README, the documentation index/reference list, and each category document.
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
        ├── docs-index.md
        ├── getting-started.md
        ├── configuration.md
        ├── architecture.md
        ├── features.md
        └── developer-guide.md
```

## Default outputs

- `README.md`
- `docs/project/README.md`
- `docs/project/getting-started.md`
- `docs/project/configuration.md`
- `docs/project/architecture.md`
- `docs/project/features.md`
- `docs/project/developer-guide.md`

## Required doc coverage

- Installation and deployment
- Configuration and environment variables
- External services and API key acquisition/setup steps when applicable
- Project architecture
- Project feature introductions
- Information developers should understand before changing the project

## Notes

- Prefer code, config, and deployment files over stale spec text when they disagree.
- If the repository already has docs, rewrite them into the same categorized structure instead of leaving mixed documentation formats.
- Keep `README.md` short and let `docs/project/README.md` act as the reference list for deeper topic docs.
