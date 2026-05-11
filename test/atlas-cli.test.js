'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const cli = require('../init-project-html/lib/atlas/cli');
const stateLib = require('../init-project-html/lib/atlas/state');

function makeIo() {
  let outBuf = '';
  let errBuf = '';
  return {
    stdout: { write: (s) => { outBuf += s; } },
    stderr: { write: (s) => { errBuf += s; } },
    get stdout_text() { return outBuf; },
    get stderr_text() { return errBuf; },
  };
}

function mkProject() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aplt-atlas-cli-'));
  fs.mkdirSync(path.join(root, 'resources', 'project-architecture'), { recursive: true });
  return root;
}

test('parseFlags handles =, space-separated values, and booleans', () => {
  const { positional, flags } = cli.parseFlags(['--slug=foo', '--title', 'My title', '--no-render', 'extra']);
  assert.equal(flags.slug, 'foo');
  assert.equal(flags.title, 'My title');
  assert.equal(flags['no-render'], true);
  assert.deepEqual(positional, ['extra']);
});

test('feature add then submodule add write base YAML and HTML', async () => {
  const root = mkProject();
  try {
    const io = makeIo();
    let code = await cli.dispatch(['feature', 'add', '--slug', 'register', '--title', 'Register', '--project', root, '--no-open'], io);
    assert.equal(code, 0);
    code = await cli.dispatch(['submodule', 'add', '--feature', 'register', '--slug', 'ui', '--kind', 'ui', '--role', 'Form', '--project', root, '--no-open'], io);
    assert.equal(code, 0);
    const atlasYaml = fs.readFileSync(path.join(root, 'resources/project-architecture/atlas/atlas.index.yaml'), 'utf8');
    assert.match(atlasYaml, /features:/);
    assert.match(atlasYaml, /- register/);
    const featureYaml = fs.readFileSync(path.join(root, 'resources/project-architecture/atlas/features/register.yaml'), 'utf8');
    assert.match(featureYaml, /slug: register/);
    assert.match(featureYaml, /kind: ui/);
    assert.ok(fs.existsSync(path.join(root, 'resources/project-architecture/index.html')));
    assert.ok(fs.existsSync(path.join(root, 'resources/project-architecture/features/register/ui.html')));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('--no-render skips HTML emission', async () => {
  const root = mkProject();
  try {
    const io = makeIo();
    await cli.dispatch(['feature', 'add', '--slug', 'register', '--project', root, '--no-render'], io);
    assert.ok(fs.existsSync(path.join(root, 'resources/project-architecture/atlas/atlas.index.yaml')));
    assert.equal(fs.existsSync(path.join(root, 'resources/project-architecture/index.html')), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('function/variable/dataflow/error/edge mutations append to feature YAML', async () => {
  const root = mkProject();
  try {
    const io = makeIo();
    await cli.dispatch(['feature', 'add', '--slug', 'register', '--project', root, '--no-render'], io);
    await cli.dispatch(['submodule', 'add', '--feature', 'register', '--slug', 'api', '--kind', 'api', '--project', root, '--no-render'], io);
    await cli.dispatch(['function', 'add', '--feature', 'register', '--submodule', 'api', '--name', 'POST_register', '--side', 'tx', '--project', root, '--no-render'], io);
    await cli.dispatch(['variable', 'add', '--feature', 'register', '--submodule', 'api', '--name', 'inviteCode', '--type', 'string', '--scope', 'call', '--project', root, '--no-render'], io);
    await cli.dispatch(['dataflow', 'add', '--feature', 'register', '--submodule', 'api', '--step', 'Validate', '--project', root, '--no-render'], io);
    await cli.dispatch(['dataflow', 'add', '--feature', 'register', '--submodule', 'api', '--step', 'Insert', '--project', root, '--no-render'], io);
    await cli.dispatch(['error', 'add', '--feature', 'register', '--submodule', 'api', '--name', 'ErrCode', '--when', 'invalid', '--project', root, '--no-render'], io);
    await cli.dispatch(['submodule', 'add', '--feature', 'register', '--slug', 'ui', '--kind', 'ui', '--project', root, '--no-render'], io);
    await cli.dispatch(['edge', 'add', '--from', 'register/ui', '--to', 'register/api', '--kind', 'call', '--label', 'POST', '--id', 'e1', '--project', root, '--no-render'], io);

    const yaml = fs.readFileSync(path.join(root, 'resources/project-architecture/atlas/features/register.yaml'), 'utf8');
    assert.match(yaml, /POST_register/);
    assert.match(yaml, /inviteCode/);
    assert.match(yaml, /Validate/);
    assert.match(yaml, /Insert/);
    assert.match(yaml, /ErrCode/);
    assert.match(yaml, /e1/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('dataflow reorder swaps step positions', async () => {
  const root = mkProject();
  try {
    const io = makeIo();
    await cli.dispatch(['feature', 'add', '--slug', 'f', '--project', root, '--no-render'], io);
    await cli.dispatch(['submodule', 'add', '--feature', 'f', '--slug', 's', '--project', root, '--no-render'], io);
    await cli.dispatch(['dataflow', 'add', '--feature', 'f', '--submodule', 's', '--step', 'A', '--project', root, '--no-render'], io);
    await cli.dispatch(['dataflow', 'add', '--feature', 'f', '--submodule', 's', '--step', 'B', '--project', root, '--no-render'], io);
    await cli.dispatch(['dataflow', 'add', '--feature', 'f', '--submodule', 's', '--step', 'C', '--project', root, '--no-render'], io);
    await cli.dispatch(['dataflow', 'reorder', '--feature', 'f', '--submodule', 's', '--from', '2', '--to', '0', '--project', root, '--no-render'], io);
    const loaded = stateLib.load(path.join(root, 'resources/project-architecture/atlas'));
    assert.deepEqual(loaded.features[0].submodules[0].dataflow, ['C', 'A', 'B']);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('dataflow add stores fn/reads/writes when flags are passed and validates against declared symbols', async () => {
  const root = mkProject();
  try {
    const io = makeIo();
    await cli.dispatch(['feature', 'add', '--slug', 'reg', '--project', root, '--no-render'], io);
    await cli.dispatch(['submodule', 'add', '--feature', 'reg', '--slug', 'api', '--kind', 'api', '--project', root, '--no-render'], io);
    await cli.dispatch(['function', 'add', '--feature', 'reg', '--submodule', 'api', '--name', 'handlePost', '--side', 'network', '--project', root, '--no-render'], io);
    await cli.dispatch(['variable', 'add', '--feature', 'reg', '--submodule', 'api', '--name', 'body', '--type', 'object', '--scope', 'call', '--project', root, '--no-render'], io);
    await cli.dispatch(['variable', 'add', '--feature', 'reg', '--submodule', 'api', '--name', 'token', '--type', 'string', '--scope', 'call', '--project', root, '--no-render'], io);
    await cli.dispatch(['dataflow', 'add', '--feature', 'reg', '--submodule', 'api', '--step', 'plain step', '--project', root, '--no-render'], io);
    await cli.dispatch(['dataflow', 'add', '--feature', 'reg', '--submodule', 'api', '--step', 'validate body and emit token', '--fn', 'handlePost', '--reads', 'body', '--writes', 'token', '--project', root, '--no-render'], io);
    const loaded = stateLib.load(path.join(root, 'resources/project-architecture/atlas'));
    const flow = loaded.features[0].submodules[0].dataflow;
    assert.equal(flow[0], 'plain step', 'plain string steps stay as strings');
    assert.deepEqual(flow[1], { step: 'validate body and emit token', fn: 'handlePost', reads: ['body'], writes: ['token'] });
    const validateIo = makeIo();
    const code = await cli.dispatch(['validate', '--project', root], validateIo);
    assert.equal(code, 0);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('dataflow add rejects fn/reads/writes that do not match declared functions/variables', async () => {
  const root = mkProject();
  try {
    const io = makeIo();
    await cli.dispatch(['feature', 'add', '--slug', 'reg', '--project', root, '--no-render'], io);
    await cli.dispatch(['submodule', 'add', '--feature', 'reg', '--slug', 'api', '--kind', 'api', '--project', root, '--no-render'], io);
    await cli.dispatch(['dataflow', 'add', '--feature', 'reg', '--submodule', 'api', '--step', 'lying step', '--fn', 'ghostFn', '--project', root, '--no-render'], io);
    const validateIo = makeIo();
    const code = await cli.dispatch(['validate', '--project', root], validateIo);
    assert.notEqual(code, 0, 'validate exits non-zero when fn references unknown function');
    const combined = validateIo.stderr_text + validateIo.stdout_text;
    assert.match(combined, /unknown function "ghostFn"/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('cross-feature edge is stored at the index level', async () => {
  const root = mkProject();
  try {
    const io = makeIo();
    await cli.dispatch(['feature', 'add', '--slug', 'a', '--project', root, '--no-render'], io);
    await cli.dispatch(['submodule', 'add', '--feature', 'a', '--slug', 'svc', '--project', root, '--no-render'], io);
    await cli.dispatch(['feature', 'add', '--slug', 'b', '--project', root, '--no-render'], io);
    await cli.dispatch(['submodule', 'add', '--feature', 'b', '--slug', 'api', '--project', root, '--no-render'], io);
    await cli.dispatch(['edge', 'add', '--from', 'a/svc', '--to', 'b/api', '--kind', 'data-row', '--id', 'cross', '--project', root, '--no-render'], io);
    const indexYaml = fs.readFileSync(path.join(root, 'resources/project-architecture/atlas/atlas.index.yaml'), 'utf8');
    assert.match(indexYaml, /cross/);
    assert.match(indexYaml, /data-row/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('--spec writes to overlay path and never mutates base files', async () => {
  const root = mkProject();
  try {
    const io = makeIo();
    await cli.dispatch(['feature', 'add', '--slug', 'register', '--title', 'Register', '--project', root, '--no-render'], io);
    await cli.dispatch(['submodule', 'add', '--feature', 'register', '--slug', 'api', '--kind', 'api', '--role', 'Endpoint', '--project', root, '--no-render'], io);
    const baseYamlBefore = fs.readFileSync(path.join(root, 'resources/project-architecture/atlas/features/register.yaml'), 'utf8');

    const specDir = path.join(root, 'docs/plans/2026-05-11/two-fa');
    fs.mkdirSync(specDir, { recursive: true });
    await cli.dispatch(['submodule', 'add', '--feature', 'register', '--slug', '2fa', '--kind', 'service', '--role', 'TOTP', '--spec', 'docs/plans/2026-05-11/two-fa', '--project', root, '--no-open'], io);

    const baseYamlAfter = fs.readFileSync(path.join(root, 'resources/project-architecture/atlas/features/register.yaml'), 'utf8');
    assert.equal(baseYamlAfter, baseYamlBefore, 'base feature YAML must not change in spec mode');

    const overlayYaml = fs.readFileSync(path.join(specDir, 'architecture_diff/atlas/features/register.yaml'), 'utf8');
    assert.match(overlayYaml, /2fa/);
    assert.ok(fs.existsSync(path.join(specDir, 'architecture_diff/features/register/2fa.html')));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('feature remove in --spec records the removal in _removed.yaml', async () => {
  const root = mkProject();
  try {
    const io = makeIo();
    await cli.dispatch(['feature', 'add', '--slug', 'legacy', '--project', root, '--no-render'], io);
    await cli.dispatch(['submodule', 'add', '--feature', 'legacy', '--slug', 'svc', '--project', root, '--no-render'], io);
    const specDir = path.join(root, 'docs/plans/2026-05-11/drop-legacy');
    fs.mkdirSync(specDir, { recursive: true });
    await cli.dispatch(['feature', 'remove', '--slug', 'legacy', '--spec', 'docs/plans/2026-05-11/drop-legacy', '--project', root, '--no-open'], io);
    const removed = fs.readFileSync(path.join(specDir, 'architecture_diff/atlas/_removed.yaml'), 'utf8');
    assert.match(removed, /legacy/);
    const removedTxt = fs.readFileSync(path.join(specDir, 'architecture_diff/_removed.txt'), 'utf8');
    assert.match(removedTxt, /features\/legacy\/index\.html/);
    assert.match(removedTxt, /features\/legacy\/svc\.html/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('validate flags missing/unknown references after mutation', async () => {
  const root = mkProject();
  try {
    const io1 = makeIo();
    await cli.dispatch(['feature', 'add', '--slug', 'register', '--project', root, '--no-render'], io1);
    await cli.dispatch(['submodule', 'add', '--feature', 'register', '--slug', 'api', '--kind', 'api', '--project', root, '--no-render'], io1);

    // Directly corrupt the feature YAML to reference a missing submodule via an edge
    const featureFile = path.join(root, 'resources/project-architecture/atlas/features/register.yaml');
    const yaml = fs.readFileSync(featureFile, 'utf8');
    const replaced = yaml.replace(/^edges:.*$/m, 'edges:\n  - id: bad\n    from: ghost\n    to: api\n    kind: call\n    label: oops');
    fs.writeFileSync(featureFile, replaced);

    const io2 = makeIo();
    const code = await cli.dispatch(['validate', '--project', root], io2);
    assert.equal(code, 1);
    assert.match(io2.stderr_text, /unknown submodule "ghost"/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('undo restores the previous base state', async () => {
  const root = mkProject();
  try {
    const io = makeIo();
    await cli.dispatch(['feature', 'add', '--slug', 'register', '--title', 'Register', '--project', root, '--no-render'], io);
    await cli.dispatch(['submodule', 'add', '--feature', 'register', '--slug', 'ui', '--kind', 'ui', '--project', root, '--no-render'], io);
    await cli.dispatch(['submodule', 'add', '--feature', 'register', '--slug', 'api', '--kind', 'api', '--project', root, '--no-render'], io);
    let state = stateLib.load(path.join(root, 'resources/project-architecture/atlas'));
    assert.equal(state.features[0].submodules.length, 2);
    await cli.dispatch(['undo', '--project', root, '--no-render'], io);
    state = stateLib.load(path.join(root, 'resources/project-architecture/atlas'));
    assert.equal(state.features[0].submodules.length, 1);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('help prints usage and exits 0', async () => {
  const io = makeIo();
  const code = await cli.dispatch(['help'], io);
  assert.equal(code, 0);
  assert.match(io.stdout_text, /apltk architecture/);
  assert.match(io.stdout_text, /feature add\|set\|remove/);
});

test('parseEndpoint accepts "feature/submodule" and rejects empty values', async () => {
  const root = mkProject();
  try {
    const io = makeIo();
    await cli.dispatch(['feature', 'add', '--slug', 'a', '--project', root, '--no-render'], io);
    await cli.dispatch(['submodule', 'add', '--feature', 'a', '--slug', 's', '--project', root, '--no-render'], io);
    const code = await cli.dispatch(['edge', 'add', '--from', '', '--to', 'a/s', '--project', root, '--no-render'], io);
    assert.equal(code, 1);
    assert.match(io.stderr_text, /Invalid endpoint|--from/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
