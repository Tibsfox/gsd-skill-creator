import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { CollegeLoader } from '../../../../college/college-loader.js';

import { dryHeatMethods } from './dry-heat-methods.js';
import { wetHeatMethods } from './wet-heat-methods.js';
import { combinationMethods } from './combination-methods-knife-skills.js';

const concepts = [
  { name: 'dryHeatMethods', concept: dryHeatMethods },
  { name: 'wetHeatMethods', concept: wetHeatMethods },
  { name: 'combinationMethods', concept: combinationMethods },
];

describe('Technique wing concepts', () => {
  it('each concept exports a valid RosettaConcept with id starting with cook-', () => {
    for (const { name, concept } of concepts) {
      expect(concept.id, `${name} id`).toBeDefined();
      expect(concept.id.startsWith('cook-'), `${name} id prefix`).toBe(true);
      expect(concept.name, `${name} name`).toBeTruthy();
      expect(concept.description, `${name} description`).toBeTruthy();
      expect(concept.panels, `${name} panels`).toBeInstanceOf(Map);
      expect(concept.relationships, `${name} relationships`).toBeInstanceOf(Array);
    }
  });

  it('each concept has domain culinary-arts', () => {
    for (const { name, concept } of concepts) {
      expect(concept.domain, `${name} domain`).toBe('culinary-arts');
    }
  });

  it('CollegeLoader.loadWing returns 3 concepts for technique', async () => {
    const loader = new CollegeLoader(join(process.cwd(), '.college', 'departments'));
    const wing = await loader.loadWing('culinary-arts', 'technique');
    expect(wing.concepts.length).toBe(3);
  });

  it('dry-heat-methods description includes temperature ranges', () => {
    const desc = dryHeatMethods.description;
    expect(desc).toMatch(/190.*230.*C|saute/i);
    expect(desc).toMatch(/260.*315.*C|grill/i);
  });

  it('wet-heat-methods description includes poaching, simmering, boiling temps', () => {
    const desc = wetHeatMethods.description;
    expect(desc).toMatch(/71.*82.*C|poach/i);
    expect(desc).toMatch(/85.*96.*C|simmer/i);
    expect(desc).toMatch(/100.*C|boil/i);
  });

  it('combination-methods description mentions braising and/or stewing', () => {
    expect(combinationMethods.description).toMatch(/brais/i);
  });
});
