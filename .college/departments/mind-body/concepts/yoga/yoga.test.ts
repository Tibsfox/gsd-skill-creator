import { describe, it, expect } from 'vitest';

import { mountainTadasana } from './mountain-tadasana.js';
import { downwardDog } from './downward-dog.js';
import { warriorPoses } from './warrior-poses.js';
import { treeVrksasana } from './tree-vrksasana.js';
import { childsPoseBalasana } from './childs-pose-balasana.js';
import { corpseSavasana } from './corpse-savasana.js';
import { forwardFold } from './forward-fold.js';
import { sunSalutation } from './sun-salutation.js';
import { breathMovementLinking } from './breath-movement-linking.js';
import { yogaStylesOverview } from './yoga-styles-overview.js';
import { allYogaConcepts } from './index.js';

const poseConcepts = [
  { name: 'mountainTadasana', concept: mountainTadasana },
  { name: 'downwardDog', concept: downwardDog },
  { name: 'warriorPoses', concept: warriorPoses },
  { name: 'treeVrksasana', concept: treeVrksasana },
  { name: 'childsPoseBalasana', concept: childsPoseBalasana },
  { name: 'corpseSavasana', concept: corpseSavasana },
  { name: 'forwardFold', concept: forwardFold },
];

const allConcepts = [
  ...poseConcepts,
  { name: 'sunSalutation', concept: sunSalutation },
  { name: 'breathMovementLinking', concept: breathMovementLinking },
  { name: 'yogaStylesOverview', concept: yogaStylesOverview },
];

describe('Yoga wing concepts', () => {

  // ─── RosettaConcept Structure ─────────────────────────────────────────────

  describe('RosettaConcept structure', () => {
    it('all 10 concepts have valid RosettaConcept structure', () => {
      for (const { name, concept } of allConcepts) {
        expect(concept.id, `${name} should have an id`).toBeDefined();
        expect(concept.name, `${name} should have a name`).toBeTruthy();
        expect(concept.domain, `${name} should have domain`).toBe('mind-body');
        expect(concept.description, `${name} should have a description`).toBeTruthy();
        expect(concept.panels, `${name} should have panels Map`).toBeInstanceOf(Map);
        expect(concept.relationships, `${name} should have relationships array`).toBeInstanceOf(Array);
      }
    });

    it('all IDs start with mb-yoga-', () => {
      for (const { name, concept } of allConcepts) {
        expect(concept.id.startsWith('mb-yoga-'), `${name} id should start with mb-yoga-`).toBe(true);
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

  // ─── Sanskrit Terms ─────────────────────────────────────────────────────

  describe('Sanskrit terminology', () => {
    it('Mountain pose includes Tadasana', () => {
      expect(mountainTadasana.description).toContain('Tadasana');
      expect(mountainTadasana.description).toMatch(/tada.*mountain/i);
    });

    it('Downward Dog includes Adho Mukha Svanasana', () => {
      expect(downwardDog.description).toContain('Adho Mukha Svanasana');
      expect(downwardDog.description).toMatch(/svana.*dog/i);
    });

    it('Warrior Poses include Virabhadrasana', () => {
      expect(warriorPoses.description).toContain('Virabhadrasana');
      expect(warriorPoses.description).toMatch(/vira.*hero|warrior/i);
    });

    it('Tree Pose includes Vrksasana', () => {
      expect(treeVrksasana.description).toContain('Vrksasana');
      expect(treeVrksasana.description).toMatch(/vrksa.*tree/i);
    });

    it('Child\'s Pose includes Balasana', () => {
      expect(childsPoseBalasana.description).toContain('Balasana');
      expect(childsPoseBalasana.description).toMatch(/bala.*child/i);
    });

    it('Corpse Pose includes Savasana', () => {
      expect(corpseSavasana.description).toContain('Savasana');
      expect(corpseSavasana.description).toMatch(/sava.*corpse/i);
    });

    it('Forward Fold includes Uttanasana', () => {
      expect(forwardFold.description).toContain('Uttanasana');
    });
  });

  // ─── Sun Salutation ───────────────────────────────────────────────────────

  describe('Sun Salutation', () => {
    it('describes 12 positions', () => {
      const desc = sunSalutation.description;
      // Check for numbered positions (1) through (12)
      for (let i = 1; i <= 12; i++) {
        expect(desc, `should mention position ${i}`).toContain(`(${i})`);
      }
    });

    it('includes Sanskrit name Surya Namaskar', () => {
      expect(sunSalutation.description).toContain('Surya Namaskar');
    });

    it('includes breath cues (inhale/exhale)', () => {
      expect(sunSalutation.description).toMatch(/inhale/i);
      expect(sunSalutation.description).toMatch(/exhale/i);
    });

    it('references breath-movement linking', () => {
      const ref = sunSalutation.relationships.find(
        r => r.targetId === 'mb-yoga-breath-movement-linking',
      );
      expect(ref).toBeDefined();
    });
  });

  // ─── Styles Overview ──────────────────────────────────────────────────────

  describe('Styles overview', () => {
    it('mentions Hatha', () => {
      expect(yogaStylesOverview.description).toContain('Hatha');
    });

    it('mentions Vinyasa', () => {
      expect(yogaStylesOverview.description).toContain('Vinyasa');
    });

    it('mentions Ashtanga', () => {
      expect(yogaStylesOverview.description).toContain('Ashtanga');
    });

    it('mentions Yin', () => {
      expect(yogaStylesOverview.description).toContain('Yin');
    });

    it('mentions Restorative', () => {
      expect(yogaStylesOverview.description).toContain('Restorative');
    });
  });

  // ─── Safety Modifications ────────────────────────────────────────────────

  describe('Safety modifications', () => {
    it('each pose concept includes safety modifications', () => {
      for (const { name, concept } of poseConcepts) {
        expect(
          concept.description.toLowerCase(),
          `${name} should mention modification`,
        ).toMatch(/modif|safety/i);
      }
    });

    it('sun salutation includes safety modifications', () => {
      expect(sunSalutation.description.toLowerCase()).toMatch(/modif|safety/i);
    });

    it('breath-movement linking includes safety note', () => {
      expect(breathMovementLinking.description.toLowerCase()).toMatch(/modif|safety/i);
    });
  });

  // ─── Cross-References ────────────────────────────────────────────────────

  describe('Cross-references', () => {
    it('breath-movement linking references breath module', () => {
      const ref = breathMovementLinking.relationships.find(
        r => r.targetId.startsWith('mb-breath-'),
      );
      expect(ref, 'should reference breath module').toBeDefined();
    });

    it('tree pose references breath module', () => {
      const ref = treeVrksasana.relationships.find(
        r => r.targetId.startsWith('mb-breath-'),
      );
      expect(ref, 'should reference breath module').toBeDefined();
    });

    it('warrior poses reference pilates (complementary)', () => {
      const ref = warriorPoses.relationships.find(
        r => r.targetId.startsWith('mb-pilates-'),
      );
      expect(ref, 'should reference pilates module').toBeDefined();
    });
  });

  // ─── Barrel Export ────────────────────────────────────────────────────────

  describe('Barrel export', () => {
    it('allYogaConcepts has exactly 10 entries', () => {
      expect(allYogaConcepts).toHaveLength(10);
    });

    it('allYogaConcepts contains all named concepts', () => {
      const ids = allYogaConcepts.map(c => c.id);
      expect(ids).toContain('mb-yoga-mountain-tadasana');
      expect(ids).toContain('mb-yoga-downward-dog');
      expect(ids).toContain('mb-yoga-warrior-poses');
      expect(ids).toContain('mb-yoga-tree-vrksasana');
      expect(ids).toContain('mb-yoga-childs-pose-balasana');
      expect(ids).toContain('mb-yoga-corpse-savasana');
      expect(ids).toContain('mb-yoga-forward-fold');
      expect(ids).toContain('mb-yoga-sun-salutation');
      expect(ids).toContain('mb-yoga-breath-movement-linking');
      expect(ids).toContain('mb-yoga-styles-overview');
    });

    it('all concepts in allYogaConcepts have unique IDs', () => {
      const ids = allYogaConcepts.map(c => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });
});
