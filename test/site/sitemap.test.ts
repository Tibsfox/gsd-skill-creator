import { describe, it, expect } from 'vitest';
import {
  generateSitemap,
  generateRobotsTxt,
  generateHtaccess,
} from '../../src/site/sitemap';
import type { ContentPage, SiteConfig } from '../../src/site/types';

function makeSite(): SiteConfig {
  return {
    title: 'Test Site',
    description: 'A test site',
    url: 'https://example.com',
    author: 'Foxy',
    language: 'en',
    buildDate: '2026-02-20',
    agent: {
      llms_txt: true,
      llms_full: true,
      agents_md: true,
      schema_org: true,
      markdown_mirror: true,
    },
    wordpress: {
      url: 'https://wp.example.com',
      api: 'https://wp.example.com/wp-json/wp/v2',
      comments_enabled: true,
      comments_moderation: true,
    },
  };
}

function makePage(
  slug: string,
  priority: 'high' | 'medium' | 'low' = 'medium',
  draft = false,
): ContentPage {
  return {
    frontmatter: {
      title: `Page ${slug}`,
      template: 'page',
      date: '2026-02-15',
      agent_visible: true,
      agent_priority: priority,
      draft,
    },
    content: `<p>${slug}</p>`,
    rawMarkdown: slug,
    sourcePath: `content/${slug}.md`,
    outputPath: `build/${slug}/index.html`,
    url: `/${slug}/`,
    slug,
    toc: [],
    wordCount: 10,
  };
}

describe('generateSitemap', () => {
  it('lists all non-draft pages', () => {
    const pages = [
      makePage('about'),
      makePage('contact'),
      makePage('secret', 'medium', true),
    ];
    const xml = generateSitemap(pages, makeSite());
    expect(xml).toContain('<loc>https://example.com/about/</loc>');
    expect(xml).toContain('<loc>https://example.com/contact/</loc>');
    expect(xml).not.toContain('secret');
  });

  it('maps agent_priority to numeric priority', () => {
    const pages = [
      makePage('high-page', 'high'),
      makePage('med-page', 'medium'),
      makePage('low-page', 'low'),
    ];
    const xml = generateSitemap(pages, makeSite());
    expect(xml).toContain('<priority>0.8</priority>');
    expect(xml).toContain('<priority>0.5</priority>');
    expect(xml).toContain('<priority>0.3</priority>');
  });

  it('uses absolute URLs', () => {
    const pages = [makePage('test')];
    const xml = generateSitemap(pages, makeSite());
    expect(xml).toContain('https://example.com/test/');
    // No relative URLs
    expect(xml).not.toMatch(/<loc>\/[^<]/);
  });
});

describe('generateRobotsTxt', () => {
  it('references sitemap', () => {
    const robots = generateRobotsTxt(makeSite());
    expect(robots).toContain('Sitemap: https://example.com/sitemap.xml');
  });

  it('mentions agent discovery', () => {
    const robots = generateRobotsTxt(makeSite());
    expect(robots).toContain('llms.txt');
    expect(robots).toContain('AGENTS.md');
  });
});

describe('generateHtaccess', () => {
  it('has WordPress rewrite for wp subdirectory', () => {
    const htaccess = generateHtaccess(makeSite());
    expect(htaccess).toContain('wp');
    expect(htaccess).toContain('RewriteEngine');
  });

  it('has 404 fallback', () => {
    const htaccess = generateHtaccess(makeSite());
    expect(htaccess).toContain('404.html');
  });
});
