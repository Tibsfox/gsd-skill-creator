import { describe, it, expect } from 'vitest';

import { powerhouseConcept } from './powerhouse-concept.js';
import { sixPrinciples } from './six-principles.js';
import { theHundred } from './the-hundred.js';
import { rollUp } from './roll-up.js';
import { singleLegStretch } from './single-leg-stretch.js';
import { doubleLegStretch } from './double-leg-stretch.js';
import { spineStretch } from './spine-stretch.js';
import { swan } from './swan.js';
import { sideKickSeries } from './side-kick-series.js';
import { teaser } from './teaser.js';
import { neutralSpineAlignment } from './neutral-spine-alignment.js';
import { rehabApplications } from './rehab-applications.js';
import { allPilatesConcepts } from './index.js';

const exerciseConcepts = [
  { name: 'theHundred', concept: theHundred },
  { name: 'rollUp', concept: rollUp },
  { name: 'singleLegStretch', concept: singleLegStretch },
  { name: 'doubleLegStretch', concept: doubleLegStretch },
  { name: 'spineStretch', concept: spineStretch },
  { name: 'swan', concept: swan },
  { name: 'sideKickSeries', concept: sideKickSeries },
  { name: 'teaser', concept: teaser },
];

const allConcepts = [
  { name: 'powerhouseConcept', concept: powerhouseConcept },
  { name: 'sixPrinciples', concept: sixPrinciples },
  ...exerciseConcepts,
  { name: 'neutralSpineAlignment', concept: neutralSpineAlignment },
  { name: 'rehabApplications', concept: rehabApplications },
];

describe('Pilates wing concepts', () => {

  // ─── RosettaConcept Structure ─────────────────────────────────────────────

  describe('RosettaConcept structure', () => {
    it('all 12 concepts have valid RosettaConcept structure', () => {
      for (const { name, concept } of allConcepts) {
        expect(concept.id, `${name} should have an id`).toBeDefined();
        expect(concept.name, `${name} should have a name`).toBeTruthy();
        expect(concept.domain, `${name} should have domain`).toBe('mind-body');
        expect(concept.description, `${name} should have a description`).toBeTruthy();
        expect(concept.panels, `${name} should have panels Map`).toBeInstanceOf(Map);
        expect(concept.relationships, `${name} should have relationships array`).toBeInstanceOf(Array);
      }
    });

    it('all IDs start with mb-pilates-', () => {
      for (const { name, concept } of allConcepts) {
        expect(concept.id.startsWith('mb-pilates-'), `${name} id should start with mb-pilates-`).toBe(true);
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

    it('all concepts have complexPlanePosition', () => {
      for (const { name, concept } of allConcepts) {
        expect(concept.complexPlanePosition, `${name} should have complexPlanePosition`).toBeDefined();
        expect(concept.complexPlanePosition!.real).toBeGreaterThan(0);
        expect(concept.complexPlanePosition!.magnitude).toBeGreaterThan(0);
      }
    });
  });

  // ─── Powerhouse ────────────────────────────────────────────────────────────

  describe('Powerhouse concept', () => {
    it('mentions deep abdominals / transversus abdominis', () => {
      expect(powerhouseConcept.description.toLowerCase()).toMatch(/deep abdominal|transversus abdominis/i);
    });

    it('mentions pelvic floor', () => {
      expect(powerhouseConcept.description.toLowerCase()).toContain('pelvic floor');
    });

    it('mentions spinal stabilizers / multifidus', () => {
      expect(powerhouseConcept.description.toLowerCase()).toMatch(/spinal stabilizer|multifidus/i);
    });

    it('mentions Joseph Pilates', () => {
      expect(powerhouseConcept.description).toContain('Joseph Pilates');
    });
  });

  // ─── Six Principles ───────────────────────────────────────────────────────

  describe('Six principles', () => {
    it('names Concentration', () => {
      expect(sixPrinciples.description).toMatch(/Concentration/i);
    });

    it('names Control', () => {
      expect(sixPrinciples.description).toMatch(/Control/i);
    });

    it('names Centering', () => {
      expect(sixPrinciples.description).toMatch(/Centering/i);
    });

    it('names Precision', () => {
      expect(sixPrinciples.description).toMatch(/Precision/i);
    });

    it('names Breath', () => {
      expect(sixPrinciples.description).toMatch(/Breath/i);
    });

    it('names Flow', () => {
      expect(sixPrinciples.description).toMatch(/Flow/i);
    });

    it('mentions Contrology', () => {
      expect(sixPrinciples.description).toContain('Contrology');
    });
  });

  // ─── Exercise Concepts ────────────────────────────────────────────────────

  describe('Exercise concepts', () => {
    it('each exercise has a beginner modification', () => {
      for (const { name, concept } of exerciseConcepts) {
        expect(
          concept.description.toLowerCase(),
          `${name} should mention beginner modification`,
        ).toMatch(/beginner|modification|modify|modified/i);
      }
    });

    it('each exercise references the Powerhouse', () => {
      for (const { name, concept } of exerciseConcepts) {
        const ref = concept.relationships.find(
          r => r.targetId === 'mb-pilates-powerhouse',
        );
        expect(ref, `${name} should reference Powerhouse`).toBeDefined();
      }
    });

    it('The Hundred mentions 100 pumps', () => {
      expect(theHundred.description).toMatch(/100/);
    });

    it('Roll-Up mentions spinal articulation', () => {
      expect(rollUp.description.toLowerCase()).toContain('spinal articulation');
    });

    it('Swan mentions back extension', () => {
      expect(swan.description.toLowerCase()).toContain('back extension');
    });
  });

  // ─── Neutral Spine ────────────────────────────────────────────────────────

  describe('Neutral spine alignment', () => {
    it('describes natural curves of the spine', () => {
      expect(neutralSpineAlignment.description.toLowerCase()).toMatch(/natural curve|cervical|thoracic|lumbar/i);
    });

    it('mentions desk posture relevance for programmers', () => {
      expect(neutralSpineAlignment.description.toLowerCase()).toMatch(/desk|programmer|sitting/i);
    });
  });

  // ─── Rehabilitation Applications ──────────────────────────────────────────

  describe('Rehabilitation applications', () => {
    it('references anterior pelvic tilt', () => {
      expect(rehabApplications.description.toLowerCase()).toContain('anterior pelvic tilt');
    });

    it('references thoracic kyphosis', () => {
      expect(rehabApplications.description.toLowerCase()).toContain('thoracic kyphosis');
    });

    it('references weak gluteal muscles', () => {
      expect(rehabApplications.description.toLowerCase()).toMatch(/weak glute|gluteal/i);
    });

    it('references RSI', () => {
      expect(rehabApplications.description).toMatch(/RSI|repetitive strain/i);
    });

    it('references at least 3 conditions', () => {
      const desc = rehabApplications.description.toLowerCase();
      const conditions = [
        /anterior pelvic tilt/,
        /thoracic kyphosis/,
        /weak glute|gluteal/,
        /rsi|repetitive strain/,
      ];
      const matchCount = conditions.filter(re => re.test(desc)).length;
      expect(matchCount).toBeGreaterThanOrEqual(3);
    });
  });

  // ─── Cultural Context ────────────────────────────────────────────────────

  describe('Cultural context', () => {
    it('Powerhouse mentions Joseph Pilates', () => {
      expect(powerhouseConcept.description).toContain('Joseph Pilates');
    });

    it('Six principles mentions Contrology', () => {
      expect(sixPrinciples.description).toContain('Contrology');
    });

    it('Rehab applications mentions Joseph Pilates and WWI origin', () => {
      expect(rehabApplications.description).toContain('Joseph Pilates');
      expect(rehabApplications.description).toMatch(/WWI|World War I/i);
    });
  });

  // ─── Cross-References ────────────────────────────────────────────────────

  describe('Cross-references', () => {
    it('six principles references yoga breath-movement', () => {
      const ref = sixPrinciples.relationships.find(
        r => r.targetId.startsWith('mb-yoga-'),
      );
      expect(ref, 'should reference yoga module').toBeDefined();
    });

    it('rehab applications references recovery/relaxation', () => {
      const ref = rehabApplications.relationships.find(
        r => r.targetId.startsWith('mb-yoga-') || r.targetId.startsWith('mb-relaxation-'),
      );
      expect(ref, 'should reference yoga or relaxation module').toBeDefined();
    });
  });

  // ─── Barrel Export ────────────────────────────────────────────────────────

  describe('Barrel export', () => {
    it('allPilatesConcepts has exactly 12 entries', () => {
      expect(allPilatesConcepts).toHaveLength(12);
    });

    it('allPilatesConcepts contains all named concepts', () => {
      const ids = allPilatesConcepts.map(c => c.id);
      expect(ids).toContain('mb-pilates-powerhouse');
      expect(ids).toContain('mb-pilates-six-principles');
      expect(ids).toContain('mb-pilates-the-hundred');
      expect(ids).toContain('mb-pilates-roll-up');
      expect(ids).toContain('mb-pilates-single-leg-stretch');
      expect(ids).toContain('mb-pilates-double-leg-stretch');
      expect(ids).toContain('mb-pilates-spine-stretch');
      expect(ids).toContain('mb-pilates-swan');
      expect(ids).toContain('mb-pilates-side-kick-series');
      expect(ids).toContain('mb-pilates-teaser');
      expect(ids).toContain('mb-pilates-neutral-spine');
      expect(ids).toContain('mb-pilates-rehab-applications');
    });

    it('all concepts in allPilatesConcepts have unique IDs', () => {
      const ids = allPilatesConcepts.map(c => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });
});
