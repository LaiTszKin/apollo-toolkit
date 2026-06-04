import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { UserInputError } from '@laitszkin/tool-utils';

function createMemoryStream() {
  let data = '';
  return {
    write(chunk) { data += chunk; return true; },
    toString() { return data; },
  };
}

test('architectureHandler returns 1 for nonexistent YAML in apply', async () => {
  const { architectureHandler } = await import(
    '../../packages/tools/architecture/dist/index.js'
  );
  const stderr = createMemoryStream();
  const context = {
    stdout: { write: () => {} },
    stderr,
  };

  await assert.rejects(
    () => architectureHandler(['apply', '/dev/null/nonexistent-spec.yaml'], context),
    (err) => {
      assert.ok(err instanceof UserInputError);
      assert.ok(err.message.includes('Error parsing apply YAML'));
      return true;
    }
  );
});

// REGTEST-02: FIX-03 — architecture tool converts stderr.write+return1 to typed throws
test('architectureHandler returns 1 for apply with missing slug (UserInputError)', async () => {
  const { architectureHandler } = await import(
    '../../packages/tools/architecture/dist/index.js'
  );

  const tmpDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'apltk-arch-err-'),
  );
  const yamlPath = path.join(tmpDir, 'invalid.yaml');

  try {
    fs.writeFileSync(
      yamlPath,
      'features:\n  - action: add\n',
      'utf8',
    );

    const stderr = createMemoryStream();
    const stdout = createMemoryStream();
    const context = {
      stdout,
      stderr,
    };

    await assert.rejects(
      () => architectureHandler(['apply', yamlPath], context),
      (err) => {
        assert.ok(err instanceof UserInputError);
        assert.ok(
          err.message.includes('"features" entry missing required "slug" field'),
          'should contain the validation error message',
        );
        return true;
      }
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('architectureHandler returns 1 for template without args', async () => {
  const { architectureHandler } = await import(
    '../../packages/tools/architecture/dist/index.js'
  );

  await assert.rejects(
    () => architectureHandler(['template'], { stdout: { write: () => {} }, stderr: { write: () => {} } }),
    (err) => {
      assert.ok(err instanceof UserInputError);
      assert.ok(err.message.includes('Usage: apltk architecture template'));
      return true;
    }
  );
});

test('architectureHandler returns 1 for unknown subcommand', async () => {
  const { architectureHandler } = await import(
    '../../packages/tools/architecture/dist/index.js'
  );
  const stderr = createMemoryStream();
  const context = {
    stdout: { write: () => {} },
    stderr,
  };

  const result = await architectureHandler(['invalid-cmd'], context);
  assert.strictEqual(result, 1);
  assert.ok(stderr.toString().length > 0, 'stderr should have content');
});

test('architectureHandler writes usage for apply without yaml arg', async () => {
  const { architectureHandler } = await import(
    '../../packages/tools/architecture/dist/index.js'
  );

  await assert.rejects(
    () => architectureHandler(['apply'], { stdout: { write: () => {} }, stderr: { write: () => {} } }),
    (err) => {
      assert.ok(err instanceof UserInputError);
      assert.ok(err.message.includes('Usage: apltk architecture apply'));
      return true;
    }
  );
});

test('architectureHandler writes "Batch aborted:" for generic errors', async () => {
  const { architectureHandler } = await import(
    '../../packages/tools/architecture/dist/index.js'
  );

  const tmpDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'apltk-arch-gen-'),
  );
  const yamlPath = path.join(tmpDir, 'generic-error.yaml');

  try {
    // "features" as a mapping (object) instead of a sequence (array)
    // causes errors inside handleApply.
    fs.writeFileSync(
      yamlPath,
      'features:\n  slug: feat-a\n  action: add\n',
      'utf8',
    );

    await assert.rejects(
      () => architectureHandler(['apply', yamlPath], { stdout: { write: () => {} }, stderr: { write: () => {} } }),
      (err) => {
        assert.ok(err instanceof UserInputError);
        return true;
      }
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

// ── Template handler tests ───────────────────────────────────────────────────

test('template creates proposal.yaml from SPEC.md with title and goal', async () => {
  const { architectureHandler } = await import(
    '../../packages/tools/architecture/dist/index.js'
  );
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apltk-tpl-g-'));
  try {
    const specDir = path.join(tmpDir, 'spec');
    const outputDir = path.join(tmpDir, 'output');
    fs.mkdirSync(specDir, { recursive: true });
    fs.writeFileSync(
      path.join(specDir, 'SPEC.md'),
      [
        '# Spec: User Authentication',
        '',
        '## Goal',
        'The goal is to authenticate users with JWT tokens.',
        '',
        '## Other section',
        'Not part of goal.',
      ].join('\n'),
      'utf8',
    );

    const stderr = createMemoryStream();
    const stdout = createMemoryStream();
    const result = await architectureHandler(
      ['template', '--spec', specDir, '--output', outputDir],
      { stdout, stderr },
    );
    assert.strictEqual(result, 0, `exit 0 expected, got ${result}. stderr: ${stderr.toString()}`);

    const outPath = path.join(outputDir, 'proposal.yaml');
    assert.ok(fs.existsSync(outPath), 'proposal.yaml should exist');
    const content = fs.readFileSync(outPath, 'utf8');
    assert.ok(content.includes('slug: user-authentication'), 'slug derived from title');
    assert.ok(content.includes('story:'), 'story: line should be present for non-empty goal');
    assert.ok(content.includes('JWT'), 'goal text should appear in story');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('template creates proposal.yaml from SPEC.md with title but no goal', async () => {
  const { architectureHandler } = await import(
    '../../packages/tools/architecture/dist/index.js'
  );
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apltk-tpl-ng-'));
  try {
    const specDir = path.join(tmpDir, 'spec2');
    const outputDir = path.join(tmpDir, 'output2');
    fs.mkdirSync(specDir, { recursive: true });
    fs.writeFileSync(path.join(specDir, 'SPEC.md'), '# Spec: Simple Feature\n', 'utf8');

    const stderr = createMemoryStream();
    const stdout = createMemoryStream();
    const result = await architectureHandler(
      ['template', '--spec', specDir, '--output', outputDir],
      { stdout, stderr },
    );
    assert.strictEqual(result, 0, `exit 0 expected, got ${result}. stderr: ${stderr.toString()}`);

    const content = fs.readFileSync(path.join(outputDir, 'proposal.yaml'), 'utf8');
    assert.ok(content.includes('slug: simple-feature'), 'slug derived from title');
    assert.ok(!content.includes('story:'), 'no story: when goal is empty');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('template returns 1 when spec dir has .md files but no SPEC.md', async () => {
  const { architectureHandler } = await import(
    '../../packages/tools/architecture/dist/index.js'
  );
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apltk-tpl-md-'));
  try {
    const specDir = path.join(tmpDir, 'nospec');
    fs.mkdirSync(specDir, { recursive: true });
    fs.writeFileSync(path.join(specDir, 'README.md'), '# Readme\n', 'utf8');
    const outputDir = path.join(tmpDir, 'out');
    const stderr = createMemoryStream();
    await assert.rejects(
      () => architectureHandler(
        ['template', '--spec', specDir, '--output', outputDir],
        { stdout: { write: () => {} }, stderr },
      ),
      (err) => {
        assert.ok(err instanceof UserInputError);
        assert.ok(err.message.includes('README.md'), 'should mention existing .md files');
        return true;
      }
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('template returns 1 when spec dir has no files at all', async () => {
  const { architectureHandler } = await import(
    '../../packages/tools/architecture/dist/index.js'
  );
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apltk-tpl-em-'));
  try {
    const specDir = path.join(tmpDir, 'empty-spec');
    fs.mkdirSync(specDir, { recursive: true });
    const outputDir = path.join(tmpDir, 'out');
    const stderr = createMemoryStream();
    await assert.rejects(
      () => architectureHandler(
        ['template', '--spec', specDir, '--output', outputDir],
        { stdout: { write: () => {} }, stderr },
      ),
      (err) => {
        assert.ok(err instanceof UserInputError);
        assert.ok(err.message.includes('No .md files found'), 'should mention no md files');
        return true;
      }
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('template creates proposal.yaml from SPEC.md with goal containing double quotes', async () => {
  const { architectureHandler } = await import(
    '../../packages/tools/architecture/dist/index.js'
  );
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apltk-tpl-dq-'));
  try {
    const specDir = path.join(tmpDir, 'spec-dq');
    const outputDir = path.join(tmpDir, 'output-dq');
    fs.mkdirSync(specDir, { recursive: true });
    fs.writeFileSync(
      path.join(specDir, 'SPEC.md'),
      [
        '# Spec: Test Feature',
        '',
        '## Goal',
        'The "goal" is to test double quotes in yamlStr.',
      ].join('\n'),
      'utf8',
    );
    const stderr = createMemoryStream();
    const stdout = createMemoryStream();
    const result = await architectureHandler(
      ['template', '--spec', specDir, '--output', outputDir],
      { stdout, stderr },
    );
    assert.strictEqual(result, 0, `exit 0 expected, got ${result}. stderr: ${stderr.toString()}`);
    const content = fs.readFileSync(path.join(outputDir, 'proposal.yaml'), 'utf8');
    assert.ok(content.includes('slug: test-feature'), 'slug derived from title');
    assert.ok(content.includes('story:'), 'story should be present');
    assert.ok(content.includes('double quotes'), 'goal text should be present');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

// ── Apply YAML validation (before atlas module import) ──────────────────────

test('apply returns 1 when YAML file contains null value', async () => {
  const { architectureHandler } = await import(
    '../../packages/tools/architecture/dist/index.js'
  );
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apltk-ynull-'));
  try {
    const yamlPath = path.join(tmpDir, 'null.yaml');
    fs.writeFileSync(yamlPath, 'null\n', 'utf8');
    await assert.rejects(
      () => architectureHandler(
        ['apply', yamlPath],
        { stdout: { write: () => {} }, stderr: { write: () => {} } },
      ),
      (err) => {
        assert.ok(err instanceof UserInputError);
        assert.ok(err.message.includes('Invalid apply YAML'), 'null YAML should be rejected');
        return true;
      }
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('apply returns 1 when YAML file contains a scalar string', async () => {
  const { architectureHandler } = await import(
    '../../packages/tools/architecture/dist/index.js'
  );
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apltk-ystr-'));
  try {
    const yamlPath = path.join(tmpDir, 'str.yaml');
    fs.writeFileSync(yamlPath, 'just a string\n', 'utf8');
    await assert.rejects(
      () => architectureHandler(
        ['apply', yamlPath],
        { stdout: { write: () => {} }, stderr: { write: () => {} } },
      ),
      (err) => {
        assert.ok(err instanceof UserInputError);
        assert.ok(err.message.includes('Invalid apply YAML'), 'string YAML should be rejected');
        return true;
      }
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

// ── Helper: mock atlas modules on disk ──────────────────────────────────────

function writeMockAtlasModules(tmpDir, stateReturn) {
  const atlasDir = path.join(tmpDir, 'skills', 'init-project-html', 'lib', 'atlas');
  fs.mkdirSync(atlasDir, { recursive: true });
  fs.mkdirSync(path.join(tmpDir, 'resources', 'project-architecture'), { recursive: true });

  const cliProjectRoot = tmpDir;
  const cliAtlasDir = path.join(tmpDir, 'resources', 'project-architecture');
  fs.writeFileSync(path.join(atlasDir, 'cli.js'), [
    `const projectRoot = ${JSON.stringify(cliProjectRoot)};`,
    `const atlasDir = ${JSON.stringify(cliAtlasDir)};`,
    'export default {',
    '  resolveProjectRoot: () => projectRoot,',
    '  baseAtlasDir: () => atlasDir,',
    '  runRender: async () => {},',
    '};',
  ].join('\n'), 'utf-8');

  const json = JSON.stringify(stateReturn);
  fs.writeFileSync(path.join(atlasDir, 'state.js'), [
    `const initialState = ${json};`,
    'const g = /** @type {any} */ (globalThis);',
    'const onSave = typeof g.__rg_onSave === "function"',
    '  ? g.__rg_onSave',
    '  : () => {};',
    'export default {',
    '  load: () => JSON.parse(JSON.stringify(initialState)),',
    '  loadOverlay: () => ({ features: [], edges: [] }),',
    '  mergeOverlay: (base, overlay) => ({',
    '    features: [...base.features, ...overlay.features],',
    '    edges: [...base.edges, ...overlay.edges],',
    '  }),',
    '  save: (dir, state) => { onSave(dir, state); },',
    '  saveOverlay: () => {},',
    '  writeUndoSnapshot: () => {},',
    '  appendHistory: () => {},',
    '  deriveOverlay: (base, merged) => merged,',
    '};',
  ].join('\n'), 'utf-8');

  fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ type: 'module' }), 'utf-8');
}

// ── Apply handler: feature mutations ────────────────────────────────────────

test('apply adds a feature with title, story, dependsOn via action: add', async () => {
  const { architectureHandler } = await import(
    '../../packages/tools/architecture/dist/index.js'
  );
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apltk-afeat-'));
  let savedState;
  globalThis.__rg_onSave = (_dir, state) => { savedState = state; };
  try {
    writeMockAtlasModules(tmpDir, { features: [], edges: [] });
    const yamlPath = path.join(tmpDir, 'batch.yaml');
    fs.writeFileSync(yamlPath, [
      'features:',
      '  - slug: auth',
      '    title: User Auth',
      '    story: Handles login',
      '    dependsOn: [db]',
      '    action: add',
      'edges: []',
    ].join('\n'), 'utf-8');
    const result = await architectureHandler(
      ['apply', yamlPath, '--no-render'],
      { stdout: { write: () => {} }, stderr: { write: () => {} }, sourceRoot: tmpDir },
    );
    assert.strictEqual(result, 0, `exit 0 expected, got ${result}`);
    assert.ok(savedState, 'state should have been saved');
    const feat = savedState.features.find((f) => f.slug === 'auth');
    assert.ok(feat, 'auth feature should exist');
    assert.strictEqual(feat.title, 'User Auth');
    assert.strictEqual(feat.story, 'Handles login');
    assert.deepStrictEqual(feat.dependsOn, ['db']);
  } finally {
    delete globalThis.__rg_onSave;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('apply modifies an existing feature title via action: modify', async () => {
  const { architectureHandler } = await import(
    '../../packages/tools/architecture/dist/index.js'
  );
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apltk-mfeat-'));
  let savedState;
  globalThis.__rg_onSave = (_dir, state) => { savedState = state; };
  try {
    writeMockAtlasModules(tmpDir, {
      features: [{ slug: 'auth', title: 'Old Title', submodules: [], edges: [] }],
      edges: [],
    });
    const yamlPath = path.join(tmpDir, 'batch.yaml');
    fs.writeFileSync(yamlPath, [
      'features:',
      '  - slug: auth',
      '    title: New Title',
      '    action: modify',
      'edges: []',
    ].join('\n'), 'utf-8');
    const result = await architectureHandler(
      ['apply', yamlPath, '--no-render'],
      { stdout: { write: () => {} }, stderr: { write: () => {} }, sourceRoot: tmpDir },
    );
    assert.strictEqual(result, 0, `exit 0 expected, got ${result}`);
    assert.ok(savedState, 'state should have been saved');
    const feat = savedState.features.find((f) => f.slug === 'auth');
    assert.strictEqual(feat.title, 'New Title');
  } finally {
    delete globalThis.__rg_onSave;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('apply removes a feature and its incident edges via action: remove', async () => {
  const { architectureHandler } = await import(
    '../../packages/tools/architecture/dist/index.js'
  );
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apltk-rfeat-'));
  let savedState;
  globalThis.__rg_onSave = (_dir, state) => { savedState = state; };
  try {
    writeMockAtlasModules(tmpDir, {
      features: [
        { slug: 'feat-a', title: 'A', submodules: [], edges: [] },
        { slug: 'feat-b', title: 'B', submodules: [], edges: [] },
      ],
      edges: [{ id: 'e1', from: { feature: 'feat-a', submodule: 'mod' }, to: { feature: 'feat-b', submodule: 'mod' }, kind: 'call' }],
    });
    const yamlPath = path.join(tmpDir, 'batch.yaml');
    fs.writeFileSync(yamlPath, [
      'features:',
      '  - slug: feat-a',
      '    action: remove',
      'edges: []',
    ].join('\n'), 'utf-8');
    const result = await architectureHandler(
      ['apply', yamlPath, '--no-render'],
      { stdout: { write: () => {} }, stderr: { write: () => {} }, sourceRoot: tmpDir },
    );
    assert.strictEqual(result, 0, `exit 0 expected, got ${result}`);
    assert.ok(savedState, 'state should have been saved');
    assert.strictEqual(savedState.features.length, 1, 'feat-a should be removed');
    assert.strictEqual(savedState.features[0].slug, 'feat-b', 'feat-b should remain');
    // Edge referencing feat-a should also be removed
    assert.strictEqual(savedState.edges.length, 0, 'edge referencing feat-a should be removed');
  } finally {
    delete globalThis.__rg_onSave;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('apply returns 1 for unknown feature action', async () => {
  const { architectureHandler } = await import(
    '../../packages/tools/architecture/dist/index.js'
  );
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apltk-uact-'));
  try {
    writeMockAtlasModules(tmpDir, { features: [], edges: [] });
    const yamlPath = path.join(tmpDir, 'batch.yaml');
    fs.writeFileSync(yamlPath, [
      'features:',
      '  - slug: auth',
      '    action: unknown',
      'edges: []',
    ].join('\n'), 'utf-8');
    await assert.rejects(
      () => architectureHandler(
        ['apply', yamlPath, '--no-render'],
        { stdout: { write: () => {} }, stderr: { write: () => {} }, sourceRoot: tmpDir },
      ),
      (err) => {
        assert.ok(err instanceof UserInputError);
        assert.ok(err.message.includes('unknown action'), 'should mention unknown action');
        return true;
      }
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('apply returns 1 for modify of non-existent feature', async () => {
  const { architectureHandler } = await import(
    '../../packages/tools/architecture/dist/index.js'
  );
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apltk-miss-'));
  try {
    writeMockAtlasModules(tmpDir, { features: [], edges: [] });
    const yamlPath = path.join(tmpDir, 'batch.yaml');
    fs.writeFileSync(yamlPath, [
      'features:',
      '  - slug: ghost',
      '    action: modify',
      'edges: []',
    ].join('\n'), 'utf-8');
    await assert.rejects(
      () => architectureHandler(
        ['apply', yamlPath, '--no-render'],
        { stdout: { write: () => {} }, stderr: { write: () => {} }, sourceRoot: tmpDir },
      ),
      (err) => {
        assert.ok(err instanceof UserInputError);
        assert.ok(err.message.includes('not found'), 'should mention not found');
        return true;
      }
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('apply adds a submodule to an existing feature via action: add', async () => {
  const { architectureHandler } = await import(
    '../../packages/tools/architecture/dist/index.js'
  );
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apltk-asub-'));
  let savedState;
  globalThis.__rg_onSave = (_dir, state) => { savedState = state; };
  try {
    writeMockAtlasModules(tmpDir, {
      features: [{ slug: 'auth', title: 'Auth', submodules: [], edges: [] }],
      edges: [],
    });
    const yamlPath = path.join(tmpDir, 'batch.yaml');
    fs.writeFileSync(yamlPath, [
      'features:',
      '  - slug: auth',
      '    action: modify',
      '    submodules:',
      '      - slug: login',
      '        kind: api',
      '        role: Handles login',
      '        action: add',
      'edges: []',
    ].join('\n'), 'utf-8');
    const result = await architectureHandler(
      ['apply', yamlPath, '--no-render'],
      { stdout: { write: () => {} }, stderr: { write: () => {} }, sourceRoot: tmpDir },
    );
    assert.strictEqual(result, 0, `exit 0 expected`);
    assert.ok(savedState, 'state saved');
    const parent = savedState.features.find((f) => f.slug === 'auth');
    assert.ok(parent, 'auth feature exists');
    assert.ok(parent.submodules.find((s) => s.slug === 'login'), 'login submodule should be present');
  } finally {
    delete globalThis.__rg_onSave;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('apply returns 1 for unknown edge action', async () => {
  const { architectureHandler } = await import(
    '../../packages/tools/architecture/dist/index.js'
  );
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apltk-uedge-'));
  const stderr = createMemoryStream();
  try {
    writeMockAtlasModules(tmpDir, {
      features: [{ slug: 'a', title: 'A', submodules: [{ slug: 'm', kind: 'service' }], edges: [] }],
      edges: [],
    });
    const yamlPath = path.join(tmpDir, 'batch.yaml');
    fs.writeFileSync(yamlPath, [
      'edges:',
      '  - from: a/m',
      '    to: b/m',
      '    action: unknown',
      '    kind: call',
    ].join('\n'), 'utf-8');
    await assert.rejects(
      () => architectureHandler(
        ['apply', yamlPath, '--no-render'],
        { stdout: { write: () => {} }, stderr: { write: () => {} }, sourceRoot: tmpDir },
      ),
      (err) => {
        assert.ok(err instanceof UserInputError);
        assert.ok(err.message.includes('unknown action'), 'should mention unknown edge action');
        return true;
      }
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('apply returns 1 for unknown submodule action', async () => {
  const { architectureHandler } = await import(
    '../../packages/tools/architecture/dist/index.js'
  );
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apltk-usub-'));
  try {
    writeMockAtlasModules(tmpDir, {
      features: [{ slug: 'a', title: 'A', submodules: [{ slug: 'm', kind: 'service' }], edges: [] }],
      edges: [],
    });
    const yamlPath = path.join(tmpDir, 'batch.yaml');
    fs.writeFileSync(yamlPath, [
      'features:',
      '  - slug: a',
      '    action: modify',
      '    submodules:',
      '      - slug: m',
      '        action: unknown',
    ].join('\n'), 'utf-8');
    await assert.rejects(
      () => architectureHandler(
        ['apply', yamlPath, '--no-render'],
        { stdout: { write: () => {} }, stderr: { write: () => {} }, sourceRoot: tmpDir },
      ),
      (err) => {
        assert.ok(err instanceof UserInputError);
        assert.ok(err.message.includes('unknown action'), 'should mention unknown sub action');
        return true;
      }
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('apply returns 1 for edge with invalid endpoint format', async () => {
  const { architectureHandler } = await import(
    '../../packages/tools/architecture/dist/index.js'
  );
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apltk-einv-'));
  try {
    writeMockAtlasModules(tmpDir, {
      features: [{ slug: 'a', title: 'A', submodules: [], edges: [] }],
      edges: [],
    });
    const yamlPath = path.join(tmpDir, 'batch.yaml');
    fs.writeFileSync(yamlPath, [
      'edges:',
      '  - from: ""',
      '    to: a/mod',
      '    action: add',
      '    kind: call',
    ].join('\n'), 'utf-8');
    await assert.rejects(
      () => architectureHandler(
        ['apply', yamlPath, '--no-render'],
        { stdout: { write: () => {} }, stderr: { write: () => {} }, sourceRoot: tmpDir },
      ),
      (err) => {
        assert.ok(err instanceof UserInputError);
        assert.ok(err.message.includes('Invalid endpoint'), 'should mention invalid endpoint');
        return true;
      }
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('apply returns 1 for edge with non-existent source feature', async () => {
  const { architectureHandler } = await import(
    '../../packages/tools/architecture/dist/index.js'
  );
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apltk-esrc-'));
  try {
    writeMockAtlasModules(tmpDir, {
      features: [{ slug: 'a', title: 'A', submodules: [{ slug: 'm', kind: 'service' }], edges: [] }],
      edges: [],
    });
    const yamlPath = path.join(tmpDir, 'batch.yaml');
    fs.writeFileSync(yamlPath, [
      'edges:',
      '  - from: nonexistent-feature/m',
      '    to: a/m',
      '    action: add',
      '    kind: call',
    ].join('\n'), 'utf-8');
    await assert.rejects(
      () => architectureHandler(
        ['apply', yamlPath, '--no-render'],
        { stdout: { write: () => {} }, stderr: { write: () => {} }, sourceRoot: tmpDir },
      ),
      (err) => {
        assert.ok(err instanceof UserInputError);
        assert.ok(err.message.includes('nonexistent-feature'), 'should mention missing source feature');
        return true;
      }
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('codegraphHandler --json flag is parsed out before dispatch', async () => {
  // Verify --json in args doesn't break help (which ignores extra flags)
  const { codegraphHandler } = await import(
    '../../packages/tools/codegraph/dist/index.js'
  );
  const stdout = createMemoryStream();
  const result = await codegraphHandler(
    ['--json', '--help'],
    { stdout, stderr: { write: () => {} } },
  );
  assert.strictEqual(result, 0);
  assert.ok(stdout.toString().includes('Usage: apltk codegraph'));
});
