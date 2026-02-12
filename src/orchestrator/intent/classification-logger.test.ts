import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  ClassificationLogger,
  ClassificationLogEntry,
} from './classification-logger.js';
import type { ClassificationResult } from './types.js';

// ============================================================================
// Classification Logger Tests
// ============================================================================

// Helper to create a minimal ClassificationResult
function makeResult(overrides: Partial<ClassificationResult> = {}): ClassificationResult {
  return {
    type: 'classified',
    command: overrides.command ?? { name: 'gsd:plan-phase' } as any,
    confidence: overrides.confidence ?? 0.85,
    arguments: {
      phaseNumber: '3',
      flags: [],
      description: null,
      version: null,
      profile: null,
      raw: 'plan phase 3',
    },
    alternatives: overrides.alternatives ?? [],
    lifecycleStage: overrides.lifecycleStage ?? 'planning',
    method: overrides.method ?? 'bayes',
    ...overrides,
  };
}

describe('ClassificationLogger', () => {
  let tmpDir: string;
  let logger: ClassificationLogger;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'cls-log-'));
    logger = new ClassificationLogger(tmpDir);
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  describe('log()', () => {
    it('creates log file on first write', async () => {
      await logger.log(makeResult(), 'plan phase 3');
      const logFile = join(tmpDir, 'classification-log.jsonl');
      const content = await readFile(logFile, 'utf-8');
      expect(content.trim().length).toBeGreaterThan(0);
    });

    it('appends a single JSONL line with correct structure', async () => {
      await logger.log(makeResult(), 'plan phase 3');
      const logFile = join(tmpDir, 'classification-log.jsonl');
      const content = await readFile(logFile, 'utf-8');
      const entry = JSON.parse(content.trim()) as ClassificationLogEntry;

      expect(entry.timestamp).toBeDefined();
      expect(entry.input).toBe('plan phase 3');
      expect(entry.command).toBe('gsd:plan-phase');
      expect(entry.type).toBe('classified');
      expect(entry.confidence).toBe(0.85);
      expect(entry.method).toBe('bayes');
      expect(entry.lifecycleStage).toBe('planning');
      expect(entry.alternativeCount).toBe(0);
    });

    it('appends multiple entries without overwriting', async () => {
      await logger.log(makeResult(), 'first');
      await logger.log(makeResult({ confidence: 0.7 }), 'second');
      const logFile = join(tmpDir, 'classification-log.jsonl');
      const content = await readFile(logFile, 'utf-8');
      const lines = content.trim().split('\n');
      expect(lines.length).toBe(2);
    });

    it('logs null command for ambiguous results', async () => {
      const result = makeResult({
        type: 'ambiguous',
        command: null,
        confidence: 0.4,
        alternatives: [
          { command: { name: 'gsd:plan-phase' } as any, confidence: 0.4 },
          { command: { name: 'gsd:execute-phase' } as any, confidence: 0.35 },
        ],
      });
      await logger.log(result, 'do something');
      const entries = await logger.readAll();
      expect(entries[0].command).toBeNull();
      expect(entries[0].alternativeCount).toBe(2);
    });

    it('logs null command and 0 confidence for no-match', async () => {
      const result = makeResult({
        type: 'no-match',
        command: null,
        confidence: 0,
      });
      await logger.log(result, 'xyz random');
      const entries = await logger.readAll();
      expect(entries[0].command).toBeNull();
      expect(entries[0].confidence).toBe(0);
      expect(entries[0].type).toBe('no-match');
    });

    it('includes ISO 8601 timestamp', async () => {
      await logger.log(makeResult(), 'test');
      const entries = await logger.readAll();
      // ISO 8601 format check
      expect(() => new Date(entries[0].timestamp)).not.toThrow();
      expect(entries[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('does not throw on write error -- logs to stderr', async () => {
      // Use an invalid directory to trigger write error
      const badLogger = new ClassificationLogger('/nonexistent/path/deep');
      // Should NOT throw
      await expect(badLogger.log(makeResult(), 'test')).resolves.toBeUndefined();
    });
  });

  describe('readAll()', () => {
    it('returns empty array when file does not exist', async () => {
      const entries = await logger.readAll();
      expect(entries).toEqual([]);
    });

    it('returns all valid entries', async () => {
      await logger.log(makeResult(), 'first');
      await logger.log(makeResult({ confidence: 0.9 }), 'second');
      await logger.log(makeResult({ confidence: 0.5 }), 'third');
      const entries = await logger.readAll();
      expect(entries.length).toBe(3);
      expect(entries[0].input).toBe('first');
      expect(entries[1].input).toBe('second');
      expect(entries[2].input).toBe('third');
    });

    it('skips malformed lines', async () => {
      await logger.log(makeResult(), 'valid');
      // Manually inject a corrupt line
      const logFile = join(tmpDir, 'classification-log.jsonl');
      const { appendFile } = await import('fs/promises');
      await appendFile(logFile, 'THIS IS NOT JSON\n');
      await logger.log(makeResult({ confidence: 0.6 }), 'also valid');

      const entries = await logger.readAll();
      expect(entries.length).toBe(2);
      expect(entries[0].input).toBe('valid');
      expect(entries[1].input).toBe('also valid');
    });

    it('skips empty lines', async () => {
      await logger.log(makeResult(), 'one');
      const logFile = join(tmpDir, 'classification-log.jsonl');
      const { appendFile } = await import('fs/promises');
      await appendFile(logFile, '\n\n');
      await logger.log(makeResult(), 'two');

      const entries = await logger.readAll();
      expect(entries.length).toBe(2);
    });
  });
});
