import yaml from 'js-yaml';
import type { FrontMatter } from '../types.js';

/**
 * Derive a title from a file path by:
 * - Taking the basename without extension
 * - Replacing hyphens/underscores with spaces
 * - Title-casing each word
 */
function titleFromPath(filePath: string): string {
  const base = filePath.split('/').pop() ?? filePath;
  const name = base.replace(/\.md$/i, '');
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const FENCE = '---';

/**
 * Parse YAML frontmatter from a raw markdown string.
 *
 * Frontmatter is delimited by `---` at the very start of the file.
 * Missing fields receive sensible defaults.  If YAML parsing fails
 * (malformed input), the function returns defaults instead of throwing.
 */
export function parseFrontmatter(
  raw: string,
  filePath?: string,
): { frontmatter: FrontMatter; content: string } {
  const trimmed = raw.trimStart();

  // No frontmatter at all
  if (!trimmed.startsWith(FENCE)) {
    return {
      frontmatter: defaults(filePath),
      content: raw,
    };
  }

  // Find closing fence (skip the opening one)
  const afterOpen = trimmed.indexOf('\n', FENCE.length);
  if (afterOpen === -1) {
    return { frontmatter: defaults(filePath), content: raw };
  }

  const closingIdx = trimmed.indexOf(`\n${FENCE}`, afterOpen);
  if (closingIdx === -1) {
    return { frontmatter: defaults(filePath), content: raw };
  }

  const yamlBlock = trimmed.slice(afterOpen + 1, closingIdx);
  const contentStart = closingIdx + 1 + FENCE.length;
  const content = trimmed.slice(contentStart).replace(/^\n+/, '');

  let parsed: Record<string, unknown> = {};
  try {
    const loaded = yaml.load(yamlBlock);
    if (loaded && typeof loaded === 'object') {
      parsed = loaded as Record<string, unknown>;
    }
  } catch {
    // Invalid YAML — fall through to defaults
    return {
      frontmatter: defaults(filePath),
      content,
    };
  }

  const fm: FrontMatter = {
    title:
      typeof parsed.title === 'string'
        ? parsed.title
        : titleFromPath(filePath ?? ''),
    ...(parsed.description != null && {
      description: String(parsed.description).trim(),
    }),
    template:
      typeof parsed.template === 'string' ? parsed.template : 'page',
    ...(parsed.date != null && { date: String(parsed.date) }),
    ...(parsed.updated != null && { updated: String(parsed.updated) }),
    ...(parsed.author != null && { author: String(parsed.author) }),
    ...(Array.isArray(parsed.tags) && { tags: parsed.tags.map(String) }),
    agent_visible:
      typeof parsed.agent_visible === 'boolean'
        ? parsed.agent_visible
        : true,
    agent_priority:
      isAgentPriority(parsed.agent_priority)
        ? parsed.agent_priority
        : 'medium',
    ...(parsed.schema_type != null && {
      schema_type: String(parsed.schema_type),
    }),
    ...(parsed.nav_section != null && {
      nav_section: String(parsed.nav_section),
    }),
    ...(parsed.nav_order != null && {
      nav_order: Number(parsed.nav_order),
    }),
    draft: typeof parsed.draft === 'boolean' ? parsed.draft : false,
    ...(parsed.comments != null && {
      comments: Boolean(parsed.comments),
    }),
    ...(parsed.wp_post_id != null && {
      wp_post_id: Number(parsed.wp_post_id),
    }),
    ...(parsed.wp_sync != null && { wp_sync: Boolean(parsed.wp_sync) }),
    ...(parsed.original_url != null && {
      original_url: String(parsed.original_url),
    }),
  };

  return { frontmatter: fm, content };
}

function isAgentPriority(v: unknown): v is 'high' | 'medium' | 'low' {
  return v === 'high' || v === 'medium' || v === 'low';
}

function defaults(filePath?: string): FrontMatter {
  return {
    title: filePath ? titleFromPath(filePath) : '',
    template: 'page',
    agent_visible: true,
    agent_priority: 'medium',
    draft: false,
  };
}
