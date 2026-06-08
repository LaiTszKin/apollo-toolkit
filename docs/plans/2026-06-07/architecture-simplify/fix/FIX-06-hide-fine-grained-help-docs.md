# Fix Worker Prompt: FIX-06-hide-fine-grained-help-docs

- **Related issue**: FIX-06 / REPORT P1-9 and P1-10

---

## 1. Mission & Rules

### Mission

Prevent agents from discovering hidden fine-grained architecture commands through help output or active docs.

### Context

Req 4 allows backward-compatible fine-grained execution but requires these verbs to be hidden from help and not discoverable by agents.

### Rules

- Do not remove backward-compatible command execution.
- Do not expose hidden command examples in active docs.
- Keep public docs centered on `add`, `remove`, `diff`, `merge`, `render`, and `open`.

---

## 2. Context

### Input Files

- `skills/init-project-html/lib/atlas/cli.js` — dispatch help branch.
- `skills/init-project-html/lib/atlas/cli-help.js` — action page routing and hidden verb guard.
- `skills/design/references/architecture.md` — active architecture CLI reference.
- `skills/update-project-html/SKILL.md` — active agent instruction and example.
- `test/architecture-script.test.js` — existing nested help test to update later by REGTEST workers.

### Root Cause

`dispatch()` passes hidden verbs and subverbs to `buildArchitectureHelpPage()` when `--help` is present. In `cli-help.js`, action-specific pages are returned before the hidden-verb guard. Active docs still list hidden command syntax.

---

## 3. Tasks

### `skills/init-project-html/lib/atlas/cli.js` / `cli-help.js` — hide action-level help

1. Ensure `apltk architecture edge add --help`, `feature add --help`, etc. return public top-level/unified help or a message pointing to `add`/`remove`.
2. Make the hidden-verb guard run before any action-specific page lookup.
3. Keep `apltk architecture add --help` and `remove --help` detailed and useful.

### `skills/design/references/architecture.md` — rewrite mutation reference

1. Replace old sections for `feature`, `submodule`, `function`, `variable`, `dataflow`, `error`, `edge`, `meta`, and `actor`.
2. Document only public unified commands:
   - `apltk architecture add feature <slug>`
   - `apltk architecture add module <slug> --part-of <feature>`
   - `apltk architecture add relation <endpoint> ...`
   - `apltk architecture remove feature|module|relation ...`
   - `validate`, `render`, `diff`, `merge`, `open`, support commands as appropriate.
3. Avoid hidden command examples.

### `skills/update-project-html/SKILL.md` — remove hidden example

1. Replace the `apltk architecture function add ...` example with a unified `add`/`remove` example or a non-command description.
2. Keep the instruction useful for updating the atlas without teaching hidden verbs.

### Output

Report:
- Files modified.
- Which help commands were manually checked.
- Whether docs scan found hidden examples.

---

## 4. Verification

1. Run: `node --test test/architecture-script.test.js`
   - Expected: tests pass after regression workers update old expectations.
2. Run: `rg "apltk architecture (feature|submodule|function|variable|dataflow|error|edge|meta|actor) (add|set|remove|reorder)" skills/design/references/architecture.md skills/update-project-html/SKILL.md`
   - Expected: no active hidden-command examples.

---

## 5. Scope & References

### Allowed Files

- `skills/init-project-html/lib/atlas/cli.js`
- `skills/init-project-html/lib/atlas/cli-help.js`
- `skills/design/references/architecture.md`
- `skills/update-project-html/SKILL.md`

### Forbidden Files

- `test/architecture-script.test.js` — REGTEST workers own test edits.
- `test/atlas-cli.test.js` — REGTEST workers own test edits.

### Related Documents

- `docs/plans/2026-06-07/architecture-simplify/SPEC.md`
- `docs/plans/2026-06-07/architecture-simplify/REPORT.md`
