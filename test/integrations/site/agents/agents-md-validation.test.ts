/**
 * AGENTS.md correctness validation tests.
 *
 * Validates that generateAgentsMd produces correct metadata:
 * - H1 heading with site name
 * - Page listings with absolute URLs
 * - Capability metadata section
 * - All agent-visible pages listed
 */

import { describe, it, expect } from 'vitest';
import { generateAgentsMd } from '../../../../src/integrations/site/agents/agents-md';
import type { ContentPage, SiteConfig } from '../../../../src/integrations/site/types';

function makeSite(overrides: Partial<SiteConfig> = {}): SiteConfig {
  return {
    title: 'Agent Discovery Site',
    description: 'Validation of AGENTS.md correctness',
    url: 'https://agents.example.com',
    author: 'Tester',
    language: 'en',
    buildDate: '2026-03-01',
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

function makePage(overrides: Partial<ContentPage> & { frontmatter: ContentPage['frontmatter'] }): ContentPage {
  return {
    content: '<p>html</p>',
    rawMarkdown: '# content',
    sourcePath: 'test.md',
    outputPath: 'test/index.html',
    url: '/test/',
    slug: 'test',
    toc: [],
    wordCount: 100,
    ...overrides,
  };
}

describe('AGENTS.md correctness validation', () => {
  const site = makeSite();

  const pages: ContentPage[] = [
    makePage({
      frontmatter: { title: 'Introduction', description: 'Getting started', nav_section: 'foundations', agent_priority: 'high' },
      url: '/foundations/introduction/',
    }),
    makePage({
      frontmatter: { title: 'Advanced Topics', description: 'Deep dive', nav_section: 'essays', agent_priority: 'medium' },
      url: '/essays/advanced/',
    }),
    makePage({
      frontmatter: { title: 'Hidden Config', agent_visible: false, nav_section: 'admin' },
      url: '/admin/config/',
    }),
  ];

  it('contains H1 heading with site name', () => {
    const result = generateAgentsMd(pages, site);
    expect(result).toMatch(/^# Agent Discovery Site/m);
  });

  it('lists agent-visible pages with titles', () => {
    const result = generateAgentsMd(pages, site);
    expect(result).toContain('Introduction');
    expect(result).toContain('Advanced Topics');
  });

  it('does not list hidden pages', () => {
    const result = generateAgentsMd(pages, site);
    expect(result).not.toContain('Hidden Config');
  });

  it('contains absolute URLs for the site', () => {
    const result = generateAgentsMd(pages, site);
    expect(result).toContain('https://agents.example.com');
  });

  it('contains capability metadata section', () => {
    const result = generateAgentsMd(pages, site);
    // Should have sections about how to use the site
    expect(result).toContain('## How to use this site');
    expect(result).toContain('llms.txt');
  });

  it('contains citation guidance', () => {
    const result = generateAgentsMd(pages, site);
    expect(result).toContain('## Citation guidance');
  });

  it('lists content sections with page counts', () => {
    const result = generateAgentsMd(pages, site);
    expect(result).toContain('foundations');
    expect(result).toContain('essays');
  });

  it('lists key resources by priority', () => {
    const result = generateAgentsMd(pages, site);
    expect(result).toContain('## Key resources');
    // High priority should appear
    expect(result).toContain('Introduction');
  });
});
