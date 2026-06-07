# Regression Test Worker Prompt: REGTEST-01-integration

- **Related fixes**: FIX-01 through FIX-09 — All fixes in this round

---

## 1. Mission & Rules

### Mission

Write regression tests for all 8 behavioral fixes plus 4 test-coverage gaps (P3 items). All 13 tests go in `test/atlas-cli.test.js`. Each test must fail on the unfixed code and pass after the fixes are applied.

### Context

This covers FIX-01 through FIX-09 (P1 and P2 behavioral fixes) plus P3-10 through P3-13 (test coverage gaps from REPORT.md Round 2). All tests are integration tests that exercise `cli.dispatch()` with the `--project` flag, verifying YAML output, exit codes, and stdout/stderr content.

### Rules

- Only modify `test/atlas-cli.test.js` — never modify source code
- Follow existing test patterns: use `makeIo()`, `mkProject()`, `cli.dispatch()`, and `assert` from `node:assert/strict`
- Each test must fail on the unfixed code and pass after fixes are applied — this is the core oracle
- Append new tests at the end, after the existing `add auto-render without --no-render` test
- Workers are leaf nodes — do not spawn sub-workers

---

## 2. Context

### Input Files

- `test/atlas-cli.test.js` — Write tests here; existing add/remove tests (L917-1260) serve as format reference
- `skills/init-project-html/lib/atlas/cli.js` — The fixed code (read to understand changed behavior)
- `skills/init-project-html/lib/atlas/state.js` — State loading helpers

### Test Design Summary

| Test ID | Type | Scenario | Oracle |
|---|---|---|---|
| REGTEST-F01 | Integration | Add module with --implements, verify rendered edge | After add, atlas index YAML contains `implements` kind edge |
| REGTEST-F02 | Integration | Add module with --data-flow-to | Atlas index contains `data-row` edge |
| REGTEST-F03 | Integration | Batch --spec mode rollback on failure | Overlay dir is empty after failure |
| REGTEST-F04 | Integration | Feature --depends-on creates graph edge | Atlas index contains `dependency` edge |
| REGTEST-F05 | Integration | Duplicate feature output | stdout says "already exists" not "add applied" |
| REGTEST-F06 | Integration | Change summary with relation flags | stdout shows `depends-on:` in summary |
| REGTEST-F07 | Integration | Empty batch returns error | Exit non-zero, stderr mentions "No valid entities" |
| REGTEST-F08 | Integration | Pre-entity flags in batch mode | Dependency edge created when --depends-on is before first entity |
| REGTEST-F09 | Integration | Fine-grained verb --help hidden | `feature --help` shows default help, not fine-grained page |
| P3-10 | Integration | Remove module happy path | Exit 0, submodule removed from YAML |
| P3-11 | Integration | Remove relation happy path | Exit 0, edge removed from state |
| P3-12 | Integration | Auto-render after remove | HTML exists after remove without --no-render |
| P3-13 | Integration | Template verb integration | Exit non-zero, stderr suggests "add" |

---

## 3. Tasks

Add each test after the existing `add auto-render without --no-render` test (after the closing `})` bracket near line 1260). Start with a comment section marker:

```javascript
// ---- Round 2 regression tests (FIX-01 through FIX-09) ----------------------
```

### REGTEST-F01: Module add with --implements renders complete output (FIX-01)

```javascript
test('REGTEST-F01: module --implements renders edge in output (FIX-01)', async () => {
  const root = mkProject();
  try {
    const io = makeIo();
    await cli.dispatch(['add', 'feature', 'payment', '--project', root, '--no-render'], io);
    await cli.dispatch(['add', 'feature', 'gateway', '--project', root, '--no-render'], io);
    const code = await cli.dispatch(['add', 'module', 'stripe-adapter', '--part-of', 'payment', '--implements', 'gateway/svc', '--project', root, '--no-open'], io);
    assert.equal(code, 0);
    const indexYaml = fs.readFileSync(path.join(root, 'resources/project-architecture/atlas/atlas.index.yaml'), 'utf8');
    assert.match(indexYaml, /implements/);
    // Verify HTML was auto-rendered
    assert.ok(fs.existsSync(path.join(root, 'resources/project-architecture/index.html')));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
```

### REGTEST-F02: Module --data-flow-to creates data-row edge (FIX-02)

```javascript
test('REGTEST-F02: module --data-flow-to creates data-row edge (FIX-02)', async () => {
  const root = mkProject();
  try {
    const io = makeIo();
    await cli.dispatch(['add', 'feature', 'payment', '--project', root, '--no-render'], io);
    await cli.dispatch(['add', 'feature', 'ledger', '--project', root, '--no-render'], io);
    await cli.dispatch(['add', 'module', 'svc', '--part-of', 'ledger', '--project', root, '--no-render'], io);
    const code = await cli.dispatch(['add', 'module', 'payment-gateway', '--part-of', 'payment', '--data-flow-to', 'ledger/svc', '--project', root, '--no-render'], io);
    assert.equal(code, 0);
    const indexYaml = fs.readFileSync(path.join(root, 'resources/project-architecture/atlas/atlas.index.yaml'), 'utf8');
    assert.match(indexYaml, /data-row/);
    assert.match(indexYaml, /ledger/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
```

### REGTEST-F03: Batch --spec mode rollback on failure (FIX-03)

```javascript
test('REGTEST-F03: batch add in --spec mode rolls back on failure (FIX-03)', async () => {
  const root = mkProject();
  try {
    const io = makeIo();
    await cli.dispatch(['add', 'feature', 'existing', '--project', root, '--no-render'], io);
    const specDir = 'docs/plans/2026-06-07/spec-rollback-test';
    // Batch with a valid entity followed by an invalid one (module without --part-of)
    const code = await cli.dispatch(['add', 'feature', 'f1', 'module', 'm1', '--spec', specDir, '--project', root, '--no-render'], io);
    assert.notEqual(code, 0);
    // Verify overlay does NOT contain f1 (rollback happened)
    const overlayDir = path.join(root, specDir, 'architecture_diff', 'atlas');
    if (fs.existsSync(overlayDir)) {
      const overlayFiles = fs.readdirSync(overlayDir);
      assert.equal(overlayFiles.filter(f => f.endsWith('.yaml')).length, 0,
        'Overlay should be empty after rollback');
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
```

### REGTEST-F04: Feature --depends-on creates graph edge (FIX-04)

```javascript
test('REGTEST-F04: feature --depends-on creates dependency edge (FIX-04)', async () => {
  const root = mkProject();
  try {
    const io = makeIo();
    await cli.dispatch(['add', 'feature', 'order', '--project', root, '--no-render'], io);
    const code = await cli.dispatch(['add', 'feature', 'payment', '--depends-on', 'order', '--project', root, '--no-render'], io);
    assert.equal(code, 0);
    // Feature YAML should still have dependsOn field
    const featYaml = fs.readFileSync(path.join(root, 'resources/project-architecture/atlas/features/payment.yaml'), 'utf8');
    assert.match(featYaml, /dependsOn/);
    // Plus a dependency edge in the atlas index
    const indexYaml = fs.readFileSync(path.join(root, 'resources/project-architecture/atlas/atlas.index.yaml'), 'utf8');
    assert.match(indexYaml, /dependency/);
    assert.match(indexYaml, /order/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
```

### REGTEST-F05: Duplicate feature output corrected (FIX-05)

```javascript
test('REGTEST-F05: duplicate feature add shows "already exists" not "add applied" (FIX-05)', async () => {
  const root = mkProject();
  try {
    const io = makeIo();
    await cli.dispatch(['add', 'feature', 'payment', '--project', root, '--no-render'], io);
    const code = await cli.dispatch(['add', 'feature', 'payment', '--project', root, '--no-render'], io);
    assert.equal(code, 0);
    assert.match(io.stdout_text, /already exists/);
    assert.doesNotMatch(io.stdout_text, /add applied/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
```

### REGTEST-F06: Change summary includes relation details (FIX-06)

```javascript
test('REGTEST-F06: add module output includes relation flags in summary (FIX-06)', async () => {
  const root = mkProject();
  try {
    const io = makeIo();
    await cli.dispatch(['add', 'feature', 'payment', '--project', root, '--no-render'], io);
    await cli.dispatch(['add', 'feature', 'order', '--project', root, '--no-render'], io);
    const code = await cli.dispatch(['add', 'module', 'payment-api', '--part-of', 'payment', '--depends-on', 'order', '--project', root, '--no-render'], io);
    assert.equal(code, 0);
    assert.match(io.stdout_text, /depends-on/);
    assert.match(io.stdout_text, /payment-api/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
```

### REGTEST-F07: Empty batch returns error (FIX-07)

```javascript
test('REGTEST-F07: batch mode with no valid entities returns error (FIX-07)', async () => {
  const root = mkProject();
  try {
    const io = makeIo();
    const code = await cli.dispatch(['add', '--project', root, '--no-render'], io);
    assert.notEqual(code, 0);
    assert.match(io.stderr_text, /No valid entities/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
```

### REGTEST-F08: Pre-entity flags in batch mode (FIX-08)

```javascript
test('REGTEST-F08: --depends-on before first entity in batch creates dependency (FIX-08)', async () => {
  const root = mkProject();
  try {
    const io = makeIo();
    await cli.dispatch(['add', 'feature', 'order', '--project', root, '--no-render'], io);
    const code = await cli.dispatch(['add', '--depends-on', 'order', 'feature', 'payment', '--project', root, '--no-render'], io);
    assert.equal(code, 0);
    const indexYaml = fs.readFileSync(path.join(root, 'resources/project-architecture/atlas/atlas.index.yaml'), 'utf8');
    assert.match(indexYaml, /dependency/);
    assert.match(indexYaml, /order/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
```

### REGTEST-F09: Fine-grained verb --help hidden (FIX-09)

```javascript
test('REGTEST-F09: fine-grained verb --help shows default help (FIX-09)', async () => {
  const io = makeIo();
  const code = await cli.dispatch(['feature', '--help'], io);
  assert.equal(code, 0);
  assert.doesNotMatch(io.stdout_text, /feature add --slug/);
  assert.doesNotMatch(io.stdout_text, /manage feature modules/);
});
```

### P3-10: Remove module happy path via unified dispatch

```javascript
test('P3-10: remove module via unified dispatch (happy path)', async () => {
  const root = mkProject();
  try {
    const io = makeIo();
    await cli.dispatch(['add', 'feature', 'payment', '--project', root, '--no-render'], io);
    await cli.dispatch(['add', 'module', 'api', '--part-of', 'payment', '--project', root, '--no-render'], io);
    const code = await cli.dispatch(['remove', 'module', 'api', '--part-of', 'payment', '--project', root, '--no-render'], io);
    assert.equal(code, 0);
    const state = stateLib.load(path.join(root, 'resources/project-architecture/atlas'));
    const payment = state.features.find(f => f.slug === 'payment');
    assert.ok(payment, 'feature should still exist');
    assert.equal(payment.submodules.length, 0, 'submodule should be removed');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
```

### P3-11: Remove relation happy path via unified dispatch

```javascript
test('P3-11: remove relation via unified dispatch (happy path)', async () => {
  const root = mkProject();
  try {
    const io = makeIo();
    await cli.dispatch(['add', 'feature', 'a', '--project', root, '--no-render'], io);
    await cli.dispatch(['add', 'feature', 'b', '--project', root, '--no-render'], io);
    await cli.dispatch(['add', 'module', 'svc', '--part-of', 'a', '--project', root, '--no-render'], io);
    await cli.dispatch(['add', 'module', 'api', '--part-of', 'b', '--project', root, '--no-render'], io);
    await cli.dispatch(['add', 'relation', 'a/svc', '--data-flow-to', 'b/api', '--project', root, '--no-render'], io);
    const code = await cli.dispatch(['remove', 'relation', 'a/svc', '--to', 'b/api', '--project', root, '--no-render'], io);
    assert.equal(code, 0);
    const state = stateLib.load(path.join(root, 'resources/project-architecture/atlas'));
    const edge = (state.edges || []).find(e => e.from.feature === 'a' && e.to.feature === 'b');
    assert.equal(edge, undefined, 'edge should be removed');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
```

### P3-12: Auto-render after remove without --no-render

```javascript
test('P3-12: remove without --no-render triggers auto-render', async () => {
  const root = mkProject();
  try {
    const io = makeIo();
    await cli.dispatch(['add', 'feature', 'payment', '--project', root, '--no-render'], io);
    await cli.dispatch(['add', 'feature', 'test-x', '--project', root, '--no-render'], io);
    const code = await cli.dispatch(['remove', 'feature', 'test-x', '--project', root, '--no-open'], io);
    assert.equal(code, 0);
    assert.ok(fs.existsSync(path.join(root, 'resources/project-architecture/index.html')),
      'HTML should be rendered after remove');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
```

### P3-13: Template verb integration test

```javascript
test('P3-13: legacy template suggests add', async () => {
  const io = makeIo();
  const code = await cli.dispatch(['template', '/tmp/dummy.yaml'], io);
  assert.notEqual(code, 0);
  assert.match(io.stderr_text, /add/);
  assert.doesNotMatch(io.stderr_text, /Unknown verb/);
});
```

### Output

When done, report back to the coordinator:
- **Test file**: `test/atlas-cli.test.js`
- **Tests added**: 13 total (REGTEST-F01 through REGTEST-F09, P3-10 through P3-13)
- **Oracle confirmed**: List which tests were verified to fail before fix (or note if fix was already applied)
- **Risks or concerns**: [or "None"]

---

## 4. Verification

1. After fixes are applied, run:
   ```bash
   node --test test/atlas-cli.test.js
   ```
   - Expected: All tests pass (both old and new)

2. Run full test suite:
   ```bash
   npm test
   ```
   - Expected: All tests pass

3. For oracle verification (if the fix hasn't been applied yet):
   Run each test individually on the unfixed code:
   - REGTEST-F01: Should fail (implements edge not created)
   - REGTEST-F05: Should fail (duplicate shows "add applied")
   - REGTEST-F07: Should fail (empty batch silently succeeds)
   - REGTEST-F09: Should fail (fine-grained --help still shows old page)

---

## 5. Scope & References

### Allowed Files

- `test/atlas-cli.test.js` — write all regression tests here (append at end)

### Forbidden Files

- All source code files (`cli.js`, `cli-help.js`, `index.ts`, etc.) — never modify source code
- `packages/tools/architecture/*` — TS handler files
- `test/tools/*` — other test files

### Related Documents

- `docs/plans/2026-06-07/architecture-simplify/fix/FIX-01-cli-behavioral.md` — cli.js fixes
- `docs/plans/2026-06-07/architecture-simplify/fix/FIX-02-help-hidden.md` — cli-help.js fix
- `docs/plans/2026-06-07/architecture-simplify/REPORT.md` — Review findings
- `docs/plans/2026-06-07/architecture-simplify/SPEC.md` — Business requirements
