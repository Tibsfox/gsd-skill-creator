/**
 * OOPS-GSD v1.49.576 — C2 / OGA-052 (vendoring policy enforcement)
 *
 * Verifies the ADR 0001 three-state vendoring marker policy is correctly
 * applied to the three retired-but-on-disk shell halves of the dual-impl
 * pairs (OGA-048, OGA-049, OGA-050). Each .sh file must carry:
 *
 *   # gsd-hook-version: 1.38.3   (required: vendored origin)
 *   # local-modified: false      (required: state A — unmodified)
 *
 * Also verifies that hooks/README.md cites both ADR 0001 and ADR 0002
 * so a future maintainer can find the policy from the hook directory.
 *
 *   CF-H-052a — markers present on all 3 retired .sh files
 *   CF-H-052b — hooks/README.md references ADR 0001 + ADR 0002
 *
 * @module __tests__/hooks-integration/vendoring-policy
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = process.cwd();
const HOOKS_DIR = join(REPO_ROOT, 'project-claude', 'hooks');
const README_PATH = join(HOOKS_DIR, 'README.md');

const RETIRED_SHELL_HOOKS = [
  'gsd-validate-commit.sh',
  'gsd-phase-boundary.sh',
  'gsd-session-state.sh',
];

interface MarkerState {
  hasGsdHookVersion: boolean;
  hasLocalModifiedFalse: boolean;
}

function readMarkers(filePath: string): MarkerState {
  const head = readFileSync(filePath, 'utf8').split('\n').slice(0, 10).join('\n');
  return {
    hasGsdHookVersion: /^#\s*gsd-hook-version:\s*\S+/m.test(head),
    hasLocalModifiedFalse: /^#\s*local-modified:\s*false\b/m.test(head),
  };
}

describe('OGA-052 — ADR 0001 vendoring markers on retired shell halves', () => {
  for (const fname of RETIRED_SHELL_HOOKS) {
    const fpath = join(HOOKS_DIR, fname);

    it(`CF-H-052a: ${fname} exists in project-claude/hooks/`, () => {
      expect(existsSync(fpath)).toBe(true);
    });

    it(`CF-H-052a: ${fname} carries gsd-hook-version stamp (state A)`, () => {
      const m = readMarkers(fpath);
      expect(m.hasGsdHookVersion).toBe(true);
    });

    it(`CF-H-052a: ${fname} carries local-modified: false marker (state A)`, () => {
      const m = readMarkers(fpath);
      expect(m.hasLocalModifiedFalse).toBe(true);
    });
  }
});

describe('OGA-052 — hooks/README.md cites ADR 0001 + ADR 0002', () => {
  it('CF-H-052b: README references ADR 0001 (vendoring policy)', () => {
    const readme = readFileSync(README_PATH, 'utf8');
    expect(readme.includes('0001-vendoring-policy.md')).toBe(true);
  });

  it('CF-H-052b: README references ADR 0002 (dual-impl decision record)', () => {
    const readme = readFileSync(README_PATH, 'utf8');
    expect(readme.includes('0002-dual-impl-decision-record.md')).toBe(true);
  });
});
