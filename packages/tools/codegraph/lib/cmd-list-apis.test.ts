import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('handleListApis', () => {
  it('should group APIs by directory when --all is used and show ungrouped output without --all', async (ctx) => {
    const nodes = [
      {
        id: 'n1',
        name: 'funcA',
        kind: 'function',
        filePath: 'src/feature/a.ts',
        startLine: 10,
        endLine: 30,
        qualifiedName: 'funcA',
        signature: '(x: string): void',
        isExported: true,
      },
      {
        id: 'n2',
        name: 'funcB',
        kind: 'function',
        filePath: 'src/lib/b.ts',
        startLine: 5,
        endLine: 25,
        qualifiedName: 'funcB',
        signature: '(y: number): string',
        isExported: true,
      },
    ];

    ctx.mock.module('@colbymchenry/codegraph', {
      namedExports: {
        CodeGraph: {
          open: async () => ({
            getNodesByKind: (_kind: string) => nodes,
            getCallers: (_id: string) => [],
            close: () => {},
          }),
        },
      },
    });

    const { handleListApis } = await import('./cmd-list-apis.js');

    // Test 1: --all produces directory-grouped output
    {
      const chunks: string[] = [];
      ctx.mock.method(process.stdout, 'write', (chunk: string | Uint8Array) => {
        chunks.push(String(chunk));
      });

      await handleListApis('/fake/root', undefined, { all: true });

      const output = chunks.join('');
      assert.ok(output.includes('=== src/feature/ ==='), 'should group under src/feature/');
      assert.ok(output.includes('=== src/lib/ ==='), 'should group under src/lib/');
      assert.ok(output.includes('funcA'), 'should list funcA in output');
      assert.ok(output.includes('funcB'), 'should list funcB in output');
      ctx.mock.reset();
    }

    // Test 2: without --all, output is not grouped
    {
      const chunks: string[] = [];
      ctx.mock.method(process.stdout, 'write', (chunk: string | Uint8Array) => {
        chunks.push(String(chunk));
      });

      await handleListApis('/fake/root', undefined, { all: false });

      const output = chunks.join('');
      assert.ok(!output.includes('=== src/feature/ ==='), 'should not group under src/feature/');
      assert.ok(!output.includes('=== src/lib/ ==='), 'should not group under src/lib/');
      assert.ok(output.includes('APIs'), 'should start with APIs count');
    }
  });
});
