/**
 * CF-H-017 — Hook-event coverage rollup.
 *
 * Asserts that project-claude/settings.json subscribes to >=12 distinct hook
 * event keys. The C5 additions (FileChanged, PermissionDenied, SubagentStart,
 * SubagentStop, UserPromptSubmit) bring the count from 8 to 13.
 *
 * Also lints every subscribed event name against the known Claude Code hook
 * events (CC-2 guard): a typo'd key like the former `SubagentSpawn` is silently
 * ignored by Claude Code, so the hook never fires — this catches it in CI.
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

  it('every subscribed event name is a known Claude Code hook event (CC-2 guard)', () => {
    // Known Claude Code hook events. A hook registered under an unknown key is
    // silently ignored (never fires), which is exactly how the former
    // `SubagentSpawn` typo produced dead telemetry. Keep this in sync with the
    // upstream event catalog; the trailing two are repo-accepted extended events.
    const KNOWN_HOOK_EVENTS = new Set([
      // Session lifecycle
      'SessionStart', 'SessionEnd', 'Setup',
      // Compaction
      'PreCompact', 'PostCompact',
      // Per-turn
      'UserPromptSubmit', 'UserPromptExpansion', 'Stop', 'StopFailure',
      // Tool execution
      'PreToolUse', 'PostToolUse', 'PostToolUseFailure',
      'Notification',
      // Subagent / team / task
      'SubagentStart', 'SubagentStop', 'TeammateIdle',
      // Repo-accepted extended events (C5)
      'FileChanged', 'PermissionDenied',
    ]);

    const check = (path: string) => {
      const settings = JSON.parse(readFileSync(path, 'utf8'));
      for (const event of Object.keys(settings.hooks ?? {})) {
        expect(
          KNOWN_HOOK_EVENTS.has(event),
          `Unknown hook event "${event}" in ${path} — Claude Code ignores unknown ` +
            `keys, so this hook would never fire. Fix the name or add it to ` +
            `KNOWN_HOOK_EVENTS if it is genuinely a new upstream event.`,
        ).toBe(true);
      }
    };

    check(SETTINGS);
    check(join(REPO_ROOT, 'project-claude', 'settings-hooks.json'));
  });
});
