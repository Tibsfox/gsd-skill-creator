import { describe, it, expect } from 'vitest';

import { mindfulnessVipassana } from './mindfulness-vipassana.js';
import { concentrationSamatha } from './concentration-samatha.js';
import { zazen } from './zazen.js';
import { bodyScan } from './body-scan.js';
import { walkingMeditationKinhin } from './walking-meditation-kinhin.js';
import { lovingKindnessMetta } from './loving-kindness-metta.js';
import { allMeditationConcepts } from './index.js';

import { firstFiveMinutes } from '../../try-sessions/first-five-minutes.js';

const concepts = [
  { name: 'mindfulnessVipassana', concept: mindfulnessVipassana },
  { name: 'concentrationSamatha', concept: concentrationSamatha },
  { name: 'zazen', concept: zazen },
  { name: 'bodyScan', concept: bodyScan },
  { name: 'walkingMeditationKinhin', concept: walkingMeditationKinhin },
  { name: 'lovingKindnessMetta', concept: lovingKindnessMetta },
];

describe('Meditation wing concepts', () => {

  // ─── Structural validation ────────────────────────────────────────────────

  it('each concept has a valid RosettaConcept structure', () => {
    for (const { name, concept } of concepts) {
      expect(concept.id, `${name} should have an id`).toBeDefined();
      expect(concept.name, `${name} should have a name`).toBeTruthy();
      expect(concept.domain, `${name} should have a domain`).toBeTruthy();
      expect(concept.description, `${name} should have a description`).toBeTruthy();
      expect(concept.panels, `${name} should have panels Map`).toBeInstanceOf(Map);
      expect(concept.relationships, `${name} should have relationships array`).toBeInstanceOf(Array);
    }
  });

  it('all concept IDs start with mb-med-', () => {
    for (const { name, concept } of concepts) {
      expect(concept.id.startsWith('mb-med-'), `${name} id "${concept.id}" should start with mb-med-`).toBe(true);
    }
  });

  it('all concepts have domain mind-body', () => {
    for (const { name, concept } of concepts) {
      expect(concept.domain, `${name} domain`).toBe('mind-body');
    }
  });

  it('each concept has at least 1 relationship', () => {
    for (const { name, concept } of concepts) {
      expect(concept.relationships.length, `${name} should have >= 1 relationship`).toBeGreaterThanOrEqual(1);
    }
  });

  // ─── Barrel export ────────────────────────────────────────────────────────

  it('allMeditationConcepts array has exactly 6 entries', () => {
    expect(allMeditationConcepts).toHaveLength(6);
  });

  it('allMeditationConcepts contains all individual concepts', () => {
    const ids = allMeditationConcepts.map(c => c.id);
    expect(ids).toContain('mb-med-vipassana');
    expect(ids).toContain('mb-med-samatha');
    expect(ids).toContain('mb-med-zazen');
    expect(ids).toContain('mb-med-body-scan');
    expect(ids).toContain('mb-med-kinhin');
    expect(ids).toContain('mb-med-metta');
  });

  // ─── Scientific citations in vipassana ────────────────────────────────────

  it('vipassana description mentions Kabat-Zinn', () => {
    expect(mindfulnessVipassana.description).toMatch(/Kabat-Zinn/);
  });

  it('vipassana description mentions MBSR', () => {
    expect(mindfulnessVipassana.description).toMatch(/MBSR/);
  });

  it('vipassana description mentions cortisol or gray matter', () => {
    expect(mindfulnessVipassana.description).toMatch(/cortisol|gray matter/i);
  });

  it('vipassana description mentions 1979 (MBSR founding year)', () => {
    expect(mindfulnessVipassana.description).toMatch(/1979/);
  });

  // ─── Cultural lineage in each concept ─────────────────────────────────────

  it('vipassana mentions Buddhist or Vedic lineage', () => {
    expect(mindfulnessVipassana.description).toMatch(/Buddh|Vedic|Theravada/i);
  });

  it('samatha mentions Buddhist tradition', () => {
    expect(concentrationSamatha.description).toMatch(/Buddh|Buddha|Pali|Sanskrit/i);
  });

  it('zazen mentions Zen tradition and Suzuki', () => {
    expect(zazen.description).toMatch(/Zen/);
    expect(zazen.description).toMatch(/Suzuki/);
  });

  it('body scan mentions MBSR or Kabat-Zinn', () => {
    expect(bodyScan.description).toMatch(/MBSR|Kabat-Zinn/);
  });

  it('kinhin mentions Zen tradition', () => {
    expect(walkingMeditationKinhin.description).toMatch(/Zen/);
  });

  it('metta mentions Fredrickson or Salzberg', () => {
    expect(lovingKindnessMetta.description).toMatch(/Fredrickson|Salzberg/);
  });

  // ─── Cross-references between meditation and breath ───────────────────────

  it('vipassana cross-references breath concepts', () => {
    const breathRefs = mindfulnessVipassana.relationships.filter(
      r => r.targetId.startsWith('mb-breath-'),
    );
    expect(breathRefs.length).toBeGreaterThanOrEqual(1);
  });

  it('samatha cross-references breath concepts', () => {
    const breathRefs = concentrationSamatha.relationships.filter(
      r => r.targetId.startsWith('mb-breath-'),
    );
    expect(breathRefs.length).toBeGreaterThanOrEqual(1);
  });

  it('meditation concepts cross-reference each other', () => {
    const medRefs = mindfulnessVipassana.relationships.filter(
      r => r.targetId.startsWith('mb-med-'),
    );
    expect(medRefs.length).toBeGreaterThanOrEqual(1);
  });

  // ─── Zazen specific content ───────────────────────────────────────────────

  it('zazen mentions shikantaza (just sitting)', () => {
    expect(zazen.description).toMatch(/[Ss]hikantaza/);
  });

  it('zazen mentions Beginner\'s Mind', () => {
    expect(zazen.description).toMatch(/Beginner.*Mind/i);
  });

  // ─── Metta specific content ───────────────────────────────────────────────

  it('metta includes the traditional phrases', () => {
    expect(lovingKindnessMetta.description).toMatch(/May I be happy/);
  });

  it('metta mentions positive emotions research', () => {
    expect(lovingKindnessMetta.description).toMatch(/positive emotions/i);
  });
});

// ─── Try Session Tests ────────────────────────────────────────────────────

describe('Your First Five Minutes Try Session', () => {

  it('has valid TrySessionDefinition structure', () => {
    expect(firstFiveMinutes.id).toBe('mb-try-first-five-minutes');
    expect(firstFiveMinutes.title).toBe('Your First Five Minutes');
    expect(firstFiveMinutes.description).toBeTruthy();
    expect(firstFiveMinutes.steps).toBeInstanceOf(Array);
    expect(firstFiveMinutes.prerequisites).toBeInstanceOf(Array);
  });

  it('has at least 3 steps', () => {
    expect(firstFiveMinutes.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('has exactly 5 steps', () => {
    expect(firstFiveMinutes.steps).toHaveLength(5);
  });

  it('has estimated duration of 5 minutes', () => {
    expect(firstFiveMinutes.estimatedMinutes).toBe(5);
  });

  it('has no prerequisites (zero assumed knowledge)', () => {
    expect(firstFiveMinutes.prerequisites).toHaveLength(0);
  });

  it('no step uses jargon or assumes prior knowledge', () => {
    const jargonTerms = [
      /\bpranayama\b/i,
      /\bvipassana\b/i,
      /\bsamatha\b/i,
      /\bchakra\b/i,
      /\bqi\b/i,
      /\basana\b/i,
      /\bmudra\b/i,
      /\bmantra\b/i,
      /\bparasympathetic\b/i,
      /\bvagal\b/i,
      /\bHRV\b/i,
    ];
    for (const step of firstFiveMinutes.steps) {
      for (const term of jargonTerms) {
        expect(
          term.test(step.instruction),
          `Step "${step.instruction.slice(0, 40)}..." should not use jargon: ${term}`,
        ).toBe(false);
      }
    }
  });

  it('each step has clear instruction and expected outcome', () => {
    for (const step of firstFiveMinutes.steps) {
      expect(step.instruction, 'step should have instruction').toBeTruthy();
      expect(step.expectedOutcome, 'step should have expected outcome').toBeTruthy();
      expect(step.instruction.length).toBeGreaterThan(20);
    }
  });

  it('steps explore breath concepts', () => {
    const allExplored = firstFiveMinutes.steps.flatMap(s => s.conceptsExplored);
    expect(allExplored).toContain('mb-breath-diaphragmatic');
  });

  it('session description does not assume prior knowledge', () => {
    expect(firstFiveMinutes.description).toMatch(/no experience|no equipment|no philosophy/i);
  });
});
