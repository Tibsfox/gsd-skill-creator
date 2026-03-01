import { describe, it, expect } from 'vitest';

import { historyPhilosophy } from './history-philosophy.js';
import { hardSoftDistinction } from './hard-soft-distinction.js';
import { internalExternal } from './internal-external.js';
import { martialVirtues } from './martial-virtues.js';
import { horseStance } from './horse-stance.js';
import { bowStance } from './bow-stance.js';
import { catStance } from './cat-stance.js';
import { basicStrikes } from './basic-strikes.js';
import { basicBlocks } from './basic-blocks.js';
import { simpleForm } from './simple-form.js';
import { styleOverview } from './style-overview.js';
import { allMartialArtsConcepts } from './index.js';

const allConcepts = [
  { name: 'historyPhilosophy', concept: historyPhilosophy },
  { name: 'hardSoftDistinction', concept: hardSoftDistinction },
  { name: 'internalExternal', concept: internalExternal },
  { name: 'martialVirtues', concept: martialVirtues },
  { name: 'horseStance', concept: horseStance },
  { name: 'bowStance', concept: bowStance },
  { name: 'catStance', concept: catStance },
  { name: 'basicStrikes', concept: basicStrikes },
  { name: 'basicBlocks', concept: basicBlocks },
  { name: 'simpleForm', concept: simpleForm },
  { name: 'styleOverview', concept: styleOverview },
];

describe('Martial Arts wing concepts', () => {
  // ─── Structure Validation ────────────────────────────────────────────────

  it('all 11 concepts export valid RosettaConcept structures', () => {
    for (const { name, concept } of allConcepts) {
      expect(concept.id, `${name} should have an id`).toBeDefined();
      expect(concept.id.startsWith('mb-ma-'), `${name} id should start with mb-ma-`).toBe(true);
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

  it('allMartialArtsConcepts has exactly 11 entries', () => {
    expect(allMartialArtsConcepts).toHaveLength(11);
  });

  // ─── Content Validation ──────────────────────────────────────────────────

  it('history concept mentions Shaolin', () => {
    expect(historyPhilosophy.description).toMatch(/Shaolin/);
  });

  it('history concept includes kung fu etymology (功夫)', () => {
    expect(historyPhilosophy.description).toMatch(/功夫/);
  });

  it('hard/soft concept defines both hard and soft styles', () => {
    expect(hardSoftDistinction.description).toMatch(/[Hh]ard/);
    expect(hardSoftDistinction.description).toMatch(/[Ss]oft/);
  });

  it('internal/external concept explains body-first and mind-first approaches', () => {
    expect(internalExternal.description).toMatch(/body/i);
    expect(internalExternal.description).toMatch(/mind/i);
    expect(internalExternal.description).toMatch(/external/i);
    expect(internalExternal.description).toMatch(/internal/i);
  });

  it('martial virtues mentions both Bushido and Wude', () => {
    expect(martialVirtues.description).toMatch(/Bushido/);
    expect(martialVirtues.description).toMatch(/Wude/);
  });

  it('horse stance includes alignment cues', () => {
    expect(horseStance.description).toMatch(/feet/i);
    expect(horseStance.description).toMatch(/shoulder/i);
    expect(horseStance.description).toMatch(/knee|thigh|hip/i);
  });

  it('bow stance includes alignment cues', () => {
    expect(bowStance.description).toMatch(/knee/i);
    expect(bowStance.description).toMatch(/ankle/i);
    expect(bowStance.description).toMatch(/weight/i);
  });

  it('cat stance includes alignment cues', () => {
    expect(catStance.description).toMatch(/weight/i);
    expect(catStance.description).toMatch(/back leg/i);
    expect(catStance.description).toMatch(/front foot/i);
  });

  it('style overview mentions 6+ distinct traditions', () => {
    const traditions = [
      /Chinese/i,
      /Japanese/i,
      /Korean/i,
      /Southeast Asian|Thai|Silat/i,
      /Brazil/i,
      /Modern|MMA|Krav Maga/i,
    ];
    for (const tradition of traditions) {
      expect(styleOverview.description).toMatch(tradition);
    }
  });

  it('simple form has 8+ named movements in description', () => {
    // Count numbered movements (1. through 10.)
    const movementNumbers = styleOverview.description ? [] : [];
    const formDesc = simpleForm.description;
    const numberMatches = formDesc.match(/\d+\.\s+\w/g);
    expect(numberMatches, 'form should have numbered movements').not.toBeNull();
    expect(numberMatches!.length).toBeGreaterThanOrEqual(8);
  });

  it('stances include Chinese terminology', () => {
    expect(horseStance.description).toMatch(/馬步|mǎ bù/);
    expect(bowStance.description).toMatch(/弓步|gōng bù/);
    expect(catStance.description).toMatch(/虛步|xū bù/);
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

  it('simple form is described as solo practice', () => {
    expect(simpleForm.description.toLowerCase()).toMatch(/solo/);
  });

  it('simple form does NOT contain partner instructions', () => {
    const desc = simpleForm.description.toLowerCase();
    expect(desc).not.toMatch(/with a partner/);
    expect(desc).not.toMatch(/your opponent/);
    expect(desc).not.toMatch(/sparring/);
  });
});
