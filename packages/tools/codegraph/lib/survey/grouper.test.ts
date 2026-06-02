import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { groupIntoSubmodules } from './grouper.js';

describe('groupIntoSubmodules', () => {
  it('groups connected call graph symbols into one submodule (hybrid connectivity grouping)', () => {
    // -----------------------------------------------------------------------
    // GIVEN a scan result with functions A, B, C where A calls B and B calls C
    // (all in the same file, forming a connected chain)
    // -----------------------------------------------------------------------
    const filePath = 'src/module.ts';

    const scan = {
      directory: 'src',
      files: [
        {
          filePath,
          language: 'typescript',
          symbols: [
            { name: 'A', kind: 'function', qualifiedName: 'A', startLine: 1, endLine: 5, isExported: true },
            { name: 'B', kind: 'function', qualifiedName: 'B', startLine: 6, endLine: 10, isExported: true },
            { name: 'C', kind: 'function', qualifiedName: 'C', startLine: 11, endLine: 15, isExported: false },
          ],
        },
      ],
      allSymbols: [
        { name: 'A', kind: 'function', filePath, qualifiedName: 'A', startLine: 1, isExported: true },
        { name: 'B', kind: 'function', filePath, qualifiedName: 'B', startLine: 6, isExported: true },
        { name: 'C', kind: 'function', filePath, qualifiedName: 'C', startLine: 11, isExported: false },
      ],
      totalFiles: 1,
      totalSymbols: 3,
    };

    // Mock call graph: A -> B -> C
    const mockCg = {
      getNodesByName(name: string) {
        const nodeId = `node-${name}`;
        return [{ id: nodeId, filePath }];
      },
      getCallees(nodeId: string) {
        const calleeMap: Record<string, string[]> = {
          'node-A': ['B'],
          'node-B': ['C'],
          'node-C': [],
        };
        return (calleeMap[nodeId] || []).map((calleeName: string) => ({
          node: { name: calleeName },
        }));
      },
    };

    // -----------------------------------------------------------------------
    // WHEN groupIntoSubmodules(scan, mockCg) runs
    // -----------------------------------------------------------------------
    const result = groupIntoSubmodules(scan as any, mockCg);

    // -----------------------------------------------------------------------
    // THEN A, B, C are grouped into one submodule
    //   (connectivity-based grouping takes priority over per-file isolation)
    // -----------------------------------------------------------------------
    assert.equal(result.length, 1, 'should produce exactly one submodule');

    const sortedMembers = [...result[0].memberFunctions].sort();
    assert.deepEqual(sortedMembers, ['A', 'B', 'C'], 'should contain A, B, C');

    assert.ok(
      result[0].memberFiles.includes(filePath),
      'should include the source file in memberFiles',
    );
  });
});
