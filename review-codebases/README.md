# Review Codebases

A repository-wide code review skill that reads the whole codebase, prioritizes architecture findings ahead of lower-level issues, and publishes one GitHub issue per confirmed finding.

## What this skill provides

- Full-repository review guidance instead of patch-level review only.
- A strict review ladder: architecture first, code quality second, edge cases last.
- A clear evidence bar so only confirmed findings are escalated.
- Deterministic issue publication through the `open-github-issue` dependency skill.

## Repository structure

- `SKILL.md`: Main review workflow, prioritization rules, and output contract.
- `agents/openai.yaml`: Agent interface metadata and default prompt.
- Dependency skill: `open-github-issue` for publishing one GitHub issue per confirmed finding.

## Installation

1. Clone this repository.
2. Copy this folder to your Codex skills directory:

```bash
mkdir -p "$CODEX_HOME/skills"
cp -R review-codebases "$CODEX_HOME/skills/review-codebases"
```

## Usage

Invoke the skill in your prompt:

```text
Use $review-codebases to read this repository end to end, prioritize architecture problems first, and publish one GitHub issue per confirmed finding.
```

## Review order

1. Architecture and system design
2. Code quality and maintainability
3. Edge cases and robustness

The skill only advances to the next tier when the previous tier has no confirmed findings.

## GitHub issue handoff

For each confirmed finding, delegate publication to `$open-github-issue` with:

- a tier-specific title prefix
- repository evidence and impact in `problem-description`
- file references and causal reasoning in `suspected-cause`
- reproduction conditions when known

When invoking the publisher CLI directly, use `apltk open-github-issue --payload-file <json>` or `@file` inputs for Markdown-rich fields so shell parsing cannot consume backticks or code snippets.

If issue publication is unavailable, return draft issue content instead of switching to an ad-hoc publishing path.

## Output expectations

The skill is designed to return:

1. Codebase coverage and explicit exclusions
2. Review tier reached and why lower tiers were skipped
3. Confirmed findings with evidence, impact, and confidence
4. GitHub issue publication status for each finding
5. Deferred follow-up when higher-tier issues stop deeper review

## License

MIT. See `LICENSE`.
