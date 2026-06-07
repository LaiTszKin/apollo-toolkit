# Regression Test Worker Prompt: REGTEST-01-integration

- **Related fix**: FIX-01 — all cli.js behavioral fixes
- **Source REPORT**: `docs/plans/2026-06-07/architecture-simplify/REPORT.md`

---

## 1. Mission & Rules

### Mission

Write integration tests in `atlas-cli.test.js` covering batch mode, module relation flags, remove error handling, duplicate entity detection, edge kind correctness, and help text accuracy.

### Context

FIX-01 modifies `cli.js` to fix 11 issues across batch mode parsing, module relation flags, remove error handling, user messaging, and edge semantics. These tests verify the fixes work correctly and serve as regression guards.

### Rules

- Only create or modify test files — never modify source code
- The test must fail on the unfixed code and pass after the fix is applied — this is the core oracle
- Follow the existing test patterns and style in `atlas-cli.test.js` (CommonJS, `node:test`, `node:assert/strict`, `makeIo()`, `mkProject()`)
- Append new tests at the end of the file, after the existing `// ---- add/remove verb tests ----` section
- Workers are leaf nodes — do not spawn sub-workers

---

## 2. Context

### Input Files

- `test/atlas-cli.test.js` — Write tests here; follow existing patterns (L917-1035 add/remove tests for reference)
- `skills/init-project-html/lib/atlas/cli.js` — The fixed code (read to understand what changed)

### Test Design Reference

Existing test patterns in `atlas-cli.test.js`:
- Use `makeIo()` for IO capture
- Use `mkProject()` for temp project directory
- Use `cli.dispatch([...], io)` syntax
- Check exit code with `assert.equal(code, N)`
- Check YAML file contents with `fs.readFileSync` + `assert.match`
- Use `try/finally` with `fs.rmSync(root, { recursive: true, force: true })` for cleanup

---

## 3. Tasks

Write the following tests in `test/atlas-cli.test.js`. Add them after the existing `// ---- add/remove verb tests ----` section (after line 1035). Each test should have its own `test()` call with a descriptive name.

### Test 1: Batch mode with different entity types and per-entity flags (FIX-01-1)

```javascript
test('add batch mode with mixed entity types and per-entity flags', async () => {
  const root = mkProject();
  try {
    const io = makeIo();
    // Create base features first
    let code = await cli.dispatch(['add', 'feature', 'order', '--project', root, '--no-render'], io);
    assert.equal(code, 0);
    
    // Batch: feature with --depends-on, then module with --part-of
    code = await cli.dispatch([
      'add', 'feature', 'payment', '--depends-on', 'order',
      'module', 'payment-api', '--part-of', 'payment',
      '--project', root, '--no-render',
    ], io);
    assert.equal(code, 0);
    
    // Verify: payment feature depends on order
    const paymentYaml = fs.readFileSync(path.join(root, 'resources/project-architecture/atlas/features/payment.yaml'), 'utf8');
    assert.match(paymentYaml, /dependsOn/);
    assert.match(paymentYaml, /order/);
    
    // Verify: payment-api is a submodule of payment
    const featureYaml = fs.readFileSync(path.join(root, 'resources/project-architecture/atlas/features/payment.yaml'), 'utf8');
    assert.match(featureYaml, /slug: payment-api/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
```

**Oracle**: This test must fail before FIX-01 because shared flags would cause `payment` feature to not get its `--depends-on order` correctly (cross-contamination with batch flags). After FIX-01, per-entity flags are correctly scoped.

### Test 2: Add module with --implements creates edge (FIX-01-2)

```javascript
test('add module --implements creates implements edge', async () => {
  const root = mkProject();
  try {
    const io = makeIo();
    await cli.dispatch(['add', 'feature', 'payment', '--project', root, '--no-render'], io);
    await cli.dispatch(['add', 'feature', 'gateway', '--project', root, '--no-render'], io);
    
    const code = await cli.dispatch([
      'add', 'module', 'stripe-adapter', '--part-of', 'payment',
      '--implements', 'gateway/svc',
      '--project', root, '--no-render',
    ], io);
    assert.equal(code, 0);
    
    // Verify edge exists with kind 'implements' in atlas index
    const indexYaml = fs.readFileSync(path.join(root, 'resources/project-architecture/atlas/atlas.index.yaml'), 'utf8');
    assert.match(indexYaml, /implements/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
```

**Oracle**: Must fail before FIX-01 because `processAddEntity` module case does not forward `--implements`. After FIX-01, the edge is created with kind `implements`.

### Test 3: Add module with --deployed-on creates edge (FIX-01-2)

```javascript
test('add module --deployed-on creates deployment edge', async () => {
  const root = mkProject();
  try {
    const io = makeIo();
    await cli.dispatch(['add', 'feature', 'payment', '--project', root, '--no-render'], io);
    
    const code = await cli.dispatch([
      'add', 'module', 'payment-api', '--part-of', 'payment',
      '--deployed-on', 'eks-cluster',
      '--project', root, '--no-render',
    ], io);
    assert.equal(code, 0);
    
    const indexYaml = fs.readFileSync(path.join(root, 'resources/project-architecture/atlas/atlas.index.yaml'), 'utf8');
    assert.match(indexYaml, /deployed-on/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
```

### Test 4: Add module with --depends-on creates edge (FIX-01-3)

```javascript
test('add module --depends-on creates dependency edge', async () => {
  const root = mkProject();
  try {
    const io = makeIo();
    await cli.dispatch(['add', 'feature', 'payment', '--project', root, '--no-render'], io);
    await cli.dispatch(['add', 'feature', 'billing', '--project', root, '--no-render'], io);
    await cli.dispatch(['add', 'module', 'svc', '--part-of', 'billing', '--project', root, '--no-render'], io);
    
    const code = await cli.dispatch([
      'add', 'module', 'payment-api', '--part-of', 'payment',
      '--depends-on', 'billing/svc',
      '--project', root, '--no-render',
    ], io);
    assert.equal(code, 0);
    
    const indexYaml = fs.readFileSync(path.join(root, 'resources/project-architecture/atlas/atlas.index.yaml'), 'utf8');
    assert.match(indexYaml, /dependency/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
```

### Test 5: Remove non-existent feature returns non-zero exit code (FIX-01-4)

```javascript
test('remove non-existent feature returns error with similar names', async () => {
  const root = mkProject();
  try {
    const io = makeIo();
    await cli.dispatch(['add', 'feature', 'payment', '--project', root, '--no-render'], io);
    await cli.dispatch(['add', 'feature', 'billing', '--project', root, '--no-render'], io);
    
    const code = await cli.dispatch(['remove', 'feature', 'paymint', '--project', root, '--no-render'], io);
    assert.notEqual(code, 0);
    // Should mention the similar names (payment, billing)
    assert.match(io.stderr_text, /paymint/);
    assert.match(io.stderr_text, /payment/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
```

**Oracle**: Must fail before FIX-01 (returns 0 with no error). Must pass after FIX-01 (returns non-zero with error listing similar names).

### Test 6: Remove non-existent module returns error (FIX-01-4)

```javascript
test('remove non-existent module returns error', async () => {
  const root = mkProject();
  try {
    const io = makeIo();
    await cli.dispatch(['add', 'feature', 'payment', '--project', root, '--no-render'], io);
    await cli.dispatch(['add', 'module', 'api', '--part-of', 'payment', '--project', root, '--no-render'], io);
    
    const code = await cli.dispatch(['remove', 'module', 'apix', '--part-of', 'payment', '--project', root, '--no-render'], io);
    assert.notEqual(code, 0);
    assert.match(io.stderr_text, /apix/);
    assert.match(io.stderr_text, /api/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
```

### Test 7: Remove with --dry-run doesn't mutate state (FIX-01-5)

```javascript
test('remove --dry-run does not mutate state', async () => {
  const root = mkProject();
  try {
    const io = makeIo();
    await cli.dispatch(['add', 'feature', 'payment', '--project', root, '--no-render'], io);
    
    const stateBefore = stateLib.load(path.join(root, 'resources/project-architecture/atlas'));
    assert.equal(stateBefore.features.length, 1);
    
    const code = await cli.dispatch(['remove', 'feature', 'payment', '--project', root, '--no-render', '--dry-run'], io);
    assert.equal(code, 0);
    
    const stateAfter = stateLib.load(path.join(root, 'resources/project-architecture/atlas'));
    assert.equal(stateAfter.features.length, 1, 'feature should still exist after dry-run remove');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
```

**Oracle**: Must fail before FIX-01 (--dry-run is silently ignored, feature is actually removed). Must pass after FIX-01 (--dry-run is forwarded, feature remains).

### Test 8: Add module with non-existent --part-of returns error (FIX-01-9)

```javascript
test('add module --part-of non-existent feature returns error with available features', async () => {
  const root = mkProject();
  try {
    const io = makeIo();
    await cli.dispatch(['add', 'feature', 'payment', '--project', root, '--no-render'], io);
    await cli.dispatch(['add', 'feature', 'billing', '--project', root, '--no-render'], io);
    
    const code = await cli.dispatch(['add', 'module', 'orphan', '--part-of', 'nonexistent', '--project', root, '--no-render'], io);
    assert.notEqual(code, 0);
    assert.match(io.stderr_text, /nonexistent/);
    assert.match(io.stderr_text, /payment/);
    assert.match(io.stderr_text, /billing/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
```

**Oracle**: Must fail before FIX-01 (phantom feature "nonexistent" is silently created). Must pass after FIX-01 (error thrown listing available features).

### Test 9: Duplicate feature add warns (FIX-01-7)

```javascript
test('add duplicate feature warns and skips', async () => {
  const root = mkProject();
  try {
    const io = makeIo();
    await cli.dispatch(['add', 'feature', 'payment', '--project', root, '--no-render'], io);
    const code = await cli.dispatch(['add', 'feature', 'payment', '--project', root, '--no-render'], io);
    assert.equal(code, 0);
    assert.match(io.stderr_text, /already exists/i);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
```

### Test 10: Relation --implements and --deployed-on produce correct edge kind (FIX-01-8)

```javascript
test('relation --implements produces implements edge kind', async () => {
  const root = mkProject();
  try {
    const io = makeIo();
    await cli.dispatch(['add', 'feature', 'a', '--project', root, '--no-render'], io);
    await cli.dispatch(['add', 'module', 'svc', '--part-of', 'a', '--project', root, '--no-render'], io);
    await cli.dispatch(['add', 'feature', 'b', '--project', root, '--no-render'], io);
    
    await cli.dispatch(['add', 'relation', 'a/svc', '--implements', 'b/svc', '--project', root, '--no-render'], io);
    
    const state = stateLib.load(path.join(root, 'resources/project-architecture/atlas'));
    const edge = state.edges.find(e => e.from.feature === 'a');
    assert.ok(edge, 'edge should exist');
    assert.equal(edge.kind, 'implements', 'edge kind should be "implements" not "call"');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
```

### Test 11: Batch atomicity — partial failure doesn't leave partial state (FIX-01-11)

This test is harder to write because the validation happens at the mutation callback level. The simplest approach: create a batch where one entity has an invalid `--part-of` reference. Before the fix, entities before the failing one are persisted. After the fix, nothing is persisted.

```javascript
test('batch add rolls back on entity validation failure', async () => {
  const root = mkProject();
  try {
    const io = makeIo();
    // Add a valid entity
    await cli.dispatch(['add', 'feature', 'existing', '--project', root, '--no-render'], io);
    
    // Batch with valid feature, then invalid module (--part-of non-existent)
    const code = await cli.dispatch([
      'add', 'feature', 'f1',
      'module', 'm1', '--part-of', 'nonexistent',
      '--project', root, '--no-render',
    ], io);
    assert.notEqual(code, 0);
    
    // Verify f1 was NOT added (batch should roll back)
    const state = stateLib.load(path.join(root, 'resources/project-architecture/atlas'));
    assert.equal(state.features.find(f => f.slug === 'f1'), undefined, 'f1 should not exist after batch rollback');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
```

**Oracle**: Must fail before FIX-01 (f1 is persisted despite m1 failing). Must pass after FIX-01 (pre-validation rejects the batch before any mutation).

### Test 12: Legacy apply verb suggests add (FIX-01-12)

```javascript
test('legacy apply verb suggests using add instead', async () => {
  const io = makeIo();
  const code = await cli.dispatch(['apply', '/tmp/dummy.yaml'], io);
  assert.notEqual(code, 0);
  assert.match(io.stderr_text, /add/);
  assert.doesNotMatch(io.stderr_text, /Unknown verb/);  // Should have specific message
});
```

### Test 13: remove --dry-run is forwarded (regression guard for FIX-01-5)

```javascript
test('remove --dry-run produces JSON diff output', async () => {
  const root = mkProject();
  try {
    const io = makeIo();
    await cli.dispatch(['add', 'feature', 'payment', '--project', root, '--no-render'], io);
    
    const code = await cli.dispatch(['remove', 'feature', 'payment', '--project', root, '--no-render', '--dry-run'], io);
    assert.equal(code, 0);
    // Dry-run should output JSON diff
    assert.match(io.stdout_text, /dry-run/);
    
    // Feature should still exist
    const state = stateLib.load(path.join(root, 'resources/project-architecture/atlas'));
    assert.equal(state.features.length, 1);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
```

### Test 14: Help text shows operational verbs (FIX-02-13, P2-13 regression guard)

Update the existing `test('help prints usage and exits 0')` at L358-365 to also verify `validate`, `status`, `scan`, `undo` appear:

Instead of modifying the existing test, add a new test:
```javascript
test('help text shows operational commands validate/status/scan/undo', async () => {
  const io = makeIo();
  const code = await cli.dispatch(['help'], io);
  assert.equal(code, 0);
  assert.match(io.stdout_text, /validate/);
  assert.match(io.stdout_text, /status/);
  assert.match(io.stdout_text, /scan/);
  assert.match(io.stdout_text, /undo/);
});
```

### Test 15: Help text hides fine-grained mutation verbs (P3-16)

```javascript
test('help text does not show fine-grained mutation verbs', async () => {
  const io = makeIo();
  const code = await cli.dispatch(['help'], io);
  assert.equal(code, 0);
  assert.doesNotMatch(io.stdout_text, /feature add/);
  assert.doesNotMatch(io.stdout_text, /submodule add/);
  assert.doesNotMatch(io.stdout_text, /edge add/);
});
```

### Test 16: Add auto-render without --no-render (P3-14)

```javascript
test('add triggers auto-render without --no-render', async () => {
  const root = mkProject();
  try {
    const io = makeIo();
    const code = await cli.dispatch(['add', 'feature', 'payment', '--project', root, '--no-open'], io);
    assert.equal(code, 0);
    // HTML should be rendered
    assert.ok(fs.existsSync(path.join(root, 'resources/project-architecture/index.html')));
    assert.match(io.stdout_text, /applied/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
```

### Output

When done, report back to the coordinator:
- **Test file**: `test/atlas-cli.test.js`
- **Tests added**: [list all tests by name]
- **Oracle confirmed**: Run each test individually on unfixed code — confirm at least Test 1, 5, 7, 8, 11, 12 fail before fix
- **Risks or concerns**: [or "None"]

---

## 4. Verification

1. Run all new tests on unfixed code (temporarily revert FIX-01 changes):
   ```bash
   node --test test/atlas-cli.test.js
   ```
   - Expected: Some new tests fail (confirming the oracle detects the unfixed bugs) while all existing tests pass

2. After fix is applied, run:
   ```bash
   node --test test/atlas-cli.test.js
   ```
   - Expected: All tests pass

3. Run full test suite:
   ```bash
   npm test
   ```
   - Expected: All tests pass (no regressions)

---

## 5. Scope & References

### Allowed Files

- `test/atlas-cli.test.js` — Write all regression tests here

### Forbidden Files

- All source code files (`cli.js`, `cli-help.js`, `index.ts`, etc.) — the regression test worker must not modify source code

### Related Documents

- `docs/plans/2026-06-07/architecture-simplify/fix/FIX-01-cli-fixes.md` — Fix description
- `docs/plans/2026-06-07/architecture-simplify/SPEC.md` — Expected behavior
- `docs/plans/2026-06-07/architecture-simplify/REPORT.md` — Issue descriptions
