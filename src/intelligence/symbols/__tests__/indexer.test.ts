import { describe, it, expect } from 'vitest';
import { indexFile } from '../indexer.js';
import type { IndexerOptions } from '../indexer.js';

const opts: IndexerOptions = { snapshot_id: 'snap-1', project_id: 'proj-1' };

describe('indexer per-language extraction', () => {
  it('extracts TS function + class + method + import', () => {
    const src = `import { helper } from './util.js';
export class Greeter {
  greet(name: string): string { return helper(name); }
}
function bare(): number { return 1; }`;
    const r = indexFile({ file_path: 'src/a.ts', source: src, language: 'ts' }, opts);
    expect(r.symbols.find((s) => s.kind === 'class' && s.name === 'Greeter')).toBeTruthy();
    expect(r.symbols.find((s) => s.kind === 'method' && s.name === 'greet' && s.qualified_name === 'Greeter.greet')).toBeTruthy();
    expect(r.symbols.find((s) => s.kind === 'function' && s.name === 'bare')).toBeTruthy();
    expect(r.imports[0]?.module_spec).toBe('./util.js');
  });

  it('extracts JS function declarations', () => {
    const src = `function add(a, b) { return a + b; }\nclass Foo { bar() { return 1; } }`;
    const r = indexFile({ file_path: 'src/a.js', source: src, language: 'js' }, opts);
    expect(r.symbols.find((s) => s.kind === 'function' && s.name === 'add')).toBeTruthy();
    expect(r.symbols.find((s) => s.kind === 'method' && s.name === 'bar')).toBeTruthy();
  });

  it('extracts Rust fn + struct + use', () => {
    const src = `use crate::util::Helper;
pub struct Greeter;
fn greet() -> String { String::new() }`;
    const r = indexFile({ file_path: 'src/lib.rs', source: src, language: 'rust' }, opts);
    expect(r.symbols.find((s) => s.kind === 'class' && s.name === 'Greeter')).toBeTruthy();
    expect(r.symbols.find((s) => s.kind === 'function' && s.name === 'greet')).toBeTruthy();
    expect(r.imports.length).toBe(1);
  });

  it('extracts Python def + class + import', () => {
    const src = `from util import helper\nclass Greeter:\n    def greet(self):\n        return helper()`;
    const r = indexFile({ file_path: 'pkg/a.py', source: src, language: 'python' }, opts);
    expect(r.symbols.find((s) => s.kind === 'class' && s.name === 'Greeter')).toBeTruthy();
    expect(r.symbols.find((s) => s.kind === 'function' && s.name === 'greet')).toBeTruthy();
    expect(r.imports.length).toBeGreaterThanOrEqual(1);
  });

  it('extracts Go func + type + import + package', () => {
    const src = `package main\nimport "fmt"\ntype Greeter struct {}\nfunc (g Greeter) Greet() { fmt.Println("hi") }\nfunc bare() int { return 1 }`;
    const r = indexFile({ file_path: 'main.go', source: src, language: 'go' }, opts);
    expect(r.symbols.find((s) => s.kind === 'class' && s.name === 'Greeter')).toBeTruthy();
    expect(r.symbols.find((s) => s.kind === 'function' && s.name === 'bare')).toBeTruthy();
    expect(r.imports.find((i) => i.module_spec === 'fmt')).toBeTruthy();
  });

  it('extracts Java class + method + import + package', () => {
    const src = `package com.acme;
import java.util.List;
public class Greeter {
  public String greet(String name) { return name; }
}`;
    const r = indexFile({ file_path: 'src/Greeter.java', source: src, language: 'java' }, opts);
    expect(r.symbols.find((s) => s.kind === 'class' && s.name === 'Greeter')).toBeTruthy();
    expect(r.symbols.find((s) => s.kind === 'method' && s.name === 'greet')).toBeTruthy();
  });

  it('extracts C++ class + function + include', () => {
    const src = `#include <string>\nclass Greeter { public: std::string greet(const std::string& n) { return n; } };\nint answer() { return 42; }`;
    const r = indexFile({ file_path: 'src/a.cpp', source: src, language: 'cpp' }, opts);
    expect(r.symbols.find((s) => s.kind === 'class' && s.name === 'Greeter')).toBeTruthy();
    expect(r.symbols.find((s) => s.kind === 'function' && s.name === 'answer')).toBeTruthy();
    expect(r.imports.find((i) => i.module_spec === 'string')).toBeTruthy();
  });

  it('extracts Bash function + source', () => {
    const src = `source ./common.sh\nfunction greet { echo hi; }\nfarewell() { echo bye; }`;
    const r = indexFile({ file_path: 'scripts/a.sh', source: src, language: 'bash' }, opts);
    expect(r.symbols.find((s) => s.kind === 'function' && s.name === 'greet')).toBeTruthy();
    expect(r.symbols.find((s) => s.kind === 'function' && s.name === 'farewell')).toBeTruthy();
  });

  it('extracts GLSL function + uniform + struct', () => {
    const src = `uniform float uTime;\nstruct Light { vec3 pos; };\nvec3 scale(vec3 v) { return v * 2.0; }`;
    const r = indexFile({ file_path: 'shaders/a.glsl', source: src, language: 'glsl' }, opts);
    expect(r.symbols.find((s) => s.kind === 'class' && s.name === 'Light')).toBeTruthy();
    expect(r.symbols.find((s) => s.kind === 'function' && s.name === 'scale')).toBeTruthy();
    expect(r.symbols.find((s) => s.kind === 'const' && s.name === 'uTime')).toBeTruthy();
  });

  it('emits stable symbol ids across runs (signature_hash deterministic)', () => {
    const src = `function foo() {}`;
    const a = indexFile({ file_path: 'src/x.ts', source: src, language: 'ts' }, opts);
    const b = indexFile({ file_path: 'src/x.ts', source: src, language: 'ts' }, opts);
    expect(a.symbols[0]?.id).toBe(b.symbols[0]?.id);
    expect(a.symbols[0]?.signature_hash).toBe(b.symbols[0]?.signature_hash);
  });
});
