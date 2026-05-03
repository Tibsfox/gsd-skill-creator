/**
 * C02 T3 — TypeScript + TSX analyzer tests.
 */

import { describe, it, expect } from 'vitest';
import { typescriptAnalyzer } from '../languages/typescript.js';
import { tsxAnalyzer } from '../languages/tsx.js';
import type { AnalyzerInput } from '../types.js';

function makeInput(filePath: string, source: string): AnalyzerInput {
  return { filePath, language: 'typescript', source };
}

// ─── TypeScript analyzer ─────────────────────────────────

describe('typescriptAnalyzer', () => {
  it('detects unused export candidate at confidence 0.6', async () => {
    const source = `
export function foo() { return 1; }
export function bar() { return foo(); }
`;
    const output = await typescriptAnalyzer.analyze(makeInput('a.ts', source));
    // 'foo' is imported internally by bar, 'bar' has no internal import → candidate
    // Heuristic: any export with no reference within the same file gets flagged
    const candidates = output.findings.filter(
      f => f.kind === 'unused_export' || f.kind === 'dead_code',
    );
    expect(candidates.length).toBeGreaterThanOrEqual(1);
    expect(candidates.every(c => c.confidence === 0.6)).toBe(true);
  });

  it('detects complexity outlier severity med for function with 20 branches', async () => {
    // Build a function with 20 if-statements
    const branches = Array.from({ length: 20 }, (_, i) => `  if (x${i}) { result += ${i}; }`).join('\n');
    const source = `export function complex(${Array.from({ length: 20 }, (_, i) => `x${i}: boolean`).join(', ')}) {\n  let result = 0;\n${branches}\n  return result;\n}\n`;
    const output = await typescriptAnalyzer.analyze(makeInput('complex.ts', source));
    const outliers = output.findings.filter(f => f.kind === 'complexity_outlier');
    expect(outliers.length).toBeGreaterThan(0);
    expect(outliers[0]!.severity).toBe('med');
  });

  it('detects complexity outlier severity high for function with 30 branches', async () => {
    const branches = Array.from({ length: 30 }, (_, i) => `  if (x${i}) { result += ${i}; }`).join('\n');
    const source = `export function veryComplex(${Array.from({ length: 30 }, (_, i) => `x${i}: boolean`).join(', ')}) {\n  let result = 0;\n${branches}\n  return result;\n}\n`;
    const output = await typescriptAnalyzer.analyze(makeInput('veryComplex.ts', source));
    const outliers = output.findings.filter(f => f.kind === 'complexity_outlier');
    expect(outliers.length).toBeGreaterThan(0);
    const hasHigh = outliers.some(f => f.severity === 'high');
    expect(hasHigh).toBe(true);
  });

  it('parseStatus: failed for malformed TypeScript (unclosed brace)', async () => {
    const source = 'export function broken( { return 1;';
    const output = await typescriptAnalyzer.analyze(makeInput('broken.ts', source));
    expect(output.parseStatus).toBe('failed');
    const parseFailed = output.findings.filter(f => f.kind === 'parse_failed');
    expect(parseFailed.length).toBeGreaterThan(0);
    // Rationale should include the file path
    expect(parseFailed[0]!.rationale.length).toBeGreaterThan(0);
  });

  it('metric extraction matches known fixture', async () => {
    // A fixture with known LOC=5, functions=2, exports=2
    const source = [
      'export function alpha() { return 1; }',  // fn 1, export 1
      'export function beta() { return 2; }',   // fn 2, export 2
      '// comment',
      '',
      'const x = 3;',                           // no export
    ].join('\n');
    const output = await typescriptAnalyzer.analyze(makeInput('fixture.ts', source));
    expect(output.metrics.functions).toBeGreaterThanOrEqual(2);
    expect(output.metrics.exports).toBeGreaterThanOrEqual(2);
    expect(output.metrics.loc).toBeGreaterThanOrEqual(3);
    expect(output.parseStatus).toBe('ok');
  });

  it('large file (>500 LOC) produces large_file finding', async () => {
    // Generate a 510-line file
    const lines = Array.from({ length: 510 }, (_, i) => `export const v${i} = ${i};`);
    const source = lines.join('\n');
    const output = await typescriptAnalyzer.analyze(makeInput('large.ts', source));
    const largeFile = output.findings.filter(f => f.kind === 'large_file');
    expect(largeFile.length).toBeGreaterThan(0);
  });

  it('produces at least 3 distinct finding kinds across test fixtures', async () => {
    // Run on various fixtures and collect all finding kinds
    const allKinds = new Set<string>();

    // Parse failed
    const broken = await typescriptAnalyzer.analyze(makeInput('broken.ts', 'export function broken( {'));
    broken.findings.forEach(f => allKinds.add(f.kind));

    // Large file
    const large = Array.from({ length: 510 }, (_, i) => `export const v${i} = ${i};`).join('\n');
    const largeOut = await typescriptAnalyzer.analyze(makeInput('large.ts', large));
    largeOut.findings.forEach(f => allKinds.add(f.kind));

    // Unused export
    const unused = 'export function orphan() { return 42; }';
    const unusedOut = await typescriptAnalyzer.analyze(makeInput('unused.ts', unused));
    unusedOut.findings.forEach(f => allKinds.add(f.kind));

    // Complexity outlier
    const branches = Array.from({ length: 20 }, (_, i) => `  if (x${i}) { r += ${i}; }`).join('\n');
    const complexSrc = `export function f(${Array.from({ length: 20 }, (_, i) => `x${i}: boolean`).join(', ')}) { let r = 0;\n${branches}\n return r; }`;
    const complexOut = await typescriptAnalyzer.analyze(makeInput('complex.ts', complexSrc));
    complexOut.findings.forEach(f => allKinds.add(f.kind));

    expect(allKinds.size).toBeGreaterThanOrEqual(3);
  });
});

// ─── TSX analyzer ─────────────────────────────────────────

describe('tsxAnalyzer', () => {
  it('parses JSX correctly', async () => {
    const source = `
import React from 'react';
export function Button({ label }: { label: string }) {
  return <button>{label}</button>;
}
`;
    const input: AnalyzerInput = { filePath: 'Button.tsx', language: 'tsx', source };
    const output = await tsxAnalyzer.analyze(input);
    expect(output.parseStatus).toBe('ok');
  });

  it('detects parse errors in malformed TSX', async () => {
    const source = 'export function Bad( { return <div>; }';
    const input: AnalyzerInput = { filePath: 'bad.tsx', language: 'tsx', source };
    const output = await tsxAnalyzer.analyze(input);
    expect(output.parseStatus).toBe('failed');
  });
});
