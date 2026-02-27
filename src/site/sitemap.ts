import type { ContentPage, SiteConfig } from './types';

const PRIORITY_MAP: Record<string, string> = {
  high: '0.8',
  medium: '0.5',
  low: '0.3',
};

/**
 * Generate a standard sitemap.xml string.
 *
 * Excludes draft pages.  Priority is derived from `agent_priority`.
 */
export function generateSitemap(
  pages: ContentPage[],
  site: SiteConfig,
): string {
  const published = pages.filter((p) => !p.frontmatter.draft);

  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];

  for (const page of published) {
    const fm = page.frontmatter;
    const absUrl = `${site.url}${page.url}`;
    const lastmod = fm.updated ?? fm.date ?? site.buildDate;
    const priority = PRIORITY_MAP[fm.agent_priority ?? 'medium'] ?? '0.5';

    lines.push('  <url>');
    lines.push(`    <loc>${escXml(absUrl)}</loc>`);
    lines.push(`    <lastmod>${lastmod}</lastmod>`);
    lines.push(`    <priority>${priority}</priority>`);
    lines.push('  </url>');
  }

  lines.push('</urlset>');
  return lines.join('\n');
}

/**
 * Generate robots.txt with sitemap reference and agent discovery hints.
 */
export function generateRobotsTxt(site: SiteConfig): string {
  return [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${site.url}/sitemap.xml`,
    '',
    '# AI agent discovery - see /llms.txt and /AGENTS.md',
  ].join('\n');
}

/**
 * Generate an Apache .htaccess for static + WordPress coexistence.
 *
 * Static files are served from root.  WordPress lives in the /wp/
 * subdirectory.  Agent discovery files are explicitly routed to root.
 * Missing pages fall back to 404.html.
 */
export function generateHtaccess(site: SiteConfig): string {
  const wpSubdir = site.wordpress
    ? new URL(site.wordpress.url).pathname.replace(/\/$/, '') || '/wp'
    : '/wp';

  return [
    'RewriteEngine On',
    '',
    '# Agent discovery files served from root',
    'RewriteRule ^llms\\.txt$ /llms.txt [L]',
    'RewriteRule ^llms-full\\.txt$ /llms-full.txt [L]',
    'RewriteRule ^AGENTS\\.md$ /AGENTS.md [L]',
    '',
    '# Static files from root (if file exists, serve it)',
    'RewriteCond %{REQUEST_FILENAME} -f [OR]',
    'RewriteCond %{REQUEST_FILENAME} -d',
    'RewriteRule ^ - [L]',
    '',
    `# WordPress at ${wpSubdir}/ subdirectory`,
    `RewriteRule ^wp(/.*)?$ ${wpSubdir}$1 [L,PT]`,
    '',
    '# Fallback to custom 404',
    'ErrorDocument 404 /404.html',
  ].join('\n');
}

/** Escape XML special characters */
function escXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
