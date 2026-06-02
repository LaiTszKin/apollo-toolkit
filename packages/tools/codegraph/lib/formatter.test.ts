import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatApiList } from './formatter.js';

describe('formatApiList', () => {
  it('should show caller names in output when callers exist', () => {
    const apis = [
      {
        name: 'myFunc',
        kind: 'function',
        filePath: 'src/a.ts',
        startLine: 10,
        callerCount: 3,
        callers: [
          { name: 'callerOne', filePath: 'src/b.ts', startLine: 5 },
          { name: 'callerTwo', filePath: 'src/c.ts', startLine: 15 },
          { name: 'callerThree', filePath: 'src/d.ts', startLine: 25 },
        ],
      },
    ];

    const output = formatApiList(apis);

    assert.ok(output.includes('callerOne'), 'output should contain callerOne');
    assert.ok(output.includes('callerTwo'), 'output should contain callerTwo');
    assert.ok(output.includes('callerThree'), 'output should contain callerThree');
    assert.ok(output.includes('(3 callers)'), 'output should show caller count');
    assert.ok(output.includes('myFunc'), 'output should contain function name');
  });

  it('should show "(0 callers)" when there are no callers', () => {
    const apis = [
      {
        name: 'noCallers',
        kind: 'function',
        filePath: 'src/a.ts',
        startLine: 1,
        callerCount: 0,
      },
    ];

    const output = formatApiList(apis);

    assert.ok(output.includes('(0 callers)'), 'output should show zero callers');
    assert.ok(!output.includes('Called by:'), 'output should not contain caller lines');
  });
});
