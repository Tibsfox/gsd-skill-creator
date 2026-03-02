import type { WpPost, WpApiAdapter, WpApiPushAdapter, WpPostData } from './wp-sync.js';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/**
 * Minimal interface for calling MCP tools.
 * Accepts a tool name and arguments object, returns the raw response.
 */
export interface McpToolCaller {
  call(tool: string, args: Record<string, unknown>): Promise<unknown>;
}

/** Extended adapter that also supports fetching pages (for migration). */
export type McpWpAdapter = WpApiAdapter &
  WpApiPushAdapter & {
    fetchPages(params?: { since?: string }): Promise<WpPost[]>;
  };

/* ------------------------------------------------------------------ */
/*  Response shape types (WordPress REST API via MCP)                   */
/* ------------------------------------------------------------------ */

interface WpRawPost {
  id: number;
  title: string | { rendered: string };
  content: string | { rendered: string };
  date?: string;
  modified?: string;
  slug?: string;
  link?: string;
  _embedded?: {
    'wp:term'?: Array<Array<{ name?: string }>>;
  };
}

/* ------------------------------------------------------------------ */
/*  Factory                                                            */
/* ------------------------------------------------------------------ */

/**
 * Create an MCP-backed WordPress adapter that delegates to
 * claudeus-wp-mcp MCP tools for all API operations.
 */
export function createMcpWpAdapter(
  mcp: McpToolCaller,
  site: string,
): McpWpAdapter {
  return {
    async fetchPosts(params: { since?: string; postId?: number } = {}): Promise<WpPost[]> {
      const filters: Record<string, unknown> = {
        per_page: 100,
        status: 'publish',
      };
      if (params.since) filters.after = params.since;
      if (params.postId) filters.include = [params.postId];

      const raw = await mcp.call('claudeus_wp_content__get_posts', {
        site,
        filters,
      });
      return transformPosts(raw);
    },

    async fetchPages(params: { since?: string } = {}): Promise<WpPost[]> {
      const filters: Record<string, unknown> = {
        per_page: 100,
        status: 'publish',
      };
      if (params.since) filters.after = params.since;

      const raw = await mcp.call('claudeus_wp_content__get_pages', {
        site,
        filters,
      });
      return transformPosts(raw);
    },

    async createPost(data: WpPostData): Promise<{ id: number }> {
      const raw = (await mcp.call('claudeus_wp_content__create_post', {
        site,
        data: {
          title: data.title,
          content: data.content,
          status: data.status ?? 'publish',
        },
      })) as { id: number };
      return { id: raw.id };
    },

    async updatePost(id: number, data: WpPostData): Promise<void> {
      await mcp.call('claudeus_wp_content__update_post', {
        site,
        id,
        data: {
          title: data.title,
          content: data.content,
          status: data.status ?? 'publish',
        },
      });
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                    */
/* ------------------------------------------------------------------ */

/**
 * Transform raw MCP response into flat WpPost[].
 * Handles both array-wrapped and { data: [...] } response shapes.
 */
function transformPosts(raw: unknown): WpPost[] {
  const arr = extractArray(raw);
  return arr.map(normalizePost);
}

/** Extract the posts array from various response shapes. */
function extractArray(raw: unknown): WpRawPost[] {
  if (Array.isArray(raw)) return raw as WpRawPost[];
  if (raw && typeof raw === 'object' && 'data' in raw) {
    const data = (raw as { data: unknown }).data;
    if (Array.isArray(data)) return data as WpRawPost[];
  }
  return [];
}

/** Normalize a single raw WP post into a flat WpPost. */
function normalizePost(p: WpRawPost): WpPost {
  return {
    id: p.id,
    title: extractRendered(p.title),
    content: extractRendered(p.content),
    date: p.date ?? '',
    modified: p.modified ?? '',
    slug: p.slug ?? '',
    categories: extractTermNames(p._embedded?.['wp:term']?.[0]),
    tags: extractTermNames(p._embedded?.['wp:term']?.[1]),
    link: p.link ?? '',
  };
}

/** Extract plain string from either a rendered object or a plain string. */
function extractRendered(value: string | { rendered: string } | undefined): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'rendered' in value) return value.rendered;
  return '';
}

/** Extract term names from an embedded wp:term array. */
function extractTermNames(terms: Array<{ name?: string }> | undefined): string[] {
  if (!Array.isArray(terms)) return [];
  return terms.map((t) => t.name).filter((n): n is string => Boolean(n));
}
