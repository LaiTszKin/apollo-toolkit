# open-source-pr-workflow

A Codex skill focused on preparing and opening review-ready pull requests for open-source projects.

## What this repository contains

- `SKILL.md`: The main workflow definition.
- `agents/openai.yaml`: Agent integration settings.

## Highlights

- Enforces branch naming convention: `codex/{change_type}/{changes}`
- Focuses on PR preparation/creation instead of feature implementation
- Opens PRs directly by default; only shows drafts when the user explicitly asks to review first
- Defaults forked repositories to open PRs against the upstream parent repository (unless user explicitly requests the fork)
- Requires clear PR sections for motivation, engineering rationale, and test results
- For code changes, requires running `edge-case-test-fixer` then `code-simplifier` before opening PR
- PR content should focus only on change motivation, decisions, and validation (no internal skill/tool process notes)
- Encourages minimal, verifiable, review-ready contributions

## License

Released under the MIT License. See `LICENSE` for details.
