import { describe, it, expect } from 'vitest';
import { parse, tokenize } from '../index.js';

describe('cpp syntax', () => {
  it('tokenizes preprocessor, raw strings, scope-resolution', () => {
    const src = `#include <vector>\nint main() { std::string s = R"(raw)"; return 0; }`;
    const tokens = tokenize(src, 'cpp');
    expect(tokens.some((t) => t.kind === 'preprocessor')).toBe(true);
    expect(tokens.some((t) => t.kind === 'operator' && t.value === '::')).toBe(true);
    expect(tokens.some((t) => t.kind === 'string' && t.value.startsWith('R"'))).toBe(true);
  });

  it('extracts class, function, include', () => {
    const src = `
      #include <string>
      class Greeter {
      public:
        std::string greet(const std::string& name) { return "hi"; }
      };
      int answer() { return 42; }
    `;
    const { ast } = parse(src, 'cpp');
    expect(ast.nodes.find((n) => n.kind === 'class' && n.name === 'Greeter')).toBeTruthy();
    expect(ast.nodes.some((n) => n.kind === 'function' && n.name === 'answer')).toBe(true);
    expect(ast.nodes.some((n) => n.kind === 'import' && n.name === 'string')).toBe(true);
  });
});
