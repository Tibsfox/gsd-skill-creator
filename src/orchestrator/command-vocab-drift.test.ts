/**
 * ORCH-N1 — command-vocabulary drift guard.
 *
 * The intent/gate/transition modules hardcode GSD command names. When the
 * shipped command set changed (the granular `add|insert|remove-phase` were
 * unified into `gsd:phase`, and `research-phase`/`list-phase-assumptions`/
 * `plan-milestone-gaps` were removed), these hardcoded sets silently rotted:
 * the natural-language classifier could no longer route phase CRUD and the
 * destructive-confirmation gate stopped firing, yet the module's own tests
 * (which pinned the stale names) stayed green.
 *
 * This guard turns that silent rot into a red CI leg: no hardcoded command may
 * be one of the known-removed names, phase CRUD must be represented by the
 * unified `gsd:phase`, and — when an installed command set is present — every
 * hardcoded command must correspond to a real shipped command file.
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { UNIVERSAL_COMMANDS, STAGE_COMMANDS } from './intent/lifecycle-filter.js';
import { DEFAULT_DESTRUCTIVE_COMMANDS } from './gates/types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Commands that used to exist but were removed/renamed upstream. Any hardcoded
// reference to one of these is a latent routing/gating bug.
const KNOWN_REMOVED = [
  'gsd:add-phase',
  'gsd:insert-phase',
  'gsd:remove-phase',
  'gsd:research-phase',
  'gsd:list-phase-assumptions',
  'gsd:plan-milestone-gaps',
  'gsd:set-profile',
  'gsd:add-todo',
  'gsd:check-todos',
  'gsd:join-discord',
];

// Every command string baked into the exported vocabulary sets.
const hardcoded = new Set<string>([
  ...UNIVERSAL_COMMANDS,
  ...Object.values(STAGE_COMMANDS).flatMap((s) => [...s]),
  ...DEFAULT_DESTRUCTIVE_COMMANDS,
]);

const PHASE_BEARING_STAGES = [
  'roadmapped',
  'planning',
  'executing',
  'verifying',
  'between-phases',
] as const;

describe('ORCH-N1: command-vocabulary drift guard', () => {
  it('no hardcoded command is a known-removed command', () => {
    for (const removed of KNOWN_REMOVED) {
      expect(
        hardcoded.has(removed),
        `"${removed}" is a removed command but is still referenced in the ` +
          `intent/gate vocabulary — it will never match a discovered command.`,
      ).toBe(false);
    }
  });

  it('the unified gsd:phase represents phase CRUD in every phase-bearing stage', () => {
    for (const stage of PHASE_BEARING_STAGES) {
      expect(
        STAGE_COMMANDS[stage].has('gsd:phase'),
        `stage "${stage}" must surface gsd:phase for phase CRUD`,
      ).toBe(true);
    }
  });

  it('gsd:phase is gated as destructive (multiplex remove sub-action)', () => {
    expect(DEFAULT_DESTRUCTIVE_COMMANDS.has('gsd:phase')).toBe(true);
  });

  it('transition-rules suggests no known-removed command', () => {
    const src = readFileSync(
      join(__dirname, 'lifecycle', 'transition-rules.ts'),
      'utf8',
    );
    for (const removed of KNOWN_REMOVED) {
      expect(
        src.includes(`action('${removed}'`),
        `transition-rules still suggests the removed command ${removed}`,
      ).toBe(false);
    }
  });

  it('every hardcoded command maps to a shipped command file (when installed)', () => {
    // .claude/ is gitignored and only present where GSD is installed (locally /
    // dev machines). Skip gracefully in a clean CI checkout.
    const repoRoot = join(__dirname, '..', '..');
    const gsdCmdDir = join(repoRoot, '.claude', 'commands', 'gsd');
    if (!existsSync(gsdCmdDir)) {
      // No installed command set here — the denylist + phase checks above still
      // ran. Nothing to strengthen against.
      return;
    }
    for (const cmd of hardcoded) {
      if (!cmd.startsWith('gsd:')) continue;
      const stem = cmd.slice('gsd:'.length);
      expect(
        existsSync(join(gsdCmdDir, `${stem}.md`)),
        `hardcoded command ${cmd} has no shipped command file ${stem}.md`,
      ).toBe(true);
    }
  });
});
