import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { createHash } from 'crypto';
import { IntegrityMonitor } from './integrity-monitor.js';
import { AuditLogger } from './audit-logger.js';
import type { IntegritySnapshot, IntegrityReport, FileChange } from './integrity-monitor.js';

// ============================================================================
// IntegrityMonitor Tests
// ============================================================================

describe('IntegrityMonitor', () => {
  let tmpDir: string;
  let skillsDir: string;
  let agentsDir: string;
  let snapshotPath: string;
  let auditLogPath: string;
  let auditLogger: AuditLogger;
  let monitor: IntegrityMonitor;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'integrity-monitor-test-'));
    skillsDir = join(tmpDir, '.claude', 'skills');
    agentsDir = join(tmpDir, '.claude', 'agents');
    snapshotPath = join(tmpDir, '.claude', '.integrity-snapshot.json');
    auditLogPath = join(tmpDir, '.claude', '.audit-log.jsonl');

    await mkdir(skillsDir, { recursive: true });
    await mkdir(agentsDir, { recursive: true });

    auditLogger = new AuditLogger(auditLogPath);
    monitor = new IntegrityMonitor({
      directories: [skillsDir, agentsDir],
      snapshotPath,
      auditLogger,
    });
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  // --------------------------------------------------------------------------
  // snapshot() tests
  // --------------------------------------------------------------------------

  describe('snapshot()', () => {
    it('should capture file hashes for files in monitored directories', async () => {
      const content1 = 'skill content 1';
      const content2 = 'skill content 2';
      await mkdir(join(skillsDir, 'foo'), { recursive: true });
      await writeFile(join(skillsDir, 'foo', 'SKILL.md'), content1);
      await mkdir(join(skillsDir, 'bar'), { recursive: true });
      await writeFile(join(skillsDir, 'bar', 'SKILL.md'), content2);

      const snapshot = await monitor.snapshot();

      expect(snapshot.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(snapshot.directories).toContain(skillsDir);
      expect(snapshot.directories).toContain(agentsDir);

      const fileKeys = Object.keys(snapshot.files);
      expect(fileKeys).toHaveLength(2);

      // Verify SHA-256 hash
      const expectedHash1 = createHash('sha256').update(content1).digest('hex');
      const key1 = fileKeys.find(k => k.includes('foo'));
      expect(key1).toBeDefined();
      expect(snapshot.files[key1!].hash).toBe(expectedHash1);
      expect(snapshot.files[key1!].size).toBe(content1.length);
      expect(typeof snapshot.files[key1!].mtime).toBe('number');
    });

    it('should produce valid empty snapshot for empty directories', async () => {
      const snapshot = await monitor.snapshot();

      expect(Object.keys(snapshot.files)).toHaveLength(0);
      expect(snapshot.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should create parent directories for snapshot file if needed', async () => {
      const deepSnapshotPath = join(tmpDir, 'deep', 'nested', 'snapshot.json');
      const deepMonitor = new IntegrityMonitor({
        directories: [skillsDir],
        snapshotPath: deepSnapshotPath,
        auditLogger,
      });

      await writeFile(join(skillsDir, 'test.md'), 'test');
      const snapshot = await deepMonitor.snapshot();
      expect(snapshot.files).toBeDefined();
    });

    it('should walk directories recursively', async () => {
      await mkdir(join(skillsDir, 'foo', 'references'), { recursive: true });
      await writeFile(join(skillsDir, 'foo', 'SKILL.md'), 'main');
      await writeFile(join(skillsDir, 'foo', 'references', 'detail.md'), 'detail');

      const snapshot = await monitor.snapshot();
      expect(Object.keys(snapshot.files)).toHaveLength(2);
    });
  });

  // --------------------------------------------------------------------------
  // check() tests
  // --------------------------------------------------------------------------

  describe('check()', () => {
    it('should throw when no prior snapshot exists', async () => {
      await expect(monitor.check()).rejects.toThrow('No integrity snapshot found');
    });

    it('should detect added file as unexpected when no audit entry', async () => {
      // Take initial snapshot with empty directories
      await monitor.snapshot();

      // Add a file without audit entry
      await mkdir(join(skillsDir, 'new-skill'), { recursive: true });
      await writeFile(join(skillsDir, 'new-skill', 'SKILL.md'), 'new content');

      const report = await monitor.check();
      expect(report.changes).toHaveLength(1);
      expect(report.changes[0].type).toBe('added');
      expect(report.changes[0].expected).toBe(false);
      expect(report.unexpectedChanges).toHaveLength(1);
    });

    it('should detect added file as expected when audit entry exists', async () => {
      await monitor.snapshot();

      const newPath = join(skillsDir, 'new-skill', 'SKILL.md');
      await mkdir(join(skillsDir, 'new-skill'), { recursive: true });
      await writeFile(newPath, 'new content');

      // Log the creation in audit
      await auditLogger.log({
        operation: 'create',
        filePath: newPath,
        source: 'cli:create',
      });

      const report = await monitor.check();
      expect(report.changes).toHaveLength(1);
      expect(report.changes[0].type).toBe('added');
      expect(report.changes[0].expected).toBe(true);
      expect(report.unexpectedChanges).toHaveLength(0);
    });

    it('should detect modified file as unexpected when no audit entry', async () => {
      await mkdir(join(skillsDir, 'existing'), { recursive: true });
      await writeFile(join(skillsDir, 'existing', 'SKILL.md'), 'original');

      await monitor.snapshot();

      // Modify file without audit entry
      await writeFile(join(skillsDir, 'existing', 'SKILL.md'), 'modified');

      const report = await monitor.check();
      expect(report.changes).toHaveLength(1);
      expect(report.changes[0].type).toBe('modified');
      expect(report.changes[0].expected).toBe(false);
      expect(report.unexpectedChanges).toHaveLength(1);
    });

    it('should detect modified file as expected when audit entry exists', async () => {
      const filePath = join(skillsDir, 'existing', 'SKILL.md');
      await mkdir(join(skillsDir, 'existing'), { recursive: true });
      await writeFile(filePath, 'original');

      await monitor.snapshot();

      await writeFile(filePath, 'modified');

      // Log the update
      await auditLogger.log({
        operation: 'update',
        filePath,
        source: 'api:SkillStore.update',
      });

      const report = await monitor.check();
      expect(report.changes).toHaveLength(1);
      expect(report.changes[0].type).toBe('modified');
      expect(report.changes[0].expected).toBe(true);
      expect(report.unexpectedChanges).toHaveLength(0);
    });

    it('should detect removed file as unexpected when no audit entry', async () => {
      const filePath = join(skillsDir, 'doomed', 'SKILL.md');
      await mkdir(join(skillsDir, 'doomed'), { recursive: true });
      await writeFile(filePath, 'will be deleted');

      await monitor.snapshot();

      // Remove file without audit entry
      await rm(filePath);

      const report = await monitor.check();
      expect(report.changes).toHaveLength(1);
      expect(report.changes[0].type).toBe('removed');
      expect(report.changes[0].expected).toBe(false);
      expect(report.unexpectedChanges).toHaveLength(1);
    });

    it('should detect removed file as expected when audit entry exists', async () => {
      const filePath = join(skillsDir, 'doomed', 'SKILL.md');
      await mkdir(join(skillsDir, 'doomed'), { recursive: true });
      await writeFile(filePath, 'will be deleted');

      await monitor.snapshot();

      await rm(filePath);

      // Log the deletion
      await auditLogger.log({
        operation: 'delete',
        filePath,
        source: 'cli:delete',
      });

      const report = await monitor.check();
      expect(report.changes).toHaveLength(1);
      expect(report.changes[0].type).toBe('removed');
      expect(report.changes[0].expected).toBe(true);
      expect(report.unexpectedChanges).toHaveLength(0);
    });

    it('should report no changes when nothing changed', async () => {
      await mkdir(join(skillsDir, 'stable'), { recursive: true });
      await writeFile(join(skillsDir, 'stable', 'SKILL.md'), 'stable content');

      await monitor.snapshot();

      const report = await monitor.check();
      expect(report.changes).toHaveLength(0);
      expect(report.unexpectedChanges).toHaveLength(0);
      expect(report.totalFiles).toBe(1);
    });

    it('should detect multiple simultaneous changes', async () => {
      await mkdir(join(skillsDir, 'a'), { recursive: true });
      await writeFile(join(skillsDir, 'a', 'SKILL.md'), 'original a');
      await mkdir(join(skillsDir, 'b'), { recursive: true });
      await writeFile(join(skillsDir, 'b', 'SKILL.md'), 'original b');

      await monitor.snapshot();

      // Modify a, remove b, add c
      await writeFile(join(skillsDir, 'a', 'SKILL.md'), 'modified a');
      await rm(join(skillsDir, 'b', 'SKILL.md'));
      await mkdir(join(skillsDir, 'c'), { recursive: true });
      await writeFile(join(skillsDir, 'c', 'SKILL.md'), 'new c');

      const report = await monitor.check();
      expect(report.changes).toHaveLength(3);

      const types = report.changes.map(c => c.type).sort();
      expect(types).toEqual(['added', 'modified', 'removed']);
      expect(report.unexpectedChanges).toHaveLength(3);
    });

    it('should mark refine operation as expected for modified file', async () => {
      const filePath = join(skillsDir, 'refined', 'SKILL.md');
      await mkdir(join(skillsDir, 'refined'), { recursive: true });
      await writeFile(filePath, 'original');

      await monitor.snapshot();
      await writeFile(filePath, 'refined content');

      await auditLogger.log({
        operation: 'refine',
        filePath,
        source: 'api:refine',
      });

      const report = await monitor.check();
      expect(report.changes).toHaveLength(1);
      expect(report.changes[0].expected).toBe(true);
    });

    it('should include checkedAt timestamp in report', async () => {
      await monitor.snapshot();

      const report = await monitor.check();
      expect(report.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  // --------------------------------------------------------------------------
  // hasUnexpectedChanges() tests
  // --------------------------------------------------------------------------

  describe('hasUnexpectedChanges()', () => {
    it('should return false when no changes exist', async () => {
      await monitor.snapshot();
      const result = await monitor.hasUnexpectedChanges();
      expect(result).toBe(false);
    });

    it('should return true when unexpected changes exist', async () => {
      await monitor.snapshot();

      await mkdir(join(skillsDir, 'intruder'), { recursive: true });
      await writeFile(join(skillsDir, 'intruder', 'SKILL.md'), 'injected');

      const result = await monitor.hasUnexpectedChanges();
      expect(result).toBe(true);
    });

    it('should return false when all changes are expected', async () => {
      await monitor.snapshot();

      const newPath = join(skillsDir, 'legit', 'SKILL.md');
      await mkdir(join(skillsDir, 'legit'), { recursive: true });
      await writeFile(newPath, 'legit content');

      await auditLogger.log({
        operation: 'create',
        filePath: newPath,
        source: 'cli:create',
      });

      const result = await monitor.hasUnexpectedChanges();
      expect(result).toBe(false);
    });
  });
});
