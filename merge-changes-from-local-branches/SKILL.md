---
name: merge-changes-from-local-branches
description: >-
  Read changes from local branches identified by branch name and merge them back
  into the current local branch. When conflicts arise, auto-resolve them by
  keeping correct functionality (preferring the more recent change on the same
  line, or the change that preserves working behavior). After merge verification,
  run `archive-specs` so completed plan sets are archived and durable project
  docs are synchronized, then hand the current branch state to `commit-and-push`
  so the final submit workflow commits and pushes on that same local branch.
  Use when the user asks to consolidate local branch work, merge named branches
  into the current branch, or prepare the current branch for integration.
---

# Merge Changes from Local Branches

## Dependencies

- Required: `archive-specs` to archive completed plan sets and synchronize durable project docs after merge verification, and `commit-and-push` for the final current-branch submission flow.
- Conditional: none.
- Optional: none.
- Fallback: If git operations fail, stop and report the error.

## Standards

- Evidence: Inspect the original current branch, local branches, branch-name matches provided by the user or active spec names, actual conflicting files, and any active batch-spec `coordination.md` merge-order guidance before deciding what to merge.
- Execution: Merge only the relevant named branches back into the original current branch, read any active batch-spec `coordination.md` and honor its documented merge order when present, resolve conflicts by reading both sides and editing the merged result to preserve shipped behavior, verify the merged state, delete each successfully merged source branch and its detached worktree only after the merged result is confirmed, run `archive-specs` after merge verification so completed plan sets are archived and durable docs are synchronized, then hand the final current-branch state to `commit-and-push` so changelog/readiness/commit/push work happens through the shared submission workflow on the same branch.
- Quality: Never use blanket timestamp rules or default `-X ours/theirs` conflict resolution as the primary merge strategy, never infer in-scope branches from ancestry heuristics when branch names already define the target set, and do not declare success until the final current-branch state has been checked, verified, and cleared for post-merge archival/doc-sync work.
- Output: Produce a clean current branch with all relevant named-branch changes integrated and ready for the shared submit workflow.

## Goal

Consolidate the intended named local branches back into the original current branch with automatic conflict resolution that preserves correct functionality.

## Workflow

### 1) Inventory the current branch and in-scope named branches

- Run `git branch` to list all local branches.
- Check the current branch with `git branch --show-current` and capture `git status -sb`.
- Inspect active planning artifacts under `docs/plans/` and look for batch roots that still contain live spec sets plus a `coordination.md`.
- When an active batch is present, read its `coordination.md` before deciding merge order.
- Treat the original current branch as the authoritative merge target for the whole workflow; do not silently switch that target to `main`.
- Determine the in-scope branches directly from branch names:
  - prefer the exact branch names the user provided
  - otherwise map active spec-set names or documented merge-order entries to branch names
  - otherwise stop and report the missing branch-name target instead of inferring from ancestry
- Accept a branch as in scope only when its branch name can be matched unambiguously to the requested merge set; skip unrelated local branches.
- Compare each in-scope candidate branch against the current branch with `git log --oneline <current-branch>..<candidate>`, `git diff --stat <current-branch>...<candidate>`, or equivalent evidence so empty or already-merged branches are skipped.
- For each branch, note:
  - Branch name
  - How the branch name was matched to the requested merge set
  - Commits ahead of the current branch
  - Last commit message (via `git log -1 --oneline`)

### 1.5) Resolve merge order from active batch specs

- Treat active batch specs as authoritative merge-order guidance when they include a concrete `Merge order / landing order` entry in `coordination.md`.
- Map branch names to the corresponding spec sets or worktrees using the batch folder names, spec-set names, and documented merge-order entries; do not guess when the mapping is ambiguous.
- Merge only the in-scope named branches in the documented order when that order is explicit.
- If multiple active batches exist, reconcile their merge-order guidance before merging; if the orders conflict or the branch-to-spec mapping is unclear, stop and report the ambiguity instead of choosing an arbitrary sequence.
- If no active batch spec provides an explicit merge order, fall back to the requested branch-name list and merge the relevant branches sequentially in that explicit name order.

### 2) Ensure clean state on the original current branch

- Check `git status` on the original current branch.
- If the current branch has uncommitted changes that are unrelated to the merge request, stop and report them instead of stashing automatically.
- Never change the authoritative target branch unless the user explicitly asks for a different destination.
- Only proceed once you can state which branch or branches actually need to be merged.

### 3) Merge branches sequentially in the resolved order

For each in-scope named branch:

1. Check out the original current branch:
   ```bash
   git checkout <current-branch>
   ```

2. Merge the branch:
   ```bash
   git merge <branch-name> --no-ff -m "Merge branch '<branch-name>' into <current-branch>"
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
   git commit -m "Merge branch '<branch-name>' into <current-branch>"
   ```

### 4) Verify merged state

- After each conflictful merge, run the most relevant targeted tests or build checks for the files that changed.
- After all merges complete, run the repository's broader validation command when one exists:
  ```bash
  npm test  # or yarn test, cargo test, etc.
  ```
- If verification fails, fix the merged state on the current branch before proceeding.

### 5) Archive completed specs and sync durable project docs

- After all in-scope merges succeed and the current-branch state has been verified, invoke `archive-specs`.
- Let `archive-specs` convert and archive any completed `docs/plans/...` spec sets that now reflect the delivered outcome.
- Let `archive-specs` synchronize durable project docs and `AGENTS.md` when the merged result changed operator workflows, repository guidance, or user-visible behavior.
- Do not proceed to the final submission commit while required archival or documentation updates remain unfinished.
- If no completed spec sets or project-doc drift are present, record that evidence explicitly before moving on.

### 6) Hand off the merged result for shared submission handling

- After a source branch has been merged successfully and the merged current-branch state has been verified, remove the source branch worktree if one exists:
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
  - the original current branch
  - the currently checked-out branch
  - branches that were skipped, failed to merge, or still need manual follow-up
- If `git branch -d` refuses deletion because the branch is not actually merged, stop and report the branch instead of forcing deletion with `-D`.
- Once merge verification and archival/doc synchronization pass, invoke `commit-and-push` for the original current branch so the final submission flow owns:
  - `CHANGELOG.md` readiness
  - the final commit creation on the original current branch
  - the user-requested push on that same branch
- Do not duplicate commit-message or changelog-readiness logic inside this skill; post-merge archival must flow through `archive-specs`.
- If a follow-up fix is required after verification or archival/doc sync, make that fix on the original current branch before handing off to `commit-and-push`.

### 7) Report completion

- List all named branches that were merged.
- List any branches intentionally skipped because they were already merged, empty, or out of scope.
- Confirm the original current branch is updated with all merged changes.
- Note any conflicts that were resolved and the rationale.
- Report the verification commands that were run.
- Report whether `archive-specs` updated durable docs or found no archival/doc-sync work to do.
- Confirm whether the workflow stopped at the local commit boundary or continued into a remote push because the user explicitly requested it.

## Working Rules

- Never force-push; use only merge or rebase with merge.
- Prefer preserving functionality over keeping either branch's exact changes.
- Do not push to remote from this skill directly; let `commit-and-push` own any later publish step only when the user explicitly requests it.
- Never merge unrelated or ambiguously matched branches into the current branch; merge only branches whose names are explicitly requested or can be matched unambiguously from the active spec context.
- If a branch contains no meaningful changes (empty merge), skip it.
- Keep the current branch history clean and readable.
- If a branch's merge breaks tests, resolve the conflict differently before committing.
- Do not stash or discard unrelated work automatically; stop when the working tree state makes the merge ambiguous.
- Delete merged source branches and their detached worktrees only after the merge commit and verification both succeed.
- When active batch specs provide merge-order guidance for in-scope named branches, follow that order unless new evidence proves the plan is stale or inapplicable; if so, stop and report the mismatch instead of silently overriding the batch plan.

## Conflict Resolution Examples

| Scenario | Resolution Strategy |
|----------|---------------------|
| Same line, both branches changed behavior | Read both code paths and compose the merged logic that preserves the verified invariant |
| Same line, one branch is a bug fix and the other is a refactor | Keep the bug fix and reapply the compatible refactor structure manually if needed |
| File deleted in branch, modified in current branch | Keep the version supported by current references/tests and remove only if the deletion is proven correct |
| Both added same function differently | Keep both; rename if needed |
| Config file conflict | Keep both values if non-overlapping |
| Test file conflict | Keep both test cases |
| package.json dependency conflict | Keep higher version if compatible |
