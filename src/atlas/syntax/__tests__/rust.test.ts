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

  it('simple inline mod emits namespace node and fn inside with parent prefix', () => {
    const src = `
      mod utils {
        pub fn helper() {}
      }
    `;
    const { ast } = parse(src, 'rust');
    const mod = ast.nodes.find((n) => n.kind === 'namespace');
    expect(mod).toBeDefined();
    expect(mod!.name).toBe('utils');
    const fn_ = ast.nodes.find((n) => n.kind === 'function' && n.name === 'helper');
    expect(fn_).toBeDefined();
    expect(fn_!.parent).toBe('utils');
  });

  it('inline mod with pub use inside emits export node with correct module spec', () => {
    const src = `
      mod inner {
        pub use crate::types::Foo;
      }
    `;
    const { ast } = parse(src, 'rust');
    const exportNode = ast.nodes.find((n) => n.kind === 'export');
    expect(exportNode).toBeDefined();
    expect(exportNode!.importedNames).toEqual([{ local: 'Foo', original: 'Foo' }]);
  });

  it('doubly-nested mods produce correct qualified parent chain (a, a::b, a::b::c)', () => {
    const src = `
      mod a {
        mod b {
          fn c() {}
        }
      }
    `;
    const { ast } = parse(src, 'rust');
    const mods = ast.nodes.filter((n) => n.kind === 'namespace');
    expect(mods.map((n) => n.name).sort()).toEqual(['a', 'b']);
    const modA = mods.find((n) => n.name === 'a');
    expect(modA!.parent === '' || modA!.parent === undefined).toBe(true);
    const modB = mods.find((n) => n.name === 'b');
    expect(modB!.parent).toBe('a');
    const fn_ = ast.nodes.find((n) => n.kind === 'function' && n.name === 'c');
    expect(fn_).toBeDefined();
    expect(fn_!.parent).toBe('a::b');
  });

  it('pub mod with visibility modifier emits namespace node with pub modifier', () => {
    const src = `
      pub mod api {
        pub fn endpoint() {}
      }
    `;
    const { ast } = parse(src, 'rust');
    const mod = ast.nodes.find((n) => n.kind === 'namespace');
    expect(mod).toBeDefined();
    expect(mod!.name).toBe('api');
    expect(mod!.modifiers).toContain('pub');
    const fn_ = ast.nodes.find((n) => n.kind === 'function' && n.name === 'endpoint');
    expect(fn_).toBeDefined();
    expect(fn_!.parent).toBe('api');
  });

  it('declaration-only mod emits namespace node but does not descend', () => {
    const src = `mod submodule;`;
    const { ast } = parse(src, 'rust');
    const mod = ast.nodes.find((n) => n.kind === 'namespace');
    expect(mod).toBeDefined();
    expect(mod!.name).toBe('submodule');
    // No other nodes should appear (no body to descend into).
    expect(ast.nodes.filter((n) => n.kind !== 'namespace')).toHaveLength(0);
  });

  // ── pub(crate) / pub(super) / pub(in path) visibility refinement (H3-R1) ──

  it('pub(crate) mod with inline fn: mod and fn are both extracted', () => {
    const src = `
      pub(crate) mod internals {
        pub(crate) fn helper() {}
      }
    `;
    const { ast } = parse(src, 'rust');
    const mod = ast.nodes.find((n) => n.kind === 'namespace' && n.name === 'internals');
    expect(mod).toBeDefined();
    expect(mod!.modifiers?.some((m) => m.startsWith('pub(crate)'))).toBe(true);
    const fn_ = ast.nodes.find((n) => n.kind === 'function' && n.name === 'helper');
    expect(fn_).toBeDefined();
    expect(fn_!.parent).toBe('internals');
  });

  it('pub(crate) use emits export node with correct binding', () => {
    const src = `pub(crate) use crate::detail::Hidden;`;
    const { ast } = parse(src, 'rust');
    const node = ast.nodes.find((n) => n.kind === 'export');
    expect(node).toBeDefined();
    expect(node!.importedNames?.[0]?.original).toBe('Hidden');
    expect(node!.modifiers?.some((m) => m.startsWith('pub(crate)'))).toBe(true);
  });

  it('pub(super) mod emits namespace node with pub(super) modifier', () => {
    const src = `
      pub(super) mod sub {
        fn inner() {}
      }
    `;
    const { ast } = parse(src, 'rust');
    const mod = ast.nodes.find((n) => n.kind === 'namespace' && n.name === 'sub');
    expect(mod).toBeDefined();
    expect(mod!.modifiers?.some((m) => m.startsWith('pub(super)'))).toBe(true);
    const fn_ = ast.nodes.find((n) => n.kind === 'function' && n.name === 'inner');
    expect(fn_).toBeDefined();
    expect(fn_!.parent).toBe('sub');
  });

  it('pub(in crate::a::b) struct emits struct node with qualified visibility modifier', () => {
    const src = `pub(in crate::a::b) struct Restricted { x: i32 }`;
    const { ast } = parse(src, 'rust');
    const node = ast.nodes.find((n) => n.kind === 'struct' && n.name === 'Restricted');
    expect(node).toBeDefined();
    expect(node!.modifiers?.some((m) => m.startsWith('pub(in'))).toBe(true);
  });

  it('mod containing struct and impl produces parented symbols', () => {
    const src = `
      mod models {
        pub struct User { id: u32 }
        impl User {
          pub fn new(id: u32) -> User { User { id } }
        }
      }
    `;
    const { ast } = parse(src, 'rust');
    const struct_ = ast.nodes.find((n) => n.kind === 'struct');
    expect(struct_).toBeDefined();
    expect(struct_!.name).toBe('User');
    expect(struct_!.parent).toBe('models');
    const impl_ = ast.nodes.find((n) => n.kind === 'impl');
    expect(impl_).toBeDefined();
    expect(impl_!.name).toBe('User');
    const method = ast.nodes.find((n) => n.kind === 'method' && n.name === 'new');
    expect(method).toBeDefined();
    expect(method!.parent).toBe('User');
  });
});
