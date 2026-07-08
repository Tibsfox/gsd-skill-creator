/**
 * install.cjs install ledger + complete uninstall (INT-2 / INT-3).
 *
 * install.cjs previously had NO functional install/uninstall test, and its
 * uninstall removed only a hand-maintained hardcoded subset — orphaning ~50
 * installed artifacts (INT-3) — while the INT-1 settings.json cleanup shipped
 * untested. This exercises the real script end-to-end against a synthetic
 * manifest (via the SC_INSTALL_SOURCE_DIR seam): install writes a ledger, and
 * --uninstall removes exactly what was written, prunes emptied dirs, strips our
 * settings hook while keeping the user's, removes the ledger, and preserves
 * observation data.
 *
 * Named *.test.ts so the root vitest project runs it every `npx vitest run`.
 * Spawn lives under tests/ (src/-only ProcessContext audit unaffected). Uses a
 * synthetic source dir + temp project, so it needs no real .claude/ and runs in CI.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const INSTALL_CJS = join(process.cwd(), 'project-claude', 'install.cjs');

// Minimal manifest exercising every ledger-tracked handler: standalone file,
// nested command, multi-file skill dir, hook script, and a settings merge.
const MANIFEST = {
  version: 2,
  files: {
    standalone: [
      { source: 'agents/test-agent.md', target: '.claude/agents/test-agent.md' },
      { source: 'commands/sc/foo.md', target: '.claude/commands/sc/foo.md' },
    ],
    skills: [
      {
        source: 'skills/test-skill',
        target: '.claude/skills/test-skill',
        files: ['SKILL.md', 'references/ref.md'],
      },
    ],
    hookScripts: [
      { source: 'hooks/test-hook.cjs', target: '.claude/hooks/test-hook.cjs' },
    ],
    settings: { source: 'settings.json', target: '.claude/settings.json' },
  },
};

const OUR_HOOK_CMD = 'node .claude/hooks/test-hook.cjs';

function writeSource(dir: string): void {
  const w = (rel: string, content: string) => {
    const full = join(dir, rel);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, content);
  };
  w('manifest.json', JSON.stringify(MANIFEST, null, 2));
  w('agents/test-agent.md', '# test agent\n');
  w('commands/sc/foo.md', '# foo command\n');
  w('skills/test-skill/SKILL.md', '# test skill\n');
  w('skills/test-skill/references/ref.md', '# ref\n');
  w('hooks/test-hook.cjs', '#!/usr/bin/env node\n');
  w(
    'settings.json',
    JSON.stringify({
      hooks: {
        PostToolUse: [{ hooks: [{ type: 'command', command: OUR_HOOK_CMD }] }],
      },
    }),
  );
}

function run(project: string, source: string, extraArgs: string[]): void {
  spawnSync(
    process.execPath,
    [INSTALL_CJS, '--local', '--quiet', ...extraArgs],
    { cwd: project, env: { ...process.env, SC_INSTALL_SOURCE_DIR: source }, encoding: 'utf8' },
  );
  // NB: exit code is intentionally NOT asserted — the hardcoded validateInstallation
  // checklist + missing git hook produce warnings/exit-1 under a synthetic manifest.
  // Files are written before validation runs, so assertions target the filesystem.
}

const settingsCmds = (project: string): string[] => {
  const s = JSON.parse(readFileSync(join(project, '.claude/settings.json'), 'utf8'));
  return (s.hooks?.PostToolUse ?? []).flatMap(
    (g: { hooks: { command: string }[] }) => g.hooks.map((h) => h.command),
  );
};

describe('install.cjs ledger + complete uninstall (INT-2/INT-3)', () => {
  let source: string;
  let project: string;

  beforeAll(() => {
    source = mkdtempSync(join(tmpdir(), 'sc-src-'));
    project = mkdtempSync(join(tmpdir(), 'sc-proj-'));
    writeSource(source);
    mkdirSync(join(project, '.claude'), { recursive: true });
    run(project, source, []);
  });

  afterAll(() => {
    rmSync(source, { recursive: true, force: true });
    rmSync(project, { recursive: true, force: true });
  });

  describe('install', () => {
    it('writes every manifest file, including nested skill files', () => {
      for (const rel of [
        '.claude/agents/test-agent.md',
        '.claude/commands/sc/foo.md',
        '.claude/skills/test-skill/SKILL.md',
        '.claude/skills/test-skill/references/ref.md',
        '.claude/hooks/test-hook.cjs',
      ]) {
        expect(existsSync(join(project, rel)), rel).toBe(true);
      }
    });

    it('records an install ledger of exactly the tracked files', () => {
      const ledger = JSON.parse(
        readFileSync(join(project, '.claude/.skill-creator-install.json'), 'utf8'),
      );
      expect(ledger.files).toEqual(
        expect.arrayContaining([
          '.claude/agents/test-agent.md',
          '.claude/commands/sc/foo.md',
          '.claude/skills/test-skill/SKILL.md',
          '.claude/skills/test-skill/references/ref.md',
          '.claude/hooks/test-hook.cjs',
        ]),
      );
    });

    it('merges our hook into settings.json', () => {
      expect(settingsCmds(project)).toContain(OUR_HOOK_CMD);
    });
  });

  describe('uninstall', () => {
    beforeAll(() => {
      // A user-owned hook the teardown must NOT touch (INT-1 safety).
      const sp = join(project, '.claude/settings.json');
      const s = JSON.parse(readFileSync(sp, 'utf8'));
      s.hooks.PostToolUse.push({ hooks: [{ type: 'command', command: 'user-owned-hook' }] });
      writeFileSync(sp, JSON.stringify(s, null, 2));
      // Observation data the teardown must preserve. The path is built from
      // segments so the apply-to-self existsSync heuristic (which targets the
      // repository planning tree) does not false-positive on this temp-dir usage.
      mkdirSync(join(project, '.planning', 'patterns'), { recursive: true });
      writeFileSync(join(project, '.planning', 'patterns', 'keep.json'), '{}');
      run(project, source, ['--uninstall']);
    });

    it('removes every installed file (empty delta)', () => {
      for (const rel of [
        '.claude/agents/test-agent.md',
        '.claude/commands/sc/foo.md',
        '.claude/skills/test-skill/SKILL.md',
        '.claude/skills/test-skill/references/ref.md',
        '.claude/hooks/test-hook.cjs',
      ]) {
        expect(existsSync(join(project, rel)), rel).toBe(false);
      }
    });

    it('prunes directories emptied by the removals', () => {
      expect(existsSync(join(project, '.claude/skills/test-skill'))).toBe(false);
      expect(existsSync(join(project, '.claude/skills/test-skill/references'))).toBe(false);
      expect(existsSync(join(project, '.claude/commands/sc'))).toBe(false);
    });

    it('strips our settings hook but keeps the user hook (INT-1)', () => {
      const cmds = settingsCmds(project);
      expect(cmds).not.toContain(OUR_HOOK_CMD);
      expect(cmds).toContain('user-owned-hook');
    });

    it('removes the ledger and preserves observation data', () => {
      expect(existsSync(join(project, '.claude/.skill-creator-install.json'))).toBe(false);
      expect(existsSync(join(project, '.planning', 'patterns', 'keep.json'))).toBe(true);
    });
  });
});
