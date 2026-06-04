/**
 * examples/ catalog tooling — de-hardcode + re-catalog drift-guard
 * (Ship 2.1, milestone v1.49.970).
 *
 * The six examples/tools scripts (install, validate, catalog-gen,
 * generate-category-readmes, license-report, backfill-frontmatter) each used to
 * carry their OWN frozen category allowlist — `SKILL_CATEGORIES = new Set([...])`
 * and the agent/team siblings. The taxonomy grew to 40+ college/department
 * domains; the allowlists never did. So `install --all` silently served ~19% of
 * the tree, `validate` flagged the rest as `(unclassified)` without checking it,
 * and the count badge + per-category READMEs froze.
 *
 * Ship 2.1 removed the allowlists: category discovery is now STRUCTURAL and lives
 * in one place (examples/tools/catalog-core.mjs). This file is the #10461
 * "gate-enforce-every-runnable-surface + drift-guard pairing" for that fix:
 *
 *   - Layer 1 (enforcement): named *.test.ts (NOT *.integration.test.ts), so the
 *     `root` vitest project runs it on every `npx vitest run` — pre-tag-gate
 *     step 2 + CI's test job — every ship. (This is HOW `validate --strict` is
 *     "gated into pre-tag-gate" without adding a new shell step / denominator.)
 *   - Layer 2 (drift-guard): the assertions below pin (a) no tool re-introduces a
 *     hardcoded allowlist, (b) `validate --strict` is clean with zero unclassified
 *     over the whole tree, (c) every disk category has a generated README, and
 *     (d) the committed badge equals the live catalog count.
 *
 * Design note: the structural category rule is REPLICATED inline here (not
 * imported from catalog-core.mjs) so this guard is an INDEPENDENT oracle — it
 * re-derives "what is a category" from disk and compares against what the tools
 * produce, rather than trusting the module under test (#10417 spawnSync so stderr
 * survives; #10450 a drift-guard must itself fail loudly, hence the anti-vacuous
 * floors).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const REPO = process.cwd();
const EX = join(REPO, 'examples');
const TOOLS = join(EX, 'tools');
const CATEGORIZED_TYPES = ['skills', 'agents', 'teams'] as const;
const TOOL_FILES = [
  'install.mjs',
  'validate.mjs',
  'catalog-gen.mjs',
  'generate-category-readmes.mjs',
  'license-report.mjs',
  'backfill-frontmatter.mjs',
];

// Independent re-derivation of the structural category rule (mirrors
// catalog-core.mjs deliberately — see header). A top-level dir under
// examples/<type>/ is a CATEGORY unless it is itself an (unclassified) artifact
// (holds its metadata file directly: SKILL.md / AGENT.md, or config.json for teams).
function isArtifactDir(type: string, dir: string): boolean {
  if (type === 'teams') return existsSync(join(dir, 'config.json'));
  const meta = type === 'skills' ? 'SKILL.md' : 'AGENT.md';
  return existsSync(join(dir, meta));
}

function diskCategories(type: string): string[] {
  return readdirSync(join(EX, type), { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'README.md')
    .filter((e) => !isArtifactDir(type, join(EX, type, e.name)))
    .map((e) => e.name)
    .sort();
}

describe('examples/ catalog tooling — de-hardcode + re-catalog drift-guard (Ship 2.1)', () => {
  it('ANTI-VACUOUS — the six catalog tools exist and import catalog-core.mjs', () => {
    for (const f of TOOL_FILES) {
      const p = join(TOOLS, f);
      expect(existsSync(p), `${f} should exist`).toBe(true);
      expect(readFileSync(p, 'utf8'), `${f} should import catalog-core.mjs`).toContain(
        'catalog-core.mjs',
      );
    }
  });

  it('DE-HARDCODE — no tool re-introduces a hardcoded category allowlist', () => {
    // The exact bug Ship 2.1 fixed. If any tool re-declares a category Set, the
    // silent-drift returns. catalog-core.mjs itself uses no such Set (it reads disk).
    const FORBIDDEN = /\b(SKILL|AGENT|TEAM|CHIPSET)_CATEGORIES\s*=\s*new Set/;
    for (const f of [...TOOL_FILES, 'catalog-core.mjs']) {
      const src = readFileSync(join(TOOLS, f), 'utf8');
      expect(FORBIDDEN.test(src), `${f} must not hardcode a category allowlist`).toBe(false);
    }
  });

  it('STRICT — validate.mjs --strict is clean over the whole tree, zero unclassified', () => {
    const r = spawnSync('node', [join(TOOLS, 'validate.mjs'), '--strict'], { encoding: 'utf8' });
    expect(r.status, `validate --strict failed:\n${r.stdout}\n${r.stderr}`).toBe(0);
    // anti-vacuous: it descended everything (no "(unclassified)" left) and checked a lot.
    expect(r.stdout).toMatch(/0 info\./);
    const checked = r.stdout.match(/Total:\s*(\d+)\s*checked/);
    expect(checked, 'validate should report a checked total').toBeTruthy();
    expect(Number(checked![1])).toBeGreaterThan(500);
  });

  it('CATEGORIES — every type has many categories and each has a generated README', () => {
    for (const type of CATEGORIZED_TYPES) {
      const cats = diskCategories(type);
      expect(cats.length, `${type} should have many categories`).toBeGreaterThan(10);
      for (const cat of cats) {
        expect(
          existsSync(join(EX, type, cat, 'README.md')),
          `${type}/${cat}/README.md should exist (run generate-category-readmes.mjs)`,
        ).toBe(true);
      }
    }
  });

  it('BADGE — .count-badge.md equals the live catalog-gen count (badge is fresh)', () => {
    const r = spawnSync('node', [join(TOOLS, 'catalog-gen.mjs'), '--check'], { encoding: 'utf8' });
    expect(r.status, `catalog-gen --check failed:\n${r.stdout}\n${r.stderr}`).toBe(0);
    const live: Record<string, number> = {};
    for (const m of r.stdout.matchAll(/^\s*(skills|agents|teams|chipsets):\s*(\d+)/gm)) {
      live[m[1]] = Number(m[2]);
    }
    for (const k of ['skills', 'agents', 'teams', 'chipsets']) {
      expect(live[k], `catalog-gen --check should report ${k}`).toBeGreaterThan(0);
    }

    const badge = readFileSync(join(EX, '.count-badge.md'), 'utf8');
    const row = badge.match(/\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|/);
    expect(row, '.count-badge.md should have a numeric count row').toBeTruthy();
    const [, s, a, t, c] = row!.map(Number);
    expect({ skills: s, agents: a, teams: t, chipsets: c }).toEqual({
      skills: live.skills,
      agents: live.agents,
      teams: live.teams,
      chipsets: live.chipsets,
    });
  });
});
