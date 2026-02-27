import type { ContentPage } from '../types';

/**
 * Generate a markdown mirror of all agent-visible pages.
 *
 * Each entry maps a source path to its raw markdown content (frontmatter already
 * stripped by the frontmatter parser). Output paths are prefixed with `docs/`
 * to create the mirror directory structure.
 */
export function generateMarkdownMirror(
  pages: ContentPage[],
): Array<{ path: string; content: string }> {
  return pages
    .filter((p) => p.frontmatter.agent_visible !== false)
    .map((page) => ({
      path: `docs/${page.sourcePath}`,
      content: page.rawMarkdown,
    }));
}
