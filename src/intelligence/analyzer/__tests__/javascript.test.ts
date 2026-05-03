/**
 * C02 T4 — JavaScript + JSX analyzer tests.
 */

import { describe, it, expect } from 'vitest';
import { javascriptAnalyzer } from '../languages/javascript.js';
import { jsxAnalyzer } from '../languages/jsx.js';
import type { AnalyzerInput } from '../types.js';

function makeInput(filePath: string, source: string): AnalyzerInput {
  return { filePath, language: 'javascript', source };
}

describe('javascriptAnalyzer', () => {
  it('parses a simple JS file successfully', async () => {
    const source = 'export function foo() { return 42; }';
    const output = await javascriptAnalyzer.analyze(makeInput('a.js', source));
    expect(output.parseStatus).toBe('ok');
    expect(output.metrics.functions).toBeGreaterThanOrEqual(1);
    expect(output.metrics.exports).toBeGreaterThanOrEqual(1);
  });

  it('detects unused export candidate at confidence 0.6', async () => {
    const source = 'export function orphan() { return 42; }';
    const output = await javascriptAnalyzer.analyze(makeInput('orphan.js', source));
    const candidates = output.findings.filter(f => f.kind === 'unused_export' || f.kind === 'dead_code');
    expect(candidates.length).toBeGreaterThanOrEqual(1);
    expect(candidates.every(c => c.confidence === 0.6)).toBe(true);
  });

  it('detects complexity outlier for function with 20 if-branches', async () => {
    const branches = Array.from({ length: 20 }, (_, i) => `  if (x${i}) { r += ${i}; }`).join('\n');
    const source = `export function f(${Array.from({ length: 20 }, (_, i) => `x${i}`).join(',')}) { let r = 0;\n${branches}\nreturn r; }`;
    const output = await javascriptAnalyzer.analyze(makeInput('complex.js', source));
    const outliers = output.findings.filter(f => f.kind === 'complexity_outlier');
    expect(outliers.length).toBeGreaterThan(0);
  });

  it('parse failure for malformed JS', async () => {
    const source = 'function broken( { return;';
    const output = await javascriptAnalyzer.analyze(makeInput('broken.js', source));
    expect(output.parseStatus).toBe('failed');
    expect(output.findings.some(f => f.kind === 'parse_failed')).toBe(true);
  });

  it('large file (>500 LOC) produces large_file finding', async () => {
    const lines = Array.from({ length: 510 }, (_, i) => `exports.v${i} = ${i};`);
    const output = await javascriptAnalyzer.analyze(makeInput('large.js', lines.join('\n')));
    expect(output.findings.some(f => f.kind === 'large_file')).toBe(true);
  });

  it('produces at least 3 distinct finding kinds', async () => {
    const kinds = new Set<string>();
    // parse_failed
    const b = await javascriptAnalyzer.analyze(makeInput('b.js', 'function broken( {'));
    b.findings.forEach(f => kinds.add(f.kind));
    // large_file
    const large = await javascriptAnalyzer.analyze(makeInput('l.js', Array.from({length:510}, (_,i)=>`const v${i}=${i};`).join('\n')));
    large.findings.forEach(f => kinds.add(f.kind));
    // unused_export
    const u = await javascriptAnalyzer.analyze(makeInput('u.js', 'export function orphan() {}'));
    u.findings.forEach(f => kinds.add(f.kind));
    expect(kinds.size).toBeGreaterThanOrEqual(3);
  });
});

describe('jsxAnalyzer', () => {
  it('parses JSX correctly', async () => {
    const source = `import React from 'react';
export function Button({ label }) {
  return <button>{label}</button>;
}`;
    const input: AnalyzerInput = { filePath: 'Button.jsx', language: 'jsx', source };
    const output = await jsxAnalyzer.analyze(input);
    expect(output.parseStatus).toBe('ok');
  });

  it('detects parse error in malformed JSX', async () => {
    const source = 'function Bad( { return <div>; }';
    const input: AnalyzerInput = { filePath: 'bad.jsx', language: 'jsx', source };
    const output = await jsxAnalyzer.analyze(input);
    expect(output.parseStatus).toBe('failed');
  });
});
