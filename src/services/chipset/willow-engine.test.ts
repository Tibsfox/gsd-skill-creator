import { describe, it, expect } from 'vitest';
import { WillowEngine } from './willow-engine.js';
import type { WillowContext } from './willow-types.js';
import type { MergedResult, MusePerspective, MergeStrategy } from './muse-forking.js';
import type { MuseId } from './muse-schema-validator.js';

const GUILT_WORDS = ['missed', 'behind', 'absent', 'neglected', 'overdue', 'forgotten', 'inactive'];

function makeContext(overrides: Partial<WillowContext> = {}): WillowContext {
  return {
    userDepth: 'scan',
    sessionCount: 10,
    lastSeen: '2026-03-03T12:00:00Z',
    preferredStyle: null,
    ...overrides,
  };
}

function makeMergedResult(): MergedResult {
  return {
    content: '**Foxy:** narrative approach with creative direction | **Lex:** verification pipeline with discipline',
    perspectives: [
      { museId: 'foxy' as MuseId, content: 'narrative approach', activationScore: 0.8, voice: { tone: 'warm', style: 'narrative' }, keywords: ['narrative'] },
      { museId: 'lex' as MuseId, content: 'verification pipeline', activationScore: 0.7, voice: { tone: 'precise', style: 'technical' }, keywords: ['pipeline'] },
    ],
    strategy: 'comparison' as MergeStrategy,
    contributingMuses: ['foxy', 'lex'] as MuseId[],
  };
}

describe('WillowEngine', () => {
  describe('inferDepth', () => {
    it('returns glance for new users (sessions < 4)', () => {
      const engine = new WillowEngine();
      expect(engine.inferDepth(makeContext({ sessionCount: 1 }))).toBe('glance');
      expect(engine.inferDepth(makeContext({ sessionCount: 3 }))).toBe('glance');
    });

    it('returns scan for intermediate users (sessions 4-20)', () => {
      const engine = new WillowEngine();
      expect(engine.inferDepth(makeContext({ sessionCount: 4 }))).toBe('scan');
      expect(engine.inferDepth(makeContext({ sessionCount: 20 }))).toBe('scan');
    });

    it('returns read for experienced users (sessions 21+)', () => {
      const engine = new WillowEngine();
      expect(engine.inferDepth(makeContext({ sessionCount: 21 }))).toBe('read');
    });

    it('respects preferredStyle override for glance', () => {
      const engine = new WillowEngine();
      expect(engine.inferDepth(makeContext({ sessionCount: 50, preferredStyle: 'brief' }))).toBe('glance');
      expect(engine.inferDepth(makeContext({ sessionCount: 50, preferredStyle: 'quick' }))).toBe('glance');
    });

    it('respects preferredStyle override for read', () => {
      const engine = new WillowEngine();
      expect(engine.inferDepth(makeContext({ sessionCount: 1, preferredStyle: 'detail' }))).toBe('read');
      expect(engine.inferDepth(makeContext({ sessionCount: 1, preferredStyle: 'explain' }))).toBe('read');
    });
  });

  describe('render', () => {
    const longOutput = 'This is a long output that contains many details about the muse architecture and how it works with multiple perspectives and cross-references to other modules.';

    it('glance rendering is <= 80 characters', () => {
      const engine = new WillowEngine();
      const result = engine.render(longOutput, 'glance');
      expect(result.content.length).toBeLessThanOrEqual(80);
      expect(result.level).toBe('glance');
      expect(result.expandable).toBe(true);
    });

    it('scan rendering is <= 500 characters', () => {
      const engine = new WillowEngine();
      const result = engine.render(longOutput, 'scan');
      expect(result.content.length).toBeLessThanOrEqual(500);
      expect(result.level).toBe('scan');
    });

    it('read rendering includes full content', () => {
      const engine = new WillowEngine();
      const result = engine.render(longOutput, 'read');
      expect(result.content).toContain(longOutput);
      expect(result.expandable).toBe(false);
    });
  });

  describe('greet', () => {
    it('greets first-time visitors warmly', () => {
      const engine = new WillowEngine();
      const greeting = engine.greet(makeContext({ sessionCount: 1, lastSeen: null }));
      expect(greeting.message.toLowerCase()).toContain('welcome');
    });

    it('welcomes returning users without guilt', () => {
      const engine = new WillowEngine();
      const greeting = engine.greet(makeContext({ sessionCount: 5, lastSeen: '2026-02-01T00:00:00Z' }));
      expect(greeting.message.toLowerCase()).toContain('welcome back');
      for (const word of GUILT_WORDS) {
        expect(greeting.message.toLowerCase()).not.toContain(word);
      }
    });

    it('never uses guilt language regardless of absence duration', () => {
      const engine = new WillowEngine();
      const greeting = engine.greet(makeContext({ sessionCount: 100, lastSeen: '2025-01-01T00:00:00Z' }));
      for (const word of GUILT_WORDS) {
        expect(greeting.message.toLowerCase()).not.toContain(word);
        expect(greeting.contextHint.toLowerCase()).not.toContain(word);
      }
    });
  });

  describe('wrapMergedResult', () => {
    it('wraps at glance level within character limit', () => {
      const engine = new WillowEngine();
      const result = engine.wrapMergedResult(makeMergedResult(), 'glance');
      expect(result.content.length).toBeLessThanOrEqual(80);
      expect(result.expandable).toBe(true);
    });

    it('wraps at read level with full content', () => {
      const engine = new WillowEngine();
      const result = engine.wrapMergedResult(makeMergedResult(), 'read');
      expect(result.content).toBeTruthy();
      expect(result.expandable).toBe(false);
    });
  });

  describe('expand', () => {
    it('expands glance to scan', () => {
      const engine = new WillowEngine();
      const glance = engine.render('Full content here with details.', 'glance');
      const expanded = engine.expand(glance);
      expect(expanded).not.toBeNull();
      expect(expanded!.level).toBe('scan');
    });

    it('returns null when already at read level', () => {
      const engine = new WillowEngine();
      const read = engine.render('Content', 'read');
      expect(engine.expand(read)).toBeNull();
    });
  });
});
