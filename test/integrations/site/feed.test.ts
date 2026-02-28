import { describe, it, expect } from 'vitest';
import { generateAtomFeed } from '../../../src/integrations/site/feed';
import type { ContentPage, SiteConfig } from '../../../src/integrations/site/types';

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
  };
}

function makePage(slug: string, date: string, draft = false): ContentPage {
  return {
    frontmatter: {
      title: `Page ${slug}`,
      description: `Description of ${slug}`,
      template: 'page',
      date,
      agent_visible: true,
      agent_priority: 'medium',
      draft,
    },
    content: `<p>Content of ${slug}</p>`,
    rawMarkdown: `Content of ${slug}`,
    sourcePath: `content/${slug}.md`,
    outputPath: `build/${slug}/index.html`,
    url: `/${slug}/`,
    slug,
    toc: [],
    wordCount: 50,
  };
}

describe('generateAtomFeed', () => {
  it('produces valid Atom XML structure', () => {
    const pages = [makePage('hello', '2026-02-15')];
    const xml = generateAtomFeed(pages, makeSite());
    expect(xml).toContain('<?xml version="1.0" encoding="utf-8"?>');
    expect(xml).toContain('<feed xmlns="http://www.w3.org/2005/Atom">');
    expect(xml).toContain('</feed>');
  });

  it('limits to latest 20 pages', () => {
    const pages: ContentPage[] = [];
    for (let i = 0; i < 25; i++) {
      pages.push(makePage(`page-${i}`, `2026-01-${String(i + 1).padStart(2, '0')}`));
    }
    const xml = generateAtomFeed(pages, makeSite());
    const entryCount = (xml.match(/<entry>/g) || []).length;
    expect(entryCount).toBeLessThanOrEqual(20);
  });

  it('includes required Atom entry fields', () => {
    const pages = [makePage('test', '2026-02-10')];
    const xml = generateAtomFeed(pages, makeSite());
    expect(xml).toContain('<title>Page test</title>');
    expect(xml).toContain('<link href="https://example.com/test/"');
    expect(xml).toContain('<updated>');
    expect(xml).toContain('<summary>');
  });

  it('includes feed-level metadata', () => {
    const pages = [makePage('a', '2026-01-01')];
    const xml = generateAtomFeed(pages, makeSite());
    expect(xml).toContain('<title>Test Site</title>');
    expect(xml).toContain('<subtitle>A test site</subtitle>');
    expect(xml).toContain('<author>');
    expect(xml).toContain('<name>Foxy</name>');
  });
});
