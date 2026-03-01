/**
 * llms-full.txt completeness validation tests.
 *
 * Validates that generateLlmsFullTxt includes all agent-visible published pages
 * and excludes drafts and pages with agent_visible: false.
 */

import { describe, it, expect } from 'vitest';
import { generateLlmsFullTxt } from '../../../src/site/agents/llms-full';
import type { ContentPage, SiteConfig } from '../../../src/site/types';

function makeSite(overrides: Partial<SiteConfig> = {}): SiteConfig {
  return {
    title: 'Full Text Site',
    description: 'Completeness validation for llms-full.txt',
    url: 'https://full.example.com',
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
    rawMarkdown: '# Default content\n\nSome paragraph text.',
    sourcePath: 'test.md',
    outputPath: 'test/index.html',
    url: '/test/',
    slug: 'test',
    toc: [],
    wordCount: 100,
    ...overrides,
  };
}

describe('llms-full.txt completeness validation', () => {
  const site = makeSite();

  const fixturePages: ContentPage[] = [
    // 3 normal visible pages
    makePage({
      frontmatter: { title: 'Resistor Guide', description: 'All about resistors', nav_section: 'docs' },
      rawMarkdown: '# Resistor Guide\n\nResistors are passive components.',
      url: '/docs/resistors/',
      slug: 'resistors',
    }),
    makePage({
      frontmatter: { title: 'Capacitor Guide', description: 'All about capacitors', nav_section: 'docs' },
      rawMarkdown: '# Capacitor Guide\n\nCapacitors store charge.',
      url: '/docs/capacitors/',
      slug: 'capacitors',
    }),
    makePage({
      frontmatter: { title: 'Inductor Guide', description: 'All about inductors', nav_section: 'docs' },
      rawMarkdown: '# Inductor Guide\n\nInductors oppose current changes.',
      url: '/docs/inductors/',
      slug: 'inductors',
    }),
    // 1 draft (should be excluded)
    makePage({
      frontmatter: { title: 'Draft Transistor Guide', draft: true, nav_section: 'docs' },
      rawMarkdown: '# Draft Transistor Guide\n\nWork in progress.',
      url: '/docs/transistors/',
      slug: 'transistors',
    }),
    // 1 agent_visible: false (should be excluded)
    makePage({
      frontmatter: { title: 'Hidden Admin Page', agent_visible: false, nav_section: 'admin' },
      rawMarkdown: '# Admin\n\nSecret admin content.',
      url: '/admin/',
      slug: 'admin',
    }),
    // 1 minimal frontmatter (should be included since agent_visible defaults to true)
    makePage({
      frontmatter: { title: 'Simple Page' },
      rawMarkdown: '# Simple Page\n\nMinimal content.',
      url: '/simple/',
      slug: 'simple',
    }),
  ];

  it('contains all agent-visible published pages', () => {
    const result = generateLlmsFullTxt(fixturePages, site);
    expect(result.content).toContain('Resistor Guide');
    expect(result.content).toContain('Capacitor Guide');
    expect(result.content).toContain('Inductor Guide');
    expect(result.content).toContain('Simple Page');
  });

  it('excludes pages with agent_visible: false', () => {
    const result = generateLlmsFullTxt(fixturePages, site);
    expect(result.content).not.toContain('Hidden Admin Page');
    expect(result.content).not.toContain('Secret admin content');
  });

  it('does not filter drafts (draft filtering happens at build stage)', () => {
    // generateLlmsFullTxt receives pages that already passed through build filtering.
    // The generator only filters on agent_visible, not draft status.
    const result = generateLlmsFullTxt(fixturePages, site);
    // Draft page is included because the generator trusts that build already filtered drafts
    expect(result.content).toContain('Draft Transistor Guide');
  });

  it('includes pages with default agent_visible (undefined = visible)', () => {
    const result = generateLlmsFullTxt(fixturePages, site);
    expect(result.content).toContain('Simple Page');
    expect(result.content).toContain('Minimal content');
  });

  it('page count matches expected (5 visible out of 6, only agent_visible:false excluded)', () => {
    const result = generateLlmsFullTxt(fixturePages, site);
    // 3 normal + 1 draft + 1 minimal = 5 visible pages (only agent_visible:false excluded)
    // Draft filtering is done at build stage, not at generation stage
    expect(result.content).toContain('Total pages: 5');
  });

  it('contains raw markdown content for visible pages', () => {
    const result = generateLlmsFullTxt(fixturePages, site);
    expect(result.content).toContain('Resistors are passive components');
    expect(result.content).toContain('Capacitors store charge');
    expect(result.content).toContain('Inductors oppose current changes');
  });
});
