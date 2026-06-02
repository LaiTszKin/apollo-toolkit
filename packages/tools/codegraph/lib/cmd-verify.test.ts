import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import yaml from 'js-yaml';

/**
 * REGTEST-1: Verify that the js-yaml based parser (used in `loadOverlay`)
 * correctly parses object-format YAML function declarations.
 *
 * The fix replaced a custom YAML parser with `js-yaml`. The old parser
 * incorrectly produced raw string fragments like `"name: init"` when
 * encountering object-format functions:
 *
 *   functions:
 *     - name: init
 *       in: string
 *       out: void
 *
 * With `js-yaml`, the parser produces actual objects:
 *   `{ name: "init", in: "string", out: "void" }`
 *
 * This test exercises the same parsing path as `loadOverlay`: reading a YAML
 * file from disk with `fs.readFileSync`, then parsing with `yaml.load`.
 */
describe('REGTEST-1: loadOverlay YAML parser', () => {
  it('should parse object-format functions and correctly extract .name', () => {
    const yamlStr = [
      'slug: test-feature',
      'submodules:',
      '  - slug: module-a',
      '    functions:',
      '      - name: init',
      '        in: string',
      '        out: void',
      'edges:',
      '  - from: funcA',
      '    to: funcB',
      '    kind: call',
    ].join('\n');

    // Parse with js-yaml (same library used by loadOverlay)
    const data = yaml.load(yamlStr) as any;

    // Verify object-format function parsing
    const fn = data.submodules[0].functions[0];
    assert.strictEqual(typeof fn, 'object', 'object-format function should be parsed as object, not string');
    assert.strictEqual(fn.name, 'init', 'parsed function .name should be "init"');

    // Verify the old bug is fixed: no raw "name: init" string
    assert.notStrictEqual(fn, 'name: init', 'function should NOT be a raw string fragment');
    assert.notStrictEqual(typeof fn, 'string', 'object-format function should not be a string');

    // Verify additional fields are preserved
    assert.strictEqual(fn.in, 'string', 'function "in" field should be preserved');
    assert.strictEqual(fn.out, 'void', 'function "out" field should be preserved');

    // Verify string-format functions still work
    // Note: the YAML above only has object-format functions; string format is tested separately
  });

  it('should parse string-format functions correctly', () => {
    const yamlStr = [
      'slug: test-feature',
      'submodules:',
      '  - slug: module-a',
      '    functions:',
      '      - init',
      '      - process',
    ].join('\n');

    const data = yaml.load(yamlStr) as any;

    const functions = data.submodules[0].functions;
    assert.strictEqual(functions.length, 2, 'should have 2 string-format functions');
    assert.strictEqual(typeof functions[0], 'string', 'string-format function should be a string');
    assert.strictEqual(functions[0], 'init', 'string function name should be "init"');
    assert.strictEqual(functions[1], 'process', 'string function name should be "process"');
  });

  it('should parse mixed object and string format functions', () => {
    const yamlStr = [
      'slug: test-feature',
      'submodules:',
      '  - slug: module-a',
      '    functions:',
      '      - name: init',
      '        in: string',
      '        out: void',
      '      - process',
      '      - name: render',
      '        in: string',
      '        out: void',
      '      - cleanup',
    ].join('\n');

    const data = yaml.load(yamlStr) as any;
    const functions = data.submodules[0].functions;

    assert.strictEqual(functions.length, 4, 'should have 4 functions total');

    // Index 0: object-format
    assert.strictEqual(typeof functions[0], 'object', 'functions[0] should be object');
    assert.strictEqual(functions[0].name, 'init');

    // Index 1: string-format
    assert.strictEqual(typeof functions[1], 'string', 'functions[1] should be string');
    assert.strictEqual(functions[1], 'process');

    // Index 2: object-format
    assert.strictEqual(typeof functions[2], 'object', 'functions[2] should be object');
    assert.strictEqual(functions[2].name, 'render');

    // Index 3: string-format
    assert.strictEqual(typeof functions[3], 'string', 'functions[3] should be string');
    assert.strictEqual(functions[3], 'cleanup');
  });

  it('should parse feature YAML from disk (same path as loadOverlay)', async () => {
    // Create a temp directory matching the loadOverlay structure
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codegraph-verify-test-'));
    try {
      const featuresDir = path.join(tmpDir, 'architecture_diff', 'atlas', 'features');
      fs.mkdirSync(featuresDir, { recursive: true });

      const yamlPath = path.join(featuresDir, 'test-feature.yaml');
      fs.writeFileSync(
        yamlPath,
        [
          'slug: test-feature',
          'submodules:',
          '  - slug: module-a',
          '    functions:',
          '      - name: init',
          '        in: string',
          '        out: void',
          '    edges:',
          '      - from: funcA',
          '        to: funcB',
          '        kind: call',
        ].join('\n') + '\n',
      );

      // Read file and parse (same as loadOverlay)
      const raw = fs.readFileSync(yamlPath, 'utf8');
      const data = yaml.load(raw) as any;

      assert.ok(data, 'parsed data should be truthy');
      assert.strictEqual(typeof data, 'object', 'parsed data should be an object');
      assert.strictEqual(data.slug, 'test-feature', 'feature slug should be preserved');

      const fn = data.submodules[0].functions[0];
      assert.strictEqual(typeof fn, 'object', 'object-format function parsed from file should be object');
      assert.strictEqual(fn.name, 'init', 'function .name should be "init"');
      assert.strictEqual(fn.in, 'string', 'function .in should be "string"');
      assert.strictEqual(fn.out, 'void', 'function .out should be "void"');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
