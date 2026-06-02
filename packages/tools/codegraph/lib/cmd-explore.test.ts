import { describe, it, mock, before } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

// ---------------------------------------------------------------------------
// Shared mutable mock state — each test sets its own data before calling the
// handler.  The mock instance's searchNodes captures this array by reference,
// so mutations are reflected in every invocation.
// ---------------------------------------------------------------------------
interface MockSymbolNode {
  id: string;
  name: string;
  kind: string;
  filePath: string;
  startLine: number;
  endLine: number;
  qualifiedName: string;
  signature?: string;
}

interface MockSearchResult {
  node: MockSymbolNode;
  score: number;
}

const mockSearchResults: MockSearchResult[] = [];

// ---------------------------------------------------------------------------
// Pre-load @colbymchenry/codegraph so we can mock its methods before
// cmd-explore.js performs its own require().
// ---------------------------------------------------------------------------
const require = createRequire(import.meta.url);
const { CodeGraph } = require('@colbymchenry/codegraph');

let mockInstance: {
  searchNodes: () => { node: MockSymbolNode; score: number }[];
  getCallers: () => never[];
  getCallees: () => never[];
  getCode: () => Promise<null>;
  close: () => void;
} | undefined;

before(() => {
  mockInstance = {
    searchNodes: () => mockSearchResults.map(r => ({ node: r.node, score: r.score })),
    getCallers: () => [],
    getCallees: () => [],
    getCode: async () => null,
    close: () => {},
  };
  mock.method(CodeGraph, 'open', async () => mockInstance);
});

// ---------------------------------------------------------------------------
// Import the module under test (same cached CodeGraph is used internally)
// ---------------------------------------------------------------------------
let handleExplore: (
  projectRoot: string,
  query: string,
  options?: Record<string, unknown>,
) => Promise<number>;

before(async () => {
  const mod = await import('./cmd-explore.js');
  handleExplore = mod.handleExplore;
});

// =========================================================================
// REGTEST-7: Explore output should group symbols by file
// =========================================================================
describe('REGTEST-7: Explore grouping by file', () => {
  it('should group symbols under a single file header', async () => {
    // Arrange: two symbols in the same file
    mockSearchResults.length = 0;
    mockSearchResults.push(
      {
        node: {
          id: '1',
          name: 'addUser',
          kind: 'function',
          filePath: 'src/utils.ts',
          startLine: 10,
          endLine: 25,
          qualifiedName: 'utils.addUser',
          signature: '(name: string, age: number): User',
        },
        score: 0.95,
      },
      {
        node: {
          id: '2',
          name: 'deleteUser',
          kind: 'function',
          filePath: 'src/utils.ts',
          startLine: 30,
          endLine: 40,
          qualifiedName: 'utils.deleteUser',
          signature: '(id: number): void',
        },
        score: 0.85,
      },
    );

    // Capture stdout
    const stdoutChunks: string[] = [];
    const origWrite = process.stdout.write;
    process.stdout.write = ((chunk: unknown) => {
      stdoutChunks.push(String(chunk));
      return true;
    }) as typeof process.stdout.write;

    try {
      // Act
      const exitCode = await handleExplore('/fake/project', 'utils', {});

      // Assert
      assert.strictEqual(exitCode, 0);
      const output = stdoutChunks.join('');

      // Exactly one file header for the shared filePath
      const headerMatches = output.match(/=== src\/utils\.ts ===/g);
      assert.strictEqual(
        headerMatches?.length,
        1,
        'Expected exactly one file header for src/utils.ts, ' +
          `got ${headerMatches?.length ?? 0}`,
      );

      // Both symbols appear in the output
      assert.ok(output.includes('addUser'), 'Output should contain addUser');
      assert.ok(output.includes('deleteUser'), 'Output should contain deleteUser');

      // File header precedes both symbols (not duplicated)
      const headerIdx = output.indexOf('=== src/utils.ts ===');
      assert.ok(
        headerIdx < output.indexOf('addUser'),
        'File header should appear before addUser',
      );
      assert.ok(
        headerIdx < output.indexOf('deleteUser'),
        'File header should appear before deleteUser',
      );
    } finally {
      process.stdout.write = origWrite;
    }
  });
});

// =========================================================================
// REGTEST-8: Explore --feature acceptance
// =========================================================================
describe('REGTEST-8: Explore --feature acceptance', () => {
  it('should accept feature parameter without error', async () => {
    // Arrange: at least one result so the feature line is emitted
    mockSearchResults.length = 0;
    mockSearchResults.push({
      node: {
        id: '3',
        name: 'authLogin',
        kind: 'function',
        filePath: 'src/auth.ts',
        startLine: 5,
        endLine: 20,
        qualifiedName: 'auth.login',
        signature: '(credentials: Record<string, unknown>): Session',
      },
      score: 0.9,
    });

    const stdoutChunks: string[] = [];
    const origWrite = process.stdout.write;
    process.stdout.write = ((chunk: unknown) => {
      stdoutChunks.push(String(chunk));
      return true;
    }) as typeof process.stdout.write;

    try {
      // Act — pass feature without json, expect no error
      const exitCode = await handleExplore('/fake/project', 'authLogin', {
        feature: 'auth',
        json: false,
      });

      // Assert
      assert.strictEqual(exitCode, 0, 'Should return exit code 0');
      const output = stdoutChunks.join('');
      assert.ok(
        output.includes('Feature: auth'),
        'Output should include "Feature: auth" header',
      );
    } finally {
      process.stdout.write = origWrite;
    }
  });
});
