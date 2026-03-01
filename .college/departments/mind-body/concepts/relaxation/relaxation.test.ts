import { describe, it, expect } from 'vitest';

import { progressiveMuscleRelaxation } from './progressive-muscle-relaxation.js';
import { yogaNidra } from './yoga-nidra.js';
import { myofascialRelease } from './myofascial-release.js';
import { stretchingProtocols } from './stretching-protocols.js';
import { sleepHygiene } from './sleep-hygiene.js';
import { nervousSystem } from './nervous-system.js';
import { allRelaxationConcepts } from './index.js';

const concepts = [
  { name: 'progressiveMuscleRelaxation', concept: progressiveMuscleRelaxation },
  { name: 'yogaNidra', concept: yogaNidra },
  { name: 'myofascialRelease', concept: myofascialRelease },
  { name: 'stretchingProtocols', concept: stretchingProtocols },
  { name: 'sleepHygiene', concept: sleepHygiene },
  { name: 'nervousSystem', concept: nervousSystem },
];

describe('Relaxation wing concepts', () => {
  // ─── Structural Validity ──────────────────────────────────────────────────

  it('each concept exports a valid RosettaConcept with id starting with mb-relax-', () => {
    for (const { name, concept } of concepts) {
      expect(concept.id, `${name} should have an id`).toBeDefined();
      expect(concept.id.startsWith('mb-relax-'), `${name} id should start with mb-relax-`).toBe(true);
      expect(concept.name, `${name} should have a name`).toBeTruthy();
      expect(concept.description, `${name} should have a description`).toBeTruthy();
      expect(concept.panels, `${name} should have panels Map`).toBeInstanceOf(Map);
      expect(concept.relationships, `${name} should have relationships array`).toBeInstanceOf(Array);
    }
  });

  it('each concept has domain mind-body', () => {
    for (const { name, concept } of concepts) {
      expect(concept.domain, `${name} domain`).toBe('mind-body');
    }
  });

  it('each concept has at least 1 relationship', () => {
    for (const { name, concept } of concepts) {
      expect(concept.relationships.length, `${name} should have >= 1 relationship`).toBeGreaterThanOrEqual(1);
    }
  });

  it('allRelaxationConcepts has exactly 6 entries', () => {
    expect(allRelaxationConcepts).toHaveLength(6);
  });

  it('allRelaxationConcepts contains all 6 concept objects', () => {
    for (const { concept } of concepts) {
      expect(allRelaxationConcepts).toContain(concept);
    }
  });

  // ─── Evidence Basis ────────────────────────────────────────────────────────

  it('each concept description contains evidence basis or professional grounding', () => {
    for (const { name, concept } of concepts) {
      const desc = concept.description.toLowerCase();
      const hasEvidence =
        desc.includes('research') ||
        desc.includes('evidence') ||
        desc.includes('clinical') ||
        desc.includes('physiolog') ||
        desc.includes('acsm') ||
        desc.includes('guidelines') ||
        desc.includes('studies') ||
        desc.includes('academy');
      expect(hasEvidence, `${name} should reference evidence basis in description`).toBe(true);
    }
  });

  // ─── PMR-Specific ─────────────────────────────────────────────────────────

  it('PMR mentions Jacobson as originator', () => {
    expect(progressiveMuscleRelaxation.description).toMatch(/Jacobson/);
  });

  it('PMR describes tense-and-release systematic method', () => {
    expect(progressiveMuscleRelaxation.description).toMatch(/tens/i);
    expect(progressiveMuscleRelaxation.description).toMatch(/releas/i);
    expect(progressiveMuscleRelaxation.description).toMatch(/muscle group/i);
  });

  // ─── Yoga Nidra-Specific ──────────────────────────────────────────────────

  it('yoga nidra describes protocol steps: body rotation, breath, visualization, intention', () => {
    const desc = yogaNidra.description.toLowerCase();
    expect(desc).toMatch(/body/);
    expect(desc).toMatch(/breath/);
    expect(desc).toMatch(/visualization/);
    expect(desc).toMatch(/intention/);
  });

  it('yoga nidra includes mixed research caveat for 30-min claim', () => {
    expect(yogaNidra.description).toMatch(/mixed research/i);
  });

  // ─── Myofascial Release-Specific ──────────────────────────────────────────

  it('myofascial release mentions specific desk worker areas', () => {
    const desc = myofascialRelease.description.toLowerCase();
    expect(desc).toMatch(/forearm/);
    expect(desc).toMatch(/upper back/);
    expect(desc).toMatch(/neck/);
    expect(desc).toMatch(/keyboard/);
  });

  it('myofascial release mentions tools: hands, tennis balls, foam rollers', () => {
    const desc = myofascialRelease.description.toLowerCase();
    expect(desc).toMatch(/tennis ball/);
    expect(desc).toMatch(/foam roller/);
    expect(desc).toMatch(/hands/);
  });

  // ─── Stretching-Specific ──────────────────────────────────────────────────

  it('stretching protocols clearly distinguish static, dynamic, and PNF', () => {
    const desc = stretchingProtocols.description.toLowerCase();
    expect(desc).toMatch(/static/);
    expect(desc).toMatch(/dynamic/);
    expect(desc).toMatch(/pnf/);
  });

  it('stretching protocols state never bounce', () => {
    expect(stretchingProtocols.description).toMatch(/never bounce/i);
  });

  it('stretching protocols explain when to use each type', () => {
    const desc = stretchingProtocols.description.toLowerCase();
    expect(desc).toMatch(/after practice/);
    expect(desc).toMatch(/before practice/);
  });

  // ─── Sleep Hygiene-Specific ───────────────────────────────────────────────

  it('sleep hygiene covers blue light, temperature, caffeine, schedule, wind-down', () => {
    const desc = sleepHygiene.description.toLowerCase();
    expect(desc).toMatch(/blue light/);
    expect(desc).toMatch(/temperature|temp/);
    expect(desc).toMatch(/caffeine/);
    expect(desc).toMatch(/schedule|consistent/);
    expect(desc).toMatch(/wind-down/);
  });

  it('sleep hygiene is non-medical practical advice', () => {
    expect(sleepHygiene.description).toMatch(/not medical/i);
    expect(sleepHygiene.description).toMatch(/practical/i);
  });

  // ─── Nervous System-Specific ──────────────────────────────────────────────

  it('nervous system explains sympathetic and parasympathetic', () => {
    const desc = nervousSystem.description.toLowerCase();
    expect(desc).toMatch(/sympathetic/);
    expect(desc).toMatch(/parasympathetic/);
  });

  it('nervous system explains fight-or-flight and rest-and-digest', () => {
    expect(nervousSystem.description).toMatch(/fight or flight/i);
    expect(nervousSystem.description).toMatch(/rest and digest/i);
  });

  it('nervous system uses accessible language grounded in physiology', () => {
    const desc = nervousSystem.description.toLowerCase();
    expect(desc).toMatch(/vagus nerve|vagal/);
    expect(desc).toMatch(/heart rate/);
    // Should NOT contain speculative language
    expect(desc).not.toMatch(/mystical|spiritual energy|chakra/);
  });

  it('nervous system addresses modern sympathetic dominance', () => {
    expect(nervousSystem.description).toMatch(/sympathetic dominance/i);
  });

  // ─── Boundary Tests ───────────────────────────────────────────────────────

  it('no relaxation concept makes medical diagnosis claims', () => {
    for (const { name, concept } of concepts) {
      const desc = concept.description.toLowerCase();
      expect(desc, `${name} should not diagnose`).not.toMatch(/you have|you are suffering|diagnos/);
      expect(desc, `${name} should not prescribe treatment`).not.toMatch(/you must take|prescription|cure for/);
    }
  });

  it('each concept acknowledges limitations of simplified presentation', () => {
    for (const { name, concept } of concepts) {
      const desc = concept.description.toLowerCase();
      const acknowledgesLimits =
        desc.includes('simplified') ||
        desc.includes('overview') ||
        desc.includes('qualified') ||
        desc.includes('professional') ||
        desc.includes('consult') ||
        desc.includes('deeper study') ||
        desc.includes('this summary');
      expect(acknowledgesLimits, `${name} should acknowledge presentation limitations`).toBe(true);
    }
  });
});
