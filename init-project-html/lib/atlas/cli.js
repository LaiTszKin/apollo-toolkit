'use strict';

// cli.js — declarative atlas command tree under `apltk architecture`.
//
// Verbs (always operate on the resolved atlas; --spec switches reads
// and writes to the overlay snapshot under <spec_dir>/architecture_diff/):
//
//   open                                          open base atlas in browser
//   diff                                          render paginated before/after viewer
//   render                                        force-regenerate HTML from current state
//   feature add|set|remove                        feature lifecycle
//   submodule add|set|remove                      sub-module lifecycle
//   function add|remove                           function I/O rows
//   variable add|remove                           variable rows
//   dataflow add|remove|reorder                   ordered internal flow steps
//   error add|remove                              error rows
//   edge add|remove                               edges (intra-feature if both endpoints share a feature, otherwise cross-feature)
//   meta set                                      meta.title / meta.summary
//   actor add|remove                              top-level actors
//   validate                                      schema + referential integrity check
//   undo                                          revert the most recent mutation
//   help / --help / -h                            usage
//
// Global flags:
//   --project <root>     project root; creates resources/project-architecture/ if missing
//   --spec <spec_dir>    single specs write to <spec_dir>/architecture_diff/atlas/; batch member paths resolve to the coordination.md root
//   --no-render          skip auto-render after a mutation
//   --no-open            for open/diff: skip launching the browser
//   --out <dir>          for diff: override viewer output directory

const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const schema = require('./schema');
const stateLib = require('./state');
const renderLib = require('./render');

const ATLAS_REL = path.join('resources', 'project-architecture');
const ATLAS_INDEX_REL = path.join(ATLAS_REL, 'index.html');
const ATLAS_DIRNAME = stateLib.ATLAS_DIRNAME;
const DIFF_DIRNAME = 'architecture_diff';
const PLANS_REL = path.join('docs', 'plans');
const COORDINATION_FILE = 'coordination.md';
const REMOVED_TXT = '_removed.txt';
const DEFAULT_DIFF_OUT_REL = path.join('.apollo-toolkit', 'architecture-diff');

const USAGE = `apltk architecture — declarative atlas CLI.

Usage:
  apltk architecture [verb] [options]

Verbs:
  open                                  open the base atlas in a browser
  diff                                  render every architecture_diff/ overlay as a paginated viewer
  render                                regenerate atlas HTML from the current state
  feature add|set|remove                manage feature modules
  submodule add|set|remove              manage sub-modules
  function add|remove                   manage function I/O rows
  variable add|remove                   manage variable rows
  dataflow add|remove|reorder           manage ordered internal flow steps
  error add|remove                      manage error rows
  edge add|remove                       manage call/return/data-row/failure edges
  meta set                              edit meta.title / meta.summary
  actor add|remove                      manage top-level actors
  validate                              run schema + referential checks
  undo                                  revert the most recent mutation (use --steps <n> for multi-step rollback)
  help                                  show this help

Global flags:
  --project <root>                      explicit project root (default: nearest ancestor with atlas markers, else cwd); missing directories under resources/project-architecture/ are created automatically
  --spec <spec_dir>                     single specs write to <spec_dir>/architecture_diff/atlas/; batch member paths write to the coordination.md root
  --no-render                           skip auto-render after a mutation
  --no-open                             for open/diff: skip launching the browser
  --out <dir>                           for diff: override viewer output directory

Examples:
  apltk architecture feature add --slug register --title "User registration" --story "..."
  apltk architecture submodule add --feature register --slug api --kind api --role "HTTP endpoint"
  apltk architecture function add --feature register --submodule api --name handlePost --side network --purpose "..."
  apltk architecture variable add --feature register --submodule api --name token --type "string" --scope call --purpose "..."
  apltk architecture dataflow add --feature register --submodule api --step "Validate body" --fn handlePost --reads "body" --writes "token"
  apltk architecture --spec docs/plans/2026-05-11/add-2fa submodule set --feature register --slug api --role "..."
  apltk architecture validate
  apltk architecture undo --steps 3 --spec docs/plans/2026-05-11/add-2fa
  apltk architecture diff
`;

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

function ensureResourcesLayout(projectRoot) {
  fs.mkdirSync(path.join(projectRoot, ATLAS_REL), { recursive: true });
}

function findProjectRoot(startDir) {
  let dir = path.resolve(startDir);
  while (true) {
    if (fs.existsSync(path.join(dir, ATLAS_INDEX_REL))) return dir;
    if (fs.existsSync(path.join(dir, ATLAS_REL, ATLAS_DIRNAME, stateLib.INDEX_FILE))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function splitList(value) {
  if (value == null) return [];
  return String(value).split(',').map((s) => s.trim()).filter(Boolean);
}

function parseFlags(args) {
  const positional = [];
  const flags = Object.create(null);
  while (args.length > 0) {
    const token = args.shift();
    if (token === '--') { positional.push(...args); break; }
    if (token.startsWith('--')) {
      const eq = token.indexOf('=');
      let name;
      let value;
      if (eq !== -1) { name = token.slice(2, eq); value = token.slice(eq + 1); }
      else {
        name = token.slice(2);
        const nextIsValue = args.length > 0 && !args[0].startsWith('--');
        const booleanFlags = new Set(['no-render', 'no-open', 'help', 'force']);
        if (booleanFlags.has(name) || !nextIsValue) value = true;
        else value = args.shift();
      }
      if (flags[name] !== undefined) {
        flags[name] = Array.isArray(flags[name]) ? [...flags[name], value] : [flags[name], value];
      } else {
        flags[name] = value;
      }
    } else if (token === '-h') {
      flags.help = true;
    } else {
      positional.push(token);
    }
  }
  return { positional, flags };
}

function requireFlag(flags, name) {
  if (flags[name] === undefined || flags[name] === null || flags[name] === true) {
    throw new Error(`Missing required flag --${name}`);
  }
  return flags[name];
}

function resolveProjectRoot(flags) {
  const finish = (root) => {
    ensureResourcesLayout(root);
    return root;
  };
  if (flags.project) return finish(path.resolve(String(flags.project)));
  const discovered = findProjectRoot(process.cwd());
  if (discovered) return finish(discovered);
  // No marker walking parents — use cwd and create resources/project-architecture/.
  return finish(process.cwd());
}

function specOverlayDir(projectRoot, specFlag) {
  const specDir = path.isAbsolute(String(specFlag)) ? String(specFlag) : path.resolve(projectRoot, String(specFlag));
  const plansRoot = path.join(projectRoot, PLANS_REL);
  const batchRoot = fs.existsSync(path.join(specDir, COORDINATION_FILE)) ? specDir : findBatchRoot(specDir, plansRoot);
  const rootDir = batchRoot || specDir;
  return {
    specDir,
    rootDir,
    overlayDir: path.join(rootDir, DIFF_DIRNAME, ATLAS_DIRNAME),
    htmlOutDir: path.join(rootDir, DIFF_DIRNAME),
  };
}

function baseAtlasDir(projectRoot) {
  return path.join(projectRoot, ATLAS_REL, ATLAS_DIRNAME);
}

function baseHtmlOutDir(projectRoot) {
  return path.join(projectRoot, ATLAS_REL);
}

function loadResolvedState(projectRoot, flags) {
  const base = stateLib.load(baseAtlasDir(projectRoot));
  if (!flags.spec) return { base, merged: base, overlay: null };
  const { overlayDir } = specOverlayDir(projectRoot, flags.spec);
  const overlay = stateLib.loadOverlay(overlayDir);
  const merged = stateLib.mergeOverlay(base, overlay);
  return { base, merged, overlay };
}

function findFeature(state, slug) {
  return (state.features || []).find((f) => f.slug === slug);
}

function findSubmodule(feature, slug) {
  return ((feature && feature.submodules) || []).find((s) => s.slug === slug);
}

function ensureBaseAtlasDir(projectRoot) {
  const dir = baseAtlasDir(projectRoot);
  fs.mkdirSync(dir, { recursive: true });
}

async function performMutation(projectRoot, flags, action, args, mutate) {
  const isSpec = Boolean(flags.spec);
  const base = stateLib.load(baseAtlasDir(projectRoot));
  let merged = base;

  if (isSpec) {
    const { overlayDir } = specOverlayDir(projectRoot, flags.spec);
    const overlay = stateLib.loadOverlay(overlayDir);
    merged = stateLib.mergeOverlay(base, overlay);
    const before = JSON.parse(JSON.stringify({ base, overlay }));
    mutate(merged, base, overlay);
    stateLib.writeUndoSnapshot(overlayDir, before);
    stateLib.saveOverlay(overlayDir, stateLib.deriveOverlay(base, merged));
    stateLib.appendHistory(overlayDir, { action, args, mode: 'spec' });
  } else {
    ensureBaseAtlasDir(projectRoot);
    const before = JSON.parse(JSON.stringify({ base }));
    mutate(base, base, null);
    stateLib.writeUndoSnapshot(baseAtlasDir(projectRoot), before);
    stateLib.save(baseAtlasDir(projectRoot), base);
    stateLib.appendHistory(baseAtlasDir(projectRoot), { action, args, mode: 'base' });
  }

  if (!flags['no-render']) {
    await runRender({ projectRoot, flags });
  }
}

async function runRender({ projectRoot, flags }) {
  if (flags.spec) {
    const { overlayDir, htmlOutDir } = specOverlayDir(projectRoot, flags.spec);
    const base = stateLib.load(baseAtlasDir(projectRoot));
    const overlay = stateLib.loadOverlay(overlayDir);
    const merged = stateLib.mergeOverlay(base, overlay);
    const diff = stateLib.diffPages(base, merged);
    const scope = renderLib.scopeFromDiff(diff);
    const removedPaths = renderLib.removedPagePathsFromDiff(diff);
    fs.mkdirSync(htmlOutDir, { recursive: true });
    return renderLib.renderAll({ outDir: htmlOutDir, state: merged, scope, removedPaths });
  }
  const state = stateLib.load(baseAtlasDir(projectRoot));
  return renderLib.renderAll({ outDir: baseHtmlOutDir(projectRoot), state });
}

// ---- mutation helpers ---------------------------------------------------

function ensureFeature(state, slug, init) {
  let feature = findFeature(state, slug);
  if (!feature) {
    feature = { slug, title: slug, story: '', dependsOn: [], submodules: [], edges: [], ...init };
    state.features = state.features || [];
    state.features.push(feature);
  } else if (init) {
    Object.assign(feature, init);
  }
  return feature;
}

function removeFeature(state, slug) {
  if (!state.features) return false;
  const before = state.features.length;
  state.features = state.features.filter((f) => f.slug !== slug);
  // also drop cross-feature edges that reference this slug
  state.edges = (state.edges || []).filter((e) => !endpointReferences(e.from, slug) && !endpointReferences(e.to, slug));
  return state.features.length < before;
}

function endpointReferences(endpoint, slug) {
  if (!endpoint || typeof endpoint === 'string') return false;
  return endpoint.feature === slug;
}

function ensureSubmodule(feature, slug, init) {
  let sub = findSubmodule(feature, slug);
  if (!sub) {
    sub = { slug, kind: 'service', role: '', functions: [], variables: [], dataflow: [], errors: [], ...init };
    feature.submodules = feature.submodules || [];
    feature.submodules.push(sub);
  } else if (init) {
    Object.assign(sub, init);
  }
  return sub;
}

function removeSubmodule(feature, slug) {
  if (!feature.submodules) return false;
  const before = feature.submodules.length;
  feature.submodules = feature.submodules.filter((s) => s.slug !== slug);
  feature.edges = (feature.edges || []).filter((e) => {
    const f = typeof e.from === 'string' ? e.from : e.from && e.from.submodule;
    const t = typeof e.to === 'string' ? e.to : e.to && e.to.submodule;
    return f !== slug && t !== slug;
  });
  return feature.submodules.length < before;
}

function parseEndpoint(value) {
  // accepts "feature" or "feature/submodule"
  const [feat, sub] = String(value).split('/').map((s) => s && s.trim()).filter(Boolean).concat([undefined])
    .slice(0, 2);
  if (!feat) throw new Error(`Invalid endpoint: ${value}`);
  return sub ? { feature: feat, submodule: sub } : { feature: feat };
}

function isIntraFeatureEdge(from, to) {
  return from && to && from.feature && to.feature && from.feature === to.feature && from.submodule && to.submodule;
}

// ---- verb dispatch ------------------------------------------------------

async function verbFeature(action, flags, projectRoot) {
  const slug = String(requireFlag(flags, 'slug'));
  if (action === 'add' || action === 'set') {
    const init = {};
    if (flags.title !== undefined) init.title = String(flags.title);
    if (flags.story !== undefined) init.story = String(flags.story);
    if (flags['depends-on'] !== undefined) init.dependsOn = splitList(flags['depends-on']);
    return performMutation(projectRoot, flags, `feature ${action}`, { slug, ...init }, (state) => {
      ensureFeature(state, slug, init);
      return { touchedFeatures: new Set([slug]) };
    });
  }
  if (action === 'remove') {
    return performMutation(projectRoot, flags, 'feature remove', { slug }, (state) => {
      removeFeature(state, slug);
      return { removalsHint: { features: [slug] } };
    });
  }
  throw new Error(`Unknown feature subverb: ${action}`);
}

async function verbSubmodule(action, flags, projectRoot) {
  const featureSlug = String(requireFlag(flags, 'feature'));
  const slug = String(requireFlag(flags, 'slug'));
  if (action === 'add' || action === 'set') {
    const init = {};
    if (flags.kind !== undefined) init.kind = String(flags.kind);
    if (flags.role !== undefined) init.role = String(flags.role);
    return performMutation(projectRoot, flags, `submodule ${action}`, { feature: featureSlug, slug, ...init }, (state) => {
      const feature = ensureFeature(state, featureSlug);
      ensureSubmodule(feature, slug, init);
      return { touchedFeatures: new Set([featureSlug]) };
    });
  }
  if (action === 'remove') {
    return performMutation(projectRoot, flags, 'submodule remove', { feature: featureSlug, slug }, (state) => {
      const feature = findFeature(state, featureSlug);
      if (feature) removeSubmodule(feature, slug);
      return { touchedFeatures: new Set([featureSlug]), removalsHint: { submodules: [{ feature: featureSlug, submodule: slug }] } };
    });
  }
  throw new Error(`Unknown submodule subverb: ${action}`);
}

async function verbFunction(action, flags, projectRoot) {
  const featureSlug = String(requireFlag(flags, 'feature'));
  const subSlug = String(requireFlag(flags, 'submodule'));
  const name = String(requireFlag(flags, 'name'));
  return performMutation(projectRoot, flags, `function ${action}`, { feature: featureSlug, submodule: subSlug, name }, (state) => {
    const feature = ensureFeature(state, featureSlug);
    const sub = ensureSubmodule(feature, subSlug);
    if (action === 'add') {
      sub.functions = (sub.functions || []).filter((f) => f.name !== name);
      const fn = { name };
      if (flags.in !== undefined) fn.in = String(flags.in);
      if (flags.out !== undefined) fn.out = String(flags.out);
      if (flags.side !== undefined) fn.side = String(flags.side);
      if (flags.purpose !== undefined) fn.purpose = String(flags.purpose);
      sub.functions.push(fn);
    } else if (action === 'remove') {
      sub.functions = (sub.functions || []).filter((f) => f.name !== name);
    } else {
      throw new Error(`Unknown function subverb: ${action}`);
    }
    return { touchedFeatures: new Set([featureSlug]) };
  });
}

async function verbVariable(action, flags, projectRoot) {
  const featureSlug = String(requireFlag(flags, 'feature'));
  const subSlug = String(requireFlag(flags, 'submodule'));
  const name = String(requireFlag(flags, 'name'));
  return performMutation(projectRoot, flags, `variable ${action}`, { feature: featureSlug, submodule: subSlug, name }, (state) => {
    const feature = ensureFeature(state, featureSlug);
    const sub = ensureSubmodule(feature, subSlug);
    if (action === 'add') {
      sub.variables = (sub.variables || []).filter((v) => v.name !== name);
      const v = { name };
      if (flags.type !== undefined) v.type = String(flags.type);
      if (flags.scope !== undefined) v.scope = String(flags.scope);
      if (flags.purpose !== undefined) v.purpose = String(flags.purpose);
      sub.variables.push(v);
    } else if (action === 'remove') {
      sub.variables = (sub.variables || []).filter((v) => v.name !== name);
    } else {
      throw new Error(`Unknown variable subverb: ${action}`);
    }
    return { touchedFeatures: new Set([featureSlug]) };
  });
}

async function verbDataflow(action, flags, projectRoot) {
  const featureSlug = String(requireFlag(flags, 'feature'));
  const subSlug = String(requireFlag(flags, 'submodule'));
  return performMutation(projectRoot, flags, `dataflow ${action}`, { feature: featureSlug, submodule: subSlug, step: flags.step, at: flags.at }, (state) => {
    const feature = ensureFeature(state, featureSlug);
    const sub = ensureSubmodule(feature, subSlug);
    sub.dataflow = sub.dataflow || [];
    if (action === 'add') {
      const step = String(requireFlag(flags, 'step'));
      const item = buildDataflowItem(step, flags);
      const atRaw = flags.at;
      if (atRaw !== undefined) {
        const at = Number(atRaw);
        if (!Number.isFinite(at) || at < 0) throw new Error('--at must be a non-negative integer');
        sub.dataflow.splice(at, 0, item);
      } else {
        sub.dataflow.push(item);
      }
    } else if (action === 'remove') {
      if (flags.at !== undefined) {
        const at = Number(flags.at);
        if (!Number.isFinite(at) || at < 0 || at >= sub.dataflow.length) throw new Error('--at out of range');
        sub.dataflow.splice(at, 1);
      } else {
        const step = String(requireFlag(flags, 'step'));
        sub.dataflow = sub.dataflow.filter((s) => stepText(s) !== step);
      }
    } else if (action === 'reorder') {
      const from = Number(requireFlag(flags, 'from'));
      const to = Number(requireFlag(flags, 'to'));
      if (!Number.isFinite(from) || !Number.isFinite(to) || from < 0 || to < 0 || from >= sub.dataflow.length || to >= sub.dataflow.length) {
        throw new Error('--from / --to out of range');
      }
      const [moved] = sub.dataflow.splice(from, 1);
      sub.dataflow.splice(to, 0, moved);
    } else {
      throw new Error(`Unknown dataflow subverb: ${action}`);
    }
    return { touchedFeatures: new Set([featureSlug]) };
  });
}

function stepText(item) {
  return typeof item === 'string' ? item : (item && typeof item.step === 'string' ? item.step : '');
}

function parseNameList(raw) {
  if (raw === undefined || raw === null) return undefined;
  return String(raw)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildDataflowItem(step, flags) {
  const fn = flags.fn === undefined ? undefined : String(flags.fn).trim();
  const reads = parseNameList(flags.reads);
  const writes = parseNameList(flags.writes);
  const annotated = (fn && fn.length > 0) || (reads && reads.length > 0) || (writes && writes.length > 0);
  if (!annotated) return step;
  const item = { step };
  if (fn) item.fn = fn;
  if (reads && reads.length > 0) item.reads = reads;
  if (writes && writes.length > 0) item.writes = writes;
  return item;
}

async function verbError(action, flags, projectRoot) {
  const featureSlug = String(requireFlag(flags, 'feature'));
  const subSlug = String(requireFlag(flags, 'submodule'));
  const name = String(requireFlag(flags, 'name'));
  return performMutation(projectRoot, flags, `error ${action}`, { feature: featureSlug, submodule: subSlug, name }, (state) => {
    const feature = ensureFeature(state, featureSlug);
    const sub = ensureSubmodule(feature, subSlug);
    if (action === 'add') {
      sub.errors = (sub.errors || []).filter((e) => e.name !== name);
      const err = { name };
      if (flags.when !== undefined) err.when = String(flags.when);
      if (flags.means !== undefined) err.means = String(flags.means);
      sub.errors.push(err);
    } else if (action === 'remove') {
      sub.errors = (sub.errors || []).filter((e) => e.name !== name);
    } else {
      throw new Error(`Unknown error subverb: ${action}`);
    }
    return { touchedFeatures: new Set([featureSlug]) };
  });
}

async function verbEdge(action, flags, projectRoot) {
  const from = parseEndpoint(requireFlag(flags, 'from'));
  const to = parseEndpoint(requireFlag(flags, 'to'));
  return performMutation(projectRoot, flags, `edge ${action}`, { from, to, kind: flags.kind, label: flags.label, id: flags.id }, (state) => {
    if (action === 'add') {
      const edge = {
        id: flags.id ? String(flags.id) : undefined,
        from,
        to,
        kind: flags.kind ? String(flags.kind) : 'call',
        label: flags.label !== undefined ? String(flags.label) : '',
      };
      if (!edge.id) edge.id = `e-${Math.random().toString(36).slice(2, 8)}`;
      const intra = isIntraFeatureEdge(from, to);
      if (intra) {
        const feature = ensureFeature(state, from.feature);
        feature.edges = feature.edges || [];
        feature.edges = feature.edges.filter((e) => e.id !== edge.id);
        feature.edges.push({
          id: edge.id,
          from: from.submodule,
          to: to.submodule,
          kind: edge.kind,
          label: edge.label,
        });
        return { touchedFeatures: new Set([from.feature]) };
      }
      state.edges = state.edges || [];
      state.edges = state.edges.filter((e) => e.id !== edge.id);
      state.edges.push(edge);
      return { touchedFeatures: new Set([from.feature, to.feature]) };
    }
    if (action === 'remove') {
      const id = flags.id ? String(flags.id) : null;
      const intra = isIntraFeatureEdge(from, to);
      if (intra) {
        const feature = findFeature(state, from.feature);
        if (feature) {
          feature.edges = (feature.edges || []).filter((e) => {
            if (id && e.id === id) return false;
            const f = typeof e.from === 'string' ? e.from : e.from && e.from.submodule;
            const t = typeof e.to === 'string' ? e.to : e.to && e.to.submodule;
            return !(f === from.submodule && t === to.submodule);
          });
          return { touchedFeatures: new Set([from.feature]) };
        }
        return { touchedFeatures: new Set([from.feature]) };
      }
      state.edges = (state.edges || []).filter((e) => {
        if (id && e.id === id) return false;
        return !(endpointEquals(e.from, from) && endpointEquals(e.to, to));
      });
      return { touchedFeatures: new Set([from.feature, to.feature]) };
    }
    throw new Error(`Unknown edge subverb: ${action}`);
  });
}

function endpointEquals(a, b) {
  if (typeof a === 'string' || typeof b === 'string') return false;
  if (!a || !b) return false;
  return a.feature === b.feature && (a.submodule || null) === (b.submodule || null);
}

async function verbMeta(action, flags, projectRoot) {
  if (action !== 'set') throw new Error(`Unknown meta subverb: ${action}`);
  const update = {};
  if (flags.title !== undefined) update.title = String(flags.title);
  if (flags.summary !== undefined) update.summary = String(flags.summary);
  return performMutation(projectRoot, flags, 'meta set', update, (state) => {
    state.meta = { ...state.meta, ...update };
  });
}

async function verbActor(action, flags, projectRoot) {
  const id = String(requireFlag(flags, 'id'));
  return performMutation(projectRoot, flags, `actor ${action}`, { id, label: flags.label }, (state) => {
    state.actors = state.actors || [];
    if (action === 'add') {
      state.actors = state.actors.filter((a) => a.id !== id);
      state.actors.push({ id, label: flags.label !== undefined ? String(flags.label) : id });
    } else if (action === 'remove') {
      state.actors = state.actors.filter((a) => a.id !== id);
    } else {
      throw new Error(`Unknown actor subverb: ${action}`);
    }
  });
}

async function verbValidate(flags, projectRoot, io) {
  const { merged } = loadResolvedState(projectRoot, flags);
  const errors = schema.validate(merged);
  if (errors.length === 0) {
    io.stdout.write('atlas: OK\n');
    return 0;
  }
  for (const err of errors) io.stderr.write(`${err}\n`);
  return 1;
}

async function verbUndo(flags, projectRoot, io) {
  const dir = flags.spec ? specOverlayDir(projectRoot, flags.spec).overlayDir : baseAtlasDir(projectRoot);
  const stepsRaw = flags.steps === undefined ? 1 : Number(flags.steps);
  if (!Number.isInteger(stepsRaw) || stepsRaw < 1) {
    io.stderr.write('--steps must be a positive integer.\n');
    return 1;
  }
  const snapshot = stateLib.consumeUndoSnapshot(dir, stepsRaw);
  if (!snapshot) {
    io.stderr.write(stepsRaw === 1 ? 'No undo snapshot found.\n' : `Unable to undo ${stepsRaw} steps; history is shorter.\n`);
    return 1;
  }
  if (flags.spec) {
    const { overlayDir } = specOverlayDir(projectRoot, flags.spec);
    stateLib.saveOverlay(overlayDir, snapshot.overlay);
    stateLib.appendHistory(overlayDir, { action: 'undo', mode: 'spec' });
  } else {
    stateLib.save(baseAtlasDir(projectRoot), snapshot.base);
    stateLib.appendHistory(baseAtlasDir(projectRoot), { action: 'undo', mode: 'base' });
  }
  if (!flags['no-render']) await runRender({ projectRoot, flags });
  io.stdout.write(`atlas: undo applied (${stepsRaw} step${stepsRaw === 1 ? '' : 's'})\n`);
  return 0;
}

async function verbOpen(flags, projectRoot, io) {
  const atlas = path.join(projectRoot, ATLAS_INDEX_REL);
  if (!fs.existsSync(atlas)) {
    await runRender({ projectRoot, flags: { ...flags, spec: undefined } });
  }
  if (!fs.existsSync(atlas)) {
    io.stderr.write(`Atlas not found after render: ${atlas}\n`);
    return 1;
  }
  io.stdout.write(`${atlas}\n`);
  if (!flags['no-open']) openInBrowser(atlas);
  return 0;
}

async function verbDiff(flags, projectRoot, io) {
  const outDir = flags.out ? path.resolve(String(flags.out)) : path.join(projectRoot, DEFAULT_DIFF_OUT_REL);
  fs.mkdirSync(outDir, { recursive: true });
  const changes = await collectDiffChanges({ projectRoot, outDir });

  const html = renderDiffViewer({ changes, projectRoot, outDir });
  const indexPath = path.join(outDir, 'index.html');
  fs.writeFileSync(indexPath, html, 'utf8');
  io.stdout.write(`${indexPath}\n`);
  io.stdout.write(`Diff pages: ${changes.length} (modified=${changes.filter((c) => c.kind === 'modified').length}, added=${changes.filter((c) => c.kind === 'added').length}, removed=${changes.filter((c) => c.kind === 'removed').length})\n`);
  if (!flags['no-open']) openInBrowser(indexPath);
  return 0;
}

async function collectDiffChanges({ projectRoot, outDir }) {
  const plansRoot = path.join(projectRoot, PLANS_REL);
  const groups = groupDiffDirsByBatch({ projectRoot, plansRoot });
  const changes = [];

  for (const group of groups) {
    if (group.kind === 'batch') {
      changes.push(...await collectBatchGroupChanges({ projectRoot, outDir, group }));
    } else {
      changes.push(...collectSingleSpecChanges({ projectRoot, specDir: group.specDir, specLabel: group.label }));
    }
  }

  changes.sort((a, b) => {
    if (a.spec !== b.spec) return a.spec.localeCompare(b.spec);
    if (a.kind !== b.kind) return a.kind.localeCompare(b.kind);
    return a.rel.localeCompare(b.rel);
  });
  return changes;
}

function groupDiffDirsByBatch({ projectRoot, plansRoot }) {
  const groups = new Map();
  for (const diffDir of walkArchitectureDiffDirs(plansRoot)) {
    const specDir = path.dirname(diffDir);
    const batchRoot = findBatchRoot(specDir, plansRoot);
    const isBatchMember = Boolean(batchRoot && batchRoot !== specDir);
    const key = isBatchMember ? batchRoot : specDir;
    if (!groups.has(key)) {
      groups.set(key, {
        kind: isBatchMember ? 'batch' : 'single',
        key,
        label: path.relative(projectRoot, key),
        specDir: isBatchMember ? null : specDir,
        members: [],
      });
    }
    groups.get(key).members.push({ specDir, diffDir, label: path.relative(projectRoot, specDir) });
  }
  return [...groups.values()]
    .map((group) => ({ ...group, members: group.members.sort((a, b) => a.specDir.localeCompare(b.specDir)) }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

function findBatchRoot(specDir, plansRoot) {
  const absolutePlansRoot = path.resolve(plansRoot);
  let current = path.resolve(path.dirname(specDir));
  while (current.startsWith(`${absolutePlansRoot}${path.sep}`) || current === absolutePlansRoot) {
    if (fs.existsSync(path.join(current, COORDINATION_FILE))) return current;
    if (current === absolutePlansRoot) break;
    current = path.dirname(current);
  }
  return null;
}

function collectSingleSpecChanges({ projectRoot, specDir, specLabel }) {
  const overlayDir = path.join(specDir, DIFF_DIRNAME, ATLAS_DIRNAME);
  if (!hasOverlayState(overlayDir)) {
    return collectHtmlManifestChanges({ projectRoot, diffDir: path.join(specDir, DIFF_DIRNAME), specLabel });
  }
  const base = stateLib.load(baseAtlasDir(projectRoot));
  const overlay = stateLib.loadOverlay(overlayDir);
  const merged = stateLib.mergeOverlay(base, overlay);
  const diff = stateLib.diffPages(base, merged);
  return diffToChanges({
    projectRoot,
    specLabel,
    htmlRoot: path.join(specDir, DIFF_DIRNAME),
    diff,
  });
}

function hasOverlayState(overlayDir) {
  return fs.existsSync(path.join(overlayDir, stateLib.INDEX_FILE))
    || fs.existsSync(path.join(overlayDir, stateLib.FEATURES_DIR))
    || fs.existsSync(path.join(overlayDir, stateLib.REMOVED_FILE));
}

async function collectBatchGroupChanges({ projectRoot, outDir, group }) {
  const batchRootOverlayDir = path.join(group.key, DIFF_DIRNAME, ATLAS_DIRNAME);
  if (hasOverlayState(batchRootOverlayDir)) {
    return collectSingleSpecChanges({ projectRoot, specDir: group.key, specLabel: group.label });
  }

  const memberOverlayDirs = group.members.map((member) => ({
    ...member,
    overlayDir: path.join(member.specDir, DIFF_DIRNAME, ATLAS_DIRNAME),
  }));
  if (memberOverlayDirs.some((member) => !hasOverlayState(member.overlayDir))) {
    return group.members.flatMap((member) => (
      collectSingleSpecChanges({ projectRoot, specDir: member.specDir, specLabel: member.label })
    ));
  }

  const base = stateLib.load(baseAtlasDir(projectRoot));
  let merged = JSON.parse(JSON.stringify(base));
  for (const member of memberOverlayDirs) {
    const overlay = stateLib.loadOverlay(member.overlayDir);
    merged = stateLib.mergeOverlay(merged, overlay);
  }
  const diff = stateLib.diffPages(base, merged);
  const htmlRoot = path.join(outDir, '_batch', group.label);
  await renderLib.renderAll({
    outDir: htmlRoot,
    state: merged,
    scope: renderLib.scopeFromDiff(diff),
    removedPaths: renderLib.removedPagePathsFromDiff(diff),
  });
  return diffToChanges({
    projectRoot,
    specLabel: group.label,
    htmlRoot,
    diff,
  });
}

function diffToChanges({ projectRoot, specLabel, htmlRoot, diff }) {
  const resourcesRoot = path.join(projectRoot, ATLAS_REL);
  const changes = [];
  const add = (kind, rel) => {
    const beforeAbs = path.join(resourcesRoot, rel);
    const afterAbs = kind === 'removed' ? null : path.join(htmlRoot, rel);
    if (kind === 'removed' && !fs.existsSync(beforeAbs)) return;
    changes.push({
      kind,
      rel,
      spec: specLabel,
      beforePath: kind === 'added' ? null : path.relative(projectRoot, beforeAbs),
      afterPath: afterAbs ? path.relative(projectRoot, afterAbs) : null,
    });
  };

  if (diff.macroChanged) {
    add('modified', renderLib.pagePathFor('macro'));
  }
  for (const slug of diff.modifiedFeatures || []) {
    add('modified', renderLib.pagePathFor('feature', { featureSlug: slug }));
  }
  for (const slug of diff.addedFeatures || []) {
    add('added', renderLib.pagePathFor('feature', { featureSlug: slug }));
  }
  for (const item of diff.modifiedSubmodules || []) {
    add('modified', renderLib.pagePathFor('submodule', { featureSlug: item.feature, submoduleSlug: item.submodule }));
  }
  for (const item of diff.addedSubmodules || []) {
    add('added', renderLib.pagePathFor('submodule', { featureSlug: item.feature, submoduleSlug: item.submodule }));
  }
  for (const slug of diff.removedFeatures || []) {
    add('removed', renderLib.pagePathFor('feature', { featureSlug: slug }));
  }
  for (const item of diff.removedSubmodules || []) {
    add('removed', renderLib.pagePathFor('submodule', { featureSlug: item.feature, submoduleSlug: item.submodule }));
  }

  return changes;
}

function collectHtmlManifestChanges({ projectRoot, diffDir, specLabel }) {
  const resourcesRoot = path.join(projectRoot, ATLAS_REL);
  const changes = [];
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
  return changes;
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
      if (entry.name === REMOVED_TXT) continue;
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
  const file = path.join(diffDir, REMOVED_TXT);
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
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

function renderDiffViewer({ changes, projectRoot, outDir }) {
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
    :root { color-scheme: light dark; --bg: #0f172a; --panel: #1e293b; --text: #e2e8f0; --muted: #94a3b8; --accent: #38bdf8; --added: #4ade80; --removed: #f87171; --modified: #facc15; }
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
    .badge.modified { color: var(--modified); } .badge.added { color: var(--added); } .badge.removed { color: var(--removed); }
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
    Navigate with <kbd>←</kbd> / <kbd>→</kbd> or the buttons above. Each page pairs the current atlas (left) with the proposed-after HTML (right).
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
      if (pages.length === 0) { counterEl.textContent = '0 / 0'; prevBtn.disabled = true; nextBtn.disabled = true; return; }
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
        if (event.key === 'ArrowLeft') prevBtn.click();
        else if (event.key === 'ArrowRight') nextBtn.click();
      });
      emptyEl.remove();
      render();
    })();
  </script>
</body>
</html>
`;
}

async function dispatch(argv, io = { stdout: process.stdout, stderr: process.stderr }) {
  const args = [...argv];
  let verb = 'open';
  if (args.length > 0 && !args[0].startsWith('-')) {
    verb = args.shift();
  }
  let subverb = null;
  const multiVerbs = new Set(['feature', 'submodule', 'function', 'variable', 'dataflow', 'error', 'edge', 'meta', 'actor']);
  if (multiVerbs.has(verb) && args.length > 0 && !args[0].startsWith('-')) {
    subverb = args.shift();
  }
  const { flags } = parseFlags(args);

  if (verb === 'help' || verb === '--help' || verb === '-h' || flags.help) {
    io.stdout.write(`${USAGE}\n`);
    return 0;
  }

  let projectRoot;
  try {
    projectRoot = resolveProjectRoot(flags);
  } catch (e) {
    io.stderr.write(`${e.message}\n\n${USAGE}\n`);
    return 1;
  }

  try {
    switch (verb) {
      case 'open': return await verbOpen(flags, projectRoot, io);
      case 'diff': return await verbDiff(flags, projectRoot, io);
      case 'render':
        await runRender({ projectRoot, flags });
        io.stdout.write(`atlas: rendered\n`);
        return 0;
      case 'validate': return await verbValidate(flags, projectRoot, io);
      case 'undo': return await verbUndo(flags, projectRoot, io);
      case 'feature': await verbFeature(subverb, flags, projectRoot); break;
      case 'submodule': await verbSubmodule(subverb, flags, projectRoot); break;
      case 'function': await verbFunction(subverb, flags, projectRoot); break;
      case 'variable': await verbVariable(subverb, flags, projectRoot); break;
      case 'dataflow': await verbDataflow(subverb, flags, projectRoot); break;
      case 'error': await verbError(subverb, flags, projectRoot); break;
      case 'edge': await verbEdge(subverb, flags, projectRoot); break;
      case 'meta': await verbMeta(subverb, flags, projectRoot); break;
      case 'actor': await verbActor(subverb, flags, projectRoot); break;
      default:
        io.stderr.write(`Unknown verb: ${verb}\n\n${USAGE}\n`);
        return 1;
    }
    io.stdout.write(`atlas: ${verb}${subverb ? ` ${subverb}` : ''} applied\n`);
    return 0;
  } catch (e) {
    io.stderr.write(`${e.message}\n`);
    return 1;
  }
}

module.exports = {
  USAGE,
  dispatch,
  parseFlags,
  findProjectRoot,
  resolveProjectRoot,
  loadResolvedState,
  baseAtlasDir,
  baseHtmlOutDir,
  specOverlayDir,
  runRender,
  walkArchitectureDiffDirs,
  collectDiffChanges,
  walkAfterStateHtml,
  readRemovedManifest,
  renderDiffViewer,
  toViewerRel,
};
