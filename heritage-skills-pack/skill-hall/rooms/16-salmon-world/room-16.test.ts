/**
 * Tests for Room 16: Salmon World
 *
 * Validates:
 * - room-spec.json: 7 modules, traditions, safety domains (food/tool/marine),
 *   no ontologicalBridges field, Salmon's Promise as cross-tradition module,
 *   First Salmon Ceremony at culturalLevel 2, reef net with gated safety
 * - safety-config.json: isCritical=false, 4 gate rules (food x2, marine x2),
 *   2 annotate rules, smoking temp 160°F, 1-10-1 rule
 * - cultural-config.json: 5 rules — reef net attributed to Lummi+Saanich,
 *   First Salmon L1/L3 boundary, ROOM16-CULT-004 acknowledge-and-redirect
 * - Try Sessions: 3 beginner sessions, marine+food gates, Lummi/Saanich attribution,
 *   all 5 species named, alder wood, botulism warning, no pan-Indigenous language
 * - sumo-mappings.json: 9 mappings, all have kifStatement, FoodPreservation/Animal/HeritageSkill
 *
 * @module heritage-skills-pack/skill-hall/rooms/16-salmon-world/room-16.test
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

const speciesSession = JSON.parse(
  readFileSync(resolve(roomDir, 'try-sessions/salmon-species-and-runs.json'), 'utf-8'),
);
const reefNetSession = JSON.parse(
  readFileSync(resolve(roomDir, 'try-sessions/reef-net-technology.json'), 'utf-8'),
);
const smokeDrySession = JSON.parse(
  readFileSync(resolve(roomDir, 'try-sessions/smoke-and-dry-safety.json'), 'utf-8'),
);
const allSessions = [speciesSession, reefNetSession, smokeDrySession];

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Collect all string values from all steps of a session */
function allStepText(session: typeof speciesSession): string {
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

describe('Room 16: Salmon World', () => {
  // ── room-spec.json ────────────────────────────────────────────────────────────

  describe('room-spec.json', () => {
    it('should have room number 16 and correct id', () => {
      expect(roomSpec.room).toBe(16);
      expect(roomSpec.id).toBe('room-16-salmon-world');
    });

    it('should include first-nations tradition', () => {
      expect(roomSpec.traditions).toContain('first-nations');
    });

    it('should have food, tool, and marine safety domains', () => {
      expect(roomSpec.safetyDomains).toContain('food');
      expect(roomSpec.safetyDomains).toContain('tool');
      expect(roomSpec.safetyDomains).toContain('marine');
    });

    it('should have exactly 7 modules', () => {
      expect(roomSpec.modules).toHaveLength(7);
    });

    it('should NOT have ontologicalBridges field (standard room)', () => {
      expect(roomSpec.ontologicalBridges).toBeUndefined();
    });

    it('reef-net module should exist with first-nations tradition and gated safety', () => {
      const mod = roomSpec.modules.find((m: { id: string }) => m.id === 'salmon-16-reef-net');
      expect(mod).toBeDefined();
      expect(mod.tradition).toBe('first-nations');
      expect(mod.safetyLevel).toBe('gated');
    });

    it('first-salmon module should exist with culturalLevel 2', () => {
      const mod = roomSpec.modules.find((m: { id: string }) => m.id === 'salmon-16-first-salmon');
      expect(mod).toBeDefined();
      expect(mod.culturalLevel).toBe(2);
    });

    it('smoke-dry module should exist', () => {
      const mod = roomSpec.modules.find((m: { id: string }) => m.id === 'salmon-16-smoke-dry');
      expect(mod).toBeDefined();
      expect(mod.safetyLevel).toBe('gated');
    });

    it("salmon's promise module should exist with cross-tradition", () => {
      const mod = roomSpec.modules.find((m: { id: string }) => m.id === 'salmon-16-promise');
      expect(mod).toBeDefined();
      expect(mod.tradition).toBe('cross-tradition');
    });

    it('all modules should have sumoMappings array with at least 1 entry', () => {
      for (const mod of roomSpec.modules) {
        expect(Array.isArray(mod.sumoMappings)).toBe(true);
        expect(mod.sumoMappings.length).toBeGreaterThanOrEqual(1);
      }
    });

    it("room description should mention Salmon's Promise or return journey", () => {
      expect(roomSpec.description).toMatch(/Salmon['']s Promise|return.{0,30}journey/i);
    });

    it('trySessions should list 3 session IDs', () => {
      expect(roomSpec.trySessions).toHaveLength(3);
    });
  });

  // ── safety-config.json ────────────────────────────────────────────────────────

  describe('safety-config.json', () => {
    it('isCritical should be false', () => {
      expect(safetyConfig.isCritical).toBe(false);
    });

    it('ROOM16-GATE-001 should exist with food gate action and smoking temperatures', () => {
      const rule = safetyConfig.gateRules.find((r: { id: string }) => r.id === 'ROOM16-GATE-001');
      expect(rule).toBeDefined();
      expect(rule.action).toMatch(/160|GATE/);
    });

    it('ROOM16-GATE-001 action should mention 160°F temperature', () => {
      const rule = safetyConfig.gateRules.find((r: { id: string }) => r.id === 'ROOM16-GATE-001');
      expect(rule).toBeDefined();
      expect(rule.action).toMatch(/160/);
    });

    it('ROOM16-GATE-002 should exist with storage safety content', () => {
      const rule = safetyConfig.gateRules.find((r: { id: string }) => r.id === 'ROOM16-GATE-002');
      expect(rule).toBeDefined();
      expect(rule.action).toMatch(/GATE|storage|botulism/i);
    });

    it('ROOM16-GATE-003 should exist with marine gate and PFD/1-10-1 reference', () => {
      const rule = safetyConfig.gateRules.find((r: { id: string }) => r.id === 'ROOM16-GATE-003');
      expect(rule).toBeDefined();
      expect(rule.action).toMatch(/1-10-1|PFD/);
    });

    it('ROOM16-GATE-004 should exist for cold water immersion response', () => {
      const rule = safetyConfig.gateRules.find((r: { id: string }) => r.id === 'ROOM16-GATE-004');
      expect(rule).toBeDefined();
      expect(rule.action).toMatch(/1-10-1|immersion|cold water/i);
    });

    it('should have exactly 2 annotate rules', () => {
      expect(safetyConfig.annotateRules).toHaveLength(2);
    });

    it('ROOM16-ANN-001 should reference knife or filleting', () => {
      const rule = safetyConfig.annotateRules.find(
        (r: { id: string }) => r.id === 'ROOM16-ANN-001',
      );
      expect(rule).toBeDefined();
      expect(rule.action).toMatch(/knife|filleting/i);
    });
  });

  // ── cultural-config.json ──────────────────────────────────────────────────────

  describe('cultural-config.json', () => {
    it('should have exactly 5 cultural rules', () => {
      expect(culturalConfig.culturalRules).toHaveLength(5);
    });

    it('ROOM16-CULT-001 should be level 1 with Lummi in nationAttribution', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { id: string }) => r.id === 'ROOM16-CULT-001',
      );
      expect(rule).toBeDefined();
      expect(rule.level).toBe(1);
      expect(rule.nationAttribution).toMatch(/Lummi/);
    });

    it('ROOM16-CULT-002 should attribute reef net to Lummi AND Saanich', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { id: string }) => r.id === 'ROOM16-CULT-002',
      );
      expect(rule).toBeDefined();
      expect(rule.nationAttribution).toMatch(/Lummi/);
      expect(rule.nationAttribution).toMatch(/Saanich|WSÁNEĆ/);
    });

    it('ROOM16-CULT-002 concept should reference reef net', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { id: string }) => r.id === 'ROOM16-CULT-002',
      );
      expect(rule).toBeDefined();
      expect(rule.concept).toMatch(/reef net/i);
    });

    it('ROOM16-CULT-003 should be level 1 (first salmon general significance)', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { id: string }) => r.id === 'ROOM16-CULT-003',
      );
      expect(rule).toBeDefined();
      expect(rule.level).toBe(1);
    });

    it('ROOM16-CULT-003 should have ceremonialLevel of 3 or higher', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { id: string }) => r.id === 'ROOM16-CULT-003',
      );
      expect(rule).toBeDefined();
      expect(rule.ceremonialLevel).toBeGreaterThanOrEqual(3);
    });

    it('ROOM16-CULT-004 should be level 3 with acknowledge-and-redirect action', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { id: string }) => r.id === 'ROOM16-CULT-004',
      );
      expect(rule).toBeDefined();
      expect(rule.level).toBe(3);
      expect(rule.action).toBe('acknowledge-and-redirect');
    });

    it('ROOM16-CULT-005 should be level 1', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { id: string }) => r.id === 'ROOM16-CULT-005',
      );
      expect(rule).toBeDefined();
      expect(rule.level).toBe(1);
    });
  });

  // ── Try Sessions ──────────────────────────────────────────────────────────────

  describe('Try Sessions', () => {
    it('should have 3 sessions, all difficulty beginner', () => {
      expect(allSessions).toHaveLength(3);
      for (const session of allSessions) {
        expect(session.difficulty).toBe('beginner');
      }
    });

    it('reefNetSession should have safetyLevel gated', () => {
      expect(reefNetSession.safetyLevel).toBe('gated');
    });

    it('smokeDrySession should have safetyLevel gated', () => {
      expect(smokeDrySession.safetyLevel).toBe('gated');
    });

    it('reefNetSession should have a step with 1-10-1 or PFD or GATE in safetyNote', () => {
      const gateStep = reefNetSession.steps.find(
        (s: { safetyNote?: string }) => s.safetyNote?.match(/1-10-1|PFD|GATE/i),
      );
      expect(gateStep).toBeDefined();
    });

    it('smokeDrySession should have a step with 160°F or GATE in safetyNote', () => {
      const gateStep = smokeDrySession.steps.find(
        (s: { safetyNote?: string }) => s.safetyNote?.match(/160|GATE/i),
      );
      expect(gateStep).toBeDefined();
    });

    it('smokeDrySession should warn about botulism or discard or spoilage', () => {
      const warnStep = smokeDrySession.steps.find(
        (s: { safetyNote?: string }) => s.safetyNote?.match(/botulism|discard|spoilage/i),
      );
      expect(warnStep).toBeDefined();
    });

    it('all sessions text should contain Lummi', () => {
      const allText = allSessionText();
      expect(allText).toMatch(/Lummi/);
    });

    it('all sessions text should contain Saanich or WSÁNEĆ', () => {
      const allText = allSessionText();
      expect(allText).toMatch(/Saanich|WSÁNEĆ/);
    });

    it('speciesSession should name all 5 species: Chinook, Sockeye, Coho, Pink, Chum', () => {
      const speciesText = allStepText(speciesSession);
      expect(speciesText).toMatch(/Chinook|King/i);
      expect(speciesText).toMatch(/Sockeye|Red/i);
      expect(speciesText).toMatch(/Coho|Silver/i);
      expect(speciesText).toMatch(/Pink|Humpy/i);
      expect(speciesText).toMatch(/Chum|Dog/i);
    });

    it('should not use "Native American" without nation name in any session', () => {
      const allText = allSessionText();
      expect(/\bNative American\b/.test(allText)).toBe(false);
    });

    it('should not use "Indigenous peoples" without nation name in any session', () => {
      const allText = allSessionText();
      expect(/\bIndigenous peoples\b/.test(allText)).toBe(false);
    });

    it('smokeDrySession should mention alder wood', () => {
      const smokeText = allStepText(smokeDrySession);
      expect(smokeText).toMatch(/alder/i);
    });

    it('reefNetSession steps should reference Lummi and Saanich attribution', () => {
      const reefText = allStepText(reefNetSession);
      expect(reefText).toMatch(/Lummi/);
      expect(reefText).toMatch(/Saanich|WSÁNEĆ/);
    });
  });

  // ── sumo-mappings.json ────────────────────────────────────────────────────────

  describe('sumo-mappings.json', () => {
    it('should have 8 or more SUMO mappings', () => {
      expect(sumoMappings.length).toBeGreaterThanOrEqual(8);
    });

    it('all mappings should have a kifStatement', () => {
      for (const mapping of sumoMappings) {
        expect(mapping.kifStatement).toBeDefined();
        expect(typeof mapping.kifStatement).toBe('string');
        expect(mapping.kifStatement.length).toBeGreaterThan(0);
      }
    });

    it('all mappings should have naturalLanguage', () => {
      for (const mapping of sumoMappings) {
        expect(mapping.naturalLanguage).toBeDefined();
        expect(mapping.naturalLanguage.length).toBeGreaterThan(0);
      }
    });

    it('at least one mapping should have sumoTerm FoodPreservation', () => {
      const fpMappings = sumoMappings.filter(
        (m: { sumoTerm: string }) => m.sumoTerm === 'FoodPreservation',
      );
      expect(fpMappings.length).toBeGreaterThan(0);
    });

    it('at least one mapping should have sumoTerm Animal or kifStatement including Animal', () => {
      const animalMappings = sumoMappings.filter(
        (m: { sumoTerm: string; kifStatement: string }) =>
          m.sumoTerm === 'Animal' || m.kifStatement.includes('Animal'),
      );
      expect(animalMappings.length).toBeGreaterThan(0);
    });

    it('at least one mapping should have sumoTerm HeritageSkill or kifStatement including HeritageSkill', () => {
      const hsMappings = sumoMappings.filter(
        (m: { sumoTerm: string; kifStatement: string }) =>
          m.sumoTerm === 'HeritageSkill' || m.kifStatement.includes('HeritageSkill'),
      );
      expect(hsMappings.length).toBeGreaterThan(0);
    });
  });
});
