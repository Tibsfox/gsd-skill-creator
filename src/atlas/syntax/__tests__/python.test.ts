import { describe, it, expect } from 'vitest';
import { parse, tokenize } from '../index.js';

describe('python syntax', () => {
  it('tokenizes comments, strings, decorators, indent/dedent', () => {
    const src = `# top\n@decorator\ndef foo():\n    return "hi"\n`;
    const tokens = tokenize(src, 'python');
    expect(tokens.some((t) => t.kind === 'comment')).toBe(true);
    expect(tokens.some((t) => t.kind === 'decorator')).toBe(true);
    expect(tokens.some((t) => t.kind === 'indent')).toBe(true);
    expect(tokens.some((t) => t.kind === 'dedent')).toBe(true);
  });

  it('extracts def and class declarations', () => {
    const src = `
import os
from typing import List

def add(a, b):
    return a + b

class Box:
    def open(self):
        return 1
`;
    const { ast } = parse(src, 'python');
    expect(ast.nodes.find((n) => n.kind === 'function' && n.name === 'add')).toBeTruthy();
    expect(ast.nodes.find((n) => n.kind === 'class' && n.name === 'Box')).toBeTruthy();
    expect(ast.nodes.some((n) => n.kind === 'import')).toBe(true);
  });
});
