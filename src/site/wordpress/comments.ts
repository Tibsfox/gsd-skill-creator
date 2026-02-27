import type { ContentPage, WordPressConfig } from '../types';

/**
 * Generate the comment section HTML for a content page.
 *
 * Returns a `<section>` with data attributes for the client-side
 * widget, a `<script>` loader tag, and a `<noscript>` fallback.
 * Returns `null` when comments are not enabled or the page lacks
 * a `wp_post_id`.
 */
export function generateCommentSection(
  page: ContentPage,
  wpConfig: WordPressConfig,
): string | null {
  const { frontmatter } = page;

  if (!frontmatter.comments || frontmatter.wp_post_id == null) {
    return null;
  }

  if (!wpConfig.comments_enabled) {
    return null;
  }

  const postId = frontmatter.wp_post_id;
  const apiUrl = wpConfig.api;
  const wpUrl = wpConfig.url;

  return [
    `<section class="wp-comments requires-js" data-wp-post-id="${postId}" data-wp-api="${apiUrl}">`,
    '  <h2>Comments</h2>',
    '  <div id="wp-comment-list"></div>',
    '  <div id="wp-comment-form"></div>',
    '</section>',
    `<script src="/js/comments.js" defer></script>`,
    '<noscript>',
    `  <p>Comments require JavaScript. <a href="${wpUrl}/?p=${postId}#respond">Leave a comment on WordPress</a>.</p>`,
    '</noscript>',
  ].join('\n');
}
