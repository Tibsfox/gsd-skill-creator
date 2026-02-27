import type { ContentPage, SiteConfig } from '../types';

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };
const SIZE_WARN_THRESHOLD = 500_000; // 500KB

/** Filter pages to only those visible to agents */
function filterAgentVisible(pages: ContentPage[]): ContentPage[] {
  return pages.filter((p) => p.frontmatter.agent_visible !== false);
}

/** Sort pages by priority, then section, then nav_order, then title */
function sortPages(pages: ContentPage[]): ContentPage[] {
  return [...pages].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.frontmatter.agent_priority ?? 'medium'] ?? 1;
    const pb = PRIORITY_ORDER[b.frontmatter.agent_priority ?? 'medium'] ?? 1;
    if (pa !== pb) return pa - pb;

    const sa = a.frontmatter.nav_section ?? 'zzz';
    const sb = b.frontmatter.nav_section ?? 'zzz';
    if (sa !== sb) return sa.localeCompare(sb);

    const oa = a.frontmatter.nav_order ?? 999;
    const ob = b.frontmatter.nav_order ?? 999;
    if (oa !== ob) return oa - ob;

    return a.frontmatter.title.localeCompare(b.frontmatter.title);
  });
}

/**
 * Generate llms-full.txt — complete site content for AI agents.
 *
 * Format:
 * ```
 * # {site.title} -- Full Content
 * Generated: {buildDate}
 * Total pages: {count}
 *
 * ---
 * ## {page.title}
 * URL: {absolute_url}
 * Tags: {tags}
 * Updated: {date}
 *
 * {rawMarkdown}
 * ---
 * ```
 */
export function generateLlmsFullTxt(
  pages: ContentPage[],
  site: SiteConfig,
): { content: string; sizeWarning: boolean } {
  const visible = filterAgentVisible(pages);
  const sorted = sortPages(visible);

  const lines: string[] = [];

  lines.push(`# ${site.title} -- Full Content`);
  lines.push('');
  lines.push(`Generated: ${site.buildDate}`);
  lines.push(`Total pages: ${sorted.length}`);

  for (const page of sorted) {
    const url = `${site.url}${page.url}`;
    const tags = page.frontmatter.tags?.join(', ') ?? '';
    const date = page.frontmatter.updated ?? page.frontmatter.date ?? '';

    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push(`## ${page.frontmatter.title}`);
    lines.push(`URL: ${url}`);
    if (tags) lines.push(`Tags: ${tags}`);
    if (date) lines.push(`Updated: ${date}`);
    lines.push('');
    lines.push(page.rawMarkdown);
  }

  // Final delimiter
  lines.push('');
  lines.push('---');

  const content = lines.join('\n') + '\n';
  const sizeWarning = Buffer.byteLength(content, 'utf-8') > SIZE_WARN_THRESHOLD;

  return { content, sizeWarning };
}
