---
name: init-project-html
description: >-
  Build the HTML architecture atlas. Macro `index.html` is ONE SVG showing feature-modules (clusters) AND every sub-module (nodes inside) together, with many-to-many edges, producer/consumer loops, and at least one cross-feature `m-edge--cross` data-row when applicable; macro MUST index every sub-module page in `atlas-submodule-index`. Each `features/<slug>/<sub-module>.html` describes ONLY itself: `sub-io` (function I/O) + `sub-vars` (variables-with-business-purpose) + `sub-dataflow` (internal flow) + `sub-errors`. Feature `index.html` stays lightweight (story + submodule-nav). Read strategy avoids context loss: list feature modules first; with subagents, dispatch one read-only subagent per feature and aggregate summaries before drawing; without subagents, read one feature, emit its pages, update macro incrementally, drop details, then move on — never read the whole codebase before writing. Distinctive typography; no purple-gradient/Inter defaults.
---

# Init Project HTML

## Dependencies

- Required: none (the template asset `references/architecture.css` ships with this skill and is copied at runtime).
- Conditional: `spec-to-project-html` when the same atlas needs spec-driven refresh — that skill obeys the rules below.
- Optional: `align-project-documents` when `docs/features` already names capabilities.
- Optional: local `frontend-design` skill for bolder, non-generic visual direction.
- Fallback: codebase too large for one pass → document scanned roots, explicit omissions, phased plan. **MUST NOT** pretend untread paths were verified.

## Non-negotiables

### Rule 1 — Cross-submodule interactions live only on the macro page

- **MUST** render `resources/project-architecture/index.html` as **one SVG figure** showing both layers together:
  - Layer A: **feature ↔ feature** user-visible journeys.
  - Layer B: **sub-module ↔ sub-module** concrete calls / returns / data-row hand-offs that realise Layer A.
- **MUST** draw each feature as an `m-cluster` (dashed frame); sub-modules are clickable nodes inside their cluster.
- **MUST** include at least one node-pair carrying **≥2 edges** (e.g. service → db with SELECT / INSERT / UPDATE) to prove multi-edge support.
- **MUST** include at least one **producer ↔ consumer** loop (call/return pair, or cyclic data-row).
- **MUST** use **`m-edge--cross`** dashed-heavy edges for cross-feature data-row hand-offs whenever the system has them.
- **MUST** include `<nav class="atlas-submodule-index">` linking every sub-module page in the atlas.

### Rule 2 — Sub-module pages describe **only themselves**

Each `features/<slug>/<sub-module>.html` contains exactly:

1. `sub-io` — function I/O table (signature + side-effect chip + one-line purpose).
2. `sub-vars` — **variables-with-business-purpose** table: every identifier this sub-module holds or threads between its functions (params, local state, struct fields, DB columns, config knobs, counters, time anchors) with type, scope chip (`sub-vars__scope--call|tx|persist|instance|loop`), and **business purpose** in business language (why it exists / which branch it decides / what breaks without it).
3. `sub-dataflow` — internal value flow between this sub-module's own functions (optional small SVG; **never** draw external sub-modules here).
4. `sub-errors` — errors this sub-module raises/returns (condition + meaning; HTTP mapping may be one line).

**Forbidden** on sub-module pages: "I call X / Y calls me" narrative, cross-boundary `flow-edge-manifest`, cross-boundary `flow-return-row`, or any structure describing inter-submodule choreography. If unavoidable, end with one sentence + link "see macro atlas for cross-boundary interactions".

### Rule 3 — Read order: never let the codebase wipe the context window

Real production codebases dwarf the main agent's context. Reading the whole repo before writing pushes early details out by the end, making macro edges and sub-module pages contradict each other. **MUST** follow one of these two strategies:

- **With subagents (preferred):** main agent first builds the **feature-module list** (slug + entry + boundary resources only), then dispatches **one read-only subagent per feature**. Each subagent deep-reads and returns ONLY a structured summary (sub-module list; per sub-module: function I/O, variables-with-business-purpose, internal flow steps, errors raised; outbound edges to other features). Main agent collects every summary and **only then** emits the macro SVG and all pages in one pass.
- **Without subagents:** process features **one at a time** — read feature A end-to-end, **immediately** emit `features/A/` (overview + every sub-module page) and incrementally add A's cluster, nodes, and known edges to the macro. Mark edges pointing at unread features with `data-edge-target-pending="<future-slug>"`. **Drop A's function-level details from working memory**, then read feature B. After every feature is written, resolve all pending placeholders in the macro. **Never** read everything before writing.

Both paths share one invariant: at any moment the main agent only holds *current-feature details + cross-feature boundary notes*.

### Rule 4 — Per-page section contracts

Each page type has a fixed required set of sections. Violating the contract is a Rule 1 or Rule 2 violation by definition.

**A) Macro `resources/project-architecture/index.html`** (the only page that draws interactions):

1. `<header class="atlas-header">` — title + generation timestamp.
2. `<section class="atlas-summary">` — prose explaining why feature modules and sub-modules sit in one diagram; cite a real producer+consumer / multi-edge case.
3. `<section class="atlas-legend">` — explains the four edge types: solid arrow = **call**, thin dashed = **return**, warm-tone heavy dashed = **data-row**, plus a note that multiple edges between the same node pair are allowed.
4. `<section class="flow-section flow-section--macro">` with **one** `<figure class="flow-chart flow-chart--macro flow-chart--svg">` honouring every MUST in Rule 1, plus a mirrored `<ol class="flow-edge-manifest flow-edge-manifest--macro">` (one row per edge, with `data-edge-id` + `data-edge-kind`).
5. `<nav class="atlas-submodule-index">` — links to every sub-module page across all features.
6. `<nav class="atlas-features">` (optional) — middle-tier nav to each feature index.

**B) Feature overview `features/<feature-slug>/index.html`** (intentionally lightweight; no cross-submodule flowchart):

1. `<nav class="breadcrumb">` (`../../index.html` → macro).
2. `<header>` — user-visible capability name.
3. `<section class="feature-story">` — 1–3 paragraphs of user story; close with one sentence + link back to the macro.
4. `<section class="submodule-nav">` — table of every sub-module page (link + one-line own responsibility).
5. Optional `<section class="feature-trace">` for spec-ID traceability.

**Forbidden on feature index**: `flow-chart--submodules`, `flow-chart--end-to-end`, `flow-edge-manifest`, or any other cross-submodule structure — those belong on the macro.

**C) Sub-module `features/<feature-slug>/<sub-module-slug>.html`** (self-only; matches Rule 2):

1. `<nav class="breadcrumb">`: `../../index.html` · `./index.html` · current sub-module.
2. `<header>` — sub-module name + **own** responsibility (one paragraph; no "who I talk to").
3. `<section class="sub-io">` — columns `function | signature (in / out) | side effects | purpose`; side-effect chips `pure` / `io` / `write` / `tx` / `lock` / `network` / …
4. `<section class="sub-vars">` — columns `variable | type | lifecycle / scope | business purpose`; cover **every** business-branch-affecting identifier; scope chip values listed in Rule 2; business purpose in business language (no bland "stores some value").
5. `<section class="sub-dataflow">` — numbered steps; optional small `<svg class="sub-dataflow__svg">` (nodes = internal variables/functions only; height ≤ 240, width ≤ 720).
6. `<section class="sub-errors">` — errors raised/returned (condition + meaning).
7. footer: one-sentence links back to `../../index.html` and `./index.html`.

If a sub-module truly holds no business-branch-affecting variables (rare; usually pure pass-through), `sub-vars` MUST still appear as a single-row table that says so with a one-line justification.

### Rule 5 — Naming, IDs, and shared assets

- **`feature-slug`**: kebab-case, matching the **user-language capability** (e.g. `invite-code-registration`).
- **`sub-module-slug`**: kebab-case, identifying the implementation boundary (e.g. `web-register-ui`, `public-api`, `registration-service`, `postgresql`).
- **`data-feature-id` / `data-submodule-id`**: optional node attributes; **MUST** match directory/file names.
- **`data-edge-id`**: stable id per macro edge (mirrored in the manifest row).
- **`data-edge-kind`**: one of `call` | `return` | `data-row` | `failure`.
- **Shared CSS**: on first run, copy `references/architecture.css` to `resources/project-architecture/assets/architecture.css`. Root `index.html` → `href="assets/architecture.css"`; everything under `features/<feature-slug>/` → `href="../../assets/architecture.css"`.

### Rule 6 — Accessibility and styling minima

- The macro SVG `<figure>` **MUST** carry an `aria-label` plus the mirrored `<ol class="flow-edge-manifest">` so screen-reader users get the full edge list without chasing pixels.
- Cluster and node links **MUST** wrap their `<g>` in `<a>` and provide readable `<text>` (browsers expose `<text>` as the accessible name).
- Sub-module `sub-io` and `sub-vars` tables **MUST** use semantic `<thead>` / `<tbody>`.
- Colour MUST NOT be the sole semantic carrier: edge differences encode via line style (solid / dashed / heavy-dashed) AND colour.
- Every diagram is static SVG — respect `prefers-reduced-motion` by not adding animation.
- Quality bar: high contrast, print-friendly, restrained palette; avoid the "AI-default purple gradient" and Inter look-alike. Pair a recognisable display face (e.g. `Fraunces`) with `Plus Jakarta Sans`. Edges use `currentColor` so light/dark adapt; pages stay readable across widths via SVG `viewBox`.

### Rule 7 — Other binding rules

- **MUST** read the entire production codebase along language boundaries; record skipped roots and the reason in `atlas-summary`.
- **MUST** anchor every user-visible capability to a concrete entry; **never** invent modules or integrations.
- **MUST** migrate legacy single-file `features/<slug>.html` or feature-level cross-submodule flowcharts to the new layering on first touch.

> Reference cheat sheets (DOM examples, the macro SVG class-hook table, vocabulary glossary) live in `references/TEMPLATE_SPEC.md`. That file is reference material only — every binding rule already lives here.

## Standards (summary)

- **Evidence**: every node and edge traces to a path/symbol/SQL/config.
- **Execution**: feature-module list (shallow) → branch by environment (subagent fan-out or sequential read-write) → pending-edge resolution + cross-link check.
- **Quality**: macro SVG carries at least one multi-edge case, one loop, and one cross-feature edge (when applicable); sub-module pages stay self-only; print-friendly contrast; zero `pending` edges remaining.
- **Output**: `resources/project-architecture/` tree obeying Rules 1–7 — anything else counts as a violation.

## Workflow

### 1) Whole-repo inventory — list feature modules, not function bodies

Scan the shipped source for **user-visible capabilities** (each one = one feature module): entry routes, CLI commands, UI pages, cron jobs, runners, event handlers, CDC streams. For each entry record only:

- kebab-case `slug` + one-line user story.
- **Boundary points**: entry symbol/file, outbound resources (DB tables, queue topics, external services, shared cache keys).
- Candidate cross-feature edges (mark as candidates; do not verify yet).

- **Pause →** Is the list actually complete? Note skipped roots with reason; no silent skips.
- **Pause →** Did I dive into function bodies here? Roll back — keep only structural notes.

### 2) Branch the deep-read by environment (Rule 3)

#### 2A) With subagents (preferred)

Dispatch one **read-only** subagent per feature. Require this summary template (no source-code excerpts):

> **Feature `<slug>` summary**
> - Sub-module list: one row per `<sub-module-slug>` (kind: ui / api / service / db / pure-fn / queue / external).
> - Per sub-module: function signatures (in / out / errors), side-effect chip, variables-with-business-purpose, internal flow steps, errors raised.
> - **Outbound boundaries**: which other features' sub-modules this one calls (call edges); which DB tables / topics / cache keys it touches that **another feature also reads or writes** (data-row / data-topic edges; mark direction).

Main agent collects every summary, does **not** re-read source, then emits in one pass:

1. Macro `index.html` (single SVG: clusters + multi-edge + call/return loop + cross-feature `m-edge--cross` + `atlas-submodule-index` + `flow-edge-manifest--macro`).
2. `features/<slug>/index.html` per feature (lightweight: user story + `submodule-nav`).
3. Per sub-module: self-only page with `sub-io` + `sub-vars` + `sub-dataflow` (small SVG if useful) + `sub-errors`.
4. Copy `references/architecture.css` to `resources/project-architecture/assets/`.

- **Pause →** Every cross-feature edge in the summaries has both source and target sub-module nodes actually drawn in the SVG? If not, add the node or split one out.

#### 2B) Without subagents — feature-by-feature read-write loop

Process the list from step 1 one feature at a time (topological hint: read-from data sources and pure helpers first, user-facing entries last). Per feature, run the full inner loop:

1. **Deep-read** every sub-module of this feature (functions, variables, errors, cross-feature edges).
2. **Write to disk immediately**:
   - `features/<slug>/index.html` (lightweight).
   - One page per sub-module (self-only: `sub-io` + `sub-vars` + `sub-dataflow` + `sub-errors`).
   - For `sub-vars`, sweep every identifier (params, local state, struct fields, DB columns, config, counters, `now`) — anything that influences a business branch or external promise **must** appear.
3. **Patch the macro `index.html` incrementally**: add this feature's cluster + sub-module nodes + intra-feature edges; mark edges pointing at unread features as `data-edge-target-pending="<future-slug>"` and note them in `figcaption`; mirror new edges in `flow-edge-manifest--macro`.
4. **Drop function-level details from working memory**; keep only lightweight notes (cluster id, pending-edge list); do not re-read this feature's bodies when handling the next one.
5. Return to step 1 for the next feature.

After the last feature, do a final pass:

- Resolve every pending placeholder in the macro (no `pending` residue allowed).
- Verify `atlas-submodule-index` lists every sub-module page.
- Confirm `architecture.css` is copied into `assets/`.

- **Pause →** Pending edges remaining after the last feature? Either step 1's list missed a feature or step 3 dropped an edge — re-read and patch. Silent deletion is forbidden.

### 3) Handover report

Report: feature count, macro edge counts (call/return/cross), sub-module page count, uncovered paths + reasons, the read strategy actually used (2A or 2B), and stable IDs to hand off to `spec-to-project-html`.

## Sample hints

- Multiple SQL paths on `service ↔ db` → draw **separate edges**; do not merge.
- Retry loops between `service ↔ generator(pure)` → call/return pair in the macro plus a `retry` side note; sub-module pages still describe only their own function I/O.
- Cross-feature DB hand-off (A writes, B reads) → macro uses `m-edge--cross`; sub-module pages each describe only their own INSERT / SELECT functions.
- Third-party systems → render as `m-sub--ext` (when extended) or cluster-external nodes; the trust boundary must be visible.
