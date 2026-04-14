/**
 * Tests for CulturalSovereigntyWarden.
 *
 * Covers:
 * 1. Four-level content classification (include, summarize-and-refer, acknowledge-and-redirect, block)
 * 2. Level 4 hard block -- no referralTarget, no override path
 * 3. Pan-Indigenous language detection (Native American, Indigenous peoples believed, Aboriginal tradition)
 * 4. Nation attribution enforcement (generic vs nation-specific references)
 * 5. OCAP compliance checks
 * 6. IQ alignment checks
 * 7. Redirection target lookup
 *
 * @module heritage-skills-pack/safety/cultural-warden.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CulturalSovereigntyWarden } from './cultural-warden.js';
import { CulturalSovereigntyLevel, Tradition } from '../shared/types.js';

// ─── Test Setup ───────────────────────────────────────────────────────────────

let warden: CulturalSovereigntyWarden;

beforeEach(() => {
  warden = new CulturalSovereigntyWarden();
});

// ─── classify ─────────────────────────────────────────────────────────────────

describe('CulturalSovereigntyWarden', () => {
  describe('classify', () => {
    describe('Level 1 - Publicly Shared', () => {
      it('should return action=include for publicly shared crafts content', () => {
        const result = warden.classify(
          'Traditional basket weaving using ash splints, documented by the Penobscot Nation.',
          Tradition.FIRST_NATIONS,
          'crafts',
        );

        expect(result.action).toBe('include');
        expect(result.level).toBe(CulturalSovereigntyLevel.PUBLICLY_SHARED);
        expect(result.tradition).toBe(Tradition.FIRST_NATIONS);
      });

      it('should return action=include for First Nations history', () => {
        const result = warden.classify(
          'Historical documentation of Haudenosaunee Confederacy governance.',
          Tradition.FIRST_NATIONS,
          'history',
        );

        expect(result.action).toBe('include');
        expect(result.level).toBe(CulturalSovereigntyLevel.PUBLICLY_SHARED);
      });

      it('should return action=include for IQ principles content', () => {
        const result = warden.classify(
          'Inuit Qaujimajatuqangit (IQ) principles guide community decision-making.',
          Tradition.INUIT,
          'iq-principles',
        );

        expect(result.action).toBe('include');
        expect(result.level).toBe(CulturalSovereigntyLevel.PUBLICLY_SHARED);
      });

      it('should return action=include for Inuit traditional crafts', () => {
        const result = warden.classify(
          'Kayak frame construction using traditional Inuit lashing techniques.',
          Tradition.INUIT,
          'crafts',
        );

        expect(result.action).toBe('include');
        expect(result.level).toBe(CulturalSovereigntyLevel.PUBLICLY_SHARED);
      });

      it('should return action=include for cross-tradition general knowledge at Level 1', () => {
        const result = warden.classify(
          'Traditional food preparation methods.',
          Tradition.CROSS_TRADITION,
          'food',
        );

        expect(result.action).toBe('include');
        expect(result.level).toBe(CulturalSovereigntyLevel.PUBLICLY_SHARED);
      });

      it('should include an explanation in the classification result', () => {
        const result = warden.classify(
          'Traditional construction techniques.',
          Tradition.FIRST_NATIONS,
          'crafts',
        );

        expect(result.explanation).toBeTruthy();
        expect(typeof result.explanation).toBe('string');
        expect(result.explanation.length).toBeGreaterThan(0);
      });
    });

    describe('Level 2 - Contextually Shared', () => {
      it('should return action=summarize-and-refer for First Nations governance', () => {
        const result = warden.classify(
          'Haudenosaunee governance structures and clan system overview.',
          Tradition.FIRST_NATIONS,
          'governance',
        );

        expect(result.action).toBe('summarize-and-refer');
        expect(result.level).toBe(CulturalSovereigntyLevel.CONTEXTUALLY_SHARED);
      });

      it('should return a referralTarget for Level 2 content', () => {
        const result = warden.classify(
          'Anishinaabe clan system educational overview.',
          Tradition.FIRST_NATIONS,
          'clans',
        );

        expect(result.action).toBe('summarize-and-refer');
        expect(result.referralTarget).toBeTruthy();
        expect(typeof result.referralTarget).toBe('string');
      });

      it('should return action=summarize-and-refer for Inuit throat singing', () => {
        const result = warden.classify(
          'Katajjaq (throat singing) as practiced by Inuit women.',
          Tradition.INUIT,
          'throat-singing',
        );

        expect(result.action).toBe('summarize-and-refer');
        expect(result.level).toBe(CulturalSovereigntyLevel.CONTEXTUALLY_SHARED);
        expect(result.referralTarget).toBeTruthy();
      });

      it('should return action=summarize-and-refer for Inuit drum dancing', () => {
        const result = warden.classify(
          'Traditional Inuit drum dancing traditions.',
          Tradition.INUIT,
          'drum-dancing',
        );

        expect(result.action).toBe('summarize-and-refer');
        expect(result.level).toBe(CulturalSovereigntyLevel.CONTEXTUALLY_SHARED);
      });

      it('should return action=summarize-and-refer for First Nations language', () => {
        const result = warden.classify(
          'Anishinaabe language revitalization programs.',
          Tradition.FIRST_NATIONS,
          'language',
        );

        expect(result.action).toBe('summarize-and-refer');
        expect(result.referralTarget).toBeTruthy();
      });

      it('should return action=summarize-and-refer for wampum in historical context', () => {
        const result = warden.classify(
          'Wampum belt diplomacy and its role in treaty agreements.',
          Tradition.FIRST_NATIONS,
          'wampum',
        );

        expect(result.action).toBe('summarize-and-refer');
        expect(result.level).toBe(CulturalSovereigntyLevel.CONTEXTUALLY_SHARED);
      });
    });

    describe('Level 3 - Community Restricted', () => {
      it('should return action=acknowledge-and-redirect for sweat lodge content', () => {
        const result = warden.classify(
          'Sweat lodge ceremony protocols.',
          Tradition.FIRST_NATIONS,
          'sweat-lodge',
        );

        expect(result.action).toBe('acknowledge-and-redirect');
        expect(result.level).toBe(CulturalSovereigntyLevel.COMMUNITY_RESTRICTED);
      });

      it('should return a referralTarget for Level 3 content', () => {
        const result = warden.classify(
          'Medicine wheel teachings.',
          Tradition.FIRST_NATIONS,
          'medicine-wheel',
        );

        expect(result.action).toBe('acknowledge-and-redirect');
        expect(result.referralTarget).toBeTruthy();
        expect(typeof result.referralTarget).toBe('string');
      });

      it('should return action=acknowledge-and-redirect for Inuit qulliq ceremony', () => {
        const result = warden.classify(
          'Qulliq lighting ceremony traditions.',
          Tradition.INUIT,
          'qulliq-ceremony',
        );

        expect(result.action).toBe('acknowledge-and-redirect');
        expect(result.level).toBe(CulturalSovereigntyLevel.COMMUNITY_RESTRICTED);
        expect(result.referralTarget).toBeTruthy();
      });

      it('should return action=acknowledge-and-redirect for sacred songs', () => {
        const result = warden.classify(
          'Sacred song protocols and ceremonial music.',
          Tradition.FIRST_NATIONS,
          'sacred-songs',
        );

        expect(result.action).toBe('acknowledge-and-redirect');
        expect(result.level).toBe(CulturalSovereigntyLevel.COMMUNITY_RESTRICTED);
      });

      it('should return action=acknowledge-and-redirect for potlatch', () => {
        const result = warden.classify(
          'Potlatch ceremony overview.',
          Tradition.FIRST_NATIONS,
          'potlatch',
        );

        expect(result.action).toBe('acknowledge-and-redirect');
        expect(result.level).toBe(CulturalSovereigntyLevel.COMMUNITY_RESTRICTED);
      });
    });

    describe('Level 4 - Sacred/Ceremonial', () => {
      it('should return action=block for sacred content (sun dance)', () => {
        const result = warden.classify(
          'Sun Dance ceremony protocols and sacred items.',
          Tradition.FIRST_NATIONS,
          'sun-dance',
        );

        expect(result.action).toBe('block');
        expect(result.level).toBe(CulturalSovereigntyLevel.SACRED_CEREMONIAL);
      });

      it('should NEVER include referralTarget for Level 4 content', () => {
        const result = warden.classify(
          'Sun Dance ceremony details.',
          Tradition.FIRST_NATIONS,
          'sun-dance',
        );

        // Level 4: no override path — referralTarget must be absent
        expect(result.referralTarget).toBeUndefined();
      });

      it('should return action=block for Inuit shamanic practices', () => {
        const result = warden.classify(
          'Angakkuit practices and spiritual ceremonies.',
          Tradition.INUIT,
          'shamanic-practices',
        );

        expect(result.action).toBe('block');
        expect(result.level).toBe(CulturalSovereigntyLevel.SACRED_CEREMONIAL);
      });

      it('should return action=block for Inuit naming ceremonies', () => {
        const result = warden.classify(
          'Inuit atiq (naming) ceremony traditions.',
          Tradition.INUIT,
          'naming-ceremonies',
        );

        expect(result.action).toBe('block');
        expect(result.level).toBe(CulturalSovereigntyLevel.SACRED_CEREMONIAL);
      });

      it('should NEVER include referralTarget for Inuit naming ceremonies', () => {
        const result = warden.classify(
          'Naming ceremony content.',
          Tradition.INUIT,
          'naming-ceremonies',
        );

        expect(result.referralTarget).toBeUndefined();
      });

      it('should return action=block for sacred drumming', () => {
        const result = warden.classify(
          'Sacred drum ceremony protocols.',
          Tradition.FIRST_NATIONS,
          'sacred-drumming',
        );

        expect(result.action).toBe('block');
        expect(result.level).toBe(CulturalSovereigntyLevel.SACRED_CEREMONIAL);
        expect(result.referralTarget).toBeUndefined();
      });

      it('should return action=block for sacred medicine', () => {
        const result = warden.classify(
          'Sacred plant medicine preparation.',
          Tradition.FIRST_NATIONS,
          'sacred-medicine',
        );

        expect(result.action).toBe('block');
        expect(result.level).toBe(CulturalSovereigntyLevel.SACRED_CEREMONIAL);
        expect(result.referralTarget).toBeUndefined();
      });

      it('should confirm Level 4 block has no override mechanism — action is always block', () => {
        const domainsWithLevel4: Array<{ tradition: Tradition; domain: string }> = [
          { tradition: Tradition.FIRST_NATIONS, domain: 'sun-dance' },
          { tradition: Tradition.FIRST_NATIONS, domain: 'sacred-drumming' },
          { tradition: Tradition.FIRST_NATIONS, domain: 'sacred-medicine' },
          { tradition: Tradition.INUIT, domain: 'shamanic-practices' },
          { tradition: Tradition.INUIT, domain: 'naming-ceremonies' },
        ];

        for (const { tradition, domain } of domainsWithLevel4) {
          const result = warden.classify('any content', tradition, domain);
          expect(result.action, `${tradition}/${domain} should be block`).toBe('block');
          expect(
            result.referralTarget,
            `${tradition}/${domain} should have no referralTarget`,
          ).toBeUndefined();
        }
      });

      it('should return an explanation even for Level 4 blocks', () => {
        const result = warden.classify(
          'Sun Dance ceremony.',
          Tradition.FIRST_NATIONS,
          'sun-dance',
        );

        expect(result.explanation).toBeTruthy();
        expect(result.explanation.length).toBeGreaterThan(0);
      });
    });
  });

  // ─── enforceNationAttribution ──────────────────────────────────────────────

  describe('enforceNationAttribution', () => {
    describe('pan-Indigenous language detection', () => {
      it('should flag "Native American" as pan-indigenous-language violation', () => {
        const result = warden.enforceNationAttribution(
          'Native American basket weaving uses specific materials.',
        );

        expect(result.passed).toBe(false);
        expect(result.violations).toHaveLength(1);
        expect(result.violations[0].issue).toBe('pan-indigenous-language');
        expect(result.violations[0].text).toContain('Native American');
        expect(result.violations[0].suggestion).toBeTruthy();
      });

      it('should flag "Indigenous peoples believed" as pan-indigenous-language violation', () => {
        const result = warden.enforceNationAttribution(
          'Indigenous peoples believed that plants had healing properties.',
        );

        expect(result.passed).toBe(false);
        expect(result.violations.length).toBeGreaterThan(0);
        expect(result.violations[0].issue).toBe('pan-indigenous-language');
        expect(result.violations[0].text.toLowerCase()).toContain('indigenous peoples believed');
      });

      it('should flag "Aboriginal tradition" as pan-indigenous-language violation', () => {
        const result = warden.enforceNationAttribution(
          'Aboriginal tradition teaches respect for the land.',
        );

        expect(result.passed).toBe(false);
        expect(result.violations).toHaveLength(1);
        expect(result.violations[0].issue).toBe('pan-indigenous-language');
        expect(result.violations[0].text).toContain('Aboriginal tradition');
        expect(result.violations[0].suggestion).toBeTruthy();
      });

      it('should flag "Aboriginal peoples" as pan-indigenous-language violation', () => {
        const result = warden.enforceNationAttribution(
          'Aboriginal peoples developed many techniques.',
        );

        expect(result.passed).toBe(false);
        expect(result.violations[0].issue).toBe('pan-indigenous-language');
      });

      it('should flag "Indigenous peoples thought" as pan-indigenous-language violation', () => {
        const result = warden.enforceNationAttribution(
          'Indigenous peoples thought of fire as sacred.',
        );

        expect(result.passed).toBe(false);
        expect(result.violations.length).toBeGreaterThan(0);
        expect(result.violations[0].issue).toBe('pan-indigenous-language');
      });

      it('should NOT flag nation-specific references like "Cree"', () => {
        const result = warden.enforceNationAttribution(
          'Cree medicine wheel teachings emphasize the four directions.',
        );

        expect(result.passed).toBe(true);
        expect(result.violations).toHaveLength(0);
      });

      it('should NOT flag "Haudenosaunee" as a violation', () => {
        const result = warden.enforceNationAttribution(
          'Haudenosaunee governance uses a confederacy model.',
        );

        expect(result.passed).toBe(true);
        expect(result.violations).toHaveLength(0);
      });

      it('should NOT flag "Inuit" as a violation', () => {
        const result = warden.enforceNationAttribution(
          'Inuit kayak construction techniques vary by region.',
        );

        expect(result.passed).toBe(true);
        expect(result.violations).toHaveLength(0);
      });

      it('should detect multiple pan-Indigenous violations in one passage', () => {
        const result = warden.enforceNationAttribution(
          'Native American basket weaving reflects Aboriginal tradition.',
        );

        expect(result.passed).toBe(false);
        expect(result.violations.length).toBeGreaterThanOrEqual(2);
      });

      it('should provide a meaningful suggestion for each violation', () => {
        const result = warden.enforceNationAttribution(
          'Native American traditions are diverse.',
        );

        expect(result.violations[0].suggestion).toBeTruthy();
        expect(result.violations[0].suggestion.length).toBeGreaterThan(10);
      });
    });

    describe('missing nation attribution', () => {
      it('should flag "the First Nations" without specific nation', () => {
        const result = warden.enforceNationAttribution(
          'The craftsmanship of the First Nations reflects deep knowledge.',
        );

        expect(result.passed).toBe(false);
        expect(result.violations.length).toBeGreaterThan(0);
        expect(result.violations[0].issue).toBe('pan-indigenous-language');
      });

      it('should flag "First Nations people" without specific nation following', () => {
        const result = warden.enforceNationAttribution(
          'First Nations people developed sophisticated tools.',
        );

        expect(result.passed).toBe(false);
        expect(result.violations.length).toBeGreaterThan(0);
      });

      it('should pass "Haudenosaunee governance" as properly attributed', () => {
        const result = warden.enforceNationAttribution(
          'Haudenosaunee governance principles influenced democratic thought.',
        );

        expect(result.passed).toBe(true);
        expect(result.violations).toHaveLength(0);
      });

      it('should pass "Anishinaabe people" as properly attributed', () => {
        const result = warden.enforceNationAttribution(
          'Anishinaabe people developed birch bark canoe construction techniques.',
        );

        expect(result.passed).toBe(true);
        expect(result.violations).toHaveLength(0);
      });

      it('should pass content with no Indigenous references', () => {
        const result = warden.enforceNationAttribution(
          'Appalachian dulcimer construction uses poplar and cherry wood.',
        );

        expect(result.passed).toBe(true);
        expect(result.violations).toHaveLength(0);
      });
    });
  });

  // ─── checkOCAPCompliance ───────────────────────────────────────────────────

  describe('checkOCAPCompliance', () => {
    it('should return true for properly attributed community content', () => {
      const result = warden.checkOCAPCompliance(
        'According to the Cree Nation, traditional trapping practices are documented with community permission and attributed to knowledge holders.',
      );

      expect(result).toBe(true);
    });

    it('should return true for content using "shared by" attribution', () => {
      const result = warden.checkOCAPCompliance(
        'This basket weaving technique was shared by Anishinaabe community educators.',
      );

      expect(result).toBe(true);
    });

    it('should return false for content claiming ownership of Indigenous knowledge', () => {
      const result = warden.checkOCAPCompliance(
        'Our Indigenous knowledge of plant medicine has been passed down through generations.',
      );

      expect(result).toBe(false);
    });

    it('should return false for content that references Indigenous knowledge without attribution', () => {
      const result = warden.checkOCAPCompliance(
        'Traditional knowledge from the First Nations community is described here.',
      );

      // References Indigenous content but no positive OCAP signals
      expect(result).toBe(false);
    });

    it('should return true for content that does not reference Indigenous material', () => {
      const result = warden.checkOCAPCompliance(
        'Appalachian dulcimer has three or four strings and a characteristic drone.',
      );

      expect(result).toBe(true);
    });

    it('should return true for community-authorized content', () => {
      const result = warden.checkOCAPCompliance(
        'This content is community-authorized and documented by Inuit Tapiriit Kanatami.',
      );

      expect(result).toBe(true);
    });
  });

  // ─── checkIQAlignment ─────────────────────────────────────────────────────

  describe('checkIQAlignment', () => {
    it('should return true for content referencing specific IQ principle Aajiiqatigiinniq', () => {
      const result = warden.checkIQAlignment(
        'Aajiiqatigiinniq (consensus decision-making) guides community governance processes.',
      );

      expect(result).toBe(true);
    });

    it('should return true for content referencing Inuit Qaujimajatuqangit explicitly', () => {
      const result = warden.checkIQAlignment(
        'Inuit Qaujimajatuqangit principles inform traditional ecological stewardship.',
      );

      expect(result).toBe(true);
    });

    it('should return true for content referencing IQ principles generally', () => {
      const result = warden.checkIQAlignment(
        'This practice reflects IQ principles of respect and community cooperation.',
      );

      expect(result).toBe(true);
    });

    it('should return false for generic "Inuit beliefs" framing', () => {
      const result = warden.checkIQAlignment(
        'Inuit beliefs about the land emphasize stewardship.',
      );

      expect(result).toBe(false);
    });

    it('should return false for generic "Inuit traditions" framing without IQ specificity', () => {
      const result = warden.checkIQAlignment(
        'Inuit traditions include many ecological practices.',
      );

      expect(result).toBe(false);
    });

    it('should return false for "Inuit believed" generalization', () => {
      const result = warden.checkIQAlignment(
        'Inuit believed that ice travel required careful observation.',
      );

      expect(result).toBe(false);
    });

    it('should return true for content that does not reference Inuit knowledge', () => {
      const result = warden.checkIQAlignment(
        'Appalachian fiddle traditions use pentatonic scales.',
      );

      expect(result).toBe(true);
    });

    it('should return true for content referencing Piliriqatigiinniq principle', () => {
      const result = warden.checkIQAlignment(
        'Piliriqatigiinniq (working together for a common purpose) is central to this practice.',
      );

      expect(result).toBe(true);
    });
  });

  // ─── getRedirectionTarget ──────────────────────────────────────────────────

  describe('getRedirectionTarget', () => {
    it('should return community resource for First Nations governance domain', () => {
      const result = warden.getRedirectionTarget(Tradition.FIRST_NATIONS, 'governance');

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should return community resource for First Nations clans domain', () => {
      const result = warden.getRedirectionTarget(Tradition.FIRST_NATIONS, 'clans');

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should return community resource for First Nations sweat-lodge domain', () => {
      const result = warden.getRedirectionTarget(Tradition.FIRST_NATIONS, 'sweat-lodge');

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should return community resource for Inuit ceremonies domain', () => {
      const result = warden.getRedirectionTarget(Tradition.INUIT, 'qulliq-ceremony');

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should return community resource for Inuit throat singing', () => {
      const result = warden.getRedirectionTarget(Tradition.INUIT, 'throat-singing');

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should return undefined for Appalachian tradition (no community restrictions)', () => {
      const result = warden.getRedirectionTarget(Tradition.APPALACHIAN, 'crafts');

      expect(result).toBeUndefined();
    });

    it('should return undefined for Level 4 sacred domains (no redirection path)', () => {
      const sunDanceResult = warden.getRedirectionTarget(Tradition.FIRST_NATIONS, 'sun-dance');
      const shamansResult = warden.getRedirectionTarget(Tradition.INUIT, 'shamanic-practices');
      const namingResult = warden.getRedirectionTarget(Tradition.INUIT, 'naming-ceremonies');

      // Level 4 sacred content has no referral path
      expect(sunDanceResult).toBeUndefined();
      expect(shamansResult).toBeUndefined();
      expect(namingResult).toBeUndefined();
    });

    it('should return undefined for unknown domain with no matching rules', () => {
      const result = warden.getRedirectionTarget(Tradition.APPALACHIAN, 'unknown-domain-xyz');

      expect(result).toBeUndefined();
    });
  });
});
