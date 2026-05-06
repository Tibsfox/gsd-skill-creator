import { describe, it, expect } from 'vitest';
import { parse, tokenize } from '../index.js';

describe('java syntax', () => {
  it('tokenizes annotations, doc-comments, text blocks', () => {
    const src = `/** doc */ @Override public void run() { String s = """multi"""; }`;
    const tokens = tokenize(src, 'java');
    expect(tokens.some((t) => t.kind === 'doc-comment')).toBe(true);
    expect(tokens.some((t) => t.kind === 'attribute')).toBe(true);
    expect(tokens.some((t) => t.kind === 'string' && t.value.startsWith('"""'))).toBe(true);
  });

  it('extracts class and a method', () => {
    const src = `
      package com.example;
      import java.util.List;
      public class Greeter {
        public String greet(String name) { return "hi " + name; }
      }
    `;
    const { ast } = parse(src, 'java');
    expect(ast.nodes.find((n) => n.kind === 'class' && n.name === 'Greeter')).toBeTruthy();
    expect(ast.nodes.some((n) => n.kind === 'method')).toBe(true);
    expect(ast.nodes.some((n) => n.kind === 'import')).toBe(true);
  });
});
