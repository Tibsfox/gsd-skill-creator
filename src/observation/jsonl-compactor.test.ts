import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, readFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { JsonlCompactor, DEFAULT_COMPACTION_CONFIG } from './jsonl-compactor.js';
import { createChecksummedEntry } from '../validation/jsonl-safety.js';

function makeEntry(overrides: { timestamp?: number; category?: string; data?: Record<string, unknown> } = {}) {
  return {
    timestamp: overrides.timestamp ?? Date.now(),
    category: overrides.category ?? 'sessions',
    data: overrides.data ?? { sessionId: 's1', command: 'test' },
  };
}

describe('JsonlCompactor', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'compactor-test-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  describe('DEFAULT_COMPACTION_CONFIG', () => {
    it('has maxAgeDays: 30, validateChecksums: true, dropMalformed: true', () => {
      expect(DEFAULT_COMPACTION_CONFIG.maxAgeDays).toBe(30);
      expect(DEFAULT_COMPACTION_CONFIG.validateChecksums).toBe(true);
      expect(DEFAULT_COMPACTION_CONFIG.dropMalformed).toBe(true);
    });
  });

  describe('basic compaction', () => {
    it('removes expired entries and retains valid ones', async () => {
      const compactor = new JsonlCompactor({ maxAgeDays: 30 });
      const now = Date.now();
      const oldTimestamp = now - 31 * 24 * 60 * 60 * 1000; // 31 days ago

      const entries = [
        makeEntry({ timestamp: now - 1000 }),
        makeEntry({ timestamp: now - 2000 }),
        makeEntry({ timestamp: now - 3000 }),
        makeEntry({ timestamp: oldTimestamp }),
      ];

      const filePath = join(tmpDir, 'test.jsonl');
      const content = entries.map(e => JSON.stringify(e)).join('\n') + '\n';
      await writeFile(filePath, content, 'utf-8');

      const result = await compactor.compact(filePath);
      expect(result.retained).toBe(3);
      expect(result.removed).toBe(1);
      expect(result.malformed).toBe(0);
      expect(result.tampered).toBe(0);

      // Verify file on disk
      const afterContent = await readFile(filePath, 'utf-8');
      const lines = afterContent.split('\n').filter(l => l.trim() !== '');
      expect(lines.length).toBe(3);
    });

    it('returns zero-result for nonexistent file', async () => {
      const compactor = new JsonlCompactor();
      const result = await compactor.compact(join(tmpDir, 'nonexistent.jsonl'));
      expect(result.retained).toBe(0);
      expect(result.removed).toBe(0);
      expect(result.malformed).toBe(0);
      expect(result.tampered).toBe(0);
      expect(result.error).toBeUndefined();
    });
  });

  describe('malformed entry removal', () => {
    it('drops malformed lines (invalid JSON) and reports count', async () => {
      const compactor = new JsonlCompactor();
      const validEntry = makeEntry();
      const anotherValid = makeEntry({ data: { key: 'val' } });

      const filePath = join(tmpDir, 'malformed.jsonl');
      const content = [
        JSON.stringify(validEntry),
        'this is not valid json{{{',
        JSON.stringify(anotherValid),
      ].join('\n') + '\n';
      await writeFile(filePath, content, 'utf-8');

      const result = await compactor.compact(filePath);
      expect(result.retained).toBe(2);
      expect(result.malformed).toBe(1);
    });

    it('drops valid JSON missing required fields as malformed', async () => {
      const compactor = new JsonlCompactor();
      const validEntry = makeEntry();

      const filePath = join(tmpDir, 'missing-fields.jsonl');
      const content = [
        JSON.stringify(validEntry),
        JSON.stringify({ category: 'commands', data: {} }), // missing timestamp
      ].join('\n') + '\n';
      await writeFile(filePath, content, 'utf-8');

      const result = await compactor.compact(filePath);
      expect(result.retained).toBe(1);
      expect(result.malformed).toBe(1);
    });
  });

  describe('checksum verification', () => {
    it('drops tampered entries with checksum mismatch', async () => {
      const compactor = new JsonlCompactor({ validateChecksums: true });
      const valid = createChecksummedEntry(makeEntry());
      const tampered = createChecksummedEntry(makeEntry({ data: { command: 'original' } }));
      // Tamper with data after checksum
      (tampered.data as Record<string, unknown>).command = 'tampered!';

      const filePath = join(tmpDir, 'tampered.jsonl');
      const content = [
        JSON.stringify(valid),
        JSON.stringify(tampered),
      ].join('\n') + '\n';
      await writeFile(filePath, content, 'utf-8');

      const result = await compactor.compact(filePath);
      expect(result.retained).toBe(1);
      expect(result.tampered).toBe(1);
    });

    it('keeps tampered entries when validateChecksums is false', async () => {
      const compactor = new JsonlCompactor({ validateChecksums: false });
      const tampered = createChecksummedEntry(makeEntry({ data: { command: 'original' } }));
      (tampered.data as Record<string, unknown>).command = 'tampered!';

      const filePath = join(tmpDir, 'no-verify.jsonl');
      const content = JSON.stringify(tampered) + '\n';
      await writeFile(filePath, content, 'utf-8');

      const result = await compactor.compact(filePath);
      expect(result.retained).toBe(1);
      expect(result.tampered).toBe(0);
    });
  });

  describe('atomic write safety', () => {
    it('produces valid JSON on every line after compaction', async () => {
      const compactor = new JsonlCompactor();
      const entries = [
        makeEntry({ timestamp: Date.now() - 1000 }),
        makeEntry({ timestamp: Date.now() - 2000 }),
        'not json',
        makeEntry({ timestamp: Date.now() - 3000 }),
      ];

      const filePath = join(tmpDir, 'atomic.jsonl');
      const content = entries.map(e => typeof e === 'string' ? e : JSON.stringify(e)).join('\n') + '\n';
      await writeFile(filePath, content, 'utf-8');

      await compactor.compact(filePath);

      const afterContent = await readFile(filePath, 'utf-8');
      const lines = afterContent.split('\n').filter(l => l.trim() !== '');
      for (const line of lines) {
        expect(() => JSON.parse(line)).not.toThrow();
      }
    });
  });
});
