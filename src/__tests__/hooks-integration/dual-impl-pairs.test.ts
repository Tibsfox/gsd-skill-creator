/**
 * OOPS-GSD v1.49.576 — C2 / OGA-048, OGA-049, OGA-050
 *
 * Verifies the three dual-implementation hook pairs collapse to single
 * registrations in the source-of-truth settings file at
 * `project-claude/settings.json`, per ADR 0002.
 *
 *   CF-H-048 — PreToolUse:Bash registers validate-commit.cjs only (no .sh)
 *   CF-H-049 — PostToolUse registers phase-boundary-check.cjs only with
 *              the widened Write|Edit matcher (no .sh)
 *   CF-H-050 — SessionStart registers session-state.cjs (no gsd-session-state.sh)
 *
 * @module __tests__/hooks-integration/dual-impl-pairs
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = process.cwd();
const SETTINGS_PATH = join(REPO_ROOT, 'project-claude', 'settings.json');

interface HookEntry {
  type: string;
  command: string;
  timeout?: number;
}
interface HookGroup {
  matcher?: string;
  hooks: HookEntry[];
}
interface SettingsShape {
  hooks?: Record<string, HookGroup[]>;
}

function loadSettings(): SettingsShape {
  const raw = readFileSync(SETTINGS_PATH, 'utf8');
  return JSON.parse(raw) as SettingsShape;
}

function groupsForEvent(settings: SettingsShape, event: string): HookGroup[] {
  return settings.hooks?.[event] ?? [];
}

function commandsForEvent(settings: SettingsShape, event: string): string[] {
  return groupsForEvent(settings, event).flatMap((g) =>
    g.hooks.map((h) => h.command),
  );
}

describe('OGA-048 — validate-commit dual-impl pair collapses to .cjs', () => {
  it('CF-H-048a: PreToolUse:Bash registers validate-commit.cjs', () => {
    const settings = loadSettings();
    const bashGroups = groupsForEvent(settings, 'PreToolUse').filter(
      (g) => g.matcher === 'Bash',
    );
    const cmds = bashGroups.flatMap((g) => g.hooks.map((h) => h.command));
    expect(cmds.some((c) => c.includes('validate-commit.cjs'))).toBe(true);
  });

  it('CF-H-048b: PreToolUse does NOT register gsd-validate-commit.sh', () => {
    const settings = loadSettings();
    const allCmds = commandsForEvent(settings, 'PreToolUse');
    expect(allCmds.some((c) => c.includes('gsd-validate-commit.sh'))).toBe(
      false,
    );
  });
});

describe('OGA-049 — phase-boundary dual-impl pair collapses to .cjs', () => {
  it('CF-H-049a: PostToolUse registers phase-boundary-check.cjs with widened Write|Edit matcher', () => {
    const settings = loadSettings();
    const groups = groupsForEvent(settings, 'PostToolUse').filter((g) =>
      g.hooks.some((h) => h.command.includes('phase-boundary-check.cjs')),
    );
    expect(groups.length).toBeGreaterThanOrEqual(1);
    // ADR 0002 OGA-049: matcher must be widened from Write to Write|Edit so
    // phase boundaries fire on Edit operations as well as Write.
    const matchers = groups.map((g) => g.matcher ?? '');
    expect(matchers.some((m) => m === 'Write|Edit')).toBe(true);
  });

  it('CF-H-049b: PostToolUse does NOT register gsd-phase-boundary.sh', () => {
    const settings = loadSettings();
    const allCmds = commandsForEvent(settings, 'PostToolUse');
    expect(allCmds.some((c) => c.includes('gsd-phase-boundary.sh'))).toBe(
      false,
    );
  });
});

describe('OGA-050 — session-state dual-impl pair collapses to .cjs', () => {
  it('CF-H-050a: SessionStart registers session-state.cjs', () => {
    const settings = loadSettings();
    const cmds = commandsForEvent(settings, 'SessionStart');
    expect(cmds.some((c) => c.includes('session-state.cjs'))).toBe(true);
  });

  it('CF-H-050b: SessionStart does NOT register gsd-session-state.sh', () => {
    const settings = loadSettings();
    const cmds = commandsForEvent(settings, 'SessionStart');
    expect(cmds.some((c) => c.includes('gsd-session-state.sh'))).toBe(false);
  });
});
