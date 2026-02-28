---
name: gh-pr-review-comment-workflow
description: Read GitHub pull request review comments, analyze each thread, decide whether to adopt feedback, implement adopted changes, push updates to the same PR branch, and resolve addressed review threads. Use when users ask to process PR review feedback by PR number or current branch context.
---

# GH PR Review Comment Workflow

## Overview

Use this skill to run an end-to-end GitHub PR review loop: collect review threads, decide adopt/reject per comment, apply accepted feedback, push commits to the same PR branch, and resolve only addressed threads.

## Prerequisites

- Ensure `gh` is installed and authenticated (`gh auth status`).
- Ensure the current directory is a git repository with the target PR branch checked out.
- Ensure the branch can be pushed to the PR source remote.

## Workflow

1. Identify target PR.
2. Read unresolved review threads.
3. Decide adopt or reject thread-by-thread.
4. Implement only adopted feedback.
5. Run relevant tests and checks.
6. Commit and push to the same PR branch.
7. Resolve only threads that were truly addressed.
8. Reply on unresolved/rejected threads with reason.

## 1) Identify target PR

- If user provides PR number, use it directly.
- If user does not provide PR number, infer from current branch context.

```bash
python3 scripts/review_threads.py list --repo <owner>/<repo> --pr <number>
python3 scripts/review_threads.py list
```

## 2) Read unresolved review threads

Use table view for quick scan, then JSON when you need full details.

```bash
python3 scripts/review_threads.py list --pr <number> --state unresolved --output table
python3 scripts/review_threads.py list --pr <number> --state unresolved --output json > /tmp/pr_threads.json
```

The JSON output contains `thread_id`, `path`, `line`, and comment bodies for decision and resolution.

## 3) Decide adopt vs reject

Use the decision rubric in `references/adoption-criteria.md`.

- Adopt when correctness, security, reliability, or maintainability clearly improves.
- Reject when suggestion is incorrect, out of scope, duplicate, or conflicts with requirements.
- If uncertain, keep thread unresolved and ask for clarification instead of guessing.

Track adopted thread IDs in a JSON file:

```json
{
  "adopted_thread_ids": ["THREAD_ID_1", "THREAD_ID_2"]
}
```

## 4) Implement adopted feedback

- Edit only necessary files.
- Keep changes minimal and scoped to adopted comments.
- Reuse existing patterns; avoid unrelated refactors.

## 5) Validate before push

- Run focused tests/lint/build that cover touched behavior.
- If checks fail, fix before pushing.

## 6) Commit and push to same PR

- Create a clear commit describing why feedback was adopted.
- Push to the PR branch (same branch backing the open PR).

## 7) Resolve addressed threads

Resolve only threads you actually addressed in code.

```bash
python3 scripts/review_threads.py resolve --pr <number> --thread-id-file adopted_threads.json
```

Optional preview without mutating GitHub state:

```bash
python3 scripts/review_threads.py resolve --pr <number> --thread-id-file adopted_threads.json --dry-run
```

## 8) Handle non-adopted comments

- Keep thread unresolved.
- Reply with a concise technical reason and, if needed, a proposed follow-up.
- Never resolve rejected or unhandled feedback threads.

## Scripts

### `scripts/review_threads.py`

- `list`: fetch PR review threads via GitHub GraphQL (`gh api graphql`), supports repo/PR inference.
- `resolve`: resolve selected review threads by thread IDs.
- Supports thread IDs from flags, JSON files, or `--all-unresolved`.
