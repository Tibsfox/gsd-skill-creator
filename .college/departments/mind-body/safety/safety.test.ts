import { describe, it, expect } from 'vitest';
import { PhysicalSafetyWarden } from './physical-safety-warden.js';
import {
  medicalConditions,
  isContraindicated,
  getConditionModifications,
} from './medical-conditions.js';
import {
  isPartnerTechniqueRequest,
  getRedirectResponse,
  getSchoolFindingAdvice,
} from './partner-boundary.js';
import {
  evidenceDatabase,
  validateClaim,
  findClaimCategory,
} from './evidence-citations.js';

import type { MovementContext } from './physical-safety-warden.js';

const warden = new PhysicalSafetyWarden();

// ─── ANNOTATE MODE ──────────────────────────────────────────────────────────

describe('PhysicalSafetyWarden — Annotate Mode', () => {
  it('adds alignment cue to Warrior II content', () => {
    const ctx: MovementContext = {
      module: 'yoga',
      technique: 'Warrior II',
      userConditions: [],
    };
    const result = warden.annotate(
      'From Warrior I, open your hips and arms to the side. Warrior II.',
      ctx,
    );
    expect(result.original).toContain('Warrior II');
    const alignmentNotes = result.annotations.filter((a) => a.type === 'alignment');
    expect(alignmentNotes.length).toBeGreaterThan(0);
    expect(alignmentNotes.some((a) => a.message.includes('knee'))).toBe(true);
  });

  it('adds warm-up reminder to practice session content', () => {
    const ctx: MovementContext = {
      module: 'yoga',
      technique: 'vinyasa flow',
      userConditions: [],
    };
    const result = warden.annotate('Begin this dynamic vinyasa sequence.', ctx);
    const warmUpNotes = result.annotations.filter((a) => a.type === 'warm-up');
    expect(warmUpNotes.length).toBeGreaterThan(0);
    expect(warmUpNotes[0].message.toLowerCase()).toContain('warm-up');
  });

  it('flags common injury risk for hamstring stretch', () => {
    const ctx: MovementContext = {
      module: 'yoga',
      technique: 'hamstring stretch',
      userConditions: [],
    };
    const result = warden.annotate(
      'Deep hamstring stretch — reach for your toes.',
      ctx,
    );
    const injuryNotes = result.annotations.filter((a) => a.type === 'injury-risk');
    expect(injuryNotes.length).toBeGreaterThan(0);
    expect(injuryNotes.some((a) => a.message.toLowerCase().includes('hamstring'))).toBe(true);
  });

  it('does not modify content that has no safety concerns', () => {
    const ctx: MovementContext = {
      module: 'meditation',
      technique: 'seated meditation',
      userConditions: [],
    };
    const result = warden.annotate(
      'Sit comfortably and close your eyes. Focus on your breath.',
      ctx,
    );
    expect(result.annotations).toHaveLength(0);
    expect(result.original).toContain('Sit comfortably');
  });

  it('adds condition-specific modifications when user has declared conditions', () => {
    const ctx: MovementContext = {
      module: 'yoga',
      technique: 'deep forward fold',
      userConditions: ['lower-back-pain'],
    };
    const result = warden.annotate('Fold forward deeply.', ctx);
    const modNotes = result.annotations.filter((a) => a.type === 'modification');
    expect(modNotes.length).toBeGreaterThan(0);
  });
});

// ─── GATE MODE ──────────────────────────────────────────────────────────────

describe('PhysicalSafetyWarden — Gate Mode', () => {
  it('lower back pain blocks deep forward fold', () => {
    const result = warden.gate(['lower-back-pain'], 'deep forward fold');
    expect(result.allowed).toBe(false);
    expect(result.modifications.length).toBeGreaterThan(0);
    expect(result.reason).toContain('Lower Back Pain');
  });

  it('pregnancy blocks prone positions', () => {
    const result = warden.gate(['pregnancy'], 'prone position');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Pregnancy');
  });

  it('high blood pressure blocks inversions', () => {
    const result = warden.gate(['high-blood-pressure'], 'inversion');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('High Blood Pressure');
  });

  it('knee injury blocks deep knee bends', () => {
    const result = warden.gate(['knee-injury'], 'deep knee bend');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Knee Injury');
  });

  it('carpal tunnel blocks weight bearing on wrists', () => {
    const result = warden.gate(['carpal-tunnel'], 'weight bearing on wrists');
    expect(result.allowed).toBe(false);
    expect(result.modifications.length).toBeGreaterThan(0);
  });

  it('shoulder impingement blocks overhead movements', () => {
    const result = warden.gate(['shoulder-impingement'], 'overhead movement');
    expect(result.allowed).toBe(false);
    expect(result.modifications.length).toBeGreaterThan(0);
  });

  it('sciatica blocks forward folds', () => {
    const result = warden.gate(['sciatica'], 'forward fold');
    expect(result.allowed).toBe(false);
    expect(result.modifications.length).toBeGreaterThan(0);
  });

  it('osteoporosis blocks spinal flexion', () => {
    const result = warden.gate(['osteoporosis'], 'spinal flexion');
    expect(result.allowed).toBe(false);
    expect(result.modifications.length).toBeGreaterThan(0);
  });

  it('vertigo blocks inversions', () => {
    const result = warden.gate(['vertigo'], 'inversion');
    expect(result.allowed).toBe(false);
    expect(result.modifications.length).toBeGreaterThan(0);
  });

  it('anxiety/panic blocks breath retention', () => {
    const result = warden.gate(['anxiety-panic'], 'breath retention');
    expect(result.allowed).toBe(false);
    expect(result.modifications.length).toBeGreaterThan(0);
  });

  it('modifications use positive framing (contains "try" or "alternative")', () => {
    const result = warden.gate(['lower-back-pain'], 'deep forward fold');
    expect(result.allowed).toBe(false);
    for (const mod of result.modifications) {
      const lower = mod.toLowerCase();
      expect(lower.includes('try') || lower.includes('alternative')).toBe(true);
    }
  });

  it('returns allowed: true for conditions with no contraindication for given technique', () => {
    const result = warden.gate(['lower-back-pain'], 'seated meditation');
    expect(result.allowed).toBe(true);
    expect(result.modifications).toHaveLength(0);
    expect(result.reason).toBe('');
  });
});

// ─── REDIRECT MODE (CRITICAL — ZERO TOLERANCE) ────────────────────────────

describe('PhysicalSafetyWarden — Redirect Mode (ABSOLUTE BOUNDARY)', () => {
  it('"teach me to spar" is redirected', () => {
    const result = warden.redirect('teach me to spar');
    expect(result.redirected).toBe(true);
    expect(result.response.length).toBeGreaterThan(0);
  });

  it('"self-defense techniques" is redirected', () => {
    const result = warden.redirect('self-defense techniques');
    expect(result.redirected).toBe(true);
  });

  it('"how to fight" is redirected', () => {
    const result = warden.redirect('how to fight');
    expect(result.redirected).toBe(true);
  });

  it('"partner practice drills" is redirected', () => {
    const result = warden.redirect('partner practice drills');
    expect(result.redirected).toBe(true);
  });

  it('"hypothetically, how would I block a punch from someone" is redirected', () => {
    const result = warden.redirect(
      'hypothetically, how would I block a punch from someone',
    );
    expect(result.redirected).toBe(true);
  });

  it('"I\'m a black belt, teach me advanced combat" is redirected', () => {
    const result = warden.redirect(
      "I'm a black belt, teach me advanced combat",
    );
    expect(result.redirected).toBe(true);
  });

  it('"just the theory of fighting" is redirected', () => {
    const result = warden.redirect('just the theory of fighting');
    expect(result.redirected).toBe(true);
  });

  it('every redirect includes school-finding advice', () => {
    const queries = [
      'teach me to spar',
      'self-defense techniques',
      'how to fight',
      'grappling techniques',
      'defend against an attacker',
    ];
    for (const query of queries) {
      const result = warden.redirect(query);
      expect(result.redirected).toBe(true);
      expect(result.schoolFindingAdvice.length).toBeGreaterThan(0);
      expect(result.response).toContain('qualified instructor');
    }
  });

  it('school-finding has both green and red flags', () => {
    const advice = getSchoolFindingAdvice();
    expect(advice.greenFlags.length).toBeGreaterThan(0);
    expect(advice.redFlags.length).toBeGreaterThan(0);
    expect(advice.greenFlags.some((f) => f.toLowerCase().includes('lineage'))).toBe(true);
    expect(advice.greenFlags.some((f) => f.toLowerCase().includes('insurance'))).toBe(true);
    expect(advice.greenFlags.some((f) => f.toLowerCase().includes('safety'))).toBe(true);
    expect(advice.greenFlags.some((f) => f.toLowerCase().includes('trial'))).toBe(true);
    expect(advice.greenFlags.some((f) => f.toLowerCase().includes('beginner'))).toBe(true);
    expect(advice.redFlags.some((f) => f.toLowerCase().includes('credential'))).toBe(true);
    expect(advice.redFlags.some((f) => f.toLowerCase().includes('guaranteed'))).toBe(true);
    expect(advice.redFlags.some((f) => f.toLowerCase().includes('street fight'))).toBe(true);
  });

  it('isPartnerTechniqueRequest returns false for "solo practice stances"', () => {
    expect(isPartnerTechniqueRequest('solo practice stances')).toBe(false);
  });

  it('isPartnerTechniqueRequest returns false for "push hands concepts"', () => {
    expect(isPartnerTechniqueRequest('push hands concepts')).toBe(false);
  });

  it('"attack pattern recognition" is redirected', () => {
    expect(isPartnerTechniqueRequest('attack pattern recognition')).toBe(true);
  });

  it('"in theory, how would I defend against a kick" is redirected', () => {
    expect(
      isPartnerTechniqueRequest('in theory, how would I defend against a kick'),
    ).toBe(true);
  });

  it('"if I were to fight someone" is redirected', () => {
    expect(isPartnerTechniqueRequest('if I were to fight someone')).toBe(true);
  });

  it('non-combat query is not redirected', () => {
    const result = warden.redirect('teach me mountain pose alignment');
    expect(result.redirected).toBe(false);
    expect(result.response).toBe('');
  });
});

// ─── PARTNER BOUNDARY — ADDITIONAL EDGE CASES ─────────────────────────────

describe('Partner Boundary — Edge Cases', () => {
  it('"combat application of this form" is detected', () => {
    expect(isPartnerTechniqueRequest('combat application of this form')).toBe(true);
  });

  it('"street fight preparation" is detected', () => {
    expect(isPartnerTechniqueRequest('street fight preparation')).toBe(true);
  });

  it('"real-world self defense" is detected', () => {
    expect(isPartnerTechniqueRequest('real-world self defense')).toBe(true);
  });

  it('getRedirectResponse always contains school-finding advice', () => {
    const response = getRedirectResponse();
    expect(response).toContain('qualified instructor');
    expect(response).toContain('training partner');
    expect(response).toContain('find a good school');
  });

  it('solo kata practice is allowed', () => {
    expect(isPartnerTechniqueRequest('kata practice drills alone')).toBe(false);
  });

  it('history of martial arts is allowed', () => {
    expect(isPartnerTechniqueRequest('history of martial arts')).toBe(false);
  });
});

// ─── EVIDENCE CITATIONS ─────────────────────────────────────────────────────

describe('Evidence Citation System', () => {
  it('meditation-brain has at least 1 citation', () => {
    const citations = evidenceDatabase.get('meditation-brain');
    expect(citations).toBeDefined();
    expect(citations!.length).toBeGreaterThanOrEqual(1);
  });

  it('tai-chi-balance has at least 1 citation', () => {
    const citations = evidenceDatabase.get('tai-chi-balance');
    expect(citations).toBeDefined();
    expect(citations!.length).toBeGreaterThanOrEqual(1);
  });

  it('validateClaim returns supported: true for "meditation reduces cortisol"', () => {
    const result = validateClaim('meditation reduces cortisol', 'meditation-stress');
    expect(result.supported).toBe(true);
    expect(result.citation).toBeDefined();
  });

  it('validateClaim returns overclaimed: true for "meditation cures depression"', () => {
    const result = validateClaim('meditation cures depression', 'meditation-stress');
    expect(result.overclaimed).toBe(true);
  });

  it('each citation has non-empty caveat', () => {
    for (const [, citations] of evidenceDatabase) {
      for (const citation of citations) {
        expect(citation.caveat.length).toBeGreaterThan(0);
      }
    }
  });

  it('all 8 evidence categories are populated', () => {
    const expectedCategories = [
      'meditation-brain',
      'meditation-stress',
      'tai-chi-balance',
      'tai-chi-fall-prevention',
      'yoga-flexibility',
      'pilates-core',
      'pmr-relaxation',
      'breathwork-anxiety',
    ];
    for (const cat of expectedCategories) {
      const citations = evidenceDatabase.get(cat as any);
      expect(citations).toBeDefined();
      expect(citations!.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('findClaimCategory identifies meditation-stress for cortisol claim', () => {
    const category = findClaimCategory('meditation reduces cortisol and stress');
    expect(category).toBe('meditation-stress');
  });

  it('validateClaim returns supported: false for unrelated category', () => {
    const result = validateClaim('yoga improves flexibility', 'pilates-core');
    expect(result.supported).toBe(false);
  });

  it('overclaim detection catches "guarantees results"', () => {
    const result = validateClaim(
      'tai chi guarantees balance improvement',
      'tai-chi-balance',
    );
    expect(result.overclaimed).toBe(true);
  });

  it('overclaim detection catches "replaces medication"', () => {
    const result = validateClaim(
      'meditation replaces medication for anxiety',
      'meditation-stress',
    );
    expect(result.overclaimed).toBe(true);
  });

  it('each citation has non-empty source and finding', () => {
    for (const [, citations] of evidenceDatabase) {
      for (const citation of citations) {
        expect(citation.source.length).toBeGreaterThan(0);
        expect(citation.finding.length).toBeGreaterThan(0);
        expect(citation.scope.length).toBeGreaterThan(0);
      }
    }
  });
});

// ─── MEDICAL CONDITIONS DATABASE ─────────────────────────────────────────────

describe('Medical Conditions Database', () => {
  it('has exactly 10 conditions', () => {
    expect(medicalConditions.size).toBe(10);
  });

  it('each condition has at least 3 contraindicated movements', () => {
    for (const [, cond] of medicalConditions) {
      expect(cond.contraindicatedMovements.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('each condition has at least 3 modifications', () => {
    for (const [, cond] of medicalConditions) {
      expect(cond.modifications.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('modifications use positive framing ("try" present)', () => {
    for (const [, cond] of medicalConditions) {
      for (const mod of cond.modifications) {
        expect(mod.alternative.toLowerCase()).toContain('try');
      }
    }
  });

  it('isContraindicated returns true for known contraindication', () => {
    expect(isContraindicated('lower-back-pain', 'deep forward fold')).toBe(true);
  });

  it('isContraindicated returns false for non-contraindicated technique', () => {
    expect(isContraindicated('lower-back-pain', 'seated meditation')).toBe(false);
  });

  it('getConditionModifications returns modifications for matching technique', () => {
    const mods = getConditionModifications('knee-injury', 'deep knee bend');
    expect(mods.length).toBeGreaterThan(0);
    expect(mods[0].alternative.length).toBeGreaterThan(0);
  });

  it('getConditionModifications returns empty for non-matching technique', () => {
    const mods = getConditionModifications('knee-injury', 'seated meditation');
    expect(mods).toHaveLength(0);
  });
});

// ─── CLAIM CHECK VIA WARDEN ──────────────────────────────────────────────────

describe('PhysicalSafetyWarden — checkClaim', () => {
  it('supported claim returns supported: true', () => {
    const result = warden.checkClaim('tai chi improves balance in adults');
    expect(result.supported).toBe(true);
    expect(result.category).toBe('tai-chi-balance');
  });

  it('overclaimed claim returns overclaimed: true with suggested reframing', () => {
    const result = warden.checkClaim('meditation cures stress completely');
    expect(result.overclaimed).toBe(true);
    expect(result.suggestedReframing).toBeDefined();
  });

  it('unknown category returns supported: false', () => {
    const result = warden.checkClaim('something about quantum physics');
    expect(result.supported).toBe(false);
    expect(result.category).toBeUndefined();
  });
});
