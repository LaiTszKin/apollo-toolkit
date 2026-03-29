---
name: open-github-issue
description: Publish structured GitHub issues across multiple issue categories with deterministic auth fallback, target-repo resolution, README-based language detection, and draft-only fallback when authentication is unavailable. Use when users ask to open GitHub issues from confirmed findings, accepted proposals, documentation gaps, security risks, observability gaps, or prepared issue content.
---

# Open GitHub Issue

## Dependencies

- Required: none.
- Conditional: none.
- Optional: none.
- Fallback: If authenticated publishing is unavailable, fall back to draft-only output without blocking the caller.

## Standards

- Evidence: Require structured issue inputs, detect repository language from the target README instead of guessing, and enforce category-specific required fields so each issue type matches the situation being reported.
- Execution: Resolve the repo, normalize the issue body, publish with strict auth order, then return the publication result.
- Quality: Preserve upstream evidence, localize only the structural parts, keep publication deterministic and reproducible, and make behavioral mismatches easy for maintainers to verify.
- Output: Return publication mode, issue URL when created, rendered body, and any publish error in the standardized JSON contract.

## Overview

Use this skill to publish structured GitHub issues deterministically across several common issue situations.

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
- Make the issue type explicit: `problem`, `feature`, `performance`, `security`, `docs`, or `observability`.
- For `problem` issues, describe the expected behavior and current behavior with BDD-style `Given / When / Then`, then state the behavioral difference explicitly.
- Prefer `python3` plus an absolute helper path when invoking bundled scripts; do not assume `python`, relative paths, or the caller's cwd are wired correctly.

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
   - Within `problem-description`, require a precise behavior diff:
     - `Expected Behavior (BDD)`: `Given / When / Then` for what the program should do.
     - `Current Behavior (BDD)`: `Given / When / Then` for what the program does now.
     - `Behavior Gap`: a short explicit comparison of the observable difference and impact.
     - Include the symptom, impact, and key evidence alongside the behavior diff; do not leave the mismatch implicit.
   - For `feature` issues, require these structured sections:
     - `proposal` (optional; defaults to title when omitted)
     - `reason`
     - `suggested-architecture`
   - For `performance` issues, require:
     - `problem-description`
     - `impact`
     - `evidence`
     - `suggested-action`
   - For `security` issues, require:
     - `problem-description`
     - `severity`
     - `affected-scope`
     - `impact`
     - `evidence`
     - `suggested-action`
   - For `docs` issues, require:
     - `problem-description`
     - `evidence`
     - `suggested-action`
   - For `observability` issues, require:
     - `problem-description`
     - `impact`
     - `evidence`
     - `suggested-action`
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

First resolve:

```bash
SKILL_ROOT=~/.codex/skills/open-github-issue
```

Problem issue:

```bash
python3 "$SKILL_ROOT/scripts/open_github_issue.py" \
  --issue-type problem \
  --title "[Log] <short symptom>" \
  --problem-description $'Expected Behavior (BDD)\nGiven ...\nWhen ...\nThen ...\n\nCurrent Behavior (BDD)\nGiven ...\nWhen ...\nThen ...\n\nBehavior Gap\n- Expected: ...\n- Actual: ...\n- Difference/Impact: ...\n\nEvidence\n- symptom: ...\n- impact: ...\n- key evidence: ...' \
  --suspected-cause "<path:line + causal chain + confidence>" \
  --reproduction "<steps/conditions or leave empty>" \
  --repo <owner/repo>
```

Feature proposal issue:

```bash
python3 "$SKILL_ROOT/scripts/open_github_issue.py" \
  --issue-type feature \
  --title "[Feature] <short proposal>" \
  --proposal "<what should be added or changed>" \
  --reason "<why this matters now, user value, constraints>" \
  --suggested-architecture "<modules, boundaries, implementation direction>" \
  --repo <owner/repo>
```

Performance issue:

```bash
python3 "$SKILL_ROOT/scripts/open_github_issue.py" \
  --issue-type performance \
  --title "[Performance] Slow dashboard query under large tenants" \
  --problem-description "Dashboard loading time degrades sharply once tenant data exceeds current pagination assumptions." \
  --impact "Users wait 8-12 seconds before the page becomes interactive; this blocks support workflows." \
  --evidence "Profiler output, slow-query logs, and production timings all point to repeated full-table scans in the summary query path." \
  --suggested-action "Add bounded pagination, pre-aggregated summaries, and an index review for the offending query path." \
  --repo <owner/repo>
```

Security issue:

```bash
python3 "$SKILL_ROOT/scripts/open_github_issue.py" \
  --issue-type security \
  --title "[Security] Missing authorization check on admin export" \
  --problem-description "The admin export endpoint can be reached without verifying the caller's admin role." \
  --severity high \
  --affected-scope "/admin/export endpoint and exported customer data" \
  --impact "Unauthorized users may access privileged exports containing sensitive business data." \
  --evidence "Code path review and reproduced requests show the handler validates session presence but not the admin permission gate." \
  --suggested-action "Add explicit authorization enforcement, regression tests, and audit logging for denied access attempts." \
  --repo <owner/repo>
```

Docs issue:

```bash
python3 "$SKILL_ROOT/scripts/open_github_issue.py" \
  --issue-type docs \
  --title "[Docs] Deployment guide omits required Redis configuration" \
  --problem-description "The deployment guide does not mention the required Redis URL and worker startup order." \
  --evidence "README deploy steps differ from the actual compose file and runtime startup checks." \
  --suggested-action "Update deployment docs with required env vars, startup order, and a minimal validation checklist." \
  --repo <owner/repo>
```

Observability issue:

```bash
python3 "$SKILL_ROOT/scripts/open_github_issue.py" \
  --issue-type observability \
  --title "[Observability] Missing request identifiers in payment retry logs" \
  --problem-description "Retry logs do not include stable request or trace identifiers, so multi-line failures cannot be correlated quickly." \
  --impact "On-call engineers cannot isolate a single failing payment flow without manual log stitching." \
  --evidence "Current retry log lines include endpoint and error text only; incident review required manual timestamp matching." \
  --suggested-action "Add request_id, trace_id, upstream target, and retry attempt fields to retry logs and dashboard facets." \
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

- Pass exactly one confirmed issue or one accepted proposal per invocation.
- Prepare evidence or proposal details before calling this skill; do not ask this skill to infer root cause or architecture.
- For `problem` issues, pass a `problem-description` that contains `Expected Behavior (BDD)`, `Current Behavior (BDD)`, and `Behavior Gap`; the difference must be explicit, not implied.
- Reuse the returned `mode`, `issue_url`, and `publish_error` in the parent skill response.
- For accepted feature proposals, pass `--issue-type feature` plus `--proposal`, `--reason`, and `--suggested-architecture`.
- For security, performance, docs, or observability findings, choose the matching `issue-type` instead of overloading `problem`.

## Resources

- `scripts/open_github_issue.py`: Deterministic issue publishing helper with auth fallback and README language detection.
- If the helper path is unavailable or still fails for environment reasons, fall back to direct `gh issue create` or GitHub REST API publishing instead of retrying the same broken relative-path invocation.
