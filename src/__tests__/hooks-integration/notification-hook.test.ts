/**
 * OOPS-GSD v1.49.576 — C1 / OGA-008 HIGH
 *
 * Verifies the Notification event slot in the source-of-truth settings file
 * registers `notification-logger.cjs` (Pass 1 discovery logger — see hook
 * source for rationale; Pass 2 targeted handlers are deferred).
 *
 *   CF-H-008 — registration check (Notification slot populated)
 *
 * @module __tests__/hooks-integration/notification-hook
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

describe('OGA-008 — Notification hook wiring', () => {
  it('CF-H-008: Notification slot registers notification-logger.cjs', () => {
    const settings = loadSettings();
    const groups = settings.hooks?.Notification ?? [];
    const cmds = groups.flatMap((g) => g.hooks.map((h) => h.command));
    expect(cmds.some((c) => c.includes('notification-logger.cjs'))).toBe(true);
  });

  it('CF-H-008: Notification registration uses command type', () => {
    const settings = loadSettings();
    const groups = settings.hooks?.Notification ?? [];
    expect(groups.length).toBeGreaterThan(0);
    for (const g of groups) {
      for (const h of g.hooks) {
        expect(h.type).toBe('command');
      }
    }
  });
});
