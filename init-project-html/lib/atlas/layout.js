'use strict';

// layout.js — wraps elkjs to lay out the macro atlas. Features are
// nested compound nodes; submodules are leaf nodes inside them.
// hierarchyHandling=INCLUDE_CHILDREN lets cross-cluster edges route
// past intermediate nodes. The flatten step rebases every node and
// edge section into absolute (root-relative) coordinates so render.js
// can emit SVG without further math.
//
// Layout is async because elkjs returns a Promise even in Node.

const ELK = require('elkjs');

const SUB_WIDTH = 240;
const SUB_HEIGHT = 92;
const CLUSTER_PAD_TOP = 60;
const CLUSTER_PAD_SIDE = 24;
const CLUSTER_PAD_BOTTOM = 28;
const EDGE_LABEL_HEIGHT = 18;

function estimateLabelWidth(text) {
  if (!text) return 0;
  return Math.min(220, Math.max(40, String(text).length * 7 + 16));
}

function endpointId(endpoint, ownerFeature) {
  if (typeof endpoint === 'string') {
    return `submodule::${ownerFeature}::${endpoint}`;
  }
  if (endpoint && endpoint.submodule) {
    return `submodule::${endpoint.feature}::${endpoint.submodule}`;
  }
  if (endpoint && endpoint.feature) {
    return `feature::${endpoint.feature}`;
  }
  return null;
}

function buildGraph(state) {
  const children = (state.features || []).map((feature) => ({
    id: `feature::${feature.slug}`,
    labels: [{
      id: `feature::${feature.slug}::label`,
      text: feature.title || feature.slug,
      width: estimateLabelWidth(feature.title || feature.slug),
      height: 24,
    }],
    layoutOptions: {
      'elk.padding': `[top=${CLUSTER_PAD_TOP},left=${CLUSTER_PAD_SIDE},bottom=${CLUSTER_PAD_BOTTOM},right=${CLUSTER_PAD_SIDE}]`,
      'elk.spacing.nodeNode': '24',
      'elk.algorithm': 'layered',
      'elk.direction': 'DOWN',
      'elk.layered.spacing.nodeNodeBetweenLayers': '36',
      'elk.nodeLabels.placement': '[H_CENTER, V_TOP, INSIDE]',
    },
    children: (feature.submodules || []).map((sub) => ({
      id: `submodule::${feature.slug}::${sub.slug}`,
      width: SUB_WIDTH,
      height: SUB_HEIGHT,
      labels: [{
        id: `submodule::${feature.slug}::${sub.slug}::label`,
        text: sub.slug,
        width: estimateLabelWidth(sub.slug),
        height: 18,
      }],
    })),
  }));

  let nextEdgeId = 0;
  const rootEdges = [];
  const nestedEdges = new Map(); // feature slug → edges[]

  function pushEdge(list, raw, sourceId, targetId) {
    if (!sourceId || !targetId) return;
    list.push({
      id: raw.id || `e-${nextEdgeId++}`,
      sources: [sourceId],
      targets: [targetId],
      labels: raw.label ? [{
        id: `${raw.id || `e-${nextEdgeId}`}::label`,
        text: raw.label,
        width: estimateLabelWidth(raw.label),
        height: EDGE_LABEL_HEIGHT,
      }] : [],
    });
  }

  for (const feature of state.features || []) {
    const list = [];
    for (const edge of feature.edges || []) {
      pushEdge(list, edge, endpointId(edge.from, feature.slug), endpointId(edge.to, feature.slug));
    }
    if (list.length > 0) nestedEdges.set(feature.slug, list);
  }
  for (const edge of state.edges || []) {
    pushEdge(rootEdges, edge, endpointId(edge.from), endpointId(edge.to));
  }

  for (const child of children) {
    const slug = child.id.replace(/^feature::/, '');
    if (nestedEdges.has(slug)) child.edges = nestedEdges.get(slug);
  }

  return {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
      'elk.spacing.nodeNode': '60',
      'elk.layered.spacing.nodeNodeBetweenLayers': '100',
      'elk.padding': '[top=40,left=40,bottom=40,right=40]',
      'elk.edgeRouting': 'ORTHOGONAL',
      'elk.edgeLabels.inline': 'false',
      'elk.edgeLabels.placement': 'CENTER',
    },
    children,
    edges: rootEdges,
  };
}

function collectAbsolute(node, offsetX, offsetY, acc) {
  // node may be root, a cluster, or a leaf.
  const absX = offsetX + (node.x || 0);
  const absY = offsetY + (node.y || 0);

  if (node.id && node.id.startsWith('feature::')) {
    acc.features.push({
      id: node.id,
      slug: node.id.replace(/^feature::/, ''),
      x: absX,
      y: absY,
      width: node.width || 0,
      height: node.height || 0,
      labels: (node.labels || []).map((l) => ({
        text: l.text,
        x: absX + (l.x || 0),
        y: absY + (l.y || 0),
        width: l.width || 0,
        height: l.height || 0,
      })),
    });
  } else if (node.id && node.id.startsWith('submodule::')) {
    const parts = node.id.split('::');
    acc.submodules.push({
      id: node.id,
      featureSlug: parts[1],
      slug: parts[2],
      x: absX,
      y: absY,
      width: node.width || SUB_WIDTH,
      height: node.height || SUB_HEIGHT,
      labels: (node.labels || []).map((l) => ({
        text: l.text,
        x: absX + (l.x || 0),
        y: absY + (l.y || 0),
        width: l.width || 0,
        height: l.height || 0,
      })),
    });
  }

  for (const edge of node.edges || []) {
    const sections = (edge.sections || []).map((section) => ({
      startPoint: { x: section.startPoint.x + absX, y: section.startPoint.y + absY },
      endPoint: { x: section.endPoint.x + absX, y: section.endPoint.y + absY },
      bendPoints: (section.bendPoints || []).map((p) => ({ x: p.x + absX, y: p.y + absY })),
    }));
    const labels = (edge.labels || []).map((label) => ({
      text: label.text,
      x: absX + (label.x || 0),
      y: absY + (label.y || 0),
      width: label.width || 0,
      height: label.height || 0,
    }));
    acc.edges.push({ id: edge.id, sections, labels });
  }

  for (const child of node.children || []) {
    collectAbsolute(child, absX, absY, acc);
  }
}

function assertNoOverlap(layout) {
  const boxes = [];
  for (const sub of layout.submodules) {
    boxes.push({ id: sub.id, x: sub.x, y: sub.y, w: sub.width, h: sub.height });
  }
  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = i + 1; j < boxes.length; j += 1) {
      const a = boxes[i];
      const b = boxes[j];
      const overlapX = a.x < b.x + b.w && b.x < a.x + a.w;
      const overlapY = a.y < b.y + b.h && b.y < a.y + a.h;
      if (overlapX && overlapY) {
        throw new Error(`atlas layout: submodule rectangles overlap: ${a.id} vs ${b.id}`);
      }
    }
  }
}

async function layoutMacro(state) {
  if (!state.features || state.features.length === 0) {
    return { width: 320, height: 160, features: [], submodules: [], edges: [], empty: true };
  }
  const elk = new ELK();
  const graph = buildGraph(state);
  const laidOut = await elk.layout(graph);
  const acc = { features: [], submodules: [], edges: [] };
  collectAbsolute(laidOut, 0, 0, acc);
  const layout = {
    width: laidOut.width || 0,
    height: laidOut.height || 0,
    features: acc.features,
    submodules: acc.submodules,
    edges: acc.edges,
    empty: false,
  };
  assertNoOverlap(layout);
  return layout;
}

module.exports = {
  SUB_WIDTH,
  SUB_HEIGHT,
  layoutMacro,
  assertNoOverlap,
  buildGraph,
};
