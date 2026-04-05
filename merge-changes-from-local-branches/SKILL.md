---
name: merge-changes-from-local-branches
description: >-
  Read changes from all local git branches and merge them into the local main
  branch. When conflicts arise, auto-resolve them by keeping correct functionality
  (preferring the more recent change on the same line, or the change that preserves
  working behavior). Commit the merged result to local main without pushing to
  remote. Use when the user asks to consolidate local branch work, merge all
  changes into main, or prepare local branches for integration.
---

# Merge Changes from Local Branches

## Dependencies

- Required: none (uses native git commands).
- Conditional: none.
- Optional: `commit-and-push` if commit message guidance is needed.
- Fallback: If git operations fail, stop and report the error.

## Standards

- Evidence: Inspect the current branch state, local branches, ahead/behind status, and actual conflicting files before deciding what to merge.
- Execution: Merge only the relevant local branches into `main` sequentially, resolve conflicts by reading both sides and editing the merged result to preserve shipped behavior, then verify the merged state.
- Quality: Never use blanket timestamp rules or default `-X ours/theirs` conflict resolution as the primary merge strategy, and do not declare success until the final `main` state has been checked and verified.
- Output: Produce a clean main branch with all local changes integrated.

## Goal

Consolidate all local branch changes into the local main branch with automatic conflict resolution that preserves correct functionality.

## Workflow

### 1) Inventory all local branches

- Run `git branch` to list all local branches.
- Check the current branch with `git branch --show-current` and capture `git status -sb`.
- Compare each candidate branch against `main` with `git log --oneline main..branch`, `git diff --stat main...branch`, or equivalent evidence so empty or already-merged branches are skipped.
- For each branch, note:
  - Branch name
  - Commits ahead of main
  - Last commit message (via `git log -1 --oneline`)

### 2) Ensure clean state on main

- Check `git status` on `main`.
- If `main` has uncommitted changes that are unrelated to the merge request, stop and report them instead of stashing automatically.
- Only proceed once you can state which branch or branches actually need to be merged.

### 3) Merge branches sequentially

For each local branch (excluding main):

1. Check out main:
   ```bash
   git checkout main
   ```

2. Merge the branch:
   ```bash
   git merge <branch-name> --no-ff -m "Merge branch '<branch-name>' into main"
   ```

3. If conflicts occur, resolve them automatically using these rules:
   - Read the conflict markers and both parent versions before editing.
   - **Same line, different content**: keep the version that matches the intended post-merge behavior, not simply the newer edit.
   - **File deleted in one branch, modified in another**: keep the version supported by current code references and tests; do not silently drop reachable code.
   - **Both branches modified the same file differently**: preserve both changes when they are compatible; if they overlap, manually compose a merged result that keeps the verified logic from both sides.
   - **Test files conflicting**: preserve coverage for both behaviors unless one assertion is now obsolete by verified implementation changes.
   - Use `-X ours` / `-X theirs` only for a narrowly justified conflict after reading the actual content; never use those flags as the default merge strategy.

   After resolving files:
   ```bash
   git add <resolved-files>
   ```

4. If auto-resolution is ambiguous, prefer the change that:
   - Does not break existing tests
   - Preserves the documented feature intent
   - Aligns with the code currently shipped on the source branch
   - Minimizes hidden semantic drift between the merged modules

5. Complete the merge:
   ```bash
   git commit -m "Merge branch '<branch-name>' into main"
   ```

### 4) Verify merged state

- After each conflictful merge, run the most relevant targeted tests or build checks for the files that changed.
- After all merges complete, run the repository's broader validation command when one exists:
  ```bash
  npm test  # or yarn test, cargo test, etc.
  ```
- If verification fails, fix the merged state on `main` before proceeding.

### 5) Commit the merged result

- The merge commits are the submission artifact; do not amend them unless the user explicitly asks for history rewriting.
- If a follow-up fix is required after verification, create a normal commit on `main` that explains the correction.

### 6) Report completion

- List all branches that were merged.
- List any branches intentionally skipped because they were already merged, empty, or out of scope.
- Confirm main is updated with all changes.
- Note any conflicts that were resolved and the rationale.
- Report the verification commands that were run.
- Confirm no remote push was performed.

## Working Rules

- Never force-push; use only merge or rebase with merge.
- Prefer preserving functionality over keeping either branch's exact changes.
- Do not push to remote — this skill only merges to local main.
- If a branch contains no meaningful changes (empty merge), skip it.
- Keep the main branch history clean and readable.
- If a branch's merge breaks tests, resolve the conflict differently before committing.
- Do not stash or discard unrelated work automatically; stop when the working tree state makes the merge ambiguous.

## Conflict Resolution Examples

| Scenario | Resolution Strategy |
|----------|---------------------|
| Same line, both branches changed behavior | Read both code paths and compose the merged logic that preserves the verified invariant |
| Same line, one branch is a bug fix and the other is a refactor | Keep the bug fix and reapply the compatible refactor structure manually if needed |
| File deleted in branch, modified in main | Keep the version supported by current references/tests and remove only if the deletion is proven correct |
| Both added same function differently | Keep both; rename if needed |
| Config file conflict | Keep both values if non-overlapping |
| Test file conflict | Keep both test cases |
| package.json dependency conflict | Keep higher version if compatible |
