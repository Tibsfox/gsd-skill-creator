import { describe, it, expect } from 'vitest';
import { MuseLoader } from './muse-loader.js';
import type { MuseId } from './muse-schema-validator.js';

const FOXY_CONFIG = {
  name: 'foxy',
  version: '1.0.0',
  museType: 'system',
  totalBudget: 0.15,
  orientation: { angle: 1.2566, magnitude: 0.8 },
  vocabulary: ['cartography', 'narrative arc', 'creative direction'],
  voice: { tone: 'warm-creative', style: 'narrative', signature: 'maps and stories' },
  activationPatterns: ['creative|vision|story', 'ask Foxy|invoke Foxy'],
  composableWith: ['sam', 'cedar', 'willow'],
};

const LEX_CONFIG = {
  name: 'lex',
  version: '1.0.0',
  museType: 'system',
  totalBudget: 0.15,
  orientation: { angle: 0.0873, magnitude: 0.9 },
  vocabulary: ['execution discipline', 'pipeline', 'verification'],
  voice: { tone: 'precise-disciplined', style: 'technical', signature: 'measure twice' },
  activationPatterns: ['plan|execute|verify', 'ask Lex|invoke Lex'],
  composableWith: ['hemlock', 'cedar', 'foxy'],
};

const INVALID_CONFIG = {
  name: 'bad-muse',
  version: '1.0.0',
  museType: 'system',
  orientation: { angle: 99.0, magnitude: 5.0 }, // invalid
  voice: { tone: 'x', style: 'narrative' },
  activationPatterns: [],
  composableWith: [],
};

const loader = new MuseLoader();

describe('MuseLoader', () => {
  describe('loadFromObject', () => {
    it('loads valid muse config into LoadedMuse', () => {
      const muse = loader.loadFromObject(FOXY_CONFIG);
      expect(muse).not.toBeNull();
      expect(muse!.id).toBe('foxy');
      expect(muse!.planePosition.real).toBeCloseTo(0.2472, 3);
      expect(muse!.planePosition.imaginary).toBeCloseTo(0.7608, 3);
    });

    it('returns null for invalid config without throwing', () => {
      const muse = loader.loadFromObject(INVALID_CONFIG);
      expect(muse).toBeNull();
    });

    it('returns null for non-muse objects without throwing', () => {
      const muse = loader.loadFromObject({ name: 'standard', version: '1.0.0' });
      expect(muse).toBeNull();
    });
  });

  describe('loadAll', () => {
    it('loads multiple configs and skips invalid ones', () => {
      const result = loader.loadAll([FOXY_CONFIG, LEX_CONFIG, INVALID_CONFIG]);
      expect(result.size).toBe(2);
      expect(result.has('foxy' as MuseId)).toBe(true);
      expect(result.has('lex' as MuseId)).toBe(true);
    });
  });

  describe('createRegistry', () => {
    it('getMuse returns loaded muse by id', () => {
      const muses = loader.loadAll([FOXY_CONFIG, LEX_CONFIG]);
      const registry = loader.createRegistry(muses);
      const foxy = registry.getMuse('foxy');
      expect(foxy).toBeDefined();
      expect(foxy!.name).toBe('foxy');
    });

    it('allMuses returns all loaded muses', () => {
      const muses = loader.loadAll([FOXY_CONFIG, LEX_CONFIG]);
      const registry = loader.createRegistry(muses);
      expect(registry.allMuses()).toHaveLength(2);
    });

    it('getMusesByPattern matches activation patterns', () => {
      const muses = loader.loadAll([FOXY_CONFIG, LEX_CONFIG]);
      const registry = loader.createRegistry(muses);
      const creative = registry.getMusesByPattern('creative direction');
      expect(creative.map(m => m.id)).toContain('foxy');
    });

    it('getMusesByPattern returns empty for no match', () => {
      const muses = loader.loadAll([FOXY_CONFIG, LEX_CONFIG]);
      const registry = loader.createRegistry(muses);
      expect(registry.getMusesByPattern('quantum physics')).toHaveLength(0);
    });

    it('museBudgetUsed sums total budgets', () => {
      const muses = loader.loadAll([FOXY_CONFIG, LEX_CONFIG]);
      const registry = loader.createRegistry(muses);
      expect(registry.museBudgetUsed()).toBeCloseTo(0.30, 2);
    });

    it('getMuse returns undefined for unknown id', () => {
      const muses = loader.loadAll([FOXY_CONFIG]);
      const registry = loader.createRegistry(muses);
      expect(registry.getMuse('willow')).toBeUndefined();
    });
  });
});
