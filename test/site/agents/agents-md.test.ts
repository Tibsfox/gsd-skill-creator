import { describe, it, expect } from 'vitest';
import { generateAgentsMd } from '../../../src/site/agents/agents-md';
import type { ContentPage, SiteConfig } from '../../../src/site/types';

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
    rawMarkdown: '# content',
    sourcePath: 'test.md',
    outputPath: 'test/index.html',
    url: '/test/',
    slug: 'test',
    toc: [],
    wordCount: 100,
    ...overrides,
  };
}

describe('generateAgentsMd', () => {
  const site = makeSite();

  it('contains site title and description', () => {
    const result = generateAgentsMd([], site);

    expect(result).toContain('# Test Site');
    expect(result).toContain('Educational resources and open knowledge');
  });

  it('lists content sections with page counts', () => {
    const pages: ContentPage[] = [
      makePage({ frontmatter: { title: 'A', nav_section: 'foundations' }, url: '/foundations/a/' }),
      makePage({ frontmatter: { title: 'B', nav_section: 'foundations' }, url: '/foundations/b/' }),
      makePage({ frontmatter: { title: 'C', nav_section: 'essays' }, url: '/essays/c/' }),
    ];
    const result = generateAgentsMd(pages, site);

    expect(result).toContain('foundations');
    expect(result).toContain('2 pages');
    expect(result).toContain('essays');
    expect(result).toContain('1 page');
  });

  it('lists top 10 key resources by priority', () => {
    const pages: ContentPage[] = Array.from({ length: 15 }, (_, i) =>
      makePage({
        frontmatter: {
          title: `Page ${i + 1}`,
          agent_priority: i < 5 ? 'high' : 'medium',
          nav_section: 'docs',
        },
        url: `/docs/page-${i + 1}/`,
      }),
    );
    const result = generateAgentsMd(pages, site);

    // Should list key resources section with top entries
    expect(result).toContain('## Key resources');
    // High priority pages should be listed
    expect(result).toContain('Page 1');
    expect(result).toContain('Page 5');
  });

  it('includes citation guidance', () => {
    const result = generateAgentsMd([], site);

    expect(result).toContain('## Citation guidance');
    expect(result).toContain('https://example.com');
  });

  it('includes usage instructions', () => {
    const result = generateAgentsMd([], site);

    expect(result).toContain('## How to use this site');
    expect(result).toContain('llms.txt');
    expect(result).toContain('llms-full.txt');
  });
});
