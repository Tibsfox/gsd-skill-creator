import { describe, it, expect } from 'vitest';
import { CedarEngine } from './cedar-engine.js';

describe('CedarEngine', () => {
  describe('record', () => {
    it('produces entry with content-addressed hash', () => {
      const engine = new CedarEngine();
      const entry = engine.record({
        timestamp: '2026-03-04T12:00:00Z',
        source: 'foxy',
        category: 'decision',
        content: 'Chose narrative arc for milestone',
        references: [],
      });
      expect(entry.hash).toBeTruthy();
      expect(entry.id).toMatch(/^cedar-/);
      expect(entry.id.length).toBeGreaterThan(6);
    });

    it('produces deterministic hash for same input', () => {
      const engine = new CedarEngine();
      const input = {
        timestamp: '2026-03-04T12:00:00Z',
        source: 'lex',
        category: 'observation' as const,
        content: 'Pipeline verified',
        references: [],
      };
      const e1 = engine.record(input);
      const e2 = engine.record(input);
      expect(e1.hash).toBe(e2.hash);
    });

    it('appends to timeline (append-only)', () => {
      const engine = new CedarEngine();
      engine.record({ timestamp: '2026-03-04T12:00:00Z', source: 'a', category: 'decision', content: 'first', references: [] });
      engine.record({ timestamp: '2026-03-04T12:01:00Z', source: 'b', category: 'observation', content: 'second', references: [] });
      expect(engine.allEntries()).toHaveLength(2);
    });
  });

  describe('query', () => {
    it('filters by category', () => {
      const engine = new CedarEngine();
      engine.record({ timestamp: '2026-03-04T12:00:00Z', source: 'a', category: 'decision', content: 'dec', references: [] });
      engine.record({ timestamp: '2026-03-04T12:01:00Z', source: 'b', category: 'observation', content: 'obs', references: [] });
      const results = engine.query({ category: 'decision' });
      expect(results).toHaveLength(1);
      expect(results[0].content).toBe('dec');
    });

    it('filters by source', () => {
      const engine = new CedarEngine();
      engine.record({ timestamp: '2026-03-04T12:00:00Z', source: 'foxy', category: 'decision', content: 'a', references: [] });
      engine.record({ timestamp: '2026-03-04T12:01:00Z', source: 'lex', category: 'decision', content: 'b', references: [] });
      expect(engine.query({ source: 'foxy' })).toHaveLength(1);
    });

    it('filters by pattern', () => {
      const engine = new CedarEngine();
      engine.record({ timestamp: '2026-03-04T12:00:00Z', source: 'a', category: 'decision', content: 'pipeline verified OK', references: [] });
      engine.record({ timestamp: '2026-03-04T12:01:00Z', source: 'b', category: 'decision', content: 'tests failed', references: [] });
      expect(engine.query({ pattern: 'pipeline' })).toHaveLength(1);
    });

    it('respects limit', () => {
      const engine = new CedarEngine();
      for (let i = 0; i < 5; i++) {
        engine.record({ timestamp: `2026-03-04T12:0${i}:00Z`, source: 'a', category: 'decision', content: `entry ${i}`, references: [] });
      }
      expect(engine.query({ limit: 2 })).toHaveLength(2);
    });
  });

  describe('verifyIntegrity', () => {
    it('reports valid for clean timeline', () => {
      const engine = new CedarEngine();
      engine.record({ timestamp: '2026-03-04T12:00:00Z', source: 'a', category: 'decision', content: 'test', references: [] });
      const report = engine.verifyIntegrity();
      expect(report.chainValid).toBe(true);
      expect(report.totalEntries).toBe(1);
    });

    it('detects corrupted hash', () => {
      const engine = new CedarEngine();
      engine.record({ timestamp: '2026-03-04T12:00:00Z', source: 'a', category: 'decision', content: 'test', references: [] });
      // Corrupt the hash
      const entries = engine.allEntries();
      (entries[0] as { hash: string }).hash = 'corrupted';
      const report = engine.verifyIntegrity();
      expect(report.chainValid).toBe(false);
      expect(report.suspiciousPatterns.some(p => p.type === 'hash-mismatch')).toBe(true);
    });
  });

  describe('checkVoiceConsistency', () => {
    it('returns null when output matches expected muse vocabulary', () => {
      const engine = new CedarEngine();
      const result = engine.checkVoiceConsistency('lex', 'pipeline execution discipline verification');
      expect(result).toBeNull();
    });

    it('flags when output uses different muse vocabulary', () => {
      const engine = new CedarEngine();
      const result = engine.checkVoiceConsistency('lex', 'narrative arc story creative direction maps');
      expect(result).not.toBeNull();
      expect(result!.type).toBe('vocabulary-drift');
    });
  });
});
