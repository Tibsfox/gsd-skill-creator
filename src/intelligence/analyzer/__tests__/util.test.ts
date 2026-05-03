/**
 * C02 T2 — Shared tree-sitter traversal util tests.
 */

import { describe, it, expect } from 'vitest';
import Parser from 'tree-sitter';
import TSGrammar from 'tree-sitter-typescript';
import { walk, nodeText, linesOfCode, cyclomaticComplexity } from '../languages/util.js';
import type { TSNode } from '../languages/util.js';

// Build a parser for these tests
const parser = new Parser();
// @ts-expect-error tree-sitter grammar typing
parser.setLanguage(TSGrammar.typescript);

function parseTs(src: string): TSNode {
  return parser.parse(src).rootNode as unknown as TSNode;
}

describe('walk', () => {
  it('visits all nodes in pre-order', () => {
    const root = parseTs('const x = 1 + 2;');
    const types: string[] = [];
    walk(root, () => true, (node) => types.push(node.type));
    // Root should be first
    expect(types[0]).toBe('program');
    // Should have multiple nodes
    expect(types.length).toBeGreaterThan(3);
  });

  it('predicate filters which nodes to visit', () => {
    const root = parseTs('export function foo() {} export function bar() {}');
    const names: string[] = [];
    walk(
      root,
      (node) => node.type === 'function_declaration' || node.type === 'program' || node.type === 'export_statement',
      (node) => {
        if (node.type === 'function_declaration') {
          names.push(node.childForFieldName?.('name')?.text ?? '');
        }
      },
    );
    expect(names).toContain('foo');
    expect(names).toContain('bar');
  });
});

describe('nodeText', () => {
  it('extracts text from a node by byte range', () => {
    const source = 'const x = 42;';
    const root = parseTs(source);
    // Find the number literal
    let numNode: TSNode | null = null;
    walk(root, () => true, (node) => {
      if (node.type === 'number') numNode = node;
    });
    expect(numNode).not.toBeNull();
    expect(nodeText(source, numNode!)).toBe('42');
  });
});

describe('linesOfCode', () => {
  it('counts non-blank, non-comment lines', () => {
    const source = [
      'export function foo() {', // 1
      '  // comment',            // skip (comment)
      '  const x = 1;',         // 2
      '',                        // skip (blank)
      '  /* block comment */',   // skip (comment)
      '  return x;',             // 3
      '}',                       // 4
      '',                        // skip (blank)
      '// another comment',      // skip (comment)
      'export const y = 2;',    // 5
    ].join('\n');
    expect(linesOfCode(source, '//')).toBe(5);
  });

  it('uses # as comment delimiter for Python-style', () => {
    const source = [
      'def foo():',  // 1
      '  # comment', // skip
      '  x = 1',    // 2
      '',            // skip
      '  return x',  // 3
    ].join('\n');
    expect(linesOfCode(source, '#')).toBe(3);
  });

  it('returns 0 for empty source', () => {
    expect(linesOfCode('', '//')).toBe(0);
  });

  it('blank-only source returns 0', () => {
    expect(linesOfCode('\n\n\n', '//')).toBe(0);
  });
});

describe('cyclomaticComplexity', () => {
  it('if/else counts as 2 (1 base + 1 branch)', () => {
    const source = 'function foo(a: unknown) { if (a) { return 1; } else { return 2; } }';
    const root = parseTs(source);
    let fnNode: TSNode | null = null;
    walk(root, () => true, (node) => {
      if (node.type === 'function_declaration') fnNode = node;
    });
    expect(fnNode).not.toBeNull();
    const cc = cyclomaticComplexity(fnNode!, source, ['if_statement', 'else_clause', 'while_statement', 'for_statement', 'switch_case', '&&', '||', '?']);
    expect(cc).toBeGreaterThanOrEqual(2);
  });

  it('empty function has complexity 1', () => {
    const source = 'function foo() {}';
    const root = parseTs(source);
    let fnNode: TSNode | null = null;
    walk(root, () => true, (node) => {
      if (node.type === 'function_declaration') fnNode = node;
    });
    expect(fnNode).not.toBeNull();
    const cc = cyclomaticComplexity(fnNode!, source, ['if_statement', 'while_statement', 'for_statement']);
    expect(cc).toBe(1);
  });
});
