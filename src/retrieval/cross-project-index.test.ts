import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SkillIndexEntry } from '../storage/skill-index.js';

// Mock dependencies before importing the module under test
vi.mock('../storage/skill-store.js', () => ({
  SkillStore: vi.fn(),
}));

vi.mock('../storage/skill-index.js', () => ({
  SkillIndex: vi.fn(),
}));

vi.mock('../types/scope.js', () => ({
  getSkillsBasePath: vi.fn((scope: string) => {
    if (scope === 'user') return '/home/user/.claude/skills';
    return '.claude/skills';
  }),
}));

vi.mock('../embeddings/embedding-cache.js', () => ({
  EmbeddingCache: vi.fn(),
}));

// Now import the module under test and mocked modules
import { CrossProjectIndex } from './cross-project-index.js';
import { SkillIndex } from '../storage/skill-index.js';
import { SkillStore } from '../storage/skill-store.js';
import { getSkillsBasePath } from '../types/scope.js';
import { EmbeddingCache } from '../embeddings/embedding-cache.js';

/**
 * Helper to create a mock SkillIndex with configurable search results.
 */
function createMockIndex(searchResults: SkillIndexEntry[]): SkillIndex {
  return {
    search: vi.fn().mockResolvedValue(searchResults),
    load: vi.fn().mockResolvedValue(undefined),
    getAll: vi.fn().mockResolvedValue(searchResults),
    getEnabled: vi.fn().mockResolvedValue(searchResults),
    save: vi.fn().mockResolvedValue(undefined),
    rebuild: vi.fn().mockResolvedValue(undefined),
    refresh: vi.fn().mockResolvedValue(undefined),
    findByTrigger: vi.fn().mockResolvedValue([]),
  } as unknown as SkillIndex;
}

function makeEntry(name: string, description: string): SkillIndexEntry {
  return {
    name,
    description,
    enabled: true,
    path: `/skills/${name}/SKILL.md`,
    mtime: Date.now(),
  };
}

describe('CrossProjectIndex', () => {
  let index: CrossProjectIndex;

  beforeEach(() => {
    vi.clearAllMocks();

    // Configure SkillIndex constructor to return mock indexes based on dir
    const mockIndexes = new Map<string, SkillIndex>();
    vi.mocked(SkillIndex).mockImplementation((_store: unknown, dir?: string) => {
      const existing = mockIndexes.get(dir ?? '');
      if (existing) return existing;
      return createMockIndex([]);
    });

    vi.mocked(SkillStore).mockImplementation((_dir?: string) => ({} as any));

    index = new CrossProjectIndex();
  });

  describe('search()', () => {
    it('returns results from a single directory', async () => {
      const entry1 = makeEntry('typescript-patterns', 'TypeScript coding patterns');
      const entry2 = makeEntry('typescript-testing', 'TypeScript testing utilities');

      vi.mocked(SkillIndex).mockImplementation((_store: unknown, _dir?: string) => {
        return createMockIndex([entry1, entry2]);
      });

      const output = await index.search('typescript', ['/path/to/skills']);

      expect(output.results).toHaveLength(2);
      expect(output.results[0].sourceDir).toBe('/path/to/skills');
      expect(output.results[0].scope).toBeDefined();
    });

    it('merges results from multiple directories', async () => {
      const userDir = '/home/user/.claude/skills';
      const projectDir = '.claude/skills';
      const pluginDir = '/custom/plugins';

      const userEntry = makeEntry('user-skill', 'A user skill for testing');
      const projectEntry = makeEntry('project-skill', 'A project skill for testing');
      const pluginEntry = makeEntry('plugin-skill', 'A plugin skill for testing');

      vi.mocked(SkillIndex).mockImplementation((_store: unknown, dir?: string) => {
        if (dir === userDir) return createMockIndex([userEntry]);
        if (dir === projectDir) return createMockIndex([projectEntry]);
        if (dir === pluginDir) return createMockIndex([pluginEntry]);
        return createMockIndex([]);
      });

      const output = await index.search('test', [userDir, projectDir, pluginDir]);

      expect(output.results).toHaveLength(3);
      const dirs = output.results.map(r => r.sourceDir);
      expect(dirs).toContain(userDir);
      expect(dirs).toContain(projectDir);
      expect(dirs).toContain(pluginDir);
    });

    it('sorts results by score descending across directories', async () => {
      const userDir = '/home/user/.claude/skills';
      const projectDir = '.claude/skills';
      const pluginDir = '/custom/plugins';

      // User dir: name match only (no description match) -> lower score
      const userEntry = makeEntry('test-low', 'some other thing');
      // Project dir: exact name match -> highest score
      const projectEntry = makeEntry('test', 'exact name match for test');
      // Plugin dir: description match only -> mid score
      const pluginEntry = makeEntry('something', 'a test plugin for tasks');

      vi.mocked(SkillIndex).mockImplementation((_store: unknown, dir?: string) => {
        if (dir === userDir) return createMockIndex([userEntry]);
        if (dir === projectDir) return createMockIndex([projectEntry]);
        if (dir === pluginDir) return createMockIndex([pluginEntry]);
        return createMockIndex([]);
      });

      const output = await index.search('test', [userDir, projectDir, pluginDir]);

      expect(output.results.length).toBe(3);
      // Verify descending score order
      for (let i = 1; i < output.results.length; i++) {
        expect(output.results[i - 1].score).toBeGreaterThanOrEqual(output.results[i].score);
      }
      // Project entry with exact name match should be first
      expect(output.results[0].name).toBe('test');
    });

    it('correctly classifies scope', async () => {
      const userDir = '/home/user/.claude/skills';
      const projectDir = '.claude/skills';
      const pluginDir = '/custom/plugins';

      const userEntry = makeEntry('u-skill', 'user skill');
      const projectEntry = makeEntry('p-skill', 'project skill');
      const pluginEntry = makeEntry('x-skill', 'plugin skill');

      vi.mocked(SkillIndex).mockImplementation((_store: unknown, dir?: string) => {
        if (dir === userDir) return createMockIndex([userEntry]);
        if (dir === projectDir) return createMockIndex([projectEntry]);
        if (dir === pluginDir) return createMockIndex([pluginEntry]);
        return createMockIndex([]);
      });

      const output = await index.search('skill', [userDir, projectDir, pluginDir]);

      const userResult = output.results.find(r => r.name === 'u-skill');
      const projectResult = output.results.find(r => r.name === 'p-skill');
      const pluginResult = output.results.find(r => r.name === 'x-skill');

      expect(userResult?.scope).toBe('user');
      expect(projectResult?.scope).toBe('project');
      expect(pluginResult?.scope).toBe('plugin');
    });

    it('returns empty array when no matches', async () => {
      vi.mocked(SkillIndex).mockImplementation(() => createMockIndex([]));

      const output = await index.search('nonexistent', ['/dir1', '/dir2']);

      expect(output.results).toEqual([]);
    });

    it('handles directory that does not exist gracefully', async () => {
      const validDir = '/home/user/.claude/skills';
      const invalidDir = '/nonexistent/dir';

      const validEntry = makeEntry('valid-skill', 'A valid skill');

      vi.mocked(SkillIndex).mockImplementation((_store: unknown, dir?: string) => {
        if (dir === validDir) return createMockIndex([validEntry]);
        if (dir === invalidDir) {
          const failingIndex = createMockIndex([]);
          vi.mocked(failingIndex.search).mockRejectedValue(new Error('ENOENT: no such file or directory'));
          return failingIndex;
        }
        return createMockIndex([]);
      });

      // Should not throw
      const output = await index.search('skill', [validDir, invalidDir]);

      // Valid dir results should still be returned
      expect(output.results.length).toBeGreaterThanOrEqual(1);
      expect(output.results.some(r => r.name === 'valid-skill')).toBe(true);
    });

    it('detects version drift across directories', async () => {
      const dir1 = '/dir1';
      const dir2 = '/dir2';

      const entry1 = makeEntry('skill-a', 'skill in dir1');
      const entry2 = makeEntry('skill-b', 'skill in dir2');

      vi.mocked(SkillIndex).mockImplementation((_store: unknown, dir?: string) => {
        if (dir === dir1) return createMockIndex([entry1]);
        if (dir === dir2) return createMockIndex([entry2]);
        return createMockIndex([]);
      });

      // Mock EmbeddingCache instances with different model versions
      const cache1 = { getVersionInfo: vi.fn().mockReturnValue('model-v1') };
      const cache2 = { getVersionInfo: vi.fn().mockReturnValue('model-v2') };

      vi.mocked(EmbeddingCache).mockImplementation((...args: unknown[]) => {
        const modelVersion = args[0] as string;
        if (modelVersion === 'model-v1') return cache1 as any;
        return cache2 as any;
      });

      // CrossProjectIndex should detect version drift when checking caches
      const output = await index.search('skill', [dir1, dir2], {
        cacheVersions: { [dir1]: 'model-v1', [dir2]: 'model-v2' },
      });

      expect(output.versionDriftWarning).toBeDefined();
      expect(output.versionDriftWarning).toContain('model-v1');
      expect(output.versionDriftWarning).toContain('model-v2');
    });
  });

  describe('getSearchDirectories()', () => {
    it('returns user + project + CLI-specified plugin dirs', () => {
      const dirs = index.getSearchDirectories({
        pluginDirs: ['/custom/plugins'],
      });

      expect(dirs).toContain('/home/user/.claude/skills');
      expect(dirs).toContain('.claude/skills');
      expect(dirs).toContain('/custom/plugins');
      expect(dirs).toHaveLength(3);
    });

    it('deduplicates directories', () => {
      // Pass user dir as a plugin dir too
      const dirs = index.getSearchDirectories({
        pluginDirs: ['/home/user/.claude/skills'],
      });

      // Should not have duplicates
      const unique = new Set(dirs);
      expect(dirs.length).toBe(unique.size);
      // user + project = 2 (plugin matches user, deduplicated)
      expect(dirs).toHaveLength(2);
    });
  });
});
