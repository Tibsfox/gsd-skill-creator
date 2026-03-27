import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { SuggestionStore } from './suggestion-store.js';
import { SkillCandidate, Suggestion, PatternEvidence } from '../types/detection.js';

describe('SuggestionStore', () => {
  const testDir = join(tmpdir(), `suggestion-store-test-${Date.now()}`);
  const suggestionsFile = join(testDir, 'suggestions.json');

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  function createCandidate(id: string, pattern: string): SkillCandidate {
    const evidence: PatternEvidence = {
      firstSeen: Date.now() - 86400000,
      lastSeen: Date.now(),
      sessionIds: ['session-1', 'session-2'],
      coOccurringFiles: ['/src/test.ts'],
      coOccurringTools: ['Read'],
    };

    return {
      id,
      type: 'command',
      pattern,
      occurrences: 5,
      confidence: 0.7,
      suggestedName: `${pattern}-workflow`,
      suggestedDescription: `Guide for ${pattern} usage`,
      evidence,
    };
  }

  describe('load/save', () => {
    it('should return empty array for missing file', async () => {
      const store = new SuggestionStore(testDir);
      const suggestions = await store.load();
      expect(suggestions).toEqual([]);
    });

    it('should save and load suggestions', async () => {
      const store = new SuggestionStore(testDir);
      const candidate = createCandidate('cmd-terraform', 'terraform');

      await store.addCandidates([candidate]);
      const loaded = await store.load();

      expect(loaded).toHaveLength(1);
      expect(loaded[0].candidate.id).toBe('cmd-terraform');
      expect(loaded[0].state).toBe('pending');
    });

    it('should persist to JSON file', async () => {
      const store = new SuggestionStore(testDir);
      const candidate = createCandidate('cmd-kubectl', 'kubectl');

      await store.addCandidates([candidate]);

      const content = await readFile(suggestionsFile, 'utf-8');
      const parsed = JSON.parse(content);

      expect(parsed).toHaveLength(1);
      expect(parsed[0].candidate.pattern).toBe('kubectl');
    });
  });

  describe('addCandidates', () => {
    it('should create pending suggestions from candidates', async () => {
      const store = new SuggestionStore(testDir);
      const candidates = [
        createCandidate('cmd-helm', 'helm'),
        createCandidate('cmd-pulumi', 'pulumi'),
      ];

      const added = await store.addCandidates(candidates);

      expect(added).toHaveLength(2);
      expect(added[0].state).toBe('pending');
      expect(added[0].createdAt).toBeGreaterThan(0);
    });

    it('should skip duplicate candidates', async () => {
      const store = new SuggestionStore(testDir);
      const candidate = createCandidate('cmd-ansible', 'ansible');

      await store.addCandidates([candidate]);
      const added = await store.addCandidates([candidate]);

      expect(added).toHaveLength(0);

      const all = await store.load();
      expect(all).toHaveLength(1);
    });

    it('should return only newly added suggestions', async () => {
      const store = new SuggestionStore(testDir);

      await store.addCandidates([createCandidate('cmd-existing', 'existing')]);

      const added = await store.addCandidates([
        createCandidate('cmd-existing', 'existing'),
        createCandidate('cmd-new', 'new'),
      ]);

      expect(added).toHaveLength(1);
      expect(added[0].candidate.pattern).toBe('new');
    });
  });

  describe('getPending', () => {
    it('should return pending suggestions', async () => {
      const store = new SuggestionStore(testDir);
      await store.addCandidates([createCandidate('cmd-pending', 'pending')]);

      const pending = await store.getPending();

      expect(pending).toHaveLength(1);
      expect(pending[0].candidate.pattern).toBe('pending');
    });

    it('should return deferred suggestions past deferredUntil', async () => {
      const store = new SuggestionStore(testDir, { deferDays: 0 }); // Immediate re-surface
      await store.addCandidates([createCandidate('cmd-deferred', 'deferred')]);

      // Defer it
      await store.transition('cmd-deferred', 'deferred');

      // Wait a tiny bit for timestamp to pass
      await new Promise(r => setTimeout(r, 10));

      const pending = await store.getPending();
      expect(pending.some(s => s.candidate.pattern === 'deferred')).toBe(true);
    });

    it('should not return deferred suggestions not yet due', async () => {
      const store = new SuggestionStore(testDir, { deferDays: 7 });
      await store.addCandidates([createCandidate('cmd-future', 'future')]);

      await store.transition('cmd-future', 'deferred');

      const pending = await store.getPending();
      expect(pending.some(s => s.candidate.pattern === 'future')).toBe(false);
    });

    it('should not return dismissed or accepted', async () => {
      const store = new SuggestionStore(testDir);
      await store.addCandidates([
        createCandidate('cmd-dismissed', 'dismissed'),
        createCandidate('cmd-accepted', 'accepted'),
      ]);

      await store.transition('cmd-dismissed', 'dismissed');
      await store.transition('cmd-accepted', 'accepted');

      const pending = await store.getPending();
      expect(pending).toHaveLength(0);
    });
  });

  describe('transition', () => {
    it('should set decidedAt on transition', async () => {
      const store = new SuggestionStore(testDir);
      await store.addCandidates([createCandidate('cmd-test', 'test')]);

      const before = Date.now();
      const result = await store.transition('cmd-test', 'accepted');
      const after = Date.now();

      expect(result).not.toBeNull();
      expect(result!.decidedAt).toBeGreaterThanOrEqual(before);
      expect(result!.decidedAt).toBeLessThanOrEqual(after);
    });

    it('should set deferredUntil on deferred transition', async () => {
      const store = new SuggestionStore(testDir, { deferDays: 7 });
      await store.addCandidates([createCandidate('cmd-defer', 'defer')]);

      const result = await store.transition('cmd-defer', 'deferred');

      expect(result!.deferredUntil).toBeDefined();
      // Should be approximately 7 days from now
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      expect(result!.deferredUntil).toBeGreaterThan(Date.now() + sevenDaysMs - 1000);
    });

    it('should set dismissReason on dismissed transition', async () => {
      const store = new SuggestionStore(testDir);
      await store.addCandidates([createCandidate('cmd-dismiss', 'dismiss')]);

      const result = await store.transition('cmd-dismiss', 'dismissed', {
        dismissReason: 'Not relevant to my workflow',
      });

      expect(result!.dismissReason).toBe('Not relevant to my workflow');
    });

    it('should set createdSkillName on accepted transition', async () => {
      const store = new SuggestionStore(testDir);
      await store.addCandidates([createCandidate('cmd-accept', 'accept')]);

      const result = await store.transition('cmd-accept', 'accepted', {
        createdSkillName: 'accept-workflow',
      });

      expect(result!.createdSkillName).toBe('accept-workflow');
    });

    it('should return null for unknown candidateId', async () => {
      const store = new SuggestionStore(testDir);

      const result = await store.transition('nonexistent', 'accepted');

      expect(result).toBeNull();
    });
  });

  describe('clearDismissed', () => {
    it('should remove only dismissed suggestions', async () => {
      const store = new SuggestionStore(testDir);
      await store.addCandidates([
        createCandidate('cmd-keep', 'keep'),
        createCandidate('cmd-remove', 'remove'),
      ]);

      await store.transition('cmd-remove', 'dismissed');

      const cleared = await store.clearDismissed();

      expect(cleared).toBe(1);

      const remaining = await store.load();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].candidate.pattern).toBe('keep');
    });

    it('should return count of cleared', async () => {
      const store = new SuggestionStore(testDir);
      await store.addCandidates([
        createCandidate('cmd-d1', 'd1'),
        createCandidate('cmd-d2', 'd2'),
        createCandidate('cmd-d3', 'd3'),
      ]);

      await store.transition('cmd-d1', 'dismissed');
      await store.transition('cmd-d2', 'dismissed');

      const cleared = await store.clearDismissed();
      expect(cleared).toBe(2);
    });
  });

  describe('isAddressed', () => {
    it('should return true for accepted', async () => {
      const store = new SuggestionStore(testDir);
      await store.addCandidates([createCandidate('cmd-acc', 'acc')]);
      await store.transition('cmd-acc', 'accepted');

      expect(await store.isAddressed('cmd-acc')).toBe(true);
    });

    it('should return true for dismissed', async () => {
      const store = new SuggestionStore(testDir);
      await store.addCandidates([createCandidate('cmd-dis', 'dis')]);
      await store.transition('cmd-dis', 'dismissed');

      expect(await store.isAddressed('cmd-dis')).toBe(true);
    });

    it('should return false for pending', async () => {
      const store = new SuggestionStore(testDir);
      await store.addCandidates([createCandidate('cmd-pend', 'pend')]);

      expect(await store.isAddressed('cmd-pend')).toBe(false);
    });

    it('should return false for deferred', async () => {
      const store = new SuggestionStore(testDir);
      await store.addCandidates([createCandidate('cmd-def', 'def')]);
      await store.transition('cmd-def', 'deferred');

      expect(await store.isAddressed('cmd-def')).toBe(false);
    });

    it('should return false for unknown', async () => {
      const store = new SuggestionStore(testDir);

      expect(await store.isAddressed('unknown')).toBe(false);
    });
  });

  describe('getByState', () => {
    it('should filter by state', async () => {
      const store = new SuggestionStore(testDir);
      await store.addCandidates([
        createCandidate('cmd-a', 'a'),
        createCandidate('cmd-b', 'b'),
        createCandidate('cmd-c', 'c'),
      ]);

      await store.transition('cmd-a', 'accepted');
      await store.transition('cmd-b', 'dismissed');

      const pending = await store.getByState('pending');
      expect(pending).toHaveLength(1);
      expect(pending[0].candidate.pattern).toBe('c');

      const accepted = await store.getByState('accepted');
      expect(accepted).toHaveLength(1);
      expect(accepted[0].candidate.pattern).toBe('a');
    });
  });

  describe('getCounts', () => {
    it('should return counts by state', async () => {
      const store = new SuggestionStore(testDir);
      await store.addCandidates([
        createCandidate('cmd-1', '1'),
        createCandidate('cmd-2', '2'),
        createCandidate('cmd-3', '3'),
        createCandidate('cmd-4', '4'),
      ]);

      await store.transition('cmd-1', 'accepted');
      await store.transition('cmd-2', 'dismissed');
      await store.transition('cmd-3', 'deferred');

      const counts = await store.getCounts();

      expect(counts.pending).toBe(1);
      expect(counts.accepted).toBe(1);
      expect(counts.dismissed).toBe(1);
      expect(counts.deferred).toBe(1);
    });
  });
});
