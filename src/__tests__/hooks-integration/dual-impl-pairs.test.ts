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
