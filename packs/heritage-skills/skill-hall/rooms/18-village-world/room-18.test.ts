/**
 * Tests for Room 18: The Village World (CRITICAL)
 *
 * Validates:
 * - Potlatch presented as social technology (Level 1), NOT ceremony (Level 3-4)
 * - Criminalization history 1884-1951 as integral context
 * - Nation-specific attribution throughout (no pan-Indigenous language)
 * - Neighbors Path: all 6 badge tiers available via Room 18
 * - Making Things Right: restoration over punishment framing
 * - Emotional Weather: appropriate for younger learners
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const roomDir = __dirname;

const roomSpec = JSON.parse(readFileSync(resolve(roomDir, 'room-spec.json'), 'utf-8'));
const safetyConfig = JSON.parse(readFileSync(resolve(roomDir, 'safety-config.json'), 'utf-8'));
const culturalConfig = JSON.parse(readFileSync(resolve(roomDir, 'cultural-config.json'), 'utf-8'));
const sumoMappings = JSON.parse(readFileSync(resolve(roomDir, 'sumo-mappings.json'), 'utf-8'));

const neighborSession = JSON.parse(
  readFileSync(resolve(roomDir, 'try-sessions/neighbor-map-intro.json'), 'utf-8'),
);
const potlatchSession = JSON.parse(
  readFileSync(resolve(roomDir, 'try-sessions/potlatch-as-technology.json'), 'utf-8'),
);
const makingRightSession = JSON.parse(
  readFileSync(resolve(roomDir, 'try-sessions/making-things-right.json'), 'utf-8'),
);
const allSessions = [neighborSession, potlatchSession, makingRightSession];

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Collect all string values from all steps of a session */
function allStepText(session: typeof neighborSession): string {
  return session.steps
    .flatMap((s: Record<string, string | undefined>) =>
      [s.instruction, s.culturalContext, s.nationAttribution, s.sumoMapping].filter(Boolean),
    )
    .join('\n');
}

/** Collect all step text across all three sessions */
function allSessionText(): string {
  return allSessions.map(allStepText).join('\n');
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('Room 18: The Village World', () => {
  // ── room-spec.json — Structure ────────────────────────────────────────────────

  describe('room-spec.json — Structure', () => {
    it('should have room number 18', () => {
      expect(roomSpec.room).toBe(18);
    });

    it('should have id room-18-village-world', () => {
      expect(roomSpec.id).toBe('room-18-village-world');
    });

    it('should have first-nations in traditions', () => {
      expect(roomSpec.traditions).toContain('first-nations');
    });

    it('should have empty safetyDomains array', () => {
      expect(Array.isArray(roomSpec.safetyDomains)).toBe(true);
      expect(roomSpec.safetyDomains).toHaveLength(0);
    });

    it('should have exactly 6 modules', () => {
      expect(roomSpec.modules).toHaveLength(6);
    });

    it('should NOT have an ontologicalBridges field', () => {
      expect(roomSpec.ontologicalBridges).toBeUndefined();
    });

    it('should have village-18-potlatch-technology module with culturalLevel 1', () => {
      const mod = roomSpec.modules.find(
        (m: { id: string }) => m.id === 'village-18-potlatch-technology',
      );
      expect(mod).toBeDefined();
      expect(mod.culturalLevel).toBe(1);
    });

    it('should have village-18-neighbor-map module', () => {
      const mod = roomSpec.modules.find((m: { id: string }) => m.id === 'village-18-neighbor-map');
      expect(mod).toBeDefined();
    });

    it('should have village-18-brothers-fight module', () => {
      const mod = roomSpec.modules.find(
        (m: { id: string }) => m.id === 'village-18-brothers-fight',
      );
      expect(mod).toBeDefined();
    });

    it('should have village-18-emotional-weather module', () => {
      const mod = roomSpec.modules.find(
        (m: { id: string }) => m.id === 'village-18-emotional-weather',
      );
      expect(mod).toBeDefined();
    });

    it('should have village-18-making-right module', () => {
      const mod = roomSpec.modules.find((m: { id: string }) => m.id === 'village-18-making-right');
      expect(mod).toBeDefined();
    });

    it('should have 1884 in room description', () => {
      expect(roomSpec.description).toContain('1884');
    });

    it('should have 1951 in room description', () => {
      expect(roomSpec.description).toContain('1951');
    });

    it('should have 1922 in room description', () => {
      expect(roomSpec.description).toContain('1922');
    });
  });

  // ── room-spec.json — Critical Framing ────────────────────────────────────────

  describe('room-spec.json — Critical Framing', () => {
    it('should NOT describe ceremony protocols in potlatch module description', () => {
      const mod = roomSpec.modules.find(
        (m: { id: string }) => m.id === 'village-18-potlatch-technology',
      );
      expect(mod).toBeDefined();
      // The potlatch module description may acknowledge that Level 3-4 content is NOT reproduced,
      // but should not contain actual ceremony protocol content
      const desc: string = mod.description;
      // The description should note that ceremony protocols are NOT covered (which is fine)
      // but should not describe what to do or say at a specific potlatch
      expect(desc).not.toMatch(/specific songs performed for specific occasions.*regalia.*specific ranking/i);
    });

    it('should describe gift economy technology in potlatch module', () => {
      const mod = roomSpec.modules.find(
        (m: { id: string }) => m.id === 'village-18-potlatch-technology',
      );
      expect(mod).toBeDefined();
      expect(mod.description).toMatch(/gift economy|reciprocal|redistribution/i);
    });

    it('should include criminalization history in potlatch module description', () => {
      const mod = roomSpec.modules.find(
        (m: { id: string }) => m.id === 'village-18-potlatch-technology',
      );
      expect(mod).toBeDefined();
      expect(mod.description).toMatch(/1884|1922|ban/i);
    });

    it('should mention compensation protocols in brothers-fight module', () => {
      const mod = roomSpec.modules.find(
        (m: { id: string }) => m.id === 'village-18-brothers-fight',
      );
      expect(mod).toBeDefined();
      expect(mod.description).toMatch(/compensation/i);
    });

    it('should not use generic attribution in brothers-fight module', () => {
      const mod = roomSpec.modules.find(
        (m: { id: string }) => m.id === 'village-18-brothers-fight',
      );
      expect(mod).toBeDefined();
      // Should use specific nations, not "Northwest Coast peoples"
      expect(mod.description).not.toMatch(/Northwest Coast peoples\b/i);
    });

    it('should mention younger learners in emotional-weather module', () => {
      const mod = roomSpec.modules.find(
        (m: { id: string }) => m.id === 'village-18-emotional-weather',
      );
      expect(mod).toBeDefined();
      expect(mod.description).toMatch(/younger learners|younger/i);
    });

    it('should use restoration framing in making-right module', () => {
      const mod = roomSpec.modules.find((m: { id: string }) => m.id === 'village-18-making-right');
      expect(mod).toBeDefined();
      expect(mod.description).toMatch(/restor/i);
    });

    it('should have restoration as primary frame in making-right module (not punishment)', () => {
      const mod = roomSpec.modules.find((m: { id: string }) => m.id === 'village-18-making-right');
      expect(mod).toBeDefined();
      const desc: string = mod.description;
      // restoration should appear more than punishment in the description
      const restorationCount = (desc.match(/restor/gi) || []).length;
      const punishmentCount = (desc.match(/punish/gi) || []).length;
      expect(restorationCount).toBeGreaterThanOrEqual(punishmentCount);
    });
  });

  // ── safety-config.json ────────────────────────────────────────────────────────

  describe('safety-config.json', () => {
    it('should have isCritical false', () => {
      expect(safetyConfig.isCritical).toBe(false);
    });

    it('should have empty gateRules array', () => {
      expect(safetyConfig.gateRules).toHaveLength(0);
    });

    it('should have empty criticalRules array', () => {
      expect(safetyConfig.criticalRules).toHaveLength(0);
    });

    it('should have empty annotateRules array', () => {
      expect(safetyConfig.annotateRules).toHaveLength(0);
    });

    it('should have safetyNotes object', () => {
      expect(safetyConfig.safetyNotes).toBeDefined();
      expect(typeof safetyConfig.safetyNotes).toBe('object');
    });

    it('should have culturalSafety note referencing cultural-config', () => {
      expect(safetyConfig.safetyNotes.culturalSafety).toBeDefined();
      expect(safetyConfig.safetyNotes.culturalSafety).toMatch(/cultural-config|cultural sovereignty/i);
    });
  });

  // ── cultural-config.json ──────────────────────────────────────────────────────

  describe('cultural-config.json', () => {
    it('should have exactly 7 cultural rules', () => {
      expect(culturalConfig.culturalRules).toHaveLength(7);
    });

    it('ROOM18-CULT-001 should be level 1 (potlatch as technology — allowed)', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { id: string }) => r.id === 'ROOM18-CULT-001',
      );
      expect(rule).toBeDefined();
      expect(rule.level).toBe(1);
    });

    it('ROOM18-CULT-001 should have action include', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { id: string }) => r.id === 'ROOM18-CULT-001',
      );
      expect(rule).toBeDefined();
      expect(rule.action).toBe('include');
    });

    it('ROOM18-CULT-002 should be level 3 (potlatch ceremony — restricted)', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { id: string }) => r.id === 'ROOM18-CULT-002',
      );
      expect(rule).toBeDefined();
      expect(rule.level).toBe(3);
    });

    it('ROOM18-CULT-002 should have action acknowledge-and-redirect', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { id: string }) => r.id === 'ROOM18-CULT-002',
      );
      expect(rule).toBeDefined();
      expect(rule.action).toBe('acknowledge-and-redirect');
    });

    it('ROOM18-CULT-003 should be level 1 (criminalization history — integral)', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { id: string }) => r.id === 'ROOM18-CULT-003',
      );
      expect(rule).toBeDefined();
      expect(rule.level).toBe(1);
    });

    it('ROOM18-CULT-003 note should mention 1922 and Alert Bay', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { id: string }) => r.id === 'ROOM18-CULT-003',
      );
      expect(rule).toBeDefined();
      expect(rule.note).toMatch(/1922/);
      expect(rule.note).toMatch(/Alert Bay/);
    });

    it('ROOM18-CULT-003 note should mention regalia surrender', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { id: string }) => r.id === 'ROOM18-CULT-003',
      );
      expect(rule).toBeDefined();
      expect(rule.note).toMatch(/regalia/i);
    });

    it('ROOM18-CULT-005 concept should match emotional weather or natural metaphor', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { id: string }) => r.id === 'ROOM18-CULT-005',
      );
      expect(rule).toBeDefined();
      expect(rule.concept).toMatch(/emotional weather|natural metaphor/i);
    });

    it('ROOM18-CULT-006 should be level 1 with action include', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { id: string }) => r.id === 'ROOM18-CULT-006',
      );
      expect(rule).toBeDefined();
      expect(rule.level).toBe(1);
      expect(rule.action).toBe('include');
    });

    it('ROOM18-CULT-007 concept should match pan-Indigenous or attribution', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { id: string }) => r.id === 'ROOM18-CULT-007',
      );
      expect(rule).toBeDefined();
      expect(rule.concept).toMatch(/pan-Indigenous|attribution/i);
    });
  });

  // ── Try Sessions — Potlatch Safety ────────────────────────────────────────────

  describe('Try Sessions — Potlatch Safety', () => {
    it('should have 8+ steps in potlatch session', () => {
      expect(potlatchSession.steps.length).toBeGreaterThanOrEqual(8);
    });

    it('potlatch session text should contain 1884', () => {
      const text = allStepText(potlatchSession);
      expect(text).toContain('1884');
    });

    it('potlatch session text should contain 1922', () => {
      const text = allStepText(potlatchSession);
      expect(text).toContain('1922');
    });

    it('potlatch session text should contain Alert Bay', () => {
      const text = allStepText(potlatchSession);
      expect(text).toContain('Alert Bay');
    });

    it('potlatch session text should contain Cape Mudge', () => {
      const text = allStepText(potlatchSession);
      expect(text).toContain('Cape Mudge');
    });

    it('potlatch session step 1 culturalContext should distinguish social technology from ceremony', () => {
      const step1 = potlatchSession.steps.find((s: { order: number }) => s.order === 1);
      expect(step1).toBeDefined();
      expect(step1.culturalContext).toMatch(/social technology|technology/i);
      expect(step1.culturalContext).toMatch(/ceremony|ceremonial/i);
    });

    it("potlatch session text should contain Kwakwaka'wakw", () => {
      const text = allStepText(potlatchSession);
      expect(text).toMatch(/Kwakwaka'wakw|Kwakwak/);
    });

    it('potlatch session text should NOT describe ceremony protocols or specific songs', () => {
      const text = allStepText(potlatchSession);
      // The session should NOT reproduce specific ceremony protocols
      expect(text).not.toMatch(/ceremony protocol|specific song.*performed|regalia meaning/i);
    });
  });

  // ── Try Sessions — Attribution and Language ───────────────────────────────────

  describe('Try Sessions — Attribution and Language', () => {
    it("all session text should contain Kwakwaka'wakw or Kwakwak", () => {
      const text = allSessionText();
      expect(text).toMatch(/Kwakwaka'wakw|Kwakwak/);
    });

    it('all session text should contain Lummi', () => {
      const text = allSessionText();
      expect(text).toContain('Lummi');
    });

    it("all session text should contain Coast Salish or Stó:lō", () => {
      const text = allSessionText();
      expect(text).toMatch(/Coast Salish|Stó:lō|Stó/);
    });

    it('making-right session should contain restor', () => {
      const text = allStepText(makingRightSession);
      expect(text).toMatch(/restor/i);
    });

    it('making-right session should contain brothers or fight', () => {
      const text = allStepText(makingRightSession);
      expect(text).toMatch(/brothers|fight/i);
    });

    it('neighbor session should contain marriage or trade', () => {
      const text = allStepText(neighborSession);
      expect(text).toMatch(/marriage|trade/i);
    });

    it('no session text should match generic Native American label', () => {
      const text = allSessionText();
      expect(text).not.toMatch(/\bNative American\b/);
    });

    it('no session text should match generic Indigenous peoples label', () => {
      const text = allSessionText();
      expect(text).not.toMatch(/\bIndigenous peoples\b/);
    });

    it('no session text should use Northwest Coast peoples as blanket attribution', () => {
      const text = allSessionText();
      expect(text).not.toMatch(/Northwest Coast peoples\b/);
    });

    it('neighbor session should contain WSÁNEĆ or Saanich', () => {
      const text = allStepText(neighborSession);
      expect(text).toMatch(/WSÁNEĆ|Saanich/);
    });

    it('potlatch session should contain Heiltsuk', () => {
      const text = allStepText(potlatchSession);
      expect(text).toContain('Heiltsuk');
    });

    it('making-right session should contain restoration as repair concept', () => {
      const text = allStepText(makingRightSession);
      expect(text).toMatch(/repair.*relationship|relationship.*repair/i);
    });
  });

  // ── sumo-mappings.json ────────────────────────────────────────────────────────

  describe('sumo-mappings.json', () => {
    it('should have 8+ SUMO mappings', () => {
      expect(sumoMappings.length).toBeGreaterThanOrEqual(8);
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

    it('should have at least one mapping with SocialInteraction', () => {
      const matches = sumoMappings.filter(
        (m: { sumoTerm: string; kifStatement: string }) =>
          m.sumoTerm === 'SocialInteraction' || m.kifStatement.includes('SocialInteraction'),
      );
      expect(matches.length).toBeGreaterThan(0);
    });

    it('should have at least one mapping with HeritageSkill', () => {
      const matches = sumoMappings.filter(
        (m: { sumoTerm: string; kifStatement: string }) =>
          m.sumoTerm === 'HeritageSkill' || m.kifStatement.includes('HeritageSkill'),
      );
      expect(matches.length).toBeGreaterThan(0);
    });

    it('should have at least one mapping with IntentionalProcess', () => {
      const matches = sumoMappings.filter(
        (m: { sumoTerm: string; kifStatement: string }) =>
          m.sumoTerm === 'IntentionalProcess' || m.kifStatement.includes('IntentionalProcess'),
      );
      expect(matches.length).toBeGreaterThan(0);
    });

    it('should have all mappings with room-18- heritageConceptId prefix', () => {
      for (const mapping of sumoMappings) {
        expect(mapping.heritageConceptId).toMatch(/^room-18-/);
      }
    });
  });

  // ── Cross-file Consistency ────────────────────────────────────────────────────

  describe('Cross-file Consistency', () => {
    it('room number should be 18 in both room-spec.json and safety-config.json', () => {
      expect(roomSpec.room).toBe(18);
      expect(safetyConfig.room).toBe(18);
    });

    it('roomId should match in cultural-config.json', () => {
      expect(culturalConfig.roomId).toBe('room-18-village-world');
    });

    it('all 3 try session IDs listed in room-spec should match actual session IDs', () => {
      const specIds: string[] = roomSpec.trySessions;
      expect(specIds).toContain(neighborSession.id);
      expect(specIds).toContain(potlatchSession.id);
      expect(specIds).toContain(makingRightSession.id);
    });

    it('all modules should have safetyLevel standard', () => {
      for (const mod of roomSpec.modules) {
        expect(mod.safetyLevel).toBe('standard');
      }
    });

    it('all modules should have culturalLevel 1', () => {
      for (const mod of roomSpec.modules) {
        expect(mod.culturalLevel).toBe(1);
      }
    });

    it('all sessions should have tradition first-nations', () => {
      for (const session of allSessions) {
        expect(session.tradition).toBe('first-nations');
      }
    });

    it('all sessions should have difficulty beginner', () => {
      for (const session of allSessions) {
        expect(session.difficulty).toBe('beginner');
      }
    });

    it('all sessions should have safetyLevel standard', () => {
      for (const session of allSessions) {
        expect(session.safetyLevel).toBe('standard');
      }
    });

    it('all sessions should have culturalLevel 1', () => {
      for (const session of allSessions) {
        expect(session.culturalLevel).toBe(1);
      }
    });
  });
});
