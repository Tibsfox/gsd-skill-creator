import { describe, it, expect } from 'vitest';
import { renderStyles } from './styles.js';
import { renderMetricsStyles } from './metrics/metrics-styles.js';
import { renderNav, renderLayout } from './renderer.js';
import type { NavPage, LayoutOptions } from './renderer.js';

// ---------------------------------------------------------------------------
// renderStyles
// ---------------------------------------------------------------------------

describe('renderStyles', () => {
  const css = renderStyles();

  it('returns a non-empty CSS string', () => {
    expect(typeof css).toBe('string');
    expect(css.length).toBeGreaterThan(0);
  });

  it('contains key theme variables', () => {
    // Dark theme custom properties
    expect(css).toContain('--bg');
    expect(css).toContain('--surface');
    expect(css).toContain('--accent');
    expect(css).toContain('--text');
    expect(css).toContain('--green');
    expect(css).toContain('--border');
  });

  it('contains responsive media queries', () => {
    expect(css).toContain('@media');
    // At least one breakpoint for smaller screens
    expect(css).toMatch(/max-width:\s*\d+px/);
  });

  it('contains no external URLs beyond font imports', () => {
    // Google Fonts @import is allowed (progressive enhancement with system font fallbacks).
    // Strip font imports, then verify no other http(s):// URLs remain.
    const stripped = css.replace(/@import url\([^)]*fonts\.googleapis\.com[^)]*\);?/g, '');
    expect(stripped).not.toMatch(/https?:\/\//);
  });

  it('includes layout styles', () => {
    expect(css).toContain('body');
    expect(css).toContain('header');
    expect(css).toContain('main');
    expect(css).toContain('footer');
  });

  it('includes component styles for stats grid and cards', () => {
    expect(css).toContain('.stats-grid');
    expect(css).toContain('.card');
  });

  it('includes table styles', () => {
    expect(css).toContain('table');
    expect(css).toContain('th');
    expect(css).toContain('td');
  });

  it('includes navigation styles', () => {
    expect(css).toContain('nav');
    expect(css).toContain('.nav-link');
  });

  it('includes code block styles', () => {
    expect(css).toContain('pre');
    expect(css).toContain('code');
  });

  it('includes timeline styles', () => {
    expect(css).toContain('.timeline');
  });

  // -------------------------------------------------------------------------
  // Layout CSS verification (152-01)
  // -------------------------------------------------------------------------

  it('includes dashboard two-column grid styles', () => {
    expect(css).toContain('.dashboard-grid');
    expect(css).toContain('.dashboard-terminal-col');
    expect(css).toContain('.dashboard-info-col');
  });

  it('includes compact card styles', () => {
    expect(css).toContain('.compact-card');
    expect(css).toContain('.compact-title');
  });

  it('quality section has overflow-y auto', () => {
    const metricsCss = renderMetricsStyles();
    expect(metricsCss).toContain('.quality-section');
    expect(metricsCss).toContain('overflow-y');
  });

  it('history section has overflow-y auto', () => {
    const metricsCss = renderMetricsStyles();
    expect(metricsCss).toContain('.history-section');
    expect(metricsCss).toContain('overflow-y');
  });
});

// ---------------------------------------------------------------------------
// renderNav
// ---------------------------------------------------------------------------

describe('renderNav', () => {
  const pages: NavPage[] = [
    { name: 'index', path: 'index.html', label: 'Dashboard' },
    { name: 'roadmap', path: 'roadmap.html', label: 'Roadmap' },
    { name: 'requirements', path: 'requirements.html', label: 'Requirements' },
  ];

  it('returns a string containing a <nav> element', () => {
    const html = renderNav(pages, 'index');
    expect(html).toContain('<nav');
    expect(html).toContain('</nav>');
  });

  it('generates a link for each page', () => {
    const html = renderNav(pages, 'index');
    expect(html).toContain('href="index.html"');
    expect(html).toContain('href="roadmap.html"');
    expect(html).toContain('href="requirements.html"');
  });

  it('includes page labels as link text', () => {
    const html = renderNav(pages, 'index');
    expect(html).toContain('Dashboard');
    expect(html).toContain('Roadmap');
    expect(html).toContain('Requirements');
  });

  it('marks the current page as active', () => {
    const html = renderNav(pages, 'roadmap');
    // The link for roadmap should have an active class/attribute
    // while others should not (for the same element)
    expect(html).toMatch(/class="[^"]*active[^"]*"[^>]*>.*?Roadmap/s);
  });

  it('does not mark non-current pages as active', () => {
    const html = renderNav(pages, 'roadmap');
    // Dashboard link should not have active class
    const dashboardLink = html.match(/<a[^>]*href="index\.html"[^>]*>/);
    expect(dashboardLink).toBeDefined();
    expect(dashboardLink![0]).not.toContain('active');
  });

  it('handles empty page list', () => {
    const html = renderNav([], 'index');
    expect(html).toContain('<nav');
    expect(html).toContain('</nav>');
  });
});

// ---------------------------------------------------------------------------
// renderLayout
// ---------------------------------------------------------------------------

describe('renderLayout', () => {
  const baseOptions: LayoutOptions = {
    title: 'Test Dashboard',
    content: '<p>Hello World</p>',
    nav: '<nav><a href="index.html">Home</a></nav>',
    projectName: 'My Project',
    generatedAt: '2026-02-12T10:00:00Z',
    styles: 'body { color: white; }',
  };

  it('returns a complete HTML5 document', () => {
    const html = renderLayout(baseOptions);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html');
    expect(html).toContain('</html>');
  });

  it('sets html lang attribute', () => {
    const html = renderLayout(baseOptions);
    expect(html).toMatch(/<html\s+lang="en"/);
  });

  it('includes charset meta tag', () => {
    const html = renderLayout(baseOptions);
    expect(html).toContain('<meta charset="UTF-8"');
  });

  it('includes viewport meta tag', () => {
    const html = renderLayout(baseOptions);
    expect(html).toContain('<meta name="viewport"');
    expect(html).toContain('width=device-width');
  });

  it('includes the page title in <title>', () => {
    const html = renderLayout(baseOptions);
    expect(html).toContain('<title>Test Dashboard</title>');
  });

  it('embeds styles in a <style> tag', () => {
    const html = renderLayout(baseOptions);
    expect(html).toContain('<style>');
    expect(html).toContain('body { color: white; }');
    expect(html).toContain('</style>');
  });

  it('contains no external CSS/JS URLs', () => {
    const html = renderLayout(baseOptions);
    // No <link rel="stylesheet" href="http..."> or <script src="http...">
    expect(html).not.toMatch(/<link[^>]*href="https?:\/\//);
    expect(html).not.toMatch(/<script[^>]*src="https?:\/\//);
  });

  it('includes a <header> with the project name', () => {
    const html = renderLayout(baseOptions);
    expect(html).toContain('<header');
    expect(html).toContain('My Project');
  });

  it('includes the nav element', () => {
    const html = renderLayout(baseOptions);
    expect(html).toContain('<nav>');
    expect(html).toContain('Home');
  });

  it('includes a <main> element with the content', () => {
    const html = renderLayout(baseOptions);
    expect(html).toContain('<main');
    expect(html).toContain('<p>Hello World</p>');
    expect(html).toContain('</main>');
  });

  it('includes a <footer> with the generation timestamp', () => {
    const html = renderLayout(baseOptions);
    expect(html).toContain('<footer');
    expect(html).toContain('2026-02-12T10:00:00Z');
    expect(html).toContain('</footer>');
  });

  it('includes optional meta description when provided', () => {
    const html = renderLayout({
      ...baseOptions,
      meta: { description: 'A project dashboard' },
    });
    expect(html).toContain('<meta name="description"');
    expect(html).toContain('A project dashboard');
  });

  it('includes JSON-LD when provided', () => {
    const jsonLd = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
    });
    const html = renderLayout({
      ...baseOptions,
      jsonLd,
    });
    expect(html).toContain('<script type="application/ld+json">');
    expect(html).toContain(jsonLd);
  });

  it('does not include JSON-LD script tag when not provided', () => {
    const html = renderLayout(baseOptions);
    expect(html).not.toContain('application/ld+json');
  });

  it('produces valid structure ordering: doctype, html, head, body', () => {
    const html = renderLayout(baseOptions);
    const doctypePos = html.indexOf('<!DOCTYPE html>');
    const htmlPos = html.indexOf('<html');
    const headPos = html.indexOf('<head');
    const bodyPos = html.indexOf('<body');
    const headerPos = html.indexOf('<header');
    const mainPos = html.indexOf('<main');
    const footerPos = html.indexOf('<footer');

    expect(doctypePos).toBeLessThan(htmlPos);
    expect(htmlPos).toBeLessThan(headPos);
    expect(headPos).toBeLessThan(bodyPos);
    expect(bodyPos).toBeLessThan(headerPos);
    expect(headerPos).toBeLessThan(mainPos);
    expect(mainPos).toBeLessThan(footerPos);
  });
});
