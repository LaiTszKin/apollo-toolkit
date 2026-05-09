---
name: merge-changes-from-local-branches
description: >-
  Read changes from local branches identified by branch name and merge them back into the current local branch. Resolve conflicts by composing correct behavior (prefer the more recent change on the same line or the variant that preserves working behavior), using **`merge-conflict-resolver`** when needed. Verify after merges; remove successfully merged source branches and detached worktrees only after merge + verification succeed. Finalize through **`commit-and-push`** for submission-readiness gates and the **final local commit** on the same branch—**do not** push unless the user explicitly requested remote update in this thread (**`commit-and-push`** step 7). **Does not** run **`archive-specs`** as part of this skill.
  Use when consolidating named local branch work into the current branch or preparing integration on that branch.
---

# Merge Changes from Local Branches

## Dependencies

- Required: **`commit-and-push`** for submission-readiness, mandated reviews, and the **final** commit on the original current branch (push **only** when the user explicitly asked for remote update in this thread—otherwise stop after commit).
- Conditional: **`merge-conflict-resolver`** when merge conflicts require deterministic resolution.
- Optional: none.
- Fallback: If **`commit-and-push`** is unavailable, **MUST** stop and report—**MUST NOT** improvise readiness or use a bare `git commit` shortcut. If git merge operations fail irreparably, stop and report.

## Non-negotiables

- **MUST** treat the branch that was current at workflow start as the **authoritative merge target** for the whole workflow; **MUST NOT** silently switch the destination to **`main`** or another branch unless the user explicitly rescopes.
- **MUST** determine in-scope branches from **explicit branch names** the user gives **or** from unambiguous mappings from active spec / `coordination.md` context—**MUST NOT** infer the merge set from ancestry heuristics alone when names already define intent.
- **MUST** read active batch **`coordination.md`** when present and honor a documented **`Merge order` / landing order**; if multiple batches conflict or branch-to-spec mapping is ambiguous, **MUST** stop and report instead of guessing order.
- **MUST** resolve conflicts by reading both sides and editing merged results that preserve shipped behavior—**MUST NOT** rely on blanket **`-X ours` / `-X theirs`** or timestamp guesses as the primary strategy.
- **`archive-specs`**: **MUST NOT** invoke **`archive-specs`** from this skill. Any archival or doc-sync routing belongs to **`commit-and-push`** (via **`submission-readiness-check`**) when that workflow’s gates require it—not a separate mandated step immediately after merges here.
- **MUST** verify the merged tree (targeted checks after conflictful merges; broader **`npm test` / equivalent** when the repo provides a standard command) before deleting source branches or handing off to **`commit-and-push`**.
- **MUST NOT** **`git push`**, tag, or release **from this skill**; **`commit-and-push`** owns push **only** when the user explicitly requested remote publication in this thread (**same rule as **`commit-and-push`** step 7**).
- **MUST** finalize through **`commit-and-push`** after staging the post-merge intent—**MUST NOT** bypass **`submission-readiness-check`** / mandated gates with a stray local commit path.
- **MUST NOT** force-delete merged branches (**`-D`**) when **`-d`** refuses; **MUST** stop and report branches that are not actually merged into the target.

## Standards (summary)

- **Evidence**: `git branch`, `git log` / diff stats vs current branch, conflict file contents, `coordination.md` merge order when present.
- **Execution**: Inventory → clean target branch → sequential merges → verify → prune merged branches/worktrees → **`commit-and-push`** through local commit (push only if user asked).
- **Quality**: Scope strictly to named / mapped branches; no unrelated branch sweeps; no push-by-default from this workflow.
- **Output**: Integrated current branch ready for **`commit-and-push`**; concise report of merged/skipped branches, conflicts resolved, verification commands.

## Workflow

**Chain-of-thought:** Before each numbered step, answer the **`Pause →`** prompts. Validator or verification red **blocks** advancing to pruning or **`commit-and-push`**.

### 1) Inventory the current branch and in-scope named branches

- Run `git branch`; capture `git branch --show-current` and `git status -sb`.
- Inspect `docs/plans/` for active batch roots that include **`coordination.md`**; read merge-order guidance **before** choosing sequence.
- Build the merge set from **user branch names**, else from unambiguous spec-name / **`coordination.md`** mappings—if a required name cannot be matched, stop and report.
- For each candidate: `git log --oneline <current>..<candidate>` and `git diff --stat <current>...<candidate>` (or equivalent); skip empty / already-up-to-date branches and record why.
- Per branch, note: name, match rationale, commits ahead, `git log -1 --oneline`.
  - **Pause →** Is every in-scope branch matched **unambiguously**, not by “probably related” ancestry?
  - **Pause →** If **`coordination.md`** gives a merge order, does my sequence match it literally?

### 1.5) Resolve merge order from active batch specs

- When **`coordination.md`** defines **`Merge order` / landing order**, merge **only** in that order after mapping branch names to specs/worktrees without guessing.
- When multiple active batches disagree or mapping is unclear, stop and report.
- When no explicit order exists, use the user’s branch list order sequentially.
  - **Pause →** Would merging in a different order violate a written batch plan?

### 2) Ensure clean state on the original current branch

- Inspect `git status`. If unrelated uncommitted changes block a safe merge, stop and report—**MUST NOT** stash or discard without user direction.
  - **Pause →** Am I still on the **same** authoritative target branch I started with?

### 3) Merge branches sequentially in the resolved order

For each in-scope branch:

1. `git checkout <current-branch>`
2. `git merge <branch-name> --no-ff -m "Merge branch '<branch-name>' into <current-branch>"`
3. On conflicts: use **`merge-conflict-resolver`**; then `git add` resolved paths.
4. If resolution is ambiguous, prefer behavior that preserves tests, documented intent, and minimal semantic drift.
5. Complete the merge commit if Git did not auto-complete.

### 4) Verify merged state

- After conflictful merges, run the most relevant targeted tests or builds for touched areas.
- After all merges, run the repo’s usual validation (`npm test`, `cargo test`, etc.) when applicable.
  - **Pause →** Did verification fail? **MUST** fix on the current branch before pruning or **`commit-and-push`**—**do not** hide red tests behind a merge report.

### 5) Prune merged sources (after verified success only)

- `git worktree list`; remove worktrees for successfully merged branches when safe.
- `git branch -d <branch-name>` only for verified merges; refuse **`-D`** when **`-d`** fails—report instead.
- **Never** delete the original target branch, the checked-out branch, or branches that failed / were skipped.

### 6) Submit via **`commit-and-push`** (local commit; push optional)

- Stage the post-merge / fix-up intent per user scope.
- Run **`commit-and-push`** through **commit**: inspect, classify gates, mandated reviews where applicable, **`submission-readiness-check`**, then commit with conventional message—**omit push** unless the user explicitly requested remote update in this thread ( **`commit-and-push`** step **7**).
- **MUST NOT** reintroduce **`archive-specs`** as a sibling step controlled by **this** skill; if **`submission-readiness-check`** routes archival work, **`commit-and-push`** owns that decision.
  - **Pause →** Am I about to push without an explicit user request for remote publication?
  - **Pause →** Does `git diff --cached` match intended merge scope—no stray unrelated paths?

### 7) Report

- List merged vs skipped branches and why.
- Current branch name; confirmation merges landed on original target.
- Conflicts resolved and brief rationale.
- Verification commands executed.
- State whether completion stopped at **local HEAD** (**no push**) or included push per explicit user ask.

## Sample hints

- **Skip**: candidate shows no commits ahead of current—record “already merged / empty”.
- **`coordination.md`**: landing order **`api-layer`** then **`cli-wrapper`** ⇒ merge matching branches in that sequence even if creation dates differ.
- **`commit-and-push` without push**: user said “merge and commit locally”—run **`commit-and-push`** gates and commit; report `HEAD` hash; **no** **`git push`**.

## Working Rules

- Never force-push from this workflow.
- Preserve functionality over winning either branch’s raw diff verbatim.
- Do not merge ambiguously matched or unrelated branches.
- Do not delete merged sources until merge commit **and** verification succeed.
- When batch merge-order documentation applies, follow it unless you stop with evidence it is stale.

Resolve conflicts using **`merge-conflict-resolver`**.
