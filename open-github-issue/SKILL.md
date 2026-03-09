---
name: open-github-issue
description: Publish structured GitHub issues and feature proposals with deterministic auth fallback, target-repo resolution, README-based language detection, and draft-only fallback when authentication is unavailable. Use when users ask to open GitHub issues from confirmed findings, accepted feature proposals, or prepared issue content.
---

# Open GitHub Issue

## Overview

Use this skill to publish a structured GitHub issue or feature proposal deterministically.

It is designed to be reusable by other skills that already know the issue title and evidence, but need a consistent way to:

- resolve the target repository,
- localize the issue body,
- publish with the preferred auth path,
- and fall back to draft-only output without blocking the main workflow.

## Core principles

- Keep publishing deterministic and reproducible.
- Prefer authenticated `gh` CLI first, then GitHub token, then draft-only fallback.
- Detect repository issue language from the target remote README instead of guessing.
- Preserve upstream evidence content; only localize section headers and default fallback text.
- Make the issue type explicit: `problem` for defects/incidents, `feature` for proposals.

## Workflow

1. Resolve target repository
   - Use `--repo owner/name` when provided.
   - Otherwise resolve from current git `origin`.
2. Normalize issue content
   - Require one title and an explicit `issue-type`.
   - For `problem` issues, require these structured sections:
     - `problem-description`
     - `suspected-cause`
     - `reproduction` (optional)
   - For `feature` issues, require these structured sections:
     - `proposal` (optional; defaults to title when omitted)
     - `reason`
     - `suggested-architecture`
   - If reproduction is missing for a `problem` issue, insert the default non-reproducible note in the target issue language.
3. Detect issue language
   - Read the target repository README from GitHub.
   - If the README is Chinese, publish Chinese section titles; otherwise publish English section titles.
4. Publish with strict auth order
   - If `gh auth status` succeeds, use `gh issue create`.
   - Otherwise, if `GITHUB_TOKEN` or `GH_TOKEN` exists, use GitHub REST API.
   - Otherwise, return draft-only output and do not block the caller.
5. Return publication result
   - Always return publication mode, issue URL when created, rendered issue body, and any publish error.

## Deterministic command

Use the bundled script.

Problem issue:

```bash
python scripts/open_github_issue.py \
  --issue-type problem \
  --title "[Log] <short symptom>" \
  --problem-description "<symptom + impact + key evidence>" \
  --suspected-cause "<path:line + causal chain + confidence>" \
  --reproduction "<steps/conditions or leave empty>" \
  --repo <owner/repo>
```

Feature proposal issue:

```bash
python scripts/open_github_issue.py \
  --issue-type feature \
  --title "[Feature] <short proposal>" \
  --proposal "<what should be added or changed>" \
  --reason "<why this matters now, user value, constraints>" \
  --suggested-architecture "<modules, boundaries, implementation direction>" \
  --repo <owner/repo>
```

## Output contract

The script prints JSON with these fields:

- `repo`
- `issue_type`
- `language`
- `mode` (`gh-cli` / `github-token` / `draft-only` / `dry-run`)
- `issue_url`
- `issue_title`
- `issue_body`
- `publish_error`

## Dependency usage guidance

When another skill depends on `open-github-issue`:

- Pass exactly one confirmed problem or one accepted feature proposal per invocation.
- Prepare evidence or proposal details before calling this skill; do not ask this skill to infer root cause or architecture.
- Reuse the returned `mode`, `issue_url`, and `publish_error` in the parent skill response.
- For accepted feature proposals, pass `--issue-type feature` plus `--proposal`, `--reason`, and `--suggested-architecture`.

## Resources

- `scripts/open_github_issue.py`: Deterministic issue publishing helper with auth fallback and README language detection.
