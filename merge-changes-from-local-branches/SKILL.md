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

- Evidence: Inspect all local branches and their changes before merging.
- Execution: Merge each branch into main, auto-resolve conflicts to preserve functionality, and commit the result.
- Quality: Ensure the final merged state is functional with no broken code.
- Output: Produce a clean main branch with all local changes integrated.

## Goal

Consolidate all local branch changes into the local main branch with automatic conflict resolution that preserves correct functionality.

## Workflow

### 1) Inventory all local branches

- Run `git branch` to list all local branches.
- For each branch, note:
  - Branch name
  - Commits ahead of main
  - Last commit message (via `git log -1 --oneline`)

### 2) Ensure clean state on main

- Check `git status` on main branch.
- If there are uncommitted changes on main, stash them:
  ```bash
  git stash push -m "WIP: temporary stash before branch merging"
  ```

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
   - **Same line, different content**: Prefer the change with:
     - More recent timestamp, OR
     - The change that preserves existing functionality (analyze context to determine which branch's change maintains correct behavior)
   - **File deleted in one branch, modified in another**: Keep the modification unless the deletion is explicitly required for the feature
   - **Both branches modified same file differently**: Keep both sets of changes if non-overlapping; if overlapping, use the more recent change
   - **Test files conflicting**: Keep both test cases unless they test mutually exclusive behaviors

   Auto-resolve using git's merge strategies:
   ```bash
   git merge -X ours <branch-name>      # Prefer main's version for conflicts
   git merge -X theirs <branch-name>    # Prefer the merged branch's version
   ```
   Or manually edit conflicted files and:
   ```bash
   git add <resolved-files>
   ```

4. If auto-resolution is ambiguous, prefer the change that:
   - Does not break existing tests
   - Preserves the documented feature intent
   - Keeps more recent bug fixes

5. Complete the merge:
   ```bash
   git commit -m "Merge branch '<branch-name>' into main"
   ```

### 4) Verify merged state

- Run relevant tests to ensure nothing is broken:
  ```bash
  # Run tests if a test command exists
  npm test  # or yarn test, cargo test, etc.
  ```
- If tests fail, investigate and fix the conflict resolution.

### 5) Commit the merged result

The merge commits already serve as commits. If additional staging is needed:

```bash
git status
git add -A
git commit --amend --no-edit  # Amend the last merge commit if needed
```

### 6) Report completion

- List all branches that were merged.
- Confirm main is updated with all changes.
- Note any conflicts that were resolved and the rationale.
- Confirm no remote push was performed.

## Working Rules

- Never force-push; use only merge or rebase with merge.
- Prefer preserving functionality over keeping either branch's exact changes.
- Do not push to remote — this skill only merges to local main.
- If a branch contains no meaningful changes (empty merge), skip it.
- Keep the main branch history clean and readable.
- If a branch's merge breaks tests, resolve the conflict differently before committing.

## Conflict Resolution Examples

| Scenario | Resolution Strategy |
|----------|---------------------|
| Same line, main has older change | Keep branch's change |
| Same line, branch has older change | Keep main's change |
| File deleted in branch, modified in main | Keep main's modification |
| Both added same function differently | Keep both; rename if needed |
| Config file conflict | Keep both values if non-overlapping |
| Test file conflict | Keep both test cases |
| package.json dependency conflict | Keep higher version if compatible |
