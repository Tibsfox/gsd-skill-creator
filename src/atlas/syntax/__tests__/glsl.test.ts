import { describe, it, expect } from 'vitest';
import { parse, tokenize } from '../index.js';

describe('glsl syntax', () => {
  it('tokenizes preprocessor, types, numbers', () => {
    const src = `#version 300 es\nuniform vec3 uColor;\nvoid main() { gl_FragColor = vec4(uColor, 1.0); }`;
    const tokens = tokenize(src, 'glsl');
    expect(tokens.some((t) => t.kind === 'preprocessor')).toBe(true);
    expect(tokens.some((t) => t.kind === 'type' && t.value === 'vec3')).toBe(true);
    expect(tokens.some((t) => t.kind === 'number' && t.value === '1.0')).toBe(true);
  });

  it('extracts function, uniform, struct', () => {
    const src = `
      uniform float uTime;
      struct Light { vec3 pos; vec3 color; };
      vec3 scale(vec3 v) { return v * 2.0; }
    `;
    const { ast } = parse(src, 'glsl');
    expect(ast.nodes.find((n) => n.kind === 'variable' && n.name === 'uTime')).toBeTruthy();
    expect(ast.nodes.find((n) => n.kind === 'struct' && n.name === 'Light')).toBeTruthy();
    expect(ast.nodes.find((n) => n.kind === 'function' && n.name === 'scale')).toBeTruthy();
  });
});
