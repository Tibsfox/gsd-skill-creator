import { describe, it, expect } from 'vitest';
import { build } from '../../src/site/build';
import type { BuildOptions } from '../../src/site/types';

/* ---- Fixtures ---- */

const siteYaml = `title: Test Site
description: A test site for integration
url: https://example.com
author: Author
language: en
buildDate: "2026-01-01"
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
- id: essays
  label: Essays
  items:
    - label: Test Essay
      url: /essays/test-essay/
`;

const citationsJson = JSON.stringify({
  knuth1997: {
    type: 'book',
    authors: ['Donald E. Knuth'],
    title: 'The Art of Computer Programming',
    year: 1997,
    publisher: 'Addison-Wesley',
  },
});

const pageTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
<title>{{page.frontmatter.title}}</title>
<meta name="description" content="{{page.frontmatter.description}}">
</head>
<body>
{{{page.content}}}
</body>
</html>`;

const homeTemplate = `<!DOCTYPE html>
<html lang="en">
<head><title>{{page.frontmatter.title}}</title></head>
<body class="home">{{{page.content}}}</body>
</html>`;

const indexPage = `---
title: Home
description: Welcome to the test site
template: home
schema_type: WebSite
tags:
  - home
nav_section: main
nav_order: 0
agent_visible: true
agent_priority: high
date: "2026-01-01"
---

# Welcome

This is the home page with enough content to test the full pipeline.
`;

const aboutPage = `---
title: About
description: About the test site
tags:
  - about
nav_section: main
nav_order: 1
agent_visible: true
agent_priority: medium
date: "2026-01-01"
---

# About

This is the about page. It has [a link to home](/) and [another to essays](/essays/test-essay/).
`;

const essayPage = `---
title: Test Essay
description: An essay for testing
tags:
  - essays
  - testing
nav_section: essays
nav_order: 0
agent_visible: true
agent_priority: high
schema_type: Article
date: "2026-01-01"
---

# Test Essay

This is a test essay with some substantial content for the integration tests. It covers
multiple paragraphs and has enough words to generate a meaningful search excerpt.

## Section Two

More content here with **bold** and *italic* formatting. Links to [About](/about/) and
[Home](/) pages ensure internal link coverage.

## Section Three

Final section with a list:

- Item one
- Item two
- Item three
`;

const draftPage = `---
title: Draft Post
description: A draft page
draft: true
---

This is a draft and should not appear in agent files or search index.
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
      // No-op
    },
  };
}

function makeFullBuildFS(): MockFS {
  return createMockFS({
    'data/site.yaml': siteYaml,
    'data/navigation.yaml': navYaml,
    'data/citations.json': citationsJson,
    'templates/page.html': pageTemplate,
    'templates/home.html': homeTemplate,
    'content/index.md': indexPage,
    'content/about.md': aboutPage,
    'content/test-essay.md': essayPage,
    'content/draft.md': draftPage,
  });
}

function makeOpts(fs: MockFS): BuildOptions {
  return {
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
  };
}

describe('Full Integration', () => {
  it('produces index.html for each page', async () => {
    const fs = makeFullBuildFS();
    const result = await build(makeOpts(fs));

    expect(result.pagesBuilt).toBe(3); // index, about, essay (draft skipped)
    expect(fs.files.has('build/index.html')).toBe(true);
    expect(fs.files.has('build/about/index.html')).toBe(true);
    expect(fs.files.has('build/test-essay/index.html')).toBe(true);
  });

  it('produces llms.txt', async () => {
    const fs = makeFullBuildFS();
    await build(makeOpts(fs));

    expect(fs.files.has('build/llms.txt')).toBe(true);
    const llmsTxt = fs.files.get('build/llms.txt')!;
    expect(llmsTxt).toContain('# Test Site');
    expect(llmsTxt).toContain('Home');
  });

  it('produces llms-full.txt', async () => {
    const fs = makeFullBuildFS();
    await build(makeOpts(fs));

    expect(fs.files.has('build/llms-full.txt')).toBe(true);
    const full = fs.files.get('build/llms-full.txt')!;
    expect(full).toContain('Full Content');
    expect(full).toContain('Test Essay');
  });

  it('produces AGENTS.md', async () => {
    const fs = makeFullBuildFS();
    await build(makeOpts(fs));

    expect(fs.files.has('build/AGENTS.md')).toBe(true);
    const agents = fs.files.get('build/AGENTS.md')!;
    expect(agents).toContain('Agent Guide');
  });

  it('produces sitemap.xml, robots.txt, and feed.xml', async () => {
    const fs = makeFullBuildFS();
    await build(makeOpts(fs));

    expect(fs.files.has('build/sitemap.xml')).toBe(true);
    expect(fs.files.has('build/robots.txt')).toBe(true);
    expect(fs.files.has('build/feed.xml')).toBe(true);

    const sitemap = fs.files.get('build/sitemap.xml')!;
    expect(sitemap).toContain('<urlset');
    expect(sitemap).toContain('https://example.com');

    const robots = fs.files.get('build/robots.txt')!;
    expect(robots).toContain('Sitemap:');

    const feed = fs.files.get('build/feed.xml')!;
    expect(feed).toContain('<feed');
    expect(feed).toContain('Test Essay');
  });

  it('produces search-index.json', async () => {
    const fs = makeFullBuildFS();
    await build(makeOpts(fs));

    expect(fs.files.has('build/search-index.json')).toBe(true);
    const raw = fs.files.get('build/search-index.json')!;
    const index = JSON.parse(raw);
    expect(Array.isArray(index)).toBe(true);
    expect(index.length).toBe(3); // 3 non-draft pages
    // Verify search entries have required compressed keys
    for (const entry of index) {
      expect(entry).toHaveProperty('t');
      expect(entry).toHaveProperty('u');
      expect(entry).toHaveProperty('x');
    }
  });

  it('all internal links in HTML resolve to built pages', async () => {
    const fs = makeFullBuildFS();
    await build(makeOpts(fs));

    // Collect all built page URLs
    const builtUrls = new Set<string>();
    for (const key of fs.files.keys()) {
      if (key.startsWith('build/') && key.endsWith('/index.html')) {
        const slug = key.slice('build/'.length, -'/index.html'.length);
        builtUrls.add(`/${slug}/`);
      }
      if (key === 'build/index.html') {
        builtUrls.add('/');
      }
    }

    // Check HTML files for internal links
    const linkRe = /href="(\/[^"]*?)"/g;
    const brokenLinks: string[] = [];

    for (const [path, content] of fs.files) {
      if (!path.endsWith('.html')) continue;
      let match;
      while ((match = linkRe.exec(content)) !== null) {
        const href = match[1];
        // Skip anchor-only and external links
        if (href.startsWith('/#') || href.startsWith('/bibliography/')) continue;
        // Normalize: /about/ should match
        const normalized = href.endsWith('/') ? href : href + '/';
        if (!builtUrls.has(normalized) && !builtUrls.has(href)) {
          brokenLinks.push(`${path} -> ${href}`);
        }
      }
    }

    expect(brokenLinks).toEqual([]);
  });

  it('agent file URLs match build output', async () => {
    const fs = makeFullBuildFS();
    await build(makeOpts(fs));

    const llmsTxt = fs.files.get('build/llms.txt')!;
    const sitemap = fs.files.get('build/sitemap.xml')!;

    // All URLs in llms.txt should have corresponding pages in sitemap
    const llmsUrlRe = /\(https:\/\/example\.com([^)]+)\)/g;
    let match;
    while ((match = llmsUrlRe.exec(llmsTxt)) !== null) {
      const path = match[1];
      expect(sitemap).toContain(`https://example.com${path}`);
    }
  });
});
