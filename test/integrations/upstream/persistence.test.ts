import { describe, it, expect } from 'vitest';
import {
  appendLog,
  readLog,
  writeCache,
  readCache,
  createRollbackBackup,
  restoreFromBackup,
} from '../../../src/integrations/upstream/persistence';
import type { PersistenceDeps } from '../../../src/integrations/upstream/persistence';

/** Helper: build minimal persistence deps with in-memory storage */
function makeDeps(overrides: Partial<PersistenceDeps> = {}): PersistenceDeps {
  const files = new Map<string, string>();

  return {
    readFile: async (path: string): Promise<string> => {
      const content = files.get(path);
      if (content === undefined) throw new Error(`ENOENT: ${path}`);
      return content;
    },
    writeFile: async (path: string, content: string): Promise<void> => {
      files.set(path, content);
    },
    appendFile: async (path: string, content: string): Promise<void> => {
      const existing = files.get(path) ?? '';
      files.set(path, existing + content);
    },
    copyFile: async (src: string, dest: string): Promise<void> => {
      const content = files.get(src);
      if (content === undefined) throw new Error(`ENOENT: ${src}`);
      files.set(dest, content);
    },
    mkdir: async (): Promise<void> => {},
    exists: async (path: string): Promise<boolean> => files.has(path),
    ...overrides,
  };
}

describe('Persistence Layer', () => {
  describe('appendLog', () => {
    it('appends entry to JSONL (one JSON object per line)', async () => {
      const written: string[] = [];
      const deps = makeDeps({
        appendFile: async (_path: string, content: string): Promise<void> => {
          written.push(content);
        },
      });

      const entry = { id: 'evt-001', channel: 'docs', timestamp: '2026-02-26T00:00:00Z' };
      await appendLog('/data/intel.jsonl', entry, deps);

      expect(written).toHaveLength(1);
      const line = written[0];
      // Must be valid JSON followed by newline
      expect(line.endsWith('\n')).toBe(true);
      const parsed = JSON.parse(line.trim());
      expect(parsed.id).toBe('evt-001');
      expect(parsed.channel).toBe('docs');
    });
  });

  describe('readLog', () => {
    it('reads all entries from JSONL file', async () => {
      const jsonl = '{"id":"a","value":1}\n{"id":"b","value":2}\n';
      const deps = makeDeps({
        readFile: async (): Promise<string> => jsonl,
        exists: async (): Promise<boolean> => true,
      });

      const entries = await readLog<{ id: string; value: number }>('/data/intel.jsonl', deps);

      expect(entries).toHaveLength(2);
      expect(entries[0].id).toBe('a');
      expect(entries[1].value).toBe(2);
    });

    it('validates entry format on read (skip malformed lines)', async () => {
      const jsonl = '{"id":"good"}\nNOT_JSON\n{"id":"also-good"}\n';
      const deps = makeDeps({
        readFile: async (): Promise<string> => jsonl,
        exists: async (): Promise<boolean> => true,
      });

      const entries = await readLog<{ id: string }>('/data/intel.jsonl', deps);

      expect(entries).toHaveLength(2);
      expect(entries[0].id).toBe('good');
      expect(entries[1].id).toBe('also-good');
    });
  });

  describe('safety-critical invariants', () => {
    it('SC-08: intelligence log is append-only — existing entries never modified', async () => {
      const fileStore = new Map<string, string>();
      fileStore.set('/data/intel.jsonl', '{"id":"original"}\n');

      const deps = makeDeps({
        readFile: async (path: string): Promise<string> => {
          return fileStore.get(path) ?? '';
        },
        appendFile: async (path: string, content: string): Promise<void> => {
          const existing = fileStore.get(path) ?? '';
          fileStore.set(path, existing + content);
        },
        exists: async (path: string): Promise<boolean> => fileStore.has(path),
      });

      // Append a new entry
      await appendLog('/data/intel.jsonl', { id: 'new-entry' }, deps);

      // Read back — original entry must still be present and unmodified
      const entries = await readLog<{ id: string }>('/data/intel.jsonl', deps);
      expect(entries).toHaveLength(2);
      expect(entries[0].id).toBe('original');
      expect(entries[1].id).toBe('new-entry');

      // Verify the raw content still starts with the original line
      const raw = fileStore.get('/data/intel.jsonl')!;
      expect(raw.startsWith('{"id":"original"}\n')).toBe(true);
    });
  });

  describe('writeCache', () => {
    it('stores content at channel/slot path', async () => {
      const written = new Map<string, string>();
      const deps = makeDeps({
        writeFile: async (path: string, content: string): Promise<void> => {
          written.set(path, content);
        },
      });

      await writeCache('/cache', 'anthropic-docs', 'latest', 'cached-content', deps);

      // Should write to cache/channel/slot path structure
      const key = Array.from(written.keys()).find((k) => k.includes('anthropic-docs'));
      expect(key).toBeDefined();
      expect(written.get(key!)).toBe('cached-content');
    });
  });

  describe('readCache', () => {
    it('retrieves cached content', async () => {
      const deps = makeDeps({
        readFile: async (): Promise<string> => 'cached-data',
        exists: async (): Promise<boolean> => true,
      });

      const result = await readCache('/cache', 'anthropic-docs', 'latest', deps);

      expect(result).toBe('cached-data');
    });

    it('returns null for missing cache file (no crash)', async () => {
      const deps = makeDeps({
        exists: async (): Promise<boolean> => false,
      });

      const result = await readCache('/cache', 'missing-channel', 'latest', deps);

      expect(result).toBeNull();
    });
  });

  describe('rollback', () => {
    it('createRollbackBackup copies file to rollback directory', async () => {
      const copies: Array<{ src: string; dest: string }> = [];
      const deps = makeDeps({
        readFile: async (): Promise<string> => 'original-content',
        copyFile: async (src: string, dest: string): Promise<void> => {
          copies.push({ src, dest });
        },
      });

      const backupPath = await createRollbackBackup('/skills/test/SKILL.md', '/rollbacks', deps);

      expect(copies).toHaveLength(1);
      expect(copies[0].src).toBe('/skills/test/SKILL.md');
      expect(copies[0].dest).toContain('/rollbacks');
      expect(typeof backupPath).toBe('string');
      expect(backupPath.length).toBeGreaterThan(0);
    });

    it('restoreFromBackup restores content from backup', async () => {
      const files = new Map<string, string>();
      files.set('/rollbacks/backup-123', 'original-content');

      const deps = makeDeps({
        readFile: async (path: string): Promise<string> => {
          const content = files.get(path);
          if (!content) throw new Error(`ENOENT: ${path}`);
          return content;
        },
        writeFile: async (path: string, content: string): Promise<void> => {
          files.set(path, content);
        },
      });

      await restoreFromBackup('/rollbacks/backup-123', '/skills/test/SKILL.md', deps);

      expect(files.get('/skills/test/SKILL.md')).toBe('original-content');
    });
  });

  describe('edge cases', () => {
    it('handles empty log file gracefully', async () => {
      const deps = makeDeps({
        readFile: async (): Promise<string> => '',
        exists: async (): Promise<boolean> => true,
      });

      const entries = await readLog('/data/empty.jsonl', deps);

      expect(entries).toEqual([]);
    });
  });
});
