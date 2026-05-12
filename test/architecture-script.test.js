const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const architecture = require('../init-project-html/scripts/architecture.js');
const atlasCli = require('../init-project-html/lib/atlas/cli');
const { listToolCommands, resolveToolCommand } = require('../lib/tool-runner');
const { parseArguments, buildHelpText } = require('../lib/cli');

function makeIo() {
  let stdoutBuf = '';
  let stderrBuf = '';
  return {
    stdout: { write: (s) => { stdoutBuf += s; } },
    stderr: { write: (s) => { stderrBuf += s; } },
    get stdout_text() { return stdoutBuf; },
    get stderr_text() { return stderrBuf; },
  };
}

function makeFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aplt-arch-'));
  const atlasDir = path.join(root, 'resources', 'project-architecture');
  fs.mkdirSync(path.join(atlasDir, 'features', 'invite-code-registration'), { recursive: true });
  fs.mkdirSync(path.join(atlasDir, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(atlasDir, 'index.html'), '<html><body>atlas</body></html>');
  fs.writeFileSync(path.join(atlasDir, 'features', 'invite-code-registration', 'index.html'), '<html><body>feature</body></html>');
  fs.writeFileSync(
    path.join(atlasDir, 'features', 'invite-code-registration', 'registration-service.html'),
    '<html><body>service before</body></html>',
  );
  fs.writeFileSync(
    path.join(atlasDir, 'features', 'invite-code-registration', 'legacy-page.html'),
    '<html><body>legacy</body></html>',
  );
  fs.writeFileSync(path.join(atlasDir, 'assets', 'architecture.css'), 'body{}');
  return root;
}

function makeSpec(root, specPath, files) {
  const specDir = path.join(root, specPath);
  fs.mkdirSync(specDir, { recursive: true });
  fs.writeFileSync(path.join(specDir, 'spec.md'), '# spec\n');
  const diffDir = path.join(specDir, 'architecture_diff');
  fs.mkdirSync(path.join(diffDir, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(diffDir, 'assets', 'architecture.css'), 'body{}');
  for (const [rel, contents] of Object.entries(files.afters || {})) {
    const full = path.join(diffDir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, contents);
  }
  if (files.removed && files.removed.length > 0) {
    fs.writeFileSync(path.join(diffDir, '_removed.txt'), files.removed.join('\n') + '\n');
  }
  return diffDir;
}

test('architecture tool is registered with node runner', () => {
  const tools = listToolCommands();
  const tool = tools.find((entry) => entry.name === 'architecture');
  assert.ok(tool, 'architecture tool should be registered');
  assert.equal(tool.runner, 'node');
  assert.equal(tool.skill, 'init-project-html');
  const resolved = resolveToolCommand('architecture', '/repo');
  assert.equal(resolved.scriptPath, '/repo/init-project-html/scripts/architecture.js');
});

test('parseArguments routes architecture invocation through tool dispatch', () => {
  const parsed = parseArguments(['architecture', 'diff', '--no-open']);
  assert.equal(parsed.command, 'tool');
  assert.equal(parsed.toolName, 'architecture');
  assert.deepEqual(parsed.toolArgs, ['diff', '--no-open']);
});

test('buildHelpText surfaces architecture examples', () => {
  const text = buildHelpText({ version: '0.0.0', colorEnabled: false });
  assert.match(text, /apltk architecture/);
  assert.match(text, /architecture diff/);
});

test('parseArgs supports default open, explicit diff, and flags', () => {
  assert.equal(architecture.parseArgs([]).subcommand, 'open');
  assert.equal(architecture.parseArgs(['open']).subcommand, 'open');
  assert.equal(architecture.parseArgs(['diff']).subcommand, 'diff');
  const parsed = architecture.parseArgs(['diff', '--project', '/p', '--out', '/o', '--no-open']);
  assert.equal(parsed.subcommand, 'diff');
  assert.equal(parsed.projectRoot, path.resolve('/p'));
  assert.equal(parsed.out, path.resolve('/o'));
  assert.equal(parsed.open, false);
});

test('parseArgs rejects unknown flags', () => {
  assert.throws(() => architecture.parseArgs(['--what']));
});

test('open subcommand prints atlas path and exits 0', () => {
  const root = makeFixture();
  try {
    const io = makeIo();
    const code = architecture.main(['open', '--project', root, '--no-open'], io);
    assert.equal(code, 0);
    assert.match(io.stdout_text, /resources\/project-architecture\/index\.html/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('open subcommand bootstraps atlas when resources tree is empty (... --project root)', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aplt-empty-'));
  try {
    const io = makeIo();
    const code = architecture.main(['open', '--project', root, '--no-open'], io);
    assert.equal(code, 0);
    assert.match(io.stdout_text, /resources\/project-architecture\/index\.html/);
    assert.ok(fs.existsSync(path.join(root, 'resources', 'project-architecture', 'index.html')));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('diff classifies modified, added, removed using path alignment', () => {
  const root = makeFixture();
  try {
    makeSpec(root, 'docs/plans/2026-05-11/invite-rotation', {
      afters: {
        'features/invite-code-registration/registration-service.html': '<html><body>service after</body></html>',
        'features/invite-code-registration/new-page.html': '<html><body>new</body></html>',
      },
      removed: ['features/invite-code-registration/legacy-page.html'],
    });

    const changes = architecture.collectChanges(root);
    const byRel = Object.fromEntries(changes.map((c) => [c.rel, c]));
    assert.equal(byRel['features/invite-code-registration/registration-service.html'].kind, 'modified');
    assert.equal(byRel['features/invite-code-registration/new-page.html'].kind, 'added');
    assert.equal(byRel['features/invite-code-registration/legacy-page.html'].kind, 'removed');

    const modified = byRel['features/invite-code-registration/registration-service.html'];
    assert.ok(modified.beforePath && modified.afterPath);

    const added = byRel['features/invite-code-registration/new-page.html'];
    assert.equal(added.beforePath, null);
    assert.ok(added.afterPath);

    const removed = byRel['features/invite-code-registration/legacy-page.html'];
    assert.ok(removed.beforePath);
    assert.equal(removed.afterPath, null);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('diff drops removed entries whose before file is absent', () => {
  const root = makeFixture();
  try {
    makeSpec(root, 'docs/plans/2026-05-11/ghost', {
      afters: {},
      removed: ['features/invite-code-registration/does-not-exist.html'],
    });
    const changes = architecture.collectChanges(root);
    assert.equal(changes.length, 0);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('diff handles batch specs by reading each member architecture_diff', () => {
  const root = makeFixture();
  try {
    makeSpec(root, 'docs/plans/2026-05-11/batch/member-a', {
      afters: { 'features/invite-code-registration/registration-service.html': '<x/>' },
    });
    makeSpec(root, 'docs/plans/2026-05-11/batch/member-b', {
      afters: { 'features/invite-code-registration/new-feature.html': '<y/>' },
    });
    const changes = architecture.collectChanges(root);
    const specs = new Set(changes.map((c) => c.spec));
    assert.ok([...specs].some((s) => s.endsWith('member-a')));
    assert.ok([...specs].some((s) => s.endsWith('member-b')));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('diff writes viewer HTML with relative iframe paths', () => {
  const root = makeFixture();
  try {
    makeSpec(root, 'docs/plans/2026-05-11/invite-rotation', {
      afters: {
        'features/invite-code-registration/registration-service.html': '<html><body>service after</body></html>',
      },
    });

    const io = makeIo();
    const code = architecture.main(['diff', '--project', root, '--no-open'], io);
    assert.equal(code, 0);
    const indexPath = path.join(root, '.apollo-toolkit', 'architecture-diff', 'index.html');
    assert.ok(fs.existsSync(indexPath));
    const html = fs.readFileSync(indexPath, 'utf8');
    assert.match(html, /architecture diff/);
    assert.match(
      html,
      /\.\.\/\.\.\/resources\/project-architecture\/features\/invite-code-registration\/registration-service\.html/,
    );
    assert.match(
      html,
      /\.\.\/\.\.\/docs\/plans\/2026-05-11\/invite-rotation\/architecture_diff\/features\/invite-code-registration\/registration-service\.html/,
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('diff respects custom --out path', () => {
  const root = makeFixture();
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aplt-out-'));
  try {
    makeSpec(root, 'docs/plans/2026-05-11/test', {
      afters: { 'features/invite-code-registration/registration-service.html': '<x/>' },
    });
    const io = makeIo();
    const code = architecture.main(['diff', '--project', root, '--out', outDir, '--no-open'], io);
    assert.equal(code, 0);
    assert.ok(fs.existsSync(path.join(outDir, 'index.html')));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(outDir, { recursive: true, force: true });
  }
});

test('diff renders an empty-state viewer when no architecture_diff dirs exist', () => {
  const root = makeFixture();
  try {
    const io = makeIo();
    const code = architecture.main(['diff', '--project', root, '--no-open'], io);
    assert.equal(code, 0);
    const html = fs.readFileSync(path.join(root, '.apollo-toolkit', 'architecture-diff', 'index.html'), 'utf8');
    assert.match(html, /No architecture diffs found/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('legacy diff command merges batch overlays into one macro page', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aplt-arch-batch-'));
  try {
    await atlasCli.dispatch(['feature', 'add', '--slug', 'register', '--project', root, '--no-open'], makeIo());
    await atlasCli.dispatch(['submodule', 'add', '--feature', 'register', '--slug', 'api', '--kind', 'api', '--project', root, '--no-open'], makeIo());

    const batchRoot = path.join(root, 'docs/plans/2026-05-12/legacy-batch');
    fs.mkdirSync(batchRoot, { recursive: true });
    fs.writeFileSync(path.join(batchRoot, 'coordination.md'), '# coordination\n');
    fs.mkdirSync(path.join(batchRoot, 'member-a'), { recursive: true });
    fs.mkdirSync(path.join(batchRoot, 'member-b'), { recursive: true });

    await atlasCli.dispatch(['feature', 'add', '--slug', 'billing', '--title', 'Billing', '--spec', 'docs/plans/2026-05-12/legacy-batch/member-a', '--project', root, '--no-open'], makeIo());
    await atlasCli.dispatch(['submodule', 'add', '--feature', 'billing', '--slug', 'api', '--kind', 'api', '--spec', 'docs/plans/2026-05-12/legacy-batch/member-a', '--project', root, '--no-open'], makeIo());
    await atlasCli.dispatch(['feature', 'add', '--slug', 'profile', '--title', 'Profile', '--spec', 'docs/plans/2026-05-12/legacy-batch/member-b', '--project', root, '--no-open'], makeIo());
    await atlasCli.dispatch(['submodule', 'add', '--feature', 'profile', '--slug', 'ui', '--kind', 'ui', '--spec', 'docs/plans/2026-05-12/legacy-batch/member-b', '--project', root, '--no-open'], makeIo());

    const io = makeIo();
    const code = architecture.main(['diff', '--project', root, '--no-open'], io);
    assert.equal(code, 0);
    assert.match(io.stdout_text, /Diff pages: 5/);
    const html = fs.readFileSync(path.join(root, '.apollo-toolkit', 'architecture-diff', 'index.html'), 'utf8');
    const macroMatches = html.match(/"rel":"index\.html"/g) || [];
    assert.equal(macroMatches.length, 1);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
