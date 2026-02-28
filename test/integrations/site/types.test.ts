import { describe, it, expect } from 'vitest';
import type {
  FrontMatter,
  ContentPage,
  TocEntry,
  SiteConfig,
  AgentConfig,
  WordPressConfig,
  DeployConfig,
  NavigationSection,
  NavigationItem,
  SearchEntry,
  CitationEntry,
  CitationDatabase,
  BuildResult,
  TemplateData,
  BuildOptions,
} from '../../../src/integrations/site/types';

describe('Site Generator Types', () => {
  describe('export completeness', () => {
    it('exports all 15 core interfaces', () => {
      // Type-level test: if this compiles, all types are exported
      const _fm: FrontMatter = { title: 'Test' };
      const _te: TocEntry = { level: 1, text: 'H1', id: 'h1' };
      const _cp: ContentPage = {
        frontmatter: _fm,
        content: '<p>html</p>',
        rawMarkdown: '# test',
        sourcePath: 'test.md',
        outputPath: 'test/index.html',
        url: '/test/',
        slug: 'test',
        toc: [_te],
        wordCount: 1,
      };
      const _ac: AgentConfig = {
        llms_txt: true,
        llms_full: true,
        agents_md: true,
        schema_org: true,
        markdown_mirror: true,
      };
      const _wpc: WordPressConfig = {
        url: 'https://example.com/wp',
        api: 'https://example.com/wp/wp-json/wp/v2',
        comments_enabled: true,
        comments_moderation: true,
      };
      const _dc: DeployConfig = {
        method: 'ftp',
        host: 'ftp.example.com',
        user: 'user',
        path: '/public_html',
        exclude: ['*.map'],
      };
      const _sc: SiteConfig = {
        title: 'Test Site',
        description: 'A test site',
        url: 'https://example.com',
        author: 'Author',
        language: 'en',
        buildDate: '2026-01-01',
        agent: _ac,
        wordpress: _wpc,
        deploy: _dc,
      };
      const _ni: NavigationItem = { label: 'Home', url: '/' };
      const _ns: NavigationSection = { id: 'main', label: 'Main', items: [_ni] };
      const _se: SearchEntry = { t: 'Title', d: 'Desc', u: '/url/', g: ['tag'], x: 'excerpt' };
      const _ce: CitationEntry = { type: 'book', authors: ['Author'], title: 'Title', year: 2025 };
      const _cdb: CitationDatabase = { 'key': _ce };
      const _br: BuildResult = {
        pagesBuilt: 1,
        pagesSkipped: 0,
        warnings: [],
        elapsedMs: 100,
        outputDir: 'build/',
      };
      const _td: TemplateData = {
        page: _cp,
        site: _sc,
        navigation: [_ns],
        currentSection: 'main',
        buildDate: '2026-01-01',
        schemaJsonLd: '{}',
      };
      const _bo: BuildOptions = {
        contentDir: 'docs/',
        templateDir: '_templates/',
        dataDir: '_data/',
        staticDir: '_static/',
        outputDir: 'build/',
      };

      expect(_cp).toBeDefined();
      expect(_sc).toBeDefined();
      expect(_br).toBeDefined();
      expect(_td).toBeDefined();
      expect(_bo).toBeDefined();
    });
  });

  describe('FrontMatter shape', () => {
    it('requires only title', () => {
      const fm: FrontMatter = { title: 'Test' };
      expect(fm.title).toBe('Test');
      expect(fm.template).toBeUndefined();
      expect(fm.draft).toBeUndefined();
    });

    it('accepts all optional fields', () => {
      const fm: FrontMatter = {
        title: 'Full Test',
        description: 'A description',
        template: 'essay',
        date: '2026-01-01',
        updated: '2026-02-01',
        author: 'Site Author',
        tags: ['test', 'example'],
        agent_visible: true,
        agent_priority: 'high',
        schema_type: 'Article',
        nav_section: 'essays',
        nav_order: 1,
        draft: false,
        comments: true,
        wp_post_id: 42,
        wp_sync: true,
        original_url: 'https://example.com/post/42',
      };
      expect(fm.tags).toHaveLength(2);
      expect(fm.agent_priority).toBe('high');
      expect(fm.wp_post_id).toBe(42);
    });

    it('enforces agent_priority enum', () => {
      const priorities: FrontMatter['agent_priority'][] = ['high', 'medium', 'low'];
      expect(priorities).toHaveLength(3);
    });
  });

  describe('ContentPage shape', () => {
    it('has all required fields', () => {
      const page: ContentPage = {
        frontmatter: { title: 'T' },
        content: '<p>c</p>',
        rawMarkdown: 'c',
        sourcePath: 's.md',
        outputPath: 's/index.html',
        url: '/s/',
        slug: 's',
        toc: [],
        wordCount: 1,
      };
      expect(page.frontmatter.title).toBe('T');
      expect(page.toc).toEqual([]);
      expect(page.wordCount).toBe(1);
    });
  });

  describe('TocEntry shape', () => {
    it('has level, text, and id', () => {
      const entry: TocEntry = { level: 2, text: 'Section', id: 'section' };
      expect(entry.level).toBe(2);
      expect(entry.text).toBe('Section');
      expect(entry.id).toBe('section');
    });
  });

  describe('SiteConfig shape', () => {
    it('has all required fields', () => {
      const config: SiteConfig = {
        title: 'Site',
        description: 'Desc',
        url: 'https://example.com',
        author: 'Auth',
        language: 'en',
        buildDate: '2026-01-01',
        agent: {
          llms_txt: true, llms_full: true, agents_md: true,
          schema_org: true, markdown_mirror: true,
        },
      };
      expect(config.wordpress).toBeUndefined();
      expect(config.deploy).toBeUndefined();
    });

    it('accepts optional wordpress and deploy configs', () => {
      const config: SiteConfig = {
        title: 'Site',
        description: 'Desc',
        url: 'https://example.com',
        author: 'Auth',
        language: 'en',
        buildDate: '2026-01-01',
        agent: {
          llms_txt: true, llms_full: true, agents_md: true,
          schema_org: true, markdown_mirror: true,
        },
        wordpress: {
          url: 'https://example.com/wp',
          api: 'https://example.com/wp/wp-json/wp/v2',
          comments_enabled: true,
          comments_moderation: true,
        },
        deploy: {
          method: 'rsync',
          host: 'host',
          user: 'user',
          path: '/public_html',
          exclude: [],
        },
      };
      expect(config.wordpress?.url).toBe('https://example.com/wp');
      expect(config.deploy?.method).toBe('rsync');
    });
  });

  describe('AgentConfig shape', () => {
    it('has all 5 boolean fields', () => {
      const ac: AgentConfig = {
        llms_txt: true,
        llms_full: false,
        agents_md: true,
        schema_org: false,
        markdown_mirror: true,
      };
      expect(Object.keys(ac)).toHaveLength(5);
    });
  });

  describe('NavigationSection shape', () => {
    it('has id, label, and items array', () => {
      const section: NavigationSection = {
        id: 'essays',
        label: 'Essays',
        items: [{ label: 'Essay 1', url: '/essays/one/' }],
      };
      expect(section.items).toHaveLength(1);
    });

    it('supports external navigation items', () => {
      const item: NavigationItem = { label: 'GitHub', url: 'https://github.com', external: true };
      expect(item.external).toBe(true);
    });
  });

  describe('SearchEntry shape', () => {
    it('uses compressed single-char keys', () => {
      const entry: SearchEntry = {
        t: 'Title',
        d: 'Description',
        u: '/url/',
        g: ['tag1', 'tag2'],
        x: 'excerpt text here',
      };
      expect(Object.keys(entry)).toEqual(['t', 'd', 'u', 'g', 'x']);
    });
  });

  describe('CitationEntry shape', () => {
    it('has required fields', () => {
      const entry: CitationEntry = {
        type: 'book',
        authors: ['Author A', 'Author B'],
        title: 'The Book',
        year: 2025,
      };
      expect(entry.authors).toHaveLength(2);
    });

    it('accepts all optional fields', () => {
      const entry: CitationEntry = {
        type: 'article',
        authors: ['Author'],
        title: 'Article',
        year: 2024,
        publisher: 'Publisher',
        journal: 'Journal',
        volume: '1',
        pages: '1-10',
        doi: '10.1234/5678',
        isbn: '978-0000000000',
        url: 'https://example.com',
        edition: '2nd',
      };
      expect(entry.doi).toBe('10.1234/5678');
    });
  });

  describe('BuildResult shape', () => {
    it('has all fields', () => {
      const result: BuildResult = {
        pagesBuilt: 10,
        pagesSkipped: 2,
        warnings: ['warn1'],
        elapsedMs: 500,
        outputDir: 'build/',
      };
      expect(result.pagesBuilt).toBe(10);
      expect(result.warnings).toHaveLength(1);
    });
  });

  describe('DeployConfig shape', () => {
    it('enforces method enum', () => {
      const methods: DeployConfig['method'][] = ['ftp', 'rsync'];
      expect(methods).toHaveLength(2);
    });
  });

  describe('TemplateData shape', () => {
    it('has all fields for template rendering', () => {
      const data: TemplateData = {
        page: {
          frontmatter: { title: 'T' },
          content: '',
          rawMarkdown: '',
          sourcePath: 'a.md',
          outputPath: 'a/index.html',
          url: '/a/',
          slug: 'a',
          toc: [],
          wordCount: 0,
        },
        site: {
          title: 'S',
          description: 'D',
          url: 'https://example.com',
          author: 'A',
          language: 'en',
          buildDate: '2026-01-01',
          agent: {
            llms_txt: true, llms_full: true, agents_md: true,
            schema_org: true, markdown_mirror: true,
          },
        },
        navigation: [],
        currentSection: '',
        buildDate: '2026-01-01',
        schemaJsonLd: '{}',
      };
      expect(data.page).toBeDefined();
      expect(data.site).toBeDefined();
    });
  });
});
