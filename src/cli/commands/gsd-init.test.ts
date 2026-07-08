/**
 * gsd-init delegation (INT-2).
 *
 * gsd-init used to be a full TypeScript re-implementation of install.cjs that
 * drifted from it. It now delegates to the single canonical engine
 * (project-claude/install.cjs). These tests drive the real command end-to-end
 * against a synthetic manifest (via the SC_INSTALL_SOURCE_DIR seam that
 * overrides.sourceDir maps to) and assert the delegation actually installs,
 * uninstalls, honors --dry-run/--help, and forwards behavior — the engine's own
 * detailed behavior is covered by tests/integration/install-{guard,ledger}.test.ts.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gsdInitCommand } from './gsd-init.js';

const MANIFEST = {
  version: 2,
  project: 'test',
  files: {
    standalone: [
      { source: 'agents/test-agent.md', target: '.claude/agents/test-agent.md' },
      { source: 'commands/test-cmd.md', target: '.claude/commands/test-cmd.md' },
    ],
    skills: [
      {
        source: 'skills/test-skill',
        target: '.claude/skills/test-skill',
        files: ['SKILL.md', 'references/guide.md'],
      },
    ],
    hookScripts: [
      { source: 'hooks/test-hook.cjs', target: '.claude/hooks/test-hook.cjs' },
    ],
    settings: { source: 'settings.json', target: '.claude/settings.json' },
  },
};

const INSTALLED = [
  '.claude/agents/test-agent.md',
  '.claude/commands/test-cmd.md',
  '.claude/skills/test-skill/SKILL.md',
  '.claude/skills/test-skill/references/guide.md',
  '.claude/hooks/test-hook.cjs',
];

function writeSource(dir: string): void {
  const w = (rel: string, content: string) => {
    const full = join(dir, rel);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, content);
  };
  w('manifest.json', JSON.stringify(MANIFEST, null, 2));
  w('agents/test-agent.md', '# agent\n');
  w('commands/test-cmd.md', '# cmd\n');
  w('skills/test-skill/SKILL.md', '# skill\n');
  w('skills/test-skill/references/guide.md', '# guide\n');
  w('hooks/test-hook.cjs', '#!/usr/bin/env node\n');
  w(
    'settings.json',
    JSON.stringify({
      hooks: { PostToolUse: [{ hooks: [{ type: 'command', command: 'node x' }] }] },
    }),
  );
}

describe('gsd-init delegates to install.cjs (INT-2)', () => {
  let source: string;
  let project: string;
  let origCwd: string;

  beforeEach(() => {
    source = mkdtempSync(join(tmpdir(), 'gi-src-'));
    project = mkdtempSync(join(tmpdir(), 'gi-proj-'));
    writeSource(source);
    mkdirSync(join(project, '.claude'), { recursive: true });
    origCwd = process.cwd();
    process.chdir(project);
  });

  afterEach(() => {
    process.chdir(origCwd);
    rmSync(source, { recursive: true, force: true });
    rmSync(project, { recursive: true, force: true });
  });

  it('installs the manifest into the project via the canonical engine', async () => {
    await gsdInitCommand([], { sourceDir: source });
    for (const rel of INSTALLED) {
      expect(existsSync(join(project, rel)), rel).toBe(true);
    }
    // The install ledger is written only by install.cjs — proof the shared
    // engine ran rather than any leftover in-process path.
    expect(existsSync(join(project, '.claude/.skill-creator-install.json'))).toBe(true);
  });

  it('--dry-run writes nothing', async () => {
    await gsdInitCommand(['--dry-run'], { sourceDir: source });
    expect(existsSync(join(project, '.claude/agents/test-agent.md'))).toBe(false);
    expect(existsSync(join(project, '.claude/.skill-creator-install.json'))).toBe(false);
  });

  it('is idempotent — a second install keeps the files', async () => {
    await gsdInitCommand([], { sourceDir: source });
    await gsdInitCommand([], { sourceDir: source });
    for (const rel of INSTALLED) {
      expect(existsSync(join(project, rel)), rel).toBe(true);
    }
  });

  it('--uninstall removes what was installed and prunes emptied dirs', async () => {
    await gsdInitCommand([], { sourceDir: source });
    expect(existsSync(join(project, '.claude/agents/test-agent.md'))).toBe(true);
    await gsdInitCommand(['--uninstall'], { sourceDir: source });
    for (const rel of INSTALLED) {
      expect(existsSync(join(project, rel)), rel).toBe(false);
    }
    expect(existsSync(join(project, '.claude/skills/test-skill'))).toBe(false);
  });

  it('--help returns 0 without running the installer', async () => {
    const code = await gsdInitCommand(['--help'], { sourceDir: source });
    expect(code).toBe(0);
    expect(existsSync(join(project, '.claude/agents/test-agent.md'))).toBe(false);
  });
});
