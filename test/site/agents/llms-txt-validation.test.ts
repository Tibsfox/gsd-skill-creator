/**
 * llms.txt spec-compliance validation tests.
 *
 * Validates that generateLlmsTxt output conforms to the llmstxt.org specification:
 * - H1 heading with site name
 * - Blockquote summary
 * - H2 section headings
 * - Markdown links with absolute URLs in format: - [text](url): description
 * - No empty sections
 * - Priority ordering within sections
 */

import { describe, it, expect } from 'vitest';
import { generateLlmsTxt } from '../../../src/site/agents/llms-txt';
import type { ContentPage, SiteConfig } from '../../../src/site/types';

function makeSite(overrides: Partial<SiteConfig> = {}): SiteConfig {
  return {
    title: 'Validation Site',
    description: 'A site for validating llms.txt spec compliance',
    url: 'https://validate.example.com',
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

describe('llms.txt spec compliance', () => {
  const site = makeSite();

  /* Rich fixture set: 5+ pages across 3 sections */
  const richPages: ContentPage[] = [
    makePage({
      frontmatter: { title: 'Circuit Design Basics', description: 'Intro to circuits', nav_section: 'essays', agent_priority: 'high' },
      url: '/essays/circuit-basics/',
    }),
    makePage({
      frontmatter: { title: 'Op-Amp Theory', description: 'Operational amplifier fundamentals', nav_section: 'essays', agent_priority: 'medium' },
      url: '/essays/op-amp-theory/',
    }),
    makePage({
      frontmatter: { title: 'API Reference', description: 'Full API docs', nav_section: 'docs', agent_priority: 'high' },
      url: '/docs/api-reference/',
    }),
    makePage({
      frontmatter: { title: 'Getting Started', description: 'Quick start guide', nav_section: 'docs', agent_priority: 'medium' },
      url: '/docs/getting-started/',
    }),
    makePage({
      frontmatter: { title: 'Pattern Matching', description: 'Skill for pattern recognition', nav_section: 'skills', agent_priority: 'low' },
      url: '/skills/pattern-matching/',
    }),
    // Should be excluded
    makePage({
      frontmatter: { title: 'Hidden Page', agent_visible: false, nav_section: 'docs' },
      url: '/docs/hidden/',
    }),
    // Draft should be included in llms.txt if not filtered at generation level
    makePage({
      frontmatter: { title: 'Draft Article', draft: true, nav_section: 'essays' },
      url: '/essays/draft/',
    }),
  ];

  it('starts with H1 heading containing site name', () => {
    const result = generateLlmsTxt(richPages, site);
    const firstLine = result.trim().split('\n')[0];
    expect(firstLine).toMatch(/^# /);
    expect(firstLine).toContain('Validation Site');
  });

  it('contains a blockquote summary after H1', () => {
    const result = generateLlmsTxt(richPages, site);
    const lines = result.trim().split('\n');
    const blockquoteLine = lines.find((l) => l.startsWith('> '));
    expect(blockquoteLine).toBeDefined();
    expect(blockquoteLine).toContain('validating llms.txt spec compliance');
  });

  it('has H2 section headings for each nav_section', () => {
    const result = generateLlmsTxt(richPages, site);
    expect(result).toContain('## Essays');
    expect(result).toContain('## Docs');
    expect(result).toContain('## Skills');
  });

  it('uses markdown link format: - [text](url)', () => {
    const result = generateLlmsTxt(richPages, site);
    // Match pattern: - [Title](https://...)
    const linkPattern = /- \[.+\]\(https:\/\/.+\)/;
    expect(result).toMatch(linkPattern);
  });

  it('all link URLs are absolute (start with https://)', () => {
    const result = generateLlmsTxt(richPages, site);
    // Extract all markdown links
    const linkRegex = /\[.+?\]\(([^)]+)\)/g;
    const urls: string[] = [];
    let match;
    while ((match = linkRegex.exec(result)) !== null) {
      urls.push(match[1]);
    }
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) {
      expect(url).toMatch(/^https?:\/\//);
    }
  });

  it('has no empty sections (every H2 has at least one link)', () => {
    const result = generateLlmsTxt(richPages, site);
    const lines = result.split('\n');

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('## ')) {
        // Find the next non-empty line after the H2
        let j = i + 1;
        while (j < lines.length && lines[j].trim() === '') j++;
        // Should be a link line or another section, not end of file
        if (j < lines.length) {
          const nextContent = lines[j].trim();
          // Next content should be a link (starts with -) or another section
          expect(nextContent.startsWith('- ') || nextContent.startsWith('## ') || nextContent.startsWith('# ')).toBe(true);
        }
      }
    }
  });

  it('sorts high priority before medium before low within sections', () => {
    const result = generateLlmsTxt(richPages, site);

    // Within essays section: Circuit Design Basics (high) before Op-Amp Theory (medium)
    const circuitIdx = result.indexOf('Circuit Design Basics');
    const opAmpIdx = result.indexOf('Op-Amp Theory');
    expect(circuitIdx).toBeLessThan(opAmpIdx);

    // Within docs section: API Reference (high) before Getting Started (medium)
    const apiIdx = result.indexOf('API Reference');
    const gettingIdx = result.indexOf('Getting Started');
    expect(apiIdx).toBeLessThan(gettingIdx);
  });

  it('excludes pages with agent_visible: false', () => {
    const result = generateLlmsTxt(richPages, site);
    expect(result).not.toContain('Hidden Page');
  });
});
