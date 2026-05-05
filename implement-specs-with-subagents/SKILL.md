---
name: implement-specs-with-subagents
description: >-
  Coordinator-only workflow for multispec batches: ingest `coordination.md`/`preparation.md`, run prerequisite work yourself, derive topological phases, launch ≤4 staggered **`implement-specs-with-worktree`** workers (one `{change}` each), **`merge-changes-from-local-branches`** after every phase succeeds, ledger every branch/test/merge—not for solo specs unless user explicitly insists on delegation overload.
  Wrong tool for one directory without parallel mandate—pick **`implement-specs-with-worktree`** / **`implement-specs`** depending on isolation. Publication/versioning stays outside this orchestration layer unless another skill attaches.
  Ledger sample: `oauth-scope | phase=1 | merged | npm test ✅`. Burst-launching four agents simultaneously—disallowed pacing required…
---

# Implement Specs with Subagents (Multi-Phase)

## Dependencies

- Required: `implement-specs-with-worktree` (every implementation subagent **MUST** follow this skill for its assigned directory); `merge-changes-from-local-branches` (phase integration **MUST NOT** skip this between phases).
- Conditional: `generate-spec` if the batch is not implementation-ready; `review-change-set` only when the user asks for post-merge review.
- Fallback: If independent subagents cannot run, **MUST** report that limitation. Serial `implement-specs-with-worktree` across specs is allowed **only** after the user explicitly approves that fallback.

## Non-negotiables

- **MUST NOT** delegate until `coordination.md`, when present, explicitly allows parallel implementation—or when absent, until you have verified no contradiction to parallel work.
- **MUST** enumerate exact in-scope spec directories **before** any subagent starts; **MUST NOT** delegate archived, sibling, or “nearest guess” directories unless the user explicitly includes them.
- **MUST** verify each delegated directory contains `spec.md`, `tasks.md`, `checklist.md`, `contract.md`, and `design.md` before launch.
- **MUST** complete, verify, and **commit** documented shared preparation on the integration branch **before** any implementation subagent starts when `preparation.md` exists or specs mandate pre-work; the coordinating agent **MUST NOT** delegate that preparation. Subagents **MUST NOT** start until this branch is clean at the preparation commit (or there is no required preparation).
- **MUST** build a directed dependency graph from `coordination.md` plus each spec’s `spec.md` / `design.md` (edges: *provider spec must merge before consumer spec*). **MUST** partition specs into phases by topological **layers**: Phase 1 = specs with **no** in-batch prerequisites; for *k* ≥ 2, Phase *k* = specs whose in-batch prerequisites all appear in phases before *k*. **MUST NOT** start phase *k* until phase *k − 1* is fully merged into the integration branch (or you have an explicit user override). If the graph has a cycle, **MUST** stop and report it.
- **MUST** assign **exactly one** spec directory per implementation subagent; **MUST NOT** assign multiple directories to one implementation subagent.
- **MUST** cap **active** implementation subagents at **four**; **MUST** start them **one at a time** with confirmation each is running before the next start; **MUST** back off on rate limits (no burst launches). Four is a ceiling, not a quota.
- **MUST** give each subagent only task-local context (repo root, exact spec path, `coordination.md` path if relevant, instruction to run `implement-specs-with-worktree`, baseline commit when preparation exists, requirement to read the full bundle before edits, worktree isolation, tests, backfill, local commit, and reporting branch/worktree/commit/tests/blockers). **MUST NOT** leak unrelated reasoning or other subagents’ private diffs unless resolving a concrete conflict.
- After each phase: **MUST** merge every **completed** spec branch from that phase into the integration branch via `merge-changes-from-local-branches` before starting the next phase; **MUST** resolve conflicts using spec contracts as the correctness tie-breaker; **MUST** record merge result in the ledger; if merge is blocked, **MUST** stop the pipeline and report.
- Model: If the user names a model, **MUST** use it for implementation subagents when the platform allows; if not supported, **MUST** state that fact and continue only if the default is acceptable to the user’s intent.

## Standards (summary)

- **Evidence**: Batch read (`coordination.md`, `preparation.md`, every in-scope `spec.md` / `design.md`) before scheduling; ledger stays live.
- **Execution**: Preparation → dependency graph → phased delegation with merge gates; never skip merges between dependent phases.
- **Quality**: No duplicate delegation; subagents base on the branch that already contains preparation (and prior phases); pause on shared file collisions, batch-wide defects, or rate-limit pressure.
- **Output**: Concise ledger: per spec → phase, depends-on, subagent id/label, branch/worktree, commit or blocker, tests, merge status.

## Workflow

**Chain-of-thought:** After **each** numbered step below, briefly answer **`Pause →`** items; escalate to halt or revise the plan whenever the answer violates Non-negotiables or exposes a blocker.

1. **Batch intake** — Resolve `docs/plans/{YYYY-MM-DD}/{batch_name}/`. Read `coordination.md` (first) and `preparation.md` when present. List only in-scope spec directories; verify the five required files each. If coordination blocks parallel work, **stop** and report. If preparation is required, go to step 2; else go to step 3.
   - **Pause →** Can I quote **verbatim** why each enumerated directory is in scope—not “probably related”?
   - **Pause →** What **exact sentence** from `coordination.md` gates parallel readiness, if any—or what absence did I infer from—and is that justified?

2. **Preparation (blocking when required)** — Coordinating agent executes shared prep only: read tasks/outputs/verification hooks, satisfy scope, run listed checks, **commit** on the integration branch, record prep commit hash in ledger, leave working tree clean. If prep fails, **stop** (no subagents).
   - **Pause →** Am I silently delegating preparation to a **subagent** when the coordinating agent owns it—is that happening?
   - **Pause →** What **commit hash** and **clean-tree** confirmation will subagents inherit as baseline?

3. **Dependency graph** — Extract ordering obligations; assign each spec a phase index via topological layering. Persist `depends-on` / `depended-by` in the ledger. Cycles ⇒ **stop**.
   - **Pause →** For each edge (A must land before B), what **sentence** from spec/design/coordination supports it?
   - **Pause →** If I flattened phases wrong, which later spec would start **without** its merged predecessor—how do I detect that now?

4. **Plan launches** — For each phase, queue one item per spec. Ledger fields: phase, paths, deps, planned branch/worktree basename, status (`pending` / `in_progress` / `merged` / `blocked`), commit, tests, blockers, prep-commit baseline note. Fix model policy per Non-negotiables.
   - **Pause →** Is there **exactly one** spec directory per queued subagent—never two in one prompt?
   - **Pause →** What will I **repeat** in every subagent envelope so they cannot “improvise” the wrong skill or wrong path?

5. **Run phase *k*** — Start ≤4 subagents sequentially with task-local payloads (see Non-negotiables). Monitor ledger; pause new launches on shared blockers; on conflicting edits to shared files, resolve ownership using `coordination.md` before more launches; if one spec fails and others depend on it, **MUST NOT** start those dependents until resolved; batch-wide planning failure ⇒ stop all scheduling.
   - **Pause →** How many subagents are **active** right now vs the cap of four; did I start the last one only **after** the previous was confirmed running?
   - **Pause →** Did two running subagents report **overlapping** paths; if yes, did I stop launching until ownership is clear?

6. **Merge phase *k*** — When every item in phase *k* is **done or explicitly blocked**, merge **each successful** branch via `merge-changes-from-local-branches`; rerun critical tests if your standards say so; update ledger. Merge failure ⇒ **stop** before phase *k+1*.
   - **Pause →** Has **every** successful branch in this phase been merged into the **same** integration branch I will use to **start** phase *k+1*?
   - **Pause →** If a merge conflict touches a **contract** field, which spec’s `contract.md` / `design.md` is the tie-breaker I will apply?

7. **Repeat** — Next phase starts only on the merged integration branch that includes all required predecessors.
   - **Pause →** Before launching phase *k+1*, can I **name** the merge commit or branch state that contains **all** prerequisites for every spec in that phase?

## Out of scope

- **MUST NOT** use this skill for a single spec unless the user explicitly requests subagent delegation.

**Repository regression check:** The coordinating agent must complete and commit explicitly documented prerequisite preparation on the integration branch before launching implementation subagents when `preparation.md` or equivalent mandates it.

## Sample hints

- **Ledger row (one line per spec)**:
  `oauth-scope | phase=1 | depends-on: — | branch feat/oauth-scope | status merged | tests: npm test ✓`
- **Subagent envelope (minimal)** — repo root `/repo`; spec `/repo/docs/plans/2026-05-01/batch-a/oauth-scope/`; instruction: run skill **`implement-specs-with-worktree`** on that path only; baseline `prep_sha=deadbeef` when preparation landed; reply with branch, `worktree path`, commit, tests.
- **Tiny dependency graph**: `api-layer` blocks `cli-wrapper` ⇒ Phase 1: `{ api-layer }`, Phase 2: `{ cli-wrapper }`. Independent specs share a phase layer (e.g. both in Phase 1) **only** if neither lists the other as prerequisite in spec/design/coordination.
- **Launch cadence**: with cap 4, acceptable active counts over time: `1 → 2 → 3 → 4 → (finish one) → 4`; **not** spawn 4 in one burst with no pacing.

## References

- `implement-specs-with-worktree`: per-spec execution environment
- `merge-changes-from-local-branches`: phase merge integration (and downstream submit flow when that skill is invoked)
- `generate-spec`: repair planning when the batch is not ready
- `coordination.md`, `preparation.md`: batch-level ordering and prerequisites
- `review-change-set`: optional post-merge review
