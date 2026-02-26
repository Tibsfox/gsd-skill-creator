/**
 * Citation parser orchestrator integration tests.
 *
 * Validates the full extraction pipeline: inline patterns, bibliography
 * parsing, cross-reference boost, deduplication, filtering, and stats.
 */

import { describe, it, expect } from 'vitest';
import { extractCitations } from '../parser.js';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const TEACHING_REFERENCE = `
# Progressive Muscle Relaxation: Teaching Reference

Progressive Muscle Relaxation (PMR) was developed by Dr. Edmund Jacobson in the 1930s
as a systematic technique for achieving deep muscle relaxation. The core principle,
as described in (Jacobson, 1938), involves alternately tensing and relaxing specific
muscle groups to develop awareness of physical tension.

Horowitz and Hill (2015) describe the physiological basis for relaxation techniques,
noting that systematic muscle tension reduction activates the parasympathetic nervous
system. The technique has been validated in numerous clinical trials [1, 2, 3] and
is recommended by the American Psychological Association.

Research by Bernstein and Borkovec (1973) established the modern protocol, which was
later refined by Carlson and Hoyle (1993). A comprehensive meta-analysis (Smith, 2005)
confirmed efficacy across anxiety disorders.

For implementation details, see the NASA Technical Report at
https://ntrs.nasa.gov/citations/19630001693 and the definitive textbook
(ISBN 978-0-521-80926-9).

The DOI for the sleep study is doi: 10.1016/j.sleep.2015.12.009 and additional
resources are available at https://arxiv.org/abs/2301.01234 and
https://github.com/relaxation-toolkit/pmr-protocol.

According to McGuigan, the technique was also adapted for biofeedback applications [4].

## References

Bernstein, D. A., & Borkovec, T. D. (1973). Progressive relaxation training: A manual for the helping professions. Research Press.

Carlson, C. R., & Hoyle, R. H. (1993). Efficacy of abbreviated progressive muscle relaxation training. Journal of Consulting and Clinical Psychology, 61(6), 1059-1067.

Horowitz, P., & Hill, W. (2015). The Art of Electronics (3rd ed.). Cambridge University Press.

Jacobson, E. (1938). Progressive Relaxation. University of Chicago Press.

Smith, J. C. (2005). Relaxation, meditation, and mindfulness: A mental health practitioner's guide. Springer.
`;

// ---------------------------------------------------------------------------
// 1. APA inline extraction
// ---------------------------------------------------------------------------

describe('extractCitations', () => {
  it('extracts APA inline citations', async () => {
    const result = await extractCitations(
      'As shown in (Jacobson, 1938) the technique works.',
      'test.md',
    );
    const apa = result.citations.filter(c => c.extraction_method === 'inline-apa');
    expect(apa.length).toBeGreaterThanOrEqual(1);
    expect(apa[0].confidence).toBe(0.85);
  });

  // ---------------------------------------------------------------------------
  // 2. Narrative APA
  // ---------------------------------------------------------------------------

  it('extracts narrative APA citations', async () => {
    const result = await extractCitations(
      'Horowitz and Hill (2015) describe the technique.',
      'test.md',
    );
    const narrative = result.citations.filter(c => c.extraction_method === 'narrative');
    expect(narrative.length).toBeGreaterThanOrEqual(1);
    expect(narrative[0].confidence).toBe(0.75);
  });

  // ---------------------------------------------------------------------------
  // 3. DOI extraction
  // ---------------------------------------------------------------------------

  it('extracts DOI citations', async () => {
    const result = await extractCitations(
      'See doi: 10.1016/j.sleep.2015.12.009 for the study.',
      'test.md',
    );
    const dois = result.citations.filter(c => c.extraction_method === 'doi');
    expect(dois.length).toBeGreaterThanOrEqual(1);
    expect(dois[0].confidence).toBe(0.99);
  });

  // ---------------------------------------------------------------------------
  // 4. ISBN extraction
  // ---------------------------------------------------------------------------

  it('extracts ISBN citations', async () => {
    const result = await extractCitations(
      'The textbook (ISBN 978-0-521-80926-9) covers this topic.',
      'test.md',
    );
    const isbns = result.citations.filter(c => c.extraction_method === 'isbn');
    expect(isbns.length).toBeGreaterThanOrEqual(1);
    expect(isbns[0].confidence).toBe(0.95);
  });

  // ---------------------------------------------------------------------------
  // 5. Numbered references
  // ---------------------------------------------------------------------------

  it('extracts numbered references', async () => {
    const result = await extractCitations(
      'As shown in [3] and validated in [1, 2].',
      'test.md',
    );
    const numbered = result.citations.filter(c => c.extraction_method === 'inline-numbered');
    expect(numbered.length).toBeGreaterThanOrEqual(1);
    expect(numbered[0].confidence).toBe(0.85);
  });

  // ---------------------------------------------------------------------------
  // 6. URL academic
  // ---------------------------------------------------------------------------

  it('extracts and classifies academic URLs', async () => {
    const result = await extractCitations(
      'See the NASA report at https://ntrs.nasa.gov/citations/19630001693 for details.',
      'test.md',
    );
    const urls = result.citations.filter(c => c.extraction_method === 'url');
    expect(urls.length).toBeGreaterThanOrEqual(1);
    expect(urls[0].confidence).toBeGreaterThanOrEqual(0.65);
  });

  // ---------------------------------------------------------------------------
  // 7. Informal citation
  // ---------------------------------------------------------------------------

  it('extracts informal citations', async () => {
    const result = await extractCitations(
      'This was developed by Dr. Edmund Jacobson in the 1930s as a technique.',
      'test.md',
    );
    const informal = result.citations.filter(c => c.extraction_method === 'informal');
    expect(informal.length).toBeGreaterThanOrEqual(1);
    expect(informal[0].confidence).toBe(0.45);
  });

  // ---------------------------------------------------------------------------
  // 8. Bibliography section parsing
  // ---------------------------------------------------------------------------

  it('parses bibliography section entries', async () => {
    const text = `
Some body text here.

## References

Bernstein, D. A., & Borkovec, T. D. (1973). Progressive relaxation training. Research Press.

Jacobson, E. (1938). Progressive Relaxation. University of Chicago Press.

Smith, J. C. (2005). Relaxation guide. Springer.
`;
    const result = await extractCitations(text, 'test.md');
    const bib = result.citations.filter(c => c.extraction_method === 'bibliography');
    expect(bib.length).toBeGreaterThanOrEqual(3);
    expect(bib.every(c => c.confidence >= 0.90)).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // 9. Cross-reference boost
  // ---------------------------------------------------------------------------

  it('applies cross-reference boost when inline matches bibliography', async () => {
    // Use two inline citations: one with bibliography match (Jacobson), one without (Unmatched)
    const text = `
As shown in (Jacobson, 1938) and (Unmatched, 2020) the technique works.

## References

Jacobson, E. (1938). Progressive Relaxation. University of Chicago Press.
`;
    const result = await extractCitations(text, 'test.md');

    // After dedup, the Jacobson entry merges inline+bib -> bib text wins with boosted confidence 0.90
    const jacobson = result.citations.find(c => c.text.includes('Jacobson'));
    expect(jacobson).toBeDefined();
    // The confidence should be 0.90 (boosted from 0.85 inline or 0.90 bib, whichever is higher)
    expect(jacobson!.confidence).toBe(0.90);

    // The unmatched citation should NOT be boosted (remains at 0.85 base)
    const unmatched = result.citations.find(c => c.text.includes('Unmatched'));
    expect(unmatched).toBeDefined();
    expect(unmatched!.confidence).toBe(0.85);
  });

  // ---------------------------------------------------------------------------
  // 10. Deduplication
  // ---------------------------------------------------------------------------

  it('deduplicates same author+year from different patterns', async () => {
    const text = `
Jacobson (1938) introduced the technique. As described in (Jacobson, 1938),
it involves systematic muscle relaxation.

## References

Jacobson, E. (1938). Progressive Relaxation. University of Chicago Press.
`;
    const result = await extractCitations(text, 'test.md');
    // All three are Jacobson 1938 — should be deduped to one entry
    const jacobson = result.citations.filter(c => c.text.includes('Jacobson') || c.text.includes('jacobson'));
    // After dedup, there should be exactly 1 Jacobson entry (the bibliography one with highest confidence)
    expect(jacobson.length).toBe(1);
  });

  // ---------------------------------------------------------------------------
  // 11. False positive rejection
  // ---------------------------------------------------------------------------

  it('rejects false positives in plain prose', async () => {
    const text = 'In 2015, the company grew by 30%. We sold 300 units. The team met in room [A].';
    const result = await extractCitations(text, 'test.md');
    // "[A]" won't match NUMBERED_REF (requires digits), "2015" alone won't match APA patterns
    expect(result.citations).toHaveLength(0);
  });

  // ---------------------------------------------------------------------------
  // 12. Empty input
  // ---------------------------------------------------------------------------

  it('handles empty input', async () => {
    const result = await extractCitations('', 'test.md');
    expect(result.citations).toHaveLength(0);
    expect(result.stats.total_candidates).toBe(0);
    expect(result.stats.high_confidence).toBe(0);
    expect(result.stats.medium_confidence).toBe(0);
    expect(result.stats.low_confidence).toBe(0);
    expect(result.stats.dois_found).toBe(0);
    expect(result.stats.isbns_found).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // 13. Full teaching reference
  // ---------------------------------------------------------------------------

  it('extracts 10+ citations from realistic teaching reference', async () => {
    const result = await extractCitations(TEACHING_REFERENCE, 'pmr-teaching.md');
    expect(result.citations.length).toBeGreaterThanOrEqual(10);
    expect(result.stats.total_candidates).toBeGreaterThanOrEqual(10);
    expect(result.stats.dois_found).toBeGreaterThanOrEqual(1);
  });

  // ---------------------------------------------------------------------------
  // 14. Performance
  // ---------------------------------------------------------------------------

  it('completes extraction of ~5000 chars in under 500ms', async () => {
    // Generate ~5000 chars of text with mixed citations
    const lines: string[] = [];
    for (let i = 0; i < 50; i++) {
      lines.push(`Research by Author${i} (${2000 + (i % 25)}) showed results [${i + 1}].`);
      lines.push(`As described by Dr. Researcher${i}, the method works (Smith, ${1990 + (i % 30)}).`);
    }
    lines.push('\n## References\n');
    for (let i = 0; i < 20; i++) {
      lines.push(`Author${i}, A. (${2000 + i}). Title of paper ${i}. Journal of Testing, ${i}(1), 1-10.`);
    }
    const text = lines.join('\n');
    expect(text.length).toBeGreaterThan(3000);

    const start = performance.now();
    const result = await extractCitations(text, 'perf-test.md');
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(500);
    expect(result.citations.length).toBeGreaterThan(0);
  });

  // ---------------------------------------------------------------------------
  // Stats validation
  // ---------------------------------------------------------------------------

  it('correctly categorizes confidence tiers in stats', async () => {
    const result = await extractCitations(TEACHING_REFERENCE, 'test.md');
    const { stats } = result;

    // All stats should be non-negative
    expect(stats.total_candidates).toBeGreaterThanOrEqual(0);
    expect(stats.high_confidence).toBeGreaterThanOrEqual(0);
    expect(stats.medium_confidence).toBeGreaterThanOrEqual(0);
    expect(stats.low_confidence).toBeGreaterThanOrEqual(0);

    // Sum of tiers should equal total
    expect(stats.high_confidence + stats.medium_confidence + stats.low_confidence)
      .toBe(stats.total_candidates);
  });
});
