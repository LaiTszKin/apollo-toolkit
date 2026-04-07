---
name: merge-changes-from-local-branches
description: >-
  Read changes from all local git branches and merge them into the local main
  branch. When conflicts arise, auto-resolve them by keeping correct functionality
  (preferring the more recent change on the same line, or the change that preserves
  working behavior). Hand the final merged local branch state to `commit-and-push`
  so the commit workflow can handle changelog/readiness steps and any required
  spec archival before the work is considered complete. Use when the user asks
  to consolidate local branch work, merge all changes into main, or prepare local
  branches for integration.
---

# Merge Changes from Local Branches

## Dependencies

- Required: `commit-and-push` for the final local-branch submission flow after merge verification.
- Conditional: none.
- Optional: none.
- Fallback: If git operations fail, stop and report the error.

## Standards

- Evidence: Inspect the current branch state, local branches, ahead/behind status, actual conflicting files, and any active batch-spec `coordination.md` merge-order guidance before deciding what to merge.
- Execution: Merge only the relevant local branches into `main` sequentially, read any active batch-spec `coordination.md` and honor its documented merge order when present, resolve conflicts by reading both sides and editing the merged result to preserve shipped behavior, verify the merged state, delete each successfully merged branch and its detached worktree only after the merged result is confirmed, then hand the final local branch state to `commit-and-push` so commit/changelog/spec-archival work happens through the shared submission workflow.
- Quality: Never use blanket timestamp rules or default `-X ours/theirs` conflict resolution as the primary merge strategy, and do not declare success until the final `main` state has been checked and verified.
- Output: Produce a clean local main branch with all local changes integrated and ready for the shared submit workflow.

## Goal

Consolidate all local branch changes into the local main branch with automatic conflict resolution that preserves correct functionality.

## Workflow

### 1) Inventory all local branches

- Run `git branch` to list all local branches.
- Check the current branch with `git branch --show-current` and capture `git status -sb`.
- Inspect active planning artifacts under `docs/plans/` and look for batch roots that still contain live spec sets plus a `coordination.md`.
- When an active batch is present, read its `coordination.md` before deciding merge order.
- Compare each candidate branch against `main` with `git log --oneline main..branch`, `git diff --stat main...branch`, or equivalent evidence so empty or already-merged branches are skipped.
- For each branch, note:
  - Branch name
  - Commits ahead of main
  - Last commit message (via `git log -1 --oneline`)

### 1.5) Resolve merge order from active batch specs

- Treat active batch specs as authoritative merge-order guidance when they include a concrete `Merge order / landing order` entry in `coordination.md`.
- Map branch names to the corresponding spec sets or worktrees using the batch folder names, spec-set names, and current git evidence; do not guess when the mapping is ambiguous.
- Merge branches in the documented order when that order is explicit.
- If multiple active batches exist, reconcile their merge-order guidance before merging; if the orders conflict or the branch-to-spec mapping is unclear, stop and report the ambiguity instead of choosing an arbitrary sequence.
- If no active batch spec provides an explicit merge order, fall back to the normal branch inventory evidence and merge the relevant branches sequentially based on the safest verified order.

### 2) Ensure clean state on main

- Check `git status` on `main`.
- If `main` has uncommitted changes that are unrelated to the merge request, stop and report them instead of stashing automatically.
- Only proceed once you can state which branch or branches actually need to be merged.

### 3) Merge branches sequentially in the resolved order

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

### 5) Hand off the merged result for shared submission handling

- After a branch has been merged successfully and the merged `main` state has been verified, remove the source branch worktree if one exists:
  ```bash
  git worktree list
  git worktree remove <worktree-path>
  ```
- Delete only branches that were merged successfully:
  ```bash
  git branch -d <branch-name>
  ```
- If a branch still has an attached worktree, remove the worktree before deleting the branch.
- Never delete:
  - `main`
  - the currently checked-out branch
  - branches that were skipped, failed to merge, or still need manual follow-up
- If `git branch -d` refuses deletion because the branch is not actually merged, stop and report the branch instead of forcing deletion with `-D`.
- Once merge verification passes, invoke `commit-and-push` for the authoritative local branch so the final submission flow owns:
  - `CHANGELOG.md` readiness
  - any required `archive-specs` run
  - the final commit creation on the local target branch
- Do not duplicate commit-message, changelog, or spec-archival logic inside this skill.
- If a follow-up fix is required after verification, make that fix on `main` before handing off to `commit-and-push`.

### 6) Report completion

- List all branches that were merged.
- List any branches intentionally skipped because they were already merged, empty, or out of scope.
- Confirm main is updated with all changes.
- Note any conflicts that were resolved and the rationale.
- Report the verification commands that were run.
- Confirm whether the workflow stopped at the local commit boundary or continued into a remote push because the user explicitly requested it.

## Working Rules

- Never force-push; use only merge or rebase with merge.
- Prefer preserving functionality over keeping either branch's exact changes.
- Do not push to remote from this skill directly; let `commit-and-push` own any later publish step only when the user explicitly requests it.
- If a branch contains no meaningful changes (empty merge), skip it.
- Keep the main branch history clean and readable.
- If a branch's merge breaks tests, resolve the conflict differently before committing.
- Do not stash or discard unrelated work automatically; stop when the working tree state makes the merge ambiguous.
- Delete merged source branches and their detached worktrees only after the merge commit and verification both succeed.
- When active batch specs provide merge-order guidance, follow that order unless new evidence proves the plan is stale or inapplicable; if so, stop and report the mismatch instead of silently overriding the batch plan.

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
