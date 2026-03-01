/**
 * Tests for the DisciplineBrowser.
 *
 * Validates that all 8 disciplines are browsable with non-empty
 * history, philosophy, key concepts, and connections. Verifies
 * bidirectional connections and Training Hall accessibility.
 */

import { describe, it, expect } from 'vitest';
import type { MindBodyWingId } from '../types.js';
import { DisciplineBrowser } from './discipline-browser.js';
import type { DisciplineProfile, DisciplineConnection } from './discipline-browser.js';

const ALL_WING_IDS: MindBodyWingId[] = [
  'breath',
  'meditation',
  'yoga',
  'pilates',
  'martial-arts',
  'tai-chi',
  'relaxation',
  'philosophy',
];

describe('DisciplineBrowser', () => {
  const browser = new DisciplineBrowser();

  describe('getAllDisciplines', () => {
    it('returns exactly 8 disciplines', () => {
      const all = browser.getAllDisciplines();
      expect(all).toHaveLength(8);
    });

    it('returns all 8 wing IDs', () => {
      const ids = browser.getAllDisciplines().map((d) => d.id);
      for (const wingId of ALL_WING_IDS) {
        expect(ids).toContain(wingId);
      }
    });
  });

  describe('getDisciplineProfile', () => {
    it.each(ALL_WING_IDS)('%s has a non-empty history', (wingId) => {
      const profile = browser.getDisciplineProfile(wingId);
      expect(profile.history.length).toBeGreaterThan(50);
    });

    it.each(ALL_WING_IDS)('%s has a non-empty philosophy', (wingId) => {
      const profile = browser.getDisciplineProfile(wingId);
      expect(profile.philosophy.length).toBeGreaterThan(50);
    });

    it.each(ALL_WING_IDS)('%s has non-empty keyConcepts', (wingId) => {
      const profile = browser.getDisciplineProfile(wingId);
      expect(profile.keyConcepts.length).toBeGreaterThan(0);
      for (const kc of profile.keyConcepts) {
        expect(kc.name).toBeTruthy();
        expect(kc.description).toBeTruthy();
      }
    });

    it.each(ALL_WING_IDS)('%s has non-empty connections', (wingId) => {
      const profile = browser.getDisciplineProfile(wingId);
      expect(profile.connections.length).toBeGreaterThan(0);
    });

    it('throws for unknown wing ID', () => {
      expect(() => {
        browser.getDisciplineProfile('unknown' as MindBodyWingId);
      }).toThrow('Unknown discipline');
    });
  });

  describe('getConnections', () => {
    it.each(ALL_WING_IDS)('%s connects to at least 2 other disciplines', (wingId) => {
      const connections = browser.getConnections(wingId);
      expect(connections.length).toBeGreaterThanOrEqual(2);
    });

    it.each(ALL_WING_IDS)('%s connections point to valid wing IDs', (wingId) => {
      const connections = browser.getConnections(wingId);
      for (const conn of connections) {
        expect(ALL_WING_IDS).toContain(conn.targetId);
        expect(conn.targetName).toBeTruthy();
        expect(conn.description).toBeTruthy();
      }
    });

    it('no discipline connects to itself', () => {
      for (const wingId of ALL_WING_IDS) {
        const connections = browser.getConnections(wingId);
        const selfConn = connections.find((c) => c.targetId === wingId);
        expect(selfConn).toBeUndefined();
      }
    });

    it('throws for unknown wing ID', () => {
      expect(() => {
        browser.getConnections('unknown' as MindBodyWingId);
      }).toThrow('Unknown discipline');
    });
  });

  describe('bidirectional connections', () => {
    it('breath connects to meditation and vice versa', () => {
      const breathConns = browser.getConnections('breath');
      const medConns = browser.getConnections('meditation');
      expect(breathConns.some((c) => c.targetId === 'meditation')).toBe(true);
      expect(medConns.some((c) => c.targetId === 'breath')).toBe(true);
    });

    it('yoga connects to breath and vice versa', () => {
      const yogaConns = browser.getConnections('yoga');
      const breathConns = browser.getConnections('breath');
      expect(yogaConns.some((c) => c.targetId === 'breath')).toBe(true);
      expect(breathConns.some((c) => c.targetId === 'yoga')).toBe(true);
    });
  });

  describe('Training Hall integration', () => {
    it('browser can be instantiated without arguments (stateless)', () => {
      const hallBrowser = new DisciplineBrowser();
      expect(hallBrowser).toBeDefined();
      expect(hallBrowser.getAllDisciplines()).toHaveLength(8);
    });

    it('each discipline profile has all required fields for display', () => {
      const allDiscs = browser.getAllDisciplines();
      for (const disc of allDiscs) {
        expect(disc).toHaveProperty('id');
        expect(disc).toHaveProperty('name');
        expect(disc).toHaveProperty('history');
        expect(disc).toHaveProperty('philosophy');
        expect(disc).toHaveProperty('keyConcepts');
        expect(disc).toHaveProperty('connections');
      }
    });
  });
});
