import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { TeamStore, getTeamsBasePath, getAgentsBasePath } from './team-store.js';
import type { TeamConfig } from '../types/team.js';
import { PathTraversalError } from '../validation/path-safety.js';

describe('TeamStore', () => {
  let tempDir: string;
  let teamsDir: string;
  let store: TeamStore;

  function createValidConfig(overrides?: Partial<TeamConfig>): TeamConfig {
    return {
      name: 'test-team',
      leadAgentId: 'test-team-lead',
      createdAt: '2026-01-15T10:00:00Z',
      members: [
        { agentId: 'test-team-lead', name: 'Lead' },
        { agentId: 'test-team-worker-1', name: 'Worker 1' },
      ],
      ...overrides,
    };
  }

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'team-store-test-'));
    teamsDir = path.join(tempDir, 'teams');
    store = new TeamStore(teamsDir);
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  // ==========================================================================
  // save
  // ==========================================================================

  describe('save', () => {
    it('creates directory structure {teamsDir}/{name}/config.json', async () => {
      const config = createValidConfig();
      const configPath = await store.save(config);

      expect(configPath).toBe(path.join(teamsDir, 'test-team', 'config.json'));
      expect(fs.existsSync(configPath)).toBe(true);
    });

    it('writes valid JSON matching input config', async () => {
      const config = createValidConfig();
      await store.save(config);

      const content = fs.readFileSync(
        path.join(teamsDir, 'test-team', 'config.json'),
        'utf-8'
      );
      const parsed = JSON.parse(content);

      expect(parsed.name).toBe('test-team');
      expect(parsed.leadAgentId).toBe('test-team-lead');
      expect(parsed.members).toHaveLength(2);
    });

    it('returns correct path', async () => {
      const config = createValidConfig();
      const result = await store.save(config);

      expect(result).toBe(path.join(teamsDir, 'test-team', 'config.json'));
    });

    it('writes JSON with 2-space indentation and trailing newline', async () => {
      const config = createValidConfig();
      await store.save(config);

      const content = fs.readFileSync(
        path.join(teamsDir, 'test-team', 'config.json'),
        'utf-8'
      );

      // Should have 2-space indentation
      expect(content).toContain('  "name"');
      // Should end with newline
      expect(content.endsWith('\n')).toBe(true);
    });
  });

  // ==========================================================================
  // save with validation
  // ==========================================================================

  describe('save with validation', () => {
    it('rejects config with empty name (caught by path safety)', async () => {
      const config = createValidConfig({ name: '' });

      // Empty name is now caught by assertSafeName before team validation
      await expect(store.save(config)).rejects.toThrow(PathTraversalError);
    });

    it('rejects config with missing members', async () => {
      const config = createValidConfig({ members: [] });

      await expect(store.save(config)).rejects.toThrow(/Invalid team config/);
    });

    it('includes descriptive error in rejection', async () => {
      const config = createValidConfig({ name: '', leadAgentId: '' });

      // Empty name is caught by path safety with descriptive message
      await expect(store.save(config)).rejects.toThrow(/name/i);
    });
  });

  // ==========================================================================
  // read
  // ==========================================================================

  describe('read', () => {
    it('reads back a previously saved config', async () => {
      const config = createValidConfig({ description: 'My test team' });
      await store.save(config);

      const result = await store.read('test-team');

      expect(result.name).toBe('test-team');
      expect(result.description).toBe('My test team');
      expect(result.leadAgentId).toBe('test-team-lead');
      expect(result.members).toHaveLength(2);
    });

    it('throws on non-existent team', async () => {
      await expect(store.read('nonexistent')).rejects.toThrow();
    });
  });

  // ==========================================================================
  // exists
  // ==========================================================================

  describe('exists', () => {
    it('returns true for saved team', async () => {
      await store.save(createValidConfig());

      expect(await store.exists('test-team')).toBe(true);
    });

    it('returns false for non-existent team', async () => {
      expect(await store.exists('nonexistent')).toBe(false);
    });
  });

  // ==========================================================================
  // list
  // ==========================================================================

  describe('list', () => {
    it('returns empty array when no teams exist', async () => {
      const result = await store.list();

      expect(result).toEqual([]);
    });

    it('returns array of team names after saving multiple teams', async () => {
      await store.save(createValidConfig({ name: 'alpha' }));
      await store.save(
        createValidConfig({ name: 'beta', leadAgentId: 'beta-lead', members: [{ agentId: 'beta-lead', name: 'Lead' }] })
      );

      const result = await store.list();

      expect(result.sort()).toEqual(['alpha', 'beta']);
    });

    it('ignores directories without config.json', async () => {
      await store.save(createValidConfig());

      // Create a directory without config.json
      fs.mkdirSync(path.join(teamsDir, 'not-a-team'), { recursive: true });

      const result = await store.list();

      expect(result).toEqual(['test-team']);
    });
  });

  // ==========================================================================
  // delete
  // ==========================================================================

  describe('delete', () => {
    it('removes the team directory', async () => {
      await store.save(createValidConfig());
      expect(fs.existsSync(path.join(teamsDir, 'test-team'))).toBe(true);

      await store.delete('test-team');

      expect(fs.existsSync(path.join(teamsDir, 'test-team'))).toBe(false);
    });

    it('exists returns false after delete', async () => {
      await store.save(createValidConfig());
      await store.delete('test-team');

      expect(await store.exists('test-team')).toBe(false);
    });
  });

  // ==========================================================================
  // Path traversal protection
  // ==========================================================================

  describe('path traversal protection', () => {
    const maliciousNames = [
      { name: '../malicious', label: 'parent traversal' },
      { name: 'foo/bar', label: 'forward slash separator' },
      { name: 'foo\\bar', label: 'backslash separator' },
      { name: 'foo\x00bar', label: 'null byte' },
      { name: '../../etc/passwd', label: 'deep traversal' },
      { name: '..', label: 'standalone double dot' },
    ];

    describe('save rejects traversal names', () => {
      for (const { name, label } of maliciousNames) {
        it(`rejects ${label}: "${name.replace('\x00', '\\x00')}"`, async () => {
          const config = createValidConfig({ name });
          await expect(store.save(config)).rejects.toThrow(PathTraversalError);
        });
      }
    });

    describe('read rejects traversal names', () => {
      for (const { name, label } of maliciousNames) {
        it(`rejects ${label}: "${name.replace('\x00', '\\x00')}"`, async () => {
          await expect(store.read(name)).rejects.toThrow(PathTraversalError);
        });
      }
    });

    describe('exists rejects traversal names', () => {
      for (const { name, label } of maliciousNames) {
        it(`rejects ${label}: "${name.replace('\x00', '\\x00')}"`, async () => {
          await expect(store.exists(name)).rejects.toThrow(PathTraversalError);
        });
      }
    });

    describe('delete rejects traversal names', () => {
      for (const { name, label } of maliciousNames) {
        it(`rejects ${label}: "${name.replace('\x00', '\\x00')}"`, async () => {
          await expect(store.delete(name)).rejects.toThrow(PathTraversalError);
        });
      }
    });

    describe('valid names still work (no regression)', () => {
      it('save with valid name succeeds', async () => {
        const config = createValidConfig({ name: 'valid-team' });
        const result = await store.save(config);
        expect(result).toContain('valid-team');
      });

      it('read after save works', async () => {
        await store.save(createValidConfig());
        const result = await store.read('test-team');
        expect(result.name).toBe('test-team');
      });

      it('exists returns true for saved team', async () => {
        await store.save(createValidConfig());
        expect(await store.exists('test-team')).toBe(true);
      });

      it('delete removes saved team', async () => {
        await store.save(createValidConfig());
        await store.delete('test-team');
        expect(await store.exists('test-team')).toBe(false);
      });
    });
  });
});

// ============================================================================
// getTeamsBasePath
// ============================================================================

describe('getTeamsBasePath', () => {
  it('returns .claude/teams for project scope', () => {
    const result = getTeamsBasePath('project');

    expect(result).toBe(path.join('.claude', 'teams'));
  });

  it('returns path with homedir prefix for user scope', () => {
    const result = getTeamsBasePath('user');

    expect(result).toContain(path.join('.claude', 'teams'));
    expect(result).toContain(os.homedir());
  });
});

// ============================================================================
// getAgentsBasePath
// ============================================================================

describe('getAgentsBasePath', () => {
  it('always returns .claude/agents (project scope)', () => {
    const result = getAgentsBasePath();

    expect(result).toBe(path.join('.claude', 'agents'));
  });
});
