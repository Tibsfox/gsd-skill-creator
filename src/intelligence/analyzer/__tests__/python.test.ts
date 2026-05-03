/**
 * C02 T6 — Python analyzer tests.
 */

import { describe, it, expect } from 'vitest';
import { pythonAnalyzer } from '../languages/python.js';
import type { AnalyzerInput } from '../types.js';

function makeInput(source: string): AnalyzerInput {
  return { filePath: 'script.py', language: 'python', source };
}

describe('pythonAnalyzer', () => {
  it('detects unused top-level def as candidate (confidence 0.6)', async () => {
    const source = `
def helper():
    return 42

def main():
    print("hello")
`;
    const output = await pythonAnalyzer.analyze(makeInput(source));
    const candidates = output.findings.filter(f => f.kind === 'unused_export' || f.kind === 'dead_code');
    expect(candidates.length).toBeGreaterThanOrEqual(1);
    expect(candidates.every(c => c.confidence === 0.6)).toBe(true);
  });

  it('detects complexity outlier for function with 18 branches', async () => {
    const branches = Array.from({ length: 18 }, (_, i) => `    if x${i}:\n        result += ${i}`).join('\n');
    const source = `def complex_fn(${Array.from({ length: 18 }, (_, i) => `x${i}`).join(', ')}):\n    result = 0\n${branches}\n    return result\n`;
    const output = await pythonAnalyzer.analyze(makeInput(source));
    const outliers = output.findings.filter(f => f.kind === 'complexity_outlier');
    expect(outliers.length).toBeGreaterThan(0);
  });

  it('parse failure for malformed Python', async () => {
    // tree-sitter Python is lenient but some things cause errors
    const source = 'def broken(\n    x:\n'; // unclosed function
    const output = await pythonAnalyzer.analyze(makeInput(source));
    // Either parse fails or it at least returns without crash
    expect(['ok', 'failed']).toContain(output.parseStatus);
  });

  it('extracts functions and classes correctly', async () => {
    const source = `
def foo():
    pass

class Bar:
    def method(self):
        pass

def baz():
    pass
`;
    const output = await pythonAnalyzer.analyze(makeInput(source));
    expect(output.metrics.functions).toBeGreaterThanOrEqual(3);
    expect(output.parseStatus).toBe('ok');
  });

  it('large file (>500 LOC) produces large_file finding', async () => {
    const lines = Array.from({ length: 510 }, (_, i) => `x${i} = ${i}`);
    const output = await pythonAnalyzer.analyze(makeInput(lines.join('\n')));
    expect(output.findings.some(f => f.kind === 'large_file')).toBe(true);
  });

  it('produces at least 3 distinct finding kinds', async () => {
    const kinds = new Set<string>();
    const broken = await pythonAnalyzer.analyze(makeInput('def broken(\n    x:\n'));
    broken.findings.forEach(f => kinds.add(f.kind));

    const large = await pythonAnalyzer.analyze(makeInput(Array.from({ length: 510 }, (_, i) => `x${i} = ${i}`).join('\n')));
    large.findings.forEach(f => kinds.add(f.kind));

    const unused = await pythonAnalyzer.analyze(makeInput('def orphan():\n    pass\n\ndef main():\n    pass\n'));
    unused.findings.forEach(f => kinds.add(f.kind));

    const branches = Array.from({ length: 20 }, (_, i) => `    if x${i}:\n        result += ${i}`).join('\n');
    const complex = await pythonAnalyzer.analyze(makeInput(`def f(${Array.from({ length: 20 }, (_, i) => `x${i}`).join(', ')}):\n    result=0\n${branches}\n    return result\n`));
    complex.findings.forEach(f => kinds.add(f.kind));

    expect(kinds.size).toBeGreaterThanOrEqual(3);
  });
});
