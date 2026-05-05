---
name: implement-specs-with-worktree
description: >-
  Same contract as **`implement-specs`** but every write happens inside a dedicated `git worktree` + feature branch; verify `pwd` equals `git rev-parse --show-toplevel` before touching code; parent checkout remains read-only for deliverables; honor `preparation.md` baselines and sibling collision rules from `coordination.md`.
  Pick when the user or batch workflow demands isolation (“don’t disturb my dirty main”, per-spec worker). Plain same-branch edits stay on **`implement-specs`** instead.
  Good: commands show matching paths after `git worktree add ../oauth-scope feat/oauth-scope`. Bad: patching files under the primary checkout tree for implementation output.
---

# Implement Specs with Worktree

## Dependencies

- Required: `implement-specs` for the shared discovery / implementation / backfill / commit / reporting lifecycle; `enhance-existing-features` and `develop-new-features` for implementation standards.
- Conditional: `generate-spec` if spec files need clarification or updates.
- Fallback: If any required dependency skill is unavailable, **MUST** stop and report it.

## Non-negotiables

- **MUST** perform every write (product code, tests, and spec-document backfill) inside the active worktree: after each `cd`, **MUST** confirm `pwd` equals `git rev-parse --show-toplevel` for that worktree before editing.
- **MUST NOT** edit implementation files from the parent checkout except for creating or listing worktrees and read-only inspection; the parent checkout is write-prohibited for this spec’s deliverables.
- **MUST** follow the **`implement-specs` Workflow** for discovery, implementation, backfill, commit discipline, and completion reporting—**except** that branch/worktree restrictions in `implement-specs` Non-negotiables are replaced by this skill’s worktree rules.
- **MUST** create the implementation branch from the **same parent branch** the user/session identified as the baseline (often the branch that will receive the merge—not necessarily `main` unless that branch is verified as the base).
- **MUST** use the spec directory name (`change_name`) as the canonical basename for the worktree path and branch stem; branch **`type`/name** must follow `references/branch-naming.md`.
- **MUST** use `git show-ref` and `git worktree list --porcelain` (not shell guesses) when checking whether a branch or worktree already exists; if creation fails ambiguously, **MUST** re-query those commands before retrying.
- When `preparation.md` exists: **MUST** treat it as an already-committed shared baseline for parallel work; **MUST NOT** redo its tasks inside the member spec unless the preparation commit is missing or the document states the prerequisite is still blocked. If baseline assumptions break, **MUST** update `preparation.md` or stop for coordination—**MUST NOT** silently move prerequisite work into the member spec.
- **MUST** complete the same quality bar as `implement-specs`: all in-scope tasks, relevant tests, honest backfill, no sibling-spec scope creep, revert formatter-only noise outside owned files before commit.
- **MUST NOT** `git push` unless the user explicitly asks.
- For targeted Rust tests: **MUST** pass at most one positional `cargo test` filter per invocation; use separate commands or a broader confirmed filter when multiple selectors are needed.

## Standards (summary)

- **Evidence**: Read full spec set plus `coordination.md` and `preparation.md` when present; verify whether the spec is already implemented on the baseline before opening a new worktree; if the plan is missing in the worktree, sync the authoritative copy and re-read before coding.
- **Execution**: Isolated worktree only; branch naming per `references/branch-naming.md`; check sibling worktrees before editing shared boundaries in a parallel batch.
- **Quality**: Same as `implement-specs`, plus collision awareness with sibling worktrees per `coordination.md`.
- **Output**: Clean local branch in the worktree with intended commits only; parent working tree unchanged by this implementation.

## Workflow

**Chain-of-thought:** Answer each **`Pause →`** question before leaving the phase; if any answer conflicts with Non-negotiables, fix state first (right directory, right root, right baseline).

### A) Specs and baseline

- Run **`implement-specs` Workflow steps 1–2** in spirit: resolve paths, read all core files and `coordination.md`; run `git status` / `git worktree list` as needed. If the plan files are absent in the target worktree, sync them in, then re-read in that tree.
- Read `preparation.md` when present; apply the Non-negotiable baseline rule above.
  - **Pause →** Where will authoritative plan text live **for this session**—parent tree, worktree after sync—and have I opened that copy end-to-end?
  - **Pause →** Does `coordination.md` / `preparation.md` imply **anything** I must not redo or must assume stable before coding?

### B) Worktree and branch

- If the requested scope is already implemented and verified on the baseline, **MUST** report `no-op` with evidence instead of creating duplicate work.
- Otherwise: ensure the shell is in the correct worktree (create one if required):
  - Derive `change_name`; branch pattern `<type>/<spec-name>` per `references/branch-naming.md`; worktree directory `../<spec-name>` (or an equivalent path the user approves).
  - `git branch <branch-name> <parent-branch>` then `git worktree add <path> <branch-name>`; `cd` into it; verify `pwd` vs `git rev-parse --show-toplevel`.
- Before editing shared modules in a batch, check `git worktree list --porcelain` and `coordination.md` for sibling ownership; read sibling diffs when the same file is touched.
  - **Pause →** Why is **`parent-branch`** definitely the correct baseline—not an unexamined assumption that `main` is default?
  - **Pause →** Could this work duplicate an **already-merged** implementation; what **evidence** (`git log`, tests, code search) did I use to rule that in or out?
  - **Pause →** After `cd`, do `pwd` and `git rev-parse --show-toplevel` **match**; if not, why am I not stopping before any write?
  - **Pause →** Which sibling worktree might already own the shared file I am about to touch, and did I inspect their diff?

### C) Implement, backfill, commit, report

- Execute **`implement-specs` Workflow steps 3–6** (implement, backfill, commit, report) **entirely from the worktree root**, applying `enhance-existing-features` / `develop-new-features` standards.
- In the report, **MUST** include branch name, worktree path, commit hash, tests run, backfilled docs, and an explicit statement that the parent checkout was not modified for implementation files.
  - **Pause →** Am I honoring **implement-specs** step 3–6 **constraints** literally while respecting that all writes happen **only** under this worktree root?
  - **Pause →** If I used Rust `cargo test` filters, did I violate the **single positional filter** rule; how would I split the commands?

## Sample hints

- **Root check** (must print the same path twice before edits):
  ```bash
  pwd && git rev-parse --show-toplevel
  ```
- **Skeleton commands** (`change_name` `oauth-scope`, parent `feature/x`, type `feat`):
  ```bash
  git branch feat/oauth-scope feature/x
  git worktree add ../oauth-scope feat/oauth-scope
  cd ../oauth-scope
  ```
- **Cargo** (two filters ⇒ two commands): run `cargo test parser::` **and separately** `cargo test cache::`, not `cargo test parser:: cache::`.

## References

- `implement-specs`: shared lifecycle (read → implement → backfill → commit → report)
- `references/branch-naming.md`: branch naming
- `enhance-existing-features`, `develop-new-features`: implementation standards
