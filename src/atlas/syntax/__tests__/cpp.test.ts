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

  it('extracts public methods from a class body', () => {
    const src = `
      class Foo {
      public:
        void bar();
        int baz() const;
      };
    `;
    const { ast } = parse(src, 'cpp');
    const methods = ast.nodes.filter((n) => n.kind === 'method');
    expect(methods.map((n) => n.name).sort()).toEqual(['bar', 'baz']);
    expect(methods.every((m) => m.parent === 'Foo')).toBe(true);
  });

  it('extracts methods from a struct body', () => {
    const src = `
      struct Point {
        int x;
        int y;
        int sum() const { return x + y; }
        void reset() { x = 0; y = 0; }
      };
    `;
    const { ast } = parse(src, 'cpp');
    const methods = ast.nodes.filter((n) => n.kind === 'method');
    expect(methods.map((n) => n.name).sort()).toEqual(['reset', 'sum']);
    expect(methods.every((m) => m.parent === 'Point')).toBe(true);
  });

  it('does not double-count nested-class methods on the outer class', () => {
    const src = `
      class Outer {
        void outer_method();
        class Inner {
          void inner_method();
        };
      };
    `;
    const { ast } = parse(src, 'cpp');
    const outerMethods = ast.nodes.filter((n) => n.kind === 'method' && n.parent === 'Outer');
    expect(outerMethods.map((n) => n.name)).toEqual(['outer_method']);
  });

  it('extracts methods with const / virtual / override qualifiers', () => {
    const src = `
      class Widget {
      public:
        virtual void draw() const;
        virtual int area() const override;
        void resize(int w, int h);
      };
    `;
    const { ast } = parse(src, 'cpp');
    const methods = ast.nodes.filter((n) => n.kind === 'method');
    expect(methods.map((n) => n.name).sort()).toEqual(['area', 'draw', 'resize']);
    expect(methods.every((m) => m.parent === 'Widget')).toBe(true);
  });
});
