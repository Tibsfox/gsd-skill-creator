/**
 * Tests for the SUMO Heritage Domain Ontology and supporting data files.
 *
 * Validates:
 * - Heritage.kif SUO-KIF syntax and class/relation completeness
 * - sumo-mappings.json structural correctness and 14-room coverage
 * - wordnet-bridges.json structural correctness and vocabulary coverage
 * - ontological-bridges.json structural correctness and required tension points
 * - Cross-file consistency (bridge IDs, room numbering)
 *
 * @module heritage-skills-pack/shared/sumo/sumo.test
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SUMO_FILE_TO_ROOMS } from '../constants.js';
import type { SUMOMapping, WordNetBridge, OntologicalBridge } from '../types.js';

// ─── File Loading ──────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const sumoDir = __dirname;

const kifContent = readFileSync(resolve(sumoDir, 'heritage-domain-ontology.kif'), 'utf-8');
const sumoMappings: SUMOMapping[] = JSON.parse(
  readFileSync(resolve(sumoDir, 'sumo-mappings.json'), 'utf-8'),
);
const wordnetBridges: WordNetBridge[] = JSON.parse(
  readFileSync(resolve(sumoDir, 'wordnet-bridges.json'), 'utf-8'),
);
const ontologicalBridges: OntologicalBridge[] = JSON.parse(
  readFileSync(resolve(sumoDir, 'ontological-bridges.json'), 'utf-8'),
);

// ─── Constants ─────────────────────────────────────────────────────────────────

const REQUIRED_CLASSES = [
  'HeritageSkill',
  'TraditionalProcess',
  'CulturalPractice',
  'IndigenousKnowledgeSystem',
  'KnowledgeKeeper',
  'MaterialCulture',
  'SeasonalRound',
  'OralTradition',
  'HeritageDocument',
  'CommunityProtocol',
];

const REQUIRED_RELATIONS = [
  'transmitsKnowledge',
  'governedBy',
  'seasonOf',
  'materialFrom',
];

const KNOWN_SUMO_FILES = new Set(Object.keys(SUMO_FILE_TO_ROOMS));

const VALID_MAPPING_TYPES = new Set(['instance', 'subclass', 'equivalent', 'related']);

const VALID_TRADITIONS = new Set([
  'appalachian',
  'first-nations',
  'inuit',
  'cross-tradition',
]);

// ─── Heritage.kif Tests ────────────────────────────────────────────────────────

describe('SUMO Heritage Domain Ontology', () => {
  describe('Heritage.kif', () => {
    it('should define all 10 required classes as subclass statements', () => {
      for (const cls of REQUIRED_CLASSES) {
        expect(
          kifContent.includes(`(subclass ${cls}`),
          `Expected (subclass ${cls} ...) statement in Heritage.kif`,
        ).toBe(true);
      }
    });

    it('should have documentation for every class', () => {
      for (const cls of REQUIRED_CLASSES) {
        expect(
          kifContent.includes(`(documentation ${cls} EnglishLanguage`),
          `Expected (documentation ${cls} EnglishLanguage ...) in Heritage.kif`,
        ).toBe(true);
      }
    });

    it('should define all 4 required relations', () => {
      for (const rel of REQUIRED_RELATIONS) {
        expect(
          kifContent.includes(rel),
          `Expected relation '${rel}' to appear in Heritage.kif`,
        ).toBe(true);
      }
    });

    it('should have domain/range constraints for all relations', () => {
      for (const rel of REQUIRED_RELATIONS) {
        expect(
          kifContent.includes(`(domain ${rel}`),
          `Expected (domain ${rel} ...) constraint in Heritage.kif`,
        ).toBe(true);
        expect(
          kifContent.includes(`(range ${rel}`),
          `Expected (range ${rel} ...) constraint in Heritage.kif`,
        ).toBe(true);
      }
    });

    it('should have documentation for every relation', () => {
      for (const rel of REQUIRED_RELATIONS) {
        expect(
          kifContent.includes(`(documentation ${rel} EnglishLanguage`),
          `Expected (documentation ${rel} EnglishLanguage ...) in Heritage.kif`,
        ).toBe(true);
      }
    });

    it('should reference Merge.kif or MILO parent classes', () => {
      // SUMO parent classes: IntentionalProcess, SocialInteraction, Proposition,
      // Human, Artifact, TimeInterval, LinguisticExpression, Text, NormativeAttribute
      const expectedParents = [
        'IntentionalProcess',
        'SocialInteraction',
        'Proposition',
        'Human',
        'Artifact',
        'TimeInterval',
        'LinguisticExpression',
        'Text',
        'NormativeAttribute',
      ];
      for (const parent of expectedParents) {
        expect(
          kifContent.includes(parent),
          `Expected parent class '${parent}' to appear in Heritage.kif`,
        ).toBe(true);
      }
    });

    it('should use valid SUO-KIF parenthetical syntax', () => {
      // Every statement in KIF should be wrapped in parentheses.
      // Count opening and closing parentheses — they must balance.
      let depth = 0;
      let maxDepth = 0;
      for (const ch of kifContent) {
        if (ch === '(') { depth++; maxDepth = Math.max(maxDepth, depth); }
        if (ch === ')') { depth--; }
      }
      expect(depth, 'Parentheses must be balanced in Heritage.kif').toBe(0);
      expect(maxDepth, 'KIF statements should be nested at least 2 levels deep').toBeGreaterThan(1);
    });
  });

  // ─── sumo-mappings.json Tests ────────────────────────────────────────────────

  describe('sumo-mappings.json', () => {
    it('should contain entries for all 14 rooms', () => {
      const roomNumbers = new Set(
        sumoMappings
          .map(e => e.heritageConceptId.match(/room-(\d+)/)?.[1])
          .filter((n): n is string => n !== undefined)
          .map(Number),
      );
      for (let r = 1; r <= 14; r++) {
        expect(roomNumbers.has(r), `Room ${r} missing from sumo-mappings.json`).toBe(true);
      }
    });

    it('should have valid SUMOMapping structure for every entry', () => {
      for (const entry of sumoMappings) {
        expect(entry.heritageConceptId, `heritageConceptId missing in entry ${JSON.stringify(entry)}`).toBeTruthy();
        expect(entry.sumoTerm, `sumoTerm missing in entry ${entry.heritageConceptId}`).toBeTruthy();
        expect(entry.sumoFile, `sumoFile missing in entry ${entry.heritageConceptId}`).toBeTruthy();
        expect(
          VALID_MAPPING_TYPES.has(entry.mappingType),
          `Invalid mappingType '${entry.mappingType}' in entry ${entry.heritageConceptId}`,
        ).toBe(true);
        expect(entry.kifStatement, `kifStatement missing in entry ${entry.heritageConceptId}`).toBeTruthy();
        expect(entry.naturalLanguage, `naturalLanguage missing in entry ${entry.heritageConceptId}`).toBeTruthy();
      }
    });

    it('should have kifStatement with SUO-KIF syntax for every entry', () => {
      for (const entry of sumoMappings) {
        // A valid KIF statement starts with '(' and ends with ')'
        expect(
          entry.kifStatement.trim().startsWith('('),
          `kifStatement in ${entry.heritageConceptId} should start with '('`,
        ).toBe(true);
        expect(
          entry.kifStatement.trim().endsWith(')'),
          `kifStatement in ${entry.heritageConceptId} should end with ')'`,
        ).toBe(true);
      }
    });

    it('should have naturalLanguage paraphrase for every entry', () => {
      for (const entry of sumoMappings) {
        expect(
          entry.naturalLanguage.trim().length,
          `naturalLanguage should be non-empty in ${entry.heritageConceptId}`,
        ).toBeGreaterThan(0);
      }
    });

    it('should reference valid SUMO files from SUMO_FILE_TO_ROOMS', () => {
      for (const entry of sumoMappings) {
        expect(
          KNOWN_SUMO_FILES.has(entry.sumoFile),
          `Unknown sumoFile '${entry.sumoFile}' in ${entry.heritageConceptId}. Known files: ${[...KNOWN_SUMO_FILES].join(', ')}`,
        ).toBe(true);
      }
    });

    it('should reference valid bridge IDs when ontologicalBridge is set', () => {
      const bridgeIds = new Set(ontologicalBridges.map(b => b.id));
      for (const entry of sumoMappings) {
        if (entry.ontologicalBridge) {
          expect(
            bridgeIds.has(entry.ontologicalBridge),
            `sumo-mappings entry ${entry.heritageConceptId} references unknown bridge '${entry.ontologicalBridge}'`,
          ).toBe(true);
        }
      }
    });
  });

  // ─── wordnet-bridges.json Tests ───────────────────────────────────────────────

  describe('wordnet-bridges.json', () => {
    it('should contain at least 15 heritage vocabulary entries', () => {
      expect(wordnetBridges.length).toBeGreaterThanOrEqual(15);
    });

    it('should have valid WordNetBridge structure for every entry', () => {
      for (const entry of wordnetBridges) {
        expect(entry.word, `word missing in entry ${JSON.stringify(entry)}`).toBeTruthy();
        expect(entry.synsetId, `synsetId missing in entry for word '${entry.word}'`).toBeTruthy();
        expect(entry.sumoTerm, `sumoTerm missing in entry for word '${entry.word}'`).toBeTruthy();
        expect(entry.gloss, `gloss missing in entry for word '${entry.word}'`).toBeTruthy();
      }
    });

    it('should have synsetId for every entry', () => {
      for (const entry of wordnetBridges) {
        expect(
          entry.synsetId.trim().length,
          `synsetId should be non-empty for word '${entry.word}'`,
        ).toBeGreaterThan(0);
      }
    });

    it('should have gloss for every entry', () => {
      for (const entry of wordnetBridges) {
        expect(
          entry.gloss.trim().length,
          `gloss should be non-empty for word '${entry.word}'`,
        ).toBeGreaterThan(0);
      }
    });
  });

  // ─── ontological-bridges.json Tests ───────────────────────────────────────────

  describe('ontological-bridges.json', () => {
    it('should contain at least 5 tension points', () => {
      expect(ontologicalBridges.length).toBeGreaterThanOrEqual(5);
    });

    it('should have valid OntologicalBridge structure for every entry', () => {
      for (const entry of ontologicalBridges) {
        expect(entry.id, `id missing in bridge entry ${JSON.stringify(entry)}`).toBeTruthy();
        expect(entry.title, `title missing in bridge '${entry.id}'`).toBeTruthy();
        expect(entry.sumoView, `sumoView missing in bridge '${entry.id}'`).toBeTruthy();
        expect(entry.indigenousView, `indigenousView missing in bridge '${entry.id}'`).toBeTruthy();
        expect(entry.tradition, `tradition missing in bridge '${entry.id}'`).toBeTruthy();
        expect(entry.teachingPoint, `teachingPoint missing in bridge '${entry.id}'`).toBeTruthy();
      }
    });

    it('should include birchbark canoe bridge', () => {
      const bridge = ontologicalBridges.find(b => b.id === 'bridge-01-birchbark-canoe');
      expect(bridge, 'Expected birchbark canoe bridge (bridge-01-birchbark-canoe) to exist').toBeDefined();
    });

    it('should include food preservation bridge', () => {
      const bridge = ontologicalBridges.find(b => b.id === 'bridge-02-food-preservation');
      expect(bridge, 'Expected food preservation bridge (bridge-02-food-preservation) to exist').toBeDefined();
    });

    it('should include clothing cycle bridge', () => {
      const bridge = ontologicalBridges.find(b => b.id === 'bridge-03-clothing-cycle');
      expect(bridge, 'Expected clothing cycle bridge (bridge-03-clothing-cycle) to exist').toBeDefined();
    });

    it('should include seasonal round bridge', () => {
      const bridge = ontologicalBridges.find(b => b.id === 'bridge-04-seasonal-round');
      expect(bridge, 'Expected seasonal round bridge (bridge-04-seasonal-round) to exist').toBeDefined();
    });

    it('should include community governance bridge', () => {
      const bridge = ontologicalBridges.find(b => b.id === 'bridge-05-community-governance');
      expect(bridge, 'Expected community governance bridge (bridge-05-community-governance) to exist').toBeDefined();
    });

    it('should have non-empty teachingPoint for every bridge', () => {
      for (const entry of ontologicalBridges) {
        expect(
          entry.teachingPoint.trim().length,
          `teachingPoint should be non-empty for bridge '${entry.id}'`,
        ).toBeGreaterThan(0);
      }
    });

    it('should have valid Tradition value for every bridge', () => {
      for (const entry of ontologicalBridges) {
        expect(
          VALID_TRADITIONS.has(entry.tradition),
          `Invalid tradition '${entry.tradition}' in bridge '${entry.id}'. Valid values: ${[...VALID_TRADITIONS].join(', ')}`,
        ).toBe(true);
      }
    });
  });

  // ─── Cross-file Consistency Tests ─────────────────────────────────────────────

  describe('Cross-file consistency', () => {
    it('should have sumo-mappings ontologicalBridge IDs that exist in ontological-bridges', () => {
      const bridgeIds = new Set(ontologicalBridges.map(b => b.id));
      const referencedBridges = sumoMappings
        .filter(m => m.ontologicalBridge && m.ontologicalBridge !== null)
        .map(m => m.ontologicalBridge as string);

      for (const bridgeId of referencedBridges) {
        expect(
          bridgeIds.has(bridgeId),
          `sumo-mappings references bridge '${bridgeId}' which does not exist in ontological-bridges.json`,
        ).toBe(true);
      }
    });

    it('should have sumo-mappings room IDs covering rooms 1-14', () => {
      const coveredRooms = new Set(
        sumoMappings
          .map(e => e.heritageConceptId.match(/room-(\d+)/)?.[1])
          .filter((n): n is string => n !== undefined)
          .map(Number),
      );

      const expectedRooms = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
      for (const roomNum of expectedRooms) {
        expect(
          coveredRooms.has(roomNum),
          `Room ${roomNum} is not covered in sumo-mappings.json`,
        ).toBe(true);
      }
      expect(coveredRooms.size, 'Should cover exactly 14 rooms').toBe(14);
    });
  });
});
