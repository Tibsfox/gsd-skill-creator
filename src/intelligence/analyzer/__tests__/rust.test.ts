/**
 * C02 T5 — Rust analyzer tests.
 */

import { describe, it, expect } from 'vitest';
import { rustAnalyzer } from '../languages/rust.js';
import type { AnalyzerInput } from '../types.js';

function makeInput(source: string): AnalyzerInput {
  return { filePath: 'lib.rs', language: 'rust', source };
}

describe('rustAnalyzer', () => {
  it('detects pub fn with no internal references as candidate (confidence 0.6)', async () => {
    const source = `pub fn unused_function() {
    println!("hello");
}

fn main() {
    println!("main");
}
`;
    const output = await rustAnalyzer.analyze(makeInput(source));
    const candidates = output.findings.filter(f => f.kind === 'unused_export' || f.kind === 'dead_code');
    expect(candidates.length).toBeGreaterThanOrEqual(1);
    expect(candidates[0]!.confidence).toBe(0.6);
  });

  it('detects complexity outlier with many match arms', async () => {
    // Build a function with many if-expressions to trigger complexity
    const arms = Array.from({ length: 30 }, (_, i) => `    if x == ${i} { return ${i}; }`).join('\n');
    const source = `pub fn complex_fn(x: i32) -> i32 {\n${arms}\n    return 0;\n}\n`;
    const output = await rustAnalyzer.analyze(makeInput(source));
    const outliers = output.findings.filter(f => f.kind === 'complexity_outlier');
    expect(outliers.length).toBeGreaterThan(0);
  });

  it('parse failure for malformed Rust → parseStatus: failed', async () => {
    const source = 'pub fn broken( {  return 1; ';
    const output = await rustAnalyzer.analyze(makeInput(source));
    expect(output.parseStatus).toBe('failed');
    expect(output.findings.some(f => f.kind === 'parse_failed')).toBe(true);
  });

  it('extracts pub items correctly', async () => {
    const source = `
pub struct Foo {}
pub enum Bar { A, B }
pub fn baz() {}
fn private() {}
`;
    const output = await rustAnalyzer.analyze(makeInput(source));
    expect(output.metrics.exports).toBeGreaterThanOrEqual(3);
  });

  it('produces at least 3 distinct finding kinds', async () => {
    const kinds = new Set<string>();
    const broken = await rustAnalyzer.analyze(makeInput('pub fn broken( {'));
    broken.findings.forEach(f => kinds.add(f.kind));

    const arms = Array.from({ length: 30 }, (_, i) => `    if x == ${i} { return ${i}; }`).join('\n');
    const complex = await rustAnalyzer.analyze(makeInput(`pub fn f(x: i32) -> i32 {\n${arms}\n    0\n}\n`));
    complex.findings.forEach(f => kinds.add(f.kind));

    const unused = await rustAnalyzer.analyze(makeInput('pub fn orphan() {}\nfn main() {}\n'));
    unused.findings.forEach(f => kinds.add(f.kind));

    const large = await rustAnalyzer.analyze(makeInput(Array.from({ length: 510 }, (_, i) => `pub fn f${i}() {}`).join('\n')));
    large.findings.forEach(f => kinds.add(f.kind));

    expect(kinds.size).toBeGreaterThanOrEqual(3);
  });
});
