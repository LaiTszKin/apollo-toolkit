#!/usr/bin/env node
// architecture.js — thin shim over lib/atlas/cli.js.
//
// Backward-compatible legacy entrypoint:
//   architecture.js                                # same as `open`
//   architecture.js open  [--project <root>] [--no-open]
//   architecture.js diff  [--project <root>] [--out <dir>] [--no-open]
//
// All new declarative verbs (feature add, submodule add, function add,
// variable add, dataflow add|remove|reorder, error add, edge add, meta
// set, actor add, render, validate, undo) are routed through
// lib/atlas/cli.js, which owns layout, no-overlap, DOM, CSS, and pan/zoom.

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');

const newCli = require('../lib/atlas/cli');

const ATLAS_REL = path.join('resources', 'project-architecture', 'index.html');
const RESOURCES_REL = path.join('resources', 'project-architecture');
const PLANS_REL = path.join('docs', 'plans');
const DIFF_DIRNAME = 'architecture_diff';
const REMOVED_FILE = '_removed.txt';
const ATLAS_DIRNAME = 'atlas';
const DEFAULT_OUT_REL = path.join('.apollo-toolkit', 'architecture-diff');

const LEGACY_VERBS = new Set(['open', 'diff']);

const USAGE = `apltk architecture — declarative atlas CLI.

Usage:
  apltk architecture                          Open resources/project-architecture/index.html
  apltk architecture open                     Same as above
  apltk architecture diff                     Render every architecture_diff/ as one paginated viewer
  apltk architecture render                   Regenerate atlas HTML from current YAML state
  apltk architecture validate                 Run schema + referential checks
  apltk architecture feature add|set|remove   Manage feature modules
  apltk architecture submodule add|set|remove Manage sub-modules
  apltk architecture function|variable|dataflow|error|edge add|remove
                                              Manage component rows and edges
  apltk architecture meta set                 Update meta.title / meta.summary
  apltk architecture actor add|remove         Manage top-level actors
  apltk architecture undo                     Revert the most recent mutation
  apltk architecture --help                   Show this help

Global flags:
  --project <root>   Project root (default: nearest ancestor with resources/project-architecture/, else cwd); missing layout dirs are created when needed
  --spec <spec_dir>  Mutations write to <spec_dir>/architecture_diff/atlas/
  --no-render        Skip auto-render after a mutation
  --no-open          For open/diff: skip launching the browser
  --out <dir>        For diff: override viewer output directory
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
    if (fs.existsSync(path.join(dir, RESOURCES_REL, ATLAS_DIRNAME, 'atlas.index.yaml'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function openInBrowser(filePath) {
  const platform = process.platform;
  let command;
  let args;
  if (platform === 'darwin') { command = 'open'; args = [filePath]; }
  else if (platform === 'win32') { command = 'cmd'; args = ['/c', 'start', '""', filePath]; }
  else { command = 'xdg-open'; args = [filePath]; }
  try {
    const child = spawn(command, args, { stdio: 'ignore', detached: true });
    child.on('error', () => {});
    child.unref();
  } catch (_e) { /* best effort */ }
}

function walkArchitectureDiffDirs(plansRoot) {
  const result = [];
  if (!fs.existsSync(plansRoot)) return result;
  function recurse(dir) {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_e) { return; }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      const full = path.join(dir, entry.name);
      if (entry.name === DIFF_DIRNAME) { result.push(full); continue; }
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
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_e) { return; }
    for (const entry of entries) {
      if (entry.name === 'assets') continue;
      if (entry.name === ATLAS_DIRNAME) continue;
      if (entry.name === REMOVED_FILE) continue;
      if (entry.name.startsWith('.')) continue;
      const full = path.join(dir, entry.name);
      const nextRel = [...relParts, entry.name];
      if (entry.isDirectory()) recurse(full, nextRel);
      else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) {
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

function toViewerRel(outDir, projectRoot, projectRelPath) {
  if (!projectRelPath) return null;
  const absolute = path.resolve(projectRoot, projectRelPath);
  const rel = path.relative(outDir, absolute);
  return rel.split(path.sep).join('/');
}

function renderViewer({ changes, projectRoot, outDir }) {
  return newCli.renderDiffViewer({ changes, projectRoot, outDir });
}

function runOpen(opts, io) {
  let projectRoot = opts.projectRoot
    ? path.resolve(opts.projectRoot)
    : findProjectRoot(process.cwd());
  if (!projectRoot) {
    projectRoot = process.cwd();
  }
  fs.mkdirSync(path.join(projectRoot, RESOURCES_REL), { recursive: true });
  const atlas = path.join(projectRoot, ATLAS_REL);
  if (!fs.existsSync(atlas)) {
    const bootstrap = path.join(__dirname, 'architecture-bootstrap-render.js');
    const result = spawnSync(process.execPath, [bootstrap, 'render', '--project', projectRoot, '--no-open'], {
      stdio: 'ignore',
    });
    if (result.status !== 0) {
      io.stderr.write(`Atlas not found and render failed: ${atlas}\n`);
      return 1;
    }
  }
  if (!fs.existsSync(atlas)) {
    io.stderr.write(`Atlas not found: ${atlas}\n`);
    return 1;
  }
  io.stdout.write(`${atlas}\n`);
  if (opts.open) openInBrowser(atlas);
  return 0;
}

function runDiff(opts, io) {
  let projectRoot = opts.projectRoot
    ? path.resolve(opts.projectRoot)
    : findProjectRoot(process.cwd());
  if (!projectRoot) {
    projectRoot = process.cwd();
  }
  fs.mkdirSync(path.join(projectRoot, RESOURCES_REL), { recursive: true });
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

// main(argv, io) is sync and supports the legacy verbs `open` and
// `diff` only. Tests rely on the sync return-code contract. All other
// verbs go through dispatchAsync().
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

async function dispatchAsync(argv, io = { stdout: process.stdout, stderr: process.stderr }) {
  return newCli.dispatch(argv, io);
}

if (require.main === module) {
  const argv = process.argv.slice(2);
  const verb = argv[0];
  if (!verb || verb.startsWith('-') || LEGACY_VERBS.has(verb)) {
    process.exit(main(argv));
  } else {
    dispatchAsync(argv).then((code) => process.exit(code)).catch((err) => {
      process.stderr.write(`${err && err.stack ? err.stack : err}\n`);
      process.exit(1);
    });
  }
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
  dispatchAsync,
};
