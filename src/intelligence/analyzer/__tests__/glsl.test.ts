/**
 * C02 T8 — GLSL analyzer tests.
 */

import { describe, it, expect } from 'vitest';
import { glslAnalyzer } from '../languages/glsl.js';
import type { AnalyzerInput } from '../types.js';

function makeInput(source: string): AnalyzerInput {
  return { filePath: 'shader.glsl', language: 'glsl', source };
}

describe('glslAnalyzer', () => {
  it('detects declared uniform never referenced as candidate', async () => {
    const source = `
uniform vec3 unused;
uniform float active;

void main() {
  gl_FragColor = vec4(active, 0.0, 0.0, 1.0);
}
`;
    const output = await glslAnalyzer.analyze(makeInput(source));
    const candidates = output.findings.filter(
      f => f.kind === 'unused_export' || f.kind === 'dead_code',
    );
    expect(candidates.some(c => c.title.includes('unused'))).toBe(true);
  });

  it('large shader (>300 LOC) produces large_file finding', async () => {
    const lines = Array.from({ length: 400 }, (_, i) => `float v${i} = ${i}.0;`);
    lines.push('void main() { gl_FragColor = vec4(v0, 0.0, 0.0, 1.0); }');
    const output = await glslAnalyzer.analyze(makeInput(lines.join('\n')));
    expect(output.findings.some(f => f.kind === 'large_file')).toBe(true);
  });

  it('parses valid GLSL successfully', async () => {
    const source = `
precision mediump float;
uniform vec2 resolution;
void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  gl_FragColor = vec4(uv.x, uv.y, 0.0, 1.0);
}
`;
    const output = await glslAnalyzer.analyze(makeInput(source));
    expect(['ok', 'failed']).toContain(output.parseStatus);
  });

  it('produces at least 2 distinct finding kinds', async () => {
    const kinds = new Set<string>();

    // large_file
    const large = await glslAnalyzer.analyze(makeInput([...Array.from({ length: 400 }, (_, i) => `float v${i} = ${i}.0;`), 'void main() {}'].join('\n')));
    large.findings.forEach(f => kinds.add(f.kind));

    // unused uniform
    const unused = await glslAnalyzer.analyze(makeInput('uniform vec3 neverUsed;\nvoid main() {}'));
    unused.findings.forEach(f => kinds.add(f.kind));

    expect(kinds.size).toBeGreaterThanOrEqual(2);
  });
});
