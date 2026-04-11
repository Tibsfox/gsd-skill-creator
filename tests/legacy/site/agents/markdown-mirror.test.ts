import { describe, it, expect } from 'vitest';
import { generateMarkdownMirror } from '../../../src/site/agents/markdown-mirror';
import type { ContentPage } from '../../../src/site/types';

function makePage(overrides: Partial<ContentPage> & { frontmatter: ContentPage['frontmatter'] }): ContentPage {
  return {
    content: '<p>html</p>',
    rawMarkdown: '# content\n\nParagraph text.',
    sourcePath: 'test.md',
    outputPath: 'test/index.html',
    url: '/test/',
    slug: 'test',
    toc: [],
    wordCount: 100,
    ...overrides,
  };
}

describe('generateMarkdownMirror', () => {
  it('produces correct output paths preserving directory structure', () => {
    const pages: ContentPage[] = [
      makePage({
        frontmatter: { title: 'Deep Page' },
        sourcePath: 'foundations/electronics/resistors.md',
        rawMarkdown: '# Resistors\n\nResistors resist.',
      }),
      makePage({
        frontmatter: { title: 'Top Page' },
        sourcePath: 'index.md',
        rawMarkdown: '# Home\n\nWelcome.',
      }),
    ];
    const result = generateMarkdownMirror(pages);

    expect(result).toHaveLength(2);
    expect(result[0].path).toBe('docs/foundations/electronics/resistors.md');
    expect(result[1].path).toBe('docs/index.md');
  });

  it('uses rawMarkdown as content (frontmatter already stripped)', () => {
    const pages: ContentPage[] = [
      makePage({
        frontmatter: { title: 'Clean Page' },
        sourcePath: 'clean.md',
        rawMarkdown: '# Clean Page\n\nNo frontmatter here.',
      }),
    ];
    const result = generateMarkdownMirror(pages);

    expect(result[0].content).toBe('# Clean Page\n\nNo frontmatter here.');
    expect(result[0].content).not.toContain('---');
  });

  it('only includes agent-visible pages', () => {
    const pages: ContentPage[] = [
      makePage({
        frontmatter: { title: 'Visible' },
        sourcePath: 'visible.md',
      }),
      makePage({
        frontmatter: { title: 'Hidden', agent_visible: false },
        sourcePath: 'hidden.md',
      }),
    ];
    const result = generateMarkdownMirror(pages);

    expect(result).toHaveLength(1);
    expect(result[0].path).toBe('docs/visible.md');
  });
});
