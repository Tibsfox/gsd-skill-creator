import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { AuditLogger } from './audit-logger.js';
import type { AuditEntry, AuditOperation } from './audit-logger.js';

// ============================================================================
// AuditLogger Tests
// ============================================================================

describe('AuditLogger', () => {
  let tmpDir: string;
  let logPath: string;
  let logger: AuditLogger;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'audit-logger-test-'));
    logPath = join(tmpDir, '.audit-log.jsonl');
    logger = new AuditLogger(logPath);
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  // --------------------------------------------------------------------------
  // log() tests
  // --------------------------------------------------------------------------

  describe('log()', () => {
    it('should append a valid JSONL entry with ISO timestamp', async () => {
      await logger.log({
        operation: 'create',
        filePath: '.claude/skills/foo/SKILL.md',
        source: 'cli:create',
      });

      const content = await readFile(logPath, 'utf-8');
      const lines = content.trim().split('\n');
      expect(lines).toHaveLength(1);

      const entry = JSON.parse(lines[0]) as AuditEntry;
      expect(entry.operation).toBe('create');
      expect(entry.filePath).toBe('.claude/skills/foo/SKILL.md');
      expect(entry.source).toBe('cli:create');
      expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should append multiple entries as separate lines', async () => {
      await logger.log({
        operation: 'create',
        filePath: '.claude/skills/a/SKILL.md',
        source: 'cli:create',
      });
      await logger.log({
        operation: 'update',
        filePath: '.claude/skills/a/SKILL.md',
        source: 'api:SkillStore.update',
      });

      const content = await readFile(logPath, 'utf-8');
      const lines = content.trim().split('\n');
      expect(lines).toHaveLength(2);
    });

    it('should create parent directory if it does not exist', async () => {
      const nestedPath = join(tmpDir, 'nested', 'deep', '.audit-log.jsonl');
      const nestedLogger = new AuditLogger(nestedPath);

      await nestedLogger.log({
        operation: 'create',
        filePath: '.claude/skills/test/SKILL.md',
        source: 'cli:create',
      });

      const content = await readFile(nestedPath, 'utf-8');
      expect(content.trim()).not.toBe('');
    });

    it('should include optional details field when provided', async () => {
      await logger.log({
        operation: 'migrate',
        filePath: '.claude/skills/legacy/SKILL.md',
        source: 'cli:migrate',
        details: { fromVersion: 1, toVersion: 2 },
      });

      const content = await readFile(logPath, 'utf-8');
      const entry = JSON.parse(content.trim()) as AuditEntry;
      expect(entry.details).toEqual({ fromVersion: 1, toVersion: 2 });
    });

    it('should support all operation types', async () => {
      const ops: AuditOperation[] = ['create', 'update', 'delete', 'migrate', 'refine', 'rollback'];

      for (const op of ops) {
        await logger.log({
          operation: op,
          filePath: `.claude/skills/${op}/SKILL.md`,
          source: `test:${op}`,
        });
      }

      const entries = await logger.getEntries();
      expect(entries).toHaveLength(6);
      expect(entries.map(e => e.operation)).toEqual(ops);
    });
  });

  // --------------------------------------------------------------------------
  // getEntries() tests
  // --------------------------------------------------------------------------

  describe('getEntries()', () => {
    it('should return empty array for non-existent file', async () => {
      const entries = await logger.getEntries();
      expect(entries).toEqual([]);
    });

    it('should parse and return valid entries', async () => {
      await logger.log({
        operation: 'create',
        filePath: '.claude/skills/foo/SKILL.md',
        source: 'cli:create',
      });

      const entries = await logger.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].operation).toBe('create');
      expect(entries[0].filePath).toBe('.claude/skills/foo/SKILL.md');
    });

    it('should skip malformed lines gracefully', async () => {
      // Write one valid and one malformed line manually
      const { writeFile: wf } = await import('fs/promises');
      const validEntry = JSON.stringify({
        timestamp: new Date().toISOString(),
        operation: 'create',
        filePath: '.claude/skills/good/SKILL.md',
        source: 'cli:create',
      });
      await wf(logPath, `${validEntry}\n{not valid json}\n`, 'utf-8');

      const entries = await logger.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].filePath).toBe('.claude/skills/good/SKILL.md');
    });

    it('should skip entries missing required fields', async () => {
      const { writeFile: wf } = await import('fs/promises');
      const valid = JSON.stringify({
        timestamp: new Date().toISOString(),
        operation: 'create',
        filePath: '.claude/skills/good/SKILL.md',
        source: 'cli:create',
      });
      // Missing operation and filePath
      const invalid = JSON.stringify({
        timestamp: new Date().toISOString(),
        source: 'cli:create',
      });
      await wf(logPath, `${valid}\n${invalid}\n`, 'utf-8');

      const entries = await logger.getEntries();
      expect(entries).toHaveLength(1);
    });

    it('should preserve extra unknown fields (passthrough)', async () => {
      const { writeFile: wf } = await import('fs/promises');
      const entryWithExtra = JSON.stringify({
        timestamp: new Date().toISOString(),
        operation: 'create',
        filePath: '.claude/skills/test/SKILL.md',
        source: 'cli:create',
        customField: 'preserved',
      });
      await wf(logPath, `${entryWithExtra}\n`, 'utf-8');

      const entries = await logger.getEntries();
      expect(entries).toHaveLength(1);
      expect((entries[0] as Record<string, unknown>).customField).toBe('preserved');
    });

    it('should filter by operation', async () => {
      await logger.log({ operation: 'create', filePath: 'a.md', source: 'test' });
      await logger.log({ operation: 'delete', filePath: 'b.md', source: 'test' });
      await logger.log({ operation: 'create', filePath: 'c.md', source: 'test' });

      const entries = await logger.getEntries({ operation: 'delete' });
      expect(entries).toHaveLength(1);
      expect(entries[0].filePath).toBe('b.md');
    });

    it('should filter by since timestamp', async () => {
      const { writeFile: wf } = await import('fs/promises');
      const old = JSON.stringify({
        timestamp: '2025-01-01T00:00:00Z',
        operation: 'create',
        filePath: 'old.md',
        source: 'test',
      });
      const recent = JSON.stringify({
        timestamp: '2026-06-01T00:00:00Z',
        operation: 'create',
        filePath: 'recent.md',
        source: 'test',
      });
      await wf(logPath, `${old}\n${recent}\n`, 'utf-8');

      const entries = await logger.getEntries({ since: '2026-01-01T00:00:00Z' });
      expect(entries).toHaveLength(1);
      expect(entries[0].filePath).toBe('recent.md');
    });

    it('should combine operation and since filters', async () => {
      const { writeFile: wf } = await import('fs/promises');
      const lines = [
        JSON.stringify({ timestamp: '2025-01-01T00:00:00Z', operation: 'create', filePath: 'a.md', source: 'test' }),
        JSON.stringify({ timestamp: '2026-06-01T00:00:00Z', operation: 'create', filePath: 'b.md', source: 'test' }),
        JSON.stringify({ timestamp: '2026-06-01T00:00:00Z', operation: 'delete', filePath: 'c.md', source: 'test' }),
      ];
      await wf(logPath, lines.join('\n') + '\n', 'utf-8');

      const entries = await logger.getEntries({ since: '2026-01-01T00:00:00Z', operation: 'create' });
      expect(entries).toHaveLength(1);
      expect(entries[0].filePath).toBe('b.md');
    });
  });

  // --------------------------------------------------------------------------
  // getRecentEntries() tests
  // --------------------------------------------------------------------------

  describe('getRecentEntries()', () => {
    it('should return entries within the time window', async () => {
      await logger.log({
        operation: 'create',
        filePath: '.claude/skills/recent/SKILL.md',
        source: 'cli:create',
      });

      // 1 hour window should include entry just logged
      const entries = await logger.getRecentEntries(60 * 60 * 1000);
      expect(entries.length).toBeGreaterThanOrEqual(1);
    });

    it('should exclude entries outside the time window', async () => {
      const { writeFile: wf } = await import('fs/promises');
      const old = JSON.stringify({
        timestamp: '2020-01-01T00:00:00Z',
        operation: 'create',
        filePath: 'old.md',
        source: 'test',
      });
      await wf(logPath, `${old}\n`, 'utf-8');

      // 1 hour window should not include 2020 entry
      const entries = await logger.getRecentEntries(60 * 60 * 1000);
      expect(entries).toHaveLength(0);
    });
  });
});
