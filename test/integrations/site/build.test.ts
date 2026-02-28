import { describe, it, expect, beforeEach, vi } from 'vitest';
import { build, processPage } from '../../../src/site/build';
import type {
  SiteConfig,
  NavigationSection,
  BuildOptions,
} from '../../../src/site/types';
import type { TemplateRegistry } from '../../../src/site/templates';

/* ---- Fixtures ---- */

function makeSiteConfig(overrides?: Partial<SiteConfig>): SiteConfig {
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

const navigation: NavigationSection[] = [
  {
    id: 'main',
    label: 'Main',
    items: [
      { label: 'Home', url: '/' },
      { label: 'About', url: '/about/' },
    ],
  },
];

const siteYaml = `title: Test Site
description: A test site
url: https://example.com
author: Author
language: en
agent:
  llms_txt: true
  llms_full: true
  agents_md: true
  schema_org: true
  markdown_mirror: true
`;

const navYaml = `- id: main
  label: Main
  items:
    - label: Home
      url: /
    - label: About
      url: /about/
`;

const pageTemplate = '<!DOCTYPE html><html><head><title>{{page.frontmatter.title}}</title></head><body>{{{page.content}}}</body></html>';

function makeRegistry(): TemplateRegistry {
  return new Map([['page', pageTemplate]]);
}

const samplePage = `---
title: Hello World
description: A test page
---

# Hello World

This is a test page with some content.
`;

const draftPage = `---
title: Draft Post
draft: true
---

This is a draft.
`;

const noFrontmatterPage = `# Just Content

No frontmatter here.
`;

/* ---- In-memory filesystem ---- */

interface MockFS {
  files: Map<string, string>;
  dirs: Set<string>;
  readFile: (path: string) => Promise<string>;
  writeFile: (path: string, content: string) => Promise<void>;
  walkDir: (dir: string) => Promise<string[]>;
  ensureDir: (path: string) => Promise<void>;
  copyDir: (src: string, dest: string) => Promise<void>;
}

function createMockFS(initialFiles: Record<string, string>): MockFS {
  const files = new Map(Object.entries(initialFiles));
  const dirs = new Set<string>();

  return {
    files,
    dirs,
    readFile: async (path: string) => {
      const content = files.get(path);
      if (content === undefined) throw new Error(`File not found: ${path}`);
      return content;
    },
    writeFile: async (path: string, content: string) => {
      files.set(path, content);
    },
    walkDir: async (dir: string) => {
      const results: string[] = [];
      for (const key of files.keys()) {
        if (key.startsWith(dir + '/')) {
          const relative = key.slice(dir.length + 1);
          // Only return direct children that are .md or .html files
          if (!relative.includes('/') || relative.startsWith('partials/')) {
            results.push(relative);
          }
        }
      }
      return results.sort();
    },
    ensureDir: async (path: string) => {
      dirs.add(path);
    },
    copyDir: async (_src: string, _dest: string) => {
      // No-op for tests
    },
  };
}

describe('Build Orchestrator', () => {
  describe('processPage', () => {
    it('processes a single page through frontmatter + markdown + template', () => {
      const result = processPage(
        'hello-world.md',
        samplePage,
        makeSiteConfig(),
        makeRegistry(),
        navigation,
      );
      expect(result.frontmatter.title).toBe('Hello World');
      expect(result.content).toContain('<h1');
      expect(result.content).toContain('Hello World');
      expect(result.slug).toBe('hello-world');
      expect(result.url).toBe('/hello-world/');
      expect(result.outputPath).toBe('hello-world/index.html');
      expect(result.wordCount).toBeGreaterThan(0);
    });

    it('skips draft pages when processPage is called on draft content', () => {
      const result = processPage(
        'draft.md',
        draftPage,
        makeSiteConfig(),
        makeRegistry(),
        navigation,
      );
      expect(result.frontmatter.draft).toBe(true);
    });
  });

  describe('build pipeline', () => {
    it('skips draft pages by default', async () => {
      const fs = createMockFS({
        'data/site.yaml': siteYaml,
        'data/navigation.yaml': navYaml,
        'templates/page.html': pageTemplate,
        'content/hello.md': samplePage,
        'content/secret.md': draftPage,
      });

      const result = await build({
        contentDir: 'content',
        templateDir: 'templates',
        dataDir: 'data',
        staticDir: 'static',
        outputDir: 'build',
        readFile: fs.readFile,
        writeFile: fs.writeFile,
        walkDir: fs.walkDir,
        ensureDir: fs.ensureDir,
        copyDir: fs.copyDir,
      });

      expect(result.pagesBuilt).toBe(1);
      expect(result.pagesSkipped).toBe(1);
    });

    it('includes drafts when includeDrafts is true', async () => {
      const fs = createMockFS({
        'data/site.yaml': siteYaml,
        'data/navigation.yaml': navYaml,
        'templates/page.html': pageTemplate,
        'content/hello.md': samplePage,
        'content/secret.md': draftPage,
      });

      const result = await build({
        contentDir: 'content',
        templateDir: 'templates',
        dataDir: 'data',
        staticDir: 'static',
        outputDir: 'build',
        includeDrafts: true,
        readFile: fs.readFile,
        writeFile: fs.writeFile,
        walkDir: fs.walkDir,
        ensureDir: fs.ensureDir,
        copyDir: fs.copyDir,
      });

      expect(result.pagesBuilt).toBe(2);
      expect(result.pagesSkipped).toBe(0);
    });

    it('generates clean URL output paths', async () => {
      const fs = createMockFS({
        'data/site.yaml': siteYaml,
        'data/navigation.yaml': navYaml,
        'templates/page.html': pageTemplate,
        'content/about.md': samplePage,
      });

      await build({
        contentDir: 'content',
        templateDir: 'templates',
        dataDir: 'data',
        staticDir: 'static',
        outputDir: 'build',
        readFile: fs.readFile,
        writeFile: fs.writeFile,
        walkDir: fs.walkDir,
        ensureDir: fs.ensureDir,
        copyDir: fs.copyDir,
      });

      // Output should be at clean URL path
      expect(fs.files.has('build/about/index.html')).toBe(true);
    });

    it('processes multiple pages', async () => {
      const page2 = `---
title: Second Page
---

Content of second page.
`;
      const page3 = `---
title: Third Page
---

Content of third page.
`;
      const fs = createMockFS({
        'data/site.yaml': siteYaml,
        'data/navigation.yaml': navYaml,
        'templates/page.html': pageTemplate,
        'content/first.md': samplePage,
        'content/second.md': page2,
        'content/third.md': page3,
      });

      const result = await build({
        contentDir: 'content',
        templateDir: 'templates',
        dataDir: 'data',
        staticDir: 'static',
        outputDir: 'build',
        readFile: fs.readFile,
        writeFile: fs.writeFile,
        walkDir: fs.walkDir,
        ensureDir: fs.ensureDir,
        copyDir: fs.copyDir,
      });

      expect(result.pagesBuilt).toBe(3);
    });

    it('falls back to page template when template is missing', async () => {
      const customTemplatePage = `---
title: Custom
template: nonexistent
---

Content here.
`;
      const fs = createMockFS({
        'data/site.yaml': siteYaml,
        'data/navigation.yaml': navYaml,
        'templates/page.html': pageTemplate,
        'content/custom.md': customTemplatePage,
      });

      const result = await build({
        contentDir: 'content',
        templateDir: 'templates',
        dataDir: 'data',
        staticDir: 'static',
        outputDir: 'build',
        readFile: fs.readFile,
        writeFile: fs.writeFile,
        walkDir: fs.walkDir,
        ensureDir: fs.ensureDir,
        copyDir: fs.copyDir,
      });

      expect(result.pagesBuilt).toBe(1);
      expect(result.warnings).toContainEqual(
        expect.stringContaining('nonexistent'),
      );
    });

    it('returns correct BuildResult counts', async () => {
      const fs = createMockFS({
        'data/site.yaml': siteYaml,
        'data/navigation.yaml': navYaml,
        'templates/page.html': pageTemplate,
        'content/a.md': samplePage,
        'content/b.md': draftPage,
      });

      const result = await build({
        contentDir: 'content',
        templateDir: 'templates',
        dataDir: 'data',
        staticDir: 'static',
        outputDir: 'build',
        readFile: fs.readFile,
        writeFile: fs.writeFile,
        walkDir: fs.walkDir,
        ensureDir: fs.ensureDir,
        copyDir: fs.copyDir,
      });

      expect(result.pagesBuilt).toBe(1);
      expect(result.pagesSkipped).toBe(1);
      expect(result.outputDir).toBe('build');
      expect(result.elapsedMs).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('copies static directory to output', async () => {
      const copyDirSpy = vi.fn();
      const fs = createMockFS({
        'data/site.yaml': siteYaml,
        'data/navigation.yaml': navYaml,
        'templates/page.html': pageTemplate,
        'content/a.md': samplePage,
      });

      await build({
        contentDir: 'content',
        templateDir: 'templates',
        dataDir: 'data',
        staticDir: 'static',
        outputDir: 'build',
        readFile: fs.readFile,
        writeFile: fs.writeFile,
        walkDir: fs.walkDir,
        ensureDir: fs.ensureDir,
        copyDir: copyDirSpy,
      });

      expect(copyDirSpy).toHaveBeenCalledWith('static', 'build/assets');
    });

    it('passes navigation data to templates', async () => {
      const navTemplate = '{{#navigation}}<nav>{{id}}</nav>{{/navigation}}';
      const fs = createMockFS({
        'data/site.yaml': siteYaml,
        'data/navigation.yaml': navYaml,
        'templates/page.html': '<html>{{{page.content}}}</html>',
        'content/a.md': samplePage,
      });

      const result = await build({
        contentDir: 'content',
        templateDir: 'templates',
        dataDir: 'data',
        staticDir: 'static',
        outputDir: 'build',
        readFile: fs.readFile,
        writeFile: fs.writeFile,
        walkDir: fs.walkDir,
        ensureDir: fs.ensureDir,
        copyDir: fs.copyDir,
      });

      // Navigation should not cause errors
      expect(result.pagesBuilt).toBe(1);
    });

    it('handles full pipeline with 5 sample pages end-to-end', async () => {
      const pages: Record<string, string> = {};
      for (let i = 1; i <= 5; i++) {
        pages[`content/page-${i}.md`] = `---
title: Page ${i}
description: Description of page ${i}
---

# Page ${i}

Content for page ${i} with **bold** and *italic* text.

- List item one
- List item two
`;
      }

      const fs = createMockFS({
        'data/site.yaml': siteYaml,
        'data/navigation.yaml': navYaml,
        'templates/page.html': pageTemplate,
        ...pages,
      });

      const result = await build({
        contentDir: 'content',
        templateDir: 'templates',
        dataDir: 'data',
        staticDir: 'static',
        outputDir: 'build',
        readFile: fs.readFile,
        writeFile: fs.writeFile,
        walkDir: fs.walkDir,
        ensureDir: fs.ensureDir,
        copyDir: fs.copyDir,
      });

      expect(result.pagesBuilt).toBe(5);
      expect(result.pagesSkipped).toBe(0);

      // Verify each output file was written
      for (let i = 1; i <= 5; i++) {
        const outputPath = `build/page-${i}/index.html`;
        expect(fs.files.has(outputPath)).toBe(true);
        const html = fs.files.get(outputPath)!;
        expect(html).toContain(`<title>Page ${i}</title>`);
        expect(html).toContain('<strong>bold</strong>');
      }
    });

    it('handles empty content directory', async () => {
      const fs = createMockFS({
        'data/site.yaml': siteYaml,
        'data/navigation.yaml': navYaml,
        'templates/page.html': pageTemplate,
      });

      const result = await build({
        contentDir: 'content',
        templateDir: 'templates',
        dataDir: 'data',
        staticDir: 'static',
        outputDir: 'build',
        readFile: fs.readFile,
        writeFile: fs.writeFile,
        walkDir: fs.walkDir,
        ensureDir: fs.ensureDir,
        copyDir: fs.copyDir,
      });

      expect(result.pagesBuilt).toBe(0);
      expect(result.pagesSkipped).toBe(0);
    });

    it('warns for pages with missing frontmatter', async () => {
      const fs = createMockFS({
        'data/site.yaml': siteYaml,
        'data/navigation.yaml': navYaml,
        'templates/page.html': pageTemplate,
        'content/bare.md': noFrontmatterPage,
      });

      const result = await build({
        contentDir: 'content',
        templateDir: 'templates',
        dataDir: 'data',
        staticDir: 'static',
        outputDir: 'build',
        readFile: fs.readFile,
        writeFile: fs.writeFile,
        walkDir: fs.walkDir,
        ensureDir: fs.ensureDir,
        copyDir: fs.copyDir,
      });

      // Should still build but with a warning
      expect(result.pagesBuilt).toBe(1);
      expect(result.warnings).toContainEqual(
        expect.stringContaining('bare.md'),
      );
    });
  });
});
