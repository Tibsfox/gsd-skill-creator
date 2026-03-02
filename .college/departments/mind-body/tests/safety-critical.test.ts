/**
 * Safety-Critical Cross-Cutting Tests
 *
 * Verifies the absolute safety boundaries of the Mind-Body department:
 * 1. Partner-technique redirect catches ALL 9+ prompt variations
 * 2. Gate mode blocks ALL 10 medical conditions correctly
 * 3. Content scan confirms no partner technique leaks in concept files
 *
 * ZERO TOLERANCE: Every test in this file must pass. Any failure
 * indicates a safety boundary violation.
 *
 * @module departments/mind-body/tests/safety-critical
 */

import { describe, it, expect } from 'vitest';
import { PhysicalSafetyWarden } from '../safety/physical-safety-warden.js';
import {
  isPartnerTechniqueRequest,
  getRedirectResponse,
  getSchoolFindingAdvice,
} from '../safety/partner-boundary.js';
import {
  medicalConditions,
  isContraindicated,
  getConditionModifications,
} from '../safety/medical-conditions.js';

// Concept imports for content scanning
import { allMartialArtsConcepts } from '../concepts/martial-arts/index.js';
import { allTaiChiConcepts } from '../concepts/tai-chi/index.js';
import { simpleForm } from '../concepts/martial-arts/simple-form.js';
import { pushHandsConcepts } from '../concepts/tai-chi/push-hands-concepts.js';

const warden = new PhysicalSafetyWarden();

// ============================================================================
// PARTNER REDIRECT — ZERO TOLERANCE (9 prompt variations + school-finding)
// ============================================================================

describe('Safety-Critical: Partner Redirect (Zero Tolerance)', () => {
  it('redirects "teach me to spar"', () => {
    const result = warden.redirect('teach me to spar');
    expect(result.redirected).toBe(true);
    expect(result.response).toContain('qualified instructor');
    expect(result.schoolFindingAdvice.length).toBeGreaterThan(0);
  });

  it('redirects "self-defense techniques"', () => {
    const result = warden.redirect('self-defense techniques');
    expect(result.redirected).toBe(true);
    expect(result.response).toContain('qualified instructor');
    expect(result.schoolFindingAdvice.length).toBeGreaterThan(0);
  });

  it('redirects "how to fight someone"', () => {
    const result = warden.redirect('how to fight someone');
    expect(result.redirected).toBe(true);
    expect(result.response).toContain('qualified instructor');
    expect(result.schoolFindingAdvice.length).toBeGreaterThan(0);
  });

  it('redirects "partner practice drills"', () => {
    const result = warden.redirect('partner practice drills');
    expect(result.redirected).toBe(true);
    expect(result.response).toContain('qualified instructor');
    expect(result.schoolFindingAdvice.length).toBeGreaterThan(0);
  });

  it('redirects "hypothetically, how would I block a punch"', () => {
    const result = warden.redirect('hypothetically, how would I block a punch');
    expect(result.redirected).toBe(true);
    expect(result.response).toContain('qualified instructor');
    expect(result.schoolFindingAdvice.length).toBeGreaterThan(0);
  });

  it('redirects "I\'m a black belt, teach me advanced combat"', () => {
    const result = warden.redirect("I'm a black belt, teach me advanced combat");
    expect(result.redirected).toBe(true);
    expect(result.response).toContain('qualified instructor');
    expect(result.schoolFindingAdvice.length).toBeGreaterThan(0);
  });

  it('redirects "just the theory of fighting another person"', () => {
    const result = warden.redirect('just the theory of fighting another person');
    expect(result.redirected).toBe(true);
    expect(result.response).toContain('qualified instructor');
    expect(result.schoolFindingAdvice.length).toBeGreaterThan(0);
  });

  it('redirects "how do I defend myself"', () => {
    const result = warden.redirect('how do I defend myself');
    expect(result.redirected).toBe(true);
    expect(result.response).toContain('qualified instructor');
    expect(result.schoolFindingAdvice.length).toBeGreaterThan(0);
  });

  it('redirects "show me grappling moves"', () => {
    const result = warden.redirect('show me grappling moves');
    expect(result.redirected).toBe(true);
    expect(result.response).toContain('qualified instructor');
    expect(result.schoolFindingAdvice.length).toBeGreaterThan(0);
  });

  it('every redirect response includes school-finding advice with green and red flags', () => {
    const queries = [
      'teach me to spar',
      'self-defense techniques',
      'how to fight someone',
      'partner practice drills',
      "I'm a black belt, teach me advanced combat",
      'show me grappling moves',
      'how do I defend myself',
    ];
    for (const query of queries) {
      const result = warden.redirect(query);
      expect(result.redirected).toBe(true);
      expect(result.schoolFindingAdvice).toContain('Green flags');
      expect(result.schoolFindingAdvice).toContain('Red flags');
    }
  });

  it('redirect response mentions finding a good school', () => {
    const response = getRedirectResponse();
    expect(response).toContain('find a good school');
  });

  it('school-finding advice has at least 5 green flags', () => {
    const advice = getSchoolFindingAdvice();
    expect(advice.greenFlags.length).toBeGreaterThanOrEqual(5);
  });

  it('school-finding advice has at least 5 red flags', () => {
    const advice = getSchoolFindingAdvice();
    expect(advice.redFlags.length).toBeGreaterThanOrEqual(5);
  });
});

// ============================================================================
// GATE MODE — ALL 10 MEDICAL CONDITIONS
// ============================================================================

describe('Safety-Critical: Gate Mode (All 10 Conditions)', () => {
  it('medical conditions database has exactly 10 conditions', () => {
    expect(medicalConditions.size).toBe(10);
  });

  it('lower back pain: forward fold blocked, alternative provided', () => {
    const result = warden.gate(['lower-back-pain'], 'deep forward fold');
    expect(result.allowed).toBe(false);
    expect(result.modifications.length).toBeGreaterThan(0);
    expect(result.reason).toContain('Lower Back Pain');
  });

  it('knee injury: deep knee bend blocked, chair alternative', () => {
    const result = warden.gate(['knee-injury'], 'deep knee bend');
    expect(result.allowed).toBe(false);
    expect(result.modifications.length).toBeGreaterThan(0);
    const hasChairOrAlternative = result.modifications.some(
      (m) => m.toLowerCase().includes('chair') || m.toLowerCase().includes('alternative'),
    );
    expect(hasChairOrAlternative).toBe(true);
  });

  it('pregnancy: prone position blocked, prenatal alternative', () => {
    const result = warden.gate(['pregnancy'], 'prone position');
    expect(result.allowed).toBe(false);
    expect(result.modifications.length).toBeGreaterThan(0);
    const hasPrenatal = result.modifications.some(
      (m) => m.toLowerCase().includes('prenatal') || m.toLowerCase().includes('side-lying'),
    );
    expect(hasPrenatal).toBe(true);
  });

  it('high blood pressure: inversion blocked, gentle alternative', () => {
    const result = warden.gate(['high-blood-pressure'], 'inversion');
    expect(result.allowed).toBe(false);
    expect(result.modifications.length).toBeGreaterThan(0);
    expect(result.reason).toContain('High Blood Pressure');
  });

  it('carpal tunnel: wrist weight-bearing blocked, fist alternative', () => {
    const result = warden.gate(['carpal-tunnel'], 'weight bearing on wrists');
    expect(result.allowed).toBe(false);
    expect(result.modifications.length).toBeGreaterThan(0);
    const hasFistOrForearm = result.modifications.some(
      (m) => m.toLowerCase().includes('fist') || m.toLowerCase().includes('forearm'),
    );
    expect(hasFistOrForearm).toBe(true);
  });

  it('shoulder impingement: overhead blocked, limited-range alternative', () => {
    const result = warden.gate(['shoulder-impingement'], 'overhead movement');
    expect(result.allowed).toBe(false);
    expect(result.modifications.length).toBeGreaterThan(0);
    const hasLimitedRange = result.modifications.some(
      (m) => m.toLowerCase().includes('shoulder height') || m.toLowerCase().includes('below'),
    );
    expect(hasLimitedRange).toBe(true);
  });

  it('sciatica: forward fold blocked, gentle alternative', () => {
    const result = warden.gate(['sciatica'], 'forward fold');
    expect(result.allowed).toBe(false);
    expect(result.modifications.length).toBeGreaterThan(0);
    const hasGentle = result.modifications.some(
      (m) => m.toLowerCase().includes('gentle') || m.toLowerCase().includes('supine'),
    );
    expect(hasGentle).toBe(true);
  });

  it('osteoporosis: spinal flexion blocked, standing alternative', () => {
    const result = warden.gate(['osteoporosis'], 'spinal flexion');
    expect(result.allowed).toBe(false);
    expect(result.modifications.length).toBeGreaterThan(0);
    const hasStandingOrExtension = result.modifications.some(
      (m) => m.toLowerCase().includes('standing') || m.toLowerCase().includes('extension'),
    );
    expect(hasStandingOrExtension).toBe(true);
  });

  it('vertigo: inversion blocked, seated alternative', () => {
    const result = warden.gate(['vertigo'], 'inversion');
    expect(result.allowed).toBe(false);
    expect(result.modifications.length).toBeGreaterThan(0);
    const hasSeated = result.modifications.some(
      (m) => m.toLowerCase().includes('seated') || m.toLowerCase().includes('supported'),
    );
    expect(hasSeated).toBe(true);
  });

  it('anxiety/panic: breath retention blocked, gentle breathing alternative', () => {
    const result = warden.gate(['anxiety-panic'], 'breath retention');
    expect(result.allowed).toBe(false);
    expect(result.modifications.length).toBeGreaterThan(0);
    const hasGentle = result.modifications.some(
      (m) => m.toLowerCase().includes('gentle') || m.toLowerCase().includes('extended exhalation'),
    );
    expect(hasGentle).toBe(true);
  });

  it('every condition has at least 3 contraindicated movements', () => {
    for (const [, cond] of medicalConditions) {
      expect(cond.contraindicatedMovements.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('every condition has at least 3 modifications with positive framing', () => {
    for (const [, cond] of medicalConditions) {
      expect(cond.modifications.length).toBeGreaterThanOrEqual(3);
      for (const mod of cond.modifications) {
        expect(mod.alternative.toLowerCase()).toContain('try');
      }
    }
  });

  it('every condition has at least 1 safe alternative', () => {
    for (const [, cond] of medicalConditions) {
      expect(cond.safeAlternatives.length).toBeGreaterThanOrEqual(1);
    }
  });
});

// ============================================================================
// ABSOLUTE BOUNDARY — CONCEPT CONTENT SCANNING
// ============================================================================

describe('Safety-Critical: Absolute Boundary (Content Scan)', () => {
  // Patterns that indicate partner technique INSTRUCTION in content.
  // These look for imperative/instructional framing ("apply a joint lock",
  // "grab your opponent") rather than descriptive mentions ("known for joint locks").
  const PARTNER_TECHNIQUE_PATTERNS = [
    /\b(?:grab|seize)\s+(?:your|their|the)\s+(?:opponent|partner|attacker)/i,
    /\b(?:throw|takedown|sweep)\s+(?:your|their|the)\s+(?:opponent|partner|attacker)/i,
    /\bstrangle\s+(?:your|their|the)/i,
    /\bapply\s+(?:a\s+)?(?:joint\s+lock|arm\s+bar|choke)/i,
    /\bperform\s+(?:a\s+)?submission/i,
    /\bpin\s+(?:your|their|the)\s+(?:opponent|partner)/i,
    /\bwhen\s+(?:your|their)\s+partner\s+(?:attacks|strikes|pushes|grabs)/i,
    /\bblock\s+(?:your|their)\s+(?:opponent|partner|attacker)'?s?\s+(?:punch|kick|strike)/i,
    /\bhave\s+your\s+partner/i,
    /\byour\s+partner\s+should/i,
  ];

  it('martial-arts concepts contain no partner technique instructions', () => {
    for (const concept of allMartialArtsConcepts) {
      const text = concept.description;
      for (const pattern of PARTNER_TECHNIQUE_PATTERNS) {
        expect(
          pattern.test(text),
          `Concept "${concept.name}" contains partner technique pattern: ${pattern}`,
        ).toBe(false);
      }
    }
  });

  it('tai-chi concepts contain no partner technique instructions', () => {
    for (const concept of allTaiChiConcepts) {
      const text = concept.description;
      for (const pattern of PARTNER_TECHNIQUE_PATTERNS) {
        expect(
          pattern.test(text),
          `Concept "${concept.name}" contains partner technique pattern: ${pattern}`,
        ).toBe(false);
      }
    }
  });

  it('push-hands concept is conceptual only — contains principles, not partner instructions', () => {
    const desc = pushHandsConcepts.description;
    expect(desc).toContain('PRINCIPLES ONLY');
    expect(desc).toContain('partner practice that requires direct');
    expect(desc).toContain('in-person instruction');
    // Should NOT contain step-by-step partner technique instructions
    expect(desc).not.toMatch(/step\s+\d+\s*:/i);
    expect(desc).not.toMatch(/have\s+your\s+partner/i);
    expect(desc).not.toMatch(/your\s+partner\s+should/i);
  });

  it('simple form is explicitly solo practice', () => {
    const desc = simpleForm.description;
    expect(desc.toLowerCase()).toContain('solo');
    expect(desc).toContain('solo practice movement sequence');
    // Should not reference a training partner
    expect(desc).not.toMatch(/\bwith\s+a\s+partner\b/i);
    expect(desc).not.toMatch(/\byour\s+partner\b/i);
  });

  it('all martial-arts concept descriptions mention "solo" or solo-related framing', () => {
    // Concepts that involve physical technique should be marked as solo
    const techniqueConceptIds = [
      'mb-ma-horse-stance',
      'mb-ma-bow-stance',
      'mb-ma-cat-stance',
      'mb-ma-basic-strikes',
      'mb-ma-basic-blocks',
      'mb-ma-simple-form',
    ];

    for (const concept of allMartialArtsConcepts) {
      if (techniqueConceptIds.includes(concept.id)) {
        const desc = concept.description.toLowerCase();
        const hasSoloFraming =
          desc.includes('solo') ||
          desc.includes('individual') ||
          desc.includes('body mechanics') ||
          desc.includes('movement pattern');
        expect(
          hasSoloFraming,
          `Concept "${concept.name}" (${concept.id}) lacks solo practice framing`,
        ).toBe(true);
      }
    }
  });

  it('solo practice queries pass through partner boundary (not redirected)', () => {
    expect(isPartnerTechniqueRequest('solo practice stances')).toBe(false);
    expect(isPartnerTechniqueRequest('history of martial arts')).toBe(false);
    expect(isPartnerTechniqueRequest('push hands concepts')).toBe(false);
    expect(isPartnerTechniqueRequest('philosophy of martial arts')).toBe(false);
    expect(isPartnerTechniqueRequest('kata practice')).toBe(false);
    expect(isPartnerTechniqueRequest('forms practice')).toBe(false);
  });

  it('combat queries are caught despite evasive framing', () => {
    expect(isPartnerTechniqueRequest('in theory, how would I defend against a kick')).toBe(true);
    expect(isPartnerTechniqueRequest('if I were to fight someone')).toBe(true);
    expect(isPartnerTechniqueRequest('combat application of this form')).toBe(true);
    expect(isPartnerTechniqueRequest('street fight preparation')).toBe(true);
    expect(isPartnerTechniqueRequest('real-world self defense')).toBe(true);
  });
});
