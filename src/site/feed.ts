import type { ContentPage, SiteConfig } from './types';

const MAX_ENTRIES = 20;

/**
 * Generate an Atom 1.0 feed from the most recent content pages.
 *
 * Pages are assumed to be pre-sorted by date descending.  Only the
 * latest {@link MAX_ENTRIES} entries are included.
 */
export function generateAtomFeed(
  pages: ContentPage[],
  site: SiteConfig,
): string {
  const entries = pages.slice(0, MAX_ENTRIES);
  const feedUpdated =
    entries[0]?.frontmatter.date ?? site.buildDate;

  const lines: string[] = [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<feed xmlns="http://www.w3.org/2005/Atom">',
    '',
    `  <title>${escXml(site.title)}</title>`,
    `  <subtitle>${escXml(site.description)}</subtitle>`,
    `  <link href="${escXml(site.url)}/feed.xml" rel="self" type="application/atom+xml"/>`,
    `  <link href="${escXml(site.url)}/" rel="alternate" type="text/html"/>`,
    `  <id>${escXml(site.url)}/</id>`,
    `  <updated>${toAtomDate(feedUpdated)}</updated>`,
    '  <author>',
    `    <name>${escXml(site.author)}</name>`,
    '  </author>',
    '',
  ];

  for (const page of entries) {
    const fm = page.frontmatter;
    const absUrl = `${site.url}${page.url}`;
    const updated = fm.updated ?? fm.date ?? site.buildDate;
    const summary =
      fm.description ?? page.rawMarkdown.slice(0, 200).replace(/\n/g, ' ');

    lines.push('  <entry>');
    lines.push(`    <title>${escXml(fm.title)}</title>`);
    lines.push(`    <link href="${escXml(absUrl)}" rel="alternate" type="text/html"/>`);
    lines.push(`    <id>${escXml(absUrl)}</id>`);
    lines.push(`    <updated>${toAtomDate(updated)}</updated>`);
    lines.push(`    <summary>${escXml(summary)}</summary>`);
    if (fm.author) {
      lines.push('    <author>');
      lines.push(`      <name>${escXml(fm.author)}</name>`);
      lines.push('    </author>');
    }
    lines.push('  </entry>');
    lines.push('');
  }

  lines.push('</feed>');
  return lines.join('\n');
}

/** Escape XML special characters */
function escXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Convert a date string to Atom-compatible ISO 8601 */
function toAtomDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toISOString();
}
