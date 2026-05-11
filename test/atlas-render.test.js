'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const render = require('../init-project-html/lib/atlas/render');
const { layoutMacro, assertNoOverlap } = require('../init-project-html/lib/atlas/layout');

function fixtureState() {
  return {
    meta: { title: 'Demo atlas', summary: 'Tiny demo' },
    actors: [],
    features: [
      {
        slug: 'register', title: 'Register', story: 'A user creates an account.', dependsOn: [],
        submodules: [
          { slug: 'ui', kind: 'ui', role: 'Renders form', functions: [{ name: 'submit', in: 'evt', out: 'void', side: 'io', purpose: 'send form' }], variables: [{ name: 'email', type: 'string', scope: 'call', purpose: 'user id' }], dataflow: ['collect', 'post', 'show result'], errors: [{ name: 'NetErr', when: 'API fails', means: 'banner' }] },
          { slug: 'api', kind: 'api', role: 'HTTP endpoint', functions: [], variables: [], dataflow: [], errors: [] },
        ],
        edges: [{ id: 'e1', from: 'ui', to: 'api', kind: 'call', label: 'POST /register' }],
      },
      {
        slug: 'invite', title: 'Invite codes', story: '', dependsOn: [],
        submodules: [{ slug: 'svc', kind: 'service', role: 'mint codes', functions: [], variables: [], dataflow: [], errors: [] }],
        edges: [],
      },
    ],
    edges: [{ id: 'cross', from: { feature: 'invite', submodule: 'svc' }, to: { feature: 'register', submodule: 'api' }, kind: 'data-row', label: 'code lookup' }],
  };
}

function mkTmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'aplt-atlas-render-'));
}

test('layoutMacro produces non-overlapping rectangles with absolute coordinates', async () => {
  const layout = await layoutMacro(fixtureState());
  assert.equal(layout.empty, false);
  assert.equal(layout.features.length, 2);
  assert.equal(layout.submodules.length, 3);
  for (const sub of layout.submodules) {
    assert.ok(sub.width > 0 && sub.height > 0);
    assert.ok(sub.x >= 0 && sub.y >= 0);
  }
  // explicit second check (layoutMacro already invokes it but we want a regression guard)
  assertNoOverlap(layout);
});

test('renderAll emits macro, feature, and submodule HTML plus assets', async () => {
  const out = mkTmp();
  try {
    const result = await render.renderAll({ outDir: out, state: fixtureState() });
    assert.ok(result.written.includes('index.html'));
    assert.ok(result.written.includes('features/register/index.html'));
    assert.ok(result.written.includes('features/register/ui.html'));
    assert.ok(result.written.includes('features/invite/svc.html'));
    assert.ok(fs.existsSync(path.join(out, 'assets', 'architecture.css')));
    assert.ok(fs.existsSync(path.join(out, 'assets', 'viewer.client.js')));
    const macroHtml = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
    assert.match(macroHtml, /atlas-svg/);
    assert.match(macroHtml, /m-cluster/);
    assert.match(macroHtml, /m-node/);
    assert.match(macroHtml, /viewer\.client\.js/);
    const subHtml = fs.readFileSync(path.join(out, 'features', 'register', 'ui.html'), 'utf8');
    assert.match(subHtml, /sub-io/);
    assert.match(subHtml, /sub-vars/);
    assert.match(subHtml, /sub-dataflow/);
    assert.match(subHtml, /sub-errors/);
  } finally {
    fs.rmSync(out, { recursive: true, force: true });
  }
});

test('renderAll honours scope and emits only requested pages', async () => {
  const out = mkTmp();
  try {
    const scope = {
      macro: false,
      features: new Set(['register']),
      submodules: [{ feature: 'register', submodule: 'ui' }],
    };
    const result = await render.renderAll({ outDir: out, state: fixtureState(), scope });
    assert.deepEqual(
      result.written.sort(),
      ['features/register/index.html', 'features/register/ui.html'].sort(),
    );
    assert.equal(fs.existsSync(path.join(out, 'index.html')), false);
    assert.equal(fs.existsSync(path.join(out, 'features', 'invite', 'svc.html')), false);
  } finally {
    fs.rmSync(out, { recursive: true, force: true });
  }
});

test('renderAll writes _removed.txt when removedPaths supplied', async () => {
  const out = mkTmp();
  try {
    const removedPaths = ['features/legacy/index.html', 'features/register/old.html'];
    await render.renderAll({ outDir: out, state: fixtureState(), removedPaths });
    const removedFile = fs.readFileSync(path.join(out, '_removed.txt'), 'utf8');
    assert.match(removedFile, /features\/legacy\/index\.html/);
    assert.match(removedFile, /features\/register\/old\.html/);
  } finally {
    fs.rmSync(out, { recursive: true, force: true });
  }
});

test('renderAll renders an empty atlas with a placeholder SVG', async () => {
  const out = mkTmp();
  try {
    const result = await render.renderAll({ outDir: out, state: { meta: { title: 'empty' }, actors: [], features: [], edges: [] } });
    assert.deepEqual(result.written, ['index.html']);
    const html = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
    assert.match(html, /Atlas has no features yet/);
  } finally {
    fs.rmSync(out, { recursive: true, force: true });
  }
});

test('renderAll escapes user-supplied strings to prevent HTML injection', async () => {
  const out = mkTmp();
  try {
    const state = fixtureState();
    state.meta.title = "<script>alert('xss')</script>";
    state.features[0].submodules[0].role = "<img src=x onerror=alert(1)>";
    await render.renderAll({ outDir: out, state });
    const macro = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
    assert.ok(macro.includes('&lt;script&gt;'));
    assert.ok(!macro.includes('<script>alert'));
    const sub = fs.readFileSync(path.join(out, 'features', 'register', 'ui.html'), 'utf8');
    assert.ok(sub.includes('&lt;img'));
  } finally {
    fs.rmSync(out, { recursive: true, force: true });
  }
});
