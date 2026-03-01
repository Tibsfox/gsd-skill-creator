import { describe, it, expect } from 'vitest';
import { createMcpWpAdapter } from '../../../src/site/wordpress/mcp-adapter';
import type { McpToolCaller } from '../../../src/site/wordpress/mcp-adapter';

/* ---- Mock MCP tool caller ---- */

interface MockCall {
  tool: string;
  args: Record<string, unknown>;
}

function createMockMcp(responses: Record<string, unknown>): {
  mcp: McpToolCaller;
  calls: MockCall[];
} {
  const calls: MockCall[] = [];
  const mcp: McpToolCaller = {
    async call(tool: string, args: Record<string, unknown>): Promise<unknown> {
      calls.push({ tool, args });
      return responses[tool] ?? [];
    },
  };
  return { mcp, calls };
}

/* ---- Realistic WP API response fixtures ---- */

const wpPostsResponse = [
  {
    id: 42,
    title: { rendered: 'Release v1.50' },
    content: { rendered: '<p>The <strong>Unit Circle</strong> milestone.</p>' },
    date: '2026-02-28T12:00:00',
    modified: '2026-02-28T14:00:00',
    slug: 'release-v1-50',
    link: 'https://example.com/release-v1-50/',
    _embedded: {
      'wp:term': [
        [{ name: 'Releases' }, { name: 'Milestones' }],
        [{ name: 'release-notes' }, { name: 'v1.50' }],
      ],
    },
  },
  {
    id: 43,
    title: { rendered: 'Getting Started Guide' },
    content: { rendered: '<p>Welcome to skill-creator.</p>' },
    date: '2026-03-01T08:00:00',
    modified: '2026-03-01T09:00:00',
    slug: 'getting-started',
    link: 'https://example.com/getting-started/',
  },
];

const wpPagesResponse = {
  data: [
    {
      id: 10,
      title: { rendered: 'About the Project' },
      content: { rendered: '<p>About page content.</p>' },
      date: '2026-01-15T10:00:00',
      modified: '2026-01-20T11:00:00',
      slug: 'about-project',
      link: 'https://example.com/about-project/',
      _embedded: {
        'wp:term': [
          [{ name: 'Pages' }],
          [],
        ],
      },
    },
  ],
};

const createPostResponse = {
  id: 99,
  title: { rendered: 'New Post' },
};

describe('MCP WordPress Adapter', () => {
  describe('fetchPosts', () => {
    it('calls correct MCP tool with site and filters', async () => {
      const { mcp, calls } = createMockMcp({
        claudeus_wp_content__get_posts: wpPostsResponse,
      });
      const adapter = createMcpWpAdapter(mcp, 'example.com');

      await adapter.fetchPosts({});

      expect(calls).toHaveLength(1);
      expect(calls[0].tool).toBe('claudeus_wp_content__get_posts');
      expect(calls[0].args.site).toBe('example.com');
      expect(calls[0].args.filters).toEqual({
        per_page: 100,
        status: 'publish',
      });
    });

    it('transforms title.rendered to flat string', async () => {
      const { mcp } = createMockMcp({
        claudeus_wp_content__get_posts: wpPostsResponse,
      });
      const adapter = createMcpWpAdapter(mcp, 'example.com');

      const posts = await adapter.fetchPosts({});

      expect(posts[0].title).toBe('Release v1.50');
      expect(posts[1].title).toBe('Getting Started Guide');
    });

    it('transforms content.rendered to flat string', async () => {
      const { mcp } = createMockMcp({
        claudeus_wp_content__get_posts: wpPostsResponse,
      });
      const adapter = createMcpWpAdapter(mcp, 'example.com');

      const posts = await adapter.fetchPosts({});

      expect(posts[0].content).toBe('<p>The <strong>Unit Circle</strong> milestone.</p>');
    });

    it('extracts category names from embedded wp:term[0]', async () => {
      const { mcp } = createMockMcp({
        claudeus_wp_content__get_posts: wpPostsResponse,
      });
      const adapter = createMcpWpAdapter(mcp, 'example.com');

      const posts = await adapter.fetchPosts({});

      expect(posts[0].categories).toEqual(['Releases', 'Milestones']);
    });

    it('extracts tag names from embedded wp:term[1]', async () => {
      const { mcp } = createMockMcp({
        claudeus_wp_content__get_posts: wpPostsResponse,
      });
      const adapter = createMcpWpAdapter(mcp, 'example.com');

      const posts = await adapter.fetchPosts({});

      expect(posts[0].tags).toEqual(['release-notes', 'v1.50']);
    });

    it('handles missing _embedded gracefully', async () => {
      const { mcp } = createMockMcp({
        claudeus_wp_content__get_posts: wpPostsResponse,
      });
      const adapter = createMcpWpAdapter(mcp, 'example.com');

      const posts = await adapter.fetchPosts({});

      // Post at index 1 has no _embedded
      expect(posts[1].categories).toEqual([]);
      expect(posts[1].tags).toEqual([]);
    });

    it('passes since filter as after parameter', async () => {
      const { mcp, calls } = createMockMcp({
        claudeus_wp_content__get_posts: [],
      });
      const adapter = createMcpWpAdapter(mcp, 'example.com');

      await adapter.fetchPosts({ since: '2026-03-01' });

      expect(calls[0].args.filters).toEqual(
        expect.objectContaining({ after: '2026-03-01' }),
      );
    });

    it('passes postId filter as include parameter', async () => {
      const { mcp, calls } = createMockMcp({
        claudeus_wp_content__get_posts: [],
      });
      const adapter = createMcpWpAdapter(mcp, 'example.com');

      await adapter.fetchPosts({ postId: 42 });

      expect(calls[0].args.filters).toEqual(
        expect.objectContaining({ include: [42] }),
      );
    });
  });

  describe('fetchPages', () => {
    it('calls correct MCP tool and handles data-wrapped response', async () => {
      const { mcp, calls } = createMockMcp({
        claudeus_wp_content__get_pages: wpPagesResponse,
      });
      const adapter = createMcpWpAdapter(mcp, 'example.com');

      const pages = await adapter.fetchPages({});

      expect(calls[0].tool).toBe('claudeus_wp_content__get_pages');
      expect(pages).toHaveLength(1);
      expect(pages[0].title).toBe('About the Project');
      expect(pages[0].slug).toBe('about-project');
    });
  });

  describe('createPost', () => {
    it('calls correct MCP tool with post data', async () => {
      const { mcp, calls } = createMockMcp({
        claudeus_wp_content__create_post: createPostResponse,
      });
      const adapter = createMcpWpAdapter(mcp, 'example.com');

      const result = await adapter.createPost({
        title: 'New Post',
        content: '<p>Content</p>',
        status: 'draft',
      });

      expect(calls[0].tool).toBe('claudeus_wp_content__create_post');
      expect(calls[0].args.data).toEqual({
        title: 'New Post',
        content: '<p>Content</p>',
        status: 'draft',
      });
      expect(result.id).toBe(99);
    });
  });

  describe('updatePost', () => {
    it('calls correct MCP tool with id and data', async () => {
      const { mcp, calls } = createMockMcp({
        claudeus_wp_content__update_post: undefined,
      });
      const adapter = createMcpWpAdapter(mcp, 'example.com');

      await adapter.updatePost(42, {
        title: 'Updated Title',
        content: '<p>Updated</p>',
      });

      expect(calls[0].tool).toBe('claudeus_wp_content__update_post');
      expect(calls[0].args.id).toBe(42);
      expect(calls[0].args.data).toEqual({
        title: 'Updated Title',
        content: '<p>Updated</p>',
        status: 'publish',
      });
    });
  });

  describe('pullContent + pushContent integration', () => {
    it('fetched posts work with pullContent via adapter interface', async () => {
      const { mcp } = createMockMcp({
        claudeus_wp_content__get_posts: wpPostsResponse,
      });
      const adapter = createMcpWpAdapter(mcp, 'example.com');

      // Verify the adapter fulfills WpApiAdapter contract
      const posts = await adapter.fetchPosts({});
      expect(posts).toHaveLength(2);
      expect(posts[0].id).toBe(42);
      expect(posts[0].slug).toBe('release-v1-50');
    });

    it('adapter handles empty response', async () => {
      const { mcp } = createMockMcp({
        claudeus_wp_content__get_posts: [],
      });
      const adapter = createMcpWpAdapter(mcp, 'example.com');

      const posts = await adapter.fetchPosts({});
      expect(posts).toEqual([]);
    });
  });
});
