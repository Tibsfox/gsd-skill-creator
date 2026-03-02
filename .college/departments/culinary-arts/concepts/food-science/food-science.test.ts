import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { CollegeLoader } from '../../../../college/college-loader.js';

import { maillardReaction } from './maillard-reaction.js';
import { emulsification } from './emulsification.js';
import { proteinDenaturation } from './protein-denaturation.js';
import { starchGelatinization } from './starch-gelatinization.js';
import { caramelization } from './caramelization.js';
import { fermentation } from './fermentation.js';

const concepts = [
  { name: 'maillardReaction', concept: maillardReaction },
  { name: 'emulsification', concept: emulsification },
  { name: 'proteinDenaturation', concept: proteinDenaturation },
  { name: 'starchGelatinization', concept: starchGelatinization },
  { name: 'caramelization', concept: caramelization },
  { name: 'fermentation', concept: fermentation },
];

describe('Food Science wing concepts', () => {
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

  it('each concept has at least 1 relationship', () => {
    for (const { name, concept } of concepts) {
      expect(concept.relationships.length, `${name} should have >= 1 relationship`).toBeGreaterThanOrEqual(1);
    }
  });

  it('CollegeLoader.loadWing returns 6 concepts for food-science', async () => {
    const loader = new CollegeLoader(join(process.cwd(), '.college', 'departments'));
    const wing = await loader.loadWing('culinary-arts', 'food-science');
    expect(wing.concepts.length).toBe(6);
  });

  it('maillard reaction description includes temperature data (140C or 280F)', () => {
    expect(maillardReaction.description).toMatch(/140.*C|280.*F/);
  });

  it('protein denaturation description includes egg white temp range (62-65C)', () => {
    expect(proteinDenaturation.description).toMatch(/62.*65.*C|62-65/);
  });

  it('fermentation description includes yeast temperature range (35-46C)', () => {
    expect(fermentation.description).toMatch(/35.*46.*C|35-46/);
  });

  it('maillard reaction cross-references caramelization', () => {
    const ref = maillardReaction.relationships.find(r => r.targetId === 'cook-caramelization');
    expect(ref).toBeDefined();
  });

  it('protein denaturation cross-references starch gelatinization', () => {
    const ref = proteinDenaturation.relationships.find(r => r.targetId === 'cook-starch-gelatinization');
    expect(ref).toBeDefined();
  });
});
