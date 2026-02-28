import { describe, it, expect } from 'vitest';
import { generateLlmsTxt } from '../../../../src/integrations/site/agents/llms-txt';
import type { ContentPage, SiteConfig } from '../../../../src/integrations/site/types';

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

describe('generateLlmsTxt', () => {
  const site = makeSite();

  it('generates header with site title and description', () => {
    const pages: ContentPage[] = [];
    const result = generateLlmsTxt(pages, site);

    expect(result).toContain('# Test Site');
    expect(result).toContain('> Educational resources and open knowledge');
  });

  it('filters out pages with agent_visible: false', () => {
    const pages: ContentPage[] = [
      makePage({
        frontmatter: { title: 'Visible', nav_section: 'docs' },
      }),
      makePage({
        frontmatter: { title: 'Hidden', agent_visible: false, nav_section: 'docs' },
      }),
    ];
    const result = generateLlmsTxt(pages, site);

    expect(result).toContain('Visible');
    expect(result).not.toContain('Hidden');
  });

  it('groups pages by nav_section', () => {
    const pages: ContentPage[] = [
      makePage({
        frontmatter: { title: 'Page A', nav_section: 'foundations' },
        url: '/foundations/a/',
      }),
      makePage({
        frontmatter: { title: 'Page B', nav_section: 'essays' },
        url: '/essays/b/',
      }),
    ];
    const result = generateLlmsTxt(pages, site);

    expect(result).toContain('## Foundations');
    expect(result).toContain('## Essays');
  });

  it('sorts by agent_priority high first, then medium, then low', () => {
    const pages: ContentPage[] = [
      makePage({
        frontmatter: { title: 'Low Page', agent_priority: 'low', nav_section: 'docs' },
        url: '/docs/low/',
      }),
      makePage({
        frontmatter: { title: 'High Page', agent_priority: 'high', nav_section: 'docs' },
        url: '/docs/high/',
      }),
      makePage({
        frontmatter: { title: 'Med Page', agent_priority: 'medium', nav_section: 'docs' },
        url: '/docs/med/',
      }),
    ];
    const result = generateLlmsTxt(pages, site);

    const highIdx = result.indexOf('High Page');
    const medIdx = result.indexOf('Med Page');
    const lowIdx = result.indexOf('Low Page');
    expect(highIdx).toBeLessThan(medIdx);
    expect(medIdx).toBeLessThan(lowIdx);
  });

  it('truncates description to 100 characters', () => {
    const longDesc = 'A'.repeat(150);
    const pages: ContentPage[] = [
      makePage({
        frontmatter: { title: 'Long Desc', description: longDesc, nav_section: 'docs' },
        url: '/docs/long/',
      }),
    ];
    const result = generateLlmsTxt(pages, site);

    // Should contain truncated description (100 chars + ellipsis)
    expect(result).not.toContain(longDesc);
    expect(result).toContain('A'.repeat(100));
  });

  it('generates absolute URLs by prepending site.url', () => {
    const pages: ContentPage[] = [
      makePage({
        frontmatter: { title: 'My Page', nav_section: 'docs' },
        url: '/docs/my-page/',
      }),
    ];
    const result = generateLlmsTxt(pages, site);

    expect(result).toContain('https://example.com/docs/my-page/');
  });

  it('returns minimal output for empty pages', () => {
    const result = generateLlmsTxt([], site);

    expect(result).toContain('# Test Site');
    expect(result).toContain('> Educational resources');
    // No section headings
    expect(result).not.toContain('## ');
  });

  it('groups pages without nav_section as "Other"', () => {
    const pages: ContentPage[] = [
      makePage({
        frontmatter: { title: 'Orphan Page' },
        url: '/orphan/',
      }),
    ];
    const result = generateLlmsTxt(pages, site);

    expect(result).toContain('## Other');
    expect(result).toContain('Orphan Page');
  });
});
