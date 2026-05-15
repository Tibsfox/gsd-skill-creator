// DOI detector benchmark (v1.49.653 L-05 — CONCERNS §20).
//
// Measures throughput of `detectDois()` on representative text loads:
//   - small  (~500 chars, 1 DOI)
//   - medium (~5 KB, 5 DOIs)
//   - large  (~50 KB, 50 DOIs)
//
// Run:    npx vitest bench --config vitest.bench.config.mjs
// Verify: npm run bench:check (compares against tools/bench/baseline.json)

import { bench, describe } from 'vitest';
import { detectDois } from '../doi-detector.js';

// Build deterministic synthetic input. Real-world DOIs have format
// 10.NNNN/<id> where NNNN is 4+ digits. Keep the text dense but varied so
// regex can't pathologically short-circuit.
function buildText(numCitations: number): string {
  const parts: string[] = [];
  const prefixes = ['Smith et al. (2024) doi:', 'see ', 'cf. ', 'as in ', 'per '];
  for (let i = 0; i < numCitations; i++) {
    const journal = 1000 + (i % 9000);
    const article = (i * 7919) % 999999;
    const prefix = prefixes[i % prefixes.length];
    parts.push(
      `${prefix}10.${journal}/jou.${article}. ` +
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' +
        'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ' +
        `Reference ${i} continues with prose discussing the result. `,
    );
  }
  return parts.join('\n\n');
}

const SMALL_TEXT = buildText(1);
const MEDIUM_TEXT = buildText(5);
const LARGE_TEXT = buildText(50);

describe('detectDois — synthetic load', () => {
  bench('small  (~500c, 1 DOI)', () => {
    detectDois(SMALL_TEXT, 'bench.md');
  });

  bench('medium (~5KB, 5 DOIs)', () => {
    detectDois(MEDIUM_TEXT, 'bench.md');
  });

  bench('large  (~50KB, 50 DOIs)', () => {
    detectDois(LARGE_TEXT, 'bench.md');
  });
});
