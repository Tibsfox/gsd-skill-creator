// Citation parser benchmark (v1.49.653 L-05 — CONCERNS §20).
//
// Measures end-to-end pipeline throughput of `extractCitations()` on synthetic
// scholarly text loads. The parser runs:
//   - section split (body vs bibliography)
//   - bibliography entry parsing
//   - inline pattern processing (APA, numbered refs, informal citations)
//   - DOI + URL extraction
//   - dedup
//
// Run:    npx vitest bench --config vitest.bench.config.mjs
// Verify: npm run bench:check

import { bench, describe } from 'vitest';
import { extractCitations } from '../parser.js';

// Build a synthetic scholarly text with mixed citation styles.
function buildPaper(numRefs: number): string {
  const bodyParas: string[] = [];
  const biblioEntries: string[] = [];

  for (let i = 0; i < numRefs; i++) {
    const year = 1990 + (i % 30);
    const author = `Smith${i % 100}`;
    const co = `Jones${(i * 7) % 100}`;
    const journal = 1000 + (i % 9000);
    const article = (i * 7919) % 999999;

    // Mix inline-citation styles
    if (i % 4 === 0) {
      bodyParas.push(`Recent work by ${author} (${year}) demonstrated ...`);
    } else if (i % 4 === 1) {
      bodyParas.push(`Subsequent analyses (${author} and ${co}, ${year}) confirmed ...`);
    } else if (i % 4 === 2) {
      bodyParas.push(`Numbered citation [${i + 1}] underlies this claim.`);
    } else {
      bodyParas.push(`See doi:10.${journal}/jou.${article} for details.`);
    }

    biblioEntries.push(
      `[${i + 1}] ${author}, J. and ${co}, A. (${year}). ` +
        `Sample article title number ${i}. Journal of Bench Tests, ${journal}, ${article}-${article + 10}. ` +
        `doi:10.${journal}/jou.${article}`,
    );
  }

  return [
    '# Introduction',
    '',
    bodyParas.slice(0, Math.floor(numRefs / 2)).join('\n\n'),
    '',
    '# Methods',
    '',
    bodyParas.slice(Math.floor(numRefs / 2)).join('\n\n'),
    '',
    '# References',
    '',
    biblioEntries.join('\n'),
  ].join('\n');
}

const SMALL_PAPER = buildPaper(10); // ~5 KB
const MEDIUM_PAPER = buildPaper(50); // ~25 KB
const LARGE_PAPER = buildPaper(200); // ~100 KB

describe('extractCitations — end-to-end pipeline', () => {
  bench('small  paper (10 refs, ~5KB)', async () => {
    await extractCitations(SMALL_PAPER, 'bench.md');
  });

  bench('medium paper (50 refs, ~25KB)', async () => {
    await extractCitations(MEDIUM_PAPER, 'bench.md');
  });

  bench('large  paper (200 refs, ~100KB)', async () => {
    await extractCitations(LARGE_PAPER, 'bench.md');
  });
});
