import { describe, it, expect } from 'vitest';
import {
  getFoundation,
  getAllFoundations,
  getFoundationPhase,
  getWonderConnections,
  getSkillCreatorMapping,
  getNextFoundation,
  getPreviousFoundation,
} from '../../src/core/registry';
import { FOUNDATION_ORDER, PHASE_ORDER } from '../../src/types/index';
import type { FoundationId, PhaseType } from '../../src/types/index';

describe('Foundation Registry', () => {

  describe('getAllFoundations', () => {
    it('returns all 8 foundations', () => {
      const all = getAllFoundations();
      expect(all).toHaveLength(8);
    });

    it('returns foundations in correct order', () => {
      const all = getAllFoundations();
      const ids = all.map(f => f.id);
      expect(ids).toEqual(FOUNDATION_ORDER);
    });

    it('has correct order numbers 1-8 with no gaps or duplicates', () => {
      const all = getAllFoundations();
      const orders = all.map(f => f.order).sort((a, b) => a - b);
      expect(orders).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });
  });

  describe('getFoundation', () => {
    it('returns the correct foundation by id', () => {
      const uc = getFoundation('unit-circle');
      expect(uc.id).toBe('unit-circle');
      expect(uc.name).toBe('Unit Circle');
      expect(uc.subtitle).toBe('Seeing');
      expect(uc.order).toBe(1);
      expect(uc.color).toBe('#1e3a5f');
    });

    it('throws for unknown foundation id', () => {
      expect(() => getFoundation('nonexistent' as FoundationId)).toThrow();
    });
  });

  describe('Phase completeness', () => {
    it('every foundation has all 6 phases defined', () => {
      for (const id of FOUNDATION_ORDER) {
        const foundation = getFoundation(id);
        for (const phase of PHASE_ORDER) {
          expect(foundation.phases.has(phase)).toBe(true);
          const phaseData = foundation.phases.get(phase)!;
          expect(phaseData.type).toBe(phase);
          expect(phaseData.title).toBeTruthy();
          expect(phaseData.narrativeIntro).toBeTruthy();
          expect(phaseData.content.text).toBeTruthy();
        }
      }
    });

    it('wonder phases have no math notation', () => {
      for (const id of FOUNDATION_ORDER) {
        const phase = getFoundationPhase(id, 'wonder');
        expect(phase.content.mathNotation).toBeUndefined();
      }
    });

    it('understand phases have math notation', () => {
      for (const id of FOUNDATION_ORDER) {
        const phase = getFoundationPhase(id, 'understand');
        expect(phase.content.mathNotation).toBeTruthy();
      }
    });
  });

  describe('Wonder connections', () => {
    it('every foundation has at least 2 wonder connections', () => {
      for (const id of FOUNDATION_ORDER) {
        const connections = getWonderConnections(id);
        expect(connections.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('wonder connections have required fields', () => {
      for (const id of FOUNDATION_ORDER) {
        const connections = getWonderConnections(id);
        for (const conn of connections) {
          expect(conn.id).toBeTruthy();
          expect(conn.phenomenon).toBeTruthy();
          expect(conn.description).toBeTruthy();
          expect(conn.foundationMapping).toBeTruthy();
        }
      }
    });
  });

  describe('Skill-creator mappings', () => {
    it('every foundation has a skill-creator mapping', () => {
      for (const id of FOUNDATION_ORDER) {
        const mapping = getSkillCreatorMapping(id);
        expect(mapping.mathConcept).toBeTruthy();
        expect(mapping.skillCreatorFunction).toBeTruthy();
        expect(mapping.explanation).toBeTruthy();
      }
    });
  });

  describe('Navigation', () => {
    it('getNextFoundation returns correct next', () => {
      expect(getNextFoundation('unit-circle')).toBe('pythagorean');
      expect(getNextFoundation('pythagorean')).toBe('trigonometry');
      expect(getNextFoundation('trigonometry')).toBe('vector-calculus');
      expect(getNextFoundation('vector-calculus')).toBe('set-theory');
      expect(getNextFoundation('set-theory')).toBe('category-theory');
      expect(getNextFoundation('category-theory')).toBe('information-theory');
      expect(getNextFoundation('information-theory')).toBe('l-systems');
    });

    it('getNextFoundation returns null for last', () => {
      expect(getNextFoundation('l-systems')).toBeNull();
    });

    it('getPreviousFoundation returns correct previous', () => {
      expect(getPreviousFoundation('l-systems')).toBe('information-theory');
      expect(getPreviousFoundation('pythagorean')).toBe('unit-circle');
    });

    it('getPreviousFoundation returns null for first', () => {
      expect(getPreviousFoundation('unit-circle')).toBeNull();
    });
  });

  describe('Foundation metadata', () => {
    const expected: [FoundationId, string, string, string][] = [
      ['unit-circle', 'Unit Circle', 'Seeing', '#1e3a5f'],
      ['pythagorean', 'Pythagorean Theorem', 'Relationship', '#c17817'],
      ['trigonometry', 'Trigonometry', 'Motion', '#0d7377'],
      ['vector-calculus', 'Vector Calculus', 'Fields', '#5b2c6f'],
      ['set-theory', 'Set Theory', 'Being', '#1a5c2e'],
      ['category-theory', 'Category Theory', 'Arrows', '#c0392b'],
      ['information-theory', 'Information Theory', 'The Channel', '#34495e'],
      ['l-systems', 'L-Systems', 'Growth', '#27ae60'],
    ];

    it.each(expected)('foundation %s has correct metadata', (id, name, subtitle, color) => {
      const f = getFoundation(id);
      expect(f.name).toBe(name);
      expect(f.subtitle).toBe(subtitle);
      expect(f.color).toBe(color);
    });
  });
});
