import type { ScanResult } from './scanner.js';

export interface SubmoduleSuggestion {
  slug: string;
  kind: 'api' | 'service' | 'db' | 'ui' | 'pure-fn' | 'queue';
  role: string;
  memberFunctions: string[];
  memberFiles: string[];
}

/**
 * Group scanned symbols into suggested submodule groupings.
 *
 * Algorithm (hybrid):
 * 1. Build adjacency map from call graph: for each symbol, find callees within the scan
 * 2. BFS on undirected graph to find connected components
 * 3. Components with >=2 symbols create connectivity-based submodule suggestions
 * 4. Remaining (isolated) symbols fall back to per-file grouping
 * 5. Apply mergeByDirectoryPrefix as final step
 */
export function groupIntoSubmodules(scan: ScanResult, cg: any): SubmoduleSuggestion[] {
  if (scan.allSymbols.length === 0) return [];

  // --- Phase 1: Build adjacency map from call graph connectivity ---
  const allNameSet = new Set(scan.allSymbols.map(s => s.name));
  const adj = new Map<string, Set<string>>();
  const nodeKeyMap = new Map<string, { name: string; filePath: string; kind: string; isExported: boolean }>();

  for (const sym of scan.allSymbols) {
    const key = `${sym.filePath}::${sym.name}`;
    const calleeSet = new Set<string>();
    adj.set(key, calleeSet);
    nodeKeyMap.set(key, sym);

    const nodes = cg.getNodesByName(sym.name);
    for (const node of nodes) {
      if (node.filePath !== sym.filePath) continue;
      const callees = cg.getCallees(node.id);
      for (const callee of callees) {
        if (allNameSet.has(callee.node.name)) {
          calleeSet.add(callee.node.name);
        }
      }
    }
  }

  // Build reverse index: name -> list of symbol keys (for efficient BFS lookup)
  const nameToKeys = new Map<string, string[]>();
  for (const [key, sym] of nodeKeyMap.entries()) {
    const arr = nameToKeys.get(sym.name) || [];
    arr.push(key);
    nameToKeys.set(sym.name, arr);
  }

  // --- Phase 2: BFS to find connected components (undirected graph) ---
  const visited = new Set<string>();
  const components: Array<Array<{ name: string; filePath: string; kind: string; isExported: boolean }>> = [];

  for (const key of adj.keys()) {
    if (visited.has(key)) continue;

    const component: Array<{ name: string; filePath: string; kind: string; isExported: boolean }> = [];
    const queue = [key];
    visited.add(key);

    while (queue.length > 0) {
      const currentKey = queue.shift()!;
      const sym = nodeKeyMap.get(currentKey)!;
      component.push(sym);

      const calleeNames = adj.get(currentKey) || new Set();
      for (const calleeName of calleeNames) {
        const targetKeys = nameToKeys.get(calleeName) || [];
        for (const tk of targetKeys) {
          if (!visited.has(tk)) {
            visited.add(tk);
            queue.push(tk);
          }
        }
      }
    }

    if (component.length > 0) {
      components.push(component);
    }
  }

  // --- Phase 3: Build suggestions from connected components ---
  const suggestions: SubmoduleSuggestion[] = [];
  const processed = new Set<string>();

  // Components with >=2 symbols become connectivity-based submodules
  for (const component of components) {
    if (component.length < 2) continue;

    const files = [...new Set(component.map(s => s.filePath))];
    const representativePath = files[0];
    const fileName = representativePath.split('/').pop() || '';
    const slug = fileName.replace(/\.\w+$/, '').replace(/[_ ]/g, '-').toLowerCase();
    const kind = inferKind(representativePath, component);
    const role = inferRole(kind, slug, component.filter(s => s.isExported));

    for (const s of component) {
      processed.add(`${s.filePath}::${s.name}`);
    }

    suggestions.push({
      slug,
      kind,
      role,
      memberFunctions: [...new Set(component.map(s => s.name))],
      memberFiles: files,
    });
  }

  // --- Phase 4: Remaining (isolated) symbols fall back to per-file grouping ---
  for (const file of scan.files) {
    const unprocessedSymbols = file.symbols.filter(
      s => !processed.has(`${file.filePath}::${s.name}`)
    );
    if (unprocessedSymbols.length === 0 && file.symbols.length === 0) continue;

    const fileName = file.filePath.split('/').pop() || '';
    const slug = fileName.replace(/\.\w+$/, '').replace(/[_ ]/g, '-').toLowerCase();
    const kind = inferKind(file.filePath, file.symbols);
    const symbols = unprocessedSymbols.map(s => s.name);
    if (symbols.length === 0) continue;

    for (const s of unprocessedSymbols) processed.add(`${file.filePath}::${s.name}`);

    const role = inferRole(kind, slug, file.symbols.filter(s => s.isExported));
    suggestions.push({
      slug,
      kind,
      role,
      memberFunctions: symbols,
      memberFiles: [file.filePath],
    });
  }

  // --- Phase 5: Merge small files sharing a directory prefix ---
  const merged = mergeByDirectoryPrefix(suggestions, scan.directory);
  return merged;
}

function inferKind(filePath: string, symbols: Array<{ name: string; kind: string }>): SubmoduleSuggestion['kind'] {
  const lower = filePath.toLowerCase();

  // Detect by path patterns
  if (lower.includes('/api/') || lower.includes('/routes/') || lower.includes('/controller')) return 'api';
  if (lower.includes('/db/') || lower.includes('/model/') || lower.includes('/repository') || lower.includes('/schema')) return 'db';
  if (lower.includes('/ui/') || lower.includes('/component/') || lower.includes('/page/') || lower.includes('/view')) return 'ui';
  if (lower.includes('/queue/') || lower.includes('/job/') || lower.includes('/worker')) return 'queue';

  // Detect by symbol kinds
  const hasHandler = symbols.some((s) => s.kind === 'route' || s.kind === 'component');
  if (hasHandler) return 'api';

  const hasModel = symbols.some((s) => s.kind === 'interface' || s.kind === 'struct');
  if (hasModel) return 'db';

  return 'service';
}

function inferRole(kind: SubmoduleSuggestion['kind'], slug: string, exportedSymbols: Array<{ name: string; kind: string }>): string {
  const name = slug.replace(/-/g, ' ');
  switch (kind) {
    case 'api':
      return `Handles API requests for ${name}`;
    case 'db':
      return `Manages data access and persistence for ${name}`;
    case 'service':
      return `Contains business logic for ${name}`;
    case 'ui':
      return `Renders UI components for ${name}`;
    case 'queue':
      return `Processes background jobs for ${name}`;
    case 'pure-fn':
      return `Provides pure utility functions for ${name}`;
    default:
      return `Supports ${name} functionality`;
  }
}

function mergeByDirectoryPrefix(
  suggestions: SubmoduleSuggestion[],
  _directory: string,
): SubmoduleSuggestion[] {
  // When there are many single-file suggestions, merge those
  // that share a common 2-segment directory prefix
  const prefixMap = new Map<string, SubmoduleSuggestion>();

  for (const s of suggestions) {
    if (s.memberFiles.length !== 1) {
      // Already contains multiple files, keep as-is
      const key = s.slug;
      prefixMap.set(key, s);
      continue;
    }

    const filePath = s.memberFiles[0];
    const parts = filePath.split('/');
    // Use the parent directory as merge key for files in subdirs
    const mergeKey = parts.length >= 3 ? parts.slice(0, -1).join('/') : s.slug;

    if (prefixMap.has(mergeKey)) {
      const existing = prefixMap.get(mergeKey)!;
      existing.memberFunctions.push(...s.memberFunctions);
      existing.memberFiles.push(...s.memberFiles);
      // Keep more specific kind
      if (existing.kind === 'service' && s.kind !== 'service') {
        existing.kind = s.kind;
      }
    } else {
      prefixMap.set(mergeKey, {
        slug: mergeKey.replace(/\//g, '-'),
        kind: s.kind,
        role: s.role,
        memberFunctions: [...s.memberFunctions],
        memberFiles: [...s.memberFiles],
      });
    }
  }

  return Array.from(prefixMap.values());
}
