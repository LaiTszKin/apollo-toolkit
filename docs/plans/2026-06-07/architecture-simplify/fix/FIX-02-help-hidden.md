# Fix Worker Prompt: FIX-02-help-hidden

- **Related issues**: FIX-09 — Fine-grained verbs still discoverable via `--help`

---

## 1. Mission & Rules

### Mission

Hide fine-grained verb help pages (feature, submodule, function, variable, dataflow, error, edge, meta, actor) from the `--help` routing in `cli-help.js`. Per SPEC Requirement 4, these verbs "在 CLI help 中被隱藏" — agents probing `--help` should no longer discover the deprecated verbs.

### Context

The `familyPages` dictionary (L51-233) provides full help pages for all 9 fine-grained verbs. `buildArchitectureHelpPage()` routes `familyPages[verb]` at L790-792, making `apltk architecture feature --help` render a full usage page with old-style syntax. Top-level help is already correct (omits fine-grained verbs), but the individual `--help` routing exposes them.

### Rules

- Only modify `cli-help.js`
- Preserve existing test semantics
- Workers are leaf nodes — do not spawn sub-workers

---

## 2. Context

### Input Files

- `skills/init-project-html/lib/atlas/cli-help.js` — help page builder

### Root Cause

`buildArchitectureHelpPage()` at L790-792 routes to `familyPages[verb]` for any verb that has a family page, regardless of whether that verb is publicly documented. The `familyPages` dictionary contains entries for all 9 fine-grained verbs. Removing the routing line prevents discovery while keeping the pages defined (for potential internal use).

---

## 3. Tasks

### Task 1: Remove `familyPages` routing from `buildArchitectureHelpPage`

**Locate L790-792 in `skills/init-project-html/lib/atlas/cli-help.js`:**

```javascript
  if (familyPages[verb]) {
    return familyPages[verb];
  }
```

**Replace** with a check that returns the family page only for non-fine-grained verbs. The fine-grained verbs to exclude are: `feature`, `submodule`, `function`, `variable`, `dataflow`, `error`, `edge`, `meta`, `actor`.

Replace:
```javascript
  if (familyPages[verb]) {
    return familyPages[verb];
  }
```

With:
```javascript
  // Fine-grained verbs are hidden from --help per SPEC Requirement 4
  const hiddenVerbs = new Set(['feature', 'submodule', 'function', 'variable', 'dataflow', 'error', 'edge', 'meta', 'actor']);
  if (familyPages[verb] && !hiddenVerbs.has(verb)) {
    return familyPages[verb];
  }
```

### Output

When done, report back to the coordinator:
- **Files modified**: `skills/init-project-html/lib/atlas/cli-help.js`
- **Change summary**: `familyPages` routing now excludes 9 fine-grained verbs via a `hiddenVerbs` Set
- **Test results**: [pass/fail]
- **Risks or concerns**: [or "None"]

---

## 4. Verification

1. Run: `node --test test/architecture-script.test.js`
   - Expected: All tests pass
2. Run a manual check: Call `cli.dispatch(['feature', '--help'])` and verify it now shows the default help page (not the fine-grained help page)
3. Run: `node --test test/atlas-cli.test.js`
   - Expected: All tests pass

---

## 5. Scope & References

### Allowed Files

- `skills/init-project-html/lib/atlas/cli-help.js` — only file to modify

### Forbidden Files

- `skills/init-project-html/lib/atlas/cli.js` — handled by FIX-01 worker
- All test files — handled by regression test workers
- All other files

### Related Documents

- `docs/plans/2026-06-07/architecture-simplify/SPEC.md` — Requirement 4: "在 CLI help 中被隱藏"
- `docs/plans/2026-06-07/architecture-simplify/REPORT.md` — Finding P2-9
