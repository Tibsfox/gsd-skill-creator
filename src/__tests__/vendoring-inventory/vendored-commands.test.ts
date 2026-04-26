/**
 * OOPS-GSD v1.49.576 — C6 / OGA-046, OGA-043, OGA-044, OGA-045
 *
 * Verifies the four vendored gsd-build commands are present in the
 * project-claude SOT (`project-claude/commands/gsd/`) and carry the
 * ADR 0001 vendoring markers in their YAML frontmatter:
 *
 *   gsd-build-source: <upstream-version>
 *   gsd-build-source-url: <github-url>
 *   local-modified: false (or true with local-modification-rationale)
 *   gsd-skill-creator-vendored-at: <iso-date>
 *
 *   CF-H-046a — all 4 vendored command files are present
 *   CF-H-046b — each carries gsd-build-source frontmatter key
 *   CF-H-046c — each carries local-modified marker (boolean)
 *   CF-H-046d — local-modified=true requires local-modification-rationale
 *   CF-H-046e — vendored-at date present and ISO-formatted (YYYY-MM-DD)
 *
 * @module __tests__/vendoring-inventory/vendored-commands
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = process.cwd();
const COMMANDS_DIR = join(REPO_ROOT, 'project-claude', 'commands', 'gsd');

const VENDORED_COMMANDS = [
  'sync-skills',
  'plan-review-convergence',
  'settings-advanced',
  'settings-integrations',
] as const;

interface Frontmatter {
  raw: string;
  hasGsdBuildSource: boolean;
  hasGsdBuildSourceUrl: boolean;
  hasLocalModified: boolean;
  localModifiedValue: 'true' | 'false' | null;
  hasVendoredAt: boolean;
  vendoredAtValue: string | null;
  hasRationale: boolean;
}

function parseFrontmatter(filePath: string): Frontmatter {
  const content = readFileSync(filePath, 'utf8');
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  const raw = match ? match[1] : '';
  const localMatch = raw.match(/^local-modified:\s*(true|false)\s*$/m);
  const vendoredAtMatch = raw.match(/^gsd-skill-creator-vendored-at:\s*(\S+)\s*$/m);
  return {
    raw,
    hasGsdBuildSource: /^gsd-build-source:\s*\S+/m.test(raw),
    hasGsdBuildSourceUrl: /^gsd-build-source-url:\s*https?:\/\//m.test(raw),
    hasLocalModified: localMatch !== null,
    localModifiedValue: localMatch ? (localMatch[1] as 'true' | 'false') : null,
    hasVendoredAt: vendoredAtMatch !== null,
    vendoredAtValue: vendoredAtMatch ? vendoredAtMatch[1] : null,
    hasRationale: /^local-modification-rationale:\s*\S/m.test(raw),
  };
}

describe('OGA-046/043/044/045 — vendored gsd-build commands present with ADR 0001 markers', () => {
  for (const name of VENDORED_COMMANDS) {
    const fpath = join(COMMANDS_DIR, `${name}.md`);

    it(`CF-H-046a — ${name}.md exists at ${COMMANDS_DIR}`, () => {
      expect(existsSync(fpath), `missing vendored command: ${fpath}`).toBe(true);
    });

    it(`CF-H-046b — ${name}.md carries gsd-build-source + URL frontmatter`, () => {
      const fm = parseFrontmatter(fpath);
      expect(fm.hasGsdBuildSource, 'missing gsd-build-source key').toBe(true);
      expect(fm.hasGsdBuildSourceUrl, 'missing gsd-build-source-url key').toBe(true);
    });

    it(`CF-H-046c — ${name}.md carries local-modified boolean`, () => {
      const fm = parseFrontmatter(fpath);
      expect(fm.hasLocalModified, 'missing local-modified key').toBe(true);
      expect(fm.localModifiedValue).toMatch(/^(true|false)$/);
    });

    it(`CF-H-046d — ${name}.md: if local-modified=true then rationale present`, () => {
      const fm = parseFrontmatter(fpath);
      if (fm.localModifiedValue === 'true') {
        expect(fm.hasRationale, 'local-modified=true requires local-modification-rationale').toBe(true);
      }
    });

    it(`CF-H-046e — ${name}.md carries gsd-skill-creator-vendored-at ISO date`, () => {
      const fm = parseFrontmatter(fpath);
      expect(fm.hasVendoredAt, 'missing gsd-skill-creator-vendored-at key').toBe(true);
      expect(fm.vendoredAtValue).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  }
});
