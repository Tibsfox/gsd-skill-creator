/**
 * Citation extraction patterns, DOI detector, and URL resolver tests.
 *
 * Validates regex patterns against documented examples, DOI normalization,
 * URL classification, domain confidence, and embedded DOI detection.
 */

import { describe, it, expect } from 'vitest';
import {
  INLINE_APA,
  NARRATIVE_APA,
  NUMBERED_REF,
  DOI_PATTERN,
  ISBN_PATTERN,
  URL_PATTERN,
  BIBLIOGRAPHY_HEADER,
  INFORMAL_CITATION,
  classifyDomain,
  BASE_CONFIDENCE,
} from '../patterns.js';
import { detectDois, normalizeDoi, isValidDoi } from '../doi-detector.js';
import { extractUrls, normalizeUrl, hasEmbeddedDoi } from '../url-resolver.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Reset a global regex and test for a match in the given string. */
function testPattern(pattern: RegExp, input: string): RegExpExecArray | null {
  const re = new RegExp(pattern.source, pattern.flags);
  return re.exec(input);
}

function allMatches(pattern: RegExp, input: string): RegExpExecArray[] {
  const re = new RegExp(pattern.source, pattern.flags);
  const results: RegExpExecArray[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(input)) !== null) results.push(m);
  return results;
}

// ---------------------------------------------------------------------------
// 1. INLINE_APA
// ---------------------------------------------------------------------------

describe('INLINE_APA pattern', () => {
  it('matches (Author, Year)', () => {
    const m = testPattern(INLINE_APA, 'as shown (Jacobson, 1938) in');
    expect(m).not.toBeNull();
    expect(m![1]).toBe('Jacobson');
    expect(m![2]).toBe('1938');
  });

  it('matches (Author & Author, Year)', () => {
    const m = testPattern(INLINE_APA, 'see (Horowitz & Hill, 2015) for');
    expect(m).not.toBeNull();
    expect(m![1]).toBe('Horowitz & Hill');
    expect(m![2]).toBe('2015');
  });

  it('matches (Author et al., Year)', () => {
    const m = testPattern(INLINE_APA, '(Smith et al., 2020)');
    expect(m).not.toBeNull();
    expect(m![1]).toBe('Smith et al.');
    expect(m![2]).toBe('2020');
  });

  it('does not match plain parenthetical text', () => {
    const m = testPattern(INLINE_APA, '(the year was 2015)');
    expect(m).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 2. NARRATIVE_APA
// ---------------------------------------------------------------------------

describe('NARRATIVE_APA pattern', () => {
  it('matches Author (Year)', () => {
    const m = testPattern(NARRATIVE_APA, 'Horowitz and Hill (2015) describe');
    expect(m).not.toBeNull();
    expect(m![1]).toBe('Horowitz and Hill');
    expect(m![2]).toBe('2015');
  });

  it('matches single Author (Year)', () => {
    const m = testPattern(NARRATIVE_APA, 'Jacobson (1938) introduced');
    expect(m).not.toBeNull();
    expect(m![1]).toBe('Jacobson');
    expect(m![2]).toBe('1938');
  });

  it('does not match lowercase words before year', () => {
    const m = testPattern(NARRATIVE_APA, 'around (2015) the company');
    expect(m).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 3. NUMBERED_REF
// ---------------------------------------------------------------------------

describe('NUMBERED_REF pattern', () => {
  it('matches [3]', () => {
    const m = testPattern(NUMBERED_REF, 'as shown in [3]');
    expect(m).not.toBeNull();
    expect(m![1]).toBe('3');
  });

  it('matches [1, 2]', () => {
    const m = testPattern(NUMBERED_REF, 'see [1, 2] for details');
    expect(m).not.toBeNull();
    expect(m![1]).toBe('1, 2');
  });

  it('matches [1-5]', () => {
    const m = testPattern(NUMBERED_REF, 'references [1-5]');
    expect(m).not.toBeNull();
    expect(m![1]).toBe('1-5');
  });
});

// ---------------------------------------------------------------------------
// 4. DOI_PATTERN
// ---------------------------------------------------------------------------

describe('DOI_PATTERN', () => {
  it('matches bare DOI', () => {
    const m = testPattern(DOI_PATTERN, 'doi: 10.1016/j.sleep.2015.12.009');
    expect(m).not.toBeNull();
    expect(m![1]).toBe('10.1016/j.sleep.2015.12.009');
  });

  it('matches URL-prefixed DOI', () => {
    const m = testPattern(DOI_PATTERN, 'https://doi.org/10.1016/j.sleep.2015.12.009');
    expect(m).not.toBeNull();
    expect(m![1]).toBe('10.1016/j.sleep.2015.12.009');
  });

  it('matches dx.doi.org prefix', () => {
    const m = testPattern(DOI_PATTERN, 'http://dx.doi.org/10.1234/abc');
    expect(m).not.toBeNull();
    expect(m![1]).toBe('10.1234/abc');
  });
});

// ---------------------------------------------------------------------------
// 5. ISBN_PATTERN
// ---------------------------------------------------------------------------

describe('ISBN_PATTERN', () => {
  it('matches 13-digit ISBN with hyphens', () => {
    const m = testPattern(ISBN_PATTERN, 'ISBN 978-0-521-80926-9');
    expect(m).not.toBeNull();
    expect(m![1]).toContain('978');
  });

  it('matches 10-digit ISBN', () => {
    const m = testPattern(ISBN_PATTERN, 'ISBN: 0521809266');
    expect(m).not.toBeNull();
    expect(m![1]).toBe('0521809266');
  });
});

// ---------------------------------------------------------------------------
// 6. INFORMAL_CITATION
// ---------------------------------------------------------------------------

describe('INFORMAL_CITATION pattern', () => {
  it('matches "developed by Dr. Name in Year"', () => {
    const m = testPattern(
      INFORMAL_CITATION,
      'developed by Dr. Edmund Jacobson in the 1930s',
    );
    expect(m).not.toBeNull();
    expect(m![1]).toContain('Jacobson');
  });

  it('matches "according to Name"', () => {
    const m = testPattern(INFORMAL_CITATION, 'according to Smith');
    expect(m).not.toBeNull();
    expect(m![1]).toBe('Smith');
  });

  it('does not match plain text without trigger phrase', () => {
    const m = testPattern(INFORMAL_CITATION, 'The quick brown fox');
    expect(m).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 7. BIBLIOGRAPHY_HEADER
// ---------------------------------------------------------------------------

describe('BIBLIOGRAPHY_HEADER pattern', () => {
  it('matches "References"', () => {
    expect(testPattern(BIBLIOGRAPHY_HEADER, 'References')).not.toBeNull();
  });

  it('matches "## Bibliography"', () => {
    expect(testPattern(BIBLIOGRAPHY_HEADER, '## Bibliography')).not.toBeNull();
  });

  it('matches "Works Cited"', () => {
    expect(testPattern(BIBLIOGRAPHY_HEADER, 'Works Cited')).not.toBeNull();
  });

  it('does not match inline text', () => {
    expect(testPattern(BIBLIOGRAPHY_HEADER, 'See the references section')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 8. False negatives: plain text without citation structure
// ---------------------------------------------------------------------------

describe('false negatives', () => {
  const plainText = 'The weather in 2015 was mild. We sold 300 units last year.';

  it('INLINE_APA does not match plain text', () => {
    expect(allMatches(INLINE_APA, plainText)).toHaveLength(0);
  });

  it('DOI_PATTERN does not match plain text', () => {
    expect(allMatches(DOI_PATTERN, plainText)).toHaveLength(0);
  });

  it('ISBN_PATTERN does not match plain text', () => {
    expect(allMatches(ISBN_PATTERN, plainText)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 9. DOI normalization
// ---------------------------------------------------------------------------

describe('DOI normalization', () => {
  it('strips https://doi.org/ prefix', () => {
    expect(normalizeDoi('https://doi.org/10.1016/j.sleep.2015.12.009'))
      .toBe('10.1016/j.sleep.2015.12.009');
  });

  it('strips dx.doi.org prefix', () => {
    expect(normalizeDoi('http://dx.doi.org/10.1234/abc'))
      .toBe('10.1234/abc');
  });

  it('strips doi: prefix', () => {
    expect(normalizeDoi('doi: 10.5555/test'))
      .toBe('10.5555/test');
  });

  it('trims trailing punctuation', () => {
    expect(normalizeDoi('10.1016/j.sleep.2015.12.009.'))
      .toBe('10.1016/j.sleep.2015.12.009');
  });

  it('validates valid DOIs', () => {
    expect(isValidDoi('10.1016/j.sleep.2015.12.009')).toBe(true);
    expect(isValidDoi('10.12345/abc-def')).toBe(true);
  });

  it('rejects invalid DOIs', () => {
    expect(isValidDoi('11.1016/abc')).toBe(false);
    expect(isValidDoi('10.12/short')).toBe(false);
    expect(isValidDoi('not-a-doi')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 10. URL domain classification
// ---------------------------------------------------------------------------

describe('URL domain classification', () => {
  it('assigns 0.70 to academic domains', () => {
    expect(classifyDomain('https://arxiv.org/abs/1234.5678')).toBe(0.70);
    expect(classifyDomain('https://pubmed.ncbi.nlm.nih.gov/12345')).toBe(0.70);
    expect(classifyDomain('https://mit.edu/papers/test')).toBe(0.70);
  });

  it('assigns 0.65 to government domains', () => {
    expect(classifyDomain('https://ntrs.nasa.gov/citations/19630001693')).toBe(0.65);
    expect(classifyDomain('https://data.gov/datasets')).toBe(0.65);
  });

  it('assigns 0.60 to repository domains', () => {
    expect(classifyDomain('https://github.com/org/repo')).toBe(0.60);
    expect(classifyDomain('https://gitlab.com/user/project')).toBe(0.60);
  });

  it('assigns 0.40 to unknown domains', () => {
    expect(classifyDomain('https://example.com/page')).toBe(0.40);
    expect(classifyDomain('https://random-blog.net/post')).toBe(0.40);
  });
});

// ---------------------------------------------------------------------------
// 11. URL normalization
// ---------------------------------------------------------------------------

describe('URL normalization', () => {
  it('strips utm tracking parameters', () => {
    const result = normalizeUrl(
      'https://example.com/page?utm_source=twitter&utm_medium=social&id=42',
    );
    expect(result).not.toContain('utm_source');
    expect(result).not.toContain('utm_medium');
    expect(result).toContain('id=42');
  });

  it('strips ref and source parameters', () => {
    const result = normalizeUrl('https://example.com/page?ref=abc&source=def');
    expect(result).not.toContain('ref=');
    expect(result).not.toContain('source=');
  });

  it('strips trailing slashes', () => {
    const result = normalizeUrl('https://example.com/page/');
    expect(result).toBe('https://example.com/page');
  });

  it('preserves root path trailing slash', () => {
    const result = normalizeUrl('https://example.com/');
    expect(result).toBe('https://example.com/');
  });
});

// ---------------------------------------------------------------------------
// 12. Embedded DOI in URL detection
// ---------------------------------------------------------------------------

describe('embedded DOI in URL', () => {
  it('detects doi.org URLs as embedded DOIs', () => {
    expect(hasEmbeddedDoi('https://doi.org/10.1016/j.sleep.2015.12.009')).toBe(true);
  });

  it('detects dx.doi.org URLs as embedded DOIs', () => {
    expect(hasEmbeddedDoi('https://dx.doi.org/10.1234/abc')).toBe(true);
  });

  it('does not flag non-DOI URLs', () => {
    expect(hasEmbeddedDoi('https://arxiv.org/abs/1234.5678')).toBe(false);
    expect(hasEmbeddedDoi('https://github.com/org/repo')).toBe(false);
  });

  it('extractUrls returns doi method for embedded DOI URLs', () => {
    const results = extractUrls(
      'See https://doi.org/10.1016/j.sleep.2015.12.009 for details.',
      'test.md',
    );
    expect(results).toHaveLength(1);
    expect(results[0].extraction_method).toBe('doi');
    expect(results[0].confidence).toBe(0.99);
    expect(results[0].text).toBe('10.1016/j.sleep.2015.12.009');
  });
});

// ---------------------------------------------------------------------------
// Integration: detectDois
// ---------------------------------------------------------------------------

describe('detectDois', () => {
  it('extracts and deduplicates DOIs from text', () => {
    const text = `
      Found doi: 10.1016/j.sleep.2015.12.009 and also
      https://doi.org/10.1016/j.sleep.2015.12.009 (same DOI).
      Another: doi: 10.5555/unique-one.
    `;
    const results = detectDois(text, 'test.md');
    expect(results).toHaveLength(2);
    expect(results.every(r => r.confidence === 0.99)).toBe(true);
    expect(results.every(r => r.extraction_method === 'doi')).toBe(true);
  });

  it('includes line numbers', () => {
    const text = 'Line one.\ndoi: 10.1234/test\nLine three.';
    const results = detectDois(text, 'test.md');
    expect(results).toHaveLength(1);
    expect(results[0].line_number).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Integration: extractUrls
// ---------------------------------------------------------------------------

describe('extractUrls', () => {
  it('classifies and normalizes URLs', () => {
    const text = 'Check https://arxiv.org/abs/2301.01234 and https://random-blog.com/post';
    const results = extractUrls(text, 'test.md');
    expect(results).toHaveLength(2);
    expect(results[0].confidence).toBe(0.70); // academic
    expect(results[1].confidence).toBe(0.40); // unknown
  });

  it('deduplicates URLs', () => {
    const text = 'https://example.com/page https://example.com/page';
    const results = extractUrls(text, 'test.md');
    expect(results).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// BASE_CONFIDENCE map completeness
// ---------------------------------------------------------------------------

describe('BASE_CONFIDENCE', () => {
  it('has entries for all documented methods', () => {
    expect(BASE_CONFIDENCE.get('doi')).toBe(0.99);
    expect(BASE_CONFIDENCE.get('isbn')).toBe(0.95);
    expect(BASE_CONFIDENCE.get('bibliography')).toBe(0.90);
    expect(BASE_CONFIDENCE.get('inline-apa')).toBe(0.85);
    expect(BASE_CONFIDENCE.get('inline-numbered')).toBe(0.85);
    expect(BASE_CONFIDENCE.get('narrative')).toBe(0.75);
    expect(BASE_CONFIDENCE.get('informal')).toBe(0.45);
    expect(BASE_CONFIDENCE.get('manual')).toBe(1.0);
  });
});
