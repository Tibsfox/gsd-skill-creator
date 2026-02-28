import { describe, it, expect } from 'vitest';
import { runAudit } from '../../../src/site/audit';
import type { AuditResult } from '../../../src/site/audit';

/* ---- Mock filesystem for audit ---- */

type ReadFn = (path: string) => Promise<string>;
type WalkFn = (dir: string) => Promise<string[]>;

function createAuditFS(
  files: Record<string, string>,
): { readFile: ReadFn; walkDir: WalkFn } {
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

/* ---- Fixtures: valid build output ---- */

const validCSS = 'body { margin: 0; } h1 { color: #333; }'; // ~44 bytes, well under 15KB
const validSearchJS = 'var s=document.getElementById("q");'; // ~35 bytes, well under 3KB
const validHTML = `<!DOCTYPE html>
<html lang="en">
<head><title>Test</title></head>
<body>
<h1>Test</h1>
<a href="/about/">About</a>
<script type="application/ld+json">[{"@type":"WebPage"}]</script>
</body>
</html>`;

const aboutHTML = `<!DOCTYPE html>
<html lang="en">
<head><title>About</title></head>
<body><h1>About</h1><a href="/">Home</a></body>
</html>`;

const validLlmsTxt = `# Test Site
> Description
## Main
- [Home](https://example.com/): Welcome
- [About](https://example.com/about/): About page
`;

const validSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/</loc></url>
  <url><loc>https://example.com/about/</loc></url>
</urlset>`;

function makeValidBuild(): Record<string, string> {
  return {
    'build/index.html': validHTML,
    'build/about/index.html': aboutHTML,
    'build/assets/style.css': validCSS,
    'build/assets/search.js': validSearchJS,
    'build/llms.txt': validLlmsTxt,
    'build/sitemap.xml': validSitemap,
    'build/robots.txt': 'User-agent: *\nAllow: /',
    'build/AGENTS.md': '# Agent Guide',
    'build/search-index.json': '[{"t":"Home","u":"/"},{"t":"About","u":"/about/"}]',
    'build/feed.xml': '<feed xmlns="http://www.w3.org/2005/Atom"><title>Test</title></feed>',
  };
}

describe('Quality Audit', () => {
  it('passes on valid build output', async () => {
    const { readFile, walkDir } = createAuditFS(makeValidBuild());
    const result: AuditResult = await runAudit('build', { readFile, walkDir });

    expect(result.passed).toBe(true);
    expect(result.checks.length).toBeGreaterThan(0);
    expect(result.checks.every((c) => c.passed)).toBe(true);
  });

  it('enforces CSS size limit', async () => {
    const files = makeValidBuild();
    // Create CSS that exceeds 15KB
    files['build/assets/style.css'] = 'x'.repeat(16_000);
    const { readFile, walkDir } = createAuditFS(files);
    const result = await runAudit('build', { readFile, walkDir });

    expect(result.passed).toBe(false);
    const cssCheck = result.checks.find((c) => c.name === 'css-size');
    expect(cssCheck).toBeDefined();
    expect(cssCheck!.passed).toBe(false);
  });

  it('enforces JS size limit', async () => {
    const files = makeValidBuild();
    // Create JS that exceeds 5KB total
    files['build/assets/search.js'] = 'x'.repeat(6_000);
    const { readFile, walkDir } = createAuditFS(files);
    const result = await runAudit('build', { readFile, walkDir });

    expect(result.passed).toBe(false);
    const jsCheck = result.checks.find((c) => c.name === 'js-size');
    expect(jsCheck).toBeDefined();
    expect(jsCheck!.passed).toBe(false);
  });

  it('detects broken internal links', async () => {
    const files = makeValidBuild();
    // Add HTML with a link to a page that does not exist
    files['build/broken/index.html'] = `<!DOCTYPE html>
<html><head><title>Broken</title></head>
<body><a href="/nonexistent/">Broken Link</a></body>
</html>`;
    const { readFile, walkDir } = createAuditFS(files);
    const result = await runAudit('build', { readFile, walkDir });

    expect(result.passed).toBe(false);
    const linkCheck = result.checks.find((c) => c.name === 'link-integrity');
    expect(linkCheck).toBeDefined();
    expect(linkCheck!.passed).toBe(false);
    expect(linkCheck!.details).toContain('nonexistent');
  });

  it('verifies agent file consistency', async () => {
    const files = makeValidBuild();
    // llms.txt references a URL not in sitemap
    files['build/llms.txt'] = `# Test Site
> Description
## Main
- [Ghost Page](https://example.com/ghost/): Does not exist
`;
    const { readFile, walkDir } = createAuditFS(files);
    const result = await runAudit('build', { readFile, walkDir });

    expect(result.passed).toBe(false);
    const agentCheck = result.checks.find((c) => c.name === 'agent-consistency');
    expect(agentCheck).toBeDefined();
    expect(agentCheck!.passed).toBe(false);
  });

  it('checks deterministic build output', async () => {
    const files = makeValidBuild();
    const { readFile, walkDir } = createAuditFS(files);
    // Deterministic check compares file listing + content hashes
    const result = await runAudit('build', { readFile, walkDir });

    // On a single snapshot, deterministic check should pass
    const detCheck = result.checks.find((c) => c.name === 'deterministic');
    expect(detCheck).toBeDefined();
    expect(detCheck!.passed).toBe(true);
  });
});
