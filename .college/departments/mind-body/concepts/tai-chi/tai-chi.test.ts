import { describe, it, expect } from 'vitest';

import { taiChiPrinciples } from './tai-chi-principles.js';
import { zhanZhuang } from './zhan-zhuang.js';
import { beijing24Form } from './beijing-24-form.js';
import { pushHandsConcepts } from './push-hands-concepts.js';
import { healthResearch } from './health-research.js';
import { yinYangMovement } from './yin-yang-movement.js';
import { allTaiChiConcepts } from './index.js';

const allConcepts = [
  { name: 'taiChiPrinciples', concept: taiChiPrinciples },
  { name: 'zhanZhuang', concept: zhanZhuang },
  { name: 'beijing24Form', concept: beijing24Form },
  { name: 'pushHandsConcepts', concept: pushHandsConcepts },
  { name: 'healthResearch', concept: healthResearch },
  { name: 'yinYangMovement', concept: yinYangMovement },
];

describe('Tai Chi wing concepts', () => {
  // ─── Structure Validation ────────────────────────────────────────────────

  it('all 6 concepts export valid RosettaConcept structures', () => {
    for (const { name, concept } of allConcepts) {
      expect(concept.id, `${name} should have an id`).toBeDefined();
      expect(concept.id.startsWith('mb-tc-'), `${name} id should start with mb-tc-`).toBe(true);
      expect(concept.name, `${name} should have a name`).toBeTruthy();
      expect(concept.domain, `${name} should have domain`).toBe('mind-body');
      expect(concept.description, `${name} should have a description`).toBeTruthy();
      expect(concept.panels, `${name} should have panels Map`).toBeInstanceOf(Map);
      expect(concept.relationships, `${name} should have relationships array`).toBeInstanceOf(Array);
    }
  });

  it('all concepts have at least 1 relationship', () => {
    for (const { name, concept } of allConcepts) {
      expect(
        concept.relationships.length,
        `${name} should have >= 1 relationship`,
      ).toBeGreaterThanOrEqual(1);
    }
  });

  it('all concept IDs are unique', () => {
    const ids = allConcepts.map(c => c.concept.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('allTaiChiConcepts has exactly 6 entries', () => {
    expect(allTaiChiConcepts).toHaveLength(6);
  });

  // ─── Content Validation ──────────────────────────────────────────────────

  it('principles concept mentions song (relaxation)', () => {
    expect(taiChiPrinciples.description).toMatch(/[Ss]ong/);
    expect(taiChiPrinciples.description).toMatch(/松/);
  });

  it('principles concept mentions root/rootedness', () => {
    expect(taiChiPrinciples.description).toMatch(/[Rr]oot/);
  });

  it('principles concept mentions central equilibrium (zhong ding)', () => {
    expect(taiChiPrinciples.description).toMatch(/[Cc]entral [Ee]quilibrium/);
    expect(taiChiPrinciples.description).toMatch(/中定/);
  });

  it('Zhan Zhuang describes standing meditation practice', () => {
    expect(zhanZhuang.description).toMatch(/站桩/);
    expect(zhanZhuang.description).toMatch(/standing/i);
    expect(zhanZhuang.description).toMatch(/tree/i);
  });

  it('Beijing 24 Form names 8+ movements', () => {
    const formDesc = beijing24Form.description;
    // Count numbered movements (1. through 24.)
    const numberMatches = formDesc.match(/\d+\.\s+\w/g);
    expect(numberMatches, 'form should have numbered movements').not.toBeNull();
    expect(numberMatches!.length).toBeGreaterThanOrEqual(8);
  });

  it('Beijing 24 Form includes specific named movements', () => {
    const desc = beijing24Form.description;
    expect(desc).toMatch(/Commencing Form/i);
    expect(desc).toMatch(/Wild Horse/i);
    expect(desc).toMatch(/White Crane/i);
    expect(desc).toMatch(/Brush Knee/i);
  });

  it('push hands concept is CONCEPTUAL -- no technique instructions', () => {
    const desc = pushHandsConcepts.description.toLowerCase();
    expect(desc).toMatch(/concept/);
    expect(desc).toMatch(/principle/);
    // Must NOT contain step-by-step partner technique instructions
    expect(desc).not.toMatch(/grab your partner/);
    expect(desc).not.toMatch(/push your partner/);
    expect(desc).not.toMatch(/step 1.*step 2.*partner/);
  });

  it('push hands concept explicitly states it is principles only', () => {
    expect(pushHandsConcepts.description).toMatch(/PRINCIPLES ONLY/i);
  });

  it('health research cites at least 2 sources', () => {
    const desc = healthResearch.description;
    const sourcePatterns = [
      /Cochrane/i,
      /Harvard/i,
      /PMC/i,
      /Canadian Family Physician/i,
      /systematic review/i,
      /peer-reviewed/i,
    ];
    let matchCount = 0;
    for (const pattern of sourcePatterns) {
      if (pattern.test(desc)) matchCount++;
    }
    expect(matchCount, 'health research should cite at least 2 sources').toBeGreaterThanOrEqual(2);
  });

  it('health research covers fall prevention', () => {
    expect(healthResearch.description).toMatch(/fall prevention/i);
  });

  it('health research covers balance improvement', () => {
    expect(healthResearch.description).toMatch(/balance/i);
  });

  it('yin-yang concept explains complementary opposites in movement', () => {
    const desc = yinYangMovement.description;
    expect(desc).toMatch(/forward/i);
    expect(desc).toMatch(/backward/i);
    expect(desc).toMatch(/rising/i);
    expect(desc).toMatch(/sinking/i);
    expect(desc).toMatch(/expand/i);
    expect(desc).toMatch(/gather/i);
  });

  it('yin-yang concept includes Chinese characters', () => {
    expect(yinYangMovement.description).toMatch(/阴阳/);
  });

  // ─── SAFETY BOUNDARY TESTS (CRITICAL) ───────────────────────────────────

  it('NO concept description contains "sparring partner"', () => {
    for (const { name, concept } of allConcepts) {
      expect(
        concept.description.toLowerCase(),
        `${name} must not contain "sparring partner"`,
      ).not.toMatch(/sparring partner/);
    }
  });

  it('NO concept description contains "attack your opponent"', () => {
    for (const { name, concept } of allConcepts) {
      expect(
        concept.description.toLowerCase(),
        `${name} must not contain "attack your opponent"`,
      ).not.toMatch(/attack your opponent/);
    }
  });

  it('NO concept description contains "strike the opponent"', () => {
    for (const { name, concept } of allConcepts) {
      expect(
        concept.description.toLowerCase(),
        `${name} must not contain "strike the opponent"`,
      ).not.toMatch(/strike the opponent/);
    }
  });

  it('NO concept description contains "self-defense technique"', () => {
    for (const { name, concept } of allConcepts) {
      expect(
        concept.description.toLowerCase(),
        `${name} must not contain "self-defense technique"`,
      ).not.toMatch(/self-defense technique/);
    }
  });

  it('NO concept contains partner technique instructions', () => {
    for (const { name, concept } of allConcepts) {
      const desc = concept.description.toLowerCase();
      expect(desc, `${name} must not contain "grab your partner"`).not.toMatch(/grab your partner/);
      expect(desc, `${name} must not contain "with your partner"`).not.toMatch(/with your partner/);
      expect(desc, `${name} must not contain "your opponent"`).not.toMatch(/your opponent/);
    }
  });

  it('push hands is described as conceptual only', () => {
    const desc = pushHandsConcepts.description.toLowerCase();
    expect(desc).toMatch(/conceptual/);
    expect(desc).not.toMatch(/sparring/);
  });
});
