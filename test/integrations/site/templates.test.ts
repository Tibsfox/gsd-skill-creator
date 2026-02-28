import { describe, it, expect, vi } from 'vitest';
import { loadTemplates, renderTemplate } from '../../../src/site/templates';
import type { TemplateData, ContentPage, SiteConfig } from '../../../src/site/types';

/* ---- Test fixtures ---- */

function makePage(overrides?: Partial<ContentPage>): ContentPage {
  return {
    frontmatter: { title: 'Test Page', description: 'A test page', template: 'page' },
    content: '<p>Hello world</p>',
    rawMarkdown: 'Hello world',
    sourcePath: 'test.md',
    outputPath: 'test/index.html',
    url: '/test/',
    slug: 'test',
    toc: [],
    wordCount: 2,
    ...overrides,
  };
}

function makeSite(overrides?: Partial<SiteConfig>): SiteConfig {
  return {
    title: 'Test Site',
    description: 'A test site',
    url: 'https://example.com',
    author: 'Author',
    language: 'en',
    buildDate: '2026-01-01',
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

function makeData(overrides?: Partial<TemplateData>): TemplateData {
  return {
    page: makePage(),
    site: makeSite(),
    navigation: [{ id: 'main', label: 'Main', items: [{ label: 'Home', url: '/' }] }],
    currentSection: 'main',
    buildDate: '2026-01-01',
    schemaJsonLd: '{"@context":"https://schema.org"}',
    ...overrides,
  };
}

describe('Template Engine', () => {
  describe('variable interpolation', () => {
    it('replaces {{variable}} with value', () => {
      const registry = new Map([['test', '<title>{{page.frontmatter.title}}</title>']]);
      const result = renderTemplate('test', makeData(), registry);
      expect(result).toBe('<title>Test Page</title>');
    });

    it('HTML-escapes {{variable}} output', () => {
      const registry = new Map([['test', '<p>{{page.frontmatter.title}}</p>']]);
      const data = makeData({ page: makePage({ frontmatter: { title: '<script>alert("xss")</script>' } }) });
      const result = renderTemplate('test', data, registry);
      expect(result).toContain('&lt;script&gt;');
      expect(result).not.toContain('<script>');
    });

    it('does not escape {{{variable}}} raw output', () => {
      const registry = new Map([['test', '<div>{{{page.content}}}</div>']]);
      const result = renderTemplate('test', makeData(), registry);
      expect(result).toBe('<div><p>Hello world</p></div>');
    });

    it('resolves dot notation paths (page.frontmatter.title)', () => {
      const registry = new Map([['test', '{{page.frontmatter.description}}']]);
      const result = renderTemplate('test', makeData(), registry);
      expect(result).toBe('A test page');
    });
  });

  describe('sections', () => {
    it('renders section block when value is truthy', () => {
      const registry = new Map([['test', '{{#page.frontmatter.description}}Has desc{{/page.frontmatter.description}}']]);
      const result = renderTemplate('test', makeData(), registry);
      expect(result).toBe('Has desc');
    });

    it('removes section block when value is falsy', () => {
      const registry = new Map([['test', '{{#page.frontmatter.draft}}DRAFT{{/page.frontmatter.draft}}']]);
      const result = renderTemplate('test', makeData(), registry);
      expect(result).toBe('');
    });

    it('iterates over arrays in section blocks', () => {
      const registry = new Map([['test', '{{#page.frontmatter.tags}}<span>{{.}}</span>{{/page.frontmatter.tags}}']]);
      const data = makeData({ page: makePage({ frontmatter: { title: 'T', tags: ['one', 'two', 'three'] } }) });
      const result = renderTemplate('test', data, registry);
      expect(result).toBe('<span>one</span><span>two</span><span>three</span>');
    });
  });

  describe('partials', () => {
    it('includes partials with {{>partial}}', () => {
      const registry = new Map([
        ['test', '<html>{{>header}}<body>content</body></html>'],
        ['header', '<head><title>{{page.frontmatter.title}}</title></head>'],
      ]);
      const result = renderTemplate('test', makeData(), registry);
      expect(result).toContain('<head><title>Test Page</title></head>');
    });

    it('resolves nested partials', () => {
      const registry = new Map([
        ['test', '{{>outer}}'],
        ['outer', 'OUTER({{>inner}})'],
        ['inner', 'INNER'],
      ]);
      const result = renderTemplate('test', makeData(), registry);
      expect(result).toBe('OUTER(INNER)');
    });

    it('handles max recursion depth on partials gracefully', () => {
      const registry = new Map([
        ['test', '{{>recursive}}'],
        ['recursive', 'X{{>recursive}}'],
      ]);
      // Should not throw, should stop at max depth
      const result = renderTemplate('test', makeData(), registry);
      // Should contain some X's but eventually stop
      expect(result).toContain('X');
      expect(result.length).toBeLessThan(1000);
    });
  });

  describe('missing values', () => {
    it('replaces missing variable with empty string', () => {
      const registry = new Map([['test', 'Hello {{nonexistent}}!']]);
      const result = renderTemplate('test', makeData(), registry);
      expect(result).toBe('Hello !');
    });

    it('replaces missing partial with empty string', () => {
      const registry = new Map([['test', 'Before{{>missing}}After']]);
      const result = renderTemplate('test', makeData(), registry);
      expect(result).toBe('BeforeAfter');
    });

    it('replaces undefined nested path with empty string', () => {
      const registry = new Map([['test', '{{page.frontmatter.nonexistent.deep}}']]);
      const result = renderTemplate('test', makeData(), registry);
      expect(result).toBe('');
    });
  });

  describe('loadTemplates', () => {
    it('loads templates from directory via injectable readFn', async () => {
      const files: Record<string, string> = {
        'templates/page.html': '<html>{{page.frontmatter.title}}</html>',
        'templates/essay.html': '<article>{{{page.content}}}</article>',
        'templates/partials/header.html': '<header>{{site.title}}</header>',
        'templates/partials/footer.html': '<footer>{{buildDate}}</footer>',
      };

      const walkFn = async (_dir: string): Promise<string[]> => {
        return [
          'page.html',
          'essay.html',
          'partials/header.html',
          'partials/footer.html',
        ];
      };

      const readFn = async (path: string): Promise<string> => {
        return files[path] ?? '';
      };

      const registry = await loadTemplates('templates', readFn, walkFn);
      expect(registry.size).toBe(4);
      expect(registry.has('page')).toBe(true);
      expect(registry.has('essay')).toBe(true);
      expect(registry.has('header')).toBe(true);
      expect(registry.has('footer')).toBe(true);
    });
  });

  describe('full page render', () => {
    it('renders a complete page with all features', () => {
      const registry = new Map([
        ['page', '<!DOCTYPE html><html>{{>head}}<body>{{#page.frontmatter.description}}<meta name="desc" content="{{page.frontmatter.description}}">{{/page.frontmatter.description}}{{{page.content}}}<p>Built: {{buildDate}}</p></body></html>'],
        ['head', '<head><title>{{page.frontmatter.title}} | {{site.title}}</title></head>'],
      ]);
      const result = renderTemplate('page', makeData(), registry);
      expect(result).toContain('<!DOCTYPE html>');
      expect(result).toContain('<title>Test Page | Test Site</title>');
      expect(result).toContain('<meta name="desc" content="A test page">');
      expect(result).toContain('<p>Hello world</p>');
      expect(result).toContain('Built: 2026-01-01');
    });
  });
});
