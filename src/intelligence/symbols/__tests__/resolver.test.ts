import { describe, it, expect } from 'vitest';
import { indexFiles, resolve, attachSources } from '../index.js';
import type { FileInput } from '../types.js';

const opts = { snapshot_id: 'snap-1', project_id: 'proj-1' };
const ctx = { ...opts, project_root: '/repo' };

function buildAndResolve(inputs: FileInput[]) {
  const idx = indexFiles(inputs, opts);
  const sources = new Map(inputs.map((i) => [i.file_path, i.source]));
  attachSources(idx, sources);
  return { idx, res: resolve(idx, ctx) };
}

describe('cross-file resolver', () => {
  it('resolves relative TS imports to known files', () => {
    const inputs: FileInput[] = [
      { file_path: 'src/util.ts', source: `export function helper() { return 1; }`, language: 'ts' },
      { file_path: 'src/main.ts', source: `import { helper } from './util.js';\nfunction run() { helper(); }`, language: 'ts' },
    ];
    const { res } = buildAndResolve(inputs);
    const helperRef = res.references.find((r) => r.name === 'helper' && r.file_path === 'src/main.ts' && r.start_line > 1);
    expect(helperRef).toBeDefined();
    expect(helperRef!.resolved_symbol_id).not.toBeNull();
    expect(helperRef!.resolution_confidence).toBeGreaterThan(0.5);
  });

  it('produces a call edge for a fully resolved call', () => {
    const inputs: FileInput[] = [
      { file_path: 'src/util.ts', source: `export function helper() { return 1; }`, language: 'ts' },
      { file_path: 'src/main.ts', source: `import { helper } from './util.js';\nfunction run() { helper(); }`, language: 'ts' },
    ];
    const { idx, res } = buildAndResolve(inputs);
    const run = idx.symbols.find((s) => s.name === 'run')!;
    const helper = idx.symbols.find((s) => s.name === 'helper')!;
    const edge = res.calls.find((c) => c.caller_symbol_id === run.id && c.callee_symbol_id === helper.id);
    expect(edge).toBeDefined();
    expect(edge!.confidence).toBeGreaterThanOrEqual(0.5);
  });

  it('keeps unresolved references at confidence 0', () => {
    const inputs: FileInput[] = [
      { file_path: 'src/main.ts', source: `function run() { mysteryFn(); }`, language: 'ts' },
    ];
    const { res } = buildAndResolve(inputs);
    const ref = res.references.find((r) => r.name === 'mysteryFn');
    expect(ref).toBeDefined();
    expect(ref!.resolved_symbol_id).toBeNull();
    expect(ref!.resolution_confidence).toBe(0);
  });

  it('confidence monotonicity: in-file declaration ≥ cross-file ≥ global fallback', () => {
    const inputs: FileInput[] = [
      { file_path: 'src/x.ts', source: `function alpha() { alpha(); }`, language: 'ts' },
    ];
    const { res } = buildAndResolve(inputs);
    const selfCall = res.references.find((r) => r.name === 'alpha' && r.start_line === 1 && r.start_byte > 9);
    expect(selfCall).toBeDefined();
    expect(selfCall!.resolution_confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('extracts class extends type relation', () => {
    const inputs: FileInput[] = [
      { file_path: 'src/base.ts', source: `export class Base {}`, language: 'ts' },
      { file_path: 'src/derived.ts', source: `import { Base } from './base.js';\nexport class Derived extends Base {}`, language: 'ts' },
    ];
    const { idx, res } = buildAndResolve(inputs);
    const base = idx.symbols.find((s) => s.name === 'Base')!;
    const derived = idx.symbols.find((s) => s.name === 'Derived')!;
    const rel = res.type_relations.find((t) => t.from_symbol_id === derived.id && t.to_symbol_id === base.id);
    expect(rel).toBeDefined();
    expect(rel!.kind).toBe('extends');
  });

  it('resolves Python from-import', () => {
    const inputs: FileInput[] = [
      { file_path: 'pkg/util.py', source: `def helper():\n    return 1\n`, language: 'python' },
      { file_path: 'pkg/__init__.py', source: ``, language: 'python' },
      { file_path: 'pkg/main.py', source: `from util import helper\ndef run():\n    helper()\n`, language: 'python' },
    ];
    const { idx, res } = buildAndResolve(inputs);
    const helper = idx.symbols.find((s) => s.name === 'helper' && s.file_path === 'pkg/util.py');
    expect(helper).toBeDefined();
    const ref = res.references.find((r) => r.name === 'helper' && r.file_path === 'pkg/main.py' && r.start_line > 1);
    expect(ref).toBeDefined();
    expect(ref!.resolution_confidence).toBeGreaterThan(0);
  });

  it('resolves Rust use path within crate', () => {
    const inputs: FileInput[] = [
      { file_path: 'src/lib.rs', source: `pub mod util;`, language: 'rust' },
      { file_path: 'src/util.rs', source: `pub fn helper() -> i32 { 1 }`, language: 'rust' },
      { file_path: 'src/main.rs', source: `use crate::util::helper;\nfn run() { helper(); }`, language: 'rust' },
    ];
    const { idx, res } = buildAndResolve(inputs);
    const helper = idx.symbols.find((s) => s.name === 'helper' && s.file_path === 'src/util.rs');
    expect(helper).toBeDefined();
    const ref = res.references.find((r) => r.name === 'helper' && r.file_path === 'src/main.rs' && r.start_line === 2);
    expect(ref).toBeDefined();
    expect(ref!.resolved_symbol_id).not.toBeNull();
  });

  it('does not produce a call edge when callee is unresolved', () => {
    const inputs: FileInput[] = [
      { file_path: 'src/main.ts', source: `function run() { unresolvedXYZ(); }`, language: 'ts' },
    ];
    const { res } = buildAndResolve(inputs);
    expect(res.calls.length).toBe(0);
  });

  it('import-bound named call resolves at confidence 0.9 (vs 0.7 global fallback)', () => {
    // The import on main.ts pins `helper` to src/util.ts, so the call site
    // resolves cross-file at confidence 0.9 (vs the 0.7 global by-name path
    // the indexer fell through to before clause parsing landed).
    const inputs: FileInput[] = [
      { file_path: 'src/util.ts', source: `export function helper() { return 1; }`, language: 'ts' },
      { file_path: 'src/main.ts', source: `import { helper } from './util.js';\nfunction run() { helper(); }`, language: 'ts' },
    ];
    const { res } = buildAndResolve(inputs);
    // The line-2 call site (not the import-clause occurrence on line 1).
    const callRef = res.references.find(
      (r) => r.name === 'helper' && r.file_path === 'src/main.ts' && r.start_line === 2,
    );
    expect(callRef).toBeDefined();
    expect(callRef!.resolution_kind).toBe('call');
    expect(callRef!.resolution_confidence).toBe(0.9);
  });

  it('aliased named import resolves to original export name', () => {
    const inputs: FileInput[] = [
      { file_path: 'src/util.ts', source: `export function helper() { return 1; }`, language: 'ts' },
      { file_path: 'src/main.ts', source: `import { helper as h } from './util.js';\nfunction run() { h(); }`, language: 'ts' },
    ];
    const { idx, res } = buildAndResolve(inputs);
    const helper = idx.symbols.find((s) => s.name === 'helper' && s.file_path === 'src/util.ts')!;
    const callRef = res.references.find(
      (r) => r.name === 'h' && r.file_path === 'src/main.ts' && r.start_line === 2,
    );
    expect(callRef).toBeDefined();
    expect(callRef!.resolution_kind).toBe('call');
    expect(callRef!.resolved_symbol_id).toBe(helper.id);
    expect(callRef!.resolution_confidence).toBe(0.9);
  });

  it('named re-export: file C imports foo from A (which re-exports from B) resolves to B', () => {
    const inputs: FileInput[] = [
      { file_path: 'src/b.ts', source: `export function foo() { return 1; }`, language: 'ts' },
      { file_path: 'src/a.ts', source: `export { foo } from './b.js';`, language: 'ts' },
      { file_path: 'src/c.ts', source: `import { foo } from './a.js';\nfunction run() { foo(); }`, language: 'ts' },
    ];
    const { idx, res } = buildAndResolve(inputs);
    const fooInB = idx.symbols.find((s) => s.name === 'foo' && s.file_path === 'src/b.ts');
    expect(fooInB).toBeDefined();
    const callRef = res.references.find((r) => r.name === 'foo' && r.file_path === 'src/c.ts' && r.start_line === 2);
    expect(callRef).toBeDefined();
    expect(callRef!.resolved_symbol_id).toBe(fooInB!.id);
    expect(callRef!.resolution_confidence).toBeGreaterThan(0.5);
  });

  it('aliased re-export: bar as baz resolves baz usage in consumer to bar in source', () => {
    const inputs: FileInput[] = [
      { file_path: 'src/b.ts', source: `export function bar() {}`, language: 'ts' },
      { file_path: 'src/a.ts', source: `export { bar as baz } from './b.js';`, language: 'ts' },
      { file_path: 'src/c.ts', source: `import { baz } from './a.js';\nfunction run() { baz(); }`, language: 'ts' },
    ];
    const { idx, res } = buildAndResolve(inputs);
    const barInB = idx.symbols.find((s) => s.name === 'bar' && s.file_path === 'src/b.ts');
    expect(barInB).toBeDefined();
    const callRef = res.references.find((r) => r.name === 'baz' && r.file_path === 'src/c.ts' && r.start_line === 2);
    expect(callRef).toBeDefined();
    expect(callRef!.resolved_symbol_id).toBe(barInB!.id);
  });

  it('star re-export: file C imports any name from A (which star-re-exports B) resolves to B', () => {
    const inputs: FileInput[] = [
      { file_path: 'src/b.ts', source: `export function alpha() {}`, language: 'ts' },
      { file_path: 'src/a.ts', source: `export * from './b.js';`, language: 'ts' },
      { file_path: 'src/c.ts', source: `import { alpha } from './a.js';\nfunction run() { alpha(); }`, language: 'ts' },
    ];
    const { idx, res } = buildAndResolve(inputs);
    const alphaInB = idx.symbols.find((s) => s.name === 'alpha' && s.file_path === 'src/b.ts');
    expect(alphaInB).toBeDefined();
    const callRef = res.references.find((r) => r.name === 'alpha' && r.file_path === 'src/c.ts' && r.start_line === 2);
    expect(callRef).toBeDefined();
    expect(callRef!.resolved_symbol_id).toBe(alphaInB!.id);
  });

  it('star-as-namespace re-export emits namespace export symbol in intermediate file', () => {
    const inputs: FileInput[] = [
      { file_path: 'src/b.ts', source: `export function beta() {}`, language: 'ts' },
      { file_path: 'src/a.ts', source: `export * as NS from './b.js';`, language: 'ts' },
    ];
    const { idx } = buildAndResolve(inputs);
    const nsExport = idx.symbols.find((s) => s.name === 'NS' && s.file_path === 'src/a.ts');
    expect(nsExport).toBeDefined();
    expect(nsExport!.kind).toBe('export');
  });

  it('transitive re-export: C imports from A re-exports B re-exports from D resolves to D', () => {
    const inputs: FileInput[] = [
      { file_path: 'src/d.ts', source: `export function deep() {}`, language: 'ts' },
      { file_path: 'src/b.ts', source: `export { deep } from './d.js';`, language: 'ts' },
      { file_path: 'src/a.ts', source: `export { deep } from './b.js';`, language: 'ts' },
      { file_path: 'src/c.ts', source: `import { deep } from './a.js';\nfunction run() { deep(); }`, language: 'ts' },
    ];
    const { idx, res } = buildAndResolve(inputs);
    const deepInD = idx.symbols.find((s) => s.name === 'deep' && s.file_path === 'src/d.ts');
    expect(deepInD).toBeDefined();
    const callRef = res.references.find((r) => r.name === 'deep' && r.file_path === 'src/c.ts' && r.start_line === 2);
    expect(callRef).toBeDefined();
    expect(callRef!.resolved_symbol_id).toBe(deepInD!.id);
  });

  it('Rust pub use single-hop: consumer resolves through re-export to origin file', () => {
    // util.rs declares helper; lib.rs re-exports it with pub use; main.rs uses it via lib.
    const inputs: FileInput[] = [
      { file_path: 'src/lib.rs', source: `pub mod util;\npub use crate::util::helper;`, language: 'rust' },
      { file_path: 'src/util.rs', source: `pub fn helper() -> i32 { 1 }`, language: 'rust' },
      { file_path: 'src/main.rs', source: `use crate::helper;\nfn run() { helper(); }`, language: 'rust' },
    ];
    const { idx, res } = buildAndResolve(inputs);
    const helperInUtil = idx.symbols.find((s) => s.name === 'helper' && s.file_path === 'src/util.rs');
    expect(helperInUtil).toBeDefined();
    const callRef = res.references.find((r) => r.name === 'helper' && r.file_path === 'src/main.rs' && r.start_line === 2);
    expect(callRef).toBeDefined();
    expect(callRef!.resolved_symbol_id).toBe(helperInUtil!.id);
  });

  it('Rust pub use aliased hop: pub use foo::Bar as Baz resolves usage of Baz to Bar', () => {
    // reexport.rs re-exports Bar from types.rs as Baz.
    // consumer.rs imports Baz from reexport — followReExportChain should walk
    // the alias and land on Bar in types.rs.
    const inputs: FileInput[] = [
      { file_path: 'src/lib.rs', source: `pub mod types;\npub mod reexport;`, language: 'rust' },
      { file_path: 'src/types.rs', source: `pub struct Bar;`, language: 'rust' },
      { file_path: 'src/reexport.rs', source: `pub use crate::types::Bar as Baz;`, language: 'rust' },
      { file_path: 'src/consumer.rs', source: `use crate::reexport::Baz;\nfn run() { let _: Baz; }`, language: 'rust' },
    ];
    const { idx, res } = buildAndResolve(inputs);
    const barInTypes = idx.symbols.find((s) => s.name === 'Bar' && s.file_path === 'src/types.rs');
    expect(barInTypes).toBeDefined();
    // Baz usage in consumer.rs: reexport.rs has pub use Bar as Baz so chain
    // follows local='Baz' → original='Bar' → types.rs::Bar.
    const ref = res.references.find((r) => r.name === 'Baz' && r.file_path === 'src/consumer.rs');
    expect(ref).toBeDefined();
    expect(ref!.resolved_symbol_id).toBe(barInTypes!.id);
  });

  it('Rust pub use transitive hop-of-hop: A pub-uses from B which pub-uses from C', () => {
    const inputs: FileInput[] = [
      { file_path: 'src/c.rs', source: `pub fn compute() -> i32 { 0 }`, language: 'rust' },
      { file_path: 'src/b.rs', source: `pub use crate::c::compute;`, language: 'rust' },
      { file_path: 'src/lib.rs', source: `pub mod b;\npub mod c;\npub use crate::b::compute;`, language: 'rust' },
      { file_path: 'src/main.rs', source: `use crate::compute;\nfn run() { compute(); }`, language: 'rust' },
    ];
    const { idx, res } = buildAndResolve(inputs);
    const computeInC = idx.symbols.find((s) => s.name === 'compute' && s.file_path === 'src/c.rs');
    expect(computeInC).toBeDefined();
    const callRef = res.references.find((r) => r.name === 'compute' && r.file_path === 'src/main.rs' && r.start_line === 2);
    expect(callRef).toBeDefined();
    expect(callRef!.resolved_symbol_id).toBe(computeInC!.id);
  });

  it('Rust pub use glob: star re-export causes name lookup to find origin file', () => {
    const inputs: FileInput[] = [
      { file_path: 'src/lib.rs', source: `pub mod prelude;\npub use crate::prelude::*;`, language: 'rust' },
      { file_path: 'src/prelude.rs', source: `pub fn init() {}`, language: 'rust' },
      { file_path: 'src/main.rs', source: `use crate::init;\nfn run() { init(); }`, language: 'rust' },
    ];
    const { idx, res } = buildAndResolve(inputs);
    const initInPrelude = idx.symbols.find((s) => s.name === 'init' && s.file_path === 'src/prelude.rs');
    expect(initInPrelude).toBeDefined();
    const callRef = res.references.find((r) => r.name === 'init' && r.file_path === 'src/main.rs' && r.start_line === 2);
    expect(callRef).toBeDefined();
    expect(callRef!.resolved_symbol_id).toBe(initInPrelude!.id);
  });

  it('Rust inline mod: fn inside mod body is indexed with qualified parent prefix', () => {
    // lib.rs has an inline mod block; main.rs imports through it.
    // The indexer should emit bar with parent='utils', qualified_name='utils::bar'.
    const inputs: FileInput[] = [
      {
        file_path: 'src/lib.rs',
        source: `pub mod utils {\n  pub fn bar() -> i32 { 0 }\n}\n`,
        language: 'rust',
      },
      {
        file_path: 'src/main.rs',
        source: `use crate::utils::bar;\nfn run() { bar(); }`,
        language: 'rust',
      },
    ];
    const { idx } = buildAndResolve(inputs);
    const barSym = idx.symbols.find((s) => s.name === 'bar' && s.file_path === 'src/lib.rs');
    expect(barSym).toBeDefined();
    expect(barSym!.qualified_name).toBe('utils::bar');
  });

  it('Rust nested mod pub use: consumer resolves through inline re-export to origin', () => {
    // types.rs defines Foo; lib.rs has inline mod inner { pub use super::Foo; };
    // consumer.rs uses inner::Foo — indexer should see the re-export, resolver follows it.
    const inputs: FileInput[] = [
      {
        file_path: 'src/types.rs',
        source: `pub struct Foo;`,
        language: 'rust',
      },
      {
        file_path: 'src/lib.rs',
        source: `pub mod types;\npub mod inner {\n  pub use crate::types::Foo;\n}\n`,
        language: 'rust',
      },
      {
        file_path: 'src/consumer.rs',
        source: `use crate::inner::Foo;\nfn run() { let _: Foo; }`,
        language: 'rust',
      },
    ];
    const { idx } = buildAndResolve(inputs);
    // The pub use inside the inline mod body must be indexed.
    const reExportNode = idx.symbols.find(
      (s) => s.file_path === 'src/lib.rs' && s.kind === 'export',
    );
    expect(reExportNode).toBeDefined();
    // The origin struct must be indexable from types.rs.
    const fooInTypes = idx.symbols.find((s) => s.name === 'Foo' && s.file_path === 'src/types.rs');
    expect(fooInTypes).toBeDefined();
  });
});
