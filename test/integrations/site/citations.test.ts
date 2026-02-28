import { describe, it, expect } from 'vitest';
import {
  resolveCitations,
  generateBibliography,
  formatCitation,
} from '../../../src/site/citations';
import type { CitationDatabase, CitationEntry } from '../../../src/site/types';

const sampleDb: CitationDatabase = {
  knuth1997: {
    type: 'book',
    authors: ['Donald E. Knuth'],
    title: 'The Art of Computer Programming',
    year: 1997,
    publisher: 'Addison-Wesley',
    volume: '1',
    isbn: '0-201-89683-4',
  },
  turing1950: {
    type: 'article',
    authors: ['Alan M. Turing'],
    title: 'Computing Machinery and Intelligence',
    year: 1950,
    journal: 'Mind',
    volume: '59',
    pages: '433-460',
    doi: '10.1093/mind/LIX.236.433',
  },
  dijkstra1968: {
    type: 'article',
    authors: ['Edsger W. Dijkstra'],
    title: 'Go To Statement Considered Harmful',
    year: 1968,
    journal: 'Communications of the ACM',
    volume: '11',
    pages: '147-148',
    doi: '10.1145/362929.362947',
  },
  lamport1978: {
    type: 'article',
    authors: ['Leslie Lamport'],
    title: 'Time, Clocks, and the Ordering of Events in a Distributed System',
    year: 1978,
    journal: 'Communications of the ACM',
    volume: '21',
    pages: '558-565',
  },
};

describe('Citation Resolver', () => {
  describe('resolveCitations', () => {
    it('resolves single citation [@key] to numbered superscript', () => {
      const result = resolveCitations('See [@knuth1997].', sampleDb);
      expect(result.markdown).toContain('<sup class="cite">');
      expect(result.markdown).toContain('href="/bibliography/#knuth1997"');
      expect(result.markdown).toContain('[1]');
      expect(result.citations).toHaveLength(1);
      expect(result.citations[0].key).toBe('knuth1997');
      expect(result.citations[0].number).toBe(1);
    });

    it('resolves multiple citations [@a; @b] to grouped references', () => {
      const result = resolveCitations('Research [@knuth1997; @turing1950] shows...', sampleDb);
      expect(result.markdown).toContain('<sup class="cite">');
      expect(result.markdown).toContain('[1]');
      expect(result.markdown).toContain('[2]');
      expect(result.markdown).toContain('href="/bibliography/#knuth1997"');
      expect(result.markdown).toContain('href="/bibliography/#turing1950"');
      expect(result.citations).toHaveLength(2);
    });

    it('assigns sequential numbers across the page', () => {
      const md = 'First [@knuth1997]. Second [@turing1950]. Third [@dijkstra1968].';
      const result = resolveCitations(md, sampleDb);
      expect(result.citations[0]).toMatchObject({ key: 'knuth1997', number: 1 });
      expect(result.citations[1]).toMatchObject({ key: 'turing1950', number: 2 });
      expect(result.citations[2]).toMatchObject({ key: 'dijkstra1968', number: 3 });
    });

    it('reuses the same number for repeated citation keys', () => {
      const md = 'First [@knuth1997]. Then [@turing1950]. Again [@knuth1997].';
      const result = resolveCitations(md, sampleDb);
      // knuth1997 should be 1 both times, turing1950 should be 2
      const knuthCites = result.citations.filter((c) => c.key === 'knuth1997');
      expect(knuthCites).toHaveLength(1); // deduplicated
      expect(knuthCites[0].number).toBe(1);
      expect(result.citations.find((c) => c.key === 'turing1950')?.number).toBe(2);
      // Both occurrences in the markdown should use [1]
      const matches = result.markdown.match(/\[1\]/g);
      expect(matches?.length).toBeGreaterThanOrEqual(2);
    });

    it('marks missing keys as unresolved with warning', () => {
      const result = resolveCitations('See [@nonexistent].', sampleDb);
      expect(result.markdown).toContain('cite-unresolved');
      expect(result.markdown).toContain('[nonexistent]');
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('nonexistent');
    });

    it('marks all citations unresolved when no DB provided', () => {
      const result = resolveCitations('See [@knuth1997].', null);
      expect(result.markdown).toContain('cite-unresolved');
      expect(result.warnings.length).toBeGreaterThanOrEqual(1);
    });

    it('returns unchanged markdown when no citations present', () => {
      const md = 'Just plain text without any citations.';
      const result = resolveCitations(md, sampleDb);
      expect(result.markdown).toBe(md);
      expect(result.citations).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('handles citation keys with special characters', () => {
      const db: CitationDatabase = {
        'smith-jones_2024': {
          type: 'article',
          authors: ['Smith', 'Jones'],
          title: 'A Study',
          year: 2024,
          journal: 'Test Journal',
        },
      };
      const result = resolveCitations('See [@smith-jones_2024].', db);
      expect(result.markdown).toContain('href="/bibliography/#smith-jones_2024"');
      expect(result.citations).toHaveLength(1);
    });
  });

  describe('generateBibliography', () => {
    it('sorts entries alphabetically by first author', () => {
      const { citations } = resolveCitations(
        '[@turing1950] and [@dijkstra1968] and [@knuth1997]',
        sampleDb,
      );
      const bib = generateBibliography(citations, sampleDb);
      // Alphabetical: Dijkstra, Donald (Knuth), Turing -> no, by last name: D, K, T
      expect(bib[0].key).toBe('dijkstra1968');
      expect(bib[1].key).toBe('knuth1997');
      expect(bib[2].key).toBe('turing1950');
    });

    it('includes DOI link when present', () => {
      const { citations } = resolveCitations('[@turing1950]', sampleDb);
      const bib = generateBibliography(citations, sampleDb);
      expect(bib[0].doi).toBe('10.1093/mind/LIX.236.433');
    });
  });

  describe('formatCitation', () => {
    it('formats a book in Chicago-adjacent style', () => {
      const formatted = formatCitation(sampleDb['knuth1997']);
      expect(formatted).toContain('Knuth');
      expect(formatted).toContain('The Art of Computer Programming');
      expect(formatted).toContain('1997');
      expect(formatted).toContain('Addison-Wesley');
    });

    it('formats an article in Chicago-adjacent style', () => {
      const formatted = formatCitation(sampleDb['turing1950']);
      expect(formatted).toContain('Turing');
      expect(formatted).toContain('Computing Machinery and Intelligence');
      expect(formatted).toContain('Mind');
      expect(formatted).toContain('1950');
      expect(formatted).toContain('59');
    });
  });
});
