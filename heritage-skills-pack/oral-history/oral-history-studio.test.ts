/**
 * Tests for the Oral History Studio module.
 *
 * Validates:
 * - getCorePractices(): exactly 12 practices, valid shape, IQ alignment, Inuktitut syllabics,
 *   no pan-Indigenous language
 * - getIQAlignedPractices(): only practices with iqPrinciple, correct alignment (IQ-02, IQ-05)
 * - getConsentProtocol(): OCAP/NISR flags, unknown ID throws, community-consent type
 * - getInterviewGuide(): IQ-Pilimmaksarniq (inuit), Foxfire (appalachian), OHA (cross-tradition)
 * - getNISRGuides() and getOCAPGuides(): correct guide sets, Foxfire excluded from OCAP/NISR
 *
 * @module heritage-skills-pack/oral-history/oral-history-studio.test
 */

import { describe, it, expect } from 'vitest';
import {
  getCorePractices,
  getIQAlignedPractices,
  getConsentProtocol,
  getAllConsentProtocols,
  getAllInterviewGuides,
  getInterviewGuide,
  getNISRGuides,
  getOCAPGuides,
} from './index.js';

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('Oral History Studio', () => {
  // ── getCorePractices ───────────────────────────────────────────────────────────

  describe('getCorePractices', () => {
    it('should return exactly 12 core practices', () => {
      const practices = getCorePractices();
      expect(practices).toHaveLength(12);
    });

    it('should have valid id, name, and description on every practice', () => {
      const practices = getCorePractices();
      for (const practice of practices) {
        expect(practice.id).toBeTruthy();
        expect(typeof practice.id).toBe('string');
        expect(practice.name).toBeTruthy();
        expect(typeof practice.name).toBe('string');
        expect(practice.description).toBeTruthy();
        expect(typeof practice.description).toBe('string');
        expect(practice.description.length).toBeGreaterThan(50);
      }
    });

    it('should have ids practice-01 through practice-12', () => {
      const practices = getCorePractices();
      const ids = practices.map(p => p.id);
      for (let i = 1; i <= 12; i++) {
        const expectedId = `practice-${String(i).padStart(2, '0')}`;
        expect(ids).toContain(expectedId);
      }
    });

    it('should include Inuktitut syllabics (ᐃᓄᒃᑎᑐᑦ) in practice-09 transcription description', () => {
      const practices = getCorePractices();
      const transcription = practices.find(p => p.id === 'practice-09');
      expect(transcription).toBeDefined();
      expect(transcription?.description).toContain('ᐃᓄᒃᑎᑐᑦ');
    });

    it('should contain no pan-Indigenous language ("Native American" or standalone "Indigenous peoples")', () => {
      const practices = getCorePractices();
      const allText = practices.map(p => `${p.name} ${p.description}`).join('\n');
      expect(allText).not.toMatch(/Native American/i);
      // The phrase "Indigenous peoples" (generic, without nation context) should not appear
      // Nation-specific context is always provided (Inuit, Anishinaabe, Haudenosaunee)
      expect(allText).not.toMatch(/Indigenous peoples$/im);
    });

    it('should name specific nations throughout (Inuit, Anishinaabe, Haudenosaunee)', () => {
      const practices = getCorePractices();
      const allText = practices.map(p => p.description).join('\n');
      expect(allText).toMatch(/Inuit/);
      expect(allText).toMatch(/Anishinaabe/);
      expect(allText).toMatch(/Haudenosaunee/);
    });
  });

  // ── getIQAlignedPractices ──────────────────────────────────────────────────────

  describe('getIQAlignedPractices', () => {
    it('should return only practices that have an iqPrinciple field', () => {
      const aligned = getIQAlignedPractices();
      for (const practice of aligned) {
        expect(practice.iqPrinciple).toBeDefined();
        expect(typeof practice.iqPrinciple).toBe('string');
      }
    });

    it('should not include practices without an iqPrinciple', () => {
      const all = getCorePractices();
      const aligned = getIQAlignedPractices();
      const noIQ = all.filter(p => p.iqPrinciple === undefined);
      const alignedIds = aligned.map(p => p.id);
      for (const practice of noIQ) {
        expect(alignedIds).not.toContain(practice.id);
      }
    });

    it('should include practice-02 aligned to IQ-02 (Tunnganarniq)', () => {
      const aligned = getIQAlignedPractices();
      const tunnganarniq = aligned.find(p => p.id === 'practice-02');
      expect(tunnganarniq).toBeDefined();
      expect(tunnganarniq?.iqPrinciple).toBe('IQ-02');
      expect(tunnganarniq?.name).toContain('Tunnganarniq');
    });

    it('should include practice-06 aligned to IQ-05 (Pilimmaksarniq)', () => {
      const aligned = getIQAlignedPractices();
      const pilimmaksarniq = aligned.find(p => p.id === 'practice-06');
      expect(pilimmaksarniq).toBeDefined();
      expect(pilimmaksarniq?.iqPrinciple).toBe('IQ-05');
      expect(pilimmaksarniq?.name).toContain('Pilimmaksarniq');
    });

    it('should include practice-01 aligned to IQ-01 (Inuuqatigiitsiarniq)', () => {
      const aligned = getIQAlignedPractices();
      const preparation = aligned.find(p => p.id === 'practice-01');
      expect(preparation).toBeDefined();
      expect(preparation?.iqPrinciple).toBe('IQ-01');
    });

    it('should include practice-10 aligned to IQ-04 (Aajiiqatigiinniq)', () => {
      const aligned = getIQAlignedPractices();
      const review = aligned.find(p => p.id === 'practice-10');
      expect(review).toBeDefined();
      expect(review?.iqPrinciple).toBe('IQ-04');
    });

    it('should return at least 4 IQ-aligned practices', () => {
      const aligned = getIQAlignedPractices();
      expect(aligned.length).toBeGreaterThanOrEqual(4);
    });
  });

  // ── getConsentProtocol ─────────────────────────────────────────────────────────

  describe('getConsentProtocol', () => {
    it('should return OCAP-compliant protocol with ocapCompliant=true', () => {
      const protocol = getConsentProtocol('ocap-compliant');
      expect(protocol.ocapCompliant).toBe(true);
      expect(protocol.id).toBe('ocap-compliant');
    });

    it('should return NISR-compliant protocol with both ocapCompliant=true and nisrCompliant=true', () => {
      const protocol = getConsentProtocol('nisr-compliant');
      expect(protocol.ocapCompliant).toBe(true);
      expect(protocol.nisrCompliant).toBe(true);
      expect(protocol.id).toBe('nisr-compliant');
    });

    it('should return standard protocol with ocapCompliant=false and nisrCompliant=false', () => {
      const protocol = getConsentProtocol('standard');
      expect(protocol.ocapCompliant).toBe(false);
      expect(protocol.nisrCompliant).toBe(false);
      expect(protocol.type).toBe('individual');
    });

    it('should throw for unknown protocol ID', () => {
      expect(() => getConsentProtocol('nonexistent-protocol')).toThrow(
        /Unknown consent protocol ID/,
      );
    });

    it('should return community-consent protocol with type=community', () => {
      const protocol = getConsentProtocol('community-consent');
      expect(protocol.type).toBe('community');
      expect(protocol.ocapCompliant).toBe(true);
      expect(protocol.nisrCompliant).toBe(true);
    });

    it('should return all 4 protocols from getAllConsentProtocols', () => {
      const protocols = getAllConsentProtocols();
      expect(protocols).toHaveLength(4);
      const ids = protocols.map(p => p.id);
      expect(ids).toContain('standard');
      expect(ids).toContain('ocap-compliant');
      expect(ids).toContain('nisr-compliant');
      expect(ids).toContain('community-consent');
    });

    it('should have FNIGC mentioned in ocap-compliant requirements', () => {
      const protocol = getConsentProtocol('ocap-compliant');
      const requirementsText = protocol.requirements.join(' ');
      expect(requirementsText).toMatch(/FNIGC/);
    });

    it('should have ITK or NISR mentioned in nisr-compliant requirements', () => {
      const protocol = getConsentProtocol('nisr-compliant');
      const requirementsText = protocol.requirements.join(' ');
      expect(requirementsText).toMatch(/ITK|NISR/);
    });
  });

  // ── getInterviewGuide ──────────────────────────────────────────────────────────

  describe('getInterviewGuide', () => {
    it('should return IQ-Pilimmaksarniq guide with tradition=inuit', () => {
      const guide = getInterviewGuide('IQ-Pilimmaksarniq');
      expect(guide.tradition).toBe('inuit');
      expect(guide.methodology).toBe('IQ-Pilimmaksarniq');
    });

    it('should return IQ-Pilimmaksarniq guide with nisr-compliant consent protocol', () => {
      const guide = getInterviewGuide('IQ-Pilimmaksarniq');
      expect(guide.consentProtocolId).toBe('nisr-compliant');
      expect(guide.ethicsFramework).toBe('OCAP+NISR');
    });

    it('should return Foxfire guide with tradition=appalachian and ethicsFramework=OHA-standard', () => {
      const guide = getInterviewGuide('Foxfire');
      expect(guide.tradition).toBe('appalachian');
      expect(guide.ethicsFramework).toBe('OHA-standard');
      expect(guide.consentProtocolId).toBe('standard');
    });

    it('should return OHA guide with tradition=cross-tradition', () => {
      const guide = getInterviewGuide('OHA');
      expect(guide.tradition).toBe('cross-tradition');
      expect(guide.methodology).toBe('OHA');
    });

    it('should return Smithsonian guide with tradition=cross-tradition', () => {
      const guide = getInterviewGuide('Smithsonian');
      expect(guide.tradition).toBe('cross-tradition');
      expect(guide.ethicsFramework).toBe('Smithsonian-Folklife');
    });

    it('should throw for unknown methodology', () => {
      // TypeScript cast to test runtime behavior
      expect(() => getInterviewGuide('Unknown' as 'OHA')).toThrow(/Unknown methodology/);
    });

    it('should return all 4 guides from getAllInterviewGuides', () => {
      const guides = getAllInterviewGuides();
      expect(guides).toHaveLength(4);
      const methodologies = guides.map(g => g.methodology);
      expect(methodologies).toContain('OHA');
      expect(methodologies).toContain('Smithsonian');
      expect(methodologies).toContain('IQ-Pilimmaksarniq');
      expect(methodologies).toContain('Foxfire');
    });
  });

  // ── getNISRGuides and getOCAPGuides ────────────────────────────────────────────

  describe('getNISRGuides and getOCAPGuides', () => {
    it('should return IQ-Pilimmaksarniq guide from getNISRGuides', () => {
      const nisrGuides = getNISRGuides();
      const methodologies = nisrGuides.map(g => g.methodology);
      expect(methodologies).toContain('IQ-Pilimmaksarniq');
    });

    it('should not return Foxfire guide from getNISRGuides', () => {
      const nisrGuides = getNISRGuides();
      const methodologies = nisrGuides.map(g => g.methodology);
      expect(methodologies).not.toContain('Foxfire');
    });

    it('should not return OHA guide from getNISRGuides', () => {
      const nisrGuides = getNISRGuides();
      const methodologies = nisrGuides.map(g => g.methodology);
      expect(methodologies).not.toContain('OHA');
    });

    it('should return OHA and Smithsonian guides from getOCAPGuides', () => {
      const ocapGuides = getOCAPGuides();
      const methodologies = ocapGuides.map(g => g.methodology);
      expect(methodologies).toContain('OHA');
      expect(methodologies).toContain('Smithsonian');
    });

    it('should return IQ-Pilimmaksarniq guide from getOCAPGuides', () => {
      const ocapGuides = getOCAPGuides();
      const methodologies = ocapGuides.map(g => g.methodology);
      expect(methodologies).toContain('IQ-Pilimmaksarniq');
    });

    it('should not return Foxfire guide from getOCAPGuides', () => {
      const ocapGuides = getOCAPGuides();
      const methodologies = ocapGuides.map(g => g.methodology);
      expect(methodologies).not.toContain('Foxfire');
    });

    it('getNISRGuides should return only guides referencing nisr-compliant protocol', () => {
      const nisrGuides = getNISRGuides();
      for (const guide of nisrGuides) {
        expect(guide.consentProtocolId).toBe('nisr-compliant');
      }
    });

    it('getOCAPGuides should return only guides referencing OCAP-compliant protocols', () => {
      const ocapGuides = getOCAPGuides();
      const ocapProtocolIds = getAllConsentProtocols()
        .filter(p => p.ocapCompliant)
        .map(p => p.id);
      for (const guide of ocapGuides) {
        expect(ocapProtocolIds).toContain(guide.consentProtocolId);
      }
    });
  });
});
