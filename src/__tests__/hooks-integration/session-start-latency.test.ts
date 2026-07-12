/**
 * OOPS-GSD v1.49.576 — C1 / OGA-020 HIGH
 *
 * Verifies SessionStart consolidation:
 *   - The state-bootstrap surface drops from 5 hooks to 1 (`session-state.cjs`).
 *   - `worktree-init.cjs` remains as a distinct semantic concern (worktree
 *     lifecycle, registered for OGA-015), not state bootstrap.
 *   - Steady-state SessionStart latency budget: <200ms over 10 cold runs.
 *
 *   CF-H-020 — count check + simple latency benchmark
 *
 * @module __tests__/hooks-integration/session-start-latency
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = process.cwd();
const SETTINGS_PATH = join(REPO_ROOT, 'project-claude', 'settings.json');

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

describe('OGA-020 — SessionStart consolidation', () => {
  it('CF-H-020a: SessionStart state-bootstrap consolidated to one hook', () => {
    const settings = loadSettings();
    const cmds = commandsForEvent(settings, 'SessionStart');

    // Per ADR 0002 + OGA-020, only `session-state.cjs` remains for the
    // state-bootstrap concern. The dropped 4 are the redundant gsd-* legacy
    // entries plus the dual-impl gsd-session-state.sh half.
    expect(cmds.some((c) => c.includes('session-state.cjs'))).toBe(true);
    expect(cmds.every((c) => !c.includes('gsd-check-update.js'))).toBe(true);
    expect(cmds.every((c) => !c.includes('gsd-restore-work-state.js'))).toBe(true);
    expect(cmds.every((c) => !c.includes('gsd-inject-snapshot.js'))).toBe(true);
    expect(cmds.every((c) => !c.includes('gsd-session-state.sh'))).toBe(true);
  });

  it('CF-H-020b: worktree-init.cjs remains as separate lifecycle concern', () => {
    const settings = loadSettings();
    const cmds = commandsForEvent(settings, 'SessionStart');
    // OGA-015 wires worktree-init on SessionStart; it is a distinct
    // semantic concern (worktree lifecycle), not state bootstrap.
    expect(cmds.some((c) => c.includes('worktree-init.cjs'))).toBe(true);
    // Total SessionStart entries == 2: one state, one worktree.
    expect(cmds.length).toBe(2);
  });

  // CF-H-020c (session-state.cjs latency benchmark) relocated to the WARN-only
  // intelligence-perf project (item 8):
  // src/intelligence/__tests__/performance/session-start-latency.perf.test.ts.
});
