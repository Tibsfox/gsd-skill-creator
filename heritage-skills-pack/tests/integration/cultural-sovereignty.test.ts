/**
 * Cultural Sovereignty Integration Tests
 *
 * Tests C-CLASS-01 through C-CLASS-06, C-ATTR-01 through C-ATTR-04,
 * C-OCAP-01, C-IQ-01, C-CARE-01, C-NISR-01.
 *
 * All 14 tests are MANDATORY. Any failure blocks deployment.
 *
 * Source: foxfire-heritage-mission-v2--05-test-plan-phase1.md §3
 *
 * CRITICAL API NOTES applied:
 * - classify(content, tradition: Tradition, domain: string) — not (content, str, str)
 * - Level 4 action === 'block' (not 'hard-block')
 * - Northern Ways: free functions loadOCAPFramework(), loadIQPrinciples(), loadCAREPrinciples()
 * - No NorthernWays class — use free function imports
 * - CulturalSovereigntyLevel enum: PUBLICLY_SHARED=1, CONTEXTUALLY_SHARED=2,
 *   COMMUNITY_RESTRICTED=3, SACRED_CEREMONIAL=4
 */

import { createRequire } from 'module';
import { describe, it, expect } from 'vitest';
import { CulturalSovereigntyWarden, type CulturalClassification } from '../../safety/cultural-warden.js';
import { CulturalSovereigntyLevel, Tradition } from '../../shared/types.js';
import {
  loadOCAPFramework,
  loadIQPrinciples,
  loadCAREPrinciples,
} from '../../northern-ways/index.js';
import { getConsentProtocol } from '../../oral-history/index.js';

const require = createRequire(import.meta.url);

// Single shared warden instance for all classification tests.
const warden = new CulturalSovereigntyWarden();

// ─── Knowledge Classification (C-CLASS-01 through C-CLASS-06) ────────────────

describe('Knowledge Classification', () => {
  it('C-CLASS-01: Sun Dance is a Level 4 hard block (action=block, no referralTarget)', () => {
    // domain='sun-dance' in first-nations-protocols.json -> Level 4, action='block'
    const result: CulturalClassification = warden.classify(
      'Describe Sun Dance ceremony details and protocols',
      Tradition.FIRST_NATIONS,
      'sun-dance',
    );
    expect(result.level).toBe(CulturalSovereigntyLevel.SACRED_CEREMONIAL);
    expect(result.action).toBe('block');
    // Level 4 hard block: referralTarget is structurally absent (never set)
    expect(result.referralTarget).toBeUndefined();
  });

  it('C-CLASS-02: Sacred drumming ceremonies are Level 4 hard block (action=block)', () => {
    // domain='sacred-drumming' in first-nations-protocols.json -> Level 4, action='block'
    const result: CulturalClassification = warden.classify(
      'What are the sacred drumming ceremony protocols of the Cree?',
      Tradition.FIRST_NATIONS,
      'sacred-drumming',
    );
    expect(result.level).toBe(CulturalSovereigntyLevel.SACRED_CEREMONIAL);
    expect(result.action).toBe('block');
    expect(result.referralTarget).toBeUndefined();
  });

  it('C-CLASS-03: Sweat lodge protocols are Level 3 community-restricted (acknowledge-and-redirect)', () => {
    // domain='sweat-lodge' in first-nations-protocols.json -> Level 3
    const result: CulturalClassification = warden.classify(
      'Tell me about sweat lodge ceremony practices',
      Tradition.FIRST_NATIONS,
      'sweat-lodge',
    );
    expect(result.level).toBe(CulturalSovereigntyLevel.COMMUNITY_RESTRICTED);
    expect(result.action).toBe('acknowledge-and-redirect');
  });

  it('C-CLASS-04: Wampum design knowledge is Level 2 contextually-shared (summarize-and-refer)', () => {
    // domain='wampum' in first-nations-protocols.json -> Level 2
    const result: CulturalClassification = warden.classify(
      'How is wampum design meaningful to Haudenosaunee people?',
      Tradition.FIRST_NATIONS,
      'wampum',
    );
    expect(result.level).toBe(CulturalSovereigntyLevel.CONTEXTUALLY_SHARED);
    expect(result.action).toBe('summarize-and-refer');
  });

  it('C-CLASS-05: Traditional craft techniques are Level 1 publicly shared (include)', () => {
    // domain='crafts' in first-nations-protocols.json -> Level 1
    const result: CulturalClassification = warden.classify(
      'How is a birchbark canoe constructed?',
      Tradition.FIRST_NATIONS,
      'crafts',
    );
    expect(result.level).toBe(CulturalSovereigntyLevel.PUBLICLY_SHARED);
    expect(result.action).toBe('include');
  });

  it('C-CLASS-06: Sacred medicine content is classified at most restrictive level without throwing', () => {
    // domain='sacred-medicine' -> Level 4 hard block for first-nations
    // Mixed content (healing practices + sacred medicine) should resolve to most restrictive
    const result: CulturalClassification = warden.classify(
      'Tell me about Cherokee medicine and healing practices including sacred plant medicines',
      Tradition.FIRST_NATIONS,
      'sacred-medicine',
    );
    // Verify: returns a valid CulturalClassification (does not throw)
    expect(result).toBeDefined();
    expect(result.level).toBeDefined();
    // Sacred medicine is Level 4 -> most restrictive level returned
    expect(result.level).toBe(CulturalSovereigntyLevel.SACRED_CEREMONIAL);
    expect(result.action).toBe('block');
  });
});

// ─── Attribution Accuracy (C-ATTR-01 through C-ATTR-04) ──────────────────────

describe('Attribution Accuracy', () => {
  it('C-ATTR-01: room-spec.json files contain no unattributed pan-Indigenous generalizations', () => {
    // Scan room-spec.json files from several rooms for pan-Indigenous language
    const roomPaths = [
      '../../skill-hall/rooms/01-building-shelter/room-spec.json',
      '../../skill-hall/rooms/05-food-preservation/room-spec.json',
      '../../skill-hall/rooms/09-plant-knowledge/room-spec.json',
      '../../skill-hall/rooms/13-northern-watercraft/room-spec.json',
      '../../skill-hall/rooms/14-arctic-living/room-spec.json',
    ];

    const panIndigenousPatterns = [
      /Native American tradition/i,
      /Indigenous peoples believed/i,
      /Aboriginal practice/i,
    ];

    for (const roomPath of roomPaths) {
      const spec = require(roomPath) as Record<string, unknown>;
      const json = JSON.stringify(spec);

      for (const pattern of panIndigenousPatterns) {
        expect(
          pattern.test(json),
          `Room ${roomPath} contains unattributed pan-Indigenous language matching: ${pattern}`,
        ).toBe(false);
      }
    }
  });

  it('C-ATTR-02: birchbark canoe try-session has Anishinaabe or Algonquin nation attribution', () => {
    // Verify nation-specific attribution in the birchbark canoe try session
    const session = require('../../skill-hall/rooms/13-northern-watercraft/try-sessions/birchbark-canoe-anatomy.json') as Record<string, unknown>;
    const json = JSON.stringify(session);

    // Expect Anishinaabe or Algonquin attribution, NOT generic "First Nations canoe"
    const hasNationAttribution = /Anishinaabe|Algonquin|Abenaki|Cree|Mi.?kmaq/i.test(json);
    expect(hasNationAttribution).toBe(true);

    // Must NOT be a generic attribution without nation specifics
    const hasGenericOnly = /^First Nations canoe$/im.test(json);
    expect(hasGenericOnly).toBe(false);
  });

  it('C-ATTR-03: qajaq frame geometry try-session has specific Inuit regional attribution', () => {
    // Verify Inuit regional attribution in the qajaq session
    const session = require('../../skill-hall/rooms/13-northern-watercraft/try-sessions/qajaq-frame-geometry.json') as Record<string, unknown>;
    const json = JSON.stringify(session);

    // Must contain specific Inuit regional attribution
    const hasInuitAttribution = /Inuit|Yup.ik|Nunavut|Nunavik|Kivalliq|Baffin|Inupiaq/i.test(json);
    expect(hasInuitAttribution).toBe(true);
  });

  it('C-ATTR-04: enforceNationAttribution detects pan-Indigenous language violations', () => {
    // Use the warden's attribution enforcement method directly
    // Test with content that contains pan-Indigenous language
    const panIndigenousContent = 'Native American tradition holds that plants were used this way.';
    const check = warden.enforceNationAttribution(panIndigenousContent);
    expect(check.passed).toBe(false);
    expect(check.violations.length).toBeGreaterThan(0);
    expect(check.violations[0]!.issue).toBe('pan-indigenous-language');

    // Test with properly attributed content
    const properContent = 'According to Anishinaabe tradition, these plants were used for food preservation.';
    const properCheck = warden.enforceNationAttribution(properContent);
    expect(properCheck.passed).toBe(true);
    expect(properCheck.violations.length).toBe(0);
  });
});

// ─── Framework Compliance (C-OCAP-01, C-IQ-01, C-CARE-01, C-NISR-01) ─────────

describe('Framework Compliance', () => {
  it('C-OCAP-01: OCAP framework has all 4 principles and OCAP compliance check passes for proper content', () => {
    // Load the OCAP framework via free function (no NorthernWays class)
    const ocap = loadOCAPFramework();

    // Verify all 4 OCAP principles are present
    expect(ocap.principles).toHaveLength(4);
    const principleNames = ocap.principles.map(p => p.name.toLowerCase());
    expect(principleNames.some(n => n.includes('ownership'))).toBe(true);
    expect(principleNames.some(n => n.includes('control'))).toBe(true);
    expect(principleNames.some(n => n.includes('access'))).toBe(true);
    expect(principleNames.some(n => n.includes('possession'))).toBe(true);

    // Verify OCAP compliance check: properly attributed Indigenous content
    const properContent = 'According to community-authorized First Nations knowledge, attributed to the Anishinaabe people.';
    const isCompliant = warden.checkOCAPCompliance(properContent);
    expect(isCompliant).toBe(true);
  });

  it('C-IQ-01: IQ principles include Pilimmaksarniq (IQ-05) and Pijitsirniq (IQ-02)', () => {
    // Load IQ principles via free function
    const iqPrinciples = loadIQPrinciples();

    // Verify exactly 6 principles as per spec
    expect(iqPrinciples).toHaveLength(6);

    // Verify IQ-05 (Pilimmaksarniq) and IQ-02 (Pijitsirniq) are present
    const iq05 = iqPrinciples.find(p => p.id === 'IQ-05');
    expect(iq05).toBeDefined();
    expect(iq05!.name).toMatch(/Pilimmaksarniq/i);

    // IQ-02 is Tunnganarniq (openness), IQ-03 is Pijitsirniq (serving)
    const iq03 = iqPrinciples.find(p => p.id === 'IQ-03');
    expect(iq03).toBeDefined();
    expect(iq03!.name).toMatch(/Pijitsirniq/i);

    // Verify IQ alignment check passes for content with specific IQ principle name
    const iqContent = 'This process reflects Pilimmaksarniq — learning through practice and observation.';
    const isAligned = warden.checkIQAlignment(iqContent);
    expect(isAligned).toBe(true);
  });

  it('C-CARE-01: CARE framework has all 4 principles (Collective Benefit, Authority, Responsibility, Ethics)', () => {
    // Load CARE principles via free function
    const care = loadCAREPrinciples();

    // Verify all 4 CARE principles are present
    expect(care.principles).toHaveLength(4);
    const principleNames = care.principles.map(p => p.name.toLowerCase());
    expect(principleNames.some(n => n.includes('collective benefit') || n.includes('collective'))).toBe(true);
    expect(principleNames.some(n => n.includes('authority') || n.includes('control'))).toBe(true);
    expect(principleNames.some(n => n.includes('responsibility'))).toBe(true);
    expect(principleNames.some(n => n.includes('ethics'))).toBe(true);
  });

  it('C-NISR-01: NISR-compliant consent protocol is structurally complete with required fields', () => {
    // NISR (Nunavut Inuit Societal Right) compliance is encoded in the OCAP framework and
    // the Inuit consent protocol. Verify via the oral history consent protocol.
    const nisrProtocol = getConsentProtocol('nisr-compliant');
    expect(nisrProtocol).toBeDefined();
    expect(nisrProtocol.id).toBe('nisr-compliant');

    // NISR-compliant protocol must have community-level consent fields
    const json = JSON.stringify(nisrProtocol);
    expect(/community|data.?governance|inuit/i.test(json)).toBe(true);

    // Verify the OCAP framework has application guidance for heritage skills pack
    const ocap = loadOCAPFramework();
    expect(ocap.applicationToHeritageSkillsPack).toBeTruthy();
    expect(ocap.applicationToHeritageSkillsPack.length).toBeGreaterThan(20);
  });
});
