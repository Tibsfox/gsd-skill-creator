import { describe, it, expect, vi } from 'vitest';
import {
  extractMarkdownLinks,
  extractHtmlLinks,
  verifyLinks,
  runLinkCheck,
} from './link-check.js';
import type { ExtractedLink, LinkCheckOptions } from './link-check.js';

// ============================================================================
// Test helpers — in-memory FS mirroring tests/site/audit.test.ts pattern
// ============================================================================

type ReadFn = (path: string) => Promise<string>;
type WalkFn = (dir: string) => Promise<string[]>;

function createLinkCheckFS(files: Record<string, string>): {
  readFile: ReadFn;
  walkDir: WalkFn;
} {
  const store = new Map(Object.entries(files));
  return {
    readFile: async (path: string) => {
      const content = store.get(path);
      if (content === undefined) throw new Error(`Not found: ${path}`);
      return content;
    },
    walkDir: async (dir: string) => {
      const results: string[] = [];
      for (const key of store.keys()) {
        if (key.startsWith(dir + '/')) {
          results.push(key.slice(dir.length + 1));
        }
      }
      return results.sort();
    },
  };
}

function makeOpts(overrides: Partial<LinkCheckOptions> = {}): LinkCheckOptions {
  const { readFile, walkDir } = createLinkCheckFS({});
  return {
    readFile,
    walkDir,
    checkExternal: false,
    ...overrides,
  };
}

// ============================================================================
// extractMarkdownLinks
// ============================================================================

describe('extractMarkdownLinks', () => {
  it('links and images both captured', () => {
    const md = `
[Visit docs](/docs/)
![Logo](/assets/logo.png)
[External](https://example.com)
`;
    const links = extractMarkdownLinks(md);
    const urls = links.map((l) => l.url);
    expect(urls).toContain('/docs/');
    expect(urls).toContain('/assets/logo.png');
    expect(urls).toContain('https://example.com');

    const link = links.find((l) => l.url === '/docs/');
    expect(link?.elementType).toBe('markdown-link');

    const img = links.find((l) => l.url === '/assets/logo.png');
    expect(img?.elementType).toBe('markdown-image');
  });

  it('closure-local state — two sequential calls do not bleed', () => {
    const md1 = '[First](/first/)';
    const md2 = '[Second](/second/)';

    const links1 = extractMarkdownLinks(md1, 'page1.md');
    const links2 = extractMarkdownLinks(md2, 'page2.md');

    // Each result must contain only its own hrefs
    expect(links1.map((l) => l.url)).toEqual(['/first/']);
    expect(links2.map((l) => l.url)).toEqual(['/second/']);
  });

  it('returns empty array for markdown with no links', () => {
    const links = extractMarkdownLinks('# Just a heading\n\nNo links here.');
    expect(links).toHaveLength(0);
  });
});

// ============================================================================
// extractHtmlLinks
// ============================================================================

describe('extractHtmlLinks', () => {
  it('7 element types one match each', () => {
    const html = `
<a href="/page/">link</a>
<img src="/img/photo.jpg">
<link href="/assets/style.css">
<script src="/assets/app.js"></script>
<source src="/video/clip.mp4">
<iframe src="/embed/map"></iframe>
<form action="/submit/"></form>
`;
    const links = extractHtmlLinks(html, 'test.html');
    const urls = links.map((l) => l.url);

    expect(urls).toContain('/page/');
    expect(urls).toContain('/img/photo.jpg');
    expect(urls).toContain('/assets/style.css');
    expect(urls).toContain('/assets/app.js');
    expect(urls).toContain('/video/clip.mp4');
    expect(urls).toContain('/embed/map');
    expect(urls).toContain('/submit/');

    const types = links.map((l) => l.elementType);
    expect(types).toContain('html-a');
    expect(types).toContain('html-img');
    expect(types).toContain('html-link');
    expect(types).toContain('html-script');
    expect(types).toContain('html-source');
    expect(types).toContain('html-iframe');
    expect(types).toContain('html-form');
  });

  it('single-quoted, double-quoted, mixed-case tags', () => {
    const html = `
<A HREF='/single-quoted/'>single</A>
<IMG SRC="/double-quoted.png">
`;
    const links = extractHtmlLinks(html, 'test.html');
    const urls = links.map((l) => l.url);
    expect(urls).toContain('/single-quoted/');
    expect(urls).toContain('/double-quoted.png');
  });

  it('attributes in any order, multiple attributes per tag', () => {
    const html = `<a class="nav" id="main-link" href="/order-test/" target="_blank">text</a>`;
    const links = extractHtmlLinks(html, 'test.html');
    expect(links.map((l) => l.url)).toContain('/order-test/');
  });
});

// ============================================================================
// verifyLinks
// ============================================================================

describe('verifyLinks', () => {
  it('internal absolute /foo/ resolves', async () => {
    const builtUrls = new Set(['/foo/']);
    const headingSlugsByPage = new Map<string, Set<string>>();
    const opts = makeOpts();

    const links: ExtractedLink[] = [
      { url: '/foo/', elementType: 'html-a', sourceFile: 'index.html' },
    ];
    const results = await verifyLinks(links, builtUrls, headingSlugsByPage, opts);
    expect(results[0]?.status).toBe('ok');
  });

  it('internal absolute /nonexistent/ is broken-internal', async () => {
    const builtUrls = new Set(['/foo/']);
    const headingSlugsByPage = new Map<string, Set<string>>();
    const opts = makeOpts();

    const links: ExtractedLink[] = [
      { url: '/nonexistent/', elementType: 'html-a', sourceFile: 'index.html' },
    ];
    const results = await verifyLinks(links, builtUrls, headingSlugsByPage, opts);
    expect(results[0]?.status).toBe('broken-internal');
  });

  it('relative ./foo and ../foo resolve from sourceFile', async () => {
    // ./about/ from index.html → /about/
    // ../../docs/ from blog/post/index.html → /docs/
    const builtUrls = new Set(['/about/', '/docs/']);
    const headingSlugsByPage = new Map<string, Set<string>>();
    const opts = makeOpts();

    const links: ExtractedLink[] = [
      { url: './about/', elementType: 'html-a', sourceFile: 'index.html' },
      { url: '../../docs/', elementType: 'html-a', sourceFile: 'blog/post/index.html' },
    ];
    const results = await verifyLinks(links, builtUrls, headingSlugsByPage, opts);

    // Both should resolve to known built URLs
    expect(results[0]?.status).toBe('ok');
    expect(results[1]?.status).toBe('ok');
  });

  it('protocol-relative //cdn... is treated as external', async () => {
    const builtUrls = new Set<string>();
    const headingSlugsByPage = new Map<string, Set<string>>();
    const mockHttpHead = vi.fn(async () => ({ status: 200, finalUrl: 'https://cdn.example.com/lib.js' }));
    const opts = makeOpts({ checkExternal: true, httpHead: mockHttpHead });

    const links: ExtractedLink[] = [
      { url: '//cdn.example.com/lib.js', elementType: 'html-script' },
    ];
    const results = await verifyLinks(links, builtUrls, headingSlugsByPage, opts);
    expect(mockHttpHead).toHaveBeenCalledOnce();
    expect(results[0]?.status).toBe('ok');
  });

  it('anchor #slug found in page heading slugs', async () => {
    const builtUrls = new Set(['/docs/']);
    const headingSlugsByPage = new Map([
      ['/docs/', new Set(['installation', 'usage'])],
    ]);
    const opts = makeOpts();

    const links: ExtractedLink[] = [
      { url: '/docs/#installation', elementType: 'html-a', sourceFile: 'index.html' },
    ];
    const results = await verifyLinks(links, builtUrls, headingSlugsByPage, opts);
    expect(results[0]?.status).toBe('ok');
  });

  it('anchor #missing reported broken-anchor', async () => {
    const builtUrls = new Set(['/docs/']);
    const headingSlugsByPage = new Map([
      ['/docs/', new Set(['installation'])],
    ]);
    const opts = makeOpts();

    const links: ExtractedLink[] = [
      { url: '/docs/#missing-section', elementType: 'html-a', sourceFile: 'index.html' },
    ];
    const results = await verifyLinks(links, builtUrls, headingSlugsByPage, opts);
    expect(results[0]?.status).toBe('broken-anchor');
  });

  it('fragment-only #slug resolves against current page headings', async () => {
    const builtUrls = new Set(['/docs/']);
    const headingSlugsByPage = new Map([
      ['/docs/', new Set(['installation', 'usage'])],
    ]);
    const opts = makeOpts();

    const links: ExtractedLink[] = [
      { url: '#installation', elementType: 'html-a', sourceFile: 'docs/index.html' },
    ];
    const results = await verifyLinks(links, builtUrls, headingSlugsByPage, opts);
    expect(results[0]?.status).toBe('ok');
  });

  it('fragment-only #missing on current page is broken-anchor', async () => {
    const builtUrls = new Set(['/docs/']);
    const headingSlugsByPage = new Map([
      ['/docs/', new Set(['installation'])],
    ]);
    const opts = makeOpts();

    const links: ExtractedLink[] = [
      { url: '#nope', elementType: 'html-a', sourceFile: 'docs/index.html' },
    ];
    const results = await verifyLinks(links, builtUrls, headingSlugsByPage, opts);
    expect(results[0]?.status).toBe('broken-anchor');
    expect(results[0]?.reason).toBe('anchor-not-found');
  });

  it('fragment-only at site root #slug resolves against / headings', async () => {
    const builtUrls = new Set(['/']);
    const headingSlugsByPage = new Map([
      ['/', new Set(['welcome'])],
    ]);
    const opts = makeOpts();

    const links: ExtractedLink[] = [
      { url: '#welcome', elementType: 'html-a', sourceFile: 'index.html' },
      { url: '#gone', elementType: 'html-a', sourceFile: 'index.html' },
    ];
    const results = await verifyLinks(links, builtUrls, headingSlugsByPage, opts);
    expect(results[0]?.status).toBe('ok');
    expect(results[1]?.status).toBe('broken-anchor');
  });

  it('fragment-only without sourceFile stays ok (no context to verify)', async () => {
    const builtUrls = new Set<string>();
    const headingSlugsByPage = new Map<string, Set<string>>();
    const opts = makeOpts();

    const links: ExtractedLink[] = [
      { url: '#anywhere', elementType: 'html-a' },
    ];
    const results = await verifyLinks(links, builtUrls, headingSlugsByPage, opts);
    expect(results[0]?.status).toBe('ok');
  });

  it('relative ./index.html#slug normalizes to directory URL and checks anchor', async () => {
    const builtUrls = new Set(['/docs/']);
    const headingSlugsByPage = new Map([
      ['/docs/', new Set(['installation'])],
    ]);
    const opts = makeOpts();

    const links: ExtractedLink[] = [
      { url: './index.html#installation', elementType: 'html-a', sourceFile: 'docs/index.html' },
      { url: './index.html#nope', elementType: 'html-a', sourceFile: 'docs/index.html' },
    ];
    const results = await verifyLinks(links, builtUrls, headingSlugsByPage, opts);
    expect(results[0]?.status).toBe('ok');
    expect(results[1]?.status).toBe('broken-anchor');
  });

  it('external mock httpHead returns 200 -> ok', async () => {
    const mockHttpHead = vi.fn(async () => ({ status: 200, finalUrl: 'https://example.com/' }));
    const builtUrls = new Set<string>();
    const headingSlugsByPage = new Map<string, Set<string>>();
    const opts = makeOpts({ checkExternal: true, httpHead: mockHttpHead });

    const links: ExtractedLink[] = [
      { url: 'https://example.com/', elementType: 'html-a' },
    ];
    const results = await verifyLinks(links, builtUrls, headingSlugsByPage, opts);
    expect(results[0]?.status).toBe('ok');
    expect(mockHttpHead).toHaveBeenCalledWith('https://example.com/');
  });

  it('external mock httpHead returns 404 -> broken-external', async () => {
    const mockHttpHead = vi.fn(async () => ({ status: 404, finalUrl: 'https://example.com/gone/' }));
    const builtUrls = new Set<string>();
    const headingSlugsByPage = new Map<string, Set<string>>();
    const opts = makeOpts({ checkExternal: true, httpHead: mockHttpHead });

    const links: ExtractedLink[] = [
      { url: 'https://example.com/gone/', elementType: 'html-a' },
    ];
    const results = await verifyLinks(links, builtUrls, headingSlugsByPage, opts);
    expect(results[0]?.status).toBe('broken-external');
  });

  it('cache hit short-circuits httpHead (counter test)', async () => {
    const mockHttpHead = vi.fn(async () => ({ status: 200, finalUrl: 'https://example.com/' }));
    const cache: Record<string, unknown> = {
      'https://example.com/': { status: 200, checkedAt: new Date().toISOString(), finalUrl: 'https://example.com/' },
    };
    const readCache = vi.fn(async () => JSON.stringify(cache));
    const writeCache = vi.fn(async () => {});

    const builtUrls = new Set<string>();
    const headingSlugsByPage = new Map<string, Set<string>>();
    const opts = makeOpts({
      checkExternal: true,
      httpHead: mockHttpHead,
      readCache,
      writeCache,
    });

    const links: ExtractedLink[] = [
      { url: 'https://example.com/', elementType: 'html-a' },
    ];
    await verifyLinks(links, builtUrls, headingSlugsByPage, opts);

    // Cache hit — httpHead should NOT be called
    expect(mockHttpHead).not.toHaveBeenCalled();
  });

  it('javascript: URL skipped with unsafe-scheme reason', async () => {
    const builtUrls = new Set<string>();
    const headingSlugsByPage = new Map<string, Set<string>>();
    const opts = makeOpts();

    const links: ExtractedLink[] = [
      { url: 'javascript:alert(1)', elementType: 'html-a' },
    ];
    const results = await verifyLinks(links, builtUrls, headingSlugsByPage, opts);
    expect(results[0]?.status).toBe('skipped');
    expect(results[0]?.reason).toContain('unsafe-scheme');
  });

  it('192.168.x.x with checkExternal blocked by default', async () => {
    const mockHttpHead = vi.fn(async () => ({ status: 200, finalUrl: 'http://192.168.1.1/' }));
    const builtUrls = new Set<string>();
    const headingSlugsByPage = new Map<string, Set<string>>();
    const opts = makeOpts({ checkExternal: true, httpHead: mockHttpHead });

    const links: ExtractedLink[] = [
      { url: 'http://192.168.1.1/', elementType: 'html-a' },
    ];
    const results = await verifyLinks(links, builtUrls, headingSlugsByPage, opts);
    expect(results[0]?.status).toBe('skipped');
    expect(results[0]?.reason).toContain('private-host-blocked');
    expect(mockHttpHead).not.toHaveBeenCalled();
  });

  it('requestBudget cap halts at N requests', async () => {
    let callCount = 0;
    const mockHttpHead = vi.fn(async (url: string) => {
      callCount++;
      return { status: 200, finalUrl: url };
    });
    const builtUrls = new Set<string>();
    const headingSlugsByPage = new Map<string, Set<string>>();
    const opts = makeOpts({ checkExternal: true, httpHead: mockHttpHead, requestBudget: 2 });

    // 5 external links but budget=2 → only 2 HEAD requests
    const links: ExtractedLink[] = [
      { url: 'https://a.example.com/', elementType: 'html-a' },
      { url: 'https://b.example.com/', elementType: 'html-a' },
      { url: 'https://c.example.com/', elementType: 'html-a' },
      { url: 'https://d.example.com/', elementType: 'html-a' },
      { url: 'https://e.example.com/', elementType: 'html-a' },
    ];
    await verifyLinks(links, builtUrls, headingSlugsByPage, opts);
    expect(callCount).toBeLessThanOrEqual(2);
  });

  it('external links are skipped when checkExternal is false (default)', async () => {
    const mockHttpHead = vi.fn();
    const builtUrls = new Set<string>();
    const headingSlugsByPage = new Map<string, Set<string>>();
    const opts = makeOpts({ checkExternal: false, httpHead: mockHttpHead });

    const links: ExtractedLink[] = [
      { url: 'https://example.com/', elementType: 'html-a' },
    ];
    const results = await verifyLinks(links, builtUrls, headingSlugsByPage, opts);
    expect(results[0]?.status).toBe('skipped');
    expect(mockHttpHead).not.toHaveBeenCalled();
  });
});

// ============================================================================
// runLinkCheck end-to-end
// ============================================================================

describe('runLinkCheck', () => {
  it('end-to-end on in-memory FS with one HTML file and one broken link', async () => {
    const files = {
      'build/index.html': `<!DOCTYPE html>
<html><body>
<a href="/about/">About</a>
<a href="/nonexistent/">Broken</a>
</body></html>`,
      'build/about/index.html': `<!DOCTYPE html><html><body><h1>About</h1></body></html>`,
    };

    const { readFile, walkDir } = createLinkCheckFS(files);
    const opts: LinkCheckOptions = { readFile, walkDir, checkExternal: false };

    const results = await runLinkCheck('build', opts);
    const statuses = results.map((r) => r.status);
    expect(statuses).toContain('ok');
    expect(statuses).toContain('broken-internal');

    const broken = results.find((r) => r.status === 'broken-internal');
    expect(broken?.url).toBe('/nonexistent/');
  });
});
