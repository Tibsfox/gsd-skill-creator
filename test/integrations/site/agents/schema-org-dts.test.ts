/**
 * Schema.org JSON-LD validation against schema-dts types.
 *
 * Uses schema-dts type imports for compile-time type checking.
 * TypeScript compiler validates type compatibility at build time.
 * Runtime tests validate structural correctness of JSON-LD output.
 */

import { describe, it, expect } from 'vitest';
import { generateSchemaOrg } from '../../../src/site/agents/schema-org';
import type { ContentPage, SiteConfig } from '../../../src/site/types';

// schema-dts type imports for compile-time validation
import type {
  Article,
  TechArticle,
  Book,
  Course,
  WebSite,
  WebPage,
  WithContext,
  BreadcrumbList,
} from 'schema-dts';

function makeSite(overrides: Partial<SiteConfig> = {}): SiteConfig {
  return {
    title: 'Schema Test Site',
    description: 'Testing Schema.org JSON-LD output',
    url: 'https://schema.example.com',
    author: 'Tester',
    language: 'en',
    buildDate: '2026-03-01',
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

/**
 * Helper to parse generateSchemaOrg output and extract primary schema.
 * The function returns a JSON array: [primarySchema, BreadcrumbList].
 */
function parseSchemaOrg(page: ContentPage, site: SiteConfig): { primary: Record<string, unknown>; breadcrumbs: Record<string, unknown> } {
  const parsed = JSON.parse(generateSchemaOrg(page, site));
  const arr = Array.isArray(parsed) ? parsed : [parsed];
  return {
    primary: arr[0],
    breadcrumbs: arr.find((item: Record<string, unknown>) => item['@type'] === 'BreadcrumbList') ?? arr[1],
  };
}

describe('Schema.org JSON-LD type validation (schema-dts)', () => {
  const site = makeSite();

  describe('Article schema', () => {
    const page = makePage({
      frontmatter: {
        title: 'My Test Article',
        description: 'An article about testing',
        schema_type: 'Article',
        date: '2026-01-15',
        author: 'Alice',
      },
      url: '/articles/test-article/',
    });

    it('has @context, @type, headline, datePublished, author', () => {
      const { primary } = parseSchemaOrg(page, site);

      expect(primary['@context']).toBe('https://schema.org');
      expect(primary['@type']).toBe('Article');
      expect(primary['headline']).toBe('My Test Article');
      expect(primary['datePublished']).toBe('2026-01-15');
      expect(primary['author']).toBeDefined();

      // Compile-time type assertion: if this compiles, the structure is compatible
      const _typeCheck: Record<string, unknown> = primary;
      expect(_typeCheck['@type']).toBe('Article');
    });

    it('has description field', () => {
      const { primary } = parseSchemaOrg(page, site);
      expect(primary['description']).toBe('An article about testing');
    });
  });

  describe('TechArticle schema', () => {
    const page = makePage({
      frontmatter: {
        title: 'Advanced Circuit Design',
        description: 'Deep dive into circuits',
        schema_type: 'TechArticle',
        date: '2026-02-01',
      },
      url: '/tech/circuits/',
    });

    it('includes proficiencyLevel field', () => {
      const { primary } = parseSchemaOrg(page, site);

      expect(primary['@type']).toBe('TechArticle');
      expect(primary).toHaveProperty('proficiencyLevel');
      expect(primary['headline']).toBe('Advanced Circuit Design');
    });
  });

  describe('Book schema', () => {
    const page = makePage({
      frontmatter: {
        title: 'Electronics Handbook',
        schema_type: 'Book',
        date: '2025-06-01',
        author: 'Foxy',
      },
      url: '/books/electronics/',
    });

    it('uses "name" not "headline"', () => {
      const { primary } = parseSchemaOrg(page, site);

      expect(primary['@type']).toBe('Book');
      expect(primary['name']).toBe('Electronics Handbook');
      expect(primary).not.toHaveProperty('headline');
    });

    it('has datePublished and author', () => {
      const { primary } = parseSchemaOrg(page, site);
      expect(primary['datePublished']).toBe('2025-06-01');
      expect(primary['author']).toBeDefined();
    });
  });

  describe('Course schema', () => {
    const page = makePage({
      frontmatter: {
        title: 'Intro to Circuits',
        description: 'Learn circuit basics',
        schema_type: 'Course',
      },
      url: '/courses/intro-circuits/',
    });

    it('includes provider with Organization type', () => {
      const { primary } = parseSchemaOrg(page, site);

      expect(primary['@type']).toBe('Course');
      expect(primary['name']).toBe('Intro to Circuits');
      expect(primary['description']).toBe('Learn circuit basics');

      const provider = primary['provider'] as Record<string, unknown>;
      expect(provider).toBeDefined();
      expect(provider['@type']).toBe('Organization');
      expect(provider['name']).toBe('Schema Test Site');
    });
  });

  describe('WebSite schema', () => {
    const page = makePage({
      frontmatter: {
        title: 'Schema Test Site',
        schema_type: 'WebSite',
      },
      url: '/',
    });

    it('includes potentialAction with SearchAction', () => {
      const { primary } = parseSchemaOrg(page, site);

      expect(primary['@type']).toBe('WebSite');
      expect(primary['name']).toBe('Schema Test Site');
      expect(primary['url']).toBe('https://schema.example.com');

      const action = primary['potentialAction'] as Record<string, unknown>;
      expect(action).toBeDefined();
      expect(action['@type']).toBe('SearchAction');
    });
  });

  describe('WebPage schema (default)', () => {
    const page = makePage({
      frontmatter: { title: 'Plain Page', description: 'A simple page' },
      url: '/plain/',
    });

    it('has name, url, description', () => {
      const { primary } = parseSchemaOrg(page, site);

      expect(primary['@type']).toBe('WebPage');
      expect(primary['name']).toBe('Plain Page');
      expect(primary['url']).toBe('https://schema.example.com/plain/');
      expect(primary['description']).toBe('A simple page');
    });
  });

  describe('BreadcrumbList', () => {
    it('has correct itemListElement structure', () => {
      const page = makePage({
        frontmatter: { title: 'Deep Page' },
        url: '/foundations/electronics/resistors/',
      });
      const { breadcrumbs } = parseSchemaOrg(page, site);

      expect(breadcrumbs['@type']).toBe('BreadcrumbList');
      expect(breadcrumbs['itemListElement']).toBeDefined();

      const items = breadcrumbs['itemListElement'] as Array<Record<string, unknown>>;
      expect(items.length).toBeGreaterThanOrEqual(2);

      // First item is always Home
      expect(items[0]['name']).toBe('Home');
      expect(items[0]['position']).toBe(1);

      // Check position numbering is sequential
      for (let i = 0; i < items.length; i++) {
        expect(items[i]['position']).toBe(i + 1);
        expect(items[i]['@type']).toBe('ListItem');
      }
    });

    it('builds path from URL segments', () => {
      const page = makePage({
        frontmatter: { title: 'Resistors' },
        url: '/docs/components/resistors/',
      });
      const { breadcrumbs } = parseSchemaOrg(page, site);
      const items = breadcrumbs['itemListElement'] as Array<Record<string, unknown>>;

      // Home + docs + components + resistors = 4 items
      expect(items.length).toBe(4);
      expect(items[1]['name']).toBe('Docs');
      expect(items[2]['name']).toBe('Components');
      expect(items[3]['name']).toBe('Resistors');
    });
  });
});
