import { describe, it, expect, vi } from 'vitest';
import { pullContent, pushContent } from '../../../../src/integrations/site/wordpress/wp-sync';
import type { WpApiAdapter, WpApiPushAdapter, WpPost } from '../../../../src/integrations/site/wordpress/wp-sync';

const samplePost: WpPost = {
  id: 101,
  title: 'Hello World',
  content: '<p>Welcome to <strong>WordPress</strong>.</p>',
  date: '2026-01-15T10:00:00',
  modified: '2026-02-01T12:00:00',
  slug: 'hello-world',
  categories: ['Uncategorized'],
  tags: ['intro'],
  link: 'https://wp.example.com/hello-world/',
};

describe('pullContent', () => {
  it('generates correct frontmatter from WP metadata', async () => {
    const api: WpApiAdapter = {
      fetchPosts: vi.fn().mockResolvedValue([samplePost]),
    };
    const files: Record<string, string> = {};
    const writeFn = vi.fn(async (path: string, content: string) => {
      files[path] = content;
    });

    const result = await pullContent(api, '/output', { writeFn });
    expect(result.pulled).toBe(1);
    const content = files['/output/hello-world.md'];
    expect(content).toBeDefined();
    expect(content).toContain('title: "Hello World"');
    expect(content).toContain('wp_post_id: 101');
  });

  it('converts HTML content to markdown', async () => {
    const api: WpApiAdapter = {
      fetchPosts: vi.fn().mockResolvedValue([samplePost]),
    };
    const files: Record<string, string> = {};
    const writeFn = vi.fn(async (path: string, content: string) => {
      files[path] = content;
    });

    await pullContent(api, '/output', { writeFn });
    const content = files['/output/hello-world.md'];
    expect(content).toContain('**WordPress**');
  });

  it('writes files to correct paths', async () => {
    const api: WpApiAdapter = {
      fetchPosts: vi.fn().mockResolvedValue([samplePost]),
    };
    const writeFn = vi.fn(async () => {});

    await pullContent(api, '/my/output', { writeFn });
    expect(writeFn).toHaveBeenCalledWith(
      '/my/output/hello-world.md',
      expect.any(String),
    );
  });
});

describe('pushContent', () => {
  const mdWithId = `---
title: "Hello World"
wp_post_id: 101
---
Updated content here.`;

  const mdWithoutId = `---
title: "New Post"
---
Brand new content.`;

  it('reads and converts markdown for push', async () => {
    const api: WpApiPushAdapter = {
      createPost: vi.fn().mockResolvedValue({ id: 200 }),
      updatePost: vi.fn().mockResolvedValue(undefined),
    };
    const readFn = vi.fn().mockResolvedValue(mdWithId);

    const result = await pushContent(api, '/path/hello.md', readFn);
    expect(result.action).toBe('updated');
    expect(api.updatePost).toHaveBeenCalledWith(101, expect.objectContaining({
      title: 'Hello World',
    }));
  });

  it('creates new post when no wp_post_id', async () => {
    const api: WpApiPushAdapter = {
      createPost: vi.fn().mockResolvedValue({ id: 200 }),
      updatePost: vi.fn().mockResolvedValue(undefined),
    };
    const readFn = vi.fn().mockResolvedValue(mdWithoutId);

    const result = await pushContent(api, '/path/new.md', readFn);
    expect(result.action).toBe('created');
    expect(result.postId).toBe(200);
    expect(api.createPost).toHaveBeenCalled();
  });

  it('updates existing post when wp_post_id present', async () => {
    const api: WpApiPushAdapter = {
      createPost: vi.fn().mockResolvedValue({ id: 999 }),
      updatePost: vi.fn().mockResolvedValue(undefined),
    };
    const readFn = vi.fn().mockResolvedValue(mdWithId);

    const result = await pushContent(api, '/path/hello.md', readFn);
    expect(result.action).toBe('updated');
    expect(result.postId).toBe(101);
    expect(api.updatePost).toHaveBeenCalledWith(101, expect.any(Object));
    expect(api.createPost).not.toHaveBeenCalled();
  });
});
