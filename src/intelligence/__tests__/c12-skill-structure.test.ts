/**
 * C12 / T1 + T2 + T3 + T4 + T5 + T6 — Skill structure + frontmatter validation.
 *
 * Asserts that the project-claude/skills/intelligence-investigator/ tree
 * exists with all required files, that SKILL.md frontmatter is well-formed,
 * and that the reference modules cover the PRD's required content.
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const SKILL_ROOT = resolve(
  __dirname,
  '../../../project-claude/skills/intelligence-investigator',
);

describe('C12 / T1-T6 — skill structure', () => {
  it('all 7 required files present', () => {
    const required = [
      'SKILL.md',
      'references/briefing-format.md',
      'references/move-ranking.md',
      'references/kb-queries.md',
      'references/confidence-calibration.md',
      'scripts/load-kb-context.sh',
      'scripts/write-briefing.ts',
      'scripts/verify-briefing.ts',
    ];
    for (const f of required) {
      const path = resolve(SKILL_ROOT, f);
      expect(existsSync(path), `Missing: ${f}`).toBe(true);
      expect(statSync(path).size).toBeGreaterThan(50);
    }
  });

  it('SKILL.md has valid frontmatter (name + description + allowed-tools)', () => {
    const skill = readFileSync(resolve(SKILL_ROOT, 'SKILL.md'), 'utf8');
    // Tolerate CRLF line endings (Windows checkout with core.autocrlf) — the
    // frontmatter delimiter + name line may be terminated by \r\n.
    expect(skill).toMatch(/^---\r?\nname: intelligence-investigator\r?\n/);
    expect(skill).toMatch(/description:/);
    expect(skill).toMatch(/allowed-tools:.*Read.*Glob.*sqlite3.*Write/);
  });

  it('SKILL.md activation criteria mention all 5 intelligence.* request types', () => {
    const skill = readFileSync(resolve(SKILL_ROOT, 'SKILL.md'), 'utf8');
    // The C00 ConsoleRequestType enum lists 5 types the dashboard emits.
    expect(skill).toMatch(/intelligence\.refresh_briefing/);
    expect(skill).toMatch(/intelligence\.triage_finding/);
    expect(skill).toMatch(/intelligence\.snapshot_diff/);
    expect(skill).toMatch(/intelligence\.investigate_section/);
    expect(skill).toMatch(/intelligence\.dismiss_finding/);
  });

  it('briefing-format.md has good + 2 bad examples', () => {
    const md = readFileSync(
      resolve(SKILL_ROOT, 'references/briefing-format.md'),
      'utf8',
    );
    expect(md.split('## Example').length - 1).toBeGreaterThanOrEqual(3);
    expect(md.length).toBeGreaterThan(2000);
  });

  it('move-ranking.md has 4 ranking criteria + composition rule + example', () => {
    const md = readFileSync(
      resolve(SKILL_ROOT, 'references/move-ranking.md'),
      'utf8',
    );
    expect(md).toMatch(/Unblocking impact/i);
    expect(md).toMatch(/Context heat/i);
    expect(md).toMatch(/Cost vs information value/i);
    expect(md).toMatch(/Risk reduction/i);
    expect(md).toMatch(/Composition rule|composition/i);
    expect(md).toMatch(/expected_unblocks/);
    expect(md).toMatch(/source_findings/);
  });

  it('kb-queries.md has ≥5 sqlite3-CLI queries', () => {
    const md = readFileSync(
      resolve(SKILL_ROOT, 'references/kb-queries.md'),
      'utf8',
    );
    const codeBlocks = md.match(/```bash[\s\S]*?```/g) ?? [];
    expect(codeBlocks.length).toBeGreaterThanOrEqual(5);
    for (const block of codeBlocks) {
      expect(block).toMatch(/sqlite3/);
    }
  });

  it('confidence-calibration.md documents low/medium/high thresholds', () => {
    const md = readFileSync(
      resolve(SKILL_ROOT, 'references/confidence-calibration.md'),
      'utf8',
    );
    expect(md).toMatch(/### `low`/);
    expect(md).toMatch(/### `medium`/);
    expect(md).toMatch(/### `high`/);
    // Anti-patterns
    expect(md).toMatch(/Anti-pattern|never label `high`/i);
  });

  // windows: NTFS has no POSIX executable bit; git for Windows cannot reflect
  // the stored 100755 mode on checkout, so (stat.mode & 0o111) is always 0.
  // The exec bit is meaningful only on the POSIX runtime that actually runs the
  // bash skill harness. All other structure assertions stay platform-agnostic.
  it.skipIf(process.platform === 'win32')('load-kb-context.sh has executable bit', () => {
    const path = resolve(SKILL_ROOT, 'scripts/load-kb-context.sh');
    const stat = statSync(path);
    expect((stat.mode & 0o111) !== 0).toBe(true);
  });
});
