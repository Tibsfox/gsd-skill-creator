/**
 * OOPS-GSD v1.49.576 — C1 / OGA-015 HIGH
 *
 * Verifies the worktree lifecycle hooks are wired in the source-of-truth
 * settings file:
 *   - worktree-init.cjs registered on SessionStart (workspace-conditional;
 *     the script no-ops when no session_id + worktree_path are supplied)
 *   - worktree-cleanup.sh registered on Stop (the script's internal 24h
 *     age-check + uncommitted-changes guard make the cadence idempotent)
 *
 *   CF-H-015 — registration check + cleanup-trigger present
 *
 * @module __tests__/hooks-integration/worktree-lifecycle
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SETTINGS_PATH = join(process.cwd(), 'project-claude', 'settings.json');

interface HookEntry {
  type: string;
  command: string;
}
interface HookGroup {
  matcher?: string;
  hooks: HookEntry[];
}
interface SettingsShape {
  hooks?: Record<string, HookGroup[]>;
}

function loadSettings(): SettingsShape {
  return JSON.parse(readFileSync(SETTINGS_PATH, 'utf8')) as SettingsShape;
}

function commandsForEvent(settings: SettingsShape, event: string): string[] {
  const groups = settings.hooks?.[event] ?? [];
  return groups.flatMap((g) => g.hooks.map((h) => h.command));
}

describe('OGA-015 — worktree lifecycle wiring', () => {
  it('CF-H-015a: SessionStart registers worktree-init.cjs', () => {
    const settings = loadSettings();
    const cmds = commandsForEvent(settings, 'SessionStart');
    expect(cmds.some((c) => c.includes('worktree-init.cjs'))).toBe(true);
  });

  it('CF-H-015b: Stop registers worktree-cleanup.sh (24h cadence trigger)', () => {
    const settings = loadSettings();
    const cmds = commandsForEvent(settings, 'Stop');
    expect(cmds.some((c) => c.includes('worktree-cleanup.sh'))).toBe(true);
  });

  it('CF-H-015c: cleanup hook is invoked via bash (script is .sh)', () => {
    const settings = loadSettings();
    const cmds = commandsForEvent(settings, 'Stop');
    const cleanup = cmds.find((c) => c.includes('worktree-cleanup.sh'));
    expect(cleanup).toBeDefined();
    expect(cleanup!.startsWith('bash ')).toBe(true);
  });
});
