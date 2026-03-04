import { describe, it, expect } from 'vitest';
import { EphemeralForker } from './ephemeral-forker.js';
import { MuseLoader } from './muse-loader.js';
import type { MuseId } from './muse-schema-validator.js';
import type { MergeStrategy } from './muse-forking.js';

const FOXY_CFG = {
  name: 'foxy', version: '1.0.0', museType: 'system', totalBudget: 0.15,
  orientation: { angle: 1.2566, magnitude: 0.8 },
  vocabulary: ['cartography', 'narrative arc', 'creative direction'],
  voice: { tone: 'warm-creative', style: 'narrative', signature: 'maps and stories' },
  activationPatterns: ['creative|vision|story'], composableWith: ['sam', 'cedar'],
};

const LEX_CFG = {
  name: 'lex', version: '1.0.0', museType: 'system', totalBudget: 0.15,
  orientation: { angle: 0.0873, magnitude: 0.9 },
  vocabulary: ['execution discipline', 'pipeline', 'verification'],
  voice: { tone: 'precise-disciplined', style: 'technical', signature: 'measure twice' },
  activationPatterns: ['plan|execute|verify'], composableWith: ['hemlock', 'cedar'],
};

const loader = new MuseLoader();
const muses = loader.loadAll([FOXY_CFG, LEX_CFG]);
const registry = loader.createRegistry(muses);

describe('EphemeralForker', () => {
  describe('fork', () => {
    it('produces one AugmentedContext per requested muse', () => {
      const forker = new EphemeralForker(registry);
      const contexts = forker.fork({
        context: 'Working on milestone design',
        muses: ['foxy', 'lex'] as MuseId[],
        question: 'How should we approach this?',
        mergeStrategy: 'consensus',
      });
      expect(contexts.size).toBe(2);
      expect(contexts.has('foxy' as MuseId)).toBe(true);
      expect(contexts.has('lex' as MuseId)).toBe(true);
    });

    it('augmented context includes muse vocabulary and voice', () => {
      const forker = new EphemeralForker(registry);
      const contexts = forker.fork({
        context: 'test', muses: ['foxy'] as MuseId[],
        question: 'test', mergeStrategy: 'consensus',
      });
      const foxyCtx = contexts.get('foxy' as MuseId)!;
      expect(foxyCtx.museVocabulary).toContain('cartography');
      expect(foxyCtx.museVoice.tone).toBe('warm-creative');
    });

    it('skips unknown muses without error', () => {
      const forker = new EphemeralForker(registry);
      const contexts = forker.fork({
        context: 'test', muses: ['foxy', 'willow'] as MuseId[],
        question: 'test', mergeStrategy: 'consensus',
      });
      expect(contexts.size).toBe(1); // willow not in registry
    });
  });

  describe('execute', () => {
    it('returns a MusePerspective with content and keywords', () => {
      const forker = new EphemeralForker(registry);
      const contexts = forker.fork({
        context: 'test', muses: ['foxy'] as MuseId[],
        question: 'test', mergeStrategy: 'consensus',
      });
      const perspective = forker.execute('foxy' as MuseId, contexts.get('foxy' as MuseId)!);
      expect(perspective.museId).toBe('foxy');
      expect(perspective.content).toBeTruthy();
      expect(perspective.keywords.length).toBeGreaterThan(0);
    });
  });

  describe('merge', () => {
    const perspectives = [
      { museId: 'foxy' as MuseId, content: 'narrative approach with creative direction', activationScore: 0.8, voice: { tone: 'warm', style: 'narrative' }, keywords: ['narrative', 'creative'] },
      { museId: 'lex' as MuseId, content: 'verification pipeline with creative discipline', activationScore: 0.7, voice: { tone: 'precise', style: 'technical' }, keywords: ['verification', 'pipeline'] },
    ];

    it('consensus returns common content', () => {
      const forker = new EphemeralForker(registry);
      const result = forker.merge(perspectives, 'consensus');
      expect(result.strategy).toBe('consensus');
      expect(result.content).toBeTruthy();
      expect(result.contributingMuses).toHaveLength(2);
    });

    it('comparison labels each perspective with muse name', () => {
      const forker = new EphemeralForker(registry);
      const result = forker.merge(perspectives, 'comparison');
      expect(result.content).toContain('foxy');
      expect(result.content).toContain('lex');
    });

    it('strongest returns only highest-scoring perspective', () => {
      const forker = new EphemeralForker(registry);
      const result = forker.merge(perspectives, 'strongest');
      expect(result.contributingMuses).toHaveLength(1);
      expect(result.contributingMuses[0]).toBe('foxy'); // 0.8 > 0.7
    });

    it('synthesis combines all perspectives', () => {
      const forker = new EphemeralForker(registry);
      const result = forker.merge(perspectives, 'synthesis');
      expect(result.perspectives).toHaveLength(2);
      expect(result.content).toBeTruthy();
    });
  });

  describe('consult', () => {
    it('full pipeline: fork -> execute -> merge', () => {
      const forker = new EphemeralForker(registry);
      const result = forker.consult({
        context: 'Designing a new feature',
        muses: ['foxy', 'lex'] as MuseId[],
        question: 'What approach?',
        mergeStrategy: 'comparison',
      });
      expect(result.perspectives).toHaveLength(2);
      expect(result.contributingMuses).toContain('foxy');
      expect(result.contributingMuses).toContain('lex');
    });
  });
});
