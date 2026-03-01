import { describe, it, expect } from 'vitest';

import { diaphragmaticBreathing } from './diaphragmatic-breathing.js';
import { boxBreathing } from './box-breathing.js';
import { ujjayiBreath } from './ujjayi-breath.js';
import { breathCounting } from './breath-counting.js';
import { martialBreath } from './martial-breath.js';
import { allBreathConcepts } from './index.js';

const concepts = [
  { name: 'diaphragmaticBreathing', concept: diaphragmaticBreathing },
  { name: 'boxBreathing', concept: boxBreathing },
  { name: 'ujjayiBreath', concept: ujjayiBreath },
  { name: 'breathCounting', concept: breathCounting },
  { name: 'martialBreath', concept: martialBreath },
];

describe('Breath wing concepts', () => {

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

  it('all concept IDs start with mb-breath-', () => {
    for (const { name, concept } of concepts) {
      expect(concept.id.startsWith('mb-breath-'), `${name} id "${concept.id}" should start with mb-breath-`).toBe(true);
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

  it('no concept description is empty', () => {
    for (const { name, concept } of concepts) {
      expect(concept.description.length, `${name} description should be non-empty`).toBeGreaterThan(50);
    }
  });

  // ─── Barrel export ────────────────────────────────────────────────────────

  it('allBreathConcepts array has exactly 5 entries', () => {
    expect(allBreathConcepts).toHaveLength(5);
  });

  it('allBreathConcepts contains all individual concepts', () => {
    const ids = allBreathConcepts.map(c => c.id);
    expect(ids).toContain('mb-breath-diaphragmatic');
    expect(ids).toContain('mb-breath-box');
    expect(ids).toContain('mb-breath-ujjayi');
    expect(ids).toContain('mb-breath-counting');
    expect(ids).toContain('mb-breath-martial');
  });

  // ─── Cultural terms present ───────────────────────────────────────────────

  it('diaphragmatic breathing mentions pranayama', () => {
    expect(diaphragmaticBreathing.description).toMatch(/[Pp]ranayama/);
  });

  it('diaphragmatic breathing mentions qigong breathing tradition', () => {
    expect(diaphragmaticBreathing.description).toMatch(/Tu Na|qigong/i);
  });

  it('box breathing mentions pranayama roots', () => {
    expect(boxBreathing.description).toMatch(/[Pp]ranayama/);
  });

  it('ujjayi breath includes Sanskrit terminology', () => {
    expect(ujjayiBreath.description).toMatch(/[Uu]jjayi/);
  });

  it('breath counting mentions Zen tradition (susokukan)', () => {
    expect(breathCounting.description).toMatch(/[Ss]usokukan/);
  });

  it('martial breath mentions kiai and kihap', () => {
    expect(martialBreath.description).toMatch(/[Kk]iai/);
    expect(martialBreath.description).toMatch(/[Kk]ihap/);
  });

  // ─── Physiological mechanism in descriptions ──────────────────────────────

  it('diaphragmatic breathing describes parasympathetic activation', () => {
    expect(diaphragmaticBreathing.description).toMatch(/parasympathetic/i);
  });

  it('diaphragmatic breathing mentions vagal tone or HRV', () => {
    expect(diaphragmaticBreathing.description).toMatch(/vagal|HRV|heart rate variability/i);
  });

  it('box breathing describes CO2 mechanism', () => {
    expect(boxBreathing.description).toMatch(/CO2/);
  });

  it('ujjayi describes throat constriction mechanism', () => {
    expect(ujjayiBreath.description).toMatch(/glottis|throat constriction|constrict/i);
  });

  it('martial breath describes core engagement mechanism', () => {
    expect(martialBreath.description).toMatch(/core|transversus|diaphragm/i);
  });

  // ─── Complex plane positioning ────────────────────────────────────────────

  it('breath concepts are positioned in Q4 (concrete, simple)', () => {
    for (const { name, concept } of concepts) {
      if (concept.complexPlanePosition) {
        expect(concept.complexPlanePosition.real, `${name} real should be positive (concrete)`).toBeGreaterThan(0);
        expect(concept.complexPlanePosition.imaginary, `${name} imaginary should be negative (simple)`).toBeLessThan(0);
      }
    }
  });
});
