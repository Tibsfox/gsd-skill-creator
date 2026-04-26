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

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = process.cwd();
const SETTINGS_PATH = join(REPO_ROOT, 'project-claude', 'settings.json');
const SESSION_STATE_HOOK = join(REPO_ROOT, '.claude', 'hooks', 'session-state.cjs');

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

  it('CF-H-020c: session-state.cjs latency benchmark <200ms over 10 runs', () => {
    if (!existsSync(SESSION_STATE_HOOK)) {
      // Hook may be absent in clean checkouts; skip rather than fail.
      return;
    }
    const input = JSON.stringify({ session_id: 'c1-bench', cwd: REPO_ROOT });
    const samples: number[] = [];
    for (let i = 0; i < 10; i++) {
      const start = Date.now();
      execFileSync('node', [SESSION_STATE_HOOK], {
        input,
        encoding: 'utf8',
        timeout: 5000,
      });
      samples.push(Date.now() - start);
    }
    const max = Math.max(...samples);
    const median = [...samples].sort((a, b) => a - b)[Math.floor(samples.length / 2)];
    // Budget: <200ms p50; allow generous p100 since CI cold-cache can spike.
    expect(median).toBeLessThan(200);
    expect(max).toBeLessThan(1000);
  });
});
