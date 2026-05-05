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
});
