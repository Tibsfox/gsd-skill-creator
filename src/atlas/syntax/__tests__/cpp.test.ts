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

  // --- Surgery 1: Operator overloads ---

  it('extracts equality and relational operator overloads', () => {
    const src = `
      class Vec {
      public:
        bool operator==(const Vec& o) const;
        bool operator!=(const Vec& o) const;
        bool operator<(const Vec& o) const;
      };
    `;
    const { ast } = parse(src, 'cpp');
    const methods = ast.nodes.filter((n) => n.kind === 'method');
    expect(methods.map((n) => n.name).sort()).toEqual(['operator!=', 'operator<', 'operator==']);
    expect(methods.every((m) => m.parent === 'Vec')).toBe(true);
  });

  it('extracts function-call and subscript operator overloads', () => {
    const src = `
      class Map {
      public:
        int& operator[](int idx);
        void operator()(int x, int y);
      };
    `;
    const { ast } = parse(src, 'cpp');
    const methods = ast.nodes.filter((n) => n.kind === 'method');
    expect(methods.map((n) => n.name).sort()).toEqual(['operator()', 'operator[]']);
    expect(methods.every((m) => m.parent === 'Map')).toBe(true);
  });

  it('extracts arithmetic and assignment operator overloads', () => {
    const src = `
      class BigInt {
      public:
        BigInt operator+(const BigInt& o) const;
        BigInt& operator+=(const BigInt& o);
        BigInt& operator=(const BigInt& o);
        BigInt operator-() const;
      };
    `;
    const { ast } = parse(src, 'cpp');
    const names = ast.nodes.filter((n) => n.kind === 'method').map((n) => n.name).sort();
    expect(names).toEqual(['operator+', 'operator+=', 'operator-', 'operator=']);
  });

  it('extracts conversion operator overload', () => {
    const src = `
      class Safe {
      public:
        operator int() const;
        operator bool() const;
      };
    `;
    const { ast } = parse(src, 'cpp');
    const names = ast.nodes.filter((n) => n.kind === 'method').map((n) => n.name).sort();
    expect(names).toEqual(['operatorbool', 'operatorint']);
  });

  it('extracts new/delete operator overloads', () => {
    const src = `
      class Pooled {
      public:
        void* operator new(std::size_t sz);
        void operator delete(void* p) noexcept;
      };
    `;
    const { ast } = parse(src, 'cpp');
    const names = ast.nodes.filter((n) => n.kind === 'method').map((n) => n.name).sort();
    expect(names).toEqual(['operatordelete', 'operatornew']);
  });

  // --- Surgery 2: Nested classes ---

  it('emits nested class and its methods attributed to inner class', () => {
    const src = `
      class Outer {
        class Inner {
          void bar();
        };
        void baz();
      };
    `;
    const { ast } = parse(src, 'cpp');
    expect(ast.nodes.find((n) => n.kind === 'class' && n.name === 'Outer')).toBeTruthy();
    expect(ast.nodes.find((n) => n.kind === 'class' && n.name === 'Inner')).toBeTruthy();
    const innerBar = ast.nodes.find((n) => n.kind === 'method' && n.name === 'bar');
    expect(innerBar).toBeTruthy();
    expect(innerBar?.parent).toBe('Outer::Inner');
    const outerBaz = ast.nodes.find((n) => n.kind === 'method' && n.name === 'baz');
    expect(outerBaz).toBeTruthy();
    expect(outerBaz?.parent).toBe('Outer');
  });

  it('handles class with method + nested class + method in sequence', () => {
    const src = `
      class Container {
        void before();
        struct Node {
          int value;
          void init();
        };
        void after();
      };
    `;
    const { ast } = parse(src, 'cpp');
    const outerMethods = ast.nodes.filter((n) => n.kind === 'method' && n.parent === 'Container');
    expect(outerMethods.map((n) => n.name).sort()).toEqual(['after', 'before']);
    const innerMethods = ast.nodes.filter((n) => n.kind === 'method' && n.parent === 'Container::Node');
    expect(innerMethods.map((n) => n.name)).toEqual(['init']);
    expect(ast.nodes.find((n) => n.name === 'Node')).toBeTruthy();
  });

  it('handles struct nested inside class', () => {
    const src = `
      class Graph {
        struct Edge {
          void flip();
        };
        void clear();
      };
    `;
    const { ast } = parse(src, 'cpp');
    const edgeMethods = ast.nodes.filter((n) => n.kind === 'method' && n.parent === 'Graph::Edge');
    expect(edgeMethods.map((n) => n.name)).toEqual(['flip']);
    const graphMethods = ast.nodes.filter((n) => n.kind === 'method' && n.parent === 'Graph');
    expect(graphMethods.map((n) => n.name)).toEqual(['clear']);
  });

  it('handles three levels of nesting', () => {
    const src = `
      class A {
        class B {
          class C {
            void deepMethod();
          };
        };
      };
    `;
    const { ast } = parse(src, 'cpp');
    expect(ast.nodes.find((n) => n.name === 'A')).toBeTruthy();
    expect(ast.nodes.find((n) => n.name === 'B')).toBeTruthy();
    expect(ast.nodes.find((n) => n.name === 'C')).toBeTruthy();
    const deep = ast.nodes.find((n) => n.kind === 'method' && n.name === 'deepMethod');
    expect(deep).toBeTruthy();
    expect(deep?.parent).toBe('A::B::C');
  });

  it('does not double-count nested-class methods on the outer class (regression guard)', () => {
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
});
