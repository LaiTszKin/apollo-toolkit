#!/usr/bin/env node
// architecture.js — open the project HTML architecture atlas, or render
// a paginated before/after diff viewer from every active spec's
// architecture_diff/ directory under docs/plans/.
//
// Usage:
//   architecture.js                                 # same as `open`
//   architecture.js open  [--project <root>] [--no-open]
//   architecture.js diff  [--project <root>] [--out <dir>] [--no-open]
//   architecture.js --help

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const ATLAS_REL = path.join('resources', 'project-architecture', 'index.html');
const RESOURCES_REL = path.join('resources', 'project-architecture');
const PLANS_REL = path.join('docs', 'plans');
const DIFF_DIRNAME = 'architecture_diff';
const REMOVED_FILE = '_removed.txt';
const DEFAULT_OUT_REL = path.join('.apollo-toolkit', 'architecture-diff');

const USAGE = `apltk architecture — open the project architecture atlas or its diff viewer.

Usage:
  apltk architecture                      Open resources/project-architecture/index.html
  apltk architecture open                 Same as above
  apltk architecture diff                 Render every architecture_diff/ as one paginated viewer
  apltk architecture --help               Show this help

Options:
  --project <root>   Override project root (default: nearest ancestor with resources/project-architecture/index.html)
  --out <dir>        Override viewer output dir (default: <project>/${DEFAULT_OUT_REL})
  --no-open          Skip launching the browser (CI/test friendly)
  -h, --help         Show this help`;

function parseArgs(argv) {
  const args = [...argv];
  const result = {
    subcommand: 'open',
    projectRoot: null,
    out: null,
    open: true,
    help: false,
  };

  if (args.length > 0 && !args[0].startsWith('-')) {
    const candidate = args[0];
    if (candidate === 'open' || candidate === 'diff') {
      result.subcommand = candidate;
      args.shift();
    }
  }

  while (args.length > 0) {
    const arg = args.shift();
    if (arg === '--help' || arg === '-h') {
      result.help = true;
    } else if (arg === '--project') {
      const value = args.shift();
      if (!value) throw new Error('Missing value for --project');
      result.projectRoot = path.resolve(value);
    } else if (arg === '--out') {
      const value = args.shift();
      if (!value) throw new Error('Missing value for --out');
      result.out = path.resolve(value);
    } else if (arg === '--no-open') {
      result.open = false;
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }

  return result;
}

function findProjectRoot(startDir) {
  let dir = path.resolve(startDir);
  while (true) {
    if (fs.existsSync(path.join(dir, ATLAS_REL))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function openInBrowser(filePath) {
  const platform = process.platform;
  let command;
  let args;
  if (platform === 'darwin') {
    command = 'open';
    args = [filePath];
  } else if (platform === 'win32') {
    command = 'cmd';
    args = ['/c', 'start', '""', filePath];
  } else {
    command = 'xdg-open';
    args = [filePath];
  }
  try {
    const child = spawn(command, args, { stdio: 'ignore', detached: true });
    child.on('error', () => { /* best effort */ });
    child.unref();
  } catch (_err) {
    /* best effort */
  }
}

function walkArchitectureDiffDirs(plansRoot) {
  const result = [];
  if (!fs.existsSync(plansRoot)) return result;

  function recurse(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (_err) {
      return;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      const full = path.join(dir, entry.name);
      if (entry.name === DIFF_DIRNAME) {
        result.push(full);
        continue;
      }
      recurse(full);
    }
  }
  recurse(plansRoot);
  return result;
}

function walkAfterStateHtml(diffDir) {
  const out = [];
  function recurse(dir, relParts) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (_err) {
      return;
    }
    for (const entry of entries) {
      if (entry.name === 'assets') continue;
      if (entry.name === REMOVED_FILE) continue;
      if (entry.name.startsWith('.')) continue;
      const full = path.join(dir, entry.name);
      const nextRel = [...relParts, entry.name];
      if (entry.isDirectory()) {
        recurse(full, nextRel);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) {
        out.push({ abs: full, rel: nextRel.join('/') });
      }
    }
  }
  recurse(diffDir, []);
  return out;
}

function readRemovedManifest(diffDir) {
  const manifestPath = path.join(diffDir, REMOVED_FILE);
  if (!fs.existsSync(manifestPath)) return [];
  return fs.readFileSync(manifestPath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
}

function collectChanges(projectRoot) {
  const resourcesRoot = path.join(projectRoot, RESOURCES_REL);
  const plansRoot = path.join(projectRoot, PLANS_REL);
  const diffDirs = walkArchitectureDiffDirs(plansRoot);
  const changes = [];

  for (const diffDir of diffDirs) {
    const specDir = path.dirname(diffDir);
    const specLabel = path.relative(projectRoot, specDir);

    for (const after of walkAfterStateHtml(diffDir)) {
      const beforeAbs = path.join(resourcesRoot, after.rel);
      const beforeExists = fs.existsSync(beforeAbs);
      changes.push({
        kind: beforeExists ? 'modified' : 'added',
        rel: after.rel,
        spec: specLabel,
        beforePath: beforeExists ? path.relative(projectRoot, beforeAbs) : null,
        afterPath: path.relative(projectRoot, after.abs),
      });
    }

    for (const removedRel of readRemovedManifest(diffDir)) {
      const beforeAbs = path.join(resourcesRoot, removedRel);
      if (!fs.existsSync(beforeAbs)) continue;
      changes.push({
        kind: 'removed',
        rel: removedRel,
        spec: specLabel,
        beforePath: path.relative(projectRoot, beforeAbs),
        afterPath: null,
      });
    }
  }

  changes.sort((a, b) => {
    if (a.spec !== b.spec) return a.spec.localeCompare(b.spec);
    if (a.kind !== b.kind) return a.kind.localeCompare(b.kind);
    return a.rel.localeCompare(b.rel);
  });

  return changes;
}

function htmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toViewerRel(outDir, projectRoot, projectRelPath) {
  if (!projectRelPath) return null;
  const absolute = path.resolve(projectRoot, projectRelPath);
  const rel = path.relative(outDir, absolute);
  return rel.split(path.sep).join('/');
}

function renderViewer({ changes, projectRoot, outDir }) {
  const pages = changes.map((change) => ({
    kind: change.kind,
    rel: change.rel,
    spec: change.spec,
    beforeSrc: toViewerRel(outDir, projectRoot, change.beforePath),
    afterSrc: toViewerRel(outDir, projectRoot, change.afterPath),
  }));

  const summary = {
    total: pages.length,
    modified: pages.filter((p) => p.kind === 'modified').length,
    added: pages.filter((p) => p.kind === 'added').length,
    removed: pages.filter((p) => p.kind === 'removed').length,
    projectRoot,
  };

  const payload = JSON.stringify({ pages, summary });

  return `<!DOCTYPE html>
<html lang="en" data-atlas="diff-viewer">
<head>
  <meta charset="utf-8">
  <title>Architecture diff — ${htmlEscape(path.basename(projectRoot))}</title>
  <style>
    :root {
      color-scheme: light dark;
      --bg: #0f172a;
      --panel: #1e293b;
      --text: #e2e8f0;
      --muted: #94a3b8;
      --accent: #38bdf8;
      --added: #4ade80;
      --removed: #f87171;
      --modified: #facc15;
    }
    * { box-sizing: border-box; }
    html, body { height: 100%; margin: 0; font-family: ui-sans-serif, system-ui, sans-serif; background: var(--bg); color: var(--text); }
    body { display: flex; flex-direction: column; min-height: 100vh; }
    header { padding: 12px 20px; background: var(--panel); border-bottom: 1px solid #334155; display: flex; flex-wrap: wrap; gap: 12px; align-items: center; justify-content: space-between; }
    header .title { font-size: 14px; color: var(--muted); }
    header .title strong { color: var(--text); }
    header .summary { display: flex; gap: 12px; font-size: 12px; color: var(--muted); }
    header .summary span.count { font-weight: 600; }
    header .summary .modified { color: var(--modified); }
    header .summary .added { color: var(--added); }
    header .summary .removed { color: var(--removed); }
    main { flex: 1; display: flex; flex-direction: column; }
    .meta { padding: 10px 20px; background: var(--bg); border-bottom: 1px solid #334155; display: flex; flex-wrap: wrap; gap: 16px; align-items: center; justify-content: space-between; font-size: 13px; }
    .meta .left { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; border: 1px solid currentColor; }
    .badge.modified { color: var(--modified); }
    .badge.added { color: var(--added); }
    .badge.removed { color: var(--removed); }
    .path { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: var(--text); }
    .spec { color: var(--muted); font-size: 12px; }
    .nav { display: flex; align-items: center; gap: 8px; }
    .nav button { background: transparent; color: var(--text); border: 1px solid #475569; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 13px; }
    .nav button:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
    .nav button:disabled { opacity: 0.4; cursor: not-allowed; }
    .nav .counter { font-variant-numeric: tabular-nums; color: var(--muted); min-width: 72px; text-align: center; }
    .frames { flex: 1; display: grid; gap: 1px; background: #334155; padding: 1px; min-height: 0; }
    .frames.split { grid-template-columns: 1fr 1fr; }
    .frames.single { grid-template-columns: 1fr; }
    .pane { background: #ffffff; display: flex; flex-direction: column; min-height: 0; }
    .pane h2 { margin: 0; padding: 8px 14px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; background: #f1f5f9; color: #1e293b; border-bottom: 1px solid #cbd5f5; display: flex; align-items: center; gap: 8px; }
    .pane h2 .side-badge { font-size: 10px; padding: 1px 6px; border-radius: 4px; background: #cbd5f5; color: #1e293b; }
    .pane h2.before .side-badge { background: #fee2e2; color: #991b1b; }
    .pane h2.after .side-badge { background: #dcfce7; color: #166534; }
    .pane iframe { flex: 1; width: 100%; border: 0; background: #ffffff; }
    .empty { display: flex; align-items: center; justify-content: center; padding: 32px; font-size: 14px; color: var(--muted); }
    footer { padding: 8px 20px; background: var(--panel); border-top: 1px solid #334155; font-size: 12px; color: var(--muted); }
    footer kbd { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; background: #0f172a; padding: 1px 6px; border-radius: 4px; border: 1px solid #475569; }
  </style>
</head>
<body>
  <header>
    <div class="title">Apollo Toolkit · <strong>architecture diff</strong> · ${htmlEscape(path.basename(projectRoot))}</div>
    <div class="summary">
      <span><span class="count">${summary.total}</span> change<span>${summary.total === 1 ? '' : 's'}</span></span>
      <span class="modified"><span class="count">${summary.modified}</span> modified</span>
      <span class="added"><span class="count">${summary.added}</span> added</span>
      <span class="removed"><span class="count">${summary.removed}</span> removed</span>
    </div>
  </header>
  <main>
    <div class="meta">
      <div class="left">
        <span id="badge" class="badge modified">modified</span>
        <span class="path" id="path">—</span>
        <span class="spec" id="spec">—</span>
      </div>
      <div class="nav">
        <button id="prev" type="button" aria-label="Previous change">← Prev</button>
        <span class="counter" id="counter">0 / 0</span>
        <button id="next" type="button" aria-label="Next change">Next →</button>
      </div>
    </div>
    <div class="frames" id="frames">
      <div class="empty" id="empty">No architecture diffs found under docs/plans/**/architecture_diff/.</div>
    </div>
  </main>
  <footer>
    Navigate with <kbd>←</kbd> / <kbd>→</kbd> or the buttons above. Each page pairs the current atlas (left) with the proposed-after HTML (right) for one affected page.
  </footer>
  <script id="__diff_payload" type="application/json">${payload.replace(/</g, '\\u003c')}</script>
  <script>
    (function () {
      const data = JSON.parse(document.getElementById('__diff_payload').textContent);
      const pages = data.pages || [];
      const framesEl = document.getElementById('frames');
      const emptyEl = document.getElementById('empty');
      const badgeEl = document.getElementById('badge');
      const pathEl = document.getElementById('path');
      const specEl = document.getElementById('spec');
      const counterEl = document.getElementById('counter');
      const prevBtn = document.getElementById('prev');
      const nextBtn = document.getElementById('next');

      if (pages.length === 0) {
        counterEl.textContent = '0 / 0';
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        return;
      }

      let index = 0;

      function render() {
        const page = pages[index];
        badgeEl.className = 'badge ' + page.kind;
        badgeEl.textContent = page.kind;
        pathEl.textContent = page.rel;
        specEl.textContent = page.spec;
        counterEl.textContent = (index + 1) + ' / ' + pages.length;
        prevBtn.disabled = index === 0;
        nextBtn.disabled = index === pages.length - 1;

        framesEl.innerHTML = '';
        if (page.kind === 'modified') {
          framesEl.className = 'frames split';
          framesEl.appendChild(buildPane('Before', page.beforeSrc, 'before'));
          framesEl.appendChild(buildPane('After', page.afterSrc, 'after'));
        } else if (page.kind === 'added') {
          framesEl.className = 'frames single';
          framesEl.appendChild(buildPane('After (new)', page.afterSrc, 'after'));
        } else if (page.kind === 'removed') {
          framesEl.className = 'frames single';
          framesEl.appendChild(buildPane('Before (removed)', page.beforeSrc, 'before'));
        }
      }

      function buildPane(label, src, side) {
        const pane = document.createElement('div');
        pane.className = 'pane';
        const heading = document.createElement('h2');
        heading.className = side;
        const sideBadge = document.createElement('span');
        sideBadge.className = 'side-badge';
        sideBadge.textContent = side;
        heading.appendChild(sideBadge);
        heading.appendChild(document.createTextNode(' ' + label));
        pane.appendChild(heading);
        const frame = document.createElement('iframe');
        frame.src = src;
        frame.loading = 'lazy';
        frame.title = label;
        pane.appendChild(frame);
        return pane;
      }

      prevBtn.addEventListener('click', () => { if (index > 0) { index--; render(); } });
      nextBtn.addEventListener('click', () => { if (index < pages.length - 1) { index++; render(); } });
      document.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') { prevBtn.click(); }
        else if (event.key === 'ArrowRight') { nextBtn.click(); }
      });

      emptyEl.remove();
      render();
    })();
  </script>
</body>
</html>
`;
}

function runOpen(opts, io) {
  const projectRoot = opts.projectRoot || findProjectRoot(process.cwd());
  if (!projectRoot) {
    io.stderr.write(
      `Could not find resources/project-architecture/index.html. Pass --project <root> or generate the atlas via the init-project-html skill.\n`,
    );
    return 1;
  }
  const atlas = path.join(projectRoot, ATLAS_REL);
  if (!fs.existsSync(atlas)) {
    io.stderr.write(`Atlas not found: ${atlas}\n`);
    return 1;
  }
  io.stdout.write(`${atlas}\n`);
  if (opts.open) openInBrowser(atlas);
  return 0;
}

function runDiff(opts, io) {
  const projectRoot = opts.projectRoot || findProjectRoot(process.cwd());
  if (!projectRoot) {
    io.stderr.write(
      `Could not find resources/project-architecture/index.html. Pass --project <root> or generate the atlas via the init-project-html skill.\n`,
    );
    return 1;
  }

  const outDir = opts.out || path.join(projectRoot, DEFAULT_OUT_REL);
  fs.mkdirSync(outDir, { recursive: true });

  const changes = collectChanges(projectRoot);
  const html = renderViewer({ changes, projectRoot, outDir });
  const indexPath = path.join(outDir, 'index.html');
  fs.writeFileSync(indexPath, html, 'utf8');

  io.stdout.write(`${indexPath}\n`);
  io.stdout.write(
    `Diff pages: ${changes.length} (modified=${changes.filter((c) => c.kind === 'modified').length}, added=${changes.filter((c) => c.kind === 'added').length}, removed=${changes.filter((c) => c.kind === 'removed').length})\n`,
  );
  if (opts.open) openInBrowser(indexPath);
  return 0;
}

function main(argv, io = { stdout: process.stdout, stderr: process.stderr }) {
  let opts;
  try {
    opts = parseArgs(argv);
  } catch (error) {
    io.stderr.write(`${error.message}\n\n${USAGE}\n`);
    return 1;
  }
  if (opts.help) {
    io.stdout.write(`${USAGE}\n`);
    return 0;
  }
  if (opts.subcommand === 'open') return runOpen(opts, io);
  if (opts.subcommand === 'diff') return runDiff(opts, io);
  io.stderr.write(`Unknown subcommand: ${opts.subcommand}\n\n${USAGE}\n`);
  return 1;
}

if (require.main === module) {
  const code = main(process.argv.slice(2));
  process.exit(code);
}

module.exports = {
  parseArgs,
  findProjectRoot,
  collectChanges,
  renderViewer,
  toViewerRel,
  walkArchitectureDiffDirs,
  walkAfterStateHtml,
  readRemovedManifest,
  main,
};
