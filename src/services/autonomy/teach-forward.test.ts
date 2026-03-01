/**
 * Tests for teach-forward extractor, injector, and chain verifier.
 *
 * Covers:
 * - extractSection: heading-based section extraction
 * - parseBulletPoints: bullet point parsing and stripping
 * - extractTeachForward: structured and fallback insight extraction
 * - writeTeachForward: file creation with metadata
 * - loadTeachForward: context injection loading
 * - verifyTeachForwardChain: gap detection across subversion range
 * - processJournal: full pipeline orchestration
 */

import { describe, it, expect, vi } from 'vitest';
import {
  extractSection,
  parseBulletPoints,
  extractTeachForward,
  writeTeachForward,
  loadTeachForward,
  verifyTeachForwardChain,
  processJournal,
  extractPhaseTeachForward,
  writePhaseTeachForward,
  loadPhaseTeachForward,
} from './teach-forward.js';
import type { ChainVerificationResult } from './teach-forward.js';

// ============================================================================
// extractSection
// ============================================================================

describe('extractSection', () => {
  it('should extract content between a heading and the next heading', () => {
    const content = '## Alpha\n\nAlpha content\n\n## Beta\n\nBeta content\n';
    const result = extractSection(content, 'Alpha');
    expect(result).toContain('Alpha content');
    expect(result).not.toContain('Beta content');
  });

  it('should extract content between heading and EOF', () => {
    const content = '## Alpha\n\nFirst section\n\n## Beta\n\nLast content here\n';
    const result = extractSection(content, 'Beta');
    expect(result).toContain('Last content here');
  });

  it('should be case-insensitive for heading match', () => {
    const content = '## Teach-Forward\n\n- insight one\n- insight two\n';
    const result = extractSection(content, 'teach-forward');
    expect(result).toContain('insight one');
  });

  it('should return empty string if heading not found', () => {
    const content = '## Alpha\n\nSome content\n';
    const result = extractSection(content, 'NonExistent');
    expect(result).toBe('');
  });

  it('should handle empty content', () => {
    expect(extractSection('', 'Any')).toBe('');
  });
});

// ============================================================================
// parseBulletPoints
// ============================================================================

describe('parseBulletPoints', () => {
  it('should parse lines starting with "- "', () => {
    const text = '- point one\n- point two\n- point three\n';
    const result = parseBulletPoints(text);
    expect(result).toEqual(['point one', 'point two', 'point three']);
  });

  it('should parse lines starting with "* "', () => {
    const text = '* alpha\n* beta\n';
    const result = parseBulletPoints(text);
    expect(result).toEqual(['alpha', 'beta']);
  });

  it('should handle leading whitespace before bullet', () => {
    const text = '  - indented point\n    * another\n';
    const result = parseBulletPoints(text);
    expect(result).toEqual(['indented point', 'another']);
  });

  it('should trim whitespace from each point', () => {
    const text = '-   spaces around   \n';
    const result = parseBulletPoints(text);
    expect(result).toEqual(['spaces around']);
  });

  it('should filter out empty bullet points', () => {
    const text = '- \n- content\n- \n';
    const result = parseBulletPoints(text);
    expect(result).toEqual(['content']);
  });

  it('should skip non-bullet lines', () => {
    const text = 'regular text\n- bullet\nmore text\n';
    const result = parseBulletPoints(text);
    expect(result).toEqual(['bullet']);
  });

  it('should return empty array for empty text', () => {
    expect(parseBulletPoints('')).toEqual([]);
  });
});

// ============================================================================
// extractTeachForward
// ============================================================================

describe('extractTeachForward', () => {
  it('should extract from ## Teach-Forward section when present', () => {
    const journal = `## Summary\n\nDid some work.\n\n## Teach-Forward\n\n- insight A\n- insight B\n- insight C\n`;
    const result = extractTeachForward(journal);
    expect(result).toEqual(['insight A', 'insight B', 'insight C']);
  });

  it('should limit to 5 insights from structured section', () => {
    const bullets = Array.from({ length: 8 }, (_, i) => `- insight ${i}`).join('\n');
    const journal = `## Teach-Forward\n\n${bullets}\n`;
    const result = extractTeachForward(journal);
    expect(result).toHaveLength(5);
  });

  it('should fall back to last 5 bullet points when no Teach-Forward section', () => {
    const journal = `## Notes\n\n- note 1\n- note 2\n- note 3\n- note 4\n- note 5\n- note 6\n- note 7\n`;
    const result = extractTeachForward(journal);
    expect(result).toHaveLength(5);
    expect(result[0]).toBe('note 3');
    expect(result[4]).toBe('note 7');
  });

  it('should return fewer than 5 when journal has fewer bullets', () => {
    const journal = `## Notes\n\n- only one\n`;
    const result = extractTeachForward(journal);
    expect(result).toEqual(['only one']);
  });

  it('should return empty array for empty journal', () => {
    expect(extractTeachForward('')).toEqual([]);
  });

  it('should return empty array for journal with no bullets', () => {
    const journal = '## Summary\n\nJust plain text with no bullet points.\n';
    expect(extractTeachForward(journal)).toEqual([]);
  });
});

// ============================================================================
// writeTeachForward
// ============================================================================

describe('writeTeachForward', () => {
  it('should write to correct path for next subversion', async () => {
    const writtenFiles: Record<string, string> = {};
    const writeFn = vi.fn().mockImplementation((path: string, content: string) => {
      writtenFiles[path] = content;
      return Promise.resolve();
    });

    await writeTeachForward('tf/', 5, ['insight A', 'insight B'], { writeFile: writeFn });

    expect(writeFn).toHaveBeenCalledTimes(1);
    const writtenPath = writeFn.mock.calls[0][0];
    expect(writtenPath).toContain('tf/');
    expect(writtenPath).toContain('6'); // to_subversion = 5+1
  });

  it('should include insights in written content', async () => {
    let writtenContent = '';
    const writeFn = vi.fn().mockImplementation((_: string, content: string) => {
      writtenContent = content;
      return Promise.resolve();
    });

    await writeTeachForward('tf/', 10, ['first insight', 'second insight'], { writeFile: writeFn });

    expect(writtenContent).toContain('first insight');
    expect(writtenContent).toContain('second insight');
  });

  it('should include metadata (from/to subversion, timestamp)', async () => {
    let writtenContent = '';
    const writeFn = vi.fn().mockImplementation((_: string, content: string) => {
      writtenContent = content;
      return Promise.resolve();
    });

    await writeTeachForward('tf/', 42, ['insight'], { writeFile: writeFn });

    expect(writtenContent).toContain('from_subversion: 42');
    expect(writtenContent).toContain('to_subversion: 43');
  });

  it('should return TeachForwardEntry', async () => {
    const writeFn = vi.fn().mockResolvedValue(undefined);
    const entry = await writeTeachForward('tf/', 7, ['insight'], { writeFile: writeFn });

    expect(entry.from_subversion).toBe(7);
    expect(entry.to_subversion).toBe(8);
    expect(entry.insights).toEqual(['insight']);
    expect(entry.extracted_at).toBeDefined();
  });
});

// ============================================================================
// loadTeachForward
// ============================================================================

describe('loadTeachForward', () => {
  it('should return formatted context block when file exists', async () => {
    const fileContent = `---\nfrom_subversion: 5\nto_subversion: 6\n---\n\n- insight A\n- insight B\n`;
    const readFn = vi.fn().mockResolvedValue(fileContent);

    const result = await loadTeachForward('tf/', 6, { readFile: readFn });

    expect(result).toContain('## Context from Prior Subversion');
    expect(result).toContain('insight A');
    expect(result).toContain('insight B');
    expect(result).toContain('---');
  });

  it('should return empty string when file does not exist', async () => {
    const readFn = vi.fn().mockRejectedValue(new Error('ENOENT'));

    const result = await loadTeachForward('tf/', 6, { readFile: readFn });
    expect(result).toBe('');
  });
});

// ============================================================================
// verifyTeachForwardChain
// ============================================================================

describe('verifyTeachForwardChain', () => {
  it('should report complete chain when all files exist', async () => {
    const existsFn = vi.fn().mockResolvedValue(true);

    const result = await verifyTeachForwardChain('tf/', 0, 5, { fileExists: existsFn });

    expect(result.complete).toBe(true);
    expect(result.gaps).toHaveLength(0);
    expect(result.found).toBe(5);
    expect(result.total).toBe(5);
  });

  it('should detect gaps where files are missing', async () => {
    const existsFn = vi.fn().mockImplementation((path: string) => {
      // Files for subversions 1, 2, 4, 5 exist; subversion 3 missing
      return Promise.resolve(!path.includes('/3.md'));
    });

    const result = await verifyTeachForwardChain('tf/', 0, 5, { fileExists: existsFn });

    expect(result.complete).toBe(false);
    expect(result.gaps).toContain(3);
    expect(result.found).toBe(4);
  });

  it('should handle range with all files missing', async () => {
    const existsFn = vi.fn().mockResolvedValue(false);

    const result = await verifyTeachForwardChain('tf/', 0, 3, { fileExists: existsFn });

    expect(result.complete).toBe(false);
    expect(result.gaps).toHaveLength(3);
    expect(result.found).toBe(0);
  });

  it('should handle empty range (from == to)', async () => {
    const existsFn = vi.fn();

    const result = await verifyTeachForwardChain('tf/', 5, 5, { fileExists: existsFn });

    expect(result.complete).toBe(true);
    expect(result.total).toBe(0);
    expect(result.gaps).toHaveLength(0);
  });
});

// ============================================================================
// processJournal
// ============================================================================

describe('processJournal', () => {
  it('should extract insights from journal and write teach-forward file', async () => {
    const journalContent = `## Summary\n\nWork done.\n\n## Teach-Forward\n\n- key insight\n- another insight\n`;
    const readFn = vi.fn().mockResolvedValue(journalContent);
    const writeFn = vi.fn().mockResolvedValue(undefined);

    const entry = await processJournal(
      'journals/journal-10.md',
      'tf/',
      10,
      { readFile: readFn, writeFile: writeFn }
    );

    expect(entry.from_subversion).toBe(10);
    expect(entry.to_subversion).toBe(11);
    expect(entry.insights).toContain('key insight');
    expect(writeFn).toHaveBeenCalledTimes(1);
  });

  it('should return empty insights for journal with no content', async () => {
    const readFn = vi.fn().mockResolvedValue('');
    const writeFn = vi.fn().mockResolvedValue(undefined);

    const entry = await processJournal('j.md', 'tf/', 5, { readFile: readFn, writeFile: writeFn });

    expect(entry.insights).toEqual([]);
  });

  it('should handle subversion 99 (writes to 100)', async () => {
    const journal = `## Teach-Forward\n\n- final insight\n`;
    const readFn = vi.fn().mockResolvedValue(journal);
    const writeFn = vi.fn().mockResolvedValue(undefined);

    const entry = await processJournal('j.md', 'tf/', 99, { readFile: readFn, writeFile: writeFn });

    expect(entry.to_subversion).toBe(100);
  });
});

// ============================================================================
// Phase-level teach-forward
// ============================================================================

describe('phase-level teach-forward', () => {
  // --------------------------------------------------------------------------
  // extractPhaseTeachForward
  // --------------------------------------------------------------------------

  describe('extractPhaseTeachForward', () => {
    it('should extract from Key Findings section when present', () => {
      const summary = [
        '# Phase 508 Summary',
        '',
        '## Key Findings',
        '',
        '- finding one',
        '- finding two',
        '- finding three',
        '',
        '## Other Section',
        '',
        '- other stuff',
      ].join('\n');

      const result = extractPhaseTeachForward(summary);
      expect(result).toEqual(['finding one', 'finding two', 'finding three']);
    });

    it('should fall back to Accomplishments when no Key Findings', () => {
      const summary = [
        '# Phase 508 Summary',
        '',
        '## Accomplishments',
        '',
        '- accomplished A',
        '- accomplished B',
        '',
        '## Notes',
        '',
        '- note 1',
      ].join('\n');

      const result = extractPhaseTeachForward(summary);
      expect(result).toEqual(['accomplished A', 'accomplished B']);
    });

    it('should fall back to What Was Built when no Key Findings or Accomplishments', () => {
      const summary = [
        '# Phase 508 Summary',
        '',
        '## What Was Built',
        '',
        '- built X',
        '- built Y',
        '- built Z',
        '',
      ].join('\n');

      const result = extractPhaseTeachForward(summary);
      expect(result).toEqual(['built X', 'built Y', 'built Z']);
    });

    it('should fall back to last 5 bullets from entire doc when no structured section', () => {
      const summary = [
        '# Phase 508 Summary',
        '',
        'Some text.',
        '',
        '- bullet 1',
        '- bullet 2',
        '- bullet 3',
        '- bullet 4',
        '- bullet 5',
        '- bullet 6',
        '- bullet 7',
      ].join('\n');

      const result = extractPhaseTeachForward(summary);
      expect(result).toHaveLength(5);
      expect(result[0]).toBe('bullet 3');
      expect(result[4]).toBe('bullet 7');
    });

    it('should limit to 5 insights from Key Findings with 8 bullets', () => {
      const bullets = Array.from({ length: 8 }, (_, i) => `- finding ${i + 1}`).join('\n');
      const summary = `## Key Findings\n\n${bullets}\n`;

      const result = extractPhaseTeachForward(summary);
      expect(result).toHaveLength(5);
      expect(result[0]).toBe('finding 1');
      expect(result[4]).toBe('finding 5');
    });

    it('should return empty array for empty content', () => {
      expect(extractPhaseTeachForward('')).toEqual([]);
    });
  });

  // --------------------------------------------------------------------------
  // writePhaseTeachForward
  // --------------------------------------------------------------------------

  describe('writePhaseTeachForward', () => {
    it('should write file to {toPhase}-TEACH-FORWARD.md', async () => {
      const writeFn = vi.fn().mockResolvedValue(undefined);
      await writePhaseTeachForward('.planning/phases', 508, ['insight A'], { writeFile: writeFn });

      expect(writeFn).toHaveBeenCalledTimes(1);
      const writtenPath = writeFn.mock.calls[0][0];
      expect(writtenPath).toBe('.planning/phases/509-TEACH-FORWARD.md');
    });

    it('should produce YAML frontmatter with from_phase, to_phase, extracted_at', async () => {
      let writtenContent = '';
      const writeFn = vi.fn().mockImplementation((_: string, content: string) => {
        writtenContent = content;
        return Promise.resolve();
      });

      await writePhaseTeachForward('.planning/phases', 508, ['insight'], { writeFile: writeFn });

      expect(writtenContent).toContain('from_phase: 508');
      expect(writtenContent).toContain('to_phase: 509');
      expect(writtenContent).toContain('extracted_at:');
      expect(writtenContent).toMatch(/^---\n/);
      expect(writtenContent).toMatch(/\n---\n/);
    });

    it('should include bullet list of insights in body', async () => {
      let writtenContent = '';
      const writeFn = vi.fn().mockImplementation((_: string, content: string) => {
        writtenContent = content;
        return Promise.resolve();
      });

      await writePhaseTeachForward('.planning/phases', 508, ['insight A', 'insight B'], { writeFile: writeFn });

      expect(writtenContent).toContain('- insight A');
      expect(writtenContent).toContain('- insight B');
    });

    it('should return result with from_phase, to_phase, insights, extracted_at', async () => {
      const writeFn = vi.fn().mockResolvedValue(undefined);
      const result = await writePhaseTeachForward('.planning/phases', 508, ['insight'], { writeFile: writeFn });

      expect(result.from_phase).toBe(508);
      expect(result.to_phase).toBe(509);
      expect(result.insights).toEqual(['insight']);
      expect(result.extracted_at).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // loadPhaseTeachForward
  // --------------------------------------------------------------------------

  describe('loadPhaseTeachForward', () => {
    it('should read and format context block with "Context from Prior Phase" heading', async () => {
      const fileContent = [
        '---',
        'from_phase: 507',
        'to_phase: 508',
        'extracted_at: "2026-03-01T12:00:00Z"',
        '---',
        '',
        '- insight from phase 507',
        '- another insight',
        '',
      ].join('\n');
      const readFn = vi.fn().mockResolvedValue(fileContent);

      const result = await loadPhaseTeachForward('.planning/phases', 508, { readFile: readFn });

      expect(result).toContain('## Context from Prior Phase');
      expect(result).toContain('insight from phase 507');
      expect(result).toContain('another insight');
      expect(result).toContain('---');
    });

    it('should return empty string when file does not exist', async () => {
      const readFn = vi.fn().mockRejectedValue(new Error('ENOENT'));

      const result = await loadPhaseTeachForward('.planning/phases', 508, { readFile: readFn });
      expect(result).toBe('');
    });
  });
});
