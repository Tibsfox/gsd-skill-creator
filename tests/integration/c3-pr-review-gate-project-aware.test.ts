/**
 * C3 — pr-review-gate Project-Aware Conversion Invariant (v1.49.639)
 *
 * Asserts that the user-level Claude Code hook
 * `~/.claude/hooks/pr-review-gate.sh` carries the project-aware
 * whitelist block introduced at v1.49.639 C3 (CF-5 close).
 *
 * Background: the hook was originally an artemis-ii experiment
 * (2026-04-09) that quietly remained active across v1.49.585 → .638
 * (5 cluster cycles), blocking ALL feature-branch pushes from any
 * Claude Code session — including gsd-skill-creator — without sentinel.
 * The v1.49.639 C3 conversion adds a whitelist check matching the
 * hook's original stated intent (gsd-build / gsd-2 / gsd-pi only),
 * so other repos (this one) bypass the gate.
 *
 * Skip-guard pattern (Lesson #10180): the hook is USER-LEVEL config
 * outside this repo. Other developers' systems may not have it. CI
 * environments definitely don't. Skip if absent rather than false-fail.
 *
 * If the hook EXISTS, assert the project-aware block is present.
 * If it doesn't exist, skip (the user-level state is correct for that
 * environment — no hook means no friction either way).
 */

import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const HOOK_PATH = join(homedir(), '.claude/hooks/pr-review-gate.sh');

const PROJECT_AWARE_MARKER_RE = /Project-aware bypass:.*whitelist/;
const WHITELIST_VAR_RE = /PR_REVIEW_WHITELIST=/;
const ENV_OVERRIDE_RE = /SC_PR_REVIEW_REPOS/;
const DEFAULT_WHITELIST_RE = /"gsd-build gsd-2 gsd-pi/;

describe('C3 — pr-review-gate project-aware conversion invariant', () => {
  it.runIf(existsSync(HOOK_PATH))(
    'hook contains project-aware bypass block',
    () => {
      const content = readFileSync(HOOK_PATH, 'utf-8');
      expect(content, 'project-aware bypass marker comment').toMatch(
        PROJECT_AWARE_MARKER_RE,
      );
      expect(content, 'PR_REVIEW_WHITELIST variable defined').toMatch(
        WHITELIST_VAR_RE,
      );
      expect(content, 'SC_PR_REVIEW_REPOS env-var override available').toMatch(
        ENV_OVERRIDE_RE,
      );
      expect(content, 'default whitelist gates gsd-build / gsd-2 / gsd-pi').toMatch(
        DEFAULT_WHITELIST_RE,
      );
    },
  );

  it.runIf(existsSync(HOOK_PATH))(
    'gsd-skill-creator NOT in default whitelist (avoids the v1.49.585-638 friction)',
    () => {
      const content = readFileSync(HOOK_PATH, 'utf-8');
      // Default whitelist only contains the original 3 repos.
      // gsd-skill-creator must not appear in the default array literal.
      const defaultWhitelistMatch = content.match(
        /PR_REVIEW_WHITELIST="([^"$]+)/,
      );
      expect(
        defaultWhitelistMatch,
        'PR_REVIEW_WHITELIST literal not found',
      ).not.toBeNull();
      const defaultRepos = defaultWhitelistMatch![1].trim().split(/\s+/);
      expect(defaultRepos).not.toContain('gsd-skill-creator');
    },
  );
});
