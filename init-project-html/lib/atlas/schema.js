'use strict';

// schema.js — single source of truth for atlas component shapes,
// enum vocabularies, and validation. The CLI, render layer, and tests
// all consult this file so DOM/CSS hooks stay aligned with the
// declarative state.

const SUBMODULE_KINDS = Object.freeze([
  'ui',
  'api',
  'service',
  'db',
  'pure-fn',
  'queue',
  'external',
]);

const SIDE_EFFECTS = Object.freeze([
  'pure',
  'io',
  'write',
  'tx',
  'lock',
  'network',
]);

const VARIABLE_SCOPES = Object.freeze([
  'call',
  'tx',
  'persist',
  'instance',
  'loop',
]);

const EDGE_KINDS = Object.freeze([
  'call',
  'return',
  'data-row',
  'failure',
]);

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;

function isSlug(value) {
  return typeof value === 'string' && SLUG_PATTERN.test(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function requireField(errors, where, name, value, predicate, hint) {
  if (!predicate(value)) {
    errors.push(`${where}: invalid or missing "${name}"${hint ? ` (${hint})` : ''}`);
    return false;
  }
  return true;
}

function validateMeta(meta, errors) {
  if (!meta || typeof meta !== 'object') {
    errors.push('meta: missing object');
    return;
  }
  if (meta.title !== undefined) requireField(errors, 'meta', 'title', meta.title, isNonEmptyString);
  if (meta.summary !== undefined && typeof meta.summary !== 'string') {
    errors.push('meta: "summary" must be a string when present');
  }
}

function validateActor(actor, errors, idx) {
  const where = `actors[${idx}]`;
  requireField(errors, where, 'id', actor && actor.id, isSlug, 'kebab-case slug');
  requireField(errors, where, 'label', actor && actor.label, isNonEmptyString);
}

function validateFunction(fn, errors, where) {
  requireField(errors, where, 'name', fn && fn.name, isNonEmptyString);
  if (fn && fn.in !== undefined && typeof fn.in !== 'string') errors.push(`${where}: "in" must be a string`);
  if (fn && fn.out !== undefined && typeof fn.out !== 'string') errors.push(`${where}: "out" must be a string`);
  if (fn && fn.side !== undefined && !SIDE_EFFECTS.includes(fn.side)) {
    errors.push(`${where}: "side" must be one of ${SIDE_EFFECTS.join('|')}`);
  }
  if (fn && fn.purpose !== undefined && typeof fn.purpose !== 'string') {
    errors.push(`${where}: "purpose" must be a string`);
  }
}

function validateVariable(v, errors, where) {
  requireField(errors, where, 'name', v && v.name, isNonEmptyString);
  if (v && v.type !== undefined && typeof v.type !== 'string') errors.push(`${where}: "type" must be a string`);
  if (v && v.scope !== undefined && !VARIABLE_SCOPES.includes(v.scope)) {
    errors.push(`${where}: "scope" must be one of ${VARIABLE_SCOPES.join('|')}`);
  }
  if (v && v.purpose !== undefined && typeof v.purpose !== 'string') {
    errors.push(`${where}: "purpose" must be a string`);
  }
}

function validateError(err, errors, where) {
  requireField(errors, where, 'name', err && err.name, isNonEmptyString);
  if (err && err.when !== undefined && typeof err.when !== 'string') errors.push(`${where}: "when" must be a string`);
  if (err && err.means !== undefined && typeof err.means !== 'string') errors.push(`${where}: "means" must be a string`);
}

function validateSubmodule(sub, errors, where) {
  requireField(errors, where, 'slug', sub && sub.slug, isSlug, 'kebab-case slug');
  if (sub && sub.kind !== undefined && !SUBMODULE_KINDS.includes(sub.kind)) {
    errors.push(`${where}: "kind" must be one of ${SUBMODULE_KINDS.join('|')}`);
  }
  if (sub && sub.role !== undefined && typeof sub.role !== 'string') {
    errors.push(`${where}: "role" must be a string`);
  }

  if (sub && sub.functions) {
    if (!Array.isArray(sub.functions)) {
      errors.push(`${where}: "functions" must be an array`);
    } else {
      sub.functions.forEach((fn, i) => validateFunction(fn, errors, `${where}.functions[${i}]`));
    }
  }
  if (sub && sub.variables) {
    if (!Array.isArray(sub.variables)) {
      errors.push(`${where}: "variables" must be an array`);
    } else {
      sub.variables.forEach((v, i) => validateVariable(v, errors, `${where}.variables[${i}]`));
    }
  }
  if (sub && sub.dataflow) {
    if (!Array.isArray(sub.dataflow)) {
      errors.push(`${where}: "dataflow" must be an array of step strings`);
    } else {
      sub.dataflow.forEach((step, i) => {
        if (typeof step !== 'string') errors.push(`${where}.dataflow[${i}]: must be a string`);
      });
    }
  }
  if (sub && sub.errors) {
    if (!Array.isArray(sub.errors)) {
      errors.push(`${where}: "errors" must be an array`);
    } else {
      sub.errors.forEach((err, i) => validateError(err, errors, `${where}.errors[${i}]`));
    }
  }
}

function validateEdgeEndpoint(endpoint, errors, where, allowSelf = false) {
  if (typeof endpoint === 'string') {
    if (allowSelf) {
      if (!isSlug(endpoint)) errors.push(`${where}: endpoint slug must be kebab-case`);
      return;
    }
    errors.push(`${where}: cross-feature endpoint must be an object {feature, submodule}`);
    return;
  }
  if (!endpoint || typeof endpoint !== 'object') {
    errors.push(`${where}: endpoint missing`);
    return;
  }
  if (!isSlug(endpoint.feature)) errors.push(`${where}: endpoint.feature must be a kebab-case slug`);
  if (endpoint.submodule !== undefined && endpoint.submodule !== null && !isSlug(endpoint.submodule)) {
    errors.push(`${where}: endpoint.submodule must be a kebab-case slug when present`);
  }
}

function validateEdge(edge, errors, where, { allowSelf = false } = {}) {
  if (edge && edge.id !== undefined && !isSlug(edge.id)) {
    errors.push(`${where}: "id" must be a kebab-case slug`);
  }
  if (edge && edge.kind !== undefined && !EDGE_KINDS.includes(edge.kind)) {
    errors.push(`${where}: "kind" must be one of ${EDGE_KINDS.join('|')}`);
  }
  validateEdgeEndpoint(edge && edge.from, errors, `${where}.from`, allowSelf);
  validateEdgeEndpoint(edge && edge.to, errors, `${where}.to`, allowSelf);
  if (edge && edge.label !== undefined && typeof edge.label !== 'string') {
    errors.push(`${where}: "label" must be a string`);
  }
}

function validateFeature(feature, errors, where) {
  requireField(errors, where, 'slug', feature && feature.slug, isSlug, 'kebab-case slug');
  if (feature && feature.title !== undefined) requireField(errors, where, 'title', feature.title, isNonEmptyString);
  if (feature && feature.story !== undefined && typeof feature.story !== 'string') {
    errors.push(`${where}: "story" must be a string`);
  }
  if (feature && feature.dependsOn) {
    if (!Array.isArray(feature.dependsOn)) errors.push(`${where}: "dependsOn" must be a list of feature slugs`);
    else feature.dependsOn.forEach((slug, i) => {
      if (!isSlug(slug)) errors.push(`${where}.dependsOn[${i}]: must be kebab-case slug`);
    });
  }
  if (feature && feature.submodules) {
    if (!Array.isArray(feature.submodules)) errors.push(`${where}: "submodules" must be an array`);
    else {
      const slugs = new Set();
      feature.submodules.forEach((sub, i) => {
        validateSubmodule(sub, errors, `${where}.submodules[${i}]`);
        if (sub && isSlug(sub.slug)) {
          if (slugs.has(sub.slug)) errors.push(`${where}: duplicate submodule slug "${sub.slug}"`);
          slugs.add(sub.slug);
        }
      });
    }
  }
  if (feature && feature.edges) {
    if (!Array.isArray(feature.edges)) errors.push(`${where}: "edges" must be an array`);
    else feature.edges.forEach((edge, i) => validateEdge(edge, errors, `${where}.edges[${i}]`, { allowSelf: true }));
  }
}

// validate(state) checks structural shape, enum membership, and
// referential integrity (every edge endpoint resolves to a known
// feature/submodule). Returns an array of error strings; empty = ok.
function validate(state) {
  const errors = [];
  if (!state || typeof state !== 'object') {
    return ['state: must be an object'];
  }

  validateMeta(state.meta, errors);

  if (state.actors) {
    if (!Array.isArray(state.actors)) errors.push('actors: must be an array');
    else state.actors.forEach((actor, i) => validateActor(actor, errors, i));
  }

  if (!Array.isArray(state.features)) {
    errors.push('features: must be an array');
  } else {
    const featureSlugs = new Set();
    state.features.forEach((feature, i) => {
      validateFeature(feature, errors, `features[${i}]`);
      if (feature && isSlug(feature.slug)) {
        if (featureSlugs.has(feature.slug)) errors.push(`features: duplicate feature slug "${feature.slug}"`);
        featureSlugs.add(feature.slug);
      }
    });

    // referential integrity for intra-feature edges
    for (const feature of state.features) {
      if (!feature || !Array.isArray(feature.edges)) continue;
      const subSlugs = new Set((feature.submodules || []).map((s) => s && s.slug).filter(Boolean));
      feature.edges.forEach((edge, i) => {
        const where = `features[${feature.slug}].edges[${i}]`;
        for (const [side, ep] of [['from', edge && edge.from], ['to', edge && edge.to]]) {
          if (typeof ep === 'string') {
            if (!subSlugs.has(ep)) errors.push(`${where}.${side}: unknown submodule "${ep}" in feature "${feature.slug}"`);
          } else if (ep && typeof ep === 'object' && ep.feature && ep.feature !== feature.slug) {
            errors.push(`${where}.${side}: intra-feature edge cannot point at another feature "${ep.feature}"`);
          } else if (ep && ep.submodule && !subSlugs.has(ep.submodule)) {
            errors.push(`${where}.${side}: unknown submodule "${ep.submodule}"`);
          }
        }
      });
    }
  }

  if (state.edges) {
    if (!Array.isArray(state.edges)) errors.push('edges: must be an array');
    else state.edges.forEach((edge, i) => validateEdge(edge, errors, `edges[${i}]`));
  }

  // referential integrity for cross-feature edges
  if (Array.isArray(state.edges) && Array.isArray(state.features)) {
    const featureMap = new Map();
    for (const feature of state.features) {
      if (!feature || !isSlug(feature.slug)) continue;
      featureMap.set(feature.slug, new Set((feature.submodules || []).map((s) => s && s.slug).filter(Boolean)));
    }
    state.edges.forEach((edge, i) => {
      const where = `edges[${i}]`;
      for (const [side, ep] of [['from', edge && edge.from], ['to', edge && edge.to]]) {
        if (!ep || typeof ep !== 'object') continue;
        if (!featureMap.has(ep.feature)) errors.push(`${where}.${side}: unknown feature "${ep.feature}"`);
        else if (ep.submodule && !featureMap.get(ep.feature).has(ep.submodule)) {
          errors.push(`${where}.${side}: unknown submodule "${ep.submodule}" in feature "${ep.feature}"`);
        }
      }
    });
  }

  return errors;
}

// emptyState() returns a minimal valid in-memory state. Used by the
// CLI when no atlas exists yet.
function emptyState({ title = 'Project architecture' } = {}) {
  return {
    meta: {
      title,
      summary: '',
      updatedAt: null,
    },
    actors: [],
    features: [],
    edges: [],
  };
}

module.exports = {
  SUBMODULE_KINDS,
  SIDE_EFFECTS,
  VARIABLE_SCOPES,
  EDGE_KINDS,
  SLUG_PATTERN,
  isSlug,
  isNonEmptyString,
  validate,
  emptyState,
};
