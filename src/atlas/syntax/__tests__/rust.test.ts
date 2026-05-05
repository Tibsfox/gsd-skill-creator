import { describe, it, expect } from 'vitest';
import { parse, tokenize } from '../index.js';

describe('rust syntax', () => {
  it('tokenizes attributes, doc-comments, raw strings, lifetimes', () => {
    const src = `
      /// docs
      #[derive(Debug)]
      pub fn answer() -> u32 { 42 }
    `;
    const tokens = tokenize(src, 'rust');
    expect(tokens.some((t) => t.kind === 'doc-comment')).toBe(true);
    expect(tokens.some((t) => t.kind === 'attribute')).toBe(true);
    expect(tokens.some((t) => t.kind === 'keyword' && t.value === 'fn')).toBe(true);
  });

  it('extracts struct, fn, and use', () => {
    const src = `
      use std::collections::HashMap;
      pub struct Point { x: f32, y: f32 }
      pub fn origin() -> Point { Point { x: 0.0, y: 0.0 } }
    `;
    const { ast } = parse(src, 'rust');
    expect(ast.nodes.find((n) => n.kind === 'struct')?.name).toBe('Point');
    expect(ast.nodes.find((n) => n.kind === 'function')?.name).toBe('origin');
    expect(ast.nodes.some((n) => n.kind === 'import')).toBe(true);
  });
});
