/**
 * HTML renderer for the GSD Planning Docs Dashboard.
 *
 * Generates complete HTML5 documents with embedded CSS.
 * No external dependencies — output works when opened via file:// protocol.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A navigable page in the dashboard sidebar. */
export interface NavPage {
  /** Unique page identifier (used to match currentPage). */
  name: string;
  /** Relative path to the HTML file. */
  path: string;
  /** Human-readable label shown in the nav. */
  label: string;
}

/** Options for rendering a full HTML5 page layout. */
export interface LayoutOptions {
  /** The page <title>. */
  title: string;
  /** HTML content for the <main> region. */
  content: string;
  /** Pre-rendered navigation HTML (from renderNav). */
  nav: string;
  /** Project name shown in the header. */
  projectName: string;
  /** ISO 8601 timestamp shown in the footer. */
  generatedAt: string;
  /** CSS string (from renderStyles) to embed in <style>. */
  styles: string;
  /** Optional meta tags. */
  meta?: {
    description?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogType?: string;
  };
  /** Optional JSON-LD structured data (pre-serialized JSON string). */
  jsonLd?: string;
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

/**
 * Render a sidebar navigation component.
 *
 * @param pages  - List of navigable pages.
 * @param currentPage - The `name` of the currently active page.
 * @returns HTML string containing a `<nav>` element.
 */
export function renderNav(pages: NavPage[], currentPage: string): string {
  const links = pages
    .map((page) => {
      const activeClass = page.name === currentPage ? ' active' : '';
      return `      <li><a href="${escapeAttr(page.path)}" class="nav-link${activeClass}">${escapeHtml(page.label)}</a></li>`;
    })
    .join('\n');

  return `<nav>
    <ul class="nav-list">
${links}
    </ul>
  </nav>`;
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

/**
 * Render a complete HTML5 document.
 *
 * @param options - Layout content and metadata.
 * @returns A self-contained HTML string.
 */
export function renderLayout(options: LayoutOptions): string {
  const {
    title,
    content,
    nav,
    projectName,
    generatedAt,
    styles,
    meta,
    jsonLd,
  } = options;

  // Optional meta tags
  const metaTags: string[] = [];
  if (meta?.description) {
    metaTags.push(`    <meta name="description" content="${escapeAttr(meta.description)}">`);
  }
  if (meta?.ogTitle) {
    metaTags.push(`    <meta property="og:title" content="${escapeAttr(meta.ogTitle)}">`);
  }
  if (meta?.ogDescription) {
    metaTags.push(`    <meta property="og:description" content="${escapeAttr(meta.ogDescription)}">`);
  }
  if (meta?.ogType) {
    metaTags.push(`    <meta property="og:type" content="${escapeAttr(meta.ogType)}">`);
  }
  const metaBlock = metaTags.length > 0 ? '\n' + metaTags.join('\n') : '';

  // Optional JSON-LD
  const jsonLdBlock = jsonLd
    ? `\n    <script type="application/ld+json">${jsonLd}</script>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">${metaBlock}
    <title>${escapeHtml(title)}</title>
    <style>${styles}</style>${jsonLdBlock}
  </head>
  <body>
    <header>
      <span class="header-title">${escapeHtml(projectName)}</span>
    </header>
    <div class="page-wrapper">
      ${nav}
      <main>
        ${content}
      </main>
    </div>
    <footer>
      Generated ${escapeHtml(generatedAt)}
    </footer>
  </body>
</html>`;
}

// ---------------------------------------------------------------------------
// HTML Utilities
// ---------------------------------------------------------------------------

/**
 * Escape a string for safe inclusion in HTML text content.
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Escape a string for safe inclusion in an HTML attribute value.
 */
export function escapeAttr(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
