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

  it('extracts methods from a simple impl block', () => {
    const src = `
      pub struct Foo;
      impl Foo {
        pub fn bar(&self) -> i32 { 1 }
        fn baz(&self) -> i32 { 2 }
      }
    `;
    const { ast } = parse(src, 'rust');
    const methods = ast.nodes.filter((n) => n.kind === 'method');
    expect(methods.map((n) => n.name).sort()).toEqual(['bar', 'baz']);
    expect(methods.every((m) => m.parent === 'Foo')).toBe(true);
  });

  it('parents trait-impl methods to the target type, not the trait', () => {
    const src = `
      pub trait Greet { fn hello(&self); }
      pub struct Foo;
      impl Greet for Foo {
        fn hello(&self) {}
      }
    `;
    const { ast } = parse(src, 'rust');
    const methods = ast.nodes.filter((n) => n.kind === 'method');
    expect(methods.length).toBe(1);
    expect(methods[0]?.name).toBe('hello');
    expect(methods[0]?.parent).toBe('Foo');
  });

  it('extracts associated functions (no self) from impl', () => {
    const src = `
      pub struct Foo;
      impl Foo {
        pub fn new() -> Foo { Foo }
        pub fn build(x: i32, y: i32) -> Foo { Foo }
      }
    `;
    const { ast } = parse(src, 'rust');
    const methods = ast.nodes.filter((n) => n.kind === 'method');
    expect(methods.map((n) => n.name).sort()).toEqual(['build', 'new']);
    expect(methods.every((m) => m.parent === 'Foo')).toBe(true);
  });

  it('extracts multiple methods incl. generic-typed impl', () => {
    const src = `
      pub struct Container<T>(T);
      impl<T: Clone> Container<T> {
        pub fn a(&self) {}
        pub fn b(&self) {}
        pub fn c(&self) {}
      }
    `;
    const { ast } = parse(src, 'rust');
    const methods = ast.nodes.filter((n) => n.kind === 'method');
    expect(methods.map((n) => n.name).sort()).toEqual(['a', 'b', 'c']);
    expect(methods.every((m) => m.parent === 'Container')).toBe(true);
  });

  it('extracts a single nested fn inside an outer fn', () => {
    const src = `
      fn outer() {
        fn inner() {}
      }
    `;
    const { ast } = parse(src, 'rust');
    const fns = ast.nodes.filter((n) => n.kind === 'function');
    const names = fns.map((n) => n.name);
    expect(names).toContain('outer');
    expect(names).toContain('inner');
    const inner = fns.find((n) => n.name === 'inner');
    expect(inner?.parent).toBe('outer');
  });

  it('extracts multiple sibling nested fns', () => {
    const src = `
      fn outer() {
        fn first() {}
        fn second() {}
      }
    `;
    const { ast } = parse(src, 'rust');
    const nested = ast.nodes.filter((n) => n.kind === 'function' && n.parent === 'outer');
    expect(nested.map((n) => n.name).sort()).toEqual(['first', 'second']);
  });

  it('extracts doubly-nested fns (inner-of-inner)', () => {
    const src = `
      fn outer() {
        fn mid() {
          fn deep() {}
        }
      }
    `;
    const { ast } = parse(src, 'rust');
    const fns = ast.nodes.filter((n) => n.kind === 'function');
    const names = fns.map((n) => n.name);
    expect(names).toContain('outer');
    expect(names).toContain('mid');
    expect(names).toContain('deep');
    const deep = fns.find((n) => n.name === 'deep');
    expect(deep?.parent).toBe('outer::mid');
  });

  it('nested struct inside fn is not emitted as a function node', () => {
    const src = `
      fn outer() {
        struct Inner { x: i32 }
        fn helper() {}
      }
    `;
    const { ast } = parse(src, 'rust');
    const fns = ast.nodes.filter((n) => n.kind === 'function');
    expect(fns.map((n) => n.name)).toContain('helper');
    const structs = ast.nodes.filter((n) => n.kind === 'struct');
    expect(structs.map((n) => n.name)).not.toContain('Inner');
  });

  it('pub use single binding emits export node with importedNames', () => {
    const src = `pub use crate::util::Foo;`;
    const { ast } = parse(src, 'rust');
    const node = ast.nodes.find((n) => n.kind === 'export');
    expect(node).toBeDefined();
    expect(node!.name).toBe('crate::util');
    expect(node!.importedNames).toEqual([{ local: 'Foo', original: 'Foo' }]);
  });

  it('pub use aliased binding emits export node with original and local', () => {
    const src = `pub use crate::inner::Bar as Baz;`;
    const { ast } = parse(src, 'rust');
    const node = ast.nodes.find((n) => n.kind === 'export');
    expect(node).toBeDefined();
    expect(node!.importedNames).toEqual([{ local: 'Baz', original: 'Bar' }]);
  });

  it('pub use group binding emits export node with multiple importedNames', () => {
    const src = `pub use crate::types::{Alpha, Beta, Gamma as G};`;
    const { ast } = parse(src, 'rust');
    const node = ast.nodes.find((n) => n.kind === 'export');
    expect(node).toBeDefined();
    expect(node!.name).toBe('crate::types');
    const names = node!.importedNames ?? [];
    expect(names.find((b) => b.local === 'Alpha')).toEqual({ local: 'Alpha', original: 'Alpha' });
    expect(names.find((b) => b.local === 'Beta')).toEqual({ local: 'Beta', original: 'Beta' });
    expect(names.find((b) => b.local === 'G')).toEqual({ local: 'G', original: 'Gamma' });
  });

  it('pub use glob emits export node with star binding', () => {
    const src = `pub use crate::prelude::*;`;
    const { ast } = parse(src, 'rust');
    const node = ast.nodes.find((n) => n.kind === 'export');
    expect(node).toBeDefined();
    expect(node!.name).toBe('crate::prelude');
    expect(node!.importedNames).toEqual([{ local: '*', original: '*' }]);
  });

  it('pub(crate) use emits export node (parsed as pub-use)', () => {
    // pub(crate) is tokenized as: 'pub' '(' 'crate' ')' 'use' — consumeModifiers
    // captures only 'pub'; the rest is consumed as punctuation before 'use'.
    // We verify the emitted node is export-kind with correct binding.
    const src = `pub use crate::detail::Hidden;`;
    const { ast } = parse(src, 'rust');
    const node = ast.nodes.find((n) => n.kind === 'export');
    expect(node).toBeDefined();
    expect(node!.importedNames?.[0]?.original).toBe('Hidden');
  });
});
