/**
 * Convert WordPress HTML content to clean markdown.
 *
 * Hand-rolled converter — no external library dependency.
 * Handles paragraphs, bold/italic, links, images, lists, and
 * fenced code blocks.  Strips WordPress-specific markup
 * (wp-block classes, alignment helpers, etc.).
 */
export function htmlToMarkdown(html: string): string {
  let md = html;

  // Code blocks — must come before attribute stripping (language class needed)
  md = md.replace(
    /<pre><code(?:\s+class="language-(\w+)")?>([\s\S]*?)<\/code><\/pre>/gi,
    (_match, lang, code) => {
      const language = lang ?? '';
      const decoded = decodeEntities(code.trim());
      return `\n\`\`\`${language}\n${decoded}\n\`\`\`\n`;
    },
  );

  // Strip WordPress wrapper divs (wp-block-*, etc.)
  md = md.replace(/<div[^>]*class="[^"]*wp-[^"]*"[^>]*>([\s\S]*?)<\/div>/gi, '$1');

  // Strip remaining class/style/id attributes from tags we'll process
  md = md.replace(/ class="[^"]*"/gi, '');
  md = md.replace(/ style="[^"]*"/gi, '');
  md = md.replace(/ id="[^"]*"/gi, '');

  // Images
  md = md.replace(
    /<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi,
    '![$2]($1)',
  );
  // Also handle alt before src
  md = md.replace(
    /<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*\/?>/gi,
    '![$1]($2)',
  );

  // Links
  md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');

  // Bold / Strong
  md = md.replace(/<(strong|b)>([\s\S]*?)<\/\1>/gi, '**$2**');

  // Italic / Em
  md = md.replace(/<(em|i)>([\s\S]*?)<\/\1>/gi, '_$2_');

  // Inline code
  md = md.replace(/<code>([\s\S]*?)<\/code>/gi, '`$1`');

  // Unordered lists
  md = md.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_m, inner: string) => {
    return (
      '\n' +
      inner.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n').trim() +
      '\n'
    );
  });

  // Ordered lists
  md = md.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_m, inner: string) => {
    let idx = 0;
    return (
      '\n' +
      inner
        .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, () => {
          idx++;
          return `${idx}. `;
        })
        .trim() +
      '\n'
    );
  });

  // Headings
  md = md.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_m, level, text) => {
    return '\n' + '#'.repeat(Number(level)) + ' ' + text.trim() + '\n';
  });

  // Paragraphs
  md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n');

  // Line breaks
  md = md.replace(/<br\s*\/?>/gi, '\n');

  // Horizontal rules
  md = md.replace(/<hr\s*\/?>/gi, '\n---\n');

  // Strip remaining HTML tags
  md = md.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  md = decodeEntities(md);

  // Collapse excess blank lines
  md = md.replace(/\n{3,}/g, '\n\n');

  return md.trim();
}

/** Decode common HTML entities */
function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ');
}
