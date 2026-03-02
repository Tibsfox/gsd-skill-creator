/**
 * Tests for Room 14: Arctic Living
 *
 * Coverage:
 * - room-spec.json: structure, traditions, safety domains, modules, bridges
 * - safety-config.json: critical rules (CO, hypothermia), gate rules (ice, frostbite, qulliq, tools)
 * - cultural-config.json: IQ principles, Level 2 hunting practices, Dene attribution
 * - Try Sessions: 4 beginner sessions with CO warnings, hypothermia awareness, Pilimmaksarniq/Pijitsirniq
 * - sumo-mappings.json: 6+ mappings, ConstructionProcess for igloo, HeritageSkill for caribou clothing
 * - Safety invariants: no generic "Native American" or "Indigenous peoples" without nation name
 *
 * @module heritage-skills-pack/skill-hall/rooms/14-arctic-living/room-14.test
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// ─── Load fixtures ────────────────────────────────────────────────────────────

const ROOM_DIR = join(import.meta.dirname, '.');
const TRY_DIR = join(ROOM_DIR, 'try-sessions');

function loadJson(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

const roomSpec = loadJson(join(ROOM_DIR, 'room-spec.json')) as Record<string, unknown>;
const safetyConfig = loadJson(join(ROOM_DIR, 'safety-config.json')) as Record<string, unknown>;
const culturalConfig = loadJson(join(ROOM_DIR, 'cultural-config.json')) as Record<string, unknown>;
const sumoMappings = loadJson(join(ROOM_DIR, 'sumo-mappings.json')) as unknown[];

const iglooSession = loadJson(join(TRY_DIR, 'igloo-block-cutting-geometry.json')) as Record<
  string,
  unknown
>;
const caribouSession = loadJson(join(TRY_DIR, 'caribou-hair-properties.json')) as Record<
  string,
  unknown
>;
const qulliqSession = loadJson(join(TRY_DIR, 'qulliq-lamp-operation.json')) as Record<
  string,
  unknown
>;
const stitchSession = loadJson(join(TRY_DIR, 'waterproof-stitch-technique.json')) as Record<
  string,
  unknown
>;

type SessionStep = {
  order: number;
  instruction: string;
  safetyNote?: string;
  culturalContext?: string;
  nationAttribution?: string;
  sumoMapping?: string;
};

type TrySession = {
  id: string;
  title: string;
  tradition: string;
  difficulty: string;
  estimatedMinutes: number;
  steps: SessionStep[];
  sumoProcessClass: string;
};

type ContentModule = {
  id: string;
  description: string;
  culturalLevel: number;
};

type CulturalRule = {
  id: string;
  concept: string;
  level: number;
  action: string;
  iqPrinciples?: string[];
  nationAttribution?: string;
};

type SafetyRule = {
  id: string;
  description: string;
  trigger?: string;
  action?: string;
};

type SUMOMapping = {
  heritageConceptId: string;
  sumoTerm: string;
  kifStatement: string;
  ontologicalBridge: string | null;
};

// ─── room-spec.json tests ─────────────────────────────────────────────────────

describe('Room 14: Arctic Living', () => {
  describe('room-spec.json', () => {
    it('should have room number 14', () => {
      expect(roomSpec['room']).toBe(14);
    });

    it('should have id room-14-arctic-living', () => {
      expect(roomSpec['id']).toBe('room-14-arctic-living');
    });

    it('should have inuit and first-nations traditions', () => {
      const traditions = roomSpec['traditions'] as string[];
      expect(traditions).toContain('inuit');
      expect(traditions).toContain('first-nations');
    });

    it('should have arctic-survival, tool, and fire safety domains', () => {
      const domains = roomSpec['safetyDomains'] as string[];
      expect(domains).toContain('arctic-survival');
      expect(domains).toContain('tool');
      expect(domains).toContain('fire');
    });

    it('should have 6+ content modules', () => {
      const modules = roomSpec['modules'] as ContentModule[];
      expect(modules.length).toBeGreaterThanOrEqual(6);
    });

    it('should have caribou clothing module referencing Pilimmaksarniq', () => {
      const modules = roomSpec['modules'] as ContentModule[];
      const caribouModule = modules.find((m) => m.id === 'arctic-14-caribou-clothing');
      expect(caribouModule).toBeDefined();
      expect(caribouModule?.description).toMatch(/Pilimmaks/i);
    });

    it('should have Dene cross-reference module', () => {
      const modules = roomSpec['modules'] as ContentModule[];
      const deneModule = modules.find((m) => m.id === 'arctic-14-dene-cross-reference');
      expect(deneModule).toBeDefined();
      expect(deneModule?.description).toMatch(/[Dd]ene/);
    });

    it('should have ontological bridge for caribou clothing cycle', () => {
      const bridges = roomSpec['ontologicalBridges'] as Array<{ id: string }>;
      expect(bridges).toBeDefined();
      expect(bridges.length).toBeGreaterThanOrEqual(1);
      const clothingBridge = bridges.find((b) => b.id === 'bridge-03-clothing-cycle');
      expect(clothingBridge).toBeDefined();
    });

    it('should have Geography.kif in sumoFile array', () => {
      const sumoFile = roomSpec['sumoFile'] as string[];
      expect(sumoFile).toContain('Geography.kif');
    });

    it('should not contain generic Indigenous peoples without nation name in modules', () => {
      const modules = roomSpec['modules'] as ContentModule[];
      const allDescriptions = modules.map((m) => m.description).join(' ');
      expect(allDescriptions).not.toMatch(/\bNative American\b/);
      expect(allDescriptions).not.toMatch(/\bIndigenous peoples\b(?![\s\S]*(?:Inuit|Dene|First Nations))/i);
    });
  });

  // ─── safety-config.json tests ───────────────────────────────────────────────

  describe('safety-config.json', () => {
    it('should be marked as isCritical', () => {
      expect(safetyConfig['isCritical']).toBe(true);
    });

    it('should have roomId room-14-arctic-living', () => {
      expect(safetyConfig['roomId']).toBe('room-14-arctic-living');
    });

    it('should have arctic-survival, tool, and fire as primary safety domains', () => {
      const domains = safetyConfig['primarySafetyDomains'] as string[];
      expect(domains).toContain('arctic-survival');
      expect(domains).toContain('tool');
      expect(domains).toContain('fire');
    });

    it('should have CRITICAL CO warning rule for enclosed shelters', () => {
      const criticalRules = safetyConfig['criticalRules'] as SafetyRule[];
      const coRule = criticalRules.find((r) => r.id === 'ROOM14-CRIT-001');
      expect(coRule).toBeDefined();
      expect(coRule?.description).toMatch(/CO/);
      expect(coRule?.description).toMatch(/enclosed/i);
    });

    it('should have CRITICAL hypothermia rule for cold exposure', () => {
      const criticalRules = safetyConfig['criticalRules'] as SafetyRule[];
      const hypothermiaRule = criticalRules.find((r) => r.id === 'ROOM14-CRIT-002');
      expect(hypothermiaRule).toBeDefined();
      expect(hypothermiaRule?.description).toMatch(/[Hh]ypothermia/);
    });

    it('should have 2+ critical rules', () => {
      const criticalRules = safetyConfig['criticalRules'] as SafetyRule[];
      expect(criticalRules.length).toBeGreaterThanOrEqual(2);
    });

    it('should have ice thickness gate rule', () => {
      const gateRules = safetyConfig['gateRules'] as SafetyRule[];
      const iceRule = gateRules.find((r) => r.id === 'ROOM14-GATE-001');
      expect(iceRule).toBeDefined();
      expect(iceRule?.description).toMatch(/ice/i);
      expect(iceRule?.action).toMatch(/thickness/i);
    });

    it('should have frostbite prevention gate rule', () => {
      const gateRules = safetyConfig['gateRules'] as SafetyRule[];
      const frostbiteRule = gateRules.find((r) => r.id === 'ROOM14-GATE-002');
      expect(frostbiteRule).toBeDefined();
      expect(frostbiteRule?.description).toMatch(/[Ff]rostbite/);
    });

    it('should have qulliq fire+CO gate rule', () => {
      const gateRules = safetyConfig['gateRules'] as SafetyRule[];
      const qulliqRule = gateRules.find((r) => r.id === 'ROOM14-GATE-003');
      expect(qulliqRule).toBeDefined();
      expect(qulliqRule?.description).toMatch(/[Qq]ulliq/);
      expect(qulliqRule?.description).toMatch(/CO|fire/);
    });

    it('should have 3+ gate rules', () => {
      const gateRules = safetyConfig['gateRules'] as SafetyRule[];
      expect(gateRules.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ─── cultural-config.json tests ────────────────────────────────────────────

  describe('cultural-config.json', () => {
    it('should have IQ principles referenced for caribou clothing', () => {
      const rules = culturalConfig['culturalRules'] as CulturalRule[];
      const caribouRule = rules.find((r) => r.concept === 'caribou clothing cycle');
      expect(caribouRule).toBeDefined();
      expect(caribouRule?.iqPrinciples).toContain('Pilimmaksarniq');
      expect(caribouRule?.iqPrinciples).toContain('Pijitsirniq');
    });

    it('should have hunting spiritual practices at Level 2 with summarize-and-refer', () => {
      const rules = culturalConfig['culturalRules'] as CulturalRule[];
      const huntingRule = rules.find((r) => r.concept === 'hunting spiritual practices');
      expect(huntingRule).toBeDefined();
      expect(huntingRule?.level).toBe(2);
      expect(huntingRule?.action).toBe('summarize-and-refer');
    });

    it('should have Dene attribution for snowshoe and toboggan', () => {
      const rules = culturalConfig['culturalRules'] as CulturalRule[];
      const deneRule = rules.find((r) => r.nationAttribution === 'Dene');
      expect(deneRule).toBeDefined();
      expect(deneRule?.concept).toMatch(/[Ss]nowshoe|toboggan/i);
    });

    it('should have igloo construction at Level 1', () => {
      const rules = culturalConfig['culturalRules'] as CulturalRule[];
      const iglooRule = rules.find((r) => r.concept === 'igloo construction');
      expect(iglooRule).toBeDefined();
      expect(iglooRule?.level).toBe(1);
      expect(iglooRule?.action).toBe('include');
    });

    it('should have caribou clothing cycle at Level 1', () => {
      const rules = culturalConfig['culturalRules'] as CulturalRule[];
      const caribouRule = rules.find((r) => r.concept === 'caribou clothing cycle');
      expect(caribouRule).toBeDefined();
      expect(caribouRule?.level).toBe(1);
      expect(caribouRule?.action).toBe('include');
    });

    it('should have qulliq knowledge at Level 1', () => {
      const rules = culturalConfig['culturalRules'] as CulturalRule[];
      const qulliqRule = rules.find((r) => r.concept === 'qulliq knowledge');
      expect(qulliqRule).toBeDefined();
      expect(qulliqRule?.level).toBe(1);
    });

    it('should not have any Level 4 sacred content in this room', () => {
      const rules = culturalConfig['culturalRules'] as CulturalRule[];
      const sacredRules = rules.filter((r) => r.level === 4);
      expect(sacredRules.length).toBe(0);
    });
  });

  // ─── Try Sessions tests ─────────────────────────────────────────────────────

  describe('Try Sessions', () => {
    it('should have 4 try session files', () => {
      // If we got here, all 4 sessions loaded successfully
      expect(iglooSession).toBeDefined();
      expect(caribouSession).toBeDefined();
      expect(qulliqSession).toBeDefined();
      expect(stitchSession).toBeDefined();
    });

    it('should have all sessions as beginner difficulty', () => {
      const sessions = [iglooSession, caribouSession, qulliqSession, stitchSession] as TrySession[];
      sessions.forEach((s) => {
        expect(s.difficulty).toBe('beginner');
      });
    });

    it('should have estimatedMinutes between 15 and 25 for all sessions', () => {
      const sessions = [iglooSession, caribouSession, qulliqSession, stitchSession] as TrySession[];
      sessions.forEach((s) => {
        expect(s.estimatedMinutes).toBeGreaterThanOrEqual(15);
        expect(s.estimatedMinutes).toBeLessThanOrEqual(25);
      });
    });

    it('should have CO warning in igloo session ventilation step', () => {
      const steps = iglooSession['steps'] as SessionStep[];
      const ventStep = steps.find(
        (s) =>
          s.instruction?.toLowerCase().includes('ventilat') ||
          s.safetyNote?.toLowerCase().includes('ventilat'),
      );
      expect(ventStep).toBeDefined();
      expect(ventStep?.safetyNote).toMatch(/CO|carbon monoxide/i);
    });

    it('should have CRITICAL keyword in igloo CO safety note', () => {
      const steps = iglooSession['steps'] as SessionStep[];
      const criticalStep = steps.find((s) => s.safetyNote?.includes('CRITICAL'));
      expect(criticalStep).toBeDefined();
      expect(criticalStep?.safetyNote).toMatch(/CO|carbon monoxide/i);
    });

    it('should have CO warning in qulliq session ventilation step', () => {
      const steps = qulliqSession['steps'] as SessionStep[];
      const coStep = steps.find((s) => s.safetyNote?.match(/CO|carbon monoxide/i));
      expect(coStep).toBeDefined();
    });

    it('should have CRITICAL keyword in qulliq CO safety note', () => {
      const steps = qulliqSession['steps'] as SessionStep[];
      const criticalStep = steps.find((s) => s.safetyNote?.includes('CRITICAL'));
      expect(criticalStep).toBeDefined();
      expect(criticalStep?.safetyNote).toMatch(/CO|carbon monoxide|qulliq/i);
    });

    it('should have hypothermia safetyNote in igloo session', () => {
      const steps = iglooSession['steps'] as SessionStep[];
      const hypoStep = steps.find((s) => s.safetyNote?.match(/[Hh]ypothermia/));
      expect(hypoStep).toBeDefined();
    });

    it('should have hypothermia safetyNote in caribou session', () => {
      const steps = caribouSession['steps'] as SessionStep[];
      const hypoStep = steps.find((s) => s.safetyNote?.match(/[Hh]ypothermia/));
      expect(hypoStep).toBeDefined();
    });

    it('should have hypothermia safetyNote in waterproof stitch session', () => {
      const steps = stitchSession['steps'] as SessionStep[];
      const hypoStep = steps.find((s) => s.safetyNote?.match(/[Hh]ypothermia/));
      expect(hypoStep).toBeDefined();
    });

    it('should reference Pilimmaksarniq in caribou session', () => {
      const steps = caribouSession['steps'] as SessionStep[];
      const allText = steps.map((s) => (s.culturalContext ?? '') + (s.instruction ?? '')).join(' ');
      expect(allText).toMatch(/Pilimmaksarniq/);
    });

    it('should reference Pijitsirniq in caribou session', () => {
      const steps = caribouSession['steps'] as SessionStep[];
      const allText = steps.map((s) => (s.culturalContext ?? '') + (s.instruction ?? '')).join(' ');
      expect(allText).toMatch(/Pijitsirniq/);
    });

    it('should have Inuit nationAttribution on Inuit content steps', () => {
      const sessions = [iglooSession, caribouSession, qulliqSession, stitchSession] as TrySession[];
      sessions.forEach((session) => {
        const inuitSteps = (session.steps as SessionStep[]).filter(
          (s) => s.nationAttribution === 'Inuit',
        );
        // Each Inuit session should have at least 2 steps with Inuit attribution
        expect(inuitSteps.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('should not contain generic "Native American" without nation name', () => {
      const sessions = [iglooSession, caribouSession, qulliqSession, stitchSession];
      sessions.forEach((session) => {
        const allText = JSON.stringify(session);
        expect(allText).not.toMatch(/\bNative American\b/);
      });
    });

    it('should not contain generic "Indigenous peoples" without specific nation name', () => {
      const sessions = [iglooSession, caribouSession, qulliqSession, stitchSession];
      sessions.forEach((session) => {
        const allText = JSON.stringify(session);
        // "Indigenous peoples" alone (not followed by nation name) is not acceptable
        // Check that any "Indigenous" usage is contextualized
        const matches = allText.match(/\bIndigenous\b/gi) ?? [];
        // If there are Indigenous references, they should be accompanied by specific nations
        if (matches.length > 0) {
          const hasSpecificNation =
            allText.includes('Inuit') || allText.includes('Dene') || allText.includes('First Nations');
          expect(hasSpecificNation).toBe(true);
        }
      });
    });

    it('should have 5+ steps in igloo session', () => {
      const steps = iglooSession['steps'] as SessionStep[];
      expect(steps.length).toBeGreaterThanOrEqual(5);
    });

    it('should have 5+ steps in caribou session', () => {
      const steps = caribouSession['steps'] as SessionStep[];
      expect(steps.length).toBeGreaterThanOrEqual(5);
    });

    it('should have 5+ steps in qulliq session', () => {
      const steps = qulliqSession['steps'] as SessionStep[];
      expect(steps.length).toBeGreaterThanOrEqual(5);
    });

    it('should have 5+ steps in waterproof stitch session', () => {
      const steps = stitchSession['steps'] as SessionStep[];
      expect(steps.length).toBeGreaterThanOrEqual(5);
    });

    it('should have correct sumoProcessClass for igloo session', () => {
      expect((iglooSession as TrySession).sumoProcessClass).toBe('ConstructionProcess');
    });

    it('should have HeritageSkill sumoProcessClass for caribou session', () => {
      expect((caribouSession as TrySession).sumoProcessClass).toBe('HeritageSkill');
    });

    it('should have all steps in sequential order', () => {
      const sessions = [iglooSession, caribouSession, qulliqSession, stitchSession] as TrySession[];
      sessions.forEach((session) => {
        const orders = (session.steps as SessionStep[]).map((s) => s.order);
        orders.forEach((order, idx) => {
          expect(order).toBe(idx + 1);
        });
      });
    });
  });

  // ─── sumo-mappings.json tests ───────────────────────────────────────────────

  describe('sumo-mappings.json', () => {
    it('should have 6+ SUMO mappings', () => {
      expect(sumoMappings.length).toBeGreaterThanOrEqual(6);
    });

    it('should reference clothing cycle ontological bridge', () => {
      const mappings = sumoMappings as SUMOMapping[];
      const bridgeMapping = mappings.find((m) => m.ontologicalBridge === 'bridge-03-clothing-cycle');
      expect(bridgeMapping).toBeDefined();
    });

    it('should have kifStatement for every mapping', () => {
      const mappings = sumoMappings as SUMOMapping[];
      mappings.forEach((mapping) => {
        expect(mapping.kifStatement).toBeTruthy();
        expect(mapping.kifStatement.length).toBeGreaterThan(10);
      });
    });

    it('should include ConstructionProcess for igloo', () => {
      const mappings = sumoMappings as SUMOMapping[];
      const iglooMapping = mappings.find(
        (m) =>
          m.heritageConceptId.includes('igloo') && m.sumoTerm === 'ConstructionProcess',
      );
      expect(iglooMapping).toBeDefined();
    });

    it('should include HeritageSkill for caribou clothing', () => {
      const mappings = sumoMappings as SUMOMapping[];
      const caribouMapping = mappings.find(
        (m) =>
          m.heritageConceptId.includes('caribou') && m.sumoTerm === 'HeritageSkill',
      );
      expect(caribouMapping).toBeDefined();
    });

    it('should include Shelter for igloo construction', () => {
      const mappings = sumoMappings as SUMOMapping[];
      const shelterMapping = mappings.find(
        (m) => m.heritageConceptId.includes('igloo') && m.sumoTerm === 'Shelter',
      );
      expect(shelterMapping).toBeDefined();
    });

    it('should include qamutik with Vehicle or TransportationDevice', () => {
      const mappings = sumoMappings as SUMOMapping[];
      const qamutikMapping = mappings.find(
        (m) =>
          m.heritageConceptId.includes('qamutik') &&
          (m.sumoTerm === 'Vehicle' || m.sumoTerm === 'TransportationDevice'),
      );
      expect(qamutikMapping).toBeDefined();
    });

    it('should include Dene snowshoe mapping', () => {
      const mappings = sumoMappings as SUMOMapping[];
      const snowshoeMapping = mappings.find((m) => m.heritageConceptId.includes('snowshoe'));
      expect(snowshoeMapping).toBeDefined();
    });

    it('should have valid KIF parentheses balance in all kifStatements', () => {
      const mappings = sumoMappings as SUMOMapping[];
      mappings.forEach((mapping) => {
        const stmt = mapping.kifStatement;
        let depth = 0;
        for (const char of stmt) {
          if (char === '(') depth++;
          if (char === ')') depth--;
          expect(depth).toBeGreaterThanOrEqual(0);
        }
        expect(depth).toBe(0);
      });
    });
  });

  // ─── Cross-file consistency ─────────────────────────────────────────────────

  describe('Cross-file consistency', () => {
    it('should have matching roomId across all config files', () => {
      expect(safetyConfig['roomId']).toBe('room-14-arctic-living');
      expect(culturalConfig['roomId']).toBe('room-14-arctic-living');
    });

    it('should have matching room number across all config files', () => {
      expect(roomSpec['room']).toBe(14);
      expect(safetyConfig['room']).toBe(14);
      expect(culturalConfig['room']).toBe(14);
    });

    it('should have clothing cycle bridge in both room-spec and sumo-mappings', () => {
      const bridges = roomSpec['ontologicalBridges'] as Array<{ id: string }>;
      const hasBridgeInSpec = bridges.some((b) => b.id === 'bridge-03-clothing-cycle');
      const mappings = sumoMappings as SUMOMapping[];
      const hasBridgeInSumo = mappings.some((m) => m.ontologicalBridge === 'bridge-03-clothing-cycle');
      expect(hasBridgeInSpec).toBe(true);
      expect(hasBridgeInSumo).toBe(true);
    });
  });
});
