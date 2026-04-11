/**
 * Tests for Room 13: Northern Watercraft
 *
 * Validates:
 * - room-spec.json: SkillModule structure, traditions, safety domains, modules,
 *   ontological bridges (Canoe-as-Artifact vs Canoe-as-Relationship, Qajaq-as-Extension)
 * - safety-config.json: 4 gate rules (cold water shock, structural, tool, 1-10-1 rule)
 * - cultural-config.json: birchbark canoe 7-nation attribution, tobacco offering Level 1/3-4 split,
 *   qajaq and umiak at Level 1
 * - Try Sessions: 3 beginner sessions (first-nations, inuit, cross-tradition), cold water
 *   safetyNote in all sessions, ontological bridge teaching moment in comparing session,
 *   multi-nation attribution in birchbark session, no generic pan-Indigenous language
 * - sumo-mappings.json: 6+ mappings with kifStatements, 2+ bridge references
 *
 * @module heritage-skills-pack/skill-hall/rooms/13-northern-watercraft/room-13.test
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

const birchbarkSession = JSON.parse(
  readFileSync(resolve(roomDir, 'try-sessions/birchbark-canoe-anatomy.json'), 'utf-8'),
);
const qajaqdSession = JSON.parse(
  readFileSync(resolve(roomDir, 'try-sessions/qajaq-frame-geometry.json'), 'utf-8'),
);
const comparingSession = JSON.parse(
  readFileSync(resolve(roomDir, 'try-sessions/comparing-watercraft-designs.json'), 'utf-8'),
);

const allSessions = [birchbarkSession, qajaqdSession, comparingSession];

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Collect all string values from all steps of a session */
function allStepText(session: typeof birchbarkSession): string {
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

describe('Room 13: Northern Watercraft', () => {
  // ── room-spec.json ────────────────────────────────────────────────────────────

  describe('room-spec.json', () => {
    it('should have room number 13', () => {
      expect(roomSpec.room).toBe(13);
      expect(roomSpec.id).toBe('room-13-northern-watercraft');
    });

    it('should have first-nations and inuit traditions', () => {
      expect(roomSpec.traditions).toContain('first-nations');
      expect(roomSpec.traditions).toContain('inuit');
    });

    it('should have tool, structural, and arctic-survival safety domains', () => {
      expect(roomSpec.safetyDomains).toContain('tool');
      expect(roomSpec.safetyDomains).toContain('structural');
      expect(roomSpec.safetyDomains).toContain('arctic-survival');
    });

    it('should have 5+ content modules', () => {
      expect(roomSpec.modules.length).toBeGreaterThanOrEqual(5);
    });

    it('should have at least 2 ontological bridges', () => {
      expect(roomSpec.ontologicalBridges).toBeDefined();
      expect(roomSpec.ontologicalBridges.length).toBeGreaterThanOrEqual(2);
    });

    it('should have birchbark canoe module', () => {
      const birchbarkModule = roomSpec.modules.find(
        (m: { id: string }) => m.id === 'watercraft-13-fn-birchbark-canoe',
      );
      expect(birchbarkModule).toBeDefined();
      expect(birchbarkModule.tradition).toBe('first-nations');
    });

    it('should have qajaq module', () => {
      const qajaqdModule = roomSpec.modules.find(
        (m: { id: string }) => m.id === 'watercraft-13-inuit-qajaq',
      );
      expect(qajaqdModule).toBeDefined();
      expect(qajaqdModule.tradition).toBe('inuit');
    });

    it('should have umiak module', () => {
      const umiakModule = roomSpec.modules.find(
        (m: { id: string }) => m.id === 'watercraft-13-inuit-umiak',
      );
      expect(umiakModule).toBeDefined();
      expect(umiakModule.tradition).toBe('inuit');
    });
  });

  // ── safety-config.json ────────────────────────────────────────────────────────

  describe('safety-config.json', () => {
    it('should have cold water safety gate rule', () => {
      const rule = safetyConfig.gateRules.find(
        (r: { id: string }) => r.id === 'ROOM13-GATE-001',
      );
      expect(rule).toBeDefined();
      expect(rule.description).toMatch(/[Cc]old water/);
      expect(rule.action).toMatch(/GATE/);
    });

    it('should have structural integrity gate rule', () => {
      const rule = safetyConfig.gateRules.find(
        (r: { id: string }) => r.id === 'ROOM13-GATE-002',
      );
      expect(rule).toBeDefined();
      expect(rule.description).toMatch(/[Ss]tructural/);
      expect(rule.action).toMatch(/GATE/);
    });

    it('should have tool safety gate rule', () => {
      const rule = safetyConfig.gateRules.find(
        (r: { id: string }) => r.id === 'ROOM13-GATE-003',
      );
      expect(rule).toBeDefined();
      expect(rule.description).toMatch(/[Tt]ool/);
      expect(rule.action).toMatch(/GATE/);
    });

    it('should have cold water immersion response gate rule', () => {
      const rule = safetyConfig.gateRules.find(
        (r: { id: string }) => r.id === 'ROOM13-GATE-004',
      );
      expect(rule).toBeDefined();
      expect(rule.description).toMatch(/immersion|capsiz/i);
      expect(rule.action).toMatch(/1-10-1/);
    });

    it('should have 4 gate rules total', () => {
      expect(safetyConfig.gateRules.length).toBeGreaterThanOrEqual(4);
    });
  });

  // ── cultural-config.json ──────────────────────────────────────────────────────

  describe('cultural-config.json', () => {
    it('should have birchbark canoe rule with multi-nation attribution', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { id: string }) => r.id === 'ROOM13-CULT-001',
      );
      expect(rule).toBeDefined();
      expect(rule.nationAttribution).toMatch(/Anishinaabe/);
      expect(rule.nationAttribution).toMatch(/Algonquin/);
      expect(rule.nationAttribution).toMatch(/Mi'kmaq/);
    });

    it('should have tobacco offering with Level 1 acknowledged and Level 3-4 ceremonial', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { id: string }) => r.id === 'ROOM13-CULT-002',
      );
      expect(rule).toBeDefined();
      expect(rule.concept).toMatch(/tobacco/i);
      expect(rule.level).toBe(1);
      expect(rule.ceremonialLevel).toBeGreaterThanOrEqual(3);
    });

    it('should have qajaq at Level 1', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { id: string }) => r.id === 'ROOM13-CULT-003',
      );
      expect(rule).toBeDefined();
      expect(rule.level).toBe(1);
      expect(rule.concept).toMatch(/qajaq|kayak/i);
    });

    it('should have umiak at Level 1', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { id: string }) => r.id === 'ROOM13-CULT-004',
      );
      expect(rule).toBeDefined();
      expect(rule.level).toBe(1);
      expect(rule.concept).toMatch(/umiak/i);
    });
  });

  // ── Ontological Bridges ───────────────────────────────────────────────────────

  describe('Ontological Bridges', () => {
    it('should have birchbark canoe bridge (Canoe-as-Artifact vs Canoe-as-Relationship)', () => {
      const bridge = roomSpec.ontologicalBridges.find(
        (b: { id: string }) => b.id === 'bridge-01-birchbark-canoe',
      );
      expect(bridge).toBeDefined();
      expect(bridge.sumoView).toMatch(/WaterVehicle/);
      expect(bridge.indigenousView).toMatch(/spirit|ceremony|togetherness/i);
      expect(bridge.tradition).toBe('first-nations');
    });

    it('should have teaching point about WHAT vs WHAT IT MEANS', () => {
      const bridge = roomSpec.ontologicalBridges.find(
        (b: { id: string }) => b.id === 'bridge-01-birchbark-canoe',
      );
      expect(bridge).toBeDefined();
      expect(bridge.teachingPoint).toMatch(/WHAT something is/);
      expect(bridge.teachingPoint).toMatch(/WHAT something means/);
    });

    it('should have at least 2 bridges total', () => {
      expect(roomSpec.ontologicalBridges.length).toBeGreaterThanOrEqual(2);
    });

    it('should have a second bridge for qajaq', () => {
      const qajaqdBridge = roomSpec.ontologicalBridges.find(
        (b: { id: string }) =>
          b.id === 'bridge-13-qajaq-extension' || b.id.includes('qajaq'),
      );
      expect(qajaqdBridge).toBeDefined();
      expect(qajaqdBridge.tradition).toBe('inuit');
    });
  });

  // ── Try Sessions ──────────────────────────────────────────────────────────────

  describe('Try Sessions', () => {
    it('should have 3 beginner Try Sessions', () => {
      expect(allSessions).toHaveLength(3);
      for (const session of allSessions) {
        expect(session.difficulty).toBe('beginner');
        expect(session.estimatedMinutes).toBeGreaterThanOrEqual(15);
        expect(session.estimatedMinutes).toBeLessThanOrEqual(25);
      }
    });

    it('should cover first-nations, inuit, and cross-tradition', () => {
      const traditions = allSessions.map((s) => s.tradition);
      expect(traditions).toContain('first-nations');
      expect(traditions).toContain('inuit');
      expect(traditions).toContain('cross-tradition');
    });

    it('should have cold water safety safetyNote in birchbark session', () => {
      const coldWaterStep = birchbarkSession.steps.find(
        (s: { safetyNote?: string }) =>
          s.safetyNote?.match(/[Cc]old water|1-10-1|PFD|gasping/i),
      );
      expect(coldWaterStep).toBeDefined();
      expect(coldWaterStep.safetyNote).toMatch(/[Cc]old water/i);
    });

    it('should have cold water safety safetyNote in qajaq session', () => {
      // The 1-10-1 rule must appear somewhere in the qajaq session steps
      const stepWith110 = qajaqdSession.steps.find(
        (s: { safetyNote?: string }) => s.safetyNote?.match(/1-10-1/),
      );
      expect(stepWith110).toBeDefined();
      expect(stepWith110.safetyNote).toMatch(/1-10-1/);
    });

    it('should have ontological bridge teaching moment in comparing session', () => {
      const bridgeStep = comparingSession.steps.find(
        (s: { culturalContext?: string }) =>
          s.culturalContext?.match(/WHAT something is.*WHAT something means|Both descriptions are true/i),
      );
      expect(bridgeStep).toBeDefined();
      expect(bridgeStep.culturalContext).toMatch(/WHAT something is/);
      expect(bridgeStep.culturalContext).toMatch(/WHAT something means/);
    });

    it('should have multi-nation attribution in birchbark canoe session', () => {
      const allBirchText = allStepText(birchbarkSession);
      expect(allBirchText).toMatch(/Anishinaabe/);
      expect(allBirchText).toMatch(/Algonquin/);
      expect(allBirchText).toMatch(/Mi'kmaq/);
    });

    it('should have Inuit attribution in qajaq session', () => {
      const stepsWithInuit = qajaqdSession.steps.filter(
        (s: { nationAttribution?: string }) => s.nationAttribution === 'Inuit',
      );
      expect(stepsWithInuit.length).toBeGreaterThan(0);
    });

    it('should not contain generic "Native American" or "Indigenous peoples" without nation name', () => {
      const allText = allSessionText();
      const hasNativeAmericanGeneric = /\bNative American\b/.test(allText);
      const hasIndigenousPeoplesGeneric = /\bIndigenous peoples\b/.test(allText);
      expect(hasNativeAmericanGeneric).toBe(false);
      expect(hasIndigenousPeoplesGeneric).toBe(false);
    });

    it('birchbark session should reference tobacco offering', () => {
      const tobaccoStep = birchbarkSession.steps.find(
        (s: { culturalContext?: string; instruction?: string }) =>
          (s.culturalContext && /tobacco/i.test(s.culturalContext)) ||
          (s.instruction && /tobacco/i.test(s.instruction)),
      );
      expect(tobaccoStep).toBeDefined();
    });

    it('comparing session should reference both canoe and qajaq ontological tensions', () => {
      const allComparingText = allStepText(comparingSession);
      // Canoe bridge
      expect(allComparingText).toMatch(/WaterVehicle.*Artifact|Artifact.*WaterVehicle/i);
      // Qajaq bridge
      expect(allComparingText).toMatch(/qajaq|extension/i);
    });
  });

  // ── sumo-mappings.json ────────────────────────────────────────────────────────

  describe('sumo-mappings.json', () => {
    it('should have 6+ SUMO mappings', () => {
      expect(sumoMappings.length).toBeGreaterThanOrEqual(6);
    });

    it('should reference birchbark canoe ontological bridge', () => {
      const bridgeMappings = sumoMappings.filter(
        (m: { ontologicalBridge?: string }) =>
          m.ontologicalBridge === 'bridge-01-birchbark-canoe',
      );
      expect(bridgeMappings.length).toBeGreaterThan(0);
    });

    it('should have at least 2 mappings with ontological bridge references', () => {
      const bridgeMappings = sumoMappings.filter(
        (m: { ontologicalBridge?: string | null }) =>
          m.ontologicalBridge !== null && m.ontologicalBridge !== undefined,
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

    it('should have WaterVehicle SUMO term in at least one mapping', () => {
      const waterVehicleMappings = sumoMappings.filter(
        (m: { sumoTerm: string }) => m.sumoTerm === 'WaterVehicle',
      );
      expect(waterVehicleMappings.length).toBeGreaterThan(0);
    });

    it('should have HeritageSkill SUMO term in at least one mapping', () => {
      const heritageSkillMappings = sumoMappings.filter(
        (m: { sumoTerm: string; kifStatement: string }) =>
          m.sumoTerm === 'HeritageSkill' || m.kifStatement.includes('HeritageSkill'),
      );
      expect(heritageSkillMappings.length).toBeGreaterThan(0);
    });
  });
});
