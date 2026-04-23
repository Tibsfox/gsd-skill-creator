// @ts-nocheck -- imports a .mjs script as runtime JS
import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const scriptPath = path.join(here, '../../../scripts/convergent/capcom-gate.mjs');

const mod = await import(scriptPath);
const {
  checkCiteResolution,
  checkNumericAttribution,
  checkQuoteLength,
  checkQuoteUniqueness,
  checkMappingCoverage,
} = mod;

const sampleMeta = [
  { cite_key: 'liu2026wildskills', tier: 'tier_s' },
  { cite_key: 'ni2026coevoskills', tier: 'tier_s' },
  { cite_key: 'mu2026talklora', tier: 'tier_a' },
  { cite_key: 'extagents2025', tier: 'tier_b' },
];

describe('convergent capcom-gate: checkCiteResolution', () => {
  it('passes when all cite keys resolve (including \\citeconv macro)', () => {
    const tex = `A validated finding~\\cite{liu2026wildskills}. And another~\\citeconv{mu2026talklora}.`;
    const res = checkCiteResolution(tex, sampleMeta);
    expect(res.pass).toBe(true);
    expect(res.cited_count).toBe(2);
    expect(res.unresolved).toEqual([]);
  });

  it('fails and enumerates unresolved cite keys', () => {
    const tex = `\\cite{liu2026wildskills, madeup_key} and \\citeconv{also_missing}`;
    const res = checkCiteResolution(tex, sampleMeta);
    expect(res.pass).toBe(false);
    expect(res.unresolved).toContain('madeup_key');
    expect(res.unresolved).toContain('also_missing');
  });
});

describe('convergent capcom-gate: checkNumericAttribution', () => {
  it('passes when numbers have inline \\cite within 50 chars', () => {
    const tex = `The skill pass rate hit 65.5\\% on Terminal-Bench 2.0~\\cite{liu2026wildskills}.`;
    const res = checkNumericAttribution(tex);
    expect(res.pass).toBe(true);
  });

  it('passes with \\citeconv within window', () => {
    const tex = `The F1 score was 0.96 in the probe~\\citeconv{mu2026talklora}.`;
    const res = checkNumericAttribution(tex);
    expect(res.pass).toBe(true);
  });

  it('fails on bare numeric claims with no nearby citation', () => {
    // 40.5pp shape triggers the trailing-unit regex; surrounding text has no \cite or \citeconv.
    const tex = `The headline finding is a 40.5pp improvement over baseline, stated with no attribution whatsoever within fifty characters of the number.`;
    const res = checkNumericAttribution(tex);
    expect(res.pass).toBe(false);
    expect(res.violation_count).toBeGreaterThan(0);
  });
});

describe('convergent capcom-gate: checkQuoteLength', () => {
  it('passes when all quotes are within the default 15-word limit', () => {
    const tex = "They call it ``the missing diagonal'' — a short phrase.";
    const res = checkQuoteLength(tex);
    expect(res.pass).toBe(true);
  });

  it('flags quotes exceeding the word limit', () => {
    const tex = "Quote: ``this is a direct quotation that runs on for more than fifteen total words to exceed the threshold''.";
    const res = checkQuoteLength(tex);
    expect(res.pass).toBe(false);
    expect(res.violation_count).toBe(1);
  });
});

describe('convergent capcom-gate: checkQuoteUniqueness', () => {
  it('passes when each source is quoted at most once', () => {
    const tex = [
      "Para one has a quote ``short one'' by \\cite{liu2026wildskills}.",
      "",
      "Para two has another ``unique phrase'' by \\citeconv{mu2026talklora}.",
    ].join('\n');
    const res = checkQuoteUniqueness(tex);
    expect(res.pass).toBe(true);
  });

  it('flags sources quoted more than once', () => {
    const tex = [
      "Para one has a quote ``first one'' by \\cite{liu2026wildskills}.",
      "",
      "Another para: ``second quote'' and ``third too'' per \\cite{liu2026wildskills}.",
    ].join('\n');
    const res = checkQuoteUniqueness(tex);
    expect(res.pass).toBe(false);
    expect(res.violations[0].cite).toBe('liu2026wildskills');
  });
});

describe('convergent capcom-gate: checkMappingCoverage (new)', () => {
  it('passes when every row carries >=1 Tier-S/A resolved cite_key', () => {
    const mapping = {
      rows: [
        {
          component: 'Skill-creator 6-step loop',
          primary_papers: [
            { cite_key: 'liu2026wildskills', tier: 'tier_s' },
            { cite_key: 'ni2026coevoskills', tier: 'tier_s' },
          ],
        },
        {
          component: 'Chipset',
          primary_papers: [
            { cite_key: 'mu2026talklora', tier: 'tier_a' },
          ],
        },
      ],
    };
    const res = checkMappingCoverage(mapping, sampleMeta);
    expect(res.pass).toBe(true);
    expect(res.covered_rows).toBe(2);
    expect(res.row_count).toBe(2);
  });

  it('fails when a row has only Tier-B papers', () => {
    const mapping = {
      rows: [
        {
          component: 'Tier-B-only row (should fail)',
          primary_papers: [
            { cite_key: 'extagents2025', tier: 'tier_b' },
          ],
        },
      ],
    };
    const res = checkMappingCoverage(mapping, sampleMeta);
    expect(res.pass).toBe(false);
    expect(res.violation_count).toBe(1);
    expect(res.violations[0].component).toBe('Tier-B-only row (should fail)');
  });

  it('fails when a row references an unresolved Tier-S cite_key', () => {
    const mapping = {
      rows: [
        {
          component: 'Missing-citation row',
          primary_papers: [
            { cite_key: 'ghostpaper2026', tier: 'tier_s' },
          ],
        },
      ],
    };
    const res = checkMappingCoverage(mapping, sampleMeta);
    expect(res.pass).toBe(false);
    expect(res.violations[0].detail).toContain('ghostpaper2026');
  });

  it('returns a structured failure when mapping schema is missing', () => {
    const res = checkMappingCoverage(null, sampleMeta);
    expect(res.pass).toBe(false);
    expect(res.detail).toContain('missing or malformed');
  });

  it('returns a structured failure when rows is not an array', () => {
    const res = checkMappingCoverage({ rows: 'not-an-array' }, sampleMeta);
    expect(res.pass).toBe(false);
    expect(res.detail).toContain('missing or malformed');
  });
});
