import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  mkdtemp,
  writeFile,
  mkdir,
  readFile,
  rm,
  readdir,
  stat,
} from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { gsdInitCommand, assertContained } from './gsd-init.js';

// ── Helpers ─────────────────────────────────────────────────────────────

/** Minimal manifest for testing */
function createMiniManifest(overrides: Record<string, unknown> = {}) {
  return {
    version: 2,
    project: 'test-project',
    description: 'Test manifest',
    files: {
      standalone: [
        {
          source: 'agents/test-agent.md',
          target: '.claude/agents/test-agent.md',
          description: 'Test agent',
        },
        {
          source: 'commands/test-cmd.md',
          target: '.claude/commands/test-cmd.md',
          description: 'Test command',
        },
      ],
      skills: [
        {
          source: 'skills/test-skill',
          target: '.claude/skills/test-skill',
          description: 'Test skill',
          files: ['SKILL.md', 'references/guide.md'],
        },
      ],
      hookScripts: [
        {
          source: 'hooks/test-hook.sh',
          target: '.claude/hooks/test-hook.sh',
          description: 'Test hook script',
        },
      ],
      claudeMd: {
        source: 'CLAUDE.md',
        target: 'CLAUDE.md',
        description: 'Test CLAUDE.md',
        legacyThreshold: 100,
      },
      extensions: [
        {
          source: 'extensions/test-ext.md',
          target: '.claude/agents/test-agent.md',
          marker: 'TEST:extension',
          description: 'Test extension',
        },
      ],
      settings: {
        source: 'settings.json',
        target: '.claude/settings.json',
        description: 'Test settings',
      },
      ...overrides,
    },
  };
}

/**
 * Create a mini source directory mimicking project-claude/ structure.
 */
async function createMiniSource(baseDir: string, manifest?: ReturnType<typeof createMiniManifest>) {
  const sourceDir = join(baseDir, 'source');
  const m = manifest ?? createMiniManifest();

  await mkdir(sourceDir, { recursive: true });
  await writeFile(join(sourceDir, 'manifest.json'), JSON.stringify(m, null, 2));

  // Standalone files
  if (m.files.standalone) {
    for (const entry of m.files.standalone) {
      const filePath = join(sourceDir, entry.source);
      await mkdir(join(filePath, '..'), { recursive: true });
      await writeFile(filePath, `# ${entry.description}\nContent for ${entry.target}\n`);
    }
  }

  // Skill directories
  if (m.files.skills) {
    for (const entry of m.files.skills as Array<{ source: string; files?: string[]; description: string }>) {
      const skillDir = join(sourceDir, entry.source);
      await mkdir(skillDir, { recursive: true });
      for (const file of entry.files || []) {
        const filePath = join(skillDir, file);
        await mkdir(join(filePath, '..'), { recursive: true });
        await writeFile(filePath, `# ${entry.description}\nFile: ${file}\n`);
      }
    }
  }

  // Hook scripts
  if (m.files.hookScripts) {
    for (const entry of m.files.hookScripts) {
      const filePath = join(sourceDir, entry.source);
      await mkdir(join(filePath, '..'), { recursive: true });
      await writeFile(filePath, `#!/bin/bash\n# ${entry.description}\necho "hook"\n`);
    }
  }

  // CLAUDE.md
  if (m.files.claudeMd) {
    const entry = m.files.claudeMd as { source: string };
    await writeFile(join(sourceDir, entry.source), '# Test Project\n\nSlim CLAUDE.md\n');
  }

  // Extensions
  if (m.files.extensions) {
    for (const entry of m.files.extensions as Array<{ source: string; marker: string }>) {
      const filePath = join(sourceDir, entry.source);
      await mkdir(join(filePath, '..'), { recursive: true });
      const marker = entry.marker;
      await writeFile(
        filePath,
        `<!-- ${marker} START -->\n<test-ext>\nExtension content\n</test-ext>\n<!-- ${marker} END -->\n`,
      );
    }
  }

  // Settings
  if (m.files.settings) {
    const entry = m.files.settings as { source: string };
    const settings = {
      hooks: {
        SessionStart: [
          {
            hooks: [
              { type: 'command', command: 'node .claude/hooks/test-hook.js' },
            ],
          },
        ],
      },
      statusLine: {
        type: 'command',
        command: 'node .claude/hooks/test-statusline.js',
      },
    };
    await writeFile(join(sourceDir, entry.source), JSON.stringify(settings, null, 2));
  }

  // Git hook source (post-commit)
  await mkdir(join(sourceDir, 'hooks'), { recursive: true });
  await writeFile(
    join(sourceDir, 'hooks', 'post-commit'),
    '#!/bin/bash\n# GSD skill-creator post-commit hook\necho "post-commit"\n',
  );

  return sourceDir;
}

/**
 * Create a minimal project directory with .claude/ and .git/.
 */
async function createMiniProject(baseDir: string) {
  const projectDir = join(baseDir, 'project');
  await mkdir(join(projectDir, '.claude'), { recursive: true });
  await mkdir(join(projectDir, '.git', 'hooks'), { recursive: true });
  await mkdir(join(projectDir, '.planning'), { recursive: true });
  return projectDir;
}

// ── Tests ───────────────────────────────────────────────────────────────

describe('gsd-init command', () => {
  let tempDir: string;
  let sourceDir: string;
  let projectDir: string;
  let origCwd: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'gsd-init-test-'));
    sourceDir = await createMiniSource(tempDir);
    projectDir = await createMiniProject(tempDir);
    origCwd = process.cwd();
    process.chdir(projectDir);
  });

  afterEach(async () => {
    process.chdir(origCwd);
    await rm(tempDir, { recursive: true, force: true });
  });

  // TEST-02: Fresh install
  it('fresh install — all manifest components installed', async () => {
    // Exit code may be non-zero due to validation checking for real project
    // files not in our mini manifest. We test the install behavior itself.
    await gsdInitCommand([], { sourceDir });

    // Standalone files
    expect(existsSync(join(projectDir, '.claude/agents/test-agent.md'))).toBe(true);
    expect(existsSync(join(projectDir, '.claude/commands/test-cmd.md'))).toBe(true);

    // Skill dir with files
    expect(existsSync(join(projectDir, '.claude/skills/test-skill/SKILL.md'))).toBe(true);
    expect(existsSync(join(projectDir, '.claude/skills/test-skill/references/guide.md'))).toBe(true);

    // Hook script
    expect(existsSync(join(projectDir, '.claude/hooks/test-hook.sh'))).toBe(true);
    const hookStat = await stat(join(projectDir, '.claude/hooks/test-hook.sh'));
    expect((hookStat.mode & 0o755)).toBe(0o755);

    // CLAUDE.md
    expect(existsSync(join(projectDir, 'CLAUDE.md'))).toBe(true);

    // Settings
    expect(existsSync(join(projectDir, '.claude/settings.json'))).toBe(true);

    // Integration config
    expect(existsSync(join(projectDir, '.planning/skill-creator.json'))).toBe(true);

    // Patterns dir
    expect(existsSync(join(projectDir, '.planning/patterns'))).toBe(true);
  });

  // TEST-03: Idempotent re-run
  it('idempotent re-run — second run reports all current', async () => {
    await gsdInitCommand([], { sourceDir });
    const consoleSpy = vi.spyOn(console, 'log');

    await gsdInitCommand([], { sourceDir });

    const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
    // Should not contain "installed:" for the second run
    expect(output).not.toMatch(/\+.*installed:.*test-agent/);
    expect(output).not.toMatch(/\+.*installed:.*test-cmd/);
    // Should contain "current:" messages
    expect(output).toContain('current:');

    consoleSpy.mockRestore();
  });

  // TEST-04: --force overwrites differing files
  it('--force overwrites differing files', async () => {
    await gsdInitCommand([], { sourceDir });

    // Modify an installed file
    await writeFile(
      join(projectDir, '.claude/agents/test-agent.md'),
      '# Modified\nDifferent content\n',
    );

    await gsdInitCommand(['--force'], { sourceDir });

    const content = await readFile(
      join(projectDir, '.claude/agents/test-agent.md'),
      'utf-8',
    );
    expect(content).toContain('Test agent');
  });

  // TEST-05: --dry-run makes no filesystem changes
  it('--dry-run makes no filesystem changes', async () => {
    await gsdInitCommand(['--dry-run'], { sourceDir });

    // Nothing should be installed
    expect(existsSync(join(projectDir, '.claude/agents/test-agent.md'))).toBe(false);
    expect(existsSync(join(projectDir, '.claude/commands/test-cmd.md'))).toBe(false);
    expect(existsSync(join(projectDir, '.claude/skills/test-skill/SKILL.md'))).toBe(false);
    expect(existsSync(join(projectDir, '.claude/hooks/test-hook.sh'))).toBe(false);
    expect(existsSync(join(projectDir, 'CLAUDE.md'))).toBe(false);
  });

  // TEST-06: Error handling — missing .claude/, missing manifest, invalid JSON
  describe('error handling', () => {
    it('returns error when .claude/ missing', async () => {
      await rm(join(projectDir, '.claude'), { recursive: true, force: true });

      const exitCode = await gsdInitCommand([], { sourceDir });

      expect(exitCode).toBe(1);
    });

    it('returns error when manifest missing', async () => {
      await rm(join(sourceDir, 'manifest.json'));

      const exitCode = await gsdInitCommand([], { sourceDir });

      expect(exitCode).toBe(1);
    });

    it('returns error when manifest is invalid JSON', async () => {
      await writeFile(join(sourceDir, 'manifest.json'), '{ invalid json }');

      const exitCode = await gsdInitCommand([], { sourceDir });

      expect(exitCode).toBe(1);
    });
  });

  // TEST-07: Uninstall — all targets removed, patterns preserved
  it('uninstall removes all targets and preserves patterns', async () => {
    // Install first
    await gsdInitCommand([], { sourceDir });

    // Create some pattern data
    await mkdir(join(projectDir, '.planning/patterns'), { recursive: true });
    await writeFile(join(projectDir, '.planning/patterns/data.json'), '{}');

    // Create a non-ours git hook
    // (our hook would contain 'GSD skill-creator post-commit hook')
    await writeFile(join(projectDir, '.git/hooks/post-commit'), '#!/bin/bash\necho "user hook"\n');

    // Uninstall
    const exitCode = await gsdInitCommand(['--uninstall'], { sourceDir });

    expect(exitCode).toBe(0);

    // Standalone files should be gone
    expect(existsSync(join(projectDir, '.claude/agents/test-agent.md'))).toBe(false);
    expect(existsSync(join(projectDir, '.claude/commands/test-cmd.md'))).toBe(false);

    // Skill dirs should be gone
    expect(existsSync(join(projectDir, '.claude/skills/test-skill'))).toBe(false);

    // Hook scripts should be gone
    expect(existsSync(join(projectDir, '.claude/hooks/test-hook.sh'))).toBe(false);

    // Integration config should be gone
    expect(existsSync(join(projectDir, '.planning/skill-creator.json'))).toBe(false);

    // Patterns preserved
    expect(existsSync(join(projectDir, '.planning/patterns/data.json'))).toBe(true);

    // Non-ours git hook preserved
    expect(existsSync(join(projectDir, '.git/hooks/post-commit'))).toBe(true);
    const hookContent = await readFile(join(projectDir, '.git/hooks/post-commit'), 'utf-8');
    expect(hookContent).toContain('user hook');
  });

  // TEST-08: --quiet uninstall produces zero console output
  it('--quiet uninstall produces zero console output', async () => {
    await gsdInitCommand([], { sourceDir });

    const consoleSpy = vi.spyOn(console, 'log');

    await gsdInitCommand(['--uninstall', '--quiet'], { sourceDir });

    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  // TEST-09: Settings merge deduplication
  it('settings merge does not create duplicates on re-run', async () => {
    await gsdInitCommand([], { sourceDir });
    await gsdInitCommand([], { sourceDir });

    const settingsContent = await readFile(
      join(projectDir, '.claude/settings.json'),
      'utf-8',
    );
    const settings = JSON.parse(settingsContent);
    const sessionStartHooks = settings.hooks?.SessionStart || [];

    // Count occurrences of our test hook command
    const hookCommands = sessionStartHooks
      .flatMap((g: { hooks?: Array<{ command: string }> }) => g.hooks || [])
      .map((h: { command: string }) => h.command);

    const testHookCount = hookCommands.filter(
      (c: string) => c === 'node .claude/hooks/test-hook.js',
    ).length;

    expect(testHookCount).toBe(1);
  });

  // TEST-10: Path traversal rejection
  it('assertContained throws on path traversal', () => {
    expect(() => assertContained('/tmp/evil', '/home/user/project')).toThrow(
      'Path traversal blocked',
    );

    expect(() =>
      assertContained(
        join('/home/user/project', '..', '..', 'etc', 'evil'),
        '/home/user/project',
      ),
    ).toThrow('Path traversal blocked');

    // Valid paths should not throw
    expect(() =>
      assertContained(
        join('/home/user/project', '.claude', 'skills', 'test'),
        '/home/user/project',
      ),
    ).not.toThrow();
  });

  // Additional: Extension install and uninstall
  it('extensions are injected and stripped correctly during uninstall', async () => {
    // Install — the agent file gets created, then extension appends to it
    await gsdInitCommand([], { sourceDir });

    const agentContent = await readFile(
      join(projectDir, '.claude/agents/test-agent.md'),
      'utf-8',
    );

    // Extension should have been installed (appended or updated)
    const hasExtension =
      agentContent.includes('TEST:extension START') ||
      agentContent.includes('test-ext');

    expect(hasExtension).toBe(true);

    // Now uninstall
    await gsdInitCommand(['--uninstall'], { sourceDir });

    // The agent file itself should be removed (standalone target)
    expect(existsSync(join(projectDir, '.claude/agents/test-agent.md'))).toBe(false);
  });

  // Additional: --help flag
  it('--help returns 0 and displays usage', async () => {
    const consoleSpy = vi.spyOn(console, 'log');

    const exitCode = await gsdInitCommand(['--help'], { sourceDir });

    expect(exitCode).toBe(0);
    const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain('skill-creator gsd-init');
    expect(output).toContain('--dry-run');

    consoleSpy.mockRestore();
  });
});
