import { describe, it, expect } from 'vitest';
import {
  getFoundation,
  getAllFoundations,
  getFoundationPhase,
  getWonderConnections,
  getSkillCreatorMapping,
  getNextFoundation,
  getPreviousFoundation,
} from '../../src/core/registry.js';
import type { FoundationId, PhaseType } from '../../src/types/index.js';
import { FOUNDATION_ORDER, PHASE_ORDER } from '../../src/types/index.js';

describe('Foundation Registry', () => {
  // ─── All 8 foundations exist ────────────────────────

  describe('getAllFoundations', () => {
    it('returns exactly 8 foundations', () => {
      const all = getAllFoundations();
      expect(all).toHaveLength(8);
    });

    it('returns foundations in canonical order', () => {
      const all = getAllFoundations();
      expect(all.map((f) => f.id)).toEqual(FOUNDATION_ORDER);
    });
  });

  // ─── Individual foundation lookup ──────────────────

  describe('getFoundation', () => {
    it.each(FOUNDATION_ORDER)('returns foundation for %s', (id) => {
      const f = getFoundation(id);
      expect(f.id).toBe(id);
      expect(f.name).toBeTruthy();
      expect(f.subtitle).toBeTruthy();
      expect(f.description).toBeTruthy();
      expect(f.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(f.icon).toBeTruthy();
    });

    it('throws for invalid foundation id', () => {
      expect(() => getFoundation('nonexistent' as FoundationId)).toThrow('Foundation not found');
    });
  });

  // ─── Foundation metadata ───────────────────────────

  describe('metadata completeness', () => {
    it.each([
      ['unit-circle', 'Unit Circle', 'Seeing', 1, '#1e3a5f', '○'],
      ['pythagorean', 'Pythagorean Theorem', 'Relationship', 2, '#d4a574', '△'],
      ['trigonometry', 'Trigonometry', 'Motion', 3, '#2d8c8c', '∿'],
      ['vector-calculus', 'Vector Calculus', 'Fields', 4, '#6b4d8a', '→'],
      ['set-theory', 'Set Theory', 'Being', 5, '#2d5a2d', '{}'],
      ['category-theory', 'Category Theory', 'Arrows', 6, '#d47a6b', '⟶'],
      ['information-theory', 'Information Theory', 'The Channel', 7, '#c4a02d', '⊕'],
      ['l-systems', 'L-Systems', 'Growth', 8, '#2da55a', '\uD83C\uDF3F'],
    ] as const)(
      '%s has correct metadata',
      (id, name, subtitle, order, color, icon) => {
        const f = getFoundation(id as FoundationId);
        expect(f.name).toBe(name);
        expect(f.subtitle).toBe(subtitle);
        expect(f.order).toBe(order);
        expect(f.color).toBe(color);
        expect(f.icon).toBe(icon);
      },
    );
  });

  // ─── Phase completeness ────────────────────────────

  describe('phase data', () => {
    it.each(FOUNDATION_ORDER)('%s has all 6 phases', (id) => {
      const f = getFoundation(id);
      for (const phase of PHASE_ORDER) {
        expect(f.phases.has(phase)).toBe(true);
        const p = f.phases.get(phase)!;
        expect(p.type).toBe(phase);
        expect(p.title).toBeTruthy();
        expect(p.narrativeIntro).toBeTruthy();
        expect(p.content.text).toBeTruthy();
        expect(p.completionCriteria.length).toBeGreaterThan(0);
      }
    });

    it.each(FOUNDATION_ORDER)('%s touch phase has at least 2 interactive elements', (id) => {
      const touch = getFoundationPhase(id, 'touch');
      expect(touch.interactiveElements.length).toBeGreaterThanOrEqual(2);
    });

    it.each(FOUNDATION_ORDER)('%s wonder phase has no mathNotation', (id) => {
      const wonder = getFoundationPhase(id, 'wonder');
      expect(wonder.content.mathNotation).toBeUndefined();
    });

    it.each(FOUNDATION_ORDER)('%s see phase has no mathNotation', (id) => {
      const see = getFoundationPhase(id, 'see');
      expect(see.content.mathNotation).toBeUndefined();
    });

    it.each(FOUNDATION_ORDER)('%s understand phase has mathNotation', (id) => {
      const understand = getFoundationPhase(id, 'understand');
      expect(understand.content.mathNotation).toBeTruthy();
    });

    it.each(FOUNDATION_ORDER)('%s connect phase has mathNotation', (id) => {
      const connect = getFoundationPhase(id, 'connect');
      expect(connect.content.mathNotation).toBeTruthy();
    });

    it.each(FOUNDATION_ORDER)('%s create phase has mathNotation', (id) => {
      const create = getFoundationPhase(id, 'create');
      expect(create.content.mathNotation).toBeTruthy();
    });
  });

  describe('getFoundationPhase', () => {
    it('returns the correct phase', () => {
      const phase = getFoundationPhase('unit-circle', 'wonder');
      expect(phase.type).toBe('wonder');
      expect(phase.title).toBeTruthy();
    });

    it('throws for invalid phase', () => {
      expect(() => getFoundationPhase('unit-circle', 'invalid' as PhaseType)).toThrow(
        "Phase 'invalid' not found",
      );
    });
  });

  // ─── Wonder connections ────────────────────────────

  describe('wonder connections', () => {
    it.each(FOUNDATION_ORDER)('%s has at least 2 wonder connections', (id) => {
      const wc = getWonderConnections(id);
      expect(wc.length).toBeGreaterThanOrEqual(2);
    });

    it('wonder connections have required fields', () => {
      for (const id of FOUNDATION_ORDER) {
        for (const wc of getWonderConnections(id)) {
          expect(wc.id).toBeTruthy();
          expect(wc.phenomenon).toBeTruthy();
          expect(wc.description).toBeTruthy();
          expect(wc.foundationMapping).toBeTruthy();
        }
      }
    });
  });

  // ─── Skill-creator mapping ─────────────────────────

  describe('skill-creator mapping', () => {
    it.each(FOUNDATION_ORDER)('%s has a skill-creator mapping with complex plane position', (id) => {
      const mapping = getSkillCreatorMapping(id);
      expect(mapping.mathConcept).toBeTruthy();
      expect(mapping.skillCreatorFunction).toBeTruthy();
      expect(mapping.explanation).toBeTruthy();
      expect(mapping.complexPlanePosition).toBeDefined();
      expect(mapping.complexPlanePosition!.theta).toBeGreaterThanOrEqual(0);
      expect(mapping.complexPlanePosition!.r).toBeGreaterThan(0);
      expect(mapping.complexPlanePosition!.r).toBeLessThanOrEqual(1);
    });

    it('complex plane positions are unique', () => {
      const positions = FOUNDATION_ORDER.map((id) => {
        const m = getSkillCreatorMapping(id);
        return `${m.complexPlanePosition!.theta.toFixed(6)},${m.complexPlanePosition!.r.toFixed(6)}`;
      });
      const unique = new Set(positions);
      expect(unique.size).toBe(positions.length);
    });
  });

  // ─── Navigation helpers ────────────────────────────

  describe('getNextFoundation', () => {
    it('returns the next foundation in order', () => {
      expect(getNextFoundation('unit-circle')).toBe('pythagorean');
      expect(getNextFoundation('trigonometry')).toBe('vector-calculus');
      expect(getNextFoundation('information-theory')).toBe('l-systems');
    });

    it('returns null for the last foundation', () => {
      expect(getNextFoundation('l-systems')).toBeNull();
    });
  });

  describe('getPreviousFoundation', () => {
    it('returns the previous foundation in order', () => {
      expect(getPreviousFoundation('pythagorean')).toBe('unit-circle');
      expect(getPreviousFoundation('l-systems')).toBe('information-theory');
    });

    it('returns null for the first foundation', () => {
      expect(getPreviousFoundation('unit-circle')).toBeNull();
    });
  });
});
