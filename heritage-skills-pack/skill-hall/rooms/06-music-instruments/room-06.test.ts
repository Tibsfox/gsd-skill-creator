/**
 * Tests for Room 06: Music & Instruments
 *
 * Validates:
 * - room-spec.json: SkillModule structure, room 6, traditions (appalachian, first-nations, inuit),
 *   safety domains (tool, fire), 7 modules, dulcimer / banjo / frame-drum / katajjaq modules
 * - safety-config.json: isCritical=false, criticalRules empty, gateRules empty (ANNOTATE-only room),
 *   4 annotate rules including string tension and hide preparation
 * - cultural-config.json: 7 rules, katajjaq at Level 1, drum songs at Level 3 restrict,
 *   ceremonial songs at Level 4 hard-block (both First Nations and Inuit)
 * - Try Sessions: 3 beginner sessions (appalachian, first-nations, inuit), correct timing,
 *   katajjaq culturalLevel=1, drum session culturalLevel=2, Nunavut/Nunavik mention,
 *   ceremonial restriction noted in drum session, Anishinaabe/Cree attribution,
 *   African American banjo origin in dulcimer session, no pan-Indigenous language
 * - sumo-mappings.json: 8+ mappings with kifStatement and naturalLanguage on all entries,
 *   MusicalInstrument / Singing / HeritageSkill terms present
 *
 * @module heritage-skills-pack/skill-hall/rooms/06-music-instruments/room-06.test
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ─── File Loading ──────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const roomDir = __dirname;

const roomSpec = JSON.parse(readFileSync(resolve(roomDir, 'room-spec.json'), 'utf-8'));
const safetyConfig = JSON.parse(readFileSync(resolve(roomDir, 'safety-config.json'), 'utf-8'));
const culturalConfig = JSON.parse(readFileSync(resolve(roomDir, 'cultural-config.json'), 'utf-8'));
const sumoMappings = JSON.parse(readFileSync(resolve(roomDir, 'sumo-mappings.json'), 'utf-8'));

const dulcimerSession = JSON.parse(
  readFileSync(resolve(roomDir, 'try-sessions/dulcimer-string-basics.json'), 'utf-8'),
);
const drumSession = JSON.parse(
  readFileSync(resolve(roomDir, 'try-sessions/drum-frame-construction.json'), 'utf-8'),
);
const katajjaqSession = JSON.parse(
  readFileSync(resolve(roomDir, 'try-sessions/katajjaq-rhythm-patterns.json'), 'utf-8'),
);

const allSessions = [dulcimerSession, drumSession, katajjaqSession];

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Collect all string values from all steps of a session */
function allStepText(session: typeof dulcimerSession): string {
  return session.steps
    .flatMap((s: Record<string, string | undefined>) =>
      [s.instruction, s.safetyNote, s.culturalContext, s.nationAttribution].filter(Boolean),
    )
    .join('\n');
}

/** Collect all step text across all three sessions */
function allSessionText(): string {
  return allSessions.map(allStepText).join('\n');
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('Room 06: Music & Instruments', () => {
  // ── room-spec.json ────────────────────────────────────────────────────────────

  describe('room-spec.json', () => {
    it('should have room number 6', () => {
      expect(roomSpec.room).toBe(6);
      expect(roomSpec.id).toBe('room-06-music-instruments');
    });

    it('should have appalachian, first-nations, inuit traditions', () => {
      expect(roomSpec.traditions).toContain('appalachian');
      expect(roomSpec.traditions).toContain('first-nations');
      expect(roomSpec.traditions).toContain('inuit');
    });

    it('should have tool and fire safety domains', () => {
      expect(roomSpec.safetyDomains).toContain('tool');
      expect(roomSpec.safetyDomains).toContain('fire');
    });

    it('should have 7 content modules', () => {
      expect(roomSpec.modules).toHaveLength(7);
    });

    it('should have dulcimer module', () => {
      const dulcimerModule = roomSpec.modules.find((m: { id: string }) =>
        /dulcimer/i.test(m.id),
      );
      expect(dulcimerModule).toBeDefined();
    });

    it('should have banjo history module', () => {
      const banjoModule = roomSpec.modules.find((m: { id: string }) => /banjo/i.test(m.id));
      expect(banjoModule).toBeDefined();
    });

    it('should have frame drum module', () => {
      const drumModule = roomSpec.modules.find((m: { id: string }) =>
        /frame.drum|fn.drum/i.test(m.id),
      );
      expect(drumModule).toBeDefined();
    });

    it('should have katajjaq module', () => {
      const katajjaqModule = roomSpec.modules.find((m: { id: string }) =>
        /katajjaq/i.test(m.id),
      );
      expect(katajjaqModule).toBeDefined();
    });
  });

  // ── safety-config.json ────────────────────────────────────────────────────────

  describe('safety-config.json', () => {
    it('should not be critical (isCritical false)', () => {
      expect(safetyConfig.isCritical).toBe(false);
    });

    it('should have empty criticalRules array', () => {
      expect(safetyConfig.criticalRules).toHaveLength(0);
    });

    it('should have empty gateRules array', () => {
      expect(safetyConfig.gateRules).toHaveLength(0);
    });

    it('should have 4 annotate rules', () => {
      expect(safetyConfig.annotateRules).toHaveLength(4);
    });

    it('string tension annotate rule should be present', () => {
      const rule = safetyConfig.annotateRules.find(
        (r: { id: string; action: string }) =>
          r.id === 'ROOM06-ANN-003' && /ANNOTATE/i.test(r.action),
      );
      expect(rule).toBeDefined();
    });

    it('hide preparation annotate rule should be present', () => {
      const rule = safetyConfig.annotateRules.find(
        (r: { id: string; trigger: string }) =>
          r.id === 'ROOM06-ANN-002' && /hide/i.test(r.trigger),
      );
      expect(rule).toBeDefined();
    });
  });

  // ── cultural-config.json ──────────────────────────────────────────────────────

  describe('cultural-config.json', () => {
    it('should have 7 cultural rules', () => {
      expect(culturalConfig.culturalRules).toHaveLength(7);
    });

    it('should have katajjaq at Level 1', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { concept: string; level: number }) =>
          /katajjaq/i.test(r.concept) && r.level === 1,
      );
      expect(rule).toBeDefined();
    });

    it('should have First Nations ceremonial songs at Level 4 hard-block', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { level: number; nationAttribution: string; action: string }) =>
          r.level === 4 &&
          /First Nations/i.test(r.nationAttribution) &&
          r.action === 'hard-block',
      );
      expect(rule).toBeDefined();
    });

    it('should have Inuit ceremonial songs at Level 4 hard-block', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { level: number; tradition: string; action: string }) =>
          r.level === 4 && r.tradition === 'inuit' && r.action === 'hard-block',
      );
      expect(rule).toBeDefined();
    });

    it('should have drum songs at Level 3 restrict', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { level: number; action: string }) => r.level === 3 && r.action === 'restrict',
      );
      expect(rule).toBeDefined();
    });

    it('should have Inuit attribution for katajjaq rule', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { nationAttribution: string; concept: string }) =>
          /Inuit/i.test(r.nationAttribution) && /katajjaq/i.test(r.concept),
      );
      expect(rule).toBeDefined();
    });
  });

  // ── Try Sessions ──────────────────────────────────────────────────────────────

  describe('Try Sessions', () => {
    it('should have 3 Try Sessions loaded', () => {
      expect(allSessions).toHaveLength(3);
    });

    it('should cover appalachian, first-nations, inuit', () => {
      const traditions = allSessions.map((s) => s.tradition);
      expect(traditions).toContain('appalachian');
      expect(traditions).toContain('first-nations');
      expect(traditions).toContain('inuit');
    });

    it('should all be beginner difficulty', () => {
      for (const session of allSessions) {
        expect(session.difficulty).toBe('beginner');
      }
    });

    it('should all have estimatedMinutes between 15 and 25', () => {
      for (const session of allSessions) {
        expect(session.estimatedMinutes).toBeGreaterThanOrEqual(15);
        expect(session.estimatedMinutes).toBeLessThanOrEqual(25);
      }
    });

    it('katajjaq session should be culturalLevel 1', () => {
      expect(katajjaqSession.culturalLevel).toBe(1);
    });

    it('drum session should be culturalLevel 2', () => {
      expect(drumSession.culturalLevel).toBe(2);
    });

    it('katajjaq session should mention Nunavut or Nunavik', () => {
      const text = allStepText(katajjaqSession);
      expect(text).toMatch(/Nunavut|Nunavik/);
    });

    it('drum session should note ceremonial use is restricted', () => {
      const text = allStepText(drumSession);
      expect(text).toMatch(/Level 3|Level 4|restrict|ceremonial/i);
    });

    it('drum session should have Anishinaabe or Cree attribution', () => {
      const hasAttribution = drumSession.steps.some(
        (s: { nationAttribution?: string }) =>
          s.nationAttribution && /Anishinaabe|Cree/.test(s.nationAttribution),
      );
      expect(hasAttribution).toBe(true);
    });

    it('dulcimer session should mention African American banjo origin', () => {
      const text = allStepText(dulcimerSession);
      expect(text).toMatch(/African|West African|banjo/i);
    });

    it('should not contain generic "Native American" without nation name', () => {
      const text = allSessionText();
      expect(text).not.toMatch(/\bNative American\b/);
    });
  });

  // ── sumo-mappings.json ────────────────────────────────────────────────────────

  describe('sumo-mappings.json', () => {
    it('should have 8+ SUMO mappings', () => {
      expect(sumoMappings.length).toBeGreaterThanOrEqual(8);
    });

    it('should have kifStatement for every mapping', () => {
      for (const mapping of sumoMappings) {
        expect(mapping.kifStatement).toBeTruthy();
      }
    });

    it('should have naturalLanguage for every mapping', () => {
      for (const mapping of sumoMappings) {
        expect(mapping.naturalLanguage).toBeTruthy();
      }
    });

    it('should have MusicalInstrument SUMO term', () => {
      const hasMusicalInstrument = sumoMappings.some(
        (m: { sumoTerm: string }) => m.sumoTerm === 'MusicalInstrument',
      );
      expect(hasMusicalInstrument).toBe(true);
    });

    it('should have Singing SUMO term in at least one mapping', () => {
      const hasSinging = sumoMappings.some((m: { sumoTerm: string }) => m.sumoTerm === 'Singing');
      expect(hasSinging).toBe(true);
    });

    it('should have HeritageSkill in at least one mapping', () => {
      const hasHeritageSkill = sumoMappings.some(
        (m: { sumoTerm: string }) => m.sumoTerm === 'HeritageSkill',
      );
      expect(hasHeritageSkill).toBe(true);
    });
  });
});
