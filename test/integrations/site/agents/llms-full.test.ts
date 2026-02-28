import { describe, it, expect } from 'vitest';
import { generateLlmsFullTxt } from '../../../../src/site/agents/llms-full';
import type { ContentPage, SiteConfig } from '../../../../src/site/types';

function makeSite(overrides: Partial<SiteConfig> = {}): SiteConfig {
  return {
    title: 'Test Site',
    description: 'Educational resources and open knowledge',
    url: 'https://example.com',
    author: 'Foxy',
    language: 'en',
    buildDate: '2026-02-27',
    agent: {
      llms_txt: true,
      llms_full: true,
      agents_md: true,
      schema_org: true,
      markdown_mirror: true,
    },
    ...overrides,
  };
}

function makePage(overrides: Partial<ContentPage> & { frontmatter: ContentPage['frontmatter'] }): ContentPage {
  return {
    content: '<p>html</p>',
    rawMarkdown: '# content\n\nSome paragraph text here.',
    sourcePath: 'test.md',
    outputPath: 'test/index.html',
    url: '/test/',
    slug: 'test',
    toc: [],
    wordCount: 100,
    ...overrides,
  };
}

describe('generateLlmsFullTxt', () => {
  const site = makeSite();

  it('contains full raw markdown for each page', () => {
    const pages: ContentPage[] = [
      makePage({
        frontmatter: { title: 'Full Page' },
        rawMarkdown: '# Full Page\n\nThis is the complete content.',
        url: '/full/',
      }),
    ];
    const result = generateLlmsFullTxt(pages, site);

    expect(result.content).toContain('This is the complete content.');
  });

  it('strips frontmatter from raw content (uses rawMarkdown as-is)', () => {
    const pages: ContentPage[] = [
      makePage({
        frontmatter: { title: 'No FM' },
        rawMarkdown: 'Just the body, no frontmatter.',
        url: '/clean/',
      }),
    ];
    const result = generateLlmsFullTxt(pages, site);

    // rawMarkdown should already have frontmatter stripped by the parser
    expect(result.content).toContain('Just the body, no frontmatter.');
    expect(result.content).not.toContain('---\ntitle:');
  });

  it('includes page delimiters between entries', () => {
    const pages: ContentPage[] = [
      makePage({
        frontmatter: { title: 'Page One' },
        url: '/one/',
      }),
      makePage({
        frontmatter: { title: 'Page Two' },
        url: '/two/',
      }),
    ];
    const result = generateLlmsFullTxt(pages, site);

    // Delimiter between pages
    expect(result.content).toContain('---');
    const delimiterCount = (result.content.match(/^---$/gm) || []).length;
    expect(delimiterCount).toBeGreaterThanOrEqual(2);
  });

  it('includes header with page count and build date', () => {
    const pages: ContentPage[] = [
      makePage({ frontmatter: { title: 'A' }, url: '/a/' }),
      makePage({ frontmatter: { title: 'B' }, url: '/b/' }),
    ];
    const result = generateLlmsFullTxt(pages, site);

    expect(result.content).toContain('Test Site');
    expect(result.content).toContain('Total pages: 2');
    expect(result.content).toContain('2026-02-27');
  });

  it('returns sizeWarning true when content exceeds 500KB', () => {
    const bigContent = 'X'.repeat(600_000);
    const pages: ContentPage[] = [
      makePage({
        frontmatter: { title: 'Big Page' },
        rawMarkdown: bigContent,
        url: '/big/',
      }),
    ];
    const result = generateLlmsFullTxt(pages, site);

    expect(result.sizeWarning).toBe(true);
  });

  it('applies same filtering as llms.txt (agent_visible)', () => {
    const pages: ContentPage[] = [
      makePage({
        frontmatter: { title: 'Visible', nav_section: 'docs' },
        url: '/docs/visible/',
      }),
      makePage({
        frontmatter: { title: 'Hidden', agent_visible: false, nav_section: 'docs' },
        url: '/docs/hidden/',
      }),
    ];
    const result = generateLlmsFullTxt(pages, site);

    expect(result.content).toContain('Visible');
    expect(result.content).not.toContain('Hidden');
  });
});
