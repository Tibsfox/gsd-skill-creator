import { describe, it, expect } from 'vitest';
import { generateCommentSection } from '../../../../src/site/wordpress/comments';
import type { ContentPage, WordPressConfig } from '../../../../src/site/types';

function makePage(overrides: Partial<ContentPage['frontmatter']> = {}): ContentPage {
  return {
    frontmatter: {
      title: 'Test Page',
      template: 'page',
      agent_visible: true,
      agent_priority: 'medium',
      draft: false,
      comments: true,
      wp_post_id: 42,
      ...overrides,
    },
    content: '<p>Hello</p>',
    rawMarkdown: '# Hello',
    sourcePath: 'content/test.md',
    outputPath: 'build/test/index.html',
    url: '/test/',
    slug: 'test',
    toc: [],
    wordCount: 1,
  };
}

const wpConfig: WordPressConfig = {
  url: 'https://wp.example.com',
  api: 'https://wp.example.com/wp-json/wp/v2',
  comments_enabled: true,
  comments_moderation: true,
};

describe('generateCommentSection', () => {
  it('generates comment section for page with comments enabled', () => {
    const result = generateCommentSection(makePage(), wpConfig);
    expect(result).not.toBeNull();
    expect(typeof result).toBe('string');
    expect(result).toContain('data-wp-post-id="42"');
  });

  it('returns null for page without comments flag', () => {
    const result = generateCommentSection(makePage({ comments: false }), wpConfig);
    expect(result).toBeNull();
  });

  it('returns null for page without wp_post_id', () => {
    const result = generateCommentSection(
      makePage({ comments: true, wp_post_id: undefined }),
      wpConfig,
    );
    expect(result).toBeNull();
  });

  it('contains correct data attributes on container', () => {
    const result = generateCommentSection(makePage(), wpConfig)!;
    expect(result).toContain('data-wp-post-id="42"');
    expect(result).toContain('data-wp-api="https://wp.example.com/wp-json/wp/v2"');
  });

  it('includes noscript fallback link', () => {
    const result = generateCommentSection(makePage(), wpConfig)!;
    expect(result).toContain('<noscript>');
    expect(result).toContain('https://wp.example.com');
  });

  it('includes script loader tag', () => {
    const result = generateCommentSection(makePage(), wpConfig)!;
    expect(result).toContain('<script');
    expect(result).toContain('comments.js');
  });

  it('has valid HTML structure with requires-js class', () => {
    const result = generateCommentSection(makePage(), wpConfig)!;
    expect(result).toContain('class="wp-comments requires-js"');
    expect(result).toContain('<section');
    expect(result).toContain('</section>');
  });

  it('uses API URL from config', () => {
    const customConfig: WordPressConfig = {
      ...wpConfig,
      api: 'https://custom.api.com/wp/v2',
    };
    const result = generateCommentSection(makePage(), customConfig)!;
    expect(result).toContain('data-wp-api="https://custom.api.com/wp/v2"');
  });
});
