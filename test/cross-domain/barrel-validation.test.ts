import { describe, it, expect } from 'vitest';
import * as siteExports from '../../src/site/index.js';
import * as securityExports from '../../src/security/index.js';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

describe('cross-domain barrel validation', () => {
  describe('barrel export collision detection (VALID-02)', () => {
    it('site and security barrels have no overlapping export names', () => {
      const siteNames = new Set(Object.keys(siteExports));
      const securityNames = new Set(Object.keys(securityExports));
      const collisions = [...siteNames].filter(n => securityNames.has(n));
      expect(collisions).toEqual([]);
    });

    it('electronics-pack has no barrel index (types are module-scoped)', () => {
      const barrelPath = join(process.cwd(), 'src', 'electronics-pack', 'index.ts');
      expect(existsSync(barrelPath)).toBe(false);
    });
  });

  describe('domain-prefixed naming convention (VALID-03)', () => {
    const DOMAIN_PREFIXES = ['Site', 'Wp', 'WordPress', 'Navigation'];
    const UTILITY_ALLOWLIST = [
      // Function exports (not types -- naming convention is for types only)
      'build', 'processPage', 'processMarkdown', 'resetCitationCounter',
      'getCitationMap', 'loadTemplates', 'renderTemplate', 'parseFrontmatter',
      'pathToSlug', 'slugToOutputPath', 'slugToUrl', 'walkMarkdownFiles',
      'createFileOps', 'extractToc', 'generateLlmsTxt', 'generateLlmsFullTxt',
      'generateAgentsMd', 'generateSchemaOrg', 'generateMarkdownMirror',
      'buildSearchIndex', 'stripMarkdownSyntax', 'resolveCitations',
      'generateBibliography', 'formatCitation', 'generateAtomFeed',
      'generateSitemap', 'generateRobotsTxt', 'generateHtaccess',
      'generateCommentSection', 'htmlToMarkdown', 'pullContent', 'pushContent',
      'deploy', 'dryRun', 'verifyDeployment',
    ];

    it('site barrel has domain-prefixed alias for every generic type export', () => {
      const allNames = Object.keys(siteExports);
      // Type exports are uppercase-starting names that are not functions
      const typeNames = allNames.filter(
        n => n[0] === n[0].toUpperCase() && !UTILITY_ALLOWLIST.includes(n)
      );
      // For each generic type name, a Site-prefixed version must also exist
      const genericTypes = typeNames.filter(
        t => !DOMAIN_PREFIXES.some(p => t.startsWith(p))
      );
      for (const generic of genericTypes) {
        const prefixed = `Site${generic}`;
        expect(allNames, `Missing Site-prefixed alias for ${generic}`).toContain(prefixed);
      }
    });

    it('security barrel types are already domain-prefixed', () => {
      const secNames = Object.keys(securityExports);
      const typeNames = secNames.filter(
        n => n[0] === n[0].toUpperCase() && typeof (securityExports as Record<string, unknown>)[n] !== 'function'
      );
      const SECURITY_PREFIXES = [
        'Security', 'Sandbox', 'Proxy', 'Agent', 'Shield', 'Blocked',
        'Quarantine', 'Domain', 'SECURITY', 'PANEL',
      ];
      const unprefixed = typeNames.filter(
        t => !SECURITY_PREFIXES.some(p => t.startsWith(p))
      );
      // Allow empty -- security barrel is already clean
      expect(unprefixed).toEqual([]);
    });
  });
});
