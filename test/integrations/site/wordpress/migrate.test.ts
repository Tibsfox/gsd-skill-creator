import { describe, it, expect } from 'vitest';
import { migrateAllContent } from '../../../src/site/wordpress/migrate';
import type { MigrateAdapter } from '../../../src/site/wordpress/migrate';
import type { WpPost } from '../../../src/site/wordpress/wp-sync';

/* ---- Fixtures ---- */

function makePost(overrides: Partial<WpPost> = {}): WpPost {
  return {
    id: 42,
    title: 'Release v1.50',
    content: '<p>The <strong>Unit Circle</strong> milestone.</p>',
    date: '2026-02-28T12:00:00',
    modified: '2026-02-28T14:00:00',
    slug: 'release-v1-50',
    categories: ['Releases'],
    tags: ['release-notes'],
    link: 'https://example.com/release-v1-50/',
    ...overrides,
  };
}

function makePage(overrides: Partial<WpPost> = {}): WpPost {
  return {
    id: 10,
    title: 'About the Project',
    content: '<p>About page content.</p>',
    date: '2026-01-15T10:00:00',
    modified: '2026-01-20T11:00:00',
    slug: 'about-project',
    categories: ['Pages'],
    tags: [],
    link: 'https://example.com/about-project/',
    ...overrides,
  };
}

function createMockAdapter(
  posts: WpPost[] = [makePost()],
  pages: WpPost[] = [makePage()],
): MigrateAdapter {
  return {
    async fetchPosts() {
      return posts;
    },
    async fetchPages() {
      return pages;
    },
  };
}

/* ---- Tests ---- */

describe('migrateAllContent', () => {
  it('migrates posts to releases/ subdirectory', async () => {
    const written: Map<string, string> = new Map();
    const adapter = createMockAdapter();

    await migrateAllContent(adapter, '/content', {
      writeFn: async (path, content) => {
        written.set(path, content);
      },
    });

    expect(written.has('/content/releases/release-v1-50.md')).toBe(true);
  });

  it('migrates pages to docs/ subdirectory', async () => {
    const written: Map<string, string> = new Map();
    const adapter = createMockAdapter();

    await migrateAllContent(adapter, '/content', {
      writeFn: async (path, content) => {
        written.set(path, content);
      },
    });

    expect(written.has('/content/docs/about-project.md')).toBe(true);
  });

  it('includes wp_post_id and wp_sync in frontmatter', async () => {
    const written: Map<string, string> = new Map();
    const adapter = createMockAdapter();

    await migrateAllContent(adapter, '/content', {
      writeFn: async (path, content) => {
        written.set(path, content);
      },
    });

    const postContent = written.get('/content/releases/release-v1-50.md')!;
    expect(postContent).toContain('wp_post_id: 42');
    expect(postContent).toContain('wp_sync: true');
    expect(postContent).toContain('original_url:');
    expect(postContent).toContain('slug: "release-v1-50"');
  });

  it('converts HTML to markdown', async () => {
    const written: Map<string, string> = new Map();
    const adapter = createMockAdapter();

    await migrateAllContent(adapter, '/content', {
      writeFn: async (path, content) => {
        written.set(path, content);
      },
    });

    const postContent = written.get('/content/releases/release-v1-50.md')!;
    // htmlToMarkdown converts <strong> to **
    expect(postContent).toContain('**Unit Circle**');
    // Should not contain raw HTML tags
    expect(postContent).not.toContain('<strong>');
  });

  it('returns correct migration counts', async () => {
    const adapter = createMockAdapter(
      [makePost(), makePost({ id: 43, slug: 'release-v1-51' })],
      [makePage()],
    );

    const result = await migrateAllContent(adapter, '/content', {
      writeFn: async () => {},
    });

    expect(result.migrated).toBe(3);
    expect(result.files).toHaveLength(3);
    expect(result.skipped).toBe(0);
  });

  it('handles empty content gracefully', async () => {
    const adapter = createMockAdapter([], []);

    const result = await migrateAllContent(adapter, '/content', {
      writeFn: async () => {},
    });

    expect(result.migrated).toBe(0);
    expect(result.files).toEqual([]);
    expect(result.skipped).toBe(0);
  });

  it('skips existing files when skipExisting is true', async () => {
    const written: Map<string, string> = new Map();
    const adapter = createMockAdapter(
      [makePost()],
      [makePage()],
    );

    const result = await migrateAllContent(adapter, '/content', {
      writeFn: async (path, content) => {
        written.set(path, content);
      },
      existsFn: async (path) => {
        // Simulate that the post file already exists
        return path.includes('release-v1-50');
      },
      skipExisting: true,
    });

    expect(result.migrated).toBe(1); // Only the page was migrated
    expect(result.skipped).toBe(1);  // The post was skipped
    expect(written.has('/content/releases/release-v1-50.md')).toBe(false);
    expect(written.has('/content/docs/about-project.md')).toBe(true);
  });

  it('includes nav_section in frontmatter', async () => {
    const written: Map<string, string> = new Map();
    const adapter = createMockAdapter();

    await migrateAllContent(adapter, '/content', {
      writeFn: async (path, content) => {
        written.set(path, content);
      },
    });

    const postContent = written.get('/content/releases/release-v1-50.md')!;
    expect(postContent).toContain('nav_section: releases');

    const pageContent = written.get('/content/docs/about-project.md')!;
    expect(pageContent).toContain('nav_section: docs');
  });

  it('merges categories and tags into frontmatter tags array', async () => {
    const written: Map<string, string> = new Map();
    const adapter = createMockAdapter(
      [makePost({ categories: ['Releases', 'Milestones'], tags: ['v1.50'] })],
      [],
    );

    await migrateAllContent(adapter, '/content', {
      writeFn: async (path, content) => {
        written.set(path, content);
      },
    });

    const postContent = written.get('/content/releases/release-v1-50.md')!;
    expect(postContent).toContain('tags:');
    expect(postContent).toContain('  - "Releases"');
    expect(postContent).toContain('  - "Milestones"');
    expect(postContent).toContain('  - "v1.50"');
  });
});
