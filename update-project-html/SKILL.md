---
name: update-project-html
description: >-
  Refresh the base project HTML architecture atlas to reflect the latest code changes: read the existing atlas, resolve diff scope (`git diff --stat` + staged by default, or `git diff --stat <base>..HEAD` when a ref is named), filter to code-affecting hunks, and update affected feature/sub-module declarations through `apltk architecture` (no `--spec` — base atlas, not spec overlays). **Subagents only:** dispatch ONE write-capable subagent per affected feature; each deep-reads only its own changed files, applies every intra-feature delta (function/variable/dataflow/error/intra-feature edge add|set|remove|reorder), and returns ONLY (i) sub-module change summary and (ii) outbound boundary deltas. The main agent waits until every subagent finishes before declaring cross-feature edges, then `apltk architecture render` + `validate`. Exact CLI: `apltk architecture --help`. Anchor every change to the actual diff. For unshipped spec work use `spec-to-project-html`; first-time bootstrap use `init-project-html`.
---

# Update Project HTML

## Dependencies

- Required: **`init-project-html`** — its `SKILL.md` is the semantic rulebook (acceptance criteria, two-layer rule, `edge.kind` enum, function/variable referencing rules); **`apltk architecture --help`** is the verb/flag source of truth.
- Conditional: **`spec-to-project-html`** when the user actually wants an overlay scoped to a `docs/plans/...` spec rather than the base atlas — that skill uses `--spec`.
- Optional: **`align-project-documents`** when feature names in the atlas no longer match the `docs/features` set after the diff.
- Fallback: changed code references components that are absent from the atlas → declare new sub-modules / functions / variables before referencing them; if a single feature’s diff is too large for one subagent context, split that feature’s subagent by sub-module folder. **MUST NOT** invent components for code paths that were never read.

## Non-negotiables

- **MUST** mutate atlas state only through the CLI (`apltk architecture …`). The renderer owns `resources/project-architecture/**/*.html` — agents **MUST NOT** hand-edit those files.
- **MUST** target the **base atlas** (no `--spec` flag). This skill is for code that has *already shipped* (or is about to be committed) and therefore belongs in the canonical diagram. For planned/unmerged work scoped to a spec, redirect to **`spec-to-project-html`**. For repos with no atlas yet, redirect to **`init-project-html`**.
- **MUST** decide the diff scope **before** reading any source files: working tree (`git diff --stat`) + staged (`git diff --cached --stat`) by default; an explicit ref/range when the user names one (e.g. `git diff --stat $(git merge-base HEAD origin/main)..HEAD` for a PR refresh). Print the literal command(s) you ran in the report so the run is reproducible.
- **MUST** filter to **code-affecting** hunks — exclude pure docs/markdown/asset edits, generated files, lockfiles, and formatting-only diffs that do not change runtime behavior. Record skipped buckets in the report so reviewers can audit the filter.
- **MUST** preserve the existing atlas structure for parts the diff did not touch — never delete features, sub-modules, or edges just because the current diff is silent about them. Only mutate what the diff actually changed (rename, move, remove, add, behavior change).
- **MUST** use the **subagent fan-out** pattern from `init-project-html` Rule 3:
  1. Enumerate **affected features** from the filtered diff (path → feature mapping using existing atlas YAML + folder layout). No function-body deep reads at this stage.
  2. Dispatch **one write-capable subagent per affected feature**. Each deep-reads only its own changed files (use `git diff` for exact deltas plus the post-change source for context), applies every intra-feature mutation via `apltk architecture` (`function`, `variable`, `dataflow`, `error`, intra-feature `edge` add|set|remove|reorder), and returns ONLY (i) sub-module change summary and (ii) outbound boundary deltas (cross-feature edges to add/change/remove with endpoints + suggested kind/label).
  3. **HARD GATE:** the main agent **MUST** wait until **every** dispatched subagent has finished (success or explicit failure report) before declaring any cross-feature `edge`, shared `meta` that stitches multiple features, or `actor` that exists only for cross-feature context.
- **MUST** run `apltk architecture render` (when subagents batched with `--no-render`) and `apltk architecture validate` after the cross-feature wiring; resolve every reported error before reporting completion.
- **MUST NOT** re-read source for a delegated feature in the main agent and **MUST NOT** re-declare intra-feature components a subagent already owns.
- **MUST NOT** generate spec overlay artifacts (`<spec_dir>/architecture_diff/atlas/`) — that is **`spec-to-project-html`**’s job.

## Standards (summary)

- **Evidence**: every CLI mutation traces to a specific file + diff hunk; record the chosen diff scope and skipped buckets in `meta.summary` via the CLI.
- **Execution**: read base atlas → resolve diff scope → filter to code-affecting hunks → map paths to features → subagent fan-out → wait for all → cross-feature edges → `render` → `validate` → handover.
- **Quality**: macro SVG still reflects every cross-feature data-row that exists in the *new* code; sub-module declarations stay self-only; `apltk architecture validate` returns OK.
- **Output**: updated `resources/project-architecture/atlas/**/*.yaml` + re-rendered `resources/project-architecture/**/*.html` + a report listing affected features, mutation counts, skipped diff buckets, and the `validate` outcome.

## Acceptance criteria

The atlas update is only complete when **all** of the following hold:

1. Every code-affecting hunk in the chosen diff scope is reflected in either an intra-feature mutation (function/variable/dataflow/error/edge) or a cross-feature edge — or is explicitly listed under "no diagram impact" in the handover report with a one-line reason.
2. `apltk architecture validate` returns OK.
3. Macro acceptance criteria from `init-project-html` still hold: cross-boundary interaction expressed as `call`/`return`/`data-row`/`failure` edges (never sub-module page prose); each touched sub-module’s internal diagram has function-to-function flow plus declared variable reads/writes for non-trivial steps.
4. The handover report cites: chosen diff scope (literal commands), affected feature list, per-feature mutation counts, skipped diff buckets (with reasons), and confirmation that **all subagents completed before cross-feature wiring**.

## How to use `apltk architecture`

**Authoritative command tree:** run **`apltk architecture --help`** (same output as `apltk architecture help`). Same families as `init-project-html`:

- `feature` / `submodule` — structural mutations (use **`set`** for label/role updates, **`remove`** when code deleted the entry point, **`add`** when the diff introduced a new module).
- `function` / `variable` / `dataflow` / `error` — per-sub-module rows. Declare new symbols **before** referencing them in `dataflow`. Use the row-level `remove` (see `--help`) to delete obsolete rows the diff dropped.
- `edge` — intra- or cross-feature seams. Prefer stable **`--id`** when re-applying the same edge after a mutation cycle. `kind` ∈ `call` | `return` | `data-row` | `failure`.
- `meta` / `actor` — only when the diff actually changed the macro narrative (e.g. summary now needs to record the diff scope or new omissions).
- `render` (when you batched with `--no-render`) → `validate` → done.

This skill **never** uses `--spec`. If the user wants overlay diagrams for a planning doc, redirect to **`spec-to-project-html`**.

## Workflow

**Chain-of-thought:** Answer **`Pause →`** before moving on. Validator red **MUST** block "done."

### 1) Read the current atlas (no source code yet)

- Open `resources/project-architecture/index.html` to confirm the atlas exists and renders. If it does not, redirect to **`init-project-html`** — this skill is for refreshes, not bootstraps.
- List `resources/project-architecture/atlas/atlas.index.yaml` and the per-feature YAMLs to learn the current feature set, sub-modules, and edge ids.
   - **Pause →** Do I actually have a base atlas to update? If not — stop and route to **`init-project-html`**.

### 2) Resolve diff scope

- Default: **uncommitted** (`git diff --stat`) + **staged** (`git diff --cached --stat`); show both. If the user pointed at a ref/range/commit, use that instead (`git diff --stat <base>..HEAD`, `git diff --stat HEAD~N`, `git show --stat <sha>`, etc.).
- Print the chosen diff scope as the literal command(s) you ran so the report is reproducible.
   - **Pause →** Is this the diff the user actually meant — or am I about to refresh the atlas against the wrong baseline?

### 3) Filter to code-affecting changes

- Drop pure docs/markdown/assets/lockfiles/generated/format-only diffs. Keep source files in language directories the project actually treats as code (open the project layout if uncertain).
- Group remaining files into **affected features** using the per-feature YAML’s declared paths plus folder/package heuristics. Record the path → feature mapping.
   - **Pause →** Did I drop a hunk that actually changes runtime behavior (e.g. a config file the runtime reads)? Re-include if so.
   - **Pause →** Are there changed files I cannot map to any existing feature — do they create a new feature, or do they extend an existing one? Decide explicitly before delegating.

### 4) Subagent fan-out — workers own features; orchestrator owns cross-feature seams **after** all workers finish

Dispatch one **write-capable** subagent per affected feature. Hand each subagent: its feature slug, the list of changed files in that feature, the diff scope command(s), the existing feature-module list (so it knows other features’ slugs for outbound edges), and **`apltk architecture --help`** as the flag reference.

> **Feature `<slug>` subagent contract**
> - Read the existing per-feature YAML and every changed file in this feature E2E (with `git diff` for the exact delta plus the post-change source for context).
> - For every behavior change in this feature, apply the matching CLI mutation: structural (`feature` / `submodule`), rows (`function`, `variable`, `dataflow`, `error`), and intra-feature **`edge`** add/set/remove/reorder.
> - Declare new functions / variables **before** referencing them from `dataflow`.
> - Run **`apltk architecture validate`** before returning.
> - **Return ONLY**: (i) sub-module change list (slug + change kind + one-line reason) and (ii) outbound boundary deltas (cross-feature edges to add/change/remove with endpoints + suggested kind/label). No source dumps.

**Orchestrator — after every subagent has completed:**

```bash
# only when meta.summary needs to record the diff scope or new omissions
apltk architecture meta set --summary "..." --no-render
# one edge mutation per cross-feature interaction reported by the subagents
apltk architecture edge add --from <featA>/<subA> --to <featB>/<subB> --kind call|return|data-row|failure --label "..." --no-render
apltk architecture edge remove --id <stable_id> --no-render
apltk architecture render
apltk architecture validate
```

The main agent **MUST NOT** re-declare a subagent’s intra-feature components, and **MUST NOT** open source files for any feature it delegated.
   - **Pause →** Did every subagent return — or am I about to wire cross-feature edges from partial summaries?

### 5) Handover report

Report: chosen diff scope (literal commands), affected features (count), per-feature mutation summary, cross-feature edge deltas (added / removed / changed), skipped diff buckets (with reasons), `validate` outcome, and the location of the rendered atlas (`resources/project-architecture/index.html`).

## Sample hints

- **Renamed function**: subagent removes the old `function` row, adds the new one, and updates every `dataflow` step that referenced it — do **not** silently leave the old row.
- **Deleted sub-module**: subagent uses `submodule remove` (see `--help`) and reports the outbound edges to drop; the orchestrator removes the cross-feature edges by stable `--id` after the gate.
- **New cross-feature data-row**: only one subagent will see the producing side and another only the consumer side — both subagents flag it as an outbound boundary; the orchestrator declares the single `data-row` edge **after** the gate.
- **Pure formatting diff**: skip entirely; record under "no diagram impact" in the report so future runs do not re-litigate the file.
- **PR refresh against `main`**: when the user asks to refresh the atlas to reflect "everything on this branch", use `git diff --stat $(git merge-base HEAD origin/main)..HEAD` and state the resolved base SHA in the report.

## References

- **`init-project-html/SKILL.md`** — semantic rulebook, two-layer rule, acceptance criteria, full subagent contract.
- **`init-project-html/references/TEMPLATE_SPEC.md`** — schema cheat sheet (fields/enums).
- **`spec-to-project-html/SKILL.md`** — overlay flow when work is still in spec form.
- **`apltk architecture --help`** — live CLI reference; trust this over any prose.
