---
name: review-codebases
description: Repository-wide code review workflow that requires reading the full codebase before judging, prioritizes architecture findings over implementation details, and publishes one GitHub issue per confirmed finding through open-github-issue. Use when users ask for a code review, repository audit, architecture review, maintainability review, or complete codebase inspection.
---

# Review Codebases

## Dependencies

- Required: none.
- Conditional: `open-github-issue` when confirmed findings should be tracked as GitHub issues.
- Optional: none.
- Fallback: If publication is needed and `open-github-issue` is unavailable, return draft issue bodies instead of inventing another publisher.

## Standards

- Evidence: Read the full human-authored repository before judging and cite concrete files for every finding.
- Execution: Review architecture first, code quality second, and edge cases last, stopping when a higher-priority tier has confirmed findings.
- Quality: Prefer root-cause findings over scattered symptoms, merge duplicates, and keep hypotheses out of published results.
- Output: Return coverage, review tier reached, confirmed findings, publication status, and deferred lower-tier follow-up.

## Overview

Use this skill to review an entire repository before making judgments.

The review order is strict:

1. Architecture and system design
2. Code quality and maintainability
3. Edge cases and robustness gaps

Only continue to the next level when the current level has no confirmed findings.

## Core rules

- Read the full repository before judging any design or implementation choice.
- Inspect every human-authored file that affects behavior: source code, tests, build scripts, configuration, migrations, and key docs.
- For generated, vendored, or snapshot files, verify what they are first; exclude them from deep review only when that status is clear, and list those exclusions explicitly.
- Do not speculate. Every finding must cite concrete files and causal reasoning.
- Prefer root-cause findings over scattered symptoms or style nits.
- Merge duplicate symptoms into one finding when they come from the same underlying issue.

## Workflow

1. Map the repository
   - List top-level directories and identify entrypoints, domain modules, test suites, configuration, scripts, and generated/vendor areas.
   - Record any files or folders excluded from deep review and why.
2. Read the whole codebase
   - Read all relevant human-authored files end to end.
   - Build a repository-wide model of boundaries, data flow, ownership, invariants, and failure handling.
3. Review architecture first
   - Check module boundaries, layering, hidden coupling, circular dependencies, duplicated workflows, leaky abstractions, ownership confusion, and inconsistent domain models.
   - If any confirmed architecture findings exist, stop the lower-level review and report only architecture findings.
4. Review code quality second
   - Run this step only when there are no architecture findings.
   - Check readability, duplication, dead code, error handling, unsafe state changes, unclear contracts, missing tests around critical logic, and maintainability risks.
   - If any confirmed code-quality findings exist, stop before edge-case review and report only these findings.
5. Review edge cases last
   - Run this step only when there are no architecture or code-quality findings.
   - Check null or empty inputs, boundary values, partial failures, retries, concurrency, ordering assumptions, idempotency, and invalid state transitions.
6. Publish each confirmed finding
   - Invoke `open-github-issue` once per finding.
   - Use a tier-specific title prefix:
     - `[Architecture] <short finding>`
     - `[Code Quality] <short finding>`
     - `[Edge Case] <short finding>`
   - Pass these fields to the dependency skill:
     - `title`
     - `problem-description`: symptom, impact, and repository evidence
     - `suspected-cause`: file references, causal chain, and confidence
     - `reproduction`: concrete trigger or conditions when known; otherwise leave empty
     - `repo`: target repository in `owner/repo` format when known

## Evidence standard

Each finding must include:

- affected files or modules
- why the current design or code is problematic
- impact on correctness, maintenance, performance, or future change safety
- confidence level with a short reason

If evidence is incomplete, keep it as a hypothesis and do not publish a GitHub issue for it.

## Output format

Use this structure in responses:

1. Codebase coverage
   - reviewed areas
   - explicit exclusions
2. Review tier reached
   - architecture / code quality / edge cases
   - why lower tiers were skipped, if applicable
3. Confirmed findings
   - title
   - affected files
   - evidence and reasoning
   - impact
   - confidence
4. GitHub issue publication status
   - publication mode (`gh-cli` / `github-token` / `draft-only`)
   - created issue URL or draft output per finding
5. Deferred follow-up
   - list lower-tier checks that were intentionally not performed because a higher-tier issue already exists

## Resources

- Dependency skill: `open-github-issue` for deterministic GitHub issue publication with auth fallback and README language detection.
