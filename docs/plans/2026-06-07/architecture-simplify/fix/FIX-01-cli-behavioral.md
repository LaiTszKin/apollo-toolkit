# Fix Worker Prompt: FIX-01-cli-behavioral

- **Related issues**: FIX-01 through FIX-08 — All behavioral fixes in `cli.js`

---

## 1. Mission & Rules

### Mission

Fix 8 behavioral issues in `skills/init-project-html/lib/atlas/cli.js`. These are P1 and P2 findings from REPORT.md Round 2.

### Context

All 8 fixes are in the same file (`cli.js`). Tasks are ordered so that earlier changes don't conflict with later ones. The fixes span render timing, missing `--data-flow-to` for module entities, batch correctness, feature `--depends-on` edges, output message quality, and batch error handling.

### Rules

- Only modify `cli.js` — never modify state.js, render.js, schema.js, or any test file
- Preserve existing test semantics — do not weaken, skip, or remove existing tests
- Each task builds on previous ones — apply them in order
- Workers are leaf nodes — do not spawn sub-workers

---

## 2. Context

### Input Files

- `skills/init-project-html/lib/atlas/cli.js` — all fixes in one file
- `test/atlas-cli.test.js` — read to understand existing test patterns (do not modify)

### Root Cause Summary

| Fix ID | Root Cause |
|---|---|
| FIX-01 | `processAddEntity` triggers auto-render inside sub-verb calls before all edges are created |
| FIX-02 | Missing `--data-flow-to` code path in module case of `processAddEntity` |
| FIX-03 | Batch rollback saves/restores base atlas but spec-mode mutations go to overlay |
| FIX-04 | Feature `--depends-on` stores YAML field only; no graph edge created. Module `--depends-on` doesn't handle comma-separated values |
| FIX-05 | `verbAdd` unconditionally prints success even when sub-verbs detect duplicates |
| FIX-06 | `verbAdd` outputs only minimal one-line message with no change summary |
| FIX-07 | Batch parser silently skips unrecognized tokens; empty entity list reports success |
| FIX-08 | `parseFlags` consumes entity flags before batch parsing; global copy misses entity-specific flags |

---

## 3. Tasks

### Task 1: FIX-01 — Suppress auto-render inside `processAddEntity`; add final render to `verbAdd`

**1a. Feature case (L660-668)**: Change `'no-render': entityFlags['no-render'],` to `'no-render': true,`

The feature case currently reads:
```javascript
case 'feature':
  return verbFeature('add', {
    slug: entityName,
    'depends-on': entityFlags['depends-on'],
    spec: entityFlags.spec,
    'no-render': entityFlags['no-render'],
    project: entityFlags.project,
    'dry-run': entityFlags['dry-run'],
    evidence: entityFlags.evidence,
  }, projectRoot, io);
```

Replace the `'no-render': entityFlags['no-render'],` with `'no-render': true,`.

**1b. Module case (L675)**: Replace `'no-render': entityFlags['no-render'],` with `'no-render': true,`.

**1c. Relation case (L739)**: Replace `'no-render': entityFlags['no-render'],` with `'no-render': true,`.

**1d. Single-entity mode (L868-870)**: Insert a final render call BEFORE the success message. The section currently reads:
```javascript
  await processAddEntity(type, name, flags);
  io.stdout.write(`atlas: add applied — ${type} "${name}"\n`);
  return 0;
```
Change to:
```javascript
  const addResult = await processAddEntity(type, name, flags);
  if (!flags['dry-run'] && !flags['no-render']) {
    await runRender({ projectRoot, flags });
  }
  io.stdout.write(`atlas: add applied — ${type} "${name}"\n`);
  return 0;
```

### Task 2: FIX-02 — Add `--data-flow-to` support for module entities

**After the `--depends-on` block (after L720 closing brace), before `return result;` (L722)**, insert a new block:

```javascript
        // Create data-flow edge if --data-flow-to specified
        const dataFlowTo = entityFlags['data-flow-to'];
        if (dataFlowTo) {
          await verbEdge('add', {
            from: `${entityFlags['part-of']}/${entityName}`,
            to: dataFlowTo,
            kind: 'data-row',
            spec: entityFlags.spec,
            'no-render': true,
            project: entityFlags.project,
            'dry-run': entityFlags['dry-run'],
          }, projectRoot, io);
        }
```

### Task 3: FIX-03 — Fix batch rollback for `--spec` mode

**3a. Skip undo snapshots during batch in `performMutation` (L249-257)**:

Find the spec-mode section:
```javascript
    const before = JSON.parse(JSON.stringify({ base, overlay }));
    stateLib.writeUndoSnapshot(overlayDir, before);
    mutate(merged, base, overlay);
    stateLib.saveOverlay(overlayDir, stateLib.deriveOverlay(base, merged));
    stateLib.appendHistory(overlayDir, { action, args, mode: 'spec' });
```

Change to:
```javascript
    const before = JSON.parse(JSON.stringify({ base, overlay }));
    if (!flags.skipUndo) stateLib.writeUndoSnapshot(overlayDir, before);
    mutate(merged, base, overlay);
    stateLib.saveOverlay(overlayDir, stateLib.deriveOverlay(base, merged));
    stateLib.appendHistory(overlayDir, { action, args, mode: 'spec' });
```

Find the non-spec section (L255-260):
```javascript
    const before = JSON.parse(JSON.stringify({ base }));
    stateLib.writeUndoSnapshot(baseAtlasDir(projectRoot), before);
    mutate(base, base, null);
    stateLib.save(baseAtlasDir(projectRoot), base);
    stateLib.appendHistory(baseAtlasDir(projectRoot), { action, args, mode: 'base' });
```

Change to:
```javascript
    const before = JSON.parse(JSON.stringify({ base }));
    if (!flags.skipUndo) stateLib.writeUndoSnapshot(baseAtlasDir(projectRoot), before);
    mutate(base, base, null);
    stateLib.save(baseAtlasDir(projectRoot), base);
    stateLib.appendHistory(baseAtlasDir(projectRoot), { action, args, mode: 'base' });
```

**3b. Fix interleaved-flags batch rollback (L821-831)**:

Replace the entire block with:
```javascript
      // All valid — process (with rollback on failure)
      let preBatchState, preBatchOverlayState;
      if (flags.spec) {
        const { overlayDir } = specOverlayDir(projectRoot, flags.spec);
        preBatchOverlayState = JSON.parse(JSON.stringify(stateLib.loadOverlay(overlayDir)));
      } else {
        preBatchState = stateLib.load(baseAtlasDir(projectRoot));
      }
      try {
        for (const entity of entities) {
          entity.flags.skipUndo = true;
          await processAddEntity(entity.type, entity.name, entity.flags);
        }
      } catch (e) {
        if (flags.spec) {
          const { overlayDir } = specOverlayDir(projectRoot, flags.spec);
          stateLib.saveOverlay(overlayDir, preBatchOverlayState);
        } else {
          stateLib.save(baseAtlasDir(projectRoot), preBatchState);
        }
        throw e;
      }
```

**3c. Fix simple-pairs batch rollback (L841-852)**:

Replace the block with:
```javascript
      let preBatchState, preBatchOverlayState;
      if (flags.spec) {
        const { overlayDir } = specOverlayDir(projectRoot, flags.spec);
        preBatchOverlayState = JSON.parse(JSON.stringify(stateLib.loadOverlay(overlayDir)));
      } else {
        preBatchState = stateLib.load(baseAtlasDir(projectRoot));
      }
      try {
        for (let i = 0; i < args.length; i += 2) {
          const entityType = args[i];
          const entityName = args[i + 1];
          if (!entityName) throw new Error(`Missing name for entity type: ${entityType}`);
          await processAddEntity(entityType, entityName, {...flags, skipUndo: true});
        }
      } catch (e) {
        if (flags.spec) {
          const { overlayDir } = specOverlayDir(projectRoot, flags.spec);
          stateLib.saveOverlay(overlayDir, preBatchOverlayState);
        } else {
          stateLib.save(baseAtlasDir(projectRoot), preBatchState);
        }
        throw e;
      }
```

### Task 4: FIX-04 — Feature `--depends-on` creates graph edge; handle comma-separated module `--depends-on`

**4a. In `processAddEntity` feature case**: Rewrite the feature case to add edge creation after the `verbFeature` call. Replace the entire feature case block (L659-668):

Replace:
```javascript
      case 'feature':
        return verbFeature('add', {
          slug: entityName,
          'depends-on': entityFlags['depends-on'],
          spec: entityFlags.spec,
          'no-render': true,
          project: entityFlags.project,
          'dry-run': entityFlags['dry-run'],
          evidence: entityFlags.evidence,
        }, projectRoot, io);
```

With:
```javascript
      case 'feature':
        {
          const featResult = await verbFeature('add', {
            slug: entityName,
            'depends-on': entityFlags['depends-on'],
            spec: entityFlags.spec,
            'no-render': true,
            project: entityFlags.project,
            'dry-run': entityFlags['dry-run'],
            evidence: entityFlags.evidence,
          }, projectRoot, io);

          // Create dependency edge if --depends-on specified
          const featDependsOn = entityFlags['depends-on'];
          if (featDependsOn) {
            await verbEdge('add', {
              from: entityName,
              to: featDependsOn,
              kind: 'dependency',
              spec: entityFlags.spec,
              'no-render': true,
              project: entityFlags.project,
              'dry-run': entityFlags['dry-run'],
            }, projectRoot, io);
          }

          return featResult;
        }
```

**4b. Handle comma-separated values in module `--depends-on` (L709-720)**: Replace the single-value with split+loop:

Replace:
```javascript
        // Create dependency edge if --depends-on specified
        const dependsOn = entityFlags['depends-on'];
        if (dependsOn) {
          await verbEdge('add', {
            from: `${entityFlags['part-of']}/${entityName}`,
            to: dependsOn,
            kind: 'dependency',
            spec: entityFlags.spec,
            'no-render': true,
            project: entityFlags.project,
            'dry-run': entityFlags['dry-run'],
          }, projectRoot, io);
        }
```

With:
```javascript
        // Create dependency edges if --depends-on specified
        const dependsOn = entityFlags['depends-on'];
        if (dependsOn) {
          const targets = String(dependsOn).split(',').map(s => s.trim()).filter(Boolean);
          for (const target of targets) {
            await verbEdge('add', {
              from: `${entityFlags['part-of']}/${entityName}`,
              to: target,
              kind: 'dependency',
              spec: entityFlags.spec,
              'no-render': true,
              project: entityFlags.project,
              'dry-run': entityFlags['dry-run'],
            }, projectRoot, io);
          }
        }
```

### Task 5: FIX-05 — Fix duplicate entity output contradictions

**5a. In `verbFeature` (L357-366)**: Move duplicate check BEFORE `performMutation` so the function returns `'skipped'` early. Replace:

```javascript
    const init = {};
    if (flags.title !== undefined) init.title = String(flags.title);
    if (flags.story !== undefined) init.story = String(flags.story);
    if (flags['depends-on'] !== undefined) init.dependsOn = splitList(flags['depends-on']);
    if (flags.evidence !== undefined) init.evidence = parseEvidence(flags.evidence);
    return performMutation(projectRoot, flags, `feature ${action}`, { slug, ...init }, (state) => {
      if (action === 'add') {
        const existing = findFeature(state, slug);
        if (existing) {
          io.stderr.write(`Info: Feature "${slug}" already exists — skipped (use "feature set" to modify).\n`);
          return;
        }
      }
      ensureFeature(state, slug, init);
    }, io);
```

With:
```javascript
    const init = {};
    if (flags.title !== undefined) init.title = String(flags.title);
    if (flags.story !== undefined) init.story = String(flags.story);
    if (flags['depends-on'] !== undefined) init.dependsOn = splitList(flags['depends-on']);
    if (flags.evidence !== undefined) init.evidence = parseEvidence(flags.evidence);
    // Check for duplicate before mutation
    if (action === 'add') {
      const currentState = stateLib.load(baseAtlasDir(projectRoot));
      if (findFeature(currentState, slug)) {
        return 'skipped';
      }
    }
    return performMutation(projectRoot, flags, `feature ${action}`, { slug, ...init }, (state) => {
      ensureFeature(state, slug, init);
    }, io);
```

**5b. In `verbSubmodule` (L383-402)**: Same pattern — move duplicate check BEFORE performMutation. Replace:

```javascript
    const init = {};
    if (flags.kind !== undefined) init.kind = String(flags.kind);
    if (flags.role !== undefined) init.role = String(flags.role);
    if (flags.evidence !== undefined) init.evidence = parseEvidence(flags.evidence);
    return performMutation(projectRoot, flags, `submodule ${action}`, { feature: featureSlug, slug, ...init }, (state) => {
      const feature = findFeature(state, featureSlug);
      if (!feature) {
        const available = (state.features || []).map(f => f.slug).join(', ');
        throw new Error(`Feature "${featureSlug}" not found. Available features: ${available || '(none)'}`);
      }
      if (action === 'add') {
        const existing = findSubmodule(feature, slug);
        if (existing) {
          io.stderr.write(`Info: Submodule "${slug}" already exists in feature "${featureSlug}" — skipped.\n`);
          return;
        }
      }
      ensureSubmodule(feature, slug, init);
    }, io);
```

With:
```javascript
    const init = {};
    if (flags.kind !== undefined) init.kind = String(flags.kind);
    if (flags.role !== undefined) init.role = String(flags.role);
    if (flags.evidence !== undefined) init.evidence = parseEvidence(flags.evidence);
    // Check for duplicate before mutation
    if (action === 'add') {
      const currentState = stateLib.load(baseAtlasDir(projectRoot));
      const feat = findFeature(currentState, featureSlug);
      if (feat && findSubmodule(feat, slug)) {
        return 'skipped';
      }
    }
    return performMutation(projectRoot, flags, `submodule ${action}`, { feature: featureSlug, slug, ...init }, (state) => {
      const feature = findFeature(state, featureSlug);
      if (!feature) {
        const available = (state.features || []).map(f => f.slug).join(', ');
        throw new Error(`Feature "${featureSlug}" not found. Available features: ${available || '(none)'}`);
      }
      ensureSubmodule(feature, slug, init);
    }, io);
```

**5c. In `verbAdd` single-entity mode (L868-870, after Task 1d changes)**: Conditionally print message based on result:

Change:
```javascript
  io.stdout.write(`atlas: add applied — ${type} "${name}"\n`);
```
To:
```javascript
  if (addResult === 'skipped') {
    io.stdout.write(`atlas: no change — ${type} "${name}" already exists\n`);
  } else {
    io.stdout.write(`atlas: add applied — ${type} "${name}"\n`);
  }
```

**5d. In `verbAdd` interleaved-flags batch mode (L825-836, after Task 3b changes)**: Track skipped entities in the loop:

Replace:
```javascript
      let preBatchState, preBatchOverlayState;
      ...
      try {
        for (const entity of entities) {
          entity.flags.skipUndo = true;
          await processAddEntity(entity.type, entity.name, entity.flags);
        }
      } catch (e) {
        ...
      }

      if (!flags['dry-run'] && !flags['no-render']) {
        await runRender({ projectRoot, flags });
      }
      io.stdout.write(`atlas: add applied — ${entities.length} entities\n`);
```

With:
```javascript
      let preBatchState, preBatchOverlayState;
      ...
      let skipped = 0;
      try {
        for (const entity of entities) {
          entity.flags.skipUndo = true;
          const result = await processAddEntity(entity.type, entity.name, entity.flags);
          if (result === 'skipped') skipped++;
        }
      } catch (e) {
        ...
      }

      if (!flags['dry-run'] && !flags['no-render']) {
        await runRender({ projectRoot, flags });
      }
      const applied = entities.length - skipped;
      if (skipped > 0) {
        io.stdout.write(`atlas: add applied — ${applied} entity(ies) added, ${skipped} skipped (already exist)\n`);
      } else {
        io.stdout.write(`atlas: add applied — ${applied} entities\n`);
      }
```

### Task 6: FIX-06 — Add change summary to `verbAdd` output

**6a. Single-entity mode success message (L869, after Task 5c)**: Enhance the success message to list what was created. Change:

```javascript
  if (addResult === 'skipped') {
    io.stdout.write(`atlas: no change — ${type} "${name}" already exists\n`);
  } else {
    io.stdout.write(`atlas: add applied — ${type} "${name}"\n`);
  }
```

To:
```javascript
  if (addResult === 'skipped') {
    io.stdout.write(`atlas: no change — ${type} "${name}" already exists\n`);
  } else {
    const addedFlags = [];
    if (type === 'module' && flags['part-of']) addedFlags.push(`part-of: ${flags['part-of']}`);
    if (flags['depends-on']) addedFlags.push(`depends-on: ${flags['depends-on']}`);
    if (flags['data-flow-to']) addedFlags.push(`data-flow-to: ${flags['data-flow-to']}`);
    if (flags.implements) addedFlags.push(`implements: ${flags.implements}`);
    if (flags['deployed-on']) addedFlags.push(`deployed-on: ${flags['deployed-on']}`);
    const summary = addedFlags.length > 0 ? ` (${addedFlags.join(', ')})` : '';
    io.stdout.write(`atlas: add applied — ${type} "${name}"${summary}\n`);
  }
```

**6b. Batch mode success message (after Task 5d)**: Similarly enhance. The variable `applied` and `skipped` are already computed. Replace:
```javascript
      if (skipped > 0) {
        io.stdout.write(`atlas: add applied — ${applied} entity(ies) added, ${skipped} skipped (already exist)\n`);
      } else {
        io.stdout.write(`atlas: add applied — ${applied} entities\n`);
      }
```

With:
```javascript
      if (skipped > 0) {
        io.stdout.write(`atlas: add applied — ${applied} entity(ies) added, ${skipped} skipped (already exist)\n`);
      } else if (applied > 0) {
        io.stdout.write(`atlas: add applied — ${applied} entities\n`);
      }
      if (entities.length > 0) {
        for (const e of entities) {
          io.stdout.write(`  ${e.type}: "${e.name}"\n`);
        }
      }
```

**6c. Simple-pairs batch mode (L856)**: The simple-pairs path uses shared flags object. Keep the existing message but add a list of entities processed. After the render call (L853-854) and before the success message:

```javascript
      if (!flags['dry-run'] && !flags['no-render']) {
        await runRender({ projectRoot, flags });
      }
      io.stdout.write(`atlas: add applied — batch\n`);
```

Change to (add entity listing):
```javascript
      if (!flags['dry-run'] && !flags['no-render']) {
        await runRender({ projectRoot, flags });
      }
      io.stdout.write(`atlas: add applied — ${args.length / 2} entities\n`);
      for (let i = 0; i < args.length; i += 2) {
        io.stdout.write(`  ${args[i]}: "${args[i + 1]}"\n`);
      }
```

### Task 7: FIX-07 — Empty entity list in batch mode returns error

**After the batch parser's while-loop closes (after L808) and before `// Pre-validation phase` (L810)**, add a validation check:

```javascript
      // Check for empty entity list
      if (entities.length === 0) {
        throw new Error('No valid entities found. Usage: apltk architecture add <feature|module|relation> <name> [--flags...]');
      }
```

Insert immediately before the `// Pre-validation phase` comment.

### Task 8: FIX-08 — Copy entity-specific flags from global flags in batch mode

**In the "copy global flags" section (L797-802)**, add entity-specific flags to the copy block:

Replace:
```javascript
          // Also copy global flags (project, spec are shared)
          if (flags.project !== undefined) entityFlags.project = flags.project;
          if (flags.spec !== undefined) entityFlags.spec = flags.spec;
          if (flags['no-render'] !== undefined) entityFlags['no-render'] = flags['no-render'];
          if (flags['dry-run'] !== undefined) entityFlags['dry-run'] = flags['dry-run'];
          if (flags.evidence !== undefined) entityFlags.evidence = flags.evidence;
```

With:
```javascript
          // Also copy global flags to entity flags
          if (flags.project !== undefined) entityFlags.project = flags.project;
          if (flags.spec !== undefined) entityFlags.spec = flags.spec;
          if (flags['no-render'] !== undefined) entityFlags['no-render'] = flags['no-render'];
          if (flags['dry-run'] !== undefined) entityFlags['dry-run'] = flags['dry-run'];
          if (flags.evidence !== undefined) entityFlags.evidence = flags.evidence;
          // Copy entity-specific flags that were parsed before the first entity type
          if (flags['depends-on'] !== undefined && entityFlags['depends-on'] === undefined) entityFlags['depends-on'] = flags['depends-on'];
          if (flags['part-of'] !== undefined && entityFlags['part-of'] === undefined) entityFlags['part-of'] = flags['part-of'];
          if (flags['data-flow-to'] !== undefined && entityFlags['data-flow-to'] === undefined) entityFlags['data-flow-to'] = flags['data-flow-to'];
          if (flags.implements !== undefined && entityFlags.implements === undefined) entityFlags.implements = flags.implements;
          if (flags['deployed-on'] !== undefined && entityFlags['deployed-on'] === undefined) entityFlags['deployed-on'] = flags['deployed-on'];
          if (flags.to !== undefined && entityFlags.to === undefined) entityFlags.to = flags.to;
```

### Output

When done, report back to the coordinator:
- **Files modified**: `skills/init-project-html/lib/atlas/cli.js`
- **Change summary**: Applied all 8 fixes (render timing, data-flow-to for module, batch spec-mode rollback, feature depends-on edges, duplicate output, change summary, empty batch error, pre-entity flags)
- **Test results**: [pass/fail after running tests]
- **Risks or concerns**: [or "None"]

---

## 4. Verification

1. Run: `node --test test/atlas-cli.test.js`
   - Expected: All tests pass
2. Run: `node --test packages/tools/architecture/index.test.ts`
   - Expected: All tests pass
3. Run: `node --test test/tools/architecture-error-types.test.js`
   - Expected: All tests pass
4. Run: `node --test test/architecture-script.test.js`
   - Expected: All tests pass

---

## 5. Scope & References

### Allowed Files

- `skills/init-project-html/lib/atlas/cli.js` — apply all 8 fixes here

### Forbidden Files

- `test/` — all test files (handled by regression test worker)
- `packages/tools/architecture/` — TS handler files (handled by FIX-02 worker)
- `skills/init-project-html/lib/atlas/cli-help.js` — help file (handled by FIX-02 worker)
- `skills/init-project-html/lib/atlas/state.js`, `render.js`, `schema.js` — state layer, not to be modified
- Any other file outside the scope

### Related Documents

- `docs/plans/2026-06-07/architecture-simplify/SPEC.md` — Business requirements
- `docs/plans/2026-06-07/architecture-simplify/DESIGN.md` — Technical design
- `docs/plans/2026-06-07/architecture-simplify/REPORT.md` — Review findings
