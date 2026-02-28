import { describe, it, expect, beforeEach } from 'vitest';
import {
  processMarkdown,
  resetCitationCounter,
  getCitationMap,
} from '../../../src/integrations/site/markdown';

describe('Markdown Processor', () => {
  beforeEach(() => {
    resetCitationCounter();
  });

  describe('basic rendering', () => {
    it('renders a paragraph', () => {
      const { html } = processMarkdown('Hello world');
      expect(html).toContain('<p>Hello world</p>');
    });

    it('renders headings h1-h6 with slugified IDs', () => {
      const md = [
        '# Heading One',
        '## Heading Two',
        '### Heading Three',
        '#### Heading Four',
        '##### Heading Five',
        '###### Heading Six',
      ].join('\n\n');
      const { html } = processMarkdown(md);
      expect(html).toContain('<h1 id="heading-one">Heading One</h1>');
      expect(html).toContain('<h2 id="heading-two">Heading Two</h2>');
      expect(html).toContain('<h3 id="heading-three">Heading Three</h3>');
      expect(html).toContain('<h4 id="heading-four">Heading Four</h4>');
      expect(html).toContain('<h5 id="heading-five">Heading Five</h5>');
      expect(html).toContain('<h6 id="heading-six">Heading Six</h6>');
    });

    it('renders fenced code blocks with language class', () => {
      const md = '```typescript\nconst x = 1;\n```';
      const { html } = processMarkdown(md);
      expect(html).toContain('<code class="language-typescript">');
      expect(html).toContain('const x = 1;');
    });

    it('renders inline code', () => {
      const { html } = processMarkdown('Use `const` for constants');
      expect(html).toContain('<code>const</code>');
    });

    it('renders internal links without target=_blank', () => {
      const { html } = processMarkdown('[About](/about/)');
      expect(html).toContain('href="/about/"');
      expect(html).not.toContain('target="_blank"');
    });

    it('renders external links with target=_blank and rel=noopener', () => {
      const { html } = processMarkdown('[GitHub](https://github.com)');
      expect(html).toContain('href="https://github.com"');
      expect(html).toContain('target="_blank"');
      expect(html).toContain('rel="noopener"');
    });

    it('renders ordered and unordered lists', () => {
      const ul = '- item a\n- item b';
      const ol = '1. first\n2. second';
      const { html: ulHtml } = processMarkdown(ul);
      const { html: olHtml } = processMarkdown(ol);
      expect(ulHtml).toContain('<ul>');
      expect(ulHtml).toContain('<li>item a</li>');
      expect(olHtml).toContain('<ol>');
      expect(olHtml).toContain('<li>first</li>');
    });

    it('renders blockquotes', () => {
      const { html } = processMarkdown('> A wise quote');
      expect(html).toContain('<blockquote>');
      expect(html).toContain('A wise quote');
    });

    it('renders emphasis and strong', () => {
      const { html } = processMarkdown('*italic* and **bold**');
      expect(html).toContain('<em>italic</em>');
      expect(html).toContain('<strong>bold</strong>');
    });

    it('renders images', () => {
      const { html } = processMarkdown('![alt text](/img/photo.jpg)');
      expect(html).toContain('<img');
      expect(html).toContain('src="/img/photo.jpg"');
      expect(html).toContain('alt="alt text"');
    });
  });

  describe('citation syntax', () => {
    it('converts [@key] to superscript citation link', () => {
      const { html } = processMarkdown('See [@knuth1997].');
      expect(html).toContain('<sup class="cite">');
      expect(html).toContain('href="/bibliography/#knuth1997"');
      expect(html).toContain('[1]');
    });

    it('converts multiple citations [@a; @b] to grouped links', () => {
      const { html } = processMarkdown('Research [@alpha; @beta] shows...');
      expect(html).toContain('<sup class="cite">');
      expect(html).toContain('[1]</a>');
      expect(html).toContain('[2]</a>');
      expect(html).toContain('href="/bibliography/#alpha"');
      expect(html).toContain('href="/bibliography/#beta"');
    });

    it('numbers citations sequentially across the document', () => {
      const md = 'First [@aaa]. Second [@bbb]. Third [@aaa] again.';
      const { html } = processMarkdown(md);
      // aaa gets 1, bbb gets 2, aaa again is still 1
      expect(html).toMatch(/\[1\].*\[2\].*\[1\]/s);
    });

    it('resets citation counter between pages', () => {
      processMarkdown('See [@first].');
      const map1 = getCitationMap();
      expect(map1.get('first')).toBe(1);

      resetCitationCounter();

      processMarkdown('See [@second].');
      const map2 = getCitationMap();
      expect(map2.get('second')).toBe(1);
      expect(map2.has('first')).toBe(false);
    });
  });

  describe('TOC extraction', () => {
    it('extracts TOC entries from headings', () => {
      const md = '# Title\n\n## Section One\n\n### Sub Section\n\n## Section Two';
      const { toc } = processMarkdown(md);
      expect(toc).toHaveLength(4);
      expect(toc[0]).toEqual({ level: 1, text: 'Title', id: 'title' });
      expect(toc[1]).toEqual({ level: 2, text: 'Section One', id: 'section-one' });
      expect(toc[2]).toEqual({ level: 3, text: 'Sub Section', id: 'sub-section' });
      expect(toc[3]).toEqual({ level: 2, text: 'Section Two', id: 'section-two' });
    });
  });

  describe('edge cases', () => {
    it('handles special characters in headings with slugified IDs', () => {
      const { html } = processMarkdown('## Hello & World! (2026)');
      // & and ! are stripped, () stripped, spaces become hyphens
      expect(html).toContain('id="hello-world-2026"');
    });

    it('returns empty html for empty markdown', () => {
      const { html, toc } = processMarkdown('');
      expect(html).toBe('');
      expect(toc).toEqual([]);
    });

    it('handles markdown with HTML entities', () => {
      const { html } = processMarkdown('Use `<div>` and `&amp;` in code');
      expect(html).toContain('&lt;div&gt;');
      expect(html).toContain('&amp;amp;');
    });
  });
});
