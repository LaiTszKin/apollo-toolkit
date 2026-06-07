# Fix Worker Prompt: FIX-01-cli-fixes

- **Related issues**: P1-1, P1-2, P1-3, P1-4, P1-5, P2-6, P2-7, P2-8, P2-9, P2-11, P2-12 (all cli.js behavioral fixes)
- **Source REPORT**: `docs/plans/2026-06-07/architecture-simplify/REPORT.md`

---

## 1. Mission & Rules

### Mission

Fix 11 issues in `cli.js` that affect batch mode, module relation flags, remove error handling, user messaging, and edge semantics. All changes are confined to `cli.js`.

### Rules

- Follow the Scope in Section 5 — only modify files listed as Allowed
- Preserve existing test semantics — do not weaken, skip, or remove existing tests
- If the fix approach conflicts with the original spec design intent, pause and report to the coordinator
- Do not add new dependencies without reporting to the coordinator first
- Workers are leaf nodes — do not spawn sub-workers

---

## 2. Context

### Input Files

- `skills/init-project-html/lib/atlas/cli.js` — The target file for all fixes
- `test/atlas-cli.test.js` — Existing test patterns to understand (read-only)
- `docs/plans/2026-06-07/architecture-simplify/SPEC.md` — Business requirements

### Root Cause Summary

Eleven issues in `cli.js` fall into five categories:

**Category A: Batch mode flags + atomicity (FIX-01-1, FIX-01-11)**
- `parseFlags()` (L128-157) consumes all `--` flags into a single flat dictionary before `verbAdd()` sees the args. In batch mode, repeated flags are accumulated into arrays (L145-148), and every entity receives the merged array. Per-entity relation flag scoping is impossible with pre-parsed flat flags.
- Batch mode processes entities sequentially with no rollback on partial failure (L667-678).

**Category B: Module relation flags (FIX-01-2, FIX-01-3, FIX-01-9)**
- `processAddEntity` module case (L635-646) does not forward `--implements`, `--deployed-on`, or `--depends-on` to `verbSubmodule`.
- `verbSubmodule` (L369-389) has no relationship parameters and calls `ensureFeature()` which creates phantom parent for non-existent `--part-of` targets.

**Category C: Remove error handling (FIX-01-4, FIX-01-5)**
- `performMutation()` (L221-266) ignores the mutate callback's return value (removeFeature returns false on no-op).
- `dispatch()` (L1299-1302) uses `await verbRemove(); break;` with hardcoded success message — verb can't return non-zero exit code.
- `verbSubmodule('remove')` (L382-387) silently guards with `if (feature)`.
- `verbRemove()` (L683-722) does not forward `dry-run` to sub-verb calls.

**Category D: Messaging (FIX-01-6, FIX-01-7, FIX-01-12)**
- No change summary after `add` — only "atlas: add applied" (L1299-1300).
- `ensureFeature()`/`ensureSubmodule()` silently skip on duplicate entity — no "already exists" message.
- Legacy `apply`/`template` fall through to generic "Unknown verb" default (L1295-1298) without suggesting `add`.

**Category E: Edge type semantics (FIX-01-8)**
- Relation case `kind` defaults to `'call'` for both `--implements` and `--deployed-on` (L654), while `--data-flow-to` gets `'data-row'`.

---

## 3. Tasks

### Task 1: Per-entity flag parsing for batch mode (FIX-01-1, FIX-01-11)

**Problem**: `parseFlags()` crunches all `--` flags into one flat object before verbAdd. Batch mode iterates positional args in pairs `(type, name)` but flags are shared. Repeated flags accumulate into arrays.

**Fix approach**: In batch mode, pass raw interleaved args (with flags) to verbAdd and perform custom per-entity parsing. In single-entity mode, keep existing behavior unchanged.

#### Step 1a: Change dispatch to pass raw args for batch add

In `dispatch()` (L1234-1307), locate `case 'add':` and `case 'remove':`:

**Before** (around L1293):
```javascript
case 'add': await verbAdd(rest, flags, projectRoot, io); break;
case 'remove': await verbRemove(rest, flags, projectRoot, io); break;
```

**After**:
```javascript
case 'add': return await verbAdd(rest, flags, projectRoot, io);
case 'remove': return await verbRemove(rest, flags, projectRoot, io);
```

Change: Replace `await ...; break;` with `return await ...;` so the verb function CAN signal a non-zero exit code through its return value. Currently, the hardcoded `return 0` at L1302 always runs after the `break`.

#### Step 1b: Modify verbAdd for batch per-entity flag parsing

Replace `verbAdd` (L613-681) with a version that does custom parsing for batch mode. In batch mode (args.length > 2), iterate tokens and parse entity-type/name pairs while also collecting interleaved flags per entity.

The key change: In batch mode, reconstruct per-entity flag objects by scanning the original positional args for associated flags. The approach:

Since `verbAdd` now receives `rest` (positional args without flags), batch mode can't recover per-entity flags from flat positional args. Instead, change the calling convention: **when args.length > 2, re-interpret the original argv**. 

But verbAdd only receives `rest` (positionals without flags). To get raw args, modify **dispatch** to pass raw verb-relative args to verbAdd in batch mode:

In `dispatch()`, before `parseFlags` is called, save a copy of the verb-relative args:

```javascript
// In dispatch(), before parseFlags:
const rawArgs = [...args];  // Save copy before parseFlags mutates args

const { flags, positional: rest } = parseFlags(args);
// ...
case 'add':
  // Batch mode: pass raw interleaved args for per-entity parsing
  if (rest.length > 2) {
    return await verbAdd(rawArgs, flags, projectRoot, io);
  }
  return await verbAdd(rest, flags, projectRoot, io);
```

Now implement verbAdd's custom per-entity flag parsing for batch mode:

```javascript
async function verbAdd(args, flags, projectRoot, io) {
  // In batch mode (called with rawArgs), args contains interleaved --flags
  // In single-entity mode, args is positional only and flags are pre-parsed
  const isBatchMode = Array.isArray(args) && args.length > 2;
  
  if (isBatchMode && args.some(t => t.startsWith('--'))) {
    // Batch mode with raw interleaved args: parse entities and their flags
    const entities = [];
    let i = 0;
    while (i < args.length) {
      const token = args[i];
      if (token === 'feature' || token === 'module' || token === 'relation') {
        const entityType = token;
        i++;
        const entityName = args[i];
        if (!entityName || entityName.startsWith('--')) {
          throw new Error(`Missing name for entity type: ${entityType}`);
        }
        i++;
        
        const entityFlags = {};
        while (i < args.length && !['feature', 'module', 'relation'].includes(args[i])) {
          const t = args[i];
          if (t.startsWith('--')) {
            const eq = t.indexOf('=');
            let name, value;
            if (eq !== -1) {
              name = t.slice(2, eq);
              value = t.slice(eq + 1);
              i++;
            } else {
              name = t.slice(2);
              const isBool = BOOLEAN_FLAGS.has(name);
              const nextIsValue = i + 1 < args.length && !args[i + 1].startsWith('--') && !['feature', 'module', 'relation'].includes(args[i + 1]);
              if (isBool || !nextIsValue) {
                value = true;
                i++;
              } else {
                value = args[i + 1];
                i += 2;
              }
            }
            entityFlags[name] = value;
          } else if (t === '-h') {
            entityFlags.help = true;
            i++;
          } else {
            i++; // skip unexpected tokens
          }
        }
        
        // Also copy global flags (project, spec are shared)
        if (flags.project !== undefined) entityFlags.project = flags.project;
        if (flags.spec !== undefined) entityFlags.spec = flags.spec;
        if (flags['no-render'] !== undefined) entityFlags['no-render'] = flags['no-render'];
        if (flags['dry-run'] !== undefined) entityFlags['dry-run'] = flags['dry-run'];
        if (flags.evidence !== undefined) entityFlags.evidence = flags.evidence;
        
        entities.push({ type: entityType, name: entityName, flags: entityFlags });
      } else {
        i++;
      }
    }

    // Pre-validation phase: check all entities before processing any
    let error;
    for (const entity of entities) {
      try {
        validateEntity(entity);
      } catch (e) {
        error = e;
        break;
      }
    }
    if (error) throw error;

    // All valid — process
    for (const entity of entities) {
      await processAddEntity(entity.type, entity.name, entity.flags);
    }

    if (!flags['dry-run'] && !flags['no-render']) {
      await runRender({ projectRoot, flags });
    }
    return 0;
  }

  // Single-entity mode — existing behavior
  const type = isBatchMode ? null : args[0];
  const name = isBatchMode ? null : args[1];
  
  if (!type || !name) {
    throw new Error('Usage: apltk architecture add <feature|module|relation> <name> [entity-type entity-name ...]');
  }
  
  await processAddEntity(type, name, flags);
  return 0;
}

function validateEntity(entity) {
  if (!entity.type || !entity.name) throw new Error('Missing entity type or name');
  if (entity.type === 'module' && !entity.flags['part-of']) {
    throw new Error('Missing required flag --part-of for module');
  }
  if (entity.type === 'relation' && !entity.flags['data-flow-to'] && !entity.flags.implements && !entity.flags['deployed-on']) {
    throw new Error('Missing required flag --data-flow-to, --implements, or --deployed-on for relation');
  }
}
```

**Important**: Keep the existing `processAddEntity` helper function. It should still work with the per-entity flags object.

### Task 2: Add relation flags to module entity type (FIX-01-2)

**Problem**: `processAddEntity` module case (L635-646) only forwards `part-of`, `spec`, `no-render`, `project`, `dry-run`, `kind`, `evidence` to `verbSubmodule`. The flags `--implements` and `--deployed-on` are ignored.

**Fix**: In the module case of `processAddEntity`, check for `--implements` and `--deployed-on` and create edges when present.

Modify the module case (L635-646):

**After** the `verbSubmodule` call (or instead of just calling verbSubmodule), also call `verbEdge('add', ...)` when `--implements` or `--deployed-on` is present:

```javascript
case 'module': {
  if (!entityFlags['part-of']) throw new Error('Missing required flag --part-of for module');
  const result = await verbSubmodule('add', {
    feature: entityFlags['part-of'],
    slug: entityName,
    spec: entityFlags.spec,
    'no-render': entityFlags['no-render'],
    project: entityFlags.project,
    'dry-run': entityFlags['dry-run'],
    kind: entityFlags.kind,
    evidence: entityFlags.evidence,
  }, projectRoot, io);

  // Create implements/deployed-on edges if specified
  const implementsTarget = entityFlags.implements;
  const deployedOnTarget = entityFlags['deployed-on'];
  if (implementsTarget) {
    await verbEdge('add', {
      from: `${entityFlags['part-of']}/${entityName}`,
      to: implementsTarget,
      kind: 'implements',
      spec: entityFlags.spec,
      'no-render': true,   // suppress per-entity render
      project: entityFlags.project,
      'dry-run': entityFlags['dry-run'],
    }, projectRoot, io);
  }
  if (deployedOnTarget) {
    await verbEdge('add', {
      from: `${entityFlags['part-of']}/${entityName}`,
      to: deployedOnTarget,
      kind: 'deployed-on',
      spec: entityFlags.spec,
      'no-render': true,
      project: entityFlags.project,
      'dry-run': entityFlags['dry-run'],
    }, projectRoot, io);
  }

  return result;
}
```

### Task 3: Add --depends-on support for module entity type (FIX-01-3)

**Problem**: Module entity type doesn't forward `--depends-on` to `verbSubmodule`, and `verbSubmodule` doesn't accept dependency data.

**Note**: Submodules in the data model don't have a `dependsOn` field like features do. The `--depends-on` flag for modules should create a dependency edge rather than setting a field. This aligns with the spec's intent that relation flags create relationships.

**Fix**: In the module case of `processAddEntity`, when `--depends-on` is specified, create a relation edge with kind `'dependency'`.

Extend the module case to also handle `--depends-on`:

```javascript
// After the verbSubmodule call and implements/deployed-on handling:
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

### Task 4: Prevent phantom parent feature creation (FIX-01-9)

**Problem**: `verbSubmodule()` (L377-378) calls `ensureFeature(state, featureSlug)` which creates the feature if it doesn't exist, instead of throwing an error.

**Fix**: In `verbSubmodule`, check if the feature exists before using `ensureFeature`. If it doesn't exist, throw an error listing available features.

Modify `verbSubmodule` (around L377-385):

```javascript
return performMutation(projectRoot, flags, `submodule ${action}`, { feature: featureSlug, slug, ...init }, (state) => {
  const feature = findFeature(state, featureSlug);
  if (!feature) {
    const available = (state.features || []).map(f => f.slug).join(', ');
    throw new Error(`Feature "${featureSlug}" not found. Available features: ${available || '(none)'}`);
  }
  ensureSubmodule(feature, slug, init);
}, io);
```

### Task 5: Fix non-existent entity removal (FIX-01-4)

**Problem**: Three layers prevent correct error signaling on non-existent entity removal:
1. `performMutation()` ignores mutate callback return value
2. `dispatch()` uses `await verbRemove(); break;` — hardcoded `return 0`
3. `verbSubmodule('remove')` silently guards with `if (feature)`

**Fix**:

#### Step 5a: Make `performMutation` throw when mutation reports no-op

Change the mutation callback pattern: instead of returning a boolean from the callback, have the callback throw an error when the entity is not found. This is consistent with how other errors are handled (via thrown exceptions).

Modify `performMutation` (L221-266) or the calling patterns in verbFeature/verbSubmodule/verbEdge remove actions to detect no-op and throw.

In `verbFeature` remove action (L361-365):
```javascript
if (action === 'remove') {
  return performMutation(projectRoot, flags, 'feature remove', { slug }, (state) => {
    const removed = removeFeature(state, slug);
    if (!removed) {
      const available = (state.features || []).map(f => f.slug).join(', ');
      throw new Error(`Feature "${slug}" not found. Available features: ${available || '(none)'}`);
    }
  }, io);
}
```

In `verbSubmodule` remove action, change the silent `if (feature)` guard to throw:
```javascript
if (action === 'remove') {
  return performMutation(projectRoot, flags, 'submodule remove', { feature: featureSlug, slug }, (state) => {
    const feature = findFeature(state, featureSlug);
    if (!feature) {
      throw new Error(`Feature "${featureSlug}" not found for submodule removal`);
    }
    const removed = removeSubmodule(feature, slug);
    if (!removed) {
      const subs = (feature.submodules || []).map(s => s.slug).join(', ');
      throw new Error(`Submodule "${slug}" not found in feature "${featureSlug}". Available submodules: ${subs || '(none)'}`);
    }
  }, io);
}
```

In `verbEdge` remove action, add similar existence check. Look at how verbEdge handles remove (around L553-576) and add a check that the edge exists before filtering it.

#### Step 5b: The `await verbRemove(); break;` → `return await verbRemove();` change was already done in Step 1a.

#### Step 5c: Forward `--dry-run` to verbRemove (FIX-01-5)

**Fix**: In `verbRemove` (L683-722), add `'dry-run': flags['dry-run'],` to all three dispatch paths:

In feature case (L692-698), add `'dry-run': flags['dry-run'],`
In module case (L701-707), add `'dry-run': flags['dry-run'],`
In relation case (L710-717), add `'dry-run': flags['dry-run'],`

### Task 6: Add change summary after add (FIX-01-6)

**Problem**: After `add`, the only output is `atlas: add applied` (L1299-1300). No information about what was created.

**Fix**: Since we changed the dispatch to `return await verbAdd(...);` (Task 1a), the success message at L1299-1300 will still fire for non-returning verbs. For `add`, move the success message logic into `verbAdd` itself so it can include a summary.

In `verbAdd`, after successful processing, write a detailed message:
```javascript
// At end of verbAdd, before return 0:
const entityCountMessage = isBatchMode
  ? `${entities.length} entities`
  : `${type} "${name}"`;
io.stdout.write(`atlas: add applied — ${entityCountMessage}\n`);
```

For the `processAddEntity` helper, it already calls performMutation which writes undo snapshots. The summary should describe what was done.

**Note**: Since the dispatch now does `return await verbAdd(...);`, the generic "atlas: add applied" at L1299 won't be reached for add. That's fine — verbAdd will produce its own detailed message. For other verbs, the generic message at L1299 still applies.

### Task 7: Warn on duplicate entity add (FIX-01-7)

**Problem**: `ensureFeature()` and `ensureSubmodule()` silently return existing entity when attempting to add a duplicate. No "already exists" message.

**Fix**: Modify `ensureFeature` and `ensureSubmodule` to use a shared warning emitter via `io.stderr`:

Unfortunately, these helpers don't have access to `io`. Alternative: move the duplicate check into `processAddEntity` (which does have access via closure) or the calling functions.

**Simpler approach**: In `verbFeature('add')` and `verbSubmodule('add')` mutation callbacks, check for existence before calling ensure*:

In verbFeature add (L357-359):
```javascript
return performMutation(projectRoot, flags, `feature ${action}`, { slug, ...init }, (state) => {
  const existing = findFeature(state, slug);
  if (existing) {
    io.stderr.write(`Warning: Feature "${slug}" already exists — skipping addition.\n`);
    return;
  }
  ensureFeature(state, slug, init);
}, io);
```

Wait, but this would skip mutation entirely. The existing behavior is that `ensureFeature` updates the existing feature with new init data (L291-292: `else if (init) { Object.assign(feature, init); }`). So if you call `add feature X --title "New Title"` and X already exists, the title gets updated.

The spec says: "Entity 重複新增: add 一個已存在的 entity，系統提示「已存在」並跳過，不視為錯誤" — add a duplicate, system says "already exists" and skips, not considered an error.

So the fix is:
1. If entity exists, write a warning to stderr (not an error, not blocking)
2. Don't overwrite existing data with `init`

Modify `verbFeature('add')` mutation callback:
```javascript
(state) => {
  const existing = findFeature(state, slug);
  if (existing) {
    io.stderr.write(`Info: Feature "${slug}" already exists — skipped (use "feature set" to modify).\n`);
    return;
  }
  ensureFeature(state, slug, init);
}
```

Similarly for `verbSubmodule('add')`:
```javascript
(state) => {
  const feature = ensureFeature(state, featureSlug);
  const existing = findSubmodule(feature, slug);
  if (existing) {
    io.stderr.write(`Info: Submodule "${slug}" already exists in feature "${featureSlug}" — skipped.\n`);
    return;
  }
  ensureSubmodule(feature, slug, init);
}
```

### Task 8: Fix edge kind for --implements and --deployed-on (FIX-01-8)

**Problem**: In the relation case (L648-655), `kind` is `'data-row'` for `--data-flow-to` and `'call'` for everything else. `--implements` and `--deployed-on` should get distinct kinds.

**Fix**: Change the `kind` logic:

```javascript
case 'relation': {
  const dataFlowTo = entityFlags['data-flow-to'];
  const implementsTarget = entityFlags.implements;
  const deployedOn = entityFlags['deployed-on'];
  const to = dataFlowTo || implementsTarget || deployedOn;
  if (!to) throw new Error('Missing required flag --data-flow-to, --implements, or --deployed-on for relation');
  let kind = 'call';
  if (dataFlowTo) kind = 'data-row';
  else if (implementsTarget) kind = 'implements';
  else if (deployedOn) kind = 'deployed-on';
  return verbEdge('add', {
    from: entityName,
    to,
    kind,
    spec: entityFlags.spec,
    'no-render': entityFlags['no-render'],
    project: entityFlags.project,
    'dry-run': entityFlags['dry-run'],
    id: entityFlags.id,
  }, projectRoot, io);
}
```

### Task 9: Legacy verb error message suggests add (FIX-01-12)

**Problem**: `apply`/`template` fall through to the `default` case (L1295) which prints "Unknown verb: apply" without suggesting the replacement.

**Fix**: After the switch statement (before the fallback `default` case), add specific checks for `apply` and `template`:

In dispatch(), around L1295:
```javascript
// Before the switch, or as specific checks after it:
if (verb === 'apply' || verb === 'template') {
  io.stderr.write(`"${verb}" is no longer available. Use "apltk architecture add" instead.\n`);
  return 1;
}
```

Better yet, add these checks BEFORE the switch statement so they have their own specific error messages:

```javascript
// Early in dispatch, after resolving projectRoot and before the try/catch:
if (verb === 'apply' || verb === 'template') {
  io.stderr.write(`Error: "${verb}" has been removed. Use "apltk architecture add <feature|module|relation>" instead.\n`);
  return 1;
}
```

This should be placed after `projectRoot` resolution (around L1263-1269) and before the `try { switch(verb) {` at L1271.

### Task 10: Remove success message improvement (FIX-01-6 continuation)

The dispatch success message at L1299-1300 currently shows:
```javascript
if (!flags['dry-run']) {
  io.stdout.write(`atlas: ${verb}${subverb ? ` ${subverb}` : ''} applied\n`);
}
```

For `add` which now has its own return path (return await verbAdd), this line won't execute. For `remove` which also now returns, we should add a similar message in verbRemove.

Add at the end of `verbRemove()`:
```javascript
io.stdout.write(`atlas: remove applied — ${type} "${name}"\n`);
return 0;
```

Wait, but `verbRemove` returns the result of verbFeature/verbSubmodule/verbEdge, which returns the result of performMutation, which returns `undefined` (no return value). Let me check...

Looking at `performMutation` (L221-266), it doesn't return anything explicitly — it just does the work. And `verbFeature('remove', ...)` returns `performMutation(...)` which returns `undefined`.

So `verbRemove` needs to independently write its success message and return 0 after the mutation succeeds.

**Fix verbRemove**:
```javascript
case 'feature':
  await verbFeature('remove', {
    slug: name,
    spec: flags.spec,
    'no-render': flags['no-render'],
    project: flags.project,
    'dry-run': flags['dry-run'],
  }, projectRoot, io);
  if (!flags['dry-run']) {
    io.stdout.write(`atlas: remove applied — feature "${name}"\n`);
  }
  return 0;
```

Similarly for module and relation cases.

### Output

When done, report back to the coordinator:
- **Files modified**: `skills/init-project-html/lib/atlas/cli.js`
- **Change summary**: List which tasks were completed (1-10)
- **Test results**: `node --test test/atlas-cli.test.js` — all existing tests pass
- **Risks or concerns**: [or "None"]

---

## 4. Verification

1. Run: `node --test test/atlas-cli.test.js`
   - Expected: All existing tests pass (no regressions from cli.js changes)

2. Run: `node --test packages/tools/architecture/index.test.ts`
   - Expected: All TS handler tests pass

3. Run: `node --test test/tools/architecture-error-types.test.js`
   - Expected: All error path tests pass

4. Manual check: The `--dry-run` flag should now work with `remove`

---

## 5. Scope & References

### Allowed Files

- `skills/init-project-html/lib/atlas/cli.js` — All behavioral fixes

### Forbidden Files

- `skills/init-project-html/lib/atlas/cli-help.js` — handled by FIX-02 worker
- `packages/tools/architecture/index.ts` — handled by FIX-02 worker
- All test files (`test/*`, `packages/tools/architecture/*.test.ts`) — handled by REGTEST workers
- All documents under `docs/plans/` — not to be modified by fix workers

### Related Documents

- `docs/plans/2026-06-07/architecture-simplify/SPEC.md` — Business requirements
- `docs/plans/2026-06-07/architecture-simplify/DESIGN.md` — Technical design
- `docs/plans/2026-06-07/architecture-simplify/REPORT.md` — Review findings
