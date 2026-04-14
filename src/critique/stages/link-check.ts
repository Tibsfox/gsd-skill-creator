/**
 * link-check stage — runs src/site/link-check.ts on the draft's markdown + HTML files.
 *
 * Each broken link becomes one CritiqueFinding with stage: 'link-check'.
 */

import { extractMarkdownLinks, extractHtmlLinks, verifyLinks } from '../../site/link-check.js';
import type { LinkCheckOptions } from '../../site/link-check.js';
import type { CritiqueStage, CritiqueFinding, SkillDraft } from '../types.js';

/**
 * Factory: returns a CritiqueStage that checks links in the draft.
 *
 * @param opts - LinkCheckOptions (DI for FS, HTTP, cache)
 */
export function linkCheckStage(opts: LinkCheckOptions): CritiqueStage {
  return {
    name: 'link-check',

    async run(draft: SkillDraft): Promise<CritiqueFinding[]> {
      const allLinks = [];

      // Extract links from the SKILL.md body (markdown)
      const mdLinks = extractMarkdownLinks(draft.body, 'SKILL.md');
      allLinks.push(...mdLinks);

      // Extract links from any HTML files in the draft
      for (const [filePath, content] of draft.files) {
        if (filePath.endsWith('.html')) {
          const htmlLinks = extractHtmlLinks(content, filePath);
          allLinks.push(...htmlLinks);
        }
      }

      if (allLinks.length === 0) {
        return [];
      }

      // For skill critique, we don't have a built site to check against.
      // Internal links without a builtUrls set are treated as external
      // or verified against the skill's own file set.
      const builtUrls = new Set<string>();
      const headingSlugsByPage = new Map<string, Set<string>>();

      const verified = await verifyLinks(allLinks, builtUrls, headingSlugsByPage, opts);

      // Map broken links to CritiqueFinding
      const findings: CritiqueFinding[] = [];
      for (const link of verified) {
        if (link.status === 'ok' || link.status === 'skipped') continue;

        findings.push({
          stage: 'link-check',
          severity: 'error',
          message: `${link.status}: ${link.url}`,
          location: link.sourceFile
            ? { file: link.sourceFile }
            : undefined,
          fixHint: link.reason
            ? `Reason: ${link.reason}. Update the URL or remove the broken reference.`
            : 'Update the URL or remove the broken reference.',
        });
      }

      return findings;
    },
  };
}
