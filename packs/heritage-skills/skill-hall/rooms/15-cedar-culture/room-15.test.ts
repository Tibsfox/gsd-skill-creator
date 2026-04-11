/**
 * Tests for Room 15: Cedar Culture
 *
 * Validates:
 * - room-spec.json: 7 modules, cedar canoe ontological bridge (Artifact vs living being),
 *   all 4 nation attributions (Coast Salish, Nuu-chah-nulth, Kwakwaka'wakw, Makah),
 *   Law of the Bark, marine safety domain
 * - safety-config.json: 4 gate rules (tool/structural/marine/cold-water), 2 annotate rules,
 *   marine domain present
 * - cultural-config.json: 5 rules — cedar working L1, origin story L1, ceremonial carvings L2-3,
 *   Law of the Bark L1 include, longhouse L2 acknowledge-and-redirect
 * - Try Sessions: 3 beginner sessions, all-nations attribution, safety gates, ontological bridge,
 *   no pan-Indigenous language
 * - sumo-mappings.json: 10 mappings, 2 bridge refs, all kifStatements and naturalLanguage
 *
 * @module heritage-skills-pack/skill-hall/rooms/15-cedar-culture/room-15.test
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

const ecologySession = JSON.parse(
  readFileSync(resolve(roomDir, 'try-sessions/cedar-ecology-and-identity.json'), 'utf-8'),
);
const harvestSession = JSON.parse(
  readFileSync(resolve(roomDir, 'try-sessions/bark-harvesting-protocol.json'), 'utf-8'),
);
const canoeSession = JSON.parse(
  readFileSync(resolve(roomDir, 'try-sessions/canoe-type-comparison.json'), 'utf-8'),
);
const allSessions = [ecologySession, harvestSession, canoeSession];

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Collect all string values from all steps of a session */
function allStepText(session: typeof ecologySession): string {
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

describe('Room 15: Cedar Culture', () => {
  // ── room-spec.json ────────────────────────────────────────────────────────────

  describe('room-spec.json', () => {
    it('should have room number 15 and correct id', () => {
      expect(roomSpec.room).toBe(15);
      expect(roomSpec.id).toBe('room-15-cedar-culture');
    });

    it('should have first-nations tradition', () => {
      expect(roomSpec.traditions).toContain('first-nations');
    });

    it('should have tool, structural, and marine safety domains', () => {
      expect(roomSpec.safetyDomains).toContain('tool');
      expect(roomSpec.safetyDomains).toContain('structural');
      expect(roomSpec.safetyDomains).toContain('marine');
    });

    it('should have exactly 7 content modules', () => {
      expect(roomSpec.modules).toHaveLength(7);
    });

    it('should have at least 1 ontological bridge', () => {
      expect(roomSpec.ontologicalBridges).toBeDefined();
      expect(roomSpec.ontologicalBridges.length).toBeGreaterThanOrEqual(1);
    });

    it('should have cedar-15-teaching module with culturalLevel 1', () => {
      const module = roomSpec.modules.find(
        (m: { id: string }) => m.id === 'cedar-15-teaching',
      );
      expect(module).toBeDefined();
      expect(module.culturalLevel).toBe(1);
    });

    it('should have cedar-15-canoe-types module with safetyLevel gated', () => {
      const module = roomSpec.modules.find(
        (m: { id: string }) => m.id === 'cedar-15-canoe-types',
      );
      expect(module).toBeDefined();
      expect(module.safetyLevel).toBe('gated');
    });

    it('should have cedar-15-bentwood-box module', () => {
      const module = roomSpec.modules.find(
        (m: { id: string }) => m.id === 'cedar-15-bentwood-box',
      );
      expect(module).toBeDefined();
      expect(module.safetyLevel).toBe('gated');
    });

    it('should have cedar-15-longhouse module with culturalLevel 2', () => {
      const module = roomSpec.modules.find(
        (m: { id: string }) => m.id === 'cedar-15-longhouse',
      );
      expect(module).toBeDefined();
      expect(module.culturalLevel).toBe(2);
    });

    it('should have cedar-15-bark-harvesting module with tradition first-nations', () => {
      const module = roomSpec.modules.find(
        (m: { id: string }) => m.id === 'cedar-15-bark-harvesting',
      );
      expect(module).toBeDefined();
      expect(module.tradition).toBe('first-nations');
    });

    it('should have ontologicalBridges[0].id as bridge-15-cedar-canoe', () => {
      expect(roomSpec.ontologicalBridges[0].id).toBe('bridge-15-cedar-canoe');
    });

    it('should have ontologicalBridges[0].sumoView matching WaterVehicle', () => {
      expect(roomSpec.ontologicalBridges[0].sumoView).toMatch(/WaterVehicle/);
    });

    it('should have ontologicalBridges[0].indigenousView mentioning Grandmother, Xpey\', or living being', () => {
      expect(roomSpec.ontologicalBridges[0].indigenousView).toMatch(
        /Grandmother|Xpey'|living being/i,
      );
    });
  });

  // ── safety-config.json ────────────────────────────────────────────────────────

  describe('safety-config.json', () => {
    it('should have isCritical set to false', () => {
      expect(safetyConfig.isCritical).toBe(false);
    });

    it('should have ROOM15-GATE-001 tool gate for adze and drawknife', () => {
      const rule = safetyConfig.gateRules.find(
        (r: { id: string }) => r.id === 'ROOM15-GATE-001',
      );
      expect(rule).toBeDefined();
      expect(rule.action).toMatch(/GATE/);
      expect(rule.trigger).toMatch(/adze|drawknife|crooked knife/i);
    });

    it('should have ROOM15-GATE-002 structural gate for longhouse construction', () => {
      const rule = safetyConfig.gateRules.find(
        (r: { id: string }) => r.id === 'ROOM15-GATE-002',
      );
      expect(rule).toBeDefined();
      expect(rule.action).toMatch(/GATE/);
      expect(rule.trigger).toMatch(/longhouse|post|beam|structural/i);
    });

    it('should have ROOM15-GATE-003 marine gate for canoe launch and paddling', () => {
      const rule = safetyConfig.gateRules.find(
        (r: { id: string }) => r.id === 'ROOM15-GATE-003',
      );
      expect(rule).toBeDefined();
      expect(rule.action).toMatch(/GATE/);
      expect(rule.action).toMatch(/1-10-1|PFD|marine/i);
    });

    it('should have ROOM15-GATE-004 cold water immersion gate', () => {
      const rule = safetyConfig.gateRules.find(
        (r: { id: string }) => r.id === 'ROOM15-GATE-004',
      );
      expect(rule).toBeDefined();
      expect(rule.action).toMatch(/GATE/);
      expect(rule.action).toMatch(/1-10-1/);
    });

    it('should have exactly 2 annotate rules', () => {
      expect(safetyConfig.annotateRules).toHaveLength(2);
    });

    it('should have marine in primarySafetyDomains', () => {
      expect(safetyConfig.primarySafetyDomains).toContain('marine');
    });

    it('should have 4 gate rules total', () => {
      expect(safetyConfig.gateRules).toHaveLength(4);
    });
  });

  // ── cultural-config.json ──────────────────────────────────────────────────────

  describe('cultural-config.json', () => {
    it('should have ROOM15-CULT-001 at level 1 with Coast Salish and Nuu-chah-nulth attribution', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { id: string }) => r.id === 'ROOM15-CULT-001',
      );
      expect(rule).toBeDefined();
      expect(rule.level).toBe(1);
      expect(rule.nationAttribution).toMatch(/Coast Salish/);
      expect(rule.nationAttribution).toMatch(/Nuu-chah-nulth/);
    });

    it('should have ROOM15-CULT-002 cedar origin story at level 1', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { id: string }) => r.id === 'ROOM15-CULT-002',
      );
      expect(rule).toBeDefined();
      expect(rule.level).toBe(1);
    });

    it('should have ROOM15-CULT-002 note mentioning Xpey\', Grandmother, or origin', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { id: string }) => r.id === 'ROOM15-CULT-002',
      );
      expect(rule).toBeDefined();
      expect(rule.note).toMatch(/Xpey'|Grandmother|origin/i);
    });

    it('should have ROOM15-CULT-003 at level 2 with ceremonialLevel 3', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { id: string }) => r.id === 'ROOM15-CULT-003',
      );
      expect(rule).toBeDefined();
      expect(rule.level).toBe(2);
      expect(rule.ceremonialLevel).toBe(3);
    });

    it('should have ROOM15-CULT-003 action as summarize-and-refer', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { id: string }) => r.id === 'ROOM15-CULT-003',
      );
      expect(rule).toBeDefined();
      expect(rule.action).toBe('summarize-and-refer');
    });

    it('should have ROOM15-CULT-004 Law of the Bark at level 1 with action include', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { id: string }) => r.id === 'ROOM15-CULT-004',
      );
      expect(rule).toBeDefined();
      expect(rule.level).toBe(1);
      expect(rule.action).toBe('include');
    });

    it('should have ROOM15-CULT-004 note mentioning one-third or Law of the Bark', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { id: string }) => r.id === 'ROOM15-CULT-004',
      );
      expect(rule).toBeDefined();
      expect(rule.note).toMatch(/one-third|Law of the Bark/i);
    });

    it('should have ROOM15-CULT-005 longhouse at level 2', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { id: string }) => r.id === 'ROOM15-CULT-005',
      );
      expect(rule).toBeDefined();
      expect(rule.level).toBe(2);
    });
  });

  // ── Try Sessions ──────────────────────────────────────────────────────────────

  describe('Try Sessions', () => {
    it('should have 3 sessions all with difficulty beginner', () => {
      expect(allSessions).toHaveLength(3);
      for (const session of allSessions) {
        expect(session.difficulty).toBe('beginner');
      }
    });

    it('should have ecologySession with tradition first-nations', () => {
      expect(ecologySession.tradition).toBe('first-nations');
    });

    it('should have canoeSession with safetyLevel gated', () => {
      expect(canoeSession.safetyLevel).toBe('gated');
    });

    it('should have harvestSession with at least 1 step with safetyNote matching knife or ANNOTATE', () => {
      const safetyStep = harvestSession.steps.find(
        (s: { safetyNote?: string }) => s.safetyNote?.match(/knife|ANNOTATE/i),
      );
      expect(safetyStep).toBeDefined();
      expect(safetyStep.safetyNote).toMatch(/knife|ANNOTATE/i);
    });

    it('should have canoeSession with at least 1 step with safetyNote matching 1-10-1, PFD, or GATE', () => {
      const safetyStep = canoeSession.steps.find(
        (s: { safetyNote?: string }) => s.safetyNote?.match(/1-10-1|PFD|GATE/i),
      );
      expect(safetyStep).toBeDefined();
    });

    it('should have Coast Salish attribution in all session text', () => {
      const text = allSessionText();
      expect(text).toMatch(/Coast Salish/);
    });

    it('should have Nuu-chah-nulth attribution in all session text', () => {
      const text = allSessionText();
      expect(text).toMatch(/Nuu-chah-nulth/);
    });

    it("should have Kwakwaka'wakw or Makah attribution in canoeSession", () => {
      const text = allStepText(canoeSession);
      const hasKwakwaka = /Kwakwaka'wakw/.test(text);
      const hasMakah = /Makah/.test(text);
      expect(hasKwakwaka || hasMakah).toBe(true);
    });

    it("should have ecologySession step mentioning Xpey', Grandmother, or Cedar Teaching", () => {
      const teachingStep = ecologySession.steps.find(
        (s: { instruction?: string; culturalContext?: string }) =>
          s.culturalContext?.match(/Xpey'|Grandmother|Cedar Teaching/i) ||
          s.instruction?.match(/Xpey'|Grandmother|Cedar Teaching/i),
      );
      expect(teachingStep).toBeDefined();
    });

    it('should have ecologySession step with Law of the Bark content', () => {
      const lawStep = ecologySession.steps.find(
        (s: { instruction?: string; culturalContext?: string }) =>
          s.culturalContext?.match(/Law of the Bark|one-third/i) ||
          s.instruction?.match(/Law of the Bark|one-third/i),
      );
      expect(lawStep).toBeDefined();
    });

    it('should have canoeSession step with ontological bridge content (WaterVehicle and living being or relationship)', () => {
      const bridgeStep = canoeSession.steps.find(
        (s: { culturalContext?: string }) =>
          s.culturalContext?.match(/WaterVehicle/i) &&
          s.culturalContext?.match(/living being|relationship|gift|Grandmother/i),
      );
      expect(bridgeStep).toBeDefined();
    });

    it('should not contain generic "Native American" without nation name in any session', () => {
      const text = allSessionText();
      expect(/\bNative American\b/.test(text)).toBe(false);
    });

    it('should not contain generic "Indigenous peoples" without nation name in any session', () => {
      const text = allSessionText();
      expect(/\bIndigenous peoples\b/.test(text)).toBe(false);
    });
  });

  // ── sumo-mappings.json ────────────────────────────────────────────────────────

  describe('sumo-mappings.json', () => {
    it('should have 8+ SUMO mappings', () => {
      expect(sumoMappings.length).toBeGreaterThanOrEqual(8);
    });

    it('should have 2+ mappings referencing bridge-15-cedar-canoe', () => {
      const bridgeMappings = sumoMappings.filter(
        (m: { ontologicalBridge?: string | null }) =>
          m.ontologicalBridge === 'bridge-15-cedar-canoe',
      );
      expect(bridgeMappings.length).toBeGreaterThanOrEqual(2);
    });

    it('should have kifStatement for every mapping', () => {
      for (const mapping of sumoMappings) {
        expect(mapping.kifStatement).toBeDefined();
        expect(typeof mapping.kifStatement).toBe('string');
        expect(mapping.kifStatement.length).toBeGreaterThan(0);
      }
    });

    it('should have naturalLanguage for every mapping', () => {
      for (const mapping of sumoMappings) {
        expect(mapping.naturalLanguage).toBeDefined();
        expect(mapping.naturalLanguage.length).toBeGreaterThan(0);
      }
    });

    it('should have at least one mapping with sumoTerm WaterVehicle', () => {
      const waterVehicleMappings = sumoMappings.filter(
        (m: { sumoTerm: string }) => m.sumoTerm === 'WaterVehicle',
      );
      expect(waterVehicleMappings.length).toBeGreaterThan(0);
    });

    it('should have at least one mapping with sumoTerm HeritageSkill or kifStatement containing HeritageSkill', () => {
      const heritageSkillMappings = sumoMappings.filter(
        (m: { sumoTerm: string; kifStatement: string }) =>
          m.sumoTerm === 'HeritageSkill' || m.kifStatement.includes('HeritageSkill'),
      );
      expect(heritageSkillMappings.length).toBeGreaterThan(0);
    });
  });
});
