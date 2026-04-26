/**
 * CF-H-017 — Hook-event coverage rollup.
 *
 * Asserts that project-claude/settings.json subscribes to >=12 distinct hook
 * event keys. The C5 additions (FileChanged, PermissionDenied, SubagentSpawn,
 * SubagentStop, UserPromptSubmit) bring the count from 8 to 13.
 *
 * Closes the test arm of OGA-017.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const SETTINGS = join(REPO_ROOT, 'project-claude', 'settings.json');

describe('CF-H-017: hook-event coverage rollup', () => {
  it('settings.json declares >=12 distinct hook event keys', () => {
    const settings = JSON.parse(readFileSync(SETTINGS, 'utf8'));
    expect(settings.hooks).toBeDefined();
    const keys = Object.keys(settings.hooks);
    expect(keys.length).toBeGreaterThanOrEqual(12);
  });

  it('each subscribed event has at least one hook command', () => {
    const settings = JSON.parse(readFileSync(SETTINGS, 'utf8'));
    for (const [event, entries] of Object.entries(settings.hooks) as [string, any][]) {
      expect(Array.isArray(entries), `${event} entries must be an array`).toBe(true);
      const cmds = entries.flatMap((e: any) => (e.hooks ?? []).map((h: any) => h.command ?? ''));
      expect(cmds.length, `${event} must have at least one command`).toBeGreaterThan(0);
      for (const c of cmds) {
        expect(typeof c).toBe('string');
        expect(c.length).toBeGreaterThan(0);
      }
    }
  });
});
