import { describe, it, expect } from 'vitest';
import { generateSchemaOrg } from '../../../src/site/agents/schema-org';
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

describe('generateSchemaOrg', () => {
  const site = makeSite();

  it('generates Article schema with required fields', () => {
    const page = makePage({
      frontmatter: {
        title: 'My Article',
        description: 'An article about things',
        schema_type: 'Article',
        date: '2026-01-15',
        author: 'Foxy',
      },
      url: '/articles/my-article/',
    });
    const parsed = JSON.parse(generateSchemaOrg(page, site));
    const result = Array.isArray(parsed) ? parsed[0] : parsed;

    expect(result['@context']).toBe('https://schema.org');
    expect(result['@type']).toBe('Article');
    expect(result.headline).toBe('My Article');
    expect(result.description).toBe('An article about things');
    expect(result.datePublished).toBe('2026-01-15');
    expect(result.author).toBeDefined();
  });

  it('generates TechArticle schema with proficiencyLevel', () => {
    const page = makePage({
      frontmatter: {
        title: 'Advanced Circuit Design',
        schema_type: 'TechArticle',
        date: '2026-02-01',
      },
      url: '/tech/circuits/',
    });
    const parsed = JSON.parse(generateSchemaOrg(page, site));
    const result = Array.isArray(parsed) ? parsed[0] : parsed;

    expect(result['@type']).toBe('TechArticle');
    expect(result).toHaveProperty('proficiencyLevel');
  });

  it('generates Book schema', () => {
    const page = makePage({
      frontmatter: {
        title: 'Electronics Handbook',
        schema_type: 'Book',
        date: '2025-06-01',
        author: 'Foxy',
      },
      url: '/books/electronics/',
    });
    const parsed = JSON.parse(generateSchemaOrg(page, site));
    const result = Array.isArray(parsed) ? parsed[0] : parsed;

    expect(result['@type']).toBe('Book');
    expect(result.name).toBe('Electronics Handbook');
    expect(result.datePublished).toBe('2025-06-01');
  });

  it('generates Course schema with provider', () => {
    const page = makePage({
      frontmatter: {
        title: 'Intro to Circuits',
        description: 'Learn circuit basics',
        schema_type: 'Course',
      },
      url: '/courses/intro-circuits/',
    });
    const parsed = JSON.parse(generateSchemaOrg(page, site));
    const result = Array.isArray(parsed) ? parsed[0] : parsed;

    expect(result['@type']).toBe('Course');
    expect(result.name).toBe('Intro to Circuits');
    expect(result.description).toBe('Learn circuit basics');
    expect(result.provider).toBeDefined();
  });

  it('generates WebSite schema with SearchAction', () => {
    const page = makePage({
      frontmatter: {
        title: 'Test Site',
        schema_type: 'WebSite',
      },
      url: '/',
    });
    const parsed = JSON.parse(generateSchemaOrg(page, site));
    const result = Array.isArray(parsed) ? parsed[0] : parsed;

    expect(result['@type']).toBe('WebSite');
    expect(result.name).toBe('Test Site');
    expect(result.url).toBe('https://example.com');
    expect(result.potentialAction).toBeDefined();
    expect(result.potentialAction['@type']).toBe('SearchAction');
  });

  it('defaults to WebPage schema', () => {
    const page = makePage({
      frontmatter: { title: 'Some Page' },
      url: '/some-page/',
    });
    const parsed = JSON.parse(generateSchemaOrg(page, site));
    const result = Array.isArray(parsed) ? parsed[0] : parsed;

    expect(result['@type']).toBe('WebPage');
    expect(result.name).toBe('Some Page');
    expect(result.url).toBe('https://example.com/some-page/');
  });

  it('includes BreadcrumbList from URL path', () => {
    const page = makePage({
      frontmatter: { title: 'Deep Page' },
      url: '/foundations/electronics/resistors/',
    });
    const result = JSON.parse(generateSchemaOrg(page, site));

    // Should be an array with the main schema + BreadcrumbList
    // or the result itself is an array
    const jsonLd = Array.isArray(result) ? result : [result];
    const breadcrumb = jsonLd.find((item: Record<string, unknown>) => item['@type'] === 'BreadcrumbList');
    expect(breadcrumb).toBeDefined();
    expect(breadcrumb.itemListElement).toBeDefined();
    expect(breadcrumb.itemListElement.length).toBeGreaterThanOrEqual(2);
  });

  it('produces valid JSON output', () => {
    const page = makePage({
      frontmatter: {
        title: 'Valid JSON Test',
        description: 'Testing "quotes" and <special> chars & more',
        schema_type: 'Article',
        date: '2026-01-01',
      },
      url: '/test/',
    });
    const jsonStr = generateSchemaOrg(page, site);

    // Must not throw
    const parsed = JSON.parse(jsonStr);
    expect(parsed).toBeDefined();

    // Re-stringify must match (no data loss)
    const reparsed = JSON.parse(JSON.stringify(parsed));
    expect(reparsed).toEqual(parsed);
  });
});
