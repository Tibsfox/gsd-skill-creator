/**
 * Content Accuracy Cross-Cutting Tests
 *
 * Verifies that all health claims are citation-backed, cultural attributions
 * are historically accurate, and no content overclaims beyond evidence scope.
 *
 * Tests cover: Yoga Sutras 8 limbs, Pilates 6 principles, kung fu etymology,
 * PMR attribution, Zen attribution, evidence citations, and overclaim detection.
 *
 * @module departments/mind-body/tests/content-accuracy
 */

import { describe, it, expect } from 'vitest';
import {
  evidenceDatabase,
  validateClaim,
  findClaimCategory,
} from '../safety/evidence-citations.js';
import { PhysicalSafetyWarden } from '../safety/physical-safety-warden.js';
import { yogaSutrasPatanjali } from '../concepts/philosophy/yoga-sutras-patanjali.js';
import { sixPrinciples } from '../concepts/pilates/six-principles.js';
import { historyPhilosophy } from '../concepts/martial-arts/history-philosophy.js';
import { progressiveMuscleRelaxation } from '../concepts/relaxation/progressive-muscle-relaxation.js';
import { zenPhilosophy } from '../concepts/philosophy/zen-philosophy.js';
import { healthResearch } from '../concepts/tai-chi/health-research.js';
import { nervousSystem } from '../concepts/relaxation/nervous-system.js';
import { DisciplineBrowser } from '../browse/discipline-browser.js';
import { checkCulturalBalance } from '../cultural-framework.js';

const warden = new PhysicalSafetyWarden();

// ============================================================================
// YOGA SUTRAS — 8 LIMBS CORRECTLY LISTED
// ============================================================================

describe('Content Accuracy: Yoga Sutras 8 Limbs', () => {
  const desc = yogaSutrasPatanjali.description;

  it('lists all 8 limbs in correct order', () => {
    const eightLimbs = [
      'Yama',
      'Niyama',
      'Asana',
      'Pranayama',
      'Pratyahara',
      'Dharana',
      'Dhyana',
      'Samadhi',
    ];

    for (const limb of eightLimbs) {
      expect(desc).toContain(limb);
    }
  });

  it('labels the system as eight-limbed (Ashtanga)', () => {
    expect(desc).toContain('eight');
    // Should reference 8 limbs
    const limbCount = (desc.match(/\(\d\)/g) || []).length;
    expect(limbCount).toBe(8);
  });

  it('correctly dates Patanjali (c. 200 BCE - 200 CE range)', () => {
    expect(desc).toMatch(/200\s*BCE/);
    expect(desc).toMatch(/200\s*CE/);
  });

  it('notes asana is one limb of eight, not the whole system', () => {
    expect(desc).toContain('limb three of eight');
  });
});

// ============================================================================
// PILATES — 6 PRINCIPLES CORRECTLY NAMED
// ============================================================================

describe('Content Accuracy: Pilates 6 Principles', () => {
  const desc = sixPrinciples.description;

  it('names all 6 principles', () => {
    const principles = [
      'Concentration',
      'Control',
      'Centering',
      'Precision',
      'Breath',
      'Flow',
    ];

    for (const principle of principles) {
      expect(desc).toContain(principle);
    }
  });

  it('attributes to Joseph Pilates', () => {
    expect(desc).toContain('Joseph Pilates');
  });

  it('mentions original name "Contrology"', () => {
    expect(desc).toContain('Contrology');
  });

  it('references Pilates Method Alliance (PMA)', () => {
    expect(desc).toContain('PMA');
  });
});

// ============================================================================
// KUNG FU ETYMOLOGY
// ============================================================================

describe('Content Accuracy: Kung Fu Etymology', () => {
  const desc = historyPhilosophy.description;

  it('includes Chinese characters for kung fu', () => {
    expect(desc).toContain('\u529F\u592B'); // 功夫
  });

  it('correctly defines kung fu as "skill through hard work"', () => {
    expect(desc.toLowerCase()).toContain('skill achieved through hard work');
  });

  it('clarifies kung fu does not specifically mean fighting', () => {
    expect(desc).toContain('does not specifically mean fighting');
  });

  it('mentions the broader application (calligrapher, chef, musician)', () => {
    expect(desc).toContain('calligrapher');
    expect(desc).toContain('chef');
    expect(desc).toContain('musician');
  });
});

// ============================================================================
// PMR ATTRIBUTION
// ============================================================================

describe('Content Accuracy: PMR Attribution', () => {
  const desc = progressiveMuscleRelaxation.description;

  it('attributes PMR to Dr. Edmund Jacobson', () => {
    expect(desc).toContain('Jacobson');
  });

  it('dates Jacobson\'s work to 1920s-1930s range', () => {
    // The concept says "1920s" in the description
    expect(desc).toMatch(/192\d/);
  });

  it('mentions Bernstein & Borkovec standardization', () => {
    expect(desc).toContain('Bernstein');
    expect(desc).toContain('Borkovec');
  });

  it('cites American Academy of Sleep Medicine evidence', () => {
    expect(desc).toContain('American Academy of Sleep Medicine');
  });
});

// ============================================================================
// ZEN ATTRIBUTION
// ============================================================================

describe('Content Accuracy: Zen Attribution', () => {
  const desc = zenPhilosophy.description;

  it('attributes beginner\'s mind quote to Shunryu Suzuki', () => {
    expect(desc).toContain('Suzuki');
    expect(desc).toContain('Zen Mind');
  });

  it('dates Suzuki\'s book to 1970', () => {
    expect(desc).toContain('1970');
  });

  it('traces Chan/Zen origin to China, 6th century', () => {
    expect(desc).toContain('6th century');
    expect(desc).toContain('China');
  });

  it('includes shoshin concept with Japanese characters', () => {
    expect(desc).toContain('shoshin');
  });
});

// ============================================================================
// EVIDENCE CITATIONS — COMPLETENESS
// ============================================================================

describe('Content Accuracy: Evidence Citations', () => {
  it('all 8 evidence categories exist and have citations', () => {
    const categories = [
      'meditation-brain',
      'meditation-stress',
      'tai-chi-balance',
      'tai-chi-fall-prevention',
      'yoga-flexibility',
      'pilates-core',
      'pmr-relaxation',
      'breathwork-anxiety',
    ];

    for (const cat of categories) {
      const citations = evidenceDatabase.get(cat as any);
      expect(citations, `Category ${cat} should exist`).toBeDefined();
      expect(citations!.length, `Category ${cat} should have citations`).toBeGreaterThanOrEqual(1);
    }
  });

  it('every citation has non-empty source, finding, scope, and caveat', () => {
    for (const [category, citations] of evidenceDatabase) {
      for (const citation of citations) {
        expect(citation.source.length, `${category} source`).toBeGreaterThan(0);
        expect(citation.finding.length, `${category} finding`).toBeGreaterThan(0);
        expect(citation.scope.length, `${category} scope`).toBeGreaterThan(0);
        expect(citation.caveat.length, `${category} caveat`).toBeGreaterThan(0);
      }
    }
  });

  it('every citation has a positive year value', () => {
    for (const [, citations] of evidenceDatabase) {
      for (const citation of citations) {
        expect(citation.year).toBeGreaterThan(0);
      }
    }
  });
});

// ============================================================================
// OVERCLAIM DETECTION — NO OVERCLAIMING
// ============================================================================

describe('Content Accuracy: Overclaim Detection', () => {
  it('"reduces cortisol" is supported (not overclaimed)', () => {
    const result = validateClaim('meditation reduces cortisol', 'meditation-stress');
    expect(result.supported).toBe(true);
    expect(result.overclaimed).toBe(false);
  });

  it('"cures anxiety" is detected as overclaimed', () => {
    const result = validateClaim('meditation cures anxiety', 'meditation-stress');
    expect(result.overclaimed).toBe(true);
  });

  it('"eliminates stress permanently" is detected as overclaimed', () => {
    const result = validateClaim(
      'yoga eliminates stress permanently',
      'yoga-flexibility',
    );
    expect(result.overclaimed).toBe(true);
  });

  it('"guarantees results" is detected as overclaimed', () => {
    const result = validateClaim(
      'tai chi guarantees balance improvement',
      'tai-chi-balance',
    );
    expect(result.overclaimed).toBe(true);
  });

  it('"replaces medication" is detected as overclaimed', () => {
    const result = validateClaim(
      'breathwork replaces medication for anxiety',
      'breathwork-anxiety',
    );
    expect(result.overclaimed).toBe(true);
  });

  it('warden checkClaim returns supported for valid tai chi balance claim', () => {
    const result = warden.checkClaim('tai chi improves balance in adults');
    expect(result.supported).toBe(true);
    expect(result.overclaimed).toBe(false);
    expect(result.category).toBe('tai-chi-balance');
  });

  it('warden checkClaim returns overclaimed with suggested reframing for overclaim', () => {
    const result = warden.checkClaim('meditation cures stress completely');
    expect(result.overclaimed).toBe(true);
    expect(result.suggestedReframing).toBeDefined();
    expect(result.suggestedReframing!).toContain('evidence scope');
  });
});

// ============================================================================
// CONTENT BALANCE — NO MYSTIFICATION OR TRIVIALIZATION
// ============================================================================

describe('Content Accuracy: Cultural Content Balance', () => {
  const browser = new DisciplineBrowser();

  it('discipline browser history text passes cultural balance check', () => {
    const disciplines = browser.getAllDisciplines();
    for (const discipline of disciplines) {
      const historyCheck = checkCulturalBalance(discipline.history);
      expect(
        historyCheck.balanced,
        `${discipline.name} history failed cultural balance: ${historyCheck.issues.join('; ')}`,
      ).toBe(true);
    }
  });

  it('discipline browser philosophy text passes cultural balance check', () => {
    const disciplines = browser.getAllDisciplines();
    for (const discipline of disciplines) {
      const philosophyCheck = checkCulturalBalance(discipline.philosophy);
      expect(
        philosophyCheck.balanced,
        `${discipline.name} philosophy failed cultural balance: ${philosophyCheck.issues.join('; ')}`,
      ).toBe(true);
    }
  });
});
