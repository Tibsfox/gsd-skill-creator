/**
 * install.cjs path-traversal guard (INT-2).
 *
 * project-claude/install.cjs previously had NO containment check on manifest
 * targets, whereas its TypeScript sibling src/cli/commands/gsd-init.ts did
 * (assertContained). INT-2 makes install.cjs the single canonical engine, so it
 * must not be the weaker one on host safety. This pins the newly-added guard.
 *
 * Named *.test.ts (NOT *.integration.test.ts) so the `root` vitest project runs
 * it every `npx vitest run` — same enforcement lane as install-parity.test.ts.
 * The spawn lives under tests/ so the src/-only ProcessContext audit is unaffected.
 */
import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const REPO = process.cwd();
const require = createRequire(import.meta.url);
// install.cjs guards main() behind `require.main === module`, so requiring it
// here loads its exports without running an install.
const installCjs = require(join(REPO, 'project-claude', 'install.cjs')) as {
  assertContained(absPath: string, root: string): void;
};

describe('assertContained: manifest-target containment guard', () => {
  it('allows a path nested inside the root', () => {
    expect(() =>
      installCjs.assertContained('/proj/.claude/skills/team-control/SKILL.md', '/proj'),
    ).not.toThrow();
  });

  it('allows the root itself', () => {
    expect(() => installCjs.assertContained('/proj', '/proj')).not.toThrow();
  });

  it('blocks an absolute path outside the root', () => {
    expect(() => installCjs.assertContained('/etc/passwd', '/proj')).toThrow(
      /Path traversal blocked/,
    );
  });

  it('blocks a ../ escape resolved against the root', () => {
    expect(() =>
      installCjs.assertContained('/proj/../etc/cron.d/evil', '/proj'),
    ).toThrow(/Path traversal blocked/);
  });

  it('blocks a sibling directory sharing the root prefix (proj-evil vs proj)', () => {
    // The + path.sep in the guard is what stops /proj-evil from passing a naive
    // startsWith('/proj') check.
    expect(() => installCjs.assertContained('/proj-evil/x', '/proj')).toThrow(
      /Path traversal blocked/,
    );
  });
});

// The guard must not reject any REAL manifest target. .claude/ is wholly
// gitignored, so CI checkouts lack it — skip there, enforce under local
// pre-tag-gate (same gating as install-parity.test.ts).
describe.skipIf(!existsSync(join(REPO, '.claude', 'skills')))(
  'guard does not false-positive on the real manifest',
  () => {
    it('a full dry-run install emits no "Path traversal blocked"', () => {
      const result = spawnSync(
        process.execPath,
        [join(REPO, 'project-claude', 'install.cjs'), '--dry-run'],
        { encoding: 'utf8', cwd: REPO },
      );
      const out = (result.stdout ?? '') + (result.stderr ?? '');
      expect(out).not.toContain('Path traversal blocked');
    });
  },
);
