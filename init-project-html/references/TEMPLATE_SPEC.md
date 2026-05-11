# HTML architecture atlas — reference cheat sheet

> Reference material only. The **binding rules** (page contracts, naming, assets, accessibility, forbidden shortcuts) live in `init-project-html/SKILL.md`. This file is a glossary + class-hook table + ready-to-copy DOM snippets so an agent does not have to re-derive the markup. `spec-to-project-html` reuses the same vocabulary when refreshing diagrams.

## Vocabulary

- **Feature module** — one **user-visible end-to-end capability** (e.g. "invite-code registration", "get-invite-codes"). One directory `features/<feature-slug>/`. It is **not** a single web layer or a single database.
- **Sub-module** — an implementation boundary inside that capability (front-end page, public API, domain service, PostgreSQL, pure helpers, message queues…). One HTML page per sub-module, sibling to the feature's `index.html`.

## Directory layout (target output)

```text
resources/project-architecture/
  index.html                           # macro: feature × sub-module in one SVG with multi-edge + data-row flow
  assets/
    architecture.css
  features/
    <feature-slug>/                    # one feature module = one directory
      index.html                       # lightweight overview (story + submodule nav)
      <sub-module-slug>.html           # one HTML per sub-module (own I/O + internal flow)
```

## Macro SVG — CSS class hooks

| Element | class |
|---|---|
| Actor block | `m-actor` |
| Feature cluster frame | `m-cluster` / `m-cluster__rect` / `m-cluster__title` |
| Sub-module node | `m-sub` (add `m-sub--db` for databases) |
| Edge | `m-edge` + modifier `m-edge--call` / `m-edge--return` / `m-edge--cross` |
| Edge label | `m-edge__label` (cross-feature labels add `m-edge__label--cross`) |

## DOM snippets

### `sub-io` function I/O table

```html
<section class="sub-io">
  <h2>Function I/O</h2>
  <table>
    <thead><tr><th>Function</th><th>Signature</th><th>Side effects</th><th>Purpose</th></tr></thead>
    <tbody>
      <tr>
        <td><code>FunctionName</code></td>
        <td class="sub-io__signature">
          <strong>in:</strong> <code>T1</code>, <code>T2</code><br>
          <strong>out:</strong> <code>R</code> | <code>ErrX</code>
        </td>
        <td><span class="sub-io__side sub-io__side--pure">pure</span></td>
        <td>One-line purpose.</td>
      </tr>
    </tbody>
  </table>
</section>
```

### `sub-vars` variables-with-business-purpose table

```html
<section class="sub-vars">
  <h2>Variables &amp; business purpose</h2>
  <p class="sub-vars__intro">Identifiers this sub-module holds or threads through. Types align readers; business purpose comes first.</p>
  <table>
    <thead>
      <tr><th>Variable</th><th>Type</th><th>Scope</th><th>Business purpose</th></tr>
    </thead>
    <tbody>
      <tr>
        <td class="sub-vars__name">someVar</td>
        <td class="sub-vars__type">SomeType</td>
        <td><span class="sub-vars__scope sub-vars__scope--call">call</span></td>
        <td>One line: this value decides branch X; without it Y breaks.</td>
      </tr>
    </tbody>
  </table>
</section>
```

Scope chip vocabulary: `sub-vars__scope--call` (single call), `--tx` (transaction-bound), `--persist` (persisted), `--instance` (fixed at construction; lifetime-shared), `--loop` (retry/loop).

### `sub-dataflow` small SVG sizing

- Node class: `d-node`; edge class: `d-edge` (side-effect edges use `d-edge--side`).
- Recommended viewBox: height ≤ 240, width ≤ 720.
- Nodes are this sub-module's internal variables/functions only.

## Edge-kind vocabulary (for macro `flow-edge-manifest`)

| `data-edge-kind` | meaning | typical visual |
|---|---|---|
| `call` | function call / HTTP request | solid arrow |
| `return` | return value / response | thin dashed arrow |
| `data-row` | cross-feature hand-off via data rows (not a function call) | warm-tone heavy dashed |
| `failure` | failure branch | red solid arrow with `failure` chip in the manifest row |

## Typography hint

Pair a recognisable display face (e.g. `Fraunces`) with `Plus Jakarta Sans`. Avoid the "AI-default purple gradient" and Inter look-alike. Detailed rules live in `init-project-html/SKILL.md` § Rule 6.
