import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * REGTEST-2: Verify that `verifyOverlay` correctly validates edge
 * relationships by checking `getCallees()` / `getCallers()`.
 *
 * The fix added a caller/callee relationship check after confirming both
 * edge endpoints exist in the CodeGraph index. Previously, edges were
 * only validated for existence of the from/to symbols, not for actual
 * call relationships.
 */
describe('REGTEST-2: Edge relationship validation', () => {
  it('should report edge failure when no caller/callee relationship exists', async () => {
    // Mock CodeGraph where:
    // - funcA and funcB both exist as nodes
    // - funcA has NO callees (no relationship with funcB)
    // - The feature slug resolves to a known file so the feature check passes
    const mockCg = {
      searchNodes: (name: string) => {
        if (name === 'test-feature') return [{ node: { id: 'id-feature', name: 'test-feature' } }];
        if (name === 'funcA') return [{ node: { id: 'id-a', name: 'funcA' } }];
        if (name === 'funcB') return [{ node: { id: 'id-b', name: 'funcB' } }];
        return [];
      },
      getFiles: () => [{ path: 'test-feature/mod-a.ts' }],
      getCallees: () => [],
      getCallers: () => [],
    };

    const { verifyOverlay } = await import('./checker.js');

    const overlay = {
      features: {
        'test-feature': {
          submodules: [{ slug: 'mod-a', functions: ['funcA', 'funcB'] }],
          edges: [{ from: 'funcA', to: 'funcB', kind: 'call' }],
        },
      },
    };

    const report = await verifyOverlay(mockCg as any, overlay);

    // Feature and functions should pass; the edge should fail
    assert.ok(Array.isArray(report.failed), 'failed should be an array');
    const edgeFails = report.failed.filter((f) => f.type === 'edge');
    assert.strictEqual(edgeFails.length, 1, 'should report exactly 1 edge failure');

    const edgeFail = edgeFails[0];
    assert.match(
      edgeFail.location,
      /funcA\s*->\s*funcB/,
      'edge failure location should mention funcA -> funcB',
    );
    assert.ok(
      edgeFail.suggestion?.toLowerCase().includes('no actual call'),
      'failure suggestion should mention missing call relationship',
    );

    assert.strictEqual(report.passed, 3, 'feature + 2 functions should pass');
    assert.strictEqual(report.total, 4, 'total = 3 passed + 1 failed');
  });

  it('should pass edge when caller/callee relationship exists', async () => {
    // Mock CodeGraph where:
    // - funcA and funcB both exist as nodes
    // - funcA's getCallees returns funcB (relationship exists)
    const mockCg = {
      searchNodes: (name: string) => {
        if (name === 'test-feature') return [{ node: { id: 'id-feature', name: 'test-feature' } }];
        if (name === 'funcA') return [{ node: { id: 'id-a', name: 'funcA' } }];
        if (name === 'funcB') return [{ node: { id: 'id-b', name: 'funcB' } }];
        return [];
      },
      getFiles: () => [{ path: 'test-feature/mod-a.ts' }],
      getCallees: (id: string) => {
        if (id === 'id-a') return [{ node: { id: 'id-b', name: 'funcB' } }];
        return [];
      },
      getCallers: () => [],
    };

    const { verifyOverlay } = await import('./checker.js');

    const overlay = {
      features: {
        'test-feature': {
          submodules: [{ slug: 'mod-a', functions: ['funcA', 'funcB'] }],
          edges: [{ from: 'funcA', to: 'funcB', kind: 'call' }],
        },
      },
    };

    const report = await verifyOverlay(mockCg as any, overlay);

    assert.strictEqual(report.failed.length, 0, 'no failures expected');
    // 1 feature + 2 functions + 1 edge = 4 passed
    assert.strictEqual(report.passed, 4, 'feature + 2 functions + edge should all pass');
    assert.strictEqual(report.total, 4, 'total = 4 passed');
  });

  it('should handle getCallees throwing gracefully (fallback to next result)', async () => {
    // Mock CodeGraph where getCallees throws on the first search result
    // but the second result has the relationship
    const mockCg = {
      searchNodes: (name: string) => {
        if (name === 'test-feature') return [{ node: { id: 'id-feature', name: 'test-feature' } }];
        if (name === 'funcA') return [
          { node: { id: 'id-a-bad', name: 'funcA' } },
          { node: { id: 'id-a-good', name: 'funcA' } },
        ];
        if (name === 'funcB') return [{ node: { id: 'id-b', name: 'funcB' } }];
        return [];
      },
      getFiles: () => [{ path: 'test-feature/mod-a.ts' }],
      getCallees: (id: string) => {
        if (id === 'id-a-bad') throw new Error('index error');
        if (id === 'id-a-good') return [{ node: { id: 'id-b', name: 'funcB' } }];
        return [];
      },
      getCallers: () => [],
    };

    const { verifyOverlay } = await import('./checker.js');

    const overlay = {
      features: {
        'test-feature': {
          submodules: [{ slug: 'mod-a', functions: ['funcA', 'funcB'] }],
          edges: [{ from: 'funcA', to: 'funcB', kind: 'call' }],
        },
      },
    };

    const report = await verifyOverlay(mockCg as any, overlay);

    assert.strictEqual(report.failed.length, 0, 'no failures expected despite thrown error on first result');
    assert.strictEqual(report.passed, 4, 'all checks should pass');
  });
});
