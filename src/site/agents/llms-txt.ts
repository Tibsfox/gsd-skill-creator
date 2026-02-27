import type { ContentPage, SiteConfig } from '../types';

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

/** Filter pages to only those visible to agents */
function filterAgentVisible(pages: ContentPage[]): ContentPage[] {
  return pages.filter((p) => p.frontmatter.agent_visible !== false);
}

/** Sort pages by priority (high first), then nav_order, then title alphabetically */
function sortByPriority(pages: ContentPage[]): ContentPage[] {
  return [...pages].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.frontmatter.agent_priority ?? 'medium'] ?? 1;
    const pb = PRIORITY_ORDER[b.frontmatter.agent_priority ?? 'medium'] ?? 1;
    if (pa !== pb) return pa - pb;

    const oa = a.frontmatter.nav_order ?? 999;
    const ob = b.frontmatter.nav_order ?? 999;
    if (oa !== ob) return oa - ob;

    return a.frontmatter.title.localeCompare(b.frontmatter.title);
  });
}

/** Group pages by nav_section, using "Other" for pages without one */
function groupBySection(pages: ContentPage[]): Map<string, ContentPage[]> {
  const groups = new Map<string, ContentPage[]>();
  for (const page of pages) {
    const section = page.frontmatter.nav_section ?? 'other';
    const existing = groups.get(section) ?? [];
    existing.push(page);
    groups.set(section, existing);
  }
  return groups;
}

/** Capitalize first letter of a section name */
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Truncate a string to maxLen characters, adding ellipsis if truncated */
function truncate(s: string, maxLen: number): string {
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen) + '...';
}

/**
 * Generate llms.txt — a curated index of site content for AI agents.
 *
 * Format:
 * ```
 * # {site.title}
 * > {site.description}
 *
 * ## {Section}
 * - [Title](absolute_url): description
 * ```
 */
export function generateLlmsTxt(pages: ContentPage[], site: SiteConfig): string {
  const visible = filterAgentVisible(pages);
  const sorted = sortByPriority(visible);
  const sections = groupBySection(sorted);

  const lines: string[] = [];

  lines.push(`# ${site.title}`);
  lines.push('');
  lines.push(`> ${site.description}`);

  for (const [sectionId, sectionPages] of sections) {
    lines.push('');
    lines.push(`## ${capitalize(sectionId)}`);
    for (const page of sectionPages) {
      const url = `${site.url}${page.url}`;
      const desc = page.frontmatter.description
        ? `: ${truncate(page.frontmatter.description, 100)}`
        : '';
      lines.push(`- [${page.frontmatter.title}](${url})${desc}`);
    }
  }

  return lines.join('\n') + '\n';
}
