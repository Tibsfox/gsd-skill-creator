import { describe, it, expect } from 'vitest';
import { buildSearchIndex, stripMarkdownSyntax } from '../../../src/integrations/site/search';
import type { ContentPage, SearchEntry } from '../../../src/integrations/site/types';

function makePage(overrides: Partial<ContentPage> = {}): ContentPage {
  return {
    frontmatter: {
      title: 'Test Page',
      description: 'A test page for the search index',
      tags: ['testing', 'search'],
      draft: false,
    },
    content: '<p>Rendered HTML</p>',
    rawMarkdown: 'Some **bold** markdown content with [a link](http://example.com).',
    sourcePath: 'content/test.md',
    outputPath: 'build/test/index.html',
    url: '/test/',
    slug: 'test',
    toc: [],
    wordCount: 7,
    ...overrides,
  };
}

describe('Search Index Builder', () => {
  describe('buildSearchIndex', () => {
    it('creates an entry for each non-draft page', () => {
      const pages = [makePage(), makePage({ url: '/about/', slug: 'about' })];
      const index = buildSearchIndex(pages);
      expect(index).toHaveLength(2);
    });

    it('uses compressed keys (t, d, u, g, x)', () => {
      const index = buildSearchIndex([makePage()]);
      const entry = index[0];
      expect(entry).toHaveProperty('t');
      expect(entry).toHaveProperty('d');
      expect(entry).toHaveProperty('u');
      expect(entry).toHaveProperty('g');
      expect(entry).toHaveProperty('x');
      // Must not have uncompressed keys
      expect(entry).not.toHaveProperty('title');
      expect(entry).not.toHaveProperty('description');
      expect(entry).not.toHaveProperty('url');
    });

    it('truncates description to 160 characters', () => {
      const longDesc = 'A'.repeat(200);
      const page = makePage({
        frontmatter: {
          title: 'Long Desc',
          description: longDesc,
          tags: [],
        },
      });
      const index = buildSearchIndex([page]);
      expect(index[0].d.length).toBeLessThanOrEqual(160);
    });

    it('generates excerpt from first 200 words of raw markdown', () => {
      const words = Array.from({ length: 250 }, (_, i) => `word${i}`).join(' ');
      const page = makePage({ rawMarkdown: words });
      const index = buildSearchIndex([page]);
      const excerptWords = index[0].x.split(/\s+/);
      expect(excerptWords.length).toBeLessThanOrEqual(200);
    });

    it('strips markdown syntax from excerpt', () => {
      const md = '# Heading\n\nSome **bold** and *italic* text with `code` and [link](http://x.com).';
      const page = makePage({ rawMarkdown: md });
      const index = buildSearchIndex([page]);
      expect(index[0].x).not.toContain('#');
      expect(index[0].x).not.toContain('**');
      expect(index[0].x).not.toContain('*');
      expect(index[0].x).not.toContain('`');
      expect(index[0].x).not.toContain('[');
      expect(index[0].x).not.toContain('](');
    });

    it('returns empty index for empty pages array', () => {
      const index = buildSearchIndex([]);
      expect(index).toEqual([]);
    });

    it('excludes draft pages', () => {
      const draft = makePage({
        frontmatter: { title: 'Draft', draft: true },
        url: '/draft/',
      });
      const published = makePage({ url: '/published/' });
      const index = buildSearchIndex([draft, published]);
      expect(index).toHaveLength(1);
      expect(index[0].u).toBe('/published/');
    });

    it('serializes to valid JSON', () => {
      const pages = [makePage(), makePage({ url: '/two/', slug: 'two' })];
      const index = buildSearchIndex(pages);
      const json = JSON.stringify(index);
      const parsed = JSON.parse(json);
      expect(parsed).toEqual(index);
    });

    it('produces reasonable size per entry (< 250 bytes average)', () => {
      const pages = Array.from({ length: 10 }, (_, i) =>
        makePage({
          url: `/page-${i}/`,
          slug: `page-${i}`,
          rawMarkdown: 'Short content for size test.',
        }),
      );
      const index = buildSearchIndex(pages);
      const json = JSON.stringify(index);
      const avgBytes = json.length / index.length;
      expect(avgBytes).toBeLessThan(250);
    });
  });

  describe('stripMarkdownSyntax', () => {
    it('removes headings, links, code, and emphasis', () => {
      const md = '# Title\n\n## Subtitle\n\nSome **bold** and *italic* with `code` and [link](http://x.com).';
      const result = stripMarkdownSyntax(md);
      expect(result).not.toContain('#');
      expect(result).not.toContain('**');
      expect(result).not.toContain('`');
      expect(result).not.toContain('[link]');
      expect(result).not.toContain('](');
      expect(result).toContain('Title');
      expect(result).toContain('bold');
      expect(result).toContain('italic');
      expect(result).toContain('code');
      expect(result).toContain('link');
    });
  });
});
