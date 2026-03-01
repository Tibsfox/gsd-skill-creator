import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { CollegeLoader } from '../../../../college/college-loader.js';

import { heatTransferModes } from './heat-transfer-modes.js';
import { specificHeatCapacity } from './specific-heat-capacity.js';
import { altitudeAdjustments } from './altitude-adjustments.js';
import { newtonsCooling } from './newtons-law-of-cooling.js';

const concepts = [
  { name: 'heatTransferModes', concept: heatTransferModes },
  { name: 'specificHeatCapacity', concept: specificHeatCapacity },
  { name: 'altitudeAdjustments', concept: altitudeAdjustments },
  { name: 'newtonsCooling', concept: newtonsCooling },
];

describe('Thermodynamics wing concepts', () => {
  it('each concept exports a valid RosettaConcept with id starting with cook-', () => {
    for (const { name, concept } of concepts) {
      expect(concept.id, `${name} should have an id`).toBeDefined();
      expect(concept.id.startsWith('cook-'), `${name} id should start with cook-`).toBe(true);
      expect(concept.name, `${name} should have a name`).toBeTruthy();
      expect(concept.description, `${name} should have a description`).toBeTruthy();
      expect(concept.panels, `${name} should have panels Map`).toBeInstanceOf(Map);
      expect(concept.relationships, `${name} should have relationships array`).toBeInstanceOf(Array);
    }
  });

  it('each concept has domain culinary-arts', () => {
    for (const { name, concept } of concepts) {
      expect(concept.domain, `${name} domain`).toBe('culinary-arts');
    }
  });

  it('CollegeLoader.loadWing returns 4 concepts for thermodynamics', async () => {
    const loader = new CollegeLoader(join(process.cwd(), '.college', 'departments'));
    const wing = await loader.loadWing('culinary-arts', 'thermodynamics');
    expect(wing.concepts.length).toBe(4);
  });

  it('heat-transfer-modes description mentions conduction, convection, and radiation', () => {
    expect(heatTransferModes.description).toMatch(/conduction/i);
    expect(heatTransferModes.description).toMatch(/convection/i);
    expect(heatTransferModes.description).toMatch(/radiation/i);
  });

  it('altitude-adjustments description includes +25 degrees per 3000ft', () => {
    expect(altitudeAdjustments.description).toMatch(/\+25/);
  });

  it('newtons-law-of-cooling description includes exponential decay formula', () => {
    expect(newtonsCooling.description).toMatch(/e\^\(-kt\)|e\^-kt|e\^{-kt}/);
  });

  it('specific-heat-capacity description mentions water 4.18 J/gC', () => {
    expect(specificHeatCapacity.description).toMatch(/4\.18/);
  });
});
