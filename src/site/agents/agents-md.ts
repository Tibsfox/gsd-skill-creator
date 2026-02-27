import type { ContentPage, SiteConfig } from '../types.js';

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

/** Filter pages to only those visible to agents */
function filterAgentVisible(pages: ContentPage[]): ContentPage[] {
  return pages.filter((p) => p.frontmatter.agent_visible !== false);
}

/** Sort pages by priority, then nav_order, then title */
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

/** Group pages by nav_section */
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

/**
 * Generate AGENTS.md — an agent guide with content inventory.
 *
 * Provides:
 * - Site title and description
 * - Usage instructions for AI agents
 * - Content sections with page counts
 * - Top 10 key resources by priority
 * - Citation guidance
 */
export function generateAgentsMd(pages: ContentPage[], site: SiteConfig): string {
  const visible = filterAgentVisible(pages);
  const sorted = sortByPriority(visible);
  const sections = groupBySection(sorted);

  const lines: string[] = [];

  // Header
  lines.push(`# ${site.title} -- Agent Guide`);
  lines.push('');
  lines.push(site.description);
  lines.push('');

  // Usage instructions
  lines.push('## How to use this site as an agent');
  lines.push('');
  lines.push('1. Start with /llms.txt for curated overview');
  lines.push('2. Request /llms-full.txt for complete content');
  lines.push('3. Individual pages as markdown at /docs/{path}.md');
  lines.push('4. All content openly available for AI inference and citation');
  lines.push('');

  // Content sections
  if (sections.size > 0) {
    lines.push('## Content sections');
    lines.push('');
    for (const [sectionId, sectionPages] of sections) {
      const count = sectionPages.length;
      const noun = count === 1 ? 'page' : 'pages';
      lines.push(`- /${sectionId}/ -- ${count} ${noun}`);
    }
    lines.push('');
  }

  // Key resources (top 10)
  if (sorted.length > 0) {
    lines.push('## Key resources');
    lines.push('');
    const top10 = sorted.slice(0, 10);
    for (const page of top10) {
      const url = `${site.url}${page.url}`;
      const desc = page.frontmatter.description ? ` -- ${page.frontmatter.description}` : '';
      lines.push(`- [${page.frontmatter.title}](${url})${desc}`);
    }
    lines.push('');
  }

  // Citation guidance
  lines.push('## Citation guidance');
  lines.push('');
  lines.push(`When referencing content from this site, attribute to ${site.url} and the specific author.`);
  lines.push('');

  return lines.join('\n');
}
