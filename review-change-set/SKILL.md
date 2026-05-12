---
name: review-change-set
description: >-
  Unbiased **git diff** review: architecture (boundaries, duplication, ownership) then simplification (real deletes/flattening, not churn)—discard conversation bias. For diffs spanning multiple files/modules, **prefer dispatching one read-only subagent per scope cluster** (each owns its files end-to-end), then aggregate confirmed findings on the main agent without re-reading delegated files.
  Use for pre-commit/pre-PR review, refactor/abstraction second opinion, “review my branch” **STOP** greenfield feature design from scratch—use planning skills… BAD style-only nits… GOOD evidence + named abstraction target…
---

# Review Change Set

## Dependencies

- Required: none.
- Conditional: none.
- Optional: none.
- Fallback: If a downstream consumer (e.g. `commit-and-push`) needs additional safety checks (security, edge cases), invoke those skills explicitly there — this skill no longer chains them automatically.

## Non-negotiables

- Read the **full** active change set (staged **and** unstaged when both exist—label which finding hits which).
- **MUST** discard authorship bias; burden of proof on the code.
- Prefer **architecture** and **maintainability** over style-only.
- Abstraction only when it cuts duplication, clarifies ownership, or stabilizes boundaries.
- Simplification only when behavior-preserving and genuinely simpler—**MUST NOT** shuffle complexity.
- For non-trivial diffs (multiple files, multiple modules, or large per-file changes), **SHOULD** dispatch **read-only subagents** — one per coherent scope cluster (e.g. one feature/package, one layer, or one logical concern). Each subagent reads its assigned files end-to-end and returns ONLY structured findings (architecture + simplification with `path:line` evidence). The main agent **MUST NOT** re-read delegated files; it aggregates confirmed findings, deduplicates cross-cluster overlaps, and writes the final report. Tiny one-file diffs may be reviewed inline without subagents.
- **MUST NOT** fabricate findings the diff does not actually contain; subagent reports stay confined to architecture and simplification.

## Standards (summary)

- **Evidence**: Full diff + minimum context reads to understand behavior; subagent reports cite `path:line` per finding.
- **Execution**: Git state → baseline → (subagent fan-out for multi-cluster diffs OR inline read for tiny diffs) → architecture → simplification → aggregate → report.
- **Quality**: Actionable, outsider perspective; subagent fan-out keeps each context window small; no duplicated findings across clusters.
- **Output**: Scope, architecture findings, simplification findings, residual uncertainty.

## Workflow

**Chain-of-thought:** **`Pause →`** after each block—no verdicts from partial file reads.

### 1) Inspect git state

- `git status -sb`, `git diff --stat`, `git diff --cached --stat`; cover staged vs unstaged explicitly.
- No diff → `No active git change set to review` and stop.
   - **Pause →** Am I about to review **only** unstaged while staged also ships?

### 2) Plan the read pattern

- **Tiny diff** (one file or a handful of small hunks in one module) → read inline; skip subagents.
- **Multi-file or multi-module diff** → cluster the changed files into coherent scopes (one feature/package, one layer, one logical concern). Dispatch **one read-only subagent per cluster**. Hand each subagent: the cluster file list, its slice of `git diff`/`git diff --cached`, and the structured-report contract below. The main agent **MUST NOT** read the delegated files itself.

> **Cluster `<scope>` subagent contract**
> - Read every file in this cluster E2E plus the minimum callers/callees/config needed to interpret behavior.
> - Discard authorship bias; behavior comes from code/tests/config, not chat memory.
> - Return ONLY a structured findings block:
>   - `Architecture`: list of `{ title, evidence (path:line), abstraction target, why current shape is weaker }`.
>   - `Simplification`: list of `{ title, evidence (path:line), candidate change, behavior-preserving benefit }`.
>   - `Outbound concerns`: any boundary issue that touches another cluster (so the orchestrator can deduplicate).
> - No source dumps, no opinions about tasks outside this cluster, no security/edge-case fabrication.

   - **Pause →** Did I cluster correctly so that one subagent owns each coherent boundary, or am I about to split a duplicated helper across two subagents and miss the dedup signal?

### 3) Baseline (inline path) or aggregate (subagent path)

- Inline: read every changed file E2E; pull in minimal callers/callees/config to interpret moves and interfaces.
- Subagent: wait for **every** cluster subagent to return. Aggregate their findings, then deduplicate any architecture finding two clusters reported via their `Outbound concerns` block.
- Behavior from **code, tests, config, execution**—not from chat memory.
   - **Pause →** Can I quote **one concrete behavior** change this diff introduces—not intent?

### 4) Architecture first

Flag only if evidence-backed: duplicated workflows, cross-layer leakage, wrong helper ownership, repeated condition trees, unstable interfaces.
Each finding **MUST** name abstraction target **and** why current shape is weaker.
   - **Pause →** Is this “different style” or a real **boundary** problem?

### 5) Simplification second

Redundant branches/wrappers, deep nesting, duplicated validation, oversize functions, dead compat—**only** if it truly reduces complexity.
   - **Pause →** Would this refactor just **move** lines between files?

### 6) Report

1. **Scope** — staged/unstaged; extra context paths read; cluster list when subagents were used.
2. **Architecture** — title, evidence (`path:line`), candidate, why weaker.
3. **Simplification** — title, evidence, candidate, benefit.
4. **Residual uncertainty** — hypotheses / follow-up checks.

If nothing actionable: `No actionable abstraction or simplification finding identified`.

## Sample hints

- **Staged only**: User ran `git add -p` → findings tagged **staged** vs **unstaged** separately.
- **Rename-heavy**: Read old→new path mapping before calling “duplication.”
- **Tiny diff**: One-file guard clause → architecture section may be empty; reviewed inline without subagents.
- **Wide refactor across packages**: cluster by package; one read-only subagent per package; dedupe duplicated-helper findings on the main agent.

## References

- Downstream consumers (e.g. `commit-and-push`, `version-release`, `review-spec-related-changes`) decide independently when to add security or edge-case passes; this skill no longer wires them.
