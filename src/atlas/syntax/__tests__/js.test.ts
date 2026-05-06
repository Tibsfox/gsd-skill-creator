import { describe, it, expect } from 'vitest';
import { parse, tokenize, detectLanguage } from '../index.js';

describe('javascript syntax', () => {
  it('detects .js / .mjs as javascript and tokenizes templates', () => {
    expect(detectLanguage('foo.js')).toBe('javascript');
    expect(detectLanguage('foo.mjs')).toBe('javascript');
    const src = "const greet = (n) => `hi ${n}`;";
    const tokens = tokenize(src, 'javascript');
    expect(tokens.some((t) => t.kind === 'template-string')).toBe(true);
  });

  it('extracts a function and an import', () => {
    const src = `
      import { foo } from "./bar.js";
      function greet(name) { return name; }
    `;
    const { ast } = parse(src, 'javascript');
    expect(ast.nodes.find((n) => n.kind === 'import')?.name).toBe('./bar.js');
    expect(ast.nodes.find((n) => n.kind === 'function')?.name).toBe('greet');
  });
});
