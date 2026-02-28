/**
 * Convert a file path (relative to content root) into a URL slug.
 *
 * Rules:
 * - Strip `.md` extension
 * - Strip leading `docs/` prefix
 * - `_index.md` becomes the parent directory slug
 * - Root `index.md` becomes empty string
 * - Lowercase, spaces → hyphens, non-URL-safe chars removed
 */
export function pathToSlug(filePath: string): string {
  let slug = filePath;

  // Strip leading docs/ prefix
  slug = slug.replace(/^docs\//, '');

  // Remove .md extension
  slug = slug.replace(/\.md$/i, '');

  // Handle _index → directory index
  slug = slug.replace(/\/_index$/, '');
  slug = slug.replace(/^_index$/, '');

  // Handle root index
  if (slug === 'index') {
    return '';
  }

  // Process each path segment independently to preserve structure
  slug = slug
    .split('/')
    .map((segment) =>
      segment
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-{2,}/g, '-')
        .replace(/^-|-$/g, ''),
    )
    .join('/');

  return slug;
}

/**
 * Convert a slug to an output file path.
 *
 * `essays/the-space-between` → `essays/the-space-between/index.html`
 * `` (empty, root) → `index.html`
 */
export function slugToOutputPath(slug: string): string {
  if (slug === '') return 'index.html';
  return `${slug}/index.html`;
}

/**
 * Convert a slug to a clean URL with leading slash and trailing slash.
 *
 * `essays/the-space-between` → `/essays/the-space-between/`
 * `` (empty, root) → `/`
 */
export function slugToUrl(slug: string): string {
  if (slug === '') return '/';
  return `/${slug}/`;
}
